import { useState } from 'react'
import { Calendar, Clock } from 'lucide-react'

export default function TimelineView({ phases }) {
  // Tarih aralığını hesapla
  const allDates = []
  phases.forEach(phase => {
    if (phase.planned_start_date) allDates.push(new Date(phase.planned_start_date))
    if (phase.planned_end_date) allDates.push(new Date(phase.planned_end_date))
    if (phase.actual_start_date) allDates.push(new Date(phase.actual_start_date))
    if (phase.actual_end_date) allDates.push(new Date(phase.actual_end_date))
  })

  if (allDates.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <Calendar className="mx-auto mb-4 text-gray-300" size={64} />
        <p className="text-gray-400 text-lg">Tarih bilgisi olan aşama bulunmamaktadır</p>
      </div>
    )
  }

  const minDate = new Date(Math.min(...allDates))
  const maxDate = new Date(Math.max(...allDates))
  const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1

  function calculatePosition(date) {
    if (!date) return null
    const d = new Date(date)
    const days = Math.ceil((d - minDate) / (1000 * 60 * 60 * 24))
    return (days / totalDays) * 100
  }

  function getStatusColor(status) {
    const colors = {
      'Tamamlandı': 'bg-green-500',
      'Başlatıldı': 'bg-blue-500',
      'Devam Ediyor': 'bg-blue-500',
      'Planlanıyor': 'bg-yellow-500',
      'Beklemede': 'bg-orange-500',
      'İptal Edildi': 'bg-red-500'
    }
    return colors[status] || 'bg-gray-500'
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <Clock size={24} className="text-indigo-600" />
        <h2 className="text-xl font-bold text-gray-900">Proje Zaman Çizelgesi</h2>
      </div>

      {/* Tarih Başlıkları */}
      <div className="mb-4 text-sm font-medium text-gray-600">
        <div className="flex justify-between">
          <span>{minDate.toLocaleDateString('tr-TR')}</span>
          <span>{maxDate.toLocaleDateString('tr-TR')}</span>
        </div>
        <div className="text-center text-xs text-gray-500 mt-1">
          {totalDays} gün
        </div>
      </div>

      {/* Timeline Çubukları */}
      <div className="space-y-4">
        {phases.map(phase => {
          const plannedStart = calculatePosition(phase.planned_start_date)
          const plannedEnd = calculatePosition(phase.planned_end_date)
          const actualStart = calculatePosition(phase.actual_start_date)
          const actualEnd = calculatePosition(phase.actual_end_date)

          const hasPlanned = plannedStart !== null && plannedEnd !== null
          const hasActual = actualStart !== null && actualEnd !== null

          if (!hasPlanned && !hasActual) return null

          return (
            <div key={phase.id} className="relative">
              {/* Aşama Bilgisi */}
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-white bg-indigo-600 px-2 py-1 rounded">
                    {phase.phase_code}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{phase.phase_name}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(phase.status)} bg-opacity-10 text-gray-700`}>
                    {phase.status}
                  </span>
                </div>
                <span className="text-xs font-semibold text-gray-600">%{phase.progress}</span>
              </div>

              {/* Planlanan Çubuk */}
              {hasPlanned && (
                <div className="relative h-6 bg-gray-100 rounded-lg mb-1">
                  <div
                    className="absolute h-full bg-blue-200 border-2 border-blue-400 rounded-lg"
                    style={{
                      left: `${plannedStart}%`,
                      width: `${plannedEnd - plannedStart}%`
                    }}
                  >
                    <div className="flex items-center justify-center h-full">
                      <span className="text-xs font-medium text-blue-800">Planlanan</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Gerçekleşen Çubuk */}
              {hasActual && (
                <div className="relative h-6 bg-gray-100 rounded-lg">
                  <div
                    className={`absolute h-full ${getStatusColor(phase.status)} bg-opacity-80 border-2 border-current rounded-lg`}
                    style={{
                      left: `${actualStart}%`,
                      width: `${actualEnd - actualStart}%`
                    }}
                  >
                    <div className="flex items-center justify-center h-full">
                      <span className="text-xs font-medium text-white">Gerçekleşen</span>
                    </div>
                  </div>

                  {/* İlerleme Göstergesi */}
                  <div
                    className="absolute h-full bg-green-500 bg-opacity-60 rounded-l-lg"
                    style={{
                      left: `${actualStart}%`,
                      width: `${((actualEnd - actualStart) * phase.progress) / 100}%`
                    }}
                  />
                </div>
              )}

              {/* Tarih Bilgileri */}
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                {hasPlanned && (
                  <div className="flex gap-2">
                    <span>Plan: {new Date(phase.planned_start_date).toLocaleDateString('tr-TR')}</span>
                    <span>-</span>
                    <span>{new Date(phase.planned_end_date).toLocaleDateString('tr-TR')}</span>
                  </div>
                )}
                {hasActual && (
                  <div className="flex gap-2">
                    <span>Gerçek: {new Date(phase.actual_start_date).toLocaleDateString('tr-TR')}</span>
                    {phase.actual_end_date && (
                      <>
                        <span>-</span>
                        <span>{new Date(phase.actual_end_date).toLocaleDateString('tr-TR')}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Açıklama */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-4 bg-blue-200 border-2 border-blue-400 rounded"></div>
            <span className="text-gray-600">Planlanan</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-4 bg-blue-500 border-2 border-blue-700 rounded"></div>
            <span className="text-gray-600">Gerçekleşen</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-600">İlerleme</span>
          </div>
        </div>
      </div>
    </div>
  )
}
