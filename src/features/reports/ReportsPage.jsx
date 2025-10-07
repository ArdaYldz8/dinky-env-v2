import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import Button from '../../shared/components/Button'
import { useToast } from '../../shared/hooks'
import { handleSupabaseError } from '../../utils/errorHandler'
import {
  exportDailyReportToExcel,
  exportDailyReportToPDF,
  exportWeeklyReportToExcel,
  exportWeeklyReportToPDF,
  exportMonthlyReportToExcel,
  exportMonthlyReportToPDF,
  exportEmployeeReportToExcel,
  exportEmployeeReportToPDF,
  exportYearlyReportToExcel,
  exportYearlyReportToPDF
} from './utils/reportExport'

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('daily')
  const [loading, setLoading] = useState(false)
  const { toast, showSuccess, showError } = useToast()
  const [employees, setEmployees] = useState([])

  // Daily report state
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0])
  const [dailyReport, setDailyReport] = useState(null)

  // Weekly report state
  const currentWeek = `${new Date().getFullYear()}-W${String(Math.ceil((new Date().getDate()) / 7)).padStart(2, '0')}`
  const [weeklyDate, setWeeklyDate] = useState(currentWeek)
  const [weeklyReport, setWeeklyReport] = useState(null)

  // Monthly report state
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const [reportMonth, setReportMonth] = useState(currentMonth)
  const [reportYear, setReportYear] = useState(currentYear)
  const [monthlyReport, setMonthlyReport] = useState(null)

  // Yearly report state
  const [yearlyReportYear, setYearlyReportYear] = useState(currentYear)
  const [yearlyReport, setYearlyReport] = useState(null)

  // Employee report state
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [employeeStartDate, setEmployeeStartDate] = useState(oneMonthAgo.toISOString().split('T')[0])
  const [employeeEndDate, setEmployeeEndDate] = useState(new Date().toISOString().split('T')[0])
  const [employeeReport, setEmployeeReport] = useState(null)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name')

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error('Personeller yüklenirken hata:', error)
    }
  }

  const generateDailyReport = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*,employees(id,full_name,salary,position)')
        .eq('work_date', dailyDate)

      if (error) throw error

      // Fetch work locations separately
      const locationIds = [...new Set(data.map(r => r.work_location_id).filter(Boolean))]
      let locationsMap = {}

      if (locationIds.length > 0) {
        const { data: locations } = await supabase
          .from('work_locations')
          .select('id, name')
          .in('id', locationIds)

        locationsMap = (locations || []).reduce((acc, loc) => {
          acc[loc.id] = loc.name
          return acc
        }, {})
      }

      // Attach location names to records
      const enrichedData = data.map(record => ({
        ...record,
        location_name: record.work_location_id ? locationsMap[record.work_location_id] : null
      }))

      // Sort by employee name on client side
      const sortedData = enrichedData.sort((a, b) => {
        const nameA = a.employees?.full_name || ''
        const nameB = b.employees?.full_name || ''
        return nameA.localeCompare(nameB, 'tr')
      })

      setDailyReport(sortedData)
      if (sortedData.length === 0) {
        showToast('Seçilen tarih için kayıt bulunamadı', 'error')
      }
    } catch (error) {
      showToast('Rapor oluşturulurken hata: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const generateWeeklyReport = async () => {
    setLoading(true)
    try {
      const [year, week] = weeklyDate.split('-W')
      const firstDay = getFirstDayOfWeek(parseInt(year), parseInt(week))
      const lastDay = new Date(firstDay)
      lastDay.setDate(lastDay.getDate() + 6)

      const { data, error } = await supabase
        .from('attendance_records')
        .select('*,employees(id,full_name,salary)')
        .gte('work_date', firstDay.toISOString().split('T')[0])
        .lte('work_date', lastDay.toISOString().split('T')[0])

      if (error) throw error

      const grouped = groupByEmployee(data || [])
      setWeeklyReport({ data: grouped, startDate: firstDay, endDate: lastDay })
    } catch (error) {
      showToast('Rapor oluşturulurken hata: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const generateMonthlyReport = async () => {
    setLoading(true)
    try {
      const startDate = `${reportYear}-${String(reportMonth).padStart(2, '0')}-01`
      const endDate = new Date(reportYear, reportMonth, 0).toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('attendance_records')
        .select('*,employees(id,full_name,salary)')
        .gte('work_date', startDate)
        .lte('work_date', endDate)

      if (error) throw error

      const payroll = calculatePayroll(data || [])
      setMonthlyReport(payroll)
    } catch (error) {
      showToast('Bordro oluşturulurken hata: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const generateYearlyReport = async () => {
    setLoading(true)
    try {
      const startDate = `${yearlyReportYear}-01-01`
      const endDate = `${yearlyReportYear}-12-31`

      const { data, error } = await supabase
        .from('attendance_records')
        .select('*,employees(id,full_name,salary)')
        .gte('work_date', startDate)
        .lte('work_date', endDate)

      if (error) throw error

      const yearlyData = calculateYearlyReport(data || [])
      setYearlyReport(yearlyData)
    } catch (error) {
      showToast('Yıllık rapor oluşturulurken hata: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const generateEmployeeReport = async () => {
    if (!selectedEmployee) {
      showToast('Lütfen personel seçiniz', 'error')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*,employees(id,full_name,salary,position)')
        .eq('employee_id', selectedEmployee)
        .gte('work_date', employeeStartDate)
        .lte('work_date', employeeEndDate)
        .order('work_date', { ascending: false })

      if (error) throw error

      // Fetch work locations separately
      const locationIds = [...new Set(data.map(r => r.work_location_id).filter(Boolean))]
      let locationsMap = {}

      if (locationIds.length > 0) {
        const { data: locations } = await supabase
          .from('work_locations')
          .select('id, name')
          .in('id', locationIds)

        locationsMap = (locations || []).reduce((acc, loc) => {
          acc[loc.id] = loc.name
          return acc
        }, {})
      }

      // Attach location names to records
      const enrichedData = data.map(record => ({
        ...record,
        location_name: record.work_location_id ? locationsMap[record.work_location_id] : null
      }))

      setEmployeeReport(enrichedData || [])
      if (enrichedData.length === 0) {
        showToast('Seçilen kriterlere uygun kayıt bulunamadı', 'error')
      }
    } catch (error) {
      showToast('Rapor oluşturulurken hata: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const getFirstDayOfWeek = (year, week) => {
    const date = new Date(year, 0, 1 + (week - 1) * 7)
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(date.setDate(diff))
  }

  const groupByEmployee = (records) => {
    const grouped = {}
    records.forEach(record => {
      const empId = record.employee_id
      if (!grouped[empId]) {
        const monthlySalary = parseFloat(record.employees?.salary || 0)
        const dailyWage = monthlySalary / 30
        grouped[empId] = {
          employee: record.employees?.full_name || '-',
          dailyWage: dailyWage,
          records: []
        }
      }
      grouped[empId].records.push(record)
    })
    return Object.values(grouped)
  }

  const calculatePayroll = (records) => {
    const grouped = groupByEmployee(records)
    return grouped.map(emp => {
      let fullDays = 0
      let halfDays = 0
      let absentDays = 0
      let overtimeHours = 0

      emp.records.forEach(record => {
        if (record.status === 'Tam Gün') {
          fullDays++
          overtimeHours += record.overtime_hours || 0
        }
        else if (record.status === 'Yarım Gün') {
          halfDays++
          overtimeHours += record.overtime_hours || 0
        }
        else if (record.status === 'Gelmedi' || record.status === 'Yok' || record.status === 'Raporlu' || record.status === 'İzinli') {
          absentDays++
          // No pay for absent/sick/on-leave days
        }
      })

      const totalDays = fullDays + (halfDays * 0.5)
      const grossSalary = totalDays * emp.dailyWage
      const overtimePayment = (overtimeHours * emp.dailyWage) / 9
      const totalGross = grossSalary + overtimePayment

      return {
        employee: emp.employee,
        dailyWage: emp.dailyWage,
        fullDays,
        halfDays,
        absentDays,
        totalDays,
        overtimeHours,
        overtimePayment,
        grossSalary: totalGross,
        netSalary: totalGross
      }
    })
  }

  const calculateYearlyReport = (records) => {
    const grouped = groupByEmployee(records)
    return grouped.map(emp => {
      let fullDays = 0
      let halfDays = 0
      let absentDays = 0
      let overtimeHours = 0

      emp.records.forEach(record => {
        if (record.status === 'Tam Gün') {
          fullDays++
          overtimeHours += record.overtime_hours || 0
        }
        else if (record.status === 'Yarım Gün') {
          halfDays++
          overtimeHours += record.overtime_hours || 0
        }
        else if (record.status === 'Gelmedi' || record.status === 'Yok' || record.status === 'Raporlu' || record.status === 'İzinli') {
          absentDays++
        }
      })

      const totalDays = fullDays + (halfDays * 0.5)
      const grossSalary = totalDays * emp.dailyWage
      const overtimePayment = (overtimeHours * emp.dailyWage) / 9
      const totalGross = grossSalary + overtimePayment

      return {
        employee: emp.employee,
        dailyWage: emp.dailyWage,
        fullDays,
        halfDays,
        absentDays,
        totalDays,
        overtimeHours,
        overtimePayment,
        grossSalary: totalGross,
        netSalary: totalGross
      }
    })
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('tr-TR')
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount)
  }

  const getMonthName = (month) => {
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
    return months[month - 1]
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="p-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
          } text-white`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📈 Raporlar</h1>
        <p className="text-gray-600 mt-1">Puantaj ve bordro raporları</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('daily')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition ${activeTab === 'daily'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            📅 Günlük Rapor
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition ${activeTab === 'weekly'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            📆 Haftalık Rapor
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition ${activeTab === 'monthly'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            💰 Aylık Bordro
          </button>
          <button
            onClick={() => setActiveTab('yearly')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition ${activeTab === 'yearly'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            📊 Yıllık Rapor
          </button>
          <button
            onClick={() => setActiveTab('employee')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition ${activeTab === 'employee'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            👤 Personel Bazlı
          </button>
        </nav>
      </div>

      {/* Daily Report Tab */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tarih Seçiniz
                </label>
                <input
                  type="date"
                  value={dailyDate}
                  onChange={(e) => setDailyDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <Button onClick={generateDailyReport} disabled={loading}>
                {loading ? '⏳ Yükleniyor...' : '🔍 Rapor Oluştur'}
              </Button>
            </div>
          </div>

          {dailyReport && dailyReport.length > 0 && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Tam Gün</h4>
                  <span className="text-3xl font-bold text-green-600">
                    {dailyReport.filter(r => r.status === 'Tam Gün').length}
                  </span>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Yarım Gün</h4>
                  <span className="text-3xl font-bold text-yellow-600">
                    {dailyReport.filter(r => r.status === 'Yarım Gün').length}
                  </span>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">İzinli</h4>
                  <span className="text-3xl font-bold text-blue-600">
                    {dailyReport.filter(r => r.status === 'İzinli').length}
                  </span>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Raporlu</h4>
                  <span className="text-3xl font-bold text-orange-600">
                    {dailyReport.filter(r => r.status === 'Raporlu').length}
                  </span>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Gelmedi</h4>
                  <span className="text-3xl font-bold text-red-600">
                    {dailyReport.filter(r => r.status === 'Yok' || r.status === 'Gelmedi').length}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Günlük Puantaj Raporu - {formatDate(dailyDate)}
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => exportDailyReportToExcel(dailyReport, dailyDate)}
                    >
                      📊 Excel
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => exportDailyReportToPDF(dailyReport, dailyDate)}
                    >
                      📄 PDF
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Personel</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departman</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proje</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ek Mesai (Saat)</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Günlük Ücret</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Mesai Ücreti</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Toplam</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dailyReport.map((record, index) => {
                      const monthlySalary = parseFloat(record.employees?.salary || 0)
                      const dailyWage = monthlySalary / 30
                      const overtimeHours = parseFloat(record.overtime_hours || 0)
                      // Calculate day multiplier: only Tam Gün (1) and Yarım Gün (0.5) get paid
                      // İzinli, Raporlu, Yok/Gelmedi get 0
                      const dayMultiplier = record.status === 'Tam Gün' ? 1 :
                                          record.status === 'Yarım Gün' ? 0.5 : 0
                      const dayPayment = dailyWage * dayMultiplier
                      const overtimePayment = dayMultiplier > 0 ? (overtimeHours * dailyWage) / 9 : 0
                      const totalPayment = dayPayment + overtimePayment

                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                            {record.employees?.full_name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {record.employees?.position || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {record.location_name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.status === 'Tam Gün' ? 'bg-green-100 text-green-800' :
                                record.status === 'Yarım Gün' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                              }`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            {overtimeHours}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(dayPayment)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(overtimePayment)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                            {formatCurrency(totalPayment)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr className="font-semibold">
                      <td colSpan="5" className="px-6 py-4 text-left text-sm text-gray-900">TOPLAM</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">
                        {formatCurrency(dailyReport.reduce((sum, record) => {
                          const monthlySalary = parseFloat(record.employees?.salary || 0)
                          const dailyWage = monthlySalary / 30
                          const dayMultiplier = record.status === 'Tam Gün' ? 1 : record.status === 'Yarım Gün' ? 0.5 : 0
                          return sum + (dailyWage * dayMultiplier)
                        }, 0))}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">
                        {formatCurrency(dailyReport.reduce((sum, record) => {
                          const monthlySalary = parseFloat(record.employees?.salary || 0)
                          const dailyWage = monthlySalary / 30
                          const overtimeHours = parseFloat(record.overtime_hours || 0)
                          return sum + ((overtimeHours * dailyWage) / 9)
                        }, 0))}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">
                        {formatCurrency(dailyReport.reduce((sum, record) => {
                          const monthlySalary = parseFloat(record.employees?.salary || 0)
                          const dailyWage = monthlySalary / 30
                          const overtimeHours = parseFloat(record.overtime_hours || 0)
                          const overtimePayment = (overtimeHours * dailyWage) / 9
                          const dayMultiplier = record.status === 'Tam Gün' ? 1 : record.status === 'Yarım Gün' ? 0.5 : 0
                          const dayPayment = dailyWage * dayMultiplier
                          return sum + (dayPayment + overtimePayment)
                        }, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            </>
          )}

          {dailyReport === null && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <p className="text-blue-800">
                📅 Günlük raporu görüntülemek için tarih seçip "Rapor Oluştur" butonuna tıklayın.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Weekly Report Tab */}
      {activeTab === 'weekly' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hafta Seçiniz
                </label>
                <input
                  type="week"
                  value={weeklyDate}
                  onChange={(e) => setWeeklyDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <Button onClick={generateWeeklyReport} disabled={loading}>
                {loading ? '⏳ Yükleniyor...' : '🔍 Rapor Oluştur'}
              </Button>
            </div>
          </div>

          {weeklyReport && weeklyReport.data.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Haftalık Rapor - {formatDate(weeklyReport.startDate)} / {formatDate(weeklyReport.endDate)}
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => exportWeeklyReportToExcel(weeklyReport)}
                  >
                    📊 Excel
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => exportWeeklyReportToPDF(weeklyReport)}
                  >
                    📄 PDF
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Personel</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pzt</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Sal</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Çar</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Per</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cum</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cmt</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Paz</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Toplam Gün</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Mesai</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Kazanç</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {weeklyReport.data.map((emp, index) => {
                      // Group records by day of week
                      const dayRecords = {}
                      emp.records.forEach(record => {
                        const date = new Date(record.work_date + 'T12:00:00')
                        const dayNum = date.getDay() // 0=Sunday, 1=Monday, etc
                        dayRecords[dayNum] = record
                      })

                      const totalDays = emp.records.filter(r => r.status === 'Tam Gün').length +
                        emp.records.filter(r => r.status === 'Yarım Gün').length * 0.5
                      const totalOvertime = emp.records.reduce((sum, r) => {
                        // Only count overtime for work days (not absent/sick)
                        const dayMultiplier = r.status === 'Tam Gün' ? 1 : r.status === 'Yarım Gün' ? 0.5 : 0
                        return sum + (dayMultiplier > 0 ? (r.overtime_hours || 0) : 0)
                      }, 0)
                      const totalEarnings = emp.records.reduce((sum, r) => {
                        const dailyWage = emp.dailyWage
                        const dayMultiplier = r.status === 'Tam Gün' ? 1 : r.status === 'Yarım Gün' ? 0.5 : 0
                        const overtimePayment = dayMultiplier > 0 ? (r.overtime_hours || 0) * (dailyWage / 9) : 0
                        return sum + (dailyWage * dayMultiplier) + overtimePayment
                      }, 0)

                      const renderDayCell = (dayNum) => {
                        const record = dayRecords[dayNum]
                        if (!record) return <td key={dayNum} className="px-4 py-4 text-center text-sm text-gray-400">-</td>

                        const symbol = record.status === 'Tam Gün' ? '✓' :
                                      record.status === 'Yarım Gün' ? '½' : '✗'
                        const colorClass = record.status === 'Tam Gün' ? 'text-green-600' :
                                          record.status === 'Yarım Gün' ? 'text-yellow-600' : 'text-red-600'

                        return (
                          <td key={dayNum} className={`px-4 py-4 text-center text-sm font-semibold ${colorClass}`}>
                            {symbol}
                            {record.overtime_hours > 0 && <span className="text-xs text-indigo-600"> +{record.overtime_hours}</span>}
                          </td>
                        )
                      }

                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap font-medium text-gray-900">
                            {emp.employee}
                          </td>
                          {[1, 2, 3, 4, 5, 6, 0].map(dayNum => renderDayCell(dayNum))}
                          <td className="px-4 py-4 text-center text-sm font-medium text-gray-900">
                            {totalDays.toFixed(1)}
                          </td>
                          <td className="px-4 py-4 text-center text-sm text-gray-900">
                            {totalOvertime}
                          </td>
                          <td className="px-4 py-4 text-right text-sm font-medium text-gray-900">
                            {formatCurrency(totalEarnings)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {weeklyReport === null && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <p className="text-blue-800">
                📆 Haftalık raporu görüntülemek için hafta seçip "Rapor Oluştur" butonuna tıklayın.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Monthly Report Tab */}
      {activeTab === 'monthly' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ay
                </label>
                <select
                  value={reportMonth}
                  onChange={(e) => setReportMonth(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>{getMonthName(month)}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yıl
                </label>
                <select
                  value={reportYear}
                  onChange={(e) => setReportYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {Array.from({ length: 3 }, (_, i) => currentYear - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <Button onClick={generateMonthlyReport} disabled={loading}>
                {loading ? '⏳ Yükleniyor...' : '💰 Bordro Oluştur'}
              </Button>
            </div>
          </div>

          {monthlyReport && monthlyReport.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Aylık Bordro Raporu - {getMonthName(reportMonth)} {reportYear}
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => exportMonthlyReportToExcel(monthlyReport, reportMonth, reportYear)}
                  >
                    📊 Excel
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => exportMonthlyReportToPDF(monthlyReport, reportMonth, reportYear)}
                  >
                    📄 PDF
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Personel</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Günlük Ücret</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tam Gün</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Yarım Gün</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Gelmedi</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Toplam Gün</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ek Mesai</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ek Mesai Ücreti</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Brüt Maaş</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avanslar</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Kesintiler</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Maaş</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {monthlyReport.map((emp, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap font-medium text-gray-900">
                          {emp.employee}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                          {formatCurrency(emp.dailyWage)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                          {emp.fullDays}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                          {emp.halfDays}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                          {emp.absentDays}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">
                          {emp.totalDays.toFixed(1)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                          {emp.overtimeHours || 0}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {formatCurrency(emp.overtimePayment || 0)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                          {formatCurrency(emp.grossSalary)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                          {formatCurrency(0)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                          {formatCurrency(0)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600">
                          {formatCurrency(emp.netSalary)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr className="font-bold">
                      <td colSpan="6" className="px-4 py-4 text-right text-sm text-gray-900">TOPLAM</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {monthlyReport.reduce((sum, emp) => sum + (emp.overtimeHours || 0), 0)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(monthlyReport.reduce((sum, emp) => sum + (emp.overtimePayment || 0), 0))}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(monthlyReport.reduce((sum, emp) => sum + emp.grossSalary, 0))}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(0)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(0)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-green-600">
                        {formatCurrency(monthlyReport.reduce((sum, emp) => sum + emp.netSalary, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {monthlyReport === null && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <p className="text-blue-800">
                💰 Bordro raporu oluşturmak için ay ve yıl seçip "Bordro Oluştur" butonuna tıklayın.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Yearly Report Tab */}
      {activeTab === 'yearly' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yıl Seçin
                </label>
                <select
                  value={yearlyReportYear}
                  onChange={(e) => setYearlyReportYear(parseInt(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {Array.from({ length: 10 }, (_, i) => currentYear - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <Button onClick={generateYearlyReport} disabled={loading}>
                {loading ? 'Oluşturuluyor...' : 'Rapor Oluştur'}
              </Button>
            </div>
          </div>

          {yearlyReport && yearlyReport.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Yıllık Rapor - {yearlyReportYear}
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => exportYearlyReportToExcel(yearlyReport, yearlyReportYear)}
                  >
                    📊 Excel
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => exportYearlyReportToPDF(yearlyReport, yearlyReportYear)}
                  >
                    📄 PDF
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-indigo-600 text-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Personel</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Günlük Ücret</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Tam Gün</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Yarım Gün</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Gelmedi</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Toplam Gün</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Ek Mesai</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Ek Mesai Ücreti</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Brüt Maaş</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Net Maaş</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {yearlyReport.map((emp, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{emp.employee}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 font-medium">
                          ₺{parseFloat(emp.dailyWage).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">{emp.fullDays}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">{emp.halfDays}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">{emp.absentDays}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">{emp.totalDays.toFixed(1)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">{emp.overtimeHours || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 font-medium">
                          ₺{(emp.overtimePayment || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-green-600 font-semibold">
                          ₺{emp.grossSalary.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-indigo-600 font-bold">
                          ₺{emp.netSalary.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-bold">
                      <td className="px-6 py-4 whitespace-nowrap">TOPLAM</td>
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4 text-right">{yearlyReport.reduce((sum, emp) => sum + (emp.overtimeHours || 0), 0)}</td>
                      <td className="px-6 py-4 text-right">
                        ₺{yearlyReport.reduce((sum, emp) => sum + (emp.overtimePayment || 0), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right text-green-600">
                        ₺{yearlyReport.reduce((sum, emp) => sum + emp.grossSalary, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right text-indigo-600">
                        ₺{yearlyReport.reduce((sum, emp) => sum + emp.netSalary, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {yearlyReport === null && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500">Rapor oluşturmak için yukarıdaki butona tıklayın</p>
            </div>
          )}
        </div>
      )}

      {/* Employee Report Tab */}
      {activeTab === 'employee' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personel
                </label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Personel Seçiniz...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  value={employeeStartDate}
                  onChange={(e) => setEmployeeStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  value={employeeEndDate}
                  onChange={(e) => setEmployeeEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={generateEmployeeReport} disabled={loading} className="w-full">
                  {loading ? '⏳ Yükleniyor...' : '🔍 Rapor Oluştur'}
                </Button>
              </div>
            </div>
          </div>

          {employeeReport && employeeReport.length > 0 && (
            <>
              {/* Personel Bilgileri */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">PERSONEL BİLGİLERİ</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Ad Soyad:</span>
                    <p className="text-base font-semibold text-gray-900">{employeeReport[0]?.employees?.full_name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Birim:</span>
                    <p className="text-base text-gray-900">{employeeReport[0]?.employees?.position || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Günlük Ücret:</span>
                    <p className="text-base text-gray-900">{formatCurrency((employeeReport[0]?.employees?.salary || 0) / 30)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Aylık Maaş:</span>
                    <p className="text-base text-gray-900">{formatCurrency(employeeReport[0]?.employees?.salary || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Devam Durumu */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">DEVAM DURUMU</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tam Gün</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Yarım Gün</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">İzinli</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Raporlu</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Gelmedi</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Toplam Çalışılan</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Mesai (Saat)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      <tr>
                        <td className="px-6 py-4 text-center text-lg font-semibold text-gray-900">
                          {employeeReport.filter(r => r.status === 'Tam Gün').length}
                        </td>
                        <td className="px-6 py-4 text-center text-lg font-semibold text-gray-900">
                          {employeeReport.filter(r => r.status === 'Yarım Gün').length}
                        </td>
                        <td className="px-6 py-4 text-center text-lg font-semibold text-gray-900">
                          {employeeReport.filter(r => r.status === 'İzinli').length}
                        </td>
                        <td className="px-6 py-4 text-center text-lg font-semibold text-gray-900">
                          {employeeReport.filter(r => r.status === 'Raporlu').length}
                        </td>
                        <td className="px-6 py-4 text-center text-lg font-semibold text-gray-900">
                          {employeeReport.filter(r => r.status === 'Yok' || r.status === 'Gelmedi').length}
                        </td>
                        <td className="px-6 py-4 text-center text-lg font-bold text-gray-900">
                          {(employeeReport.filter(r => r.status === 'Tam Gün').length + employeeReport.filter(r => r.status === 'Yarım Gün').length * 0.5).toFixed(1)}
                        </td>
                        <td className="px-6 py-4 text-center text-lg font-semibold text-gray-900">
                          {employeeReport.reduce((sum, r) => {
                            const dayMultiplier = r.status === 'Tam Gün' ? 1 : r.status === 'Yarım Gün' ? 0.5 : 0
                            return sum + (dayMultiplier > 0 ? (r.overtime_hours || 0) : 0)
                          }, 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mali Özet */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">MALİ ÖZET</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <tbody className="divide-y divide-gray-200">
                      {(() => {
                        const dailyWage = (employeeReport[0]?.employees?.salary || 0) / 30
                        const totalDays = employeeReport.filter(r => r.status === 'Tam Gün').length + employeeReport.filter(r => r.status === 'Yarım Gün').length * 0.5
                        const totalOvertime = employeeReport.reduce((sum, r) => {
                          const dayMultiplier = r.status === 'Tam Gün' ? 1 : r.status === 'Yarım Gün' ? 0.5 : 0
                          return sum + (dayMultiplier > 0 ? (r.overtime_hours || 0) : 0)
                        }, 0)
                        const workEarnings = totalDays * dailyWage
                        const overtimeEarnings = totalOvertime * (dailyWage / 9)
                        const grossEarnings = workEarnings + overtimeEarnings

                        return (
                          <>
                            <tr>
                              <td className="px-6 py-3 text-sm text-gray-700">Çalışma Ücreti</td>
                              <td className="px-6 py-3 text-sm text-gray-500">{totalDays.toFixed(1)} gün × {formatCurrency(dailyWage)}</td>
                              <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">{formatCurrency(workEarnings)}</td>
                            </tr>
                            <tr>
                              <td className="px-6 py-3 text-sm text-gray-700">Mesai Ücreti</td>
                              <td className="px-6 py-3 text-sm text-gray-500">{totalOvertime} saat × {formatCurrency(dailyWage / 9)}</td>
                              <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">{formatCurrency(overtimeEarnings)}</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="px-6 py-4 text-base font-bold text-gray-900" colSpan="2">BRÜT KAZANÇ</td>
                              <td className="px-6 py-4 text-right text-base font-bold text-gray-900">{formatCurrency(grossEarnings)}</td>
                            </tr>
                            <tr>
                              <td className="px-6 py-3 text-sm text-gray-700">Avanslar</td>
                              <td className="px-6 py-3 text-sm text-gray-500"></td>
                              <td className="px-6 py-3 text-right text-sm text-red-600">-{formatCurrency(0)}</td>
                            </tr>
                            <tr>
                              <td className="px-6 py-3 text-sm text-gray-700">Kesintiler</td>
                              <td className="px-6 py-3 text-sm text-gray-500"></td>
                              <td className="px-6 py-3 text-right text-sm text-red-600">-{formatCurrency(0)}</td>
                            </tr>
                            <tr className="bg-green-50">
                              <td className="px-6 py-4 text-base font-bold text-gray-900" colSpan="2">NET ÖDEME</td>
                              <td className="px-6 py-4 text-right text-lg font-bold text-green-600">{formatCurrency(grossEarnings)}</td>
                            </tr>
                          </>
                        )
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Puantaj Detayları */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">PUANTAJ DETAYLARI</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => exportEmployeeReportToExcel(employeeReport, employeeStartDate, employeeEndDate)}
                    >
                      📊 Excel
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => exportEmployeeReportToPDF(employeeReport, employeeStartDate, employeeEndDate)}
                    >
                      📄 PDF
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gün</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Durum</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proje</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Mesai</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employeeReport.map((record, index) => {
                      const date = new Date(record.work_date + 'T12:00:00')
                      const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6

                      return (
                        <tr key={index} className={`${isWeekend ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(record.work_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {dayNames[date.getDay()]}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-semibold ${
                              record.status === 'Tam Gün' ? 'bg-green-100 text-green-700' :
                              record.status === 'Yarım Gün' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {record.status === 'Tam Gün' ? '●' : record.status === 'Yarım Gün' ? '◐' : '○'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {record.location_name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                            {record.overtime_hours || '-'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            </>
          )}

          {employeeReport === null && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <p className="text-blue-800">
                👤 Personel bazlı puantaj raporu için personel ve tarih aralığı seçip "Rapor Oluştur" butonuna tıklayın.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
