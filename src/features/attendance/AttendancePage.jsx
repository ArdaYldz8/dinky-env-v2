import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import Button from '../../shared/components/Button'

export default function AttendancePage() {
  const [employees, setEmployees] = useState([])
  const [locations, setLocations] = useState([])
  const [attendanceData, setAttendanceData] = useState({}) // { employee_id: { status, location_id, overtime } }
  const [existingRecords, setExistingRecords] = useState({}) // { employee_id: record_id }
  const [modifiedRecords, setModifiedRecords] = useState(new Set()) // Track which records were modified
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchData()
  }, [selectedDate])

  const fetchData = async () => {
    try {
      // Fetch all active employees
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select('id, full_name, position')
        .eq('is_active', true)
        .order('full_name')

      if (empError) throw empError
      setEmployees(empData || [])

      // Fetch work locations
      const { data: locData, error: locError } = await supabase
        .from('work_locations')
        .select('id, name, location_type')
        .eq('is_active', true)
        .order('name')

      if (locError) throw locError
      setLocations(locData || [])

      // Fetch attendance records for selected date
      const { data: attData, error: attError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('work_date', selectedDate)

      if (attError) throw attError

      // Build attendance data and existing records map
      const tempAttendance = {}
      const tempExisting = {}

      empData.forEach(emp => {
        const record = (attData || []).find(r => r.employee_id === emp.id)
        if (record) {
          tempAttendance[emp.id] = {
            status: record.status,
            location_id: record.work_location_id || '',
            overtime: record.overtime_hours || 0,
            notes: record.notes || ''
          }
          tempExisting[emp.id] = record.id
        } else {
          // Default values
          tempAttendance[emp.id] = {
            status: 'Tam Gün',
            location_id: '',
            overtime: 0,
            notes: ''
          }
        }
      })

      setAttendanceData(tempAttendance)
      setExistingRecords(tempExisting)
      setModifiedRecords(new Set()) // Clear modified records on data load
    } catch (error) {
      showToast('Veri yüklenirken hata: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleChange = (employeeId, field, value) => {
    setAttendanceData(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: value
      }
    }))
    // Mark this record as modified
    setModifiedRecords(prev => new Set([...prev, employeeId]))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Only process modified records
      if (modifiedRecords.size === 0) {
        showToast('Değişiklik yapılmadı', 'error')
        setSaving(false)
        return
      }

      const updates = []
      const inserts = []

      // Only save records that were actually modified
      modifiedRecords.forEach(empId => {
        const data = attendanceData[empId]
        const recordData = {
          employee_id: empId,
          work_date: selectedDate,
          status: data.status,
          work_location_id: data.location_id || null,
          overtime_hours: parseFloat(data.overtime) || 0,
          notes: data.notes?.trim() || null,
        }

        if (existingRecords[empId]) {
          // Update existing record
          updates.push({
            id: existingRecords[empId],
            ...recordData
          })
        } else {
          // Insert new record
          inserts.push(recordData)
        }
      })

      // Perform updates
      if (updates.length > 0) {
        for (const update of updates) {
          const { id, ...updateData } = update
          const { error } = await supabase
            .from('attendance_records')
            .update(updateData)
            .eq('id', id)

          if (error) throw error
        }
      }

      // Perform inserts
      if (inserts.length > 0) {
        const { error } = await supabase
          .from('attendance_records')
          .insert(inserts)

        if (error) throw error
      }

      showToast(`${modifiedRecords.size} kayıt başarıyla güncellendi!`)
      fetchData() // Reload to get fresh IDs
    } catch (error) {
      showToast('Kaydetme işlemi başarısız: ' + error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const getStatusHours = (status) => {
    const hours = {
      'Tam Gün': '9 saat',
      'Yarım Gün': '4.5 saat',
      'İzinli': '0 saat',
      'Raporlu': '0 saat',
      'Yok': '0 saat',
    }
    return hours[status] || '0 saat'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📋 Günlük Puantaj</h1>
        </div>
        <div className="flex gap-3 items-center">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <Button onClick={handleSave} disabled={saving} variant="success">
            {saving ? 'Kaydediliyor...' : '✓ Kaydet'}
          </Button>
        </div>
      </div>

      {/* Info Banners */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-blue-500 text-xl mr-3">ℹ️</span>
            <div>
              <p className="text-sm text-blue-900">
                <strong>Değişiklik:</strong> Değişiklik yaptığınız satırlar vurgulanacaktır. Kaydet butonuna tıklayarak değişiklikleri kaydedebilirsiniz.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-blue-500 text-xl mr-3">🕐</span>
            <div>
              <p className="text-sm text-blue-900">
                <strong>Çalışma Saatleri:</strong> Tam gün = 9 saat, Yarım gün = 4.5 saat, Serbest Saat = manuel giriş yapılır.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-green-500 text-xl mr-3">⚡</span>
            <div>
              <p className="text-sm text-green-900">
                <strong>Ek Mesai:</strong> Normal mesai saatlerinin üzerine yapılan ek çalışma saatleridir (1.5 kat ücret ile hesaplanır).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Personel
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Durum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Proje
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ek Mesai
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notlar
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                  Aktif personel bulunamadı.
                </td>
              </tr>
            ) : (
              employees.map((employee) => {
                const data = attendanceData[employee.id] || { status: 'Tam Gün', location_id: '', overtime: 0, notes: '' }

                return (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{employee.full_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={data.status}
                        onChange={(e) => handleChange(employee.id, 'status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="Tam Gün">Tam Gün ({getStatusHours('Tam Gün')})</option>
                        <option value="Yarım Gün">Yarım Gün ({getStatusHours('Yarım Gün')})</option>
                        <option value="İzinli">İzinli</option>
                        <option value="Raporlu">Raporlu</option>
                        <option value="Yok">Gelmedi</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={data.location_id}
                        onChange={(e) => handleChange(employee.id, 'location_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="">Proje Seçiniz</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={data.overtime}
                          onChange={(e) => handleChange(employee.id, 'overtime', e.target.value)}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center"
                        />
                        <span className="text-sm text-gray-500">saat</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={data.notes}
                        onChange={(e) => handleChange(employee.id, 'notes', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                        placeholder="Not ekle..."
                      />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {employees.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Toplam {employees.length} personel listeleniyor
        </div>
      )}
    </div>
  )
}
