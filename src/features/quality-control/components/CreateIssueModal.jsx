import { useState, useEffect } from 'react'
import { X, Camera, Upload } from 'lucide-react'
import { supabase } from '../../../services/supabase'
import useAuthStore from '../../../stores/authStore'
import Modal from '../../../shared/components/Modal'
import Button from '../../../shared/components/Button'
import { qualityControlService } from '../../../services/qualityControlService'
import { useToast } from '../../../shared/hooks'

export default function CreateIssueModal({ isOpen, onClose, projectId, phaseId, taskId, onSuccess }) {
  const { showSuccess, showError } = useToast()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [employeeId, setEmployeeId] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    priority: 'medium',
    estimated_fix_time: '',
    reporter_notes: '',
    photo: null
  })

  useEffect(() => {
    if (isOpen && user) {
      loadEmployeeId()
    }
  }, [isOpen, user])

  const loadEmployeeId = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      setEmployeeId(data.id)
    } catch (error) {
      console.error('Load employee error:', error)
      showError('Kullanıcı bilgisi yüklenemedi')
    }
  }

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      showError('Dosya boyutu 5MB\'dan büyük olamaz')
      return
    }

    if (!file.type.startsWith('image/')) {
      showError('Lütfen geçerli bir resim dosyası seçin')
      return
    }

    setFormData({ ...formData, photo: file })

    const reader = new FileReader()
    reader.onload = (e) => setPhotoPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!employeeId) {
      showError('Kullanıcı bilgisi yüklenemedi. Lütfen sayfayı yenileyip tekrar deneyin.')
      return
    }

    setLoading(true)

    try {
      // Upload photo first
      let photoUrl = null
      if (formData.photo) {
        const uploadResult = await qualityControlService.uploadPhoto(formData.photo)
        if (!uploadResult.success) {
          throw new Error('Fotoğraf yüklenemedi: ' + uploadResult.error)
        }
        photoUrl = uploadResult.url
      }

      // Create issue
      const result = await qualityControlService.createIssue({
        project_id: projectId,
        phase_id: phaseId,
        task_id: taskId,
        issue_title: formData.title,
        issue_description: formData.description,
        issue_location: formData.location,
        priority_level: formData.priority,
        estimated_fix_time: formData.estimated_fix_time ? parseInt(formData.estimated_fix_time) : null,
        reporter_notes: formData.reporter_notes,
        reporter_id: employeeId,
        supervisor_id: null, // Supervisor will be assigned later
        before_photo_url: photoUrl
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      showSuccess('Kalite kontrol hatası başarıyla oluşturuldu')
      handleClose()
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Create issue error:', error)
      showError(error.message || 'Hata oluşturulurken bir sorun oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      location: '',
      priority: 'medium',
      estimated_fix_time: '',
      reporter_notes: '',
      photo: null
    })
    setPhotoPreview(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Yeni Kalite Kontrol Hatası">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hata Başlığı <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Kısa ve açıklayıcı başlık"
          />
        </div>

        {/* Priority and Location */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Öncelik Seviyesi
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="low">Düşük</option>
              <option value="medium">Orta</option>
              <option value="high">Yüksek</option>
              <option value="critical">Kritik</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lokasyon
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Örn: A Blok 3. Kat"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hata Açıklaması <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Hatanın detaylı açıklaması..."
          />
        </div>

        {/* Reporter Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Çözüm Önerisi / Notlar
          </label>
          <textarea
            rows={3}
            value={formData.reporter_notes}
            onChange={(e) => setFormData({ ...formData, reporter_notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Nasıl düzeltilmesi gerektiğine dair önerileriniz..."
          />
        </div>

        {/* Estimated Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tahmini Çözüm Süresi (dakika)
          </label>
          <input
            type="number"
            min="1"
            value={formData.estimated_fix_time}
            onChange={(e) => setFormData({ ...formData, estimated_fix_time: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Tahmini süre (opsiyonel)"
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hata Fotoğrafı
          </label>
          <div
            onClick={() => document.getElementById('photoInput').click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors"
          >
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setPhotoPreview(null)
                    setFormData({ ...formData, photo: null })
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Camera className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600 font-medium">Fotoğraf yüklemek için tıklayın</p>
                <p className="text-sm text-gray-500 mt-1">JPG, PNG, GIF - Max 5MB</p>
              </>
            )}
          </div>
          <input
            id="photoInput"
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            className="hidden"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
          >
            İptal
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Oluşturuluyor...' : 'Hata Bildirimini Oluştur'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
