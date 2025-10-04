import { useState, useEffect } from 'react'
import Modal from '../../../shared/components/Modal'
import Button from '../../../shared/components/Button'
import { supabase } from '../../../services/supabase'

export default function TaskUpdateModal({ isOpen, onClose, task, onUpdate }) {
  const [formData, setFormData] = useState({
    status: '',
    progress: 0,
    assigned_to: '',
    planned_start_date: '',
    planned_end_date: '',
    actual_start_date: '',
    actual_end_date: '',
    notes: ''
  })
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    loadEmployees()
  }, [])

  useEffect(() => {
    if (task) {
      setFormData({
        status: task.status || 'Atanmadı',
        progress: task.progress || 0,
        assigned_to: task.assigned_to || '',
        planned_start_date: task.planned_start_date || '',
        planned_end_date: task.planned_end_date || '',
        actual_start_date: task.actual_start_date || '',
        actual_end_date: task.actual_end_date || '',
        notes: task.notes || ''
      })
    }
  }, [task])

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
    await onUpdate(task.id, formData)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Görev Güncelle: ${task?.task_name}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
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
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
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

          {/* Gerçek Başlangıç */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gerçek Başlangıç</label>
            <input
              type="date"
              value={formData.actual_start_date}
              onChange={(e) => setFormData({ ...formData, actual_start_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Gerçek Bitiş */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gerçek Bitiş</label>
            <input
              type="date"
              value={formData.actual_end_date}
              onChange={(e) => setFormData({ ...formData, actual_end_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Notlar */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
            <textarea
              rows="3"
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
          <Button type="submit">Güncelle</Button>
        </div>
      </form>
    </Modal>
  )
}
