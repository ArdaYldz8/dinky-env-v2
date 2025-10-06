import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import Modal from '../../shared/components/Modal'
import Button from '../../shared/components/Button'

export default function StockPage() {
  const [stockItems, setStockItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [selectedItemForMovement, setSelectedItemForMovement] = useState(null)
  const [toast, setToast] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 50
  const [categoryFilter, setCategoryFilter] = useState('')
  const [unitFilter, setUnitFilter] = useState('')
  const [categories, setCategories] = useState([])
  const [units, setUnits] = useState([])

  const [formData, setFormData] = useState({
    item_name: '',
    item_code: '',
    category: '',
    subcategory: '',
    barcode: '',
    unit: 'Adet',
    current_stock: 0,
  })

  const [movementData, setMovementData] = useState({
    movement_type: 'Giriş',
    quantity: 0,
    notes: '',
  })

  useEffect(() => {
    // Debounce search query - wait 300ms after user stops typing
    const timeoutId = setTimeout(() => {
      fetchStockItems()
    }, searchQuery ? 300 : 0) // Only debounce when searching

    return () => clearTimeout(timeoutId)
  }, [currentPage, searchQuery, categoryFilter, unitFilter])

  useEffect(() => {
    fetchFilterOptions()
  }, [])

  const fetchFilterOptions = async () => {
    try {
      // Get all categories including null with counts
      const { data: categoryData } = await supabase
        .from('stock_items')
        .select('category')
        .eq('is_active', true)

      const categoryCounts = categoryData?.reduce((acc, item) => {
        const cat = item.category || '(Kategorisiz)'
        acc[cat] = (acc[cat] || 0) + 1
        return acc
      }, {}) || {}

      const categoryList = Object.entries(categoryCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => {
          // Put "(Kategorisiz)" at the end
          if (a.name === '(Kategorisiz)') return 1
          if (b.name === '(Kategorisiz)') return -1
          return a.name.localeCompare(b.name)
        })

      setCategories(categoryList)

      // Get all units including null with counts
      const { data: unitData } = await supabase
        .from('stock_items')
        .select('unit')
        .eq('is_active', true)

      const unitCounts = unitData?.reduce((acc, item) => {
        const unit = item.unit || '(Birimsiz)'
        acc[unit] = (acc[unit] || 0) + 1
        return acc
      }, {}) || {}

      const unitList = Object.entries(unitCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => {
          // Put "(Birimsiz)" at the end
          if (a.name === '(Birimsiz)') return 1
          if (b.name === '(Birimsiz)') return -1
          return a.name.localeCompare(b.name)
        })

      setUnits(unitList)
    } catch (error) {
      console.error('Filtre seçenekleri yüklenemedi:', error)
    }
  }

  const fetchStockItems = async () => {
    try {
      setLoading(true)

      // Start with base query - always filter active items
      let query = supabase
        .from('stock_items')
        .select('*', { count: 'exact' })
        .eq('is_active', true)

      // Apply category filter first (server-side)
      if (categoryFilter) {
        if (categoryFilter === '(Kategorisiz)') {
          query = query.is('category', null)
        } else {
          query = query.eq('category', categoryFilter)
        }
      }

      // Apply unit filter (server-side)
      if (unitFilter) {
        if (unitFilter === '(Birimsiz)') {
          query = query.is('unit', null)
        } else {
          query = query.eq('unit', unitFilter)
        }
      }

      // Execute query with pagination
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      // Apply search filter (client-side for reliability)
      let filteredData = data || []

      if (searchQuery && searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase().trim()
        filteredData = filteredData.filter(item => {
          const itemName = (item.item_name || '').toLowerCase()
          const itemCode = (item.item_code || '').toLowerCase()
          const category = (item.category || '').toLowerCase()
          const subcategory = (item.subcategory || '').toLowerCase()

          return itemName.includes(searchLower) ||
                 itemCode.includes(searchLower) ||
                 category.includes(searchLower) ||
                 subcategory.includes(searchLower)
        })
      }

      setTotalCount(count || 0)
      setStockItems(filteredData)
    } catch (error) {
      showToast('Veri yüklenirken hata: ' + error.message, 'error')
    } finally {
      setLoading(false)
      setIsInitialLoad(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        item_name: item.item_name || '',
        item_code: item.item_code || '',
        category: item.category || '',
        subcategory: item.subcategory || '',
        barcode: item.barcode || '',
        unit: item.unit || 'Adet',
        current_stock: item.current_stock || 0,
      })
    } else {
      setEditingItem(null)
      setFormData({
        item_name: '',
        item_code: '',
        category: '',
        subcategory: '',
        barcode: '',
        unit: 'Adet',
        current_stock: 0,
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingItem(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.item_name.trim()) {
      showToast('Ürün adı zorunludur!', 'error')
      return
    }

    try {
      const cleanedData = {
        item_name: formData.item_name.trim(),
        item_code: formData.item_code.trim() || null,
        category: formData.category || null,
        subcategory: formData.subcategory.trim() || null,
        barcode: formData.barcode.trim() || null,
        unit: formData.unit,
        current_stock: parseFloat(formData.current_stock) || 0,
      }

      if (editingItem) {
        const { error } = await supabase
          .from('stock_items')
          .update(cleanedData)
          .eq('id', editingItem.id)

        if (error) throw error
        showToast('Ürün başarıyla güncellendi!')
      } else {
        const { error } = await supabase
          .from('stock_items')
          .insert([cleanedData])

        if (error) throw error
        showToast('Ürün başarıyla eklendi!')
      }

      closeModal()
      fetchStockItems()
    } catch (error) {
      showToast('İşlem başarısız: ' + error.message, 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('stock_items')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
      showToast('Ürün silindi!')
      fetchStockItems()
    } catch (error) {
      showToast('Silme işlemi başarısız: ' + error.message, 'error')
    }
  }

  const openMovementModal = (item) => {
    setSelectedItemForMovement(item)
    setMovementData({
      movement_type: 'Giriş',
      quantity: 0,
      notes: '',
    })
    setIsMovementModalOpen(true)
  }

  const closeMovementModal = () => {
    setIsMovementModalOpen(false)
    setSelectedItemForMovement(null)
  }

  const handleMovementSubmit = async (e) => {
    e.preventDefault()

    if (!movementData.quantity || movementData.quantity <= 0) {
      showToast('Miktar 0\'dan büyük olmalıdır!', 'error')
      return
    }

    try {
      const quantity = parseFloat(movementData.quantity)
      const newStock = movementData.movement_type === 'Giriş'
        ? selectedItemForMovement.current_stock + quantity
        : selectedItemForMovement.current_stock - quantity

      if (newStock < 0) {
        showToast('Stok negatif olamaz!', 'error')
        return
      }

      // Update stock
      const { error: stockError } = await supabase
        .from('stock_items')
        .update({ current_stock: newStock })
        .eq('id', selectedItemForMovement.id)

      if (stockError) throw stockError

      // Record movement
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert([{
          item_id: selectedItemForMovement.id,
          movement_type: movementData.movement_type,
          quantity: quantity,
          notes: movementData.notes.trim() || null,
        }])

      if (movementError) throw movementError

      showToast('Stok hareketi kaydedildi!')
      closeMovementModal()
      fetchStockItems()
    } catch (error) {
      showToast('İşlem başarısız: ' + error.message, 'error')
    }
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const handleCategoryFilterChange = (e) => {
    setCategoryFilter(e.target.value)
    setCurrentPage(1)
  }

  const handleUnitFilterChange = (e) => {
    setUnitFilter(e.target.value)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setCategoryFilter('')
    setUnitFilter('')
    setCurrentPage(1)
  }

  if (isInitialLoad) {
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📦 Stok Yönetimi</h1>
          <p className="text-gray-600 mt-1">Ürün tanımları ve stok takibi</p>
        </div>
        <Button onClick={() => openModal()}>
          ➕ Yeni Ürün
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Ürün ara... (isim, kod, ana kategori veya alt kategori)"
            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {loading && searchQuery ? (
            <div className="absolute left-4 top-3.5">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
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
          )}
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

        {/* Filter Row */}
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <select
              value={categoryFilter}
              onChange={handleCategoryFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map(category => (
                <option key={category.name} value={category.name}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <select
              value={unitFilter}
              onChange={handleUnitFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Tüm Birimler</option>
              {units.map(unit => (
                <option key={unit.name} value={unit.name}>
                  {unit.name} ({unit.count})
                </option>
              ))}
            </select>
          </div>

          {(searchQuery || categoryFilter || unitFilter) && (
            <Button variant="secondary" onClick={clearFilters}>
              🔄 Temizle
            </Button>
          )}
        </div>

        <p className="text-sm text-gray-600">
          Toplam {totalCount} ürün
          {(searchQuery || categoryFilter || unitFilter) && ' (filtrelenmiş)'}
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ürün Adı</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kod</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Birim</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stok</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alt Kat.</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barkod</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">İşlemler</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stockItems.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                  {searchQuery ? 'Arama sonucu bulunamadı.' : 'Henüz ürün eklenmemiş.'}
                </td>
              </tr>
            ) : (
              stockItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 text-sm font-medium text-gray-900 max-w-xs truncate" title={item.item_name}>
                    {item.item_name}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-600">
                    {item.item_code || '-'}
                  </td>
                  <td className="px-2 py-3 text-xs text-gray-600">
                    {item.unit}
                  </td>
                  <td className="px-3 py-3 text-sm text-right font-semibold text-gray-900 whitespace-nowrap">
                    {parseFloat(item.current_stock || 0).toLocaleString('tr-TR')}
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {item.category ? (
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-medium whitespace-nowrap">
                        {item.category}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-600 max-w-[100px] truncate" title={item.subcategory}>
                    {item.subcategory || '-'}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-600 font-mono max-w-[120px] truncate" title={item.barcode}>
                    {item.barcode || '-'}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex gap-1 justify-center">
                      <Button size="sm" variant="primary" onClick={() => openMovementModal(item)}>
                        🔄
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openModal(item)}>
                        ✏️
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(item.id)}>
                        🗑️
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Önceki
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sonraki
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                  {' '}-{' '}
                  <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span>
                  {' '}arası, toplam{' '}
                  <span className="font-medium">{totalCount}</span> ürün
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Önceki</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {[...Array(totalPages)].map((_, idx) => {
                    const pageNum = idx + 1
                    // Show first page, last page, current page, and pages around current
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                      return <span key={pageNum} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>
                    }
                    return null
                  })}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Sonraki</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ürün Adı <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.item_name}
                onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ürün Kodu
              </label>
              <input
                type="text"
                value={formData.item_code}
                onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ana Kategori
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Seçiniz...</option>
                <option value="VİDA">VİDA</option>
                <option value="BOYA">BOYA</option>
                <option value="ELEKTROD">ELEKTROD</option>
                <option value="TAŞ">TAŞ</option>
                <option value="ELDİVEN">ELDİVEN</option>
                <option value="SİLİKON">SİLİKON</option>
                <option value="TİNER">TİNER</option>
                <option value="HIRDAVAT">HIRDAVAT</option>
                <option value="DİĞER">DİĞER</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alt Kategori
              </label>
              <input
                type="text"
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Opsiyonel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Barkod
              </label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Opsiyonel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Birim <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="Adet">Adet</option>
                <option value="Kg">Kg</option>
                <option value="Metre">Metre</option>
                <option value="M2">M2</option>
                <option value="M3">M3</option>
                <option value="Litre">Litre</option>
                <option value="Paket">Paket</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {editingItem ? 'Mevcut Stok' : 'Başlangıç Stok'}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.current_stock}
                onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={closeModal}>
              İptal
            </Button>
            <Button type="submit">
              {editingItem ? 'Güncelle' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stock Movement Modal */}
      <Modal
        isOpen={isMovementModalOpen}
        onClose={closeMovementModal}
        title={`Stok Hareketi: ${selectedItemForMovement?.item_name}`}
        size="sm"
      >
        <form onSubmit={handleMovementSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              İşlem Türü <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={movementData.movement_type}
              onChange={(e) => setMovementData({ ...movementData, movement_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="Giriş">Giriş (Stok Artışı)</option>
              <option value="Çıkış">Çıkış (Stok Azalışı)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Miktar <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={movementData.quantity}
              onChange={(e) => setMovementData({ ...movementData, quantity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-1">
              Mevcut stok: {selectedItemForMovement?.current_stock} {selectedItemForMovement?.unit}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notlar
            </label>
            <textarea
              value={movementData.notes}
              onChange={(e) => setMovementData({ ...movementData, notes: e.target.value })}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="İşlem notları (opsiyonel)..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={closeMovementModal}>
              İptal
            </Button>
            <Button type="submit" variant="success">
              Kaydet
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
