import { useState, useEffect } from 'react'
import Modal from '../../../shared/components/Modal'
import Button from '../../../shared/components/Button'
import { supabase } from '../../../services/supabase'

export default function TaskCreateModal({ isOpen, onClose, phaseId, onCreate }) {
  const [formData, setFormData] = useState({
    task_code: '',
    task_name: '',
    product_info: '',
    product_code: '',
    quantity_info: '',
    meterage_info: '',
    task_type: 'İmalat',
    status: 'Atanmadı',
    progress: 0,
    assigned_to: '',
    planned_start_date: '',
    planned_end_date: '',
    notes: ''
  })
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    loadEmployees()
  }, [])

  async function loadEmployees() {
    const { data } = await supabase
      .from('employees')
      .select('id, full_name')
      .eq('is_active', true)
      .order('full_name')

    setEmployees(data || [])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.task_code.trim() || !formData.task_name.trim()) {
      return
    }

    const newTask = {
      phase_id: phaseId,
      task_code: formData.task_code.trim(),
      task_name: formData.task_name.trim(),
      product_info: formData.product_info.trim() || null,
      product_code: formData.product_code.trim() || null,
      quantity_info: formData.quantity_info.trim() || null,
      meterage_info: formData.meterage_info.trim() || null,
      task_type: formData.task_type,
      status: formData.status,
      progress: formData.progress,
      assigned_to: formData.assigned_to || null,
      planned_start_date: formData.planned_start_date || null,
      planned_end_date: formData.planned_end_date || null,
      notes: formData.notes.trim() || null
    }

    await onCreate(newTask)

    // Reset form
    setFormData({
      task_code: '',
      task_name: '',
      product_info: '',
      product_code: '',
      quantity_info: '',
      meterage_info: '',
      task_type: 'İmalat',
      status: 'Atanmadı',
      progress: 0,
      assigned_to: '',
      planned_start_date: '',
      planned_end_date: '',
      notes: ''
    })

    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yeni Görev Ekle" size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Görev Kodu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Görev Kodu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.task_code}
              onChange={(e) => setFormData({ ...formData, task_code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="M.T.1-1"
            />
          </div>

          {/* Görev Adı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Görev Adı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.task_name}
              onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Kasa imalatı"
            />
          </div>

          {/* Ürün Bilgisi */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Bilgisi</label>
            <textarea
              rows="2"
              value={formData.product_info}
              onChange={(e) => setFormData({ ...formData, product_info: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="100x70 (Boy x En) - 1.5 mm Dkp - 1'li Kasa"
            />
          </div>

          {/* Ürün Kodu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Kodu</label>
            <input
              type="text"
              value={formData.product_code}
              onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="KS-100-70"
            />
          </div>

          {/* Adet Bilgisi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adet</label>
            <input
              type="text"
              value={formData.quantity_info}
              onChange={(e) => setFormData({ ...formData, quantity_info: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="25 Adet"
            />
          </div>

          {/* Metraj Bilgisi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Metraj</label>
            <input
              type="text"
              value={formData.meterage_info}
              onChange={(e) => setFormData({ ...formData, meterage_info: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="150 m"
            />
          </div>

          {/* Görev Tipi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Görev Tipi</label>
            <select
              value={formData.task_type}
              onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="İmalat">İmalat</option>
              <option value="Montaj">Montaj</option>
              <option value="Kalite Kontrol">Kalite Kontrol</option>
              <option value="Sevkiyat">Sevkiyat</option>
              <option value="Diğer">Diğer</option>
            </select>
          </div>

          {/* Durum */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Atanmadı">Atanmadı</option>
              <option value="Atandı">Atandı</option>
              <option value="Başladı">Başladı</option>
              <option value="Devam Ediyor">Devam Ediyor</option>
              <option value="Beklemede">Beklemede</option>
              <option value="Tamamlandı">Tamamlandı</option>
              <option value="İptal Edildi">İptal Edildi</option>
            </select>
          </div>

          {/* Atanan Personel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Atanan Personel</label>
            <select
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Seçiniz...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
              ))}
            </select>
          </div>

          {/* İlerleme */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              İlerleme: %{formData.progress}
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.progress}
              onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Planlanan Başlangıç */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Planlanan Başlangıç</label>
            <input
              type="date"
              value={formData.planned_start_date}
              onChange={(e) => setFormData({ ...formData, planned_start_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Planlanan Bitiş */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Planlanan Bitiş</label>
            <input
              type="date"
              value={formData.planned_end_date}
              onChange={(e) => setFormData({ ...formData, planned_end_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Notlar */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Görev ile ilgili notlar..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit">Kaydet</Button>
        </div>
      </form>
    </Modal>
  )
}
