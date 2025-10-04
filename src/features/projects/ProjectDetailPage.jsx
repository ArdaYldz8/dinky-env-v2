import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { useToast } from '../../shared/hooks'
import { handleSupabaseError } from '../../utils/errorHandler'
import {
  ChevronDown, ChevronRight, Package, ArrowLeft, Edit,
  Calendar, TrendingUp, AlertCircle, CheckCircle2, Clock,
  Plus, Trash2, FileText, Download
} from 'lucide-react'
import Button from '../../shared/components/Button'
import PhaseUpdateModal from './components/PhaseUpdateModal'
import TaskUpdateModal from './components/TaskUpdateModal'
import MaterialsModal from './components/MaterialsModal'
import PhaseCreateModal from './components/PhaseCreateModal'
import TaskCreateModal from './components/TaskCreateModal'
import MaterialManagementModal from './components/MaterialManagementModal'
import TimelineView from './components/TimelineView'
import ProjectFilesModal from './components/ProjectFilesModal'
import { exportProjectToPDF, exportProjectToExcel } from './utils/exportUtils'
import QualityControlPage from '../quality-control/QualityControlPage'

export default function ProjectDetailPage() {
  const { id: projectId } = useParams()
  const navigate = useNavigate()
  const { toast, showSuccess, showError } = useToast()

  const [project, setProject] = useState(null)
  const [phases, setPhases] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedPhases, setExpandedPhases] = useState(new Set())

  // Modal states
  const [phaseModalOpen, setPhaseModalOpen] = useState(false)
  const [phaseCreateModalOpen, setPhaseCreateModalOpen] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [taskCreateModalOpen, setTaskCreateModalOpen] = useState(false)
  const [materialsModalOpen, setMaterialsModalOpen] = useState(false)
  const [materialManagementModalOpen, setMaterialManagementModalOpen] = useState(false)
  const [filesModalOpen, setFilesModalOpen] = useState(false)
  const [selectedPhase, setSelectedPhase] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [viewMode, setViewMode] = useState('list') // 'list' veya 'timeline'
  const [activeTab, setActiveTab] = useState('project') // 'project', 'quality', 'attendance'

  // Attendance data
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [attendanceFilters, setAttendanceFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    loadProjectData()
  }, [projectId])

  useEffect(() => {
    if (activeTab === 'attendance') {
      loadAttendanceRecords()
    }
  }, [activeTab, attendanceFilters])

  async function loadAttendanceRecords() {
    setAttendanceLoading(true)
    try {
      // Get work_location_id for this project
      const { data: locationData, error: locationError } = await supabase
        .from('work_locations')
        .select('id')
        .eq('project_id', projectId)
        .single()

      if (locationError) {
        console.log('No work location found for this project')
        setAttendanceRecords([])
        return
      }

      // Get attendance records (only actual work days, exclude "Gelmedi")
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          id,
          work_date,
          status,
          overtime_hours,
          notes,
          employee_id,
          employees(full_name)
        `)
        .eq('work_location_id', locationData.id)
        .neq('status', 'Gelmedi')
        .gte('work_date', attendanceFilters.startDate)
        .lte('work_date', attendanceFilters.endDate)
        .order('work_date', { ascending: false })

      if (error) throw error
      setAttendanceRecords(data || [])
    } catch (error) {
      console.error('Puantaj kayıtları yüklenirken hata:', error)
      showError('Puantaj kayıtları yüklenemedi')
    } finally {
      setAttendanceLoading(false)
    }
  }

  async function loadProjectData() {
    try {
      setLoading(true)

      // Proje bilgilerini çek
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          customers(company_name),
          employees:project_manager_id(full_name)
        `)
        .eq('id', projectId)
        .single()

      if (projectError) throw projectError

      // Aşamaları ve görevleri çek
      const { data: phasesData, error: phasesError } = await supabase
        .from('project_phases')
        .select(`
          *,
          tasks:project_tasks(
            *,
            assigned_employee:assigned_to(full_name),
            materials_count:task_materials(count)
          )
        `)
        .eq('project_id', projectId)
        .order('order_number')

      if (phasesError) throw phasesError

      setProject(projectData)
      setPhases(phasesData || [])

      // İlk aktif aşamayı otomatik genişlet
      const activePhase = phasesData?.find(p => p.status === 'Başlatıldı' || p.status === 'Devam Ediyor')
      if (activePhase) {
        setExpandedPhases(new Set([activePhase.id]))
      }

    } catch (error) {
      console.error('Proje yüklenirken hata:', error)
      showError(handleSupabaseError(error))
    } finally {
      setLoading(false)
    }
  }

  async function handlePhaseUpdate(phaseId, updates) {
    try {
      const { error } = await supabase
        .from('project_phases')
        .update(updates)
        .eq('id', phaseId)

      if (error) throw error

      showSuccess('Aşama başarıyla güncellendi')
      loadProjectData()
    } catch (error) {
      showError(handleSupabaseError(error))
    }
  }

  async function handleTaskUpdate(taskId, updates) {
    try {
      const { error } = await supabase
        .from('project_tasks')
        .update(updates)
        .eq('id', taskId)

      if (error) throw error

      showSuccess('Görev başarıyla güncellendi')
      loadProjectData()
    } catch (error) {
      showError(handleSupabaseError(error))
    }
  }

  async function handlePhaseCreate(phaseData) {
    try {
      const { error } = await supabase
        .from('project_phases')
        .insert([phaseData])

      if (error) throw error

      showSuccess('Aşama başarıyla eklendi')
      loadProjectData()
    } catch (error) {
      showError(handleSupabaseError(error))
    }
  }

  async function handleTaskCreate(taskData) {
    try {
      const { error } = await supabase
        .from('project_tasks')
        .insert([taskData])

      if (error) throw error

      showSuccess('Görev başarıyla eklendi')
      loadProjectData()
    } catch (error) {
      showError(handleSupabaseError(error))
    }
  }

  async function handlePhaseDelete(phaseId) {
    if (!confirm('Bu aşamayı ve tüm görevlerini silmek istediğinizden emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('project_phases')
        .delete()
        .eq('id', phaseId)

      if (error) throw error

      showSuccess('Aşama başarıyla silindi')
      loadProjectData()
    } catch (error) {
      showError(handleSupabaseError(error))
    }
  }

  async function handleTaskDelete(taskId) {
    if (!confirm('Bu görevi silmek istediğinizden emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('project_tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      showSuccess('Görev başarıyla silindi')
      loadProjectData()
    } catch (error) {
      showError(handleSupabaseError(error))
    }
  }

  function openPhaseModal(phase) {
    setSelectedPhase(phase)
    setPhaseModalOpen(true)
  }

  function openTaskModal(task) {
    setSelectedTask(task)
    setTaskModalOpen(true)
  }

  function openMaterialsModal(task) {
    setSelectedTask(task)
    setMaterialsModalOpen(true)
  }

  function openMaterialManagementModal(task) {
    setSelectedTask(task)
    setMaterialManagementModalOpen(true)
  }

  function openTaskCreateModal(phase) {
    setSelectedPhase(phase)
    setTaskCreateModalOpen(true)
  }

  function togglePhase(phaseId) {
    setExpandedPhases(prev => {
      const newSet = new Set(prev)
      if (newSet.has(phaseId)) {
        newSet.delete(phaseId)
      } else {
        newSet.add(phaseId)
      }
      return newSet
    })
  }

  function getStatusColor(status) {
    const colors = {
      'Tamamlandı': 'bg-green-100 text-green-800',
      'Başlatıldı': 'bg-blue-100 text-blue-800',
      'Devam Ediyor': 'bg-blue-100 text-blue-800',
      'Planlanıyor': 'bg-yellow-100 text-yellow-800',
      'Beklemede': 'bg-orange-100 text-orange-800',
      'İptal Edildi': 'bg-red-100 text-red-800',
      'Atanmadı': 'bg-gray-100 text-gray-800',
      'Atandı': 'bg-blue-50 text-blue-700',
      'Başladı': 'bg-indigo-100 text-indigo-800',
      'Planlandı': 'bg-yellow-100 text-yellow-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  function getProgressColor(progress) {
    if (progress >= 71) return 'bg-green-500'
    if (progress >= 31) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  function calculatePhaseStats(phase) {
    const tasks = phase.tasks || []
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'Tamamlandı').length
    const avgProgress = totalTasks > 0
      ? Math.round(tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / totalTasks)
      : 0

    return { totalTasks, completedTasks, avgProgress }
  }

  function calculateProjectStats() {
    const totalPhases = phases.length
    const completedPhases = phases.filter(p => p.status === 'Tamamlandı').length
    const totalTasks = phases.reduce((sum, p) => sum + (p.tasks?.length || 0), 0)
    const completedTasks = phases.reduce((sum, p) =>
      sum + (p.tasks?.filter(t => t.status === 'Tamamlandı').length || 0), 0)
    const inProgressTasks = phases.reduce((sum, p) =>
      sum + (p.tasks?.filter(t => t.status === 'Devam Ediyor' || t.status === 'Başladı').length || 0), 0)
    const pendingTasks = totalTasks - completedTasks - inProgressTasks

    return {
      totalPhases,
      completedPhases,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks
    }
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

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Proje bulunamadı</div>
      </div>
    )
  }

  const overallProgress = phases.length > 0
    ? Math.round(phases.reduce((sum, p) => sum + (p.progress || 0), 0) / phases.length)
    : 0

  const stats = calculateProjectStats()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white z-50`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Projelere Dön</span>
        </button>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.project_name}</h1>
              {project.description && (
                <p className="text-gray-600 mt-2">{project.description}</p>
              )}
            </div>
            <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${getStatusColor(project.status)}`}>
              {project.status}
            </span>
          </div>

          {/* Proje Bilgileri */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {project.customers && (
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-xs text-gray-500 uppercase">Müşteri</span>
                <p className="font-semibold text-gray-900 mt-1">{project.customers.company_name}</p>
              </div>
            )}
            {project.employees && (
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-xs text-gray-500 uppercase">Proje Yöneticisi</span>
                <p className="font-semibold text-gray-900 mt-1">{project.employees.full_name}</p>
              </div>
            )}
            {project.budget && (
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-xs text-gray-500 uppercase">Bütçe</span>
                <p className="font-semibold text-gray-900 mt-1">₺{project.budget.toLocaleString('tr-TR')}</p>
              </div>
            )}
            {project.planned_start_date && (
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-xs text-gray-500 uppercase">Başlangıç</span>
                <p className="font-semibold text-gray-900 mt-1">
                  {new Date(project.planned_start_date).toLocaleDateString('tr-TR')}
                </p>
              </div>
            )}
          </div>

          {/* İstatistik Kartları */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="text-blue-600" size={20} />
                <span className="text-sm font-medium text-blue-900">Aşamalar</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {stats.completedPhases}/{stats.totalPhases}
              </p>
              <p className="text-xs text-blue-700 mt-1">Tamamlandı</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="text-green-600" size={20} />
                <span className="text-sm font-medium text-green-900">Görevler</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {stats.completedTasks}/{stats.totalTasks}
              </p>
              <p className="text-xs text-green-700 mt-1">Tamamlandı</p>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="text-yellow-600" size={20} />
                <span className="text-sm font-medium text-yellow-900">Devam Eden</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{stats.inProgressTasks}</p>
              <p className="text-xs text-yellow-700 mt-1">Görev</p>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="text-orange-600" size={20} />
                <span className="text-sm font-medium text-orange-900">Bekleyen</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{stats.pendingTasks}</p>
              <p className="text-xs text-orange-700 mt-1">Görev</p>
            </div>
          </div>

          {/* Genel İlerleme */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp size={20} className="text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">Genel İlerleme</span>
              </div>
              <span className="text-lg font-bold text-gray-900">%{overallProgress}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all ${getProgressColor(overallProgress)}`}
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <div className="flex gap-2 px-6">
            <button
              onClick={() => setActiveTab('project')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'project'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Proje Yönetimi
            </button>
            <button
              onClick={() => setActiveTab('quality')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'quality'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Kalite Kontrol
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'attendance'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Personel Çalışma Saatleri
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'project' && (
        <>
          {/* Aşamalar Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-gray-900">Proje Aşamaları</h2>

          {/* Görünüm Değiştirme */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Liste
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-white text-indigo-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Zaman Çizelgesi
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setFilesModalOpen(true)}
          >
            <FileText size={16} className="mr-1" />
            Dosyalar
          </Button>
          <Button
            variant="outline"
            onClick={() => exportProjectToExcel(project, phases)}
          >
            <Download size={16} className="mr-1" />
            Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => exportProjectToPDF(project, phases)}
          >
            <FileText size={16} className="mr-1" />
            PDF
          </Button>
          <Button onClick={() => setPhaseCreateModalOpen(true)}>
            <Plus size={16} className="mr-1" />
            Yeni Aşama Ekle
          </Button>
        </div>
      </div>

      {/* Timeline Görünümü */}
      {viewMode === 'timeline' ? (
        <TimelineView phases={phases} />
      ) : (
        /* Liste Görünümü */
        <div className="space-y-4">
          {phases.map(phase => {
          const isExpanded = expandedPhases.has(phase.id)
          const stats = calculatePhaseStats(phase)

          return (
            <div key={phase.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              {/* Aşama Header */}
              <div className="px-6 py-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white border-b">
                <button
                  onClick={() => togglePhase(phase.id)}
                  className="flex items-center gap-3 flex-1 hover:text-indigo-600 transition-colors"
                >
                  {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-white bg-indigo-600 px-3 py-1 rounded-md">
                      {phase.phase_code}
                    </span>
                    <span className="font-semibold text-gray-900">{phase.phase_name}</span>
                  </div>

                  <span className={`px-3 py-1 rounded-md text-xs font-semibold ${getStatusColor(phase.status)}`}>
                    {phase.status}
                  </span>
                </button>

                <div className="flex items-center gap-4">
                  {stats.totalTasks > 0 && (
                    <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-md">
                      <span className="font-bold text-gray-900">{stats.completedTasks}</span>
                      <span className="text-gray-500"> / {stats.totalTasks}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${getProgressColor(phase.progress)}`}
                        style={{ width: `${phase.progress}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-700 w-12 text-right">
                      %{phase.progress}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        openPhaseModal(phase)
                      }}
                    >
                      <Edit size={14} className="mr-1" />
                      Düzenle
                    </Button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePhaseDelete(phase.id)
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Aşamayı Sil"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Görevler (Expanded) */}
              {isExpanded && (
                <div className="bg-gray-50">
                  {/* Görev Ekleme Butonu */}
                  <div className="px-6 py-3 border-b border-gray-200 bg-white">
                    <Button size="sm" onClick={() => openTaskCreateModal(phase)}>
                      <Plus size={14} className="mr-1" />
                      Görev Ekle
                    </Button>
                  </div>

                  {phase.tasks && phase.tasks.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {phase.tasks.map(task => (
                        <div key={task.id} className="px-6 py-4 hover:bg-white transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-mono text-xs font-semibold text-gray-700 bg-white px-2.5 py-1 rounded-md border border-gray-300">
                                  {task.task_code}
                                </span>
                                <span className="font-medium text-gray-900">{task.task_name}</span>
                                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${getStatusColor(task.status)}`}>
                                  {task.status}
                                </span>
                              </div>

                              {task.product_info && (
                                <p className="text-sm text-gray-600 ml-1 mb-2">{task.product_info}</p>
                              )}

                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                {task.assigned_employee && (
                                  <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                    👤 {task.assigned_employee.full_name}
                                  </span>
                                )}
                                {task.materials_count && task.materials_count[0]?.count > 0 && (
                                  <button
                                    onClick={() => openMaterialsModal(task)}
                                    className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded hover:bg-purple-100 transition-colors"
                                  >
                                    <Package size={14} />
                                    {task.materials_count[0].count} Malzeme
                                  </button>
                                )}
                                <button
                                  onClick={() => openMaterialManagementModal(task)}
                                  className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100 transition-colors"
                                  title="Malzeme Yönetimi"
                                >
                                  <Package size={14} />
                                  Malzeme Yönetimi
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 ml-4">
                              <div className="w-40 bg-gray-200 rounded-full h-2.5">
                                <div
                                  className={`h-2.5 rounded-full transition-all ${getProgressColor(task.progress)}`}
                                  style={{ width: `${task.progress}%` }}
                                />
                              </div>
                              <span className="text-sm font-bold text-gray-700 w-12 text-right">
                                %{task.progress}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openTaskModal(task)}
                              >
                                <Edit size={14} />
                              </Button>
                              <button
                                onClick={() => handleTaskDelete(task.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Görevi Sil"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-6 py-12 text-center text-gray-400">
                      <Package className="mx-auto mb-2" size={48} />
                      <p>Bu aşamada henüz görev yok</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        </div>
      )}

      {phases.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <AlertCircle className="mx-auto mb-4 text-gray-300" size={64} />
          <p className="text-gray-400 text-lg">Bu projede henüz aşama tanımlanmamış</p>
        </div>
      )}

      {/* Modals */}
      <PhaseUpdateModal
        isOpen={phaseModalOpen}
        onClose={() => setPhaseModalOpen(false)}
        phase={selectedPhase}
        onUpdate={handlePhaseUpdate}
      />

      <PhaseCreateModal
        isOpen={phaseCreateModalOpen}
        onClose={() => setPhaseCreateModalOpen(false)}
        projectId={projectId}
        onCreate={handlePhaseCreate}
        lastPhaseOrder={phases.length > 0 ? Math.max(...phases.map(p => p.order_number)) : 0}
      />

      <TaskUpdateModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        task={selectedTask}
        onUpdate={handleTaskUpdate}
      />

      <TaskCreateModal
        isOpen={taskCreateModalOpen}
        onClose={() => setTaskCreateModalOpen(false)}
        phaseId={selectedPhase?.id}
        onCreate={handleTaskCreate}
      />

      <MaterialsModal
        isOpen={materialsModalOpen}
        onClose={() => setMaterialsModalOpen(false)}
        task={selectedTask}
      />

      <MaterialManagementModal
        isOpen={materialManagementModalOpen}
        onClose={() => setMaterialManagementModalOpen(false)}
        task={selectedTask}
      />

      <ProjectFilesModal
        isOpen={filesModalOpen}
        onClose={() => setFilesModalOpen(false)}
        projectId={projectId}
      />
        </>
      )}

      {/* Quality Control Tab */}
      {activeTab === 'quality' && (
        <QualityControlPage projectId={projectId} />
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tarih Aralığı</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  value={attendanceFilters.startDate}
                  onChange={(e) => setAttendanceFilters({ ...attendanceFilters, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  value={attendanceFilters.endDate}
                  onChange={(e) => setAttendanceFilters({ ...attendanceFilters, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={loadAttendanceRecords} className="w-full">
                  🔍 Ara
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          {attendanceRecords.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Toplam Kayıt</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {attendanceRecords.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📋</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Benzersiz Personel</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {new Set(attendanceRecords.map(r => r.employee_id)).size}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">👥</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Toplam Ek Mesai</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {attendanceRecords.reduce((sum, r) => sum + (r.overtime_hours || 0), 0).toFixed(1)} saat
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🕐</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Records Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Çalışma Kayıtları</h3>
            </div>
            {attendanceLoading ? (
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ek Mesai</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Not</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceRecords.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                          Bu projede seçilen tarih aralığında çalışma kaydı bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      attendanceRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(record.work_date).toLocaleDateString('tr-TR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {record.employees?.full_name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              record.status === 'Hazır' ? 'bg-green-100 text-green-800' :
                              record.status === 'İzinli' ? 'bg-yellow-100 text-yellow-800' :
                              record.status === 'Raporlu' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {record.status || 'Hazır'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {record.overtime_hours > 0 ? (
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                {record.overtime_hours} saat
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={record.notes}>
                            {record.notes || '-'}
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
  )
}
