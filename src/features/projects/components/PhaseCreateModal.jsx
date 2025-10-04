import { useState } from 'react'
import Modal from '../../../shared/components/Modal'
import Button from '../../../shared/components/Button'

export default function PhaseCreateModal({ isOpen, onClose, projectId, onCreate, lastPhaseOrder = 0 }) {
  const [formData, setFormData] = useState({
    phase_code: '',
    phase_name: '',
    status: 'Planlanıyor',
    progress: 0,
    order_number: lastPhaseOrder + 1,
    planned_start_date: '',
    planned_end_date: '',
    notes: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.phase_code.trim() || !formData.phase_name.trim()) {
      return
    }

    const newPhase = {
      project_id: projectId,
      phase_code: formData.phase_code.trim(),
      phase_name: formData.phase_name.trim(),
      order_number: formData.order_number,
      status: formData.status,
      progress: formData.progress,
      planned_start_date: formData.planned_start_date || null,
      planned_end_date: formData.planned_end_date || null,
      notes: formData.notes.trim() || null
    }

    await onCreate(newPhase)

    // Reset form
    setFormData({
      phase_code: '',
      phase_name: '',
      status: 'Planlanıyor',
      progress: 0,
      order_number: lastPhaseOrder + 2,
      planned_start_date: '',
      planned_end_date: '',
      notes: ''
    })

    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yeni Aşama Ekle" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Aşama Kodu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Aşama Kodu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.phase_code}
              onChange={(e) => setFormData({ ...formData, phase_code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="M.T.1"
            />
          </div>

          {/* Sıra Numarası */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sıra No</label>
            <input
              type="number"
              value={formData.order_number}
              onChange={(e) => setFormData({ ...formData, order_number: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Aşama Adı */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Aşama Adı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.phase_name}
              onChange={(e) => setFormData({ ...formData, phase_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="KAPI KASALARI ÜRETİMİ"
            />
          </div>

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
          <Button type="submit">Kaydet</Button>
        </div>
      </form>
    </Modal>
  )
}
