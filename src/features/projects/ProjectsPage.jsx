import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import Modal from '../../shared/components/Modal'
import Button from '../../shared/components/Button'
import { useToast } from '../../shared/hooks'
import { handleSupabaseError } from '../../utils/errorHandler'
import { Eye } from 'lucide-react'

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [customers, setCustomers] = useState([])
  const [employees, setEmployees] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [projectTypeFilter, setProjectTypeFilter] = useState('all') // customer_project, internal_location, all
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const { toast, showSuccess, showError } = useToast()

  const [formData, setFormData] = useState({
    project_name: '',
    customer_id: '',
    project_manager_id: '',
    status: 'Aktif',
    project_type: 'customer_project',
    planned_start_date: '',
    planned_end_date: '',
    actual_start_date: '',
    actual_end_date: '',
    budget: '',
    description: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch projects with relations
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          customers(company_name),
          employees!projects_project_manager_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })

      if (projectError) throw projectError

      // Fetch customers for dropdown
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id, company_name')
        .eq('is_active', true)
        .order('company_name')

      if (customerError) throw customerError

      // Fetch employees for dropdown
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name')

      if (employeeError) throw employeeError

      setProjects(projectData || [])
      setFilteredProjects(projectData || [])
      setCustomers(customerData || [])
      setEmployees(employeeData || [])
    } catch (error) {
      showError(handleSupabaseError(error))
    } finally {
      setLoading(false)
    }
  }

  // Search and type filter
  useEffect(() => {
    let filtered = projects

    // Type filter
    if (projectTypeFilter !== 'all') {
      filtered = filtered.filter(p => p.project_type === projectTypeFilter)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (project) =>
          project.project_name?.toLowerCase().includes(query) ||
          project.customers?.company_name?.toLowerCase().includes(query) ||
          project.status?.toLowerCase().includes(query)
      )
    }

    setFilteredProjects(filtered)
  }, [searchQuery, projects, projectTypeFilter])

  const openModal = (project = null) => {
    if (project) {
      setEditingProject(project)
      setFormData({
        project_name: project.project_name || '',
        customer_id: project.customer_id || '',
        project_manager_id: project.project_manager_id || '',
        status: project.status || 'Aktif',
        project_type: project.project_type || 'customer_project',
        planned_start_date: project.planned_start_date || '',
        planned_end_date: project.planned_end_date || '',
        actual_start_date: project.actual_start_date || '',
        actual_end_date: project.actual_end_date || '',
        budget: project.budget || '',
        description: project.description || '',
      })
    } else {
      setEditingProject(null)
      setFormData({
        project_name: '',
        customer_id: '',
        project_manager_id: '',
        status: 'Aktif',
        project_type: 'customer_project',
        planned_start_date: '',
        planned_end_date: '',
        actual_start_date: '',
        actual_end_date: '',
        budget: '',
        description: '',
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
        project_name: formData.project_name.trim(),
        customer_id: formData.customer_id || null,
        project_manager_id: formData.project_manager_id || null,
        status: formData.status,
        project_type: formData.project_type,
        planned_start_date: formData.planned_start_date || null,
        planned_end_date: formData.planned_end_date || null,
        actual_start_date: formData.actual_start_date || null,
        actual_end_date: formData.actual_end_date || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        description: formData.description.trim() || null,
      }

      if (editingProject) {
        const { error } = await supabase
          .from('projects')
          .update(cleanedData)
          .eq('id', editingProject.id)

        if (error) throw error
        showSuccess('Proje başarıyla güncellendi!')
      } else {
        const { error } = await supabase.from('projects').insert([cleanedData])

        if (error) throw error
        showSuccess('Proje başarıyla eklendi!')
      }

      closeModal()
      fetchData()
    } catch (error) {
      showError(handleSupabaseError(error))
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Aktif':
        return 'bg-green-100 text-green-800'
      case 'Tamamlandı':
        return 'bg-blue-100 text-blue-800'
      case 'Beklemede':
        return 'bg-yellow-100 text-yellow-800'
      case 'İptal':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg ${
            toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
          } text-white`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proje Yönetimi</h1>
          <p className="text-gray-600 mt-1">Toplam {projects.length} proje</p>
        </div>
        <Button onClick={() => openModal()}>+ Yeni Proje</Button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setProjectTypeFilter('customer_project')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              projectTypeFilter === 'customer_project'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Müşteri Projeleri ({projects.filter(p => p.project_type === 'customer_project').length})
          </button>
          <button
            onClick={() => setProjectTypeFilter('internal_location')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              projectTypeFilter === 'internal_location'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            İç Lokasyonlar ({projects.filter(p => p.project_type === 'internal_location').length})
          </button>
          <button
            onClick={() => setProjectTypeFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              projectTypeFilter === 'all'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tümü ({projects.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Proje ara... (proje adı, müşteri, durum)"
            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <svg
            className="absolute left-4 top-3.5 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-600 mt-2">{filteredProjects.length} sonuç bulundu</p>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proje Adı</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Müşteri</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proje Müdürü</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarihler</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bütçe</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProjects.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                  {searchQuery
                    ? 'Arama sonucu bulunamadı.'
                    : 'Henüz proje eklenmemiş. Yukarıdaki butona tıklayarak ekleyebilirsiniz.'}
                </td>
              </tr>
            ) : (
              filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{project.project_name}</div>
                    {project.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">{project.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {project.customers?.company_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {project.employees?.full_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>
                      Planlanan:{' '}
                      {project.planned_start_date
                        ? new Date(project.planned_start_date).toLocaleDateString('tr-TR')
                        : '-'}
                    </div>
                    <div>
                      Gerçek:{' '}
                      {project.actual_start_date
                        ? new Date(project.actual_start_date).toLocaleDateString('tr-TR')
                        : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">
                    {project.budget
                      ? `₺${parseFloat(project.budget).toLocaleString('tr-TR', {
                          minimumFractionDigits: 2,
                        })}`
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="text-green-600 hover:text-green-900"
                        title="Detay"
                      >
                        <Eye size={18} />
                      </button>
                      <Button size="sm" variant="outline" onClick={() => openModal(project)}>
                        Düzenle
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingProject ? 'Proje Düzenle' : 'Yeni Proje Ekle'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proje Adı <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.project_name}
                onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri</label>
              <select
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Seçiniz...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proje Müdürü</label>
              <select
                value={formData.project_manager_id}
                onChange={(e) => setFormData({ ...formData, project_manager_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Seçiniz...</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proje Tipi <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.project_type}
                onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="customer_project">Müşteri Projesi</option>
                <option value="internal_location">İç Lokasyon (Puantaj)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {formData.project_type === 'customer_project'
                  ? 'Gerçek müşteri projeleri için'
                  : 'Ofis, depo gibi puantaj lokasyonları için'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="Aktif">Aktif</option>
                <option value="Beklemede">Beklemede</option>
                <option value="Tamamlandı">Tamamlandı</option>
                <option value="İptal">İptal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bütçe (₺)</label>
              <input
                type="number"
                step="0.01"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Planlanan Başlangıç</label>
              <input
                type="date"
                value={formData.planned_start_date}
                onChange={(e) => setFormData({ ...formData, planned_start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Planlanan Bitiş</label>
              <input
                type="date"
                value={formData.planned_end_date}
                onChange={(e) => setFormData({ ...formData, planned_end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gerçek Başlangıç</label>
              <input
                type="date"
                value={formData.actual_start_date}
                onChange={(e) => setFormData({ ...formData, actual_start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gerçek Bitiş</label>
              <input
                type="date"
                value={formData.actual_end_date}
                onChange={(e) => setFormData({ ...formData, actual_end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
              <textarea
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Proje detayları..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={closeModal}>
              İptal
            </Button>
            <Button type="submit">{editingProject ? 'Güncelle' : 'Kaydet'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
