import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import Modal from '../../shared/components/Modal'
import Button from '../../shared/components/Button'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([])
  const [filteredEmployees, setFilteredEmployees] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [toast, setToast] = useState(null)

  const [formData, setFormData] = useState({
    full_name: '',
    position: '',
    hire_date: '',
    salary: '',
  })

  // Fetch employees
  useEffect(() => {
    fetchEmployees()
  }, [showArchived])

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('is_active', showArchived ? false : true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEmployees(data || [])
      setFilteredEmployees(data || [])
    } catch (error) {
      showToast('Veri yüklenirken hata: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEmployees(employees)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = employees.filter(emp =>
        emp.full_name?.toLowerCase().includes(query) ||
        emp.position?.toLowerCase().includes(query)
      )
      setFilteredEmployees(filtered)
    }
  }, [searchQuery, employees])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const openModal = (employee = null) => {
    if (employee) {
      setEditingEmployee(employee)
      setFormData({
        full_name: employee.full_name || '',
        position: employee.position || '',
        hire_date: employee.hire_date || '',
        salary: employee.salary || '',
      })
    } else {
      setEditingEmployee(null)
      setFormData({
        full_name: '',
        position: '',
        hire_date: '',
        salary: '',
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingEmployee(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation - tüm zorunlu alanları kontrol et
    if (!formData.full_name.trim()) {
      showToast('Ad Soyad bilgisi zorunludur!', 'error')
      return
    }

    if (!formData.position.trim()) {
      showToast('Pozisyon bilgisi zorunludur!', 'error')
      return
    }

    if (!formData.hire_date) {
      showToast('İşe Giriş Tarihi bilgisi zorunludur!', 'error')
      return
    }

    if (!formData.salary || formData.salary === '') {
      showToast('Maaş bilgisi zorunludur!', 'error')
      return
    }

    // Maaş negatif olamaz
    if (parseFloat(formData.salary) <= 0) {
      showToast('Maaş sıfırdan büyük olmalıdır!', 'error')
      return
    }

    try {
      // Clean data
      const cleanedData = {
        full_name: formData.full_name.trim(),
        position: formData.position.trim(),
        hire_date: formData.hire_date,
        salary: parseFloat(formData.salary),
      }

      if (editingEmployee) {
        // Update
        const { error } = await supabase
          .from('employees')
          .update(cleanedData)
          .eq('id', editingEmployee.id)

        if (error) throw error
        showToast('Personel başarıyla güncellendi!')
      } else {
        // Create
        const { error } = await supabase
          .from('employees')
          .insert([cleanedData])

        if (error) throw error
        showToast('Personel başarıyla eklendi!')
      }

      closeModal()
      fetchEmployees()
    } catch (error) {
      showToast('İşlem başarısız: ' + error.message, 'error')
    }
  }

  const handleArchive = async (id) => {
    if (!confirm('Bu personeli arşivlemek istediğinizden emin misiniz? Personel pasif hale gelecek ancak tüm geçmiş kayıtları korunacak.')) return

    try {
      const { error } = await supabase
        .from('employees')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
      showToast('Personel başarıyla arşivlendi!')
      fetchEmployees()
    } catch (error) {
      showToast('Arşivleme işlemi başarısız: ' + error.message, 'error')
    }
  }

  const handleReactivate = async (id) => {
    if (!confirm('Bu personeli tekrar aktif hale getirmek istediğinizden emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('employees')
        .update({ is_active: true })
        .eq('id', id)

      if (error) throw error
      showToast('Personel başarıyla aktifleştirildi!')
      fetchEmployees()
    } catch (error) {
      showToast('Aktifleştirme işlemi başarısız: ' + error.message, 'error')
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
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personel Yönetimi</h1>
          <p className="text-gray-600 mt-1">
            {showArchived ? 'Arşivlenmiş' : 'Aktif'} Personel: {employees.length}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              showArchived
                ? 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {showArchived ? '📋 Aktif Personeli Göster' : '📦 Arşivi Göster'}
          </button>
          <Button onClick={() => openModal()}>
            + Yeni Personel
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Personel ara... (isim veya pozisyon)"
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
          <p className="text-sm text-gray-600 mt-2">
            {filteredEmployees.length} sonuç bulundu
          </p>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Personel Adı</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Birim</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Günlük Ücret</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aylık Maaş</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşe Başlama</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                  {searchQuery ? 'Arama sonucu bulunamadı.' : 'Henüz personel eklenmemiş. Yukarıdaki butona tıklayarak ekleyebilirsiniz.'}
                </td>
              </tr>
            ) : (
              filteredEmployees.map((employee) => {
                const monthlySalary = parseFloat(employee.salary || 0)
                const dailyWage = (monthlySalary / 30).toFixed(2)

                return (
                  <tr key={employee.id} className={`hover:bg-gray-50 ${showArchived ? 'bg-gray-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {employee.full_name}
                        {showArchived && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
                            Arşivlenmiş
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {employee.position || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 font-medium">
                      ₺{parseFloat(dailyWage).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 font-semibold">
                      ₺{monthlySalary.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openModal(employee)}>
                        Düzenle
                      </Button>
                      {showArchived ? (
                        <Button size="sm" variant="primary" onClick={() => handleReactivate(employee.id)}>
                          Aktifleştir
                        </Button>
                      ) : (
                        <Button size="sm" variant="danger" onClick={() => handleArchive(employee.id)}>
                          Arşivle
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingEmployee ? 'Personel Düzenle' : 'Yeni Personel Ekle'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ad Soyad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pozisyon <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                İşe Giriş Tarihi <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maaş <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="1"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Örn: 25000"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={closeModal}>
              İptal
            </Button>
            <Button type="submit">
              {editingEmployee ? 'Güncelle' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
