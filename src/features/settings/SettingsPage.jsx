import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import Modal from '../../shared/components/Modal'
import Button from '../../shared/components/Button'
import { useToast } from '../../shared/hooks'
import { handleSupabaseError } from '../../utils/errorHandler'
import { useUserRole } from '../../hooks/useUserRole'
import { CAN_VIEW_ACTIVITY_LOGS, canPerformAction } from '../../lib/roles'

export default function SettingsPage() {
  const { role } = useUserRole()
  const [activeTab, setActiveTab] = useState('projects')
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const { toast, showSuccess, showError } = useToast()

  // Activity tracking state
  const [activityLogs, setActivityLogs] = useState([])
  const [activitySummary, setActivitySummary] = useState({})
  const [activityLoading, setActivityLoading] = useState(false)
  const [activityFilters, setActivityFilters] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    actionType: '',
    tableName: '',
  })

  // Overtime state
  const [overtimeRecords, setOvertimeRecords] = useState([])
  const [overtimeLoading, setOvertimeLoading] = useState(false)
  const [employees, setEmployees] = useState([])
  const [overtimeFilters, setOvertimeFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    employeeId: '',
  })

  // Activity access control
  const [activityPassword, setActivityPassword] = useState('')
  const [activityUnlocked, setActivityUnlocked] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const [formData, setFormData] = useState({
    project_name: '',
    location: '',
    is_active: true,
  })

  useEffect(() => {
    fetchProjects()
    fetchEmployees()
  }, [])

  useEffect(() => {
    if (activeTab === 'activity') {
      // Check role access first
      if (!canPerformAction(role, CAN_VIEW_ACTIVITY_LOGS)) {
        showError('Bu alana erişim yetkiniz yok. Sadece Patron ve Admin erişebilir.')
        setActiveTab('projects')
        return
      }
      // Reset unlock state when switching to activity tab
      setActivityUnlocked(false)
      setActivityPassword('')
      setPasswordError('')
    } else if (activeTab === 'overtime') {
      fetchOvertimeRecords()
    }
  }, [activeTab])

  const handleActivityPasswordSubmit = (e) => {
    e.preventDefault()
    // Simple password check (you can make this more secure)
    const ACTIVITY_PASSWORD = 'dinky2025'

    if (activityPassword === ACTIVITY_PASSWORD) {
      setActivityUnlocked(true)
      setPasswordError('')
      fetchActivityData()
    } else {
      setPasswordError('Hatalı şifre! Lütfen tekrar deneyin.')
      setActivityPassword('')
    }
  }

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('work_locations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      showError('Veri yüklenirken hata: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name')
        .order('full_name')

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error('Personeller yüklenirken hata:', error)
    }
  }

  const fetchActivityData = async () => {
    setActivityLoading(true)
    try {
      const daysDiff = Math.ceil((new Date(activityFilters.endDate) - new Date(activityFilters.startDate)) / (1000 * 60 * 60 * 24)) + 1

      const { data: summaryData, error: summaryError } = await supabase
        .rpc('get_activity_summary', { days_back: daysDiff })

      if (summaryError) throw summaryError
      if (summaryData && summaryData.length > 0) {
        setActivitySummary(summaryData[0])
      }

      const startDateTime = new Date(activityFilters.startDate + 'T00:00:00').toISOString()
      const endDateTime = new Date(activityFilters.endDate + 'T23:59:59').toISOString()

      const { data: logsData, error: logsError } = await supabase
        .rpc('get_activity_logs', {
          limit_count: 50,
          offset_count: 0,
          filter_user_role: null,
          filter_action_type: activityFilters.actionType || null,
          filter_table_name: activityFilters.tableName || null,
          start_date: startDateTime,
          end_date: endDateTime,
        })

      if (logsError) throw logsError
      setActivityLogs(logsData || [])
    } catch (error) {
      showError('Aktivite verileri yüklenirken hata: ' + error.message)
    } finally {
      setActivityLoading(false)
    }
  }

  const fetchOvertimeRecords = async () => {
    setOvertimeLoading(true)
    try {
      let query = supabase
        .from('attendance_records')
        .select(`
          id,
          work_date,
          overtime_hours,
          notes,
          employee_id,
          employees (
            id,
            full_name
          )
        `)
        .gte('work_date', overtimeFilters.startDate)
        .lte('work_date', overtimeFilters.endDate)
        .gt('overtime_hours', 0)
        .order('work_date', { ascending: false })

      if (overtimeFilters.employeeId) {
        query = query.eq('employee_id', overtimeFilters.employeeId)
      }

      const { data, error } = await query

      if (error) throw error
      setOvertimeRecords(data || [])
    } catch (error) {
      showError('Ek mesai kayıtları yüklenirken hata: ' + error.message)
    } finally {
      setOvertimeLoading(false)
    }
  }

  const handleDeleteOvertime = async (id, employeeName, hours) => {
    if (!confirm(`${employeeName} için ${hours} saat ek mesai kaydını silmek istediğinizden emin misiniz?`)) return

    try {
      const { error } = await supabase
        .from('attendance_records')
        .update({ overtime_hours: 0, notes: null })
        .eq('id', id)

      if (error) throw error
      showSuccess('Ek mesai kaydı silindi!')
      fetchOvertimeRecords()
    } catch (error) {
      showError('Silme işlemi başarısız: ' + error.message)
    }
  }


  const openModal = (project = null) => {
    if (project) {
      setEditingProject(project)
      setFormData({
        project_name: project.project_name || '',
        location: project.location || '',
        is_active: project.is_active !== false,
      })
    } else {
      setEditingProject(null)
      setFormData({
        project_name: '',
        location: '',
        is_active: true,
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingProject(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.project_name.trim()) {
      showError('Proje adı zorunludur!')
      return
    }

    try {
      const cleanedData = {
        name: formData.project_name.trim(),
        project_name: formData.project_name.trim(),
        location: formData.location.trim() || null,
        location_type: 'internal',
        is_active: formData.is_active,
      }

      if (editingProject) {
        const { error } = await supabase
          .from('work_locations')
          .update(cleanedData)
          .eq('id', editingProject.id)

        if (error) throw error
        showSuccess('Proje başarıyla güncellendi!')
      } else {
        // Insert into work_locations first
        const { data: workLocationData, error: workLocationError } = await supabase
          .from('work_locations')
          .insert([cleanedData])
          .select()
          .single()

        if (workLocationError) throw workLocationError

        // Also insert into projects table as internal_location
        const projectData = {
          project_name: formData.project_name.trim(),
          project_type: 'internal_location',
          status: 'Aktif',
          description: formData.location.trim() || null,
        }

        const { error: projectError } = await supabase
          .from('projects')
          .insert([projectData])

        if (projectError) throw projectError

        showSuccess('Proje başarıyla eklendi!')
      }

      closeModal()
      fetchProjects()
    } catch (error) {
      showError('İşlem başarısız: ' + error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Bu projeyi silmek istediğinizden emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('work_locations')
        .delete()
        .eq('id', id)

      if (error) throw error
      showSuccess('Proje silindi!')
      fetchProjects()
    } catch (error) {
      showError('Silme işlemi başarısız: ' + error.message)
    }
  }

  const toggleStatus = async (project) => {
    try {
      const { error } = await supabase
        .from('work_locations')
        .update({ is_active: !project.is_active })
        .eq('id', project.id)

      if (error) throw error
      showSuccess(project.is_active ? 'Proje pasif edildi' : 'Proje aktif edildi')
      fetchProjects()
    } catch (error) {
      showError('İşlem başarısız: ' + error.message)
    }
  }

  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('tr-TR')
  }

  const getActionBadgeClass = (action) => {
    const classes = {
      'INSERT': 'bg-green-100 text-green-800',
      'UPDATE': 'bg-blue-100 text-blue-800',
      'DELETE': 'bg-red-100 text-red-800',
    }
    return classes[action] || 'bg-gray-100 text-gray-800'
  }

  const getActionDisplayName = (action) => {
    const names = {
      'INSERT': 'Ekleme',
      'UPDATE': 'Güncelleme',
      'DELETE': 'Silme',
    }
    return names[action] || action
  }

  const getTableDisplayName = (table) => {
    const names = {
      'employees': 'Personeller',
      'attendance': 'Puantaj',
      'attendance_records': 'Puantaj',
      'tasks': 'Görevler',
      'work_locations': 'Proje Lokasyonları',
      'stock_items': 'Stok Ürünleri',
      'stock_movements': 'Stok Hareketleri',
      'projects': 'Projeler',
      'customers': 'Müşteriler',
    }
    return names[table] || table
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">⚙️ Ayarlar</h1>
        <p className="text-gray-600 mt-1">Sistem ayarları ve tanımlamalar</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('projects')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'projects'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📍 Proje Lokasyonları
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'activity'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📊 Aktivite İzleme
          </button>
          <button
            onClick={() => setActiveTab('overtime')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'overtime'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🕐 Ek Mesai Yönetimi
          </button>
        </nav>
      </div>

      {/* Projects Tab Content */}
      {activeTab === 'projects' && (
        <div>
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-blue-900">Proje Lokasyonları Hakkında</h3>
                <p className="mt-1 text-sm text-blue-700">
                  Puantaj sayfasında personellerin hangi şantiye/projede çalıştığını seçebilmek için burada proje lokasyonlarını tanımlayabilirsiniz.
                  Bu alan proje yönetimi modülünden farklıdır.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-4 flex justify-end">
            <Button onClick={() => openModal()}>
              ➕ Yeni Proje Lokasyonu
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proje Adı</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                      Henüz proje lokasyonu eklenmemiş.
                    </td>
                  </tr>
                ) : (
                  projects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {project.project_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleStatus(project)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                            project.is_active
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {project.is_active ? '✓ Aktif' : '✗ Pasif'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => openModal(project)}>
                          ✏️
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(project.id)}>
                          🗑️
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Activity Tab Content */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          {/* Password Protection Gate */}
          {!activityUnlocked ? (
            <div className="bg-white rounded-lg shadow p-8">
              <div className="max-w-md mx-auto text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-lock text-3xl text-red-600"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Güvenlik Doğrulaması</h3>
                <p className="text-gray-600 mb-6">
                  Aktivite İzleme bölümüne erişmek için şifre gereklidir.
                  <br />
                  <span className="text-sm text-red-600">Sadece Patron ve Admin erişebilir.</span>
                </p>
                <form onSubmit={handleActivityPasswordSubmit} className="space-y-4">
                  <div>
                    <input
                      type="password"
                      value={activityPassword}
                      onChange={(e) => setActivityPassword(e.target.value)}
                      placeholder="Şifre"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-center text-lg"
                      autoFocus
                    />
                    {passwordError && (
                      <p className="text-red-600 text-sm mt-2">{passwordError}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-unlock"></i>
                    Erişim Sağla
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* Original Activity Content */
            <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtreler</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  value={activityFilters.startDate}
                  onChange={(e) => {
                    setActivityFilters({ ...activityFilters, startDate: e.target.value })
                    if (activeTab === 'activity') fetchActivityData()
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  value={activityFilters.endDate}
                  onChange={(e) => {
                    setActivityFilters({ ...activityFilters, endDate: e.target.value })
                    if (activeTab === 'activity') fetchActivityData()
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  İşlem Türü
                </label>
                <select
                  value={activityFilters.actionType}
                  onChange={(e) => {
                    setActivityFilters({ ...activityFilters, actionType: e.target.value })
                    if (activeTab === 'activity') fetchActivityData()
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Tümü</option>
                  <option value="INSERT">Ekleme</option>
                  <option value="UPDATE">Güncelleme</option>
                  <option value="DELETE">Silme</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tablo
                </label>
                <select
                  value={activityFilters.tableName}
                  onChange={(e) => {
                    setActivityFilters({ ...activityFilters, tableName: e.target.value })
                    if (activeTab === 'activity') fetchActivityData()
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Tümü</option>
                  <option value="employees">Personeller</option>
                  <option value="attendance_records">Puantaj</option>
                  <option value="tasks">Görevler</option>
                  <option value="stock_items">Stok</option>
                  <option value="work_locations">Proje Lokasyonları</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Toplam Aktivite</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {activitySummary.total_activities || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Bugün</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {activitySummary.today_activities || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📅</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En Aktif Kullanıcı</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1 truncate">
                    {activitySummary.most_active_user || '-'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En Aktif Modül</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1 truncate">
                    {getTableDisplayName(activitySummary.most_active_table) || '-'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📦</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Aktivite Kayıtları</h3>
            </div>
            {activityLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Yükleniyor...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kullanıcı</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlem</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tablo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Açıklama</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activityLogs.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                          Seçilen kriterlere uygun aktivite kaydı bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      activityLogs.map((log, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDateTime(log.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {log.user_name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionBadgeClass(log.action_type)}`}>
                              {getActionDisplayName(log.action_type)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {getTableDisplayName(log.table_name)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {log.description}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
            </div>
          )}
        </div>
      )}

      {/* Overtime Tab Content */}
      {activeTab === 'overtime' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtreler</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  value={overtimeFilters.startDate}
                  onChange={(e) => setOvertimeFilters({ ...overtimeFilters, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  value={overtimeFilters.endDate}
                  onChange={(e) => setOvertimeFilters({ ...overtimeFilters, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personel
                </label>
                <select
                  value={overtimeFilters.employeeId}
                  onChange={(e) => setOvertimeFilters({ ...overtimeFilters, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Tüm Personel</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={fetchOvertimeRecords} className="w-full">
                  🔍 Ara
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Ek Mesai Kayıtları</h3>
            </div>
            {overtimeLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Yükleniyor...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Personel</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ek Mesai (Saat)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Not</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {overtimeRecords.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                          Arama yapmak için yukarıdaki filtreleri kullanın.
                        </td>
                      </tr>
                    ) : (
                      overtimeRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(record.work_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {record.employees?.full_name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {record.overtime_hours} saat
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {record.notes || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleDeleteOvertime(
                                record.id,
                                record.employees?.full_name,
                                record.overtime_hours
                              )}
                            >
                              🗑️
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingProject ? 'Proje Lokasyonu Düzenle' : 'Yeni Proje Lokasyonu Ekle'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proje Adı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.project_name}
              onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Örn: H-KURU Projesi"
            />
          </div>


          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              Aktif
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={closeModal}>
              İptal
            </Button>
            <Button type="submit">
              {editingProject ? 'Güncelle' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
