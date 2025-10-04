import { useState, useEffect } from 'react'
import Modal from '../../../shared/components/Modal'
import Button from '../../../shared/components/Button'
import { supabase } from '../../../services/supabase'
import { Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

export default function MaterialsModal({ isOpen, onClose, task }) {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && task) {
      loadMaterials()
    }
  }, [isOpen, task])

  async function loadMaterials() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('task_materials')
        .select('*')
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

  function getMaterialStatus(material) {
    const required = material.required_quantity
    const stock = material.stock_quantity
    const shipped = material.shipped_quantity

    if (shipped >= required) {
      return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Sevk Edildi' }
    }
    if (stock >= required) {
      return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Stokta' }
    }
    return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', label: 'Eksik' }
  }

  function calculateShortage(material) {
    const needed = material.required_quantity - material.shipped_quantity
    const available = material.stock_quantity
    return Math.max(0, needed - available)
  }

  const totalMaterials = materials.length
  const readyMaterials = materials.filter(m => m.shipped_quantity >= m.required_quantity).length
  const missingMaterials = materials.filter(m => calculateShortage(m) > 0).length

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Malzemeler: ${task?.task_name}`} size="xl">
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Özet Kartlar */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Package className="text-blue-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Toplam Malzeme</p>
                  <p className="text-2xl font-bold text-blue-600">{totalMaterials}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Hazır</p>
                  <p className="text-2xl font-bold text-green-600">{readyMaterials}</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-red-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Eksik</p>
                  <p className="text-2xl font-bold text-red-600">{missingMaterials}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Malzeme Listesi */}
          <div className="space-y-3">
            {materials.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="mx-auto mb-2 text-gray-400" size={48} />
                <p>Bu görev için henüz malzeme tanımlanmamış</p>
              </div>
            ) : (
              materials.map((material) => {
                const status = getMaterialStatus(material)
                const shortage = calculateShortage(material)
                const StatusIcon = status.icon

                return (
                  <div
                    key={material.id}
                    className={`${status.bg} rounded-lg p-4 border border-gray-200`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <StatusIcon className={status.color} size={20} />
                          <h4 className="font-medium text-gray-900">{material.material_name}</h4>
                          <span className={`text-xs px-2 py-1 rounded ${status.color} ${status.bg}`}>
                            {status.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Gerekli</p>
                            <p className="font-medium text-gray-900">
                              {material.required_quantity} {material.unit}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Stokta</p>
                            <p className="font-medium text-gray-900">
                              {material.stock_quantity} {material.unit}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Sevk Edilen</p>
                            <p className="font-medium text-gray-900">
                              {material.shipped_quantity} {material.unit}
                            </p>
                          </div>
                          {shortage > 0 && (
                            <div>
                              <p className="text-gray-600">Eksik</p>
                              <p className="font-medium text-red-600">
                                {shortage} {material.unit}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* İlerleme Çubuğu */}
                        <div className="mt-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  material.shipped_quantity >= material.required_quantity
                                    ? 'bg-green-500'
                                    : material.stock_quantity >= material.required_quantity
                                    ? 'bg-blue-500'
                                    : 'bg-red-500'
                                }`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (material.shipped_quantity / material.required_quantity) * 100
                                  )}%`
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 w-12 text-right">
                              {Math.round((material.shipped_quantity / material.required_quantity) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <Button variant="secondary" onClick={onClose}>
              Kapat
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}
