import { Calendar, MapPin, User, AlertCircle, CheckCircle, Clock } from 'lucide-react'

const statusColors = {
  reported: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  assigned: 'bg-blue-100 text-blue-800 border-blue-300',
  in_progress: 'bg-purple-100 text-purple-800 border-purple-300',
  fixed: 'bg-green-100 text-green-800 border-green-300',
  review: 'bg-orange-100 text-orange-800 border-orange-300',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  rejected: 'bg-red-100 text-red-800 border-red-300'
}

const priorityColors = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500'
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

export default function QualityIssueCard({ issue, onClick }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div
      onClick={() => onClick(issue)}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg mb-1">
            {issue.issue_title}
          </h3>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${statusColors[issue.status]}`}>
              {statusText[issue.status] || issue.status}
            </span>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${priorityColors[issue.priority_level]}`} />
              <span className="text-xs text-gray-600">
                {priorityText[issue.priority_level] || issue.priority_level}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {issue.issue_description}
      </p>

      {/* Photos Preview */}
      {(issue.before_photo_url || issue.after_photo_url) && (
        <div className="flex gap-2 mb-3">
          {issue.before_photo_url && (
            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={issue.before_photo_url}
                alt="Önce"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 text-center">
                Önce
              </div>
            </div>
          )}
          {issue.after_photo_url && (
            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={issue.after_photo_url}
                alt="Sonra"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 text-center">
                Sonra
              </div>
            </div>
          )}
        </div>
      )}

      {/* Meta Information */}
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
        {issue.issue_location && (
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{issue.issue_location}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(issue.created_at)}</span>
        </div>
        <div className="flex items-center gap-1">
          <User className="w-4 h-4" />
          <span className="truncate">{issue.reporter?.full_name || 'Bilinmiyor'}</span>
        </div>
        {issue.assigned_worker && (
          <div className="flex items-center gap-1 text-indigo-600">
            <User className="w-4 h-4" />
            <span className="truncate">{issue.assigned_worker.full_name}</span>
          </div>
        )}
      </div>

      {/* Timing Info */}
      {(issue.estimated_fix_time || issue.actual_fix_time) && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
          {issue.estimated_fix_time && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Tahmini: {issue.estimated_fix_time} dk</span>
            </div>
          )}
          {issue.actual_fix_time && (
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              <span>Gerçek: {issue.actual_fix_time} dk</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
