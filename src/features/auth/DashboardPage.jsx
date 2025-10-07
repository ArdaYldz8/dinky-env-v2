import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import Chart from 'react-apexcharts'
import { useUserRole } from '../../hooks/useUserRole'
import { hasAccess } from '../../lib/roles'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { role } = useUserRole()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    activeProjects: 0,
    todayAttendance: 0,
    activeEmployees: 0,
    openIssues: 0
  })
  const [chartData, setChartData] = useState({
    attendanceDates: [],
    attendancePresent: [],
    attendanceAbsent: [],
    projectNames: [],
    projectProgress: []
  })
  const [todayTasks, setTodayTasks] = useState([])
  const [stockMovements, setStockMovements] = useState([])
  const [deadlineWarnings, setDeadlineWarnings] = useState([])
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      setLoading(true)

      const today = new Date().toISOString().split('T')[0]
      const endDate = new Date()
      const startDate30 = new Date()
      startDate30.setDate(endDate.getDate() - 30)
      const next7Days = new Date()
      next7Days.setDate(next7Days.getDate() + 7)

      // Fetch all data in parallel
      const [
        { data: projects },
        { data: attendance },
        { data: attendanceToday },
        { data: attendance30Days },
        { data: stockItems },
        { data: qualityIssues },
        { data: tasks },
        { data: projectPhases },
        { data: stockMovementsData },
        { data: upcomingDeadlines },
        { data: employees }
      ] = await Promise.all([
        supabase.from('projects').select('*').eq('project_type', 'customer_project'),
        supabase.from('attendance_records').select('*'),
        supabase.from('attendance_records').select('*').eq('work_date', today),
        supabase.from('attendance_records').select('*')
          .gte('work_date', startDate30.toISOString().split('T')[0])
          .lte('work_date', endDate.toISOString().split('T')[0]),
        supabase.from('stock_items').select('*'),
        supabase.from('quality_issues').select('*'),
        supabase.from('project_tasks').select('*, project_phases(project_id, projects(project_name))').eq('status', 'Devam Ediyor'),
        supabase.from('project_phases').select('*, projects(project_name)').in('status', ['Başlatıldı', 'Devam Ediyor', 'Planlanıyor']),
        supabase.from('stock_movements').select('*, stock_items(item_name)').order('movement_date', { ascending: false }).limit(5),
        supabase.from('projects').select('*')
          .eq('project_type', 'customer_project')
          .eq('status', 'Aktif')
          .gte('planned_end_date', today)
          .lte('planned_end_date', next7Days.toISOString().split('T')[0]),
        supabase.from('employees').select('*')
      ])

      // Calculate KPI stats
      const activeProjects = projects?.filter(p => p.status === 'Aktif')?.length || 0
      const todayAttendance = attendanceToday?.filter(a => ['Tam Gün', 'Yarım Gün'].includes(a.status))?.length || 0
      const activeEmployees = employees?.filter(e => e.is_active === true)?.length || 0
      const openIssues = qualityIssues?.filter(i => !['approved', 'rejected'].includes(i.status))?.length || 0

      setStats({
        activeProjects,
        todayAttendance,
        activeEmployees,
        openIssues
      })

      // Process attendance trend data
      const dateMap = new Map()
      const dates = []
      for (let i = 29; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        dates.push(dateStr)
        dateMap.set(dateStr, { present: 0, absent: 0 })
      }

      attendance30Days?.forEach(record => {
        const dateStr = record.work_date
        if (dateMap.has(dateStr)) {
          const dayData = dateMap.get(dateStr)
          if (['Tam Gün', 'Yarım Gün'].includes(record.status)) {
            dayData.present++
          } else if (['Yok', 'Gelmedi'].includes(record.status)) {
            dayData.absent++
          }
        }
      })

      const attendanceDates = dates.map(d => {
        const date = new Date(d)
        return `${date.getDate()}/${date.getMonth() + 1}`
      })
      const attendancePresent = dates.map(d => dateMap.get(d).present)
      const attendanceAbsent = dates.map(d => dateMap.get(d).absent)

      // Process project progress data
      const projectProgressMap = new Map()
      projectPhases?.forEach(phase => {
        const projectName = phase.projects?.project_name || 'Proje'
        if (!projectProgressMap.has(projectName)) {
          projectProgressMap.set(projectName, [])
        }
        projectProgressMap.get(projectName).push(phase.progress || 0)
      })

      const projectNames = []
      const projectProgress = []
      projectProgressMap.forEach((progresses, name) => {
        projectNames.push(name)
        const avgProgress = progresses.reduce((a, b) => a + b, 0) / progresses.length
        projectProgress.push(Math.round(avgProgress))
      })

      setChartData({
        attendanceDates,
        attendancePresent,
        attendanceAbsent,
        projectNames: projectNames.slice(0, 8),
        projectProgress: projectProgress.slice(0, 8)
      })

      setTodayTasks(tasks?.slice(0, 8) || [])

      // Process stock movements
      setStockMovements(stockMovementsData || [])

      // Process deadline warnings
      const warnings = upcomingDeadlines?.map(project => {
        const endDate = new Date(project.planned_end_date)
        const daysUntil = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24))
        let urgency = 'warning' // yellow
        if (daysUntil <= 0) urgency = 'danger' // red
        else if (daysUntil <= 3) urgency = 'danger' // red
        else if (daysUntil <= 7) urgency = 'warning' // yellow

        return {
          ...project,
          daysUntil,
          urgency
        }
      })
      setDeadlineWarnings(warnings || [])

      // Generate smart notifications
      const notifs = []

      // Critical stock warnings
      const criticalStockItems = stockItems?.filter(item =>
        item.current_stock <= (item.min_stock || 0) && item.min_stock > 0
      ) || []
      if (criticalStockItems.length > 0) {
        notifs.push({
          type: 'danger',
          icon: 'fas fa-exclamation-triangle',
          title: 'Kritik Stok Uyarısı',
          message: `${criticalStockItems.length} ürün minimum stok seviyesinde veya altında`,
          action: () => navigate('/stock')
        })
      }

      // Incomplete tasks
      const incompleteTasks = tasks?.filter(t => (t.progress || 0) < 100) || []
      if (incompleteTasks.length > 5) {
        notifs.push({
          type: 'warning',
          icon: 'fas fa-tasks',
          title: 'Tamamlanmamış Görevler',
          message: `${incompleteTasks.length} görev devam ediyor`,
          action: () => navigate('/projects')
        })
      }

      // Missing attendance records - only show if user has access to attendance
      if (hasAccess(role, '/attendance')) {
        const totalEmployees = employees?.length || 0
        const recordedToday = attendanceToday?.length || 0
        if (totalEmployees > recordedToday) {
          notifs.push({
            type: 'info',
            icon: 'fas fa-user-clock',
            title: 'Eksik Puantaj Kaydı',
            message: `${totalEmployees - recordedToday} personelin bugünkü puantajı girilmemiş`,
            action: () => navigate('/attendance')
          })
        }
      }

      // Quality issues
      if (openIssues > 0) {
        notifs.push({
          type: 'warning',
          icon: 'fas fa-clipboard-check',
          title: 'Açık Kalite Sorunları',
          message: `${openIssues} kalite sorunu çözüm bekliyor`,
          action: () => navigate('/quality-control')
        })
      }

      setNotifications(notifs)

    } catch (error) {
      console.error('Dashboard verisi yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <i className="fas fa-tachometer-alt"></i> Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">Dinky Metal ERP Kontrol Paneli</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('tr-TR')} <span className="text-green-600 ml-2">● Canlı</span>
          </div>
        </div>
      </div>

      {/* Smart Notifications Panel */}
      {notifications.length > 0 && (
        <div className={`mb-6 transition-all duration-300 ${showNotifications ? 'max-h-96' : 'max-h-12'} overflow-hidden`}>
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg">
            <div
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <div className="flex items-center gap-3 text-white">
                <i className="fas fa-bell text-xl"></i>
                <span className="font-semibold">Bildirimler ({notifications.length})</span>
              </div>
              <i className={`fas fa-chevron-${showNotifications ? 'up' : 'down'} text-white`}></i>
            </div>
            {showNotifications && (
              <div className="p-4 pt-0 space-y-2">
                {notifications.map((notif, idx) => (
                  <div
                    key={idx}
                    onClick={notif.action}
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      notif.type === 'danger' ? 'bg-red-50 hover:bg-red-100' :
                      notif.type === 'warning' ? 'bg-yellow-50 hover:bg-yellow-100' :
                      'bg-blue-50 hover:bg-blue-100'
                    }`}
                  >
                    <i className={`${notif.icon} text-lg mt-0.5 ${
                      notif.type === 'danger' ? 'text-red-600' :
                      notif.type === 'warning' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`}></i>
                    <div className="flex-1">
                      <p className={`font-semibold text-sm ${
                        notif.type === 'danger' ? 'text-red-900' :
                        notif.type === 'warning' ? 'text-yellow-900' :
                        'text-blue-900'
                      }`}>{notif.title}</p>
                      <p className={`text-xs mt-0.5 ${
                        notif.type === 'danger' ? 'text-red-700' :
                        notif.type === 'warning' ? 'text-yellow-700' :
                        'text-blue-700'
                      }`}>{notif.message}</p>
                    </div>
                    <i className={`fas fa-arrow-right text-sm ${
                      notif.type === 'danger' ? 'text-red-600' :
                      notif.type === 'warning' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`}></i>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deadline Warnings */}
      {deadlineWarnings.length > 0 && (
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <i className="fas fa-calendar-exclamation text-orange-600"></i>
              Yaklaşan Proje Teslim Tarihleri
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {deadlineWarnings.map((project) => (
                <div
                  key={project.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border-l-4 ${
                    project.urgency === 'danger' ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    project.urgency === 'danger' ? 'bg-red-100' : 'bg-yellow-100'
                  }`}>
                    <i className={`fas fa-clock text-lg ${
                      project.urgency === 'danger' ? 'text-red-600' : 'text-yellow-600'
                    }`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{project.project_name}</p>
                    <p className={`text-xs font-medium ${
                      project.urgency === 'danger' ? 'text-red-700' : 'text-yellow-700'
                    }`}>
                      {project.daysUntil === 0 ? 'Bugün teslim!' :
                       project.daysUntil < 0 ? `${Math.abs(project.daysUntil)} gün gecikti` :
                       `${project.daysUntil} gün kaldı`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Aktif Projeler */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Aktif Projeler</p>
              <p className="text-3xl font-bold mt-2">{stats.activeProjects}</p>
              <p className="text-blue-100 text-xs mt-1">Devam eden projeler</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <i className="fas fa-project-diagram text-2xl"></i>
            </div>
          </div>
        </div>

        {/* Bugün Çalışan */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Bugün Çalışan</p>
              <p className="text-3xl font-bold mt-2">{stats.todayAttendance}</p>
              <p className="text-green-100 text-xs mt-1">Personel sayısı</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <i className="fas fa-users text-2xl"></i>
            </div>
          </div>
        </div>

        {/* Aktif Personel */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Aktif Personel</p>
              <p className="text-3xl font-bold mt-2">{stats.activeEmployees}</p>
              <p className="text-purple-100 text-xs mt-1">Çalışan sayısı</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <i className="fas fa-users text-2xl"></i>
            </div>
          </div>
        </div>

        {/* Açık Sorunlar */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Açık Sorunlar</p>
              <p className="text-3xl font-bold mt-2">{stats.openIssues}</p>
              <p className="text-red-100 text-xs mt-1">Kalite kontrol</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <i className="fas fa-clipboard-check text-2xl"></i>
            </div>
          </div>
        </div>
      </div>


      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Charts (3/4) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Stock Movements Widget */}
          {stockMovements.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <i className="fas fa-boxes text-green-600"></i>
                Son Stok Hareketleri
              </h3>
              <div className="space-y-2">
                {stockMovements.map((movement) => (
                  <div key={movement.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      movement.movement_type === 'Giriş' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <i className={`fas ${movement.movement_type === 'Giriş' ? 'fa-arrow-down' : 'fa-arrow-up'} ${
                        movement.movement_type === 'Giriş' ? 'text-green-600' : 'text-red-600'
                      }`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{movement.stock_items?.item_name || 'Ürün'}</p>
                      <p className="text-xs text-gray-500">
                        {movement.movement_type} • {movement.quantity} adet
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {new Date(movement.movement_date).toLocaleDateString('tr-TR')}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(movement.movement_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attendance Trend Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fas fa-chart-line text-blue-600"></i>
              Son 30 Günlük Personel Devam Trendi
            </h3>
            <Chart
              options={{
                chart: {
                  type: 'line',
                  height: 300,
                  toolbar: { show: false },
                  animations: { enabled: true, easing: 'easeinout', speed: 800 }
                },
                colors: ['#28a745', '#dc3545'],
                stroke: { curve: 'smooth', width: 3 },
                markers: { size: 4, hover: { size: 6 } },
                xaxis: {
                  categories: chartData.attendanceDates,
                  labels: { style: { fontSize: '11px' } }
                },
                yaxis: {
                  title: { text: 'Personel Sayısı' },
                  labels: { formatter: (val) => Math.round(val) }
                },
                grid: { borderColor: '#e9ecef', strokeDashArray: 5 },
                legend: { position: 'top', horizontalAlign: 'right' },
                tooltip: {
                  theme: 'light',
                  y: { formatter: (val) => val + ' kişi' }
                }
              }}
              series={[
                { name: 'Devam Eden', data: chartData.attendancePresent },
                { name: 'Devam Etmeyen', data: chartData.attendanceAbsent }
              ]}
              type="line"
              height={300}
            />
          </div>

        </div>

        {/* Right Column - Tasks (1/4) */}
        <div className="lg:col-span-1">
          {/* Today's Tasks */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fas fa-clipboard-list text-indigo-600"></i>
              Devam Eden Görevler
            </h3>
            {todayTasks.length > 0 ? (
              <div className="space-y-3">
                {todayTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{task.task_name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {task.project_phases?.projects?.project_name || 'Proje'}
                      </p>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${task.progress || 0}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{task.progress || 0}% tamamlandı</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <i className="fas fa-check-circle text-3xl mb-2"></i>
                <p className="text-sm">Devam eden görev yok</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
