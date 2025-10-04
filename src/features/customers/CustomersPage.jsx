import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import Modal from '../../shared/components/Modal'
import Button from '../../shared/components/Button'
import { useToast } from '../../shared/hooks'
import { handleSupabaseError } from '../../utils/errorHandler'

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const { toast, showSuccess, showError } = useToast()

  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    tax_office: '',
    tax_number: '',
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCustomers(data || [])
      setFilteredCustomers(data || [])
    } catch (error) {
      showError(handleSupabaseError(error))
    } finally {
      setLoading(false)
    }
  }

  // Search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = customers.filter(
        (customer) =>
          customer.company_name?.toLowerCase().includes(query) ||
          customer.contact_person?.toLowerCase().includes(query) ||
          customer.email?.toLowerCase().includes(query) ||
          customer.phone?.toLowerCase().includes(query) ||
          customer.tax_number?.toLowerCase().includes(query)
      )
      setFilteredCustomers(filtered)
    }
  }, [searchQuery, customers])

  const openModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer)
      setFormData({
        company_name: customer.company_name || '',
        contact_person: customer.contact_person || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        tax_office: customer.tax_office || '',
        tax_number: customer.tax_number || '',
      })
    } else {
      setEditingCustomer(null)
      setFormData({
        company_name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        tax_office: '',
        tax_number: '',
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingCustomer(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.company_name.trim()) {
      showError('Firma adı zorunludur!')
      return
    }

    try {
      const cleanedData = {
        company_name: formData.company_name.trim(),
        contact_person: formData.contact_person.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        tax_office: formData.tax_office.trim() || null,
        tax_number: formData.tax_number.trim() || null,
      }

      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(cleanedData)
          .eq('id', editingCustomer.id)

        if (error) throw error
        showSuccess('Müşteri başarıyla güncellendi!')
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([cleanedData])

        if (error) throw error
        showSuccess('Müşteri başarıyla eklendi!')
      }

      closeModal()
      fetchCustomers()
    } catch (error) {
      showError(handleSupabaseError(error))
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('customers')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
      showSuccess('Müşteri silindi!')
      fetchCustomers()
    } catch (error) {
      showError(handleSupabaseError(error))
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
          <h1 className="text-2xl font-bold text-gray-900">Müşteri Yönetimi</h1>
          <p className="text-gray-600 mt-1">Toplam {customers.length} müşteri</p>
        </div>
        <Button onClick={() => openModal()}>+ Yeni Müşteri</Button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Müşteri ara... (firma adı, yetkili, e-posta, telefon, vergi no)"
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
          <p className="text-sm text-gray-600 mt-2">{filteredCustomers.length} sonuç bulundu</p>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Firma Adı</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yetkili Kişi</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İletişim</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vergi</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                  {searchQuery
                    ? 'Arama sonucu bulunamadı.'
                    : 'Henüz müşteri eklenmemiş. Yukarıdaki butona tıklayarak ekleyebilirsiniz.'}
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{customer.company_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {customer.contact_person || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{customer.email || '-'}</div>
                    <div className="text-sm text-gray-600">{customer.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{customer.tax_office || '-'}</div>
                    <div className="text-sm text-gray-600 font-mono">{customer.tax_number || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => openModal(customer)}>
                      Düzenle
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(customer.id)}>
                      Sil
                    </Button>
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
        title={editingCustomer ? 'Müşteri Düzenle' : 'Yeni Müşteri Ekle'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Firma Adı <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Yetkili Kişi</label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0555 123 45 67"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="info@firma.com"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
              <textarea
                rows="2"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Firma adresi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vergi Dairesi</label>
              <input
                type="text"
                value={formData.tax_office}
                onChange={(e) => setFormData({ ...formData, tax_office: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Örn: Kadıköy"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vergi No</label>
              <input
                type="text"
                value={formData.tax_number}
                onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="1234567890"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={closeModal}>
              İptal
            </Button>
            <Button type="submit">{editingCustomer ? 'Güncelle' : 'Kaydet'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
