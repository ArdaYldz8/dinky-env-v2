import { useState, useEffect } from 'react'
import { X, Camera, User, Calendar, Clock, MessageCircle, Check, XCircle, Play, Upload, Trash2 } from 'lucide-react'
import { supabase } from '../../../services/supabase'
import Modal from '../../../shared/components/Modal'
import Button from '../../../shared/components/Button'
import { qualityControlService } from '../../../services/qualityControlService'
import { useToast } from '../../../shared/hooks'

const statusColors = {
  reported: 'bg-yellow-500',
  assigned: 'bg-blue-500',
  in_progress: 'bg-purple-500',
  fixed: 'bg-green-500',
  review: 'bg-orange-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-red-500'
}

const statusText = {
  reported: 'Bildirildi',
  assigned: 'Atandı',
  in_progress: 'Devam Ediyor',
  fixed: 'Düzeltildi',
  review: 'İncelemede',
  approved: 'Onaylandı',
  rejected: 'Reddedildi'
}

const priorityText = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  critical: 'Kritik'
}

export default function QualityIssueModal({ isOpen, onClose, issueId, onUpdate }) {
  const { showSuccess, showError } = useToast()
  const [issue, setIssue] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [commentType, setCommentType] = useState('general')
  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (isOpen && issueId) {
      loadIssueDetails()
      loadEmployees()
    }
  }, [isOpen, issueId])

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, position')
        .eq('is_active', true)
        .order('full_name')

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error('Load employees error:', error)
    }
  }

  const loadIssueDetails = async () => {
    setLoading(true)
    try {
      const [issueResult, commentsResult] = await Promise.all([
        qualityControlService.getIssueById(issueId),
        qualityControlService.getComments(issueId)
      ])

      if (issueResult.success) {
        setIssue(issueResult.data)
      }
      if (commentsResult.success) {
        setComments(commentsResult.data)
      }
    } catch (error) {
      console.error('Load issue details error:', error)
      showError('Hata detayları yüklenirken bir sorun oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      showError('Yorum boş olamaz')
      return
    }

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const result = await qualityControlService.addComment(
        issueId,
        user.id,
        newComment,
        commentType
      )

      if (result.success) {
        showSuccess('Yorum eklendi')
        setNewComment('')
        loadIssueDetails()
      } else {
        showError(result.error)
      }
    } catch (error) {
      showError('Yorum eklenirken bir hata oluştu')
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      const result = await qualityControlService.updateStatus(issueId, newStatus)
      if (result.success) {
        showSuccess('Durum güncellendi')
        loadIssueDetails()
        if (onUpdate) onUpdate()
      } else {
        showError(result.error)
      }
    } catch (error) {
      showError('Durum güncellenirken bir hata oluştu')
    }
  }

  const handleUploadAfterPhoto = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const uploadResult = await qualityControlService.uploadPhoto(file)
      if (!uploadResult.success) {
        throw new Error(uploadResult.error)
      }

      const result = await qualityControlService.addAfterPhoto(issueId, uploadResult.url)
      if (result.success) {
        showSuccess('Çözüm fotoğrafı yüklendi ve durum "Düzeltildi" olarak güncellendi')
        loadIssueDetails()
        if (onUpdate) onUpdate()
      } else {
        showError(result.error)
      }
    } catch (error) {
      showError('Fotoğraf yüklenirken bir hata oluştu')
    }
  }

  const handleAssignWorker = async () => {
    if (!selectedEmployee) {
      showError('Lütfen bir işçi seçin')
      return
    }

    try {
      const result = await qualityControlService.assignWorker(issueId, selectedEmployee)
      if (result.success) {
        showSuccess('İşçi atandı ve durum güncellendi')
        setShowAssignModal(false)
        setSelectedEmployee('')
        loadIssueDetails()
        if (onUpdate) onUpdate()
      } else {
        showError(result.error)
      }
    } catch (error) {
      showError('İşçi atanırken bir hata oluştu')
    }
  }

  const handleDelete = async () => {
    try {
      const result = await qualityControlService.deleteIssue(issueId)
      if (result.success) {
        showSuccess('Kalite kontrol kaydı silindi')
        setShowDeleteConfirm(false)
        onClose()
        if (onUpdate) onUpdate()
      } else {
        showError(result.error)
      }
    } catch (error) {
      showError('Silme işlemi sırasında bir hata oluştu')
    }
  }

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Yükleniyor...">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </Modal>
    )
  }

  if (!issue) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={issue.issue_title} size="xl">
      <div className="space-y-6">
        {/* Status and Priority */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Durum:</span>
            <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${statusColors[issue.status]}`}>
              {statusText[issue.status]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Öncelik:</span>
            <span className="text-sm font-medium">{priorityText[issue.priority_level]}</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Açıklama</h4>
          <p className="text-gray-600">{issue.issue_description}</p>
          {issue.issue_location && (
            <p className="text-sm text-gray-500 mt-2">
              📍 Lokasyon: {issue.issue_location}
            </p>
          )}
        </div>

        {/* Photos */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Fotoğraflar</h4>
          <div className="grid grid-cols-2 gap-4">
            {issue.before_photo_url ? (
              <div>
                <p className="text-xs text-gray-500 mb-1">Hata Fotoğrafı (Önce)</p>
                <img
                  src={issue.before_photo_url}
                  alt="Önce"
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg border border-gray-200">
                <Camera className="w-12 h-12 text-gray-400" />
              </div>
            )}
            {issue.after_photo_url ? (
              <div>
                <p className="text-xs text-gray-500 mb-1">Çözüm Fotoğrafı (Sonra)</p>
                <img
                  src={issue.after_photo_url}
                  alt="Sonra"
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 bg-gray-100 rounded-lg border border-dashed border-gray-300">
                <Camera className="w-12 h-12 text-gray-400 mb-2" />
                {issue.status === 'in_progress' && (
                  <label className="cursor-pointer">
                    <span className="text-sm text-indigo-600 hover:text-indigo-700">
                      Çözüm Fotoğrafı Yükle
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadAfterPhoto}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}
          </div>
        </div>

        {/* People */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Bildiren</p>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">{issue.reporter?.full_name}</span>
            </div>
          </div>
          {issue.assigned_worker && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Atanan</p>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium text-indigo-600">
                  {issue.assigned_worker.full_name}
                </span>
              </div>
            </div>
          )}
          {issue.supervisor && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Denetmen</p>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium">{issue.supervisor.full_name}</span>
              </div>
            </div>
          )}
        </div>

        {/* Timing */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-1">Oluşturulma</p>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{new Date(issue.created_at).toLocaleString('tr-TR')}</span>
            </div>
          </div>
          {issue.estimated_fix_time && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Tahmini Süre</p>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>{issue.estimated_fix_time} dakika</span>
              </div>
            </div>
          )}
        </div>

        {/* Comments */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Yorumlar ({comments.length})
          </h4>
          <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {comment.employee?.full_name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.created_at).toLocaleString('tr-TR')}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{comment.comment_text}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Henüz yorum yok</p>
            )}
          </div>

          {/* Add Comment */}
          <div className="space-y-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Yorum ekleyin..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <div className="flex gap-2">
              <select
                value={commentType}
                onChange={(e) => setCommentType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="general">Genel Yorum</option>
                <option value="progress">İlerleme Raporu</option>
                <option value="solution">Çözüm Açıklaması</option>
                <option value="review">İnceleme Notu</option>
              </select>
              <Button onClick={handleAddComment} className="flex-1">
                Yorum Ekle
              </Button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">İşlemler</h4>
          <div className="flex flex-wrap gap-2">
            {issue.status === 'reported' && (
              <Button
                onClick={() => setShowAssignModal(true)}
                variant="primary"
                size="sm"
              >
                <User className="w-4 h-4" />
                İşçi Ata
              </Button>
            )}
            {issue.status === 'assigned' && (
              <Button
                onClick={() => handleStatusChange('in_progress')}
                variant="primary"
                size="sm"
              >
                <Play className="w-4 h-4" />
                İşe Başla
              </Button>
            )}
            {issue.status === 'fixed' && (
              <>
                <Button
                  onClick={() => handleStatusChange('review')}
                  variant="success"
                  size="sm"
                >
                  <Check className="w-4 h-4" />
                  İncelemeye Al
                </Button>
                <Button
                  onClick={() => handleStatusChange('rejected')}
                  variant="danger"
                  size="sm"
                >
                  <XCircle className="w-4 h-4" />
                  Reddet
                </Button>
              </>
            )}
            {issue.status === 'review' && (
              <>
                <Button
                  onClick={() => handleStatusChange('approved')}
                  variant="success"
                  size="sm"
                >
                  <Check className="w-4 h-4" />
                  Onayla
                </Button>
                <Button
                  onClick={() => handleStatusChange('rejected')}
                  variant="danger"
                  size="sm"
                >
                  <XCircle className="w-4 h-4" />
                  Reddet
                </Button>
              </>
            )}
            {/* Delete button - available for all statuses except approved */}
            {issue.status !== 'approved' && (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="danger"
                size="sm"
              >
                <Trash2 className="w-4 h-4" />
                Sil
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Assign Worker Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">İşçi Ata</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                İşçi Seçin
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Bir işçi seçin...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} - {emp.position}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedEmployee('')
                }}
                className="flex-1"
              >
                İptal
              </Button>
              <Button
                onClick={handleAssignWorker}
                className="flex-1"
              >
                Ata
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Kaydı Sil</h3>
            <p className="text-gray-600 mb-6">
              Bu kalite kontrol kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                İptal
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4" />
                Sil
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
