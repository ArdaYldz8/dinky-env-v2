import { useState, useEffect } from 'react'
import Modal from '../../../shared/components/Modal'
import Button from '../../../shared/components/Button'
import { supabase } from '../../../services/supabase'
import { Package, AlertTriangle, CheckCircle, Plus, Edit, Trash2 } from 'lucide-react'

export default function MaterialManagementModal({ isOpen, onClose, task }) {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [stockItems, setStockItems] = useState([])
  const [selectedStockItem, setSelectedStockItem] = useState(null)

  const [formData, setFormData] = useState({
    stock_item_id: '',
    material_name: '',
    required_quantity: '',
    shipped_quantity: '',
    unit: 'ADET',
    status: 'Planlandı'
  })

  useEffect(() => {
    if (isOpen && task) {
      loadMaterials()
      loadStockItems()
    }
  }, [isOpen, task])

  async function loadStockItems() {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .select('id, item_name, item_code, unit, current_stock, category')
        .eq('is_active', true)
        .order('item_name')

      if (error) throw error
      setStockItems(data || [])
    } catch (error) {
      console.error('Stok kalemleri yüklenirken hata:', error)
    }
  }

  async function loadMaterials() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('task_materials')
        .select(`
          *,
          stock_items(item_name, item_code, current_stock, unit)
        `)
        .eq('task_id', task.id)
        .order('material_name')

      if (error) throw error
      setMaterials(data || [])
    } catch (error) {
      console.error('Malzemeler yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      stock_item_id: '',
      material_name: '',
      required_quantity: '',
      shipped_quantity: '',
      unit: 'ADET',
      status: 'Planlandı'
    })
    setSelectedStockItem(null)
    setEditingMaterial(null)
    setShowForm(false)
  }

  function handleStockItemSelect(stockItemId) {
    const item = stockItems.find(s => s.id === stockItemId)
    if (item) {
      setSelectedStockItem(item)
      setFormData({
        ...formData,
        stock_item_id: item.id,
        material_name: item.item_name,
        unit: item.unit
      })
    }
  }

  function openCreateForm() {
    resetForm()
    setShowForm(true)
  }

  function openEditForm(material) {
    setEditingMaterial(material)

    // Find stock item if exists
    const stockItem = stockItems.find(s => s.id === material.stock_item_id)
    setSelectedStockItem(stockItem || null)

    setFormData({
      stock_item_id: material.stock_item_id || '',
      material_name: material.material_name,
      required_quantity: material.required_quantity,
      shipped_quantity: material.shipped_quantity,
      unit: material.unit,
      status: material.status
    })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    // Check if shipped quantity exceeds stock
    if (selectedStockItem) {
      const shippedQty = parseFloat(formData.shipped_quantity) || 0
      const currentStock = selectedStockItem.current_stock || 0

      if (shippedQty > currentStock) {
        alert(`Sevk edilen miktar (${shippedQty}) mevcut stoktan (${currentStock}) fazla olamaz!`)
        return
      }
    }

    try {
      const materialData = {
        task_id: task.id,
        stock_item_id: formData.stock_item_id || null,
        material_name: formData.material_name,
        required_quantity: parseFloat(formData.required_quantity),
        shipped_quantity: parseFloat(formData.shipped_quantity) || 0,
        unit: formData.unit,
        status: formData.status
      }

      if (editingMaterial) {
        // Calculate stock difference for update
        const oldShipped = editingMaterial.shipped_quantity || 0
        const newShipped = materialData.shipped_quantity
        const stockDifference = newShipped - oldShipped

        // Update material
        const { error } = await supabase
          .from('task_materials')
          .update(materialData)
          .eq('id', editingMaterial.id)

        if (error) throw error

        // Update stock if there's a difference and stock_item_id exists
        if (stockDifference !== 0 && formData.stock_item_id) {
          const { error: stockError } = await supabase
            .from('stock_items')
            .update({
              current_stock: supabase.raw(`current_stock - ${stockDifference}`)
            })
            .eq('id', formData.stock_item_id)

          if (stockError) throw stockError
        }
      } else {
        // New material - insert
        const { error } = await supabase
          .from('task_materials')
          .insert([materialData])

        if (error) throw error

        // Decrease stock if shipped quantity > 0
        if (materialData.shipped_quantity > 0 && formData.stock_item_id) {
          const { error: stockError } = await supabase
            .from('stock_items')
            .update({
              current_stock: supabase.raw(`current_stock - ${materialData.shipped_quantity}`)
            })
            .eq('id', formData.stock_item_id)

          if (stockError) throw stockError
        }
      }

      await loadMaterials()
      await loadStockItems() // Refresh stock items to show updated quantities
      resetForm()
    } catch (error) {
      console.error('Malzeme kaydedilirken hata:', error)
      alert('Hata: ' + error.message)
    }
  }

  async function handleDelete(materialId) {
    if (!confirm('Bu malzemeyi silmek istediğinizden emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('task_materials')
        .delete()
        .eq('id', materialId)

      if (error) throw error

      await loadMaterials()
    } catch (error) {
      console.error('Malzeme silinirken hata:', error)
      alert('Hata: ' + error.message)
    }
  }

  function getMaterialStatus(material) {
    const required = material.required_quantity
    const shipped = material.shipped_quantity || 0

    if (shipped >= required) {
      return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' }
    }
    return { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50' }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Malzeme Yönetimi: ${task?.task_name}`} size="xl">
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Form */}
          {showForm ? (
            <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 rounded-lg p-4 border-2 border-indigo-200">
              <h3 className="font-semibold text-gray-900 mb-3">
                {editingMaterial ? 'Malzeme Düzenle' : 'Yeni Malzeme Ekle'}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stok Kaleminden Seç
                  </label>
                  <select
                    value={formData.stock_item_id}
                    onChange={(e) => handleStockItemSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Manuel Giriş (Stok Dışı)</option>
                    {stockItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.item_name} {item.item_code && `(${item.item_code})`} - Stok: {item.current_stock} {item.unit}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Stoktan malzeme seçerseniz, sevk işleminde otomatik stok düşer
                  </p>
                </div>

                {selectedStockItem && (
                  <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex justify-between items-center text-sm">
                      <div>
                        <p className="font-semibold text-blue-900">{selectedStockItem.item_name}</p>
                        <p className="text-blue-700 text-xs">Kategori: {selectedStockItem.category || '-'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-900">{selectedStockItem.current_stock} {selectedStockItem.unit}</p>
                        <p className="text-blue-700 text-xs">Mevcut Stok</p>
                      </div>
                    </div>
                  </div>
                )}

                {!formData.stock_item_id && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Malzeme Adı (Manuel) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.material_name}
                      onChange={(e) => setFormData({ ...formData, material_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Malzeme adını yazın"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gerekli Miktar <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.required_quantity}
                    onChange={(e) => setFormData({ ...formData, required_quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {!formData.stock_item_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Birim</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="ADET">ADET</option>
                      <option value="KG">KG</option>
                      <option value="METRE">METRE</option>
                      <option value="M2">M2</option>
                      <option value="M3">M3</option>
                      <option value="LITRE">LITRE</option>
                      <option value="PAKET">PAKET</option>
                      <option value="KUTU">KUTU</option>
                    </select>
                  </div>
                )}

                {formData.stock_item_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Birim</label>
                    <input
                      type="text"
                      value={formData.unit}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">Stok kaleminden otomatik alınır</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sevk Edilen Miktar
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.shipped_quantity}
                    onChange={(e) => setFormData({ ...formData, shipped_quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="0"
                  />
                  {selectedStockItem && formData.shipped_quantity > 0 && (
                    <p className={`text-xs mt-1 ${
                      parseFloat(formData.shipped_quantity) > selectedStockItem.current_stock
                        ? 'text-red-600 font-semibold'
                        : 'text-green-600'
                    }`}>
                      {parseFloat(formData.shipped_quantity) > selectedStockItem.current_stock
                        ? `⚠️ Stok yetersiz! (Mevcut: ${selectedStockItem.current_stock})`
                        : `✓ Sevk sonrası kalan: ${selectedStockItem.current_stock - parseFloat(formData.shipped_quantity)}`
                      }
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Planlandı">Planlandı</option>
                    <option value="Sipariş Verildi">Sipariş Verildi</option>
                    <option value="Stokta">Stokta</option>
                    <option value="Sevk Edildi">Sevk Edildi</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="secondary" onClick={resetForm}>
                  İptal
                </Button>
                <Button type="submit">
                  {editingMaterial ? 'Güncelle' : 'Ekle'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="mb-4">
              <Button onClick={openCreateForm}>
                <Plus size={16} className="mr-1" />
                Yeni Malzeme Ekle
              </Button>
            </div>
          )}

          {/* Malzeme Listesi */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {materials.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="mx-auto mb-2 text-gray-400" size={48} />
                <p>Bu görev için henüz malzeme eklenmemiş</p>
              </div>
            ) : (
              materials.map((material) => {
                const status = getMaterialStatus(material)
                const StatusIcon = status.icon
                const shortage = Math.max(0, material.required_quantity - material.shipped_quantity - material.stock_quantity)

                return (
                  <div
                    key={material.id}
                    className={`${status.bg} rounded-lg p-3 border ${
                      material.shipped_quantity >= material.required_quantity
                        ? 'border-green-200'
                        : 'border-yellow-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <StatusIcon className={status.color} size={18} />
                          <h4 className="font-medium text-gray-900">{material.material_name}</h4>
                          {material.stock_item_id && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              Stoktan
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-gray-600 text-xs">Gerekli</p>
                            <p className="font-semibold text-gray-900">
                              {material.required_quantity} {material.unit}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs">Sevk Edilen</p>
                            <p className="font-semibold text-gray-900">
                              {material.shipped_quantity || 0} {material.unit}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs">Kalan</p>
                            <p className={`font-semibold ${
                              material.shipped_quantity >= material.required_quantity
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}>
                              {material.required_quantity - (material.shipped_quantity || 0)} {material.unit}
                            </p>
                          </div>
                        </div>

                        {material.stock_items && (
                          <div className="mt-2 text-xs text-blue-600 bg-blue-50 rounded px-2 py-1 inline-block">
                            📦 Stok: {material.stock_items.item_name} ({material.stock_items.current_stock} {material.stock_items.unit})
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => openEditForm(material)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(material.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button variant="secondary" onClick={onClose}>
              Kapat
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}
