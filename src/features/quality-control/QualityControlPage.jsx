import { useState, useEffect } from 'react'
import { Plus, RefreshCw, Filter, AlertCircle } from 'lucide-react'
import { supabase } from '../../services/supabase'
import Button from '../../shared/components/Button'
import CreateIssueModal from './components/CreateIssueModal'
import QualityIssueCard from './components/QualityIssueCard'
import QualityIssueModal from './components/QualityIssueModal'
import { qualityControlService } from '../../services/qualityControlService'
import { useToast } from '../../shared/hooks'

export default function QualityControlPage({ projectId = null }) {
  const { showError } = useToast()
  const [issues, setIssues] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(projectId)
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    dateFrom: '',
    dateTo: ''
  })

  useEffect(() => {
    if (!projectId) {
      loadProjects()
    }
    loadData()
  }, [projectId, selectedProjectId, filters])

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, project_name')
        .eq('project_type', 'customer_project')
        .order('project_name')

      if (error) throw error
      setProjects(data || [])
      if (data && data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0].id)
      }
    } catch (error) {
      console.error('Load projects error:', error)
    }
  }

  const loadData = async () => {
    const activeProjectId = projectId || selectedProjectId
    if (!activeProjectId) return

    setLoading(true)
    try {
      const filterParams = { ...filters }
      filterParams.project_id = activeProjectId

      const [issuesResult, statsResult] = await Promise.all([
        qualityControlService.getIssues(filterParams),
        qualityControlService.getDashboardStats(activeProjectId)
      ])

      if (issuesResult.success) {
        setIssues(issuesResult.data)
      }
      if (statsResult.success) {
        setStats(statsResult.data)
      }
    } catch (error) {
      console.error('Load data error:', error)
      showError('Veriler yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      dateFrom: '',
      dateTo: ''
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Kalite Kontrol</h1>
            <p className="text-gray-600 mt-1">
              {projectId ? 'Proje kalite kontrol hatalarını yönetin' : 'Proje bazlı kalite kontrol hatalarını yönetin'}
            </p>
          </div>

          {/* Project Selector - only show when not in project detail page */}
          {!projectId && projects.length > 0 && (
            <div className="flex-1 mx-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proje Seçin
              </label>
              <select
                value={selectedProjectId || ''}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.project_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={loadData}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Yenile
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              icon={<Plus className="w-4 h-4" />}
              disabled={!projectId && !selectedProjectId}
            >
              Yeni Hata Bildirimi
            </Button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
              <div className="text-sm text-blue-700">Toplam Hata</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-900">{stats.open}</div>
              <div className="text-sm text-yellow-700">Açık Hatalar</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-900">{stats.today}</div>
              <div className="text-sm text-green-700">Bugünkü</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-900">{stats.avgFixTime}</div>
              <div className="text-sm text-purple-700">Ort. Çözüm (dk)</div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tüm Durumlar</option>
            <option value="reported">Bildirildi</option>
            <option value="assigned">Atandı</option>
            <option value="in_progress">Devam Ediyor</option>
            <option value="fixed">Düzeltildi</option>
            <option value="review">İncelemede</option>
            <option value="approved">Onaylandı</option>
            <option value="rejected">Reddedildi</option>
          </select>

          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tüm Öncelikler</option>
            <option value="low">Düşük</option>
            <option value="medium">Orta</option>
            <option value="high">Yüksek</option>
            <option value="critical">Kritik</option>
          </select>

          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="Başlangıç"
          />

          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="Bitiş"
          />

          {(filters.status || filters.priority || filters.dateFrom || filters.dateTo) && (
            <Button variant="secondary" onClick={clearFilters}>
              Filtreleri Temizle
            </Button>
          )}
        </div>
      </div>

      {/* Issues Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : issues.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz hata kaydı yok</h3>
          <p className="text-gray-600 mb-4">
            İlk kalite kontrol hatasını bildirmek için "Yeni Hata Bildirimi" butonuna tıklayın
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            Yeni Hata Bildirimi
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {issues.map((issue) => (
            <QualityIssueCard
              key={issue.id}
              issue={issue}
              onClick={(issue) => setSelectedIssue(issue.id)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateIssueModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        projectId={projectId || selectedProjectId}
        onSuccess={loadData}
      />

      {selectedIssue && (
        <QualityIssueModal
          isOpen={!!selectedIssue}
          onClose={() => setSelectedIssue(null)}
          issueId={selectedIssue}
          onUpdate={loadData}
        />
      )}
    </div>
  )
}
