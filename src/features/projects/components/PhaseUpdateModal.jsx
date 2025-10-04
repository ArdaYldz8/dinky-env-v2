import { useState, useEffect } from 'react'
import Modal from '../../../shared/components/Modal'
import Button from '../../../shared/components/Button'

export default function PhaseUpdateModal({ isOpen, onClose, phase, onUpdate }) {
  const [formData, setFormData] = useState({
    status: '',
    progress: 0,
    planned_start_date: '',
    planned_end_date: '',
    actual_start_date: '',
    actual_end_date: '',
    notes: ''
  })

  useEffect(() => {
    if (phase) {
      setFormData({
        status: phase.status || 'Planlanıyor',
        progress: phase.progress || 0,
        planned_start_date: phase.planned_start_date || '',
        planned_end_date: phase.planned_end_date || '',
        actual_start_date: phase.actual_start_date || '',
        actual_end_date: phase.actual_end_date || '',
        notes: phase.notes || ''
      })
    }
  }, [phase])

  const handleSubmit = async (e) => {
    e.preventDefault()
    await onUpdate(phase.id, formData)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Aşama Güncelle: ${phase?.phase_name}`} size="lg">
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
              <option value="Planlanıyor">Planlanıyor</option>
              <option value="Başlatıldı">Başlatıldı</option>
              <option value="Devam Ediyor">Devam Ediyor</option>
              <option value="Beklemede">Beklemede</option>
              <option value="Tamamlandı">Tamamlandı</option>
              <option value="İptal Edildi">İptal Edildi</option>
            </select>
          </div>

          {/* İlerleme */}
          <div>
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
              placeholder="Aşama ile ilgili notlar..."
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
