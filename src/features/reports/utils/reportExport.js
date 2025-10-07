import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

// Format currency for export
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

// Format date for export
const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('tr-TR')
}

// Add Turkish font support to jsPDF (basic ASCII for now)
const addTurkishSupport = (doc) => {
  // Note: For full Turkish character support, you may need to add custom fonts
  // This is a basic implementation that works with standard characters
  doc.setLanguage('tr')
}

// ========================================
// DAILY REPORT EXPORTS
// ========================================

export const exportDailyReportToExcel = (dailyReport, date) => {
  const workbook = XLSX.utils.book_new()

  // Prepare data
  const data = dailyReport.map(record => {
    const monthlySalary = parseFloat(record.employees?.salary || 0)
    const dailyWage = monthlySalary / 30
    const overtimeHours = parseFloat(record.overtime_hours || 0)
    const dayMultiplier = record.status === 'Tam Gün' ? 1 :
                        record.status === 'Yarım Gün' ? 0.5 : 0
    const dayPayment = dailyWage * dayMultiplier
    const overtimePayment = dayMultiplier > 0 ? (overtimeHours * dailyWage) / 9 : 0
    const totalPayment = dayPayment + overtimePayment

    return {
      'Personel': record.employees?.full_name || '-',
      'Departman': record.employees?.position || '-',
      'Proje': record.location_name || '-',
      'Durum': record.status,
      'Ek Mesai (Saat)': overtimeHours,
      'Günlük Ücret': dayPayment,
      'Mesai Ücreti': overtimePayment,
      'Toplam': totalPayment
    }
  })

  // Add summary row
  const totalDayPayment = dailyReport.reduce((sum, record) => {
    const monthlySalary = parseFloat(record.employees?.salary || 0)
    const dailyWage = monthlySalary / 30
    const dayMultiplier = record.status === 'Tam Gün' ? 1 :
                        record.status === 'Yarım Gün' ? 0.5 : 0
    return sum + (dailyWage * dayMultiplier)
  }, 0)

  const totalOvertimePayment = dailyReport.reduce((sum, record) => {
    const monthlySalary = parseFloat(record.employees?.salary || 0)
    const dailyWage = monthlySalary / 30
    const overtimeHours = parseFloat(record.overtime_hours || 0)
    const dayMultiplier = record.status === 'Tam Gün' ? 1 :
                        record.status === 'Yarım Gün' ? 0.5 : 0
    return sum + (dayMultiplier > 0 ? (overtimeHours * dailyWage) / 9 : 0)
  }, 0)

  data.push({
    'Personel': 'TOPLAM',
    'Departman': '',
    'Proje': '',
    'Durum': '',
    'Ek Mesai (Saat)': '',
    'Günlük Ücret': totalDayPayment,
    'Mesai Ücreti': totalOvertimePayment,
    'Toplam': totalDayPayment + totalOvertimePayment
  })

  const worksheet = XLSX.utils.json_to_sheet(data)
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Günlük Rapor')

  const fileName = `Gunluk_Puantaj_${date.replace(/-/g, '_')}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

export const exportDailyReportToPDF = (dailyReport, date) => {
  const doc = new jsPDF('landscape')
  addTurkishSupport(doc)

  // Title
  doc.setFontSize(16)
  doc.text(`Gunluk Puantaj Raporu - ${formatDate(date)}`, 14, 15)

  // Summary statistics
  doc.setFontSize(10)
  const fullDay = dailyReport.filter(r => r.status === 'Tam Gün').length
  const halfDay = dailyReport.filter(r => r.status === 'Yarım Gün').length
  const onLeave = dailyReport.filter(r => r.status === 'İzinli').length
  const sick = dailyReport.filter(r => r.status === 'Raporlu').length
  const absent = dailyReport.filter(r => r.status === 'Yok' || r.status === 'Gelmedi').length

  doc.text(`Tam Gun: ${fullDay} | Yarim Gun: ${halfDay} | Izinli: ${onLeave} | Raporlu: ${sick} | Gelmedi: ${absent}`, 14, 25)

  // Table data
  const tableData = dailyReport.map(record => {
    const monthlySalary = parseFloat(record.employees?.salary || 0)
    const dailyWage = monthlySalary / 30
    const overtimeHours = parseFloat(record.overtime_hours || 0)
    const dayMultiplier = record.status === 'Tam Gün' ? 1 :
                        record.status === 'Yarım Gün' ? 0.5 : 0
    const dayPayment = dailyWage * dayMultiplier
    const overtimePayment = dayMultiplier > 0 ? (overtimeHours * dailyWage) / 9 : 0
    const totalPayment = dayPayment + overtimePayment

    return [
      record.employees?.full_name || '-',
      record.employees?.position || '-',
      record.location_name || '-',
      record.status,
      overtimeHours,
      formatCurrency(dayPayment),
      formatCurrency(overtimePayment),
      formatCurrency(totalPayment)
    ]
  })

  // Add summary row
  const totalDayPayment = dailyReport.reduce((sum, record) => {
    const monthlySalary = parseFloat(record.employees?.salary || 0)
    const dailyWage = monthlySalary / 30
    const dayMultiplier = record.status === 'Tam Gün' ? 1 :
                        record.status === 'Yarım Gün' ? 0.5 : 0
    return sum + (dailyWage * dayMultiplier)
  }, 0)

  const totalOvertimePayment = dailyReport.reduce((sum, record) => {
    const monthlySalary = parseFloat(record.employees?.salary || 0)
    const dailyWage = monthlySalary / 30
    const overtimeHours = parseFloat(record.overtime_hours || 0)
    const dayMultiplier = record.status === 'Tam Gün' ? 1 :
                        record.status === 'Yarım Gün' ? 0.5 : 0
    return sum + (dayMultiplier > 0 ? (overtimeHours * dailyWage) / 9 : 0)
  }, 0)

  tableData.push([
    'TOPLAM',
    '',
    '',
    '',
    '',
    formatCurrency(totalDayPayment),
    formatCurrency(totalOvertimePayment),
    formatCurrency(totalDayPayment + totalOvertimePayment)
  ])

  doc.autoTable({
    startY: 30,
    head: [['Personel', 'Departman', 'Proje', 'Durum', 'Mesai (Saat)', 'Gunluk Ucret', 'Mesai Ucreti', 'Toplam']],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    footStyles: { fillColor: [229, 231, 235], fontStyle: 'bold' }
  })

  doc.save(`Gunluk_Puantaj_${date.replace(/-/g, '_')}.pdf`)
}

// ========================================
// WEEKLY REPORT EXPORTS
// ========================================

export const exportWeeklyReportToExcel = (weeklyReport) => {
  const workbook = XLSX.utils.book_new()

  const data = weeklyReport.data.map(emp => {
    const totalDays = emp.records.filter(r => r.status === 'Tam Gün').length +
                     emp.records.filter(r => r.status === 'Yarım Gün').length * 0.5
    const totalOvertime = emp.records.reduce((sum, r) => {
      const dayMultiplier = r.status === 'Tam Gün' ? 1 : r.status === 'Yarım Gün' ? 0.5 : 0
      return sum + (dayMultiplier > 0 ? (r.overtime_hours || 0) : 0)
    }, 0)
    const totalEarnings = emp.records.reduce((sum, r) => {
      const dailyWage = emp.dailyWage
      const dayMultiplier = r.status === 'Tam Gün' ? 1 : r.status === 'Yarım Gün' ? 0.5 : 0
      const overtimePayment = dayMultiplier > 0 ? (r.overtime_hours || 0) * (dailyWage / 9) : 0
      return sum + (dailyWage * dayMultiplier) + overtimePayment
    }, 0)

    // Get daily status
    const dayRecords = {}
    emp.records.forEach(record => {
      const date = new Date(record.work_date + 'T12:00:00')
      const dayNum = date.getDay()
      dayRecords[dayNum] = record.status
    })

    const getSymbol = (status) => {
      if (!status) return '-'
      if (status === 'Tam Gün') return '✓'
      if (status === 'Yarım Gün') return '½'
      return '✗'
    }

    return {
      'Personel': emp.employee,
      'Pazartesi': getSymbol(dayRecords[1]),
      'Salı': getSymbol(dayRecords[2]),
      'Çarşamba': getSymbol(dayRecords[3]),
      'Perşembe': getSymbol(dayRecords[4]),
      'Cuma': getSymbol(dayRecords[5]),
      'Cumartesi': getSymbol(dayRecords[6]),
      'Pazar': getSymbol(dayRecords[0]),
      'Toplam Gün': totalDays.toFixed(1),
      'Mesai': totalOvertime,
      'Kazanç': totalEarnings
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(data)
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Haftalık Rapor')

  const startDate = formatDate(weeklyReport.startDate)
  const endDate = formatDate(weeklyReport.endDate)
  const fileName = `Haftalik_Rapor_${startDate.replace(/\./g, '_')}_${endDate.replace(/\./g, '_')}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

export const exportWeeklyReportToPDF = (weeklyReport) => {
  const doc = new jsPDF('landscape')
  addTurkishSupport(doc)

  doc.setFontSize(16)
  doc.text(`Haftalik Rapor - ${formatDate(weeklyReport.startDate)} / ${formatDate(weeklyReport.endDate)}`, 14, 15)

  const tableData = weeklyReport.data.map(emp => {
    const totalDays = emp.records.filter(r => r.status === 'Tam Gün').length +
                     emp.records.filter(r => r.status === 'Yarım Gün').length * 0.5
    const totalOvertime = emp.records.reduce((sum, r) => {
      const dayMultiplier = r.status === 'Tam Gün' ? 1 : r.status === 'Yarım Gün' ? 0.5 : 0
      return sum + (dayMultiplier > 0 ? (r.overtime_hours || 0) : 0)
    }, 0)
    const totalEarnings = emp.records.reduce((sum, r) => {
      const dailyWage = emp.dailyWage
      const dayMultiplier = r.status === 'Tam Gün' ? 1 : r.status === 'Yarım Gün' ? 0.5 : 0
      const overtimePayment = dayMultiplier > 0 ? (r.overtime_hours || 0) * (dailyWage / 9) : 0
      return sum + (dailyWage * dayMultiplier) + overtimePayment
    }, 0)

    const dayRecords = {}
    emp.records.forEach(record => {
      const date = new Date(record.work_date + 'T12:00:00')
      const dayNum = date.getDay()
      dayRecords[dayNum] = record.status
    })

    const getSymbol = (status) => {
      if (!status) return '-'
      if (status === 'Tam Gün') return 'T'
      if (status === 'Yarım Gün') return 'Y'
      return 'X'
    }

    return [
      emp.employee,
      getSymbol(dayRecords[1]),
      getSymbol(dayRecords[2]),
      getSymbol(dayRecords[3]),
      getSymbol(dayRecords[4]),
      getSymbol(dayRecords[5]),
      getSymbol(dayRecords[6]),
      getSymbol(dayRecords[0]),
      totalDays.toFixed(1),
      totalOvertime,
      formatCurrency(totalEarnings)
    ]
  })

  doc.autoTable({
    startY: 25,
    head: [['Personel', 'Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt', 'Paz', 'Toplam', 'Mesai', 'Kazanc']],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] }
  })

  const startDate = formatDate(weeklyReport.startDate)
  const endDate = formatDate(weeklyReport.endDate)
  doc.save(`Haftalik_Rapor_${startDate.replace(/\./g, '_')}_${endDate.replace(/\./g, '_')}.pdf`)
}

// ========================================
// MONTHLY REPORT EXPORTS
// ========================================

export const exportMonthlyReportToExcel = (monthlyReport, month, year) => {
  const workbook = XLSX.utils.book_new()

  const data = monthlyReport.map(emp => ({
    'Personel': emp.employee,
    'Günlük Ücret': emp.dailyWage,
    'Tam Gün': emp.fullDays,
    'Yarım Gün': emp.halfDays,
    'Gelmedi': emp.absentDays,
    'Toplam Gün': emp.totalDays,
    'Ek Mesai': emp.overtimeHours || 0,
    'Ek Mesai Ücreti': emp.overtimePayment || 0,
    'Brüt Maaş': emp.grossSalary,
    'Avanslar': 0,
    'Kesintiler': 0,
    'Net Maaş': emp.netSalary
  }))

  // Add summary row
  data.push({
    'Personel': 'TOPLAM',
    'Günlük Ücret': '',
    'Tam Gün': '',
    'Yarım Gün': '',
    'Gelmedi': '',
    'Toplam Gün': '',
    'Ek Mesai': monthlyReport.reduce((sum, emp) => sum + (emp.overtimeHours || 0), 0),
    'Ek Mesai Ücreti': monthlyReport.reduce((sum, emp) => sum + (emp.overtimePayment || 0), 0),
    'Brüt Maaş': monthlyReport.reduce((sum, emp) => sum + emp.grossSalary, 0),
    'Avanslar': 0,
    'Kesintiler': 0,
    'Net Maaş': monthlyReport.reduce((sum, emp) => sum + emp.netSalary, 0)
  })

  const worksheet = XLSX.utils.json_to_sheet(data)
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Aylık Bordro')

  const monthNames = ['Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran',
    'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik']
  const fileName = `Aylik_Bordro_${monthNames[month - 1]}_${year}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

export const exportMonthlyReportToPDF = (monthlyReport, month, year) => {
  const doc = new jsPDF('landscape')
  addTurkishSupport(doc)

  const monthNames = ['Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran',
    'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik']

  doc.setFontSize(16)
  doc.text(`Aylik Bordro Raporu - ${monthNames[month - 1]} ${year}`, 14, 15)

  const tableData = monthlyReport.map(emp => [
    emp.employee,
    formatCurrency(emp.dailyWage),
    emp.fullDays,
    emp.halfDays,
    emp.absentDays,
    emp.totalDays.toFixed(1),
    emp.overtimeHours || 0,
    formatCurrency(emp.overtimePayment || 0),
    formatCurrency(emp.grossSalary),
    formatCurrency(0),
    formatCurrency(0),
    formatCurrency(emp.netSalary)
  ])

  // Add summary row
  tableData.push([
    'TOPLAM',
    '',
    '',
    '',
    '',
    '',
    monthlyReport.reduce((sum, emp) => sum + (emp.overtimeHours || 0), 0),
    formatCurrency(monthlyReport.reduce((sum, emp) => sum + (emp.overtimePayment || 0), 0)),
    formatCurrency(monthlyReport.reduce((sum, emp) => sum + emp.grossSalary, 0)),
    formatCurrency(0),
    formatCurrency(0),
    formatCurrency(monthlyReport.reduce((sum, emp) => sum + emp.netSalary, 0))
  ])

  doc.autoTable({
    startY: 25,
    head: [['Personel', 'Gunluk Ucret', 'Tam Gun', 'Yarim', 'Yok', 'Toplam', 'Mesai', 'Mesai Ucret', 'Brut', 'Avans', 'Kesinti', 'Net']],
    body: tableData,
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    footStyles: { fillColor: [229, 231, 235], fontStyle: 'bold' }
  })

  doc.save(`Aylik_Bordro_${monthNames[month - 1]}_${year}.pdf`)
}

// ========================================
// EMPLOYEE REPORT EXPORTS
// ========================================

export const exportEmployeeReportToExcel = (employeeReport, startDate, endDate) => {
  const workbook = XLSX.utils.book_new()

  const employeeName = employeeReport[0]?.employees?.full_name || 'Personel'
  const position = employeeReport[0]?.employees?.position || '-'
  const salary = employeeReport[0]?.employees?.salary || 0
  const dailyWage = salary / 30

  // Summary data
  const summaryData = [
    { 'Bilgi': 'Ad Soyad', 'Değer': employeeName },
    { 'Bilgi': 'Birim', 'Değer': position },
    { 'Bilgi': 'Günlük Ücret', 'Değer': dailyWage },
    { 'Bilgi': 'Aylık Maaş', 'Değer': salary },
    {},
    { 'Bilgi': 'Tam Gün', 'Değer': employeeReport.filter(r => r.status === 'Tam Gün').length },
    { 'Bilgi': 'Yarım Gün', 'Değer': employeeReport.filter(r => r.status === 'Yarım Gün').length },
    { 'Bilgi': 'İzinli', 'Değer': employeeReport.filter(r => r.status === 'İzinli').length },
    { 'Bilgi': 'Raporlu', 'Değer': employeeReport.filter(r => r.status === 'Raporlu').length },
    { 'Bilgi': 'Gelmedi', 'Değer': employeeReport.filter(r => r.status === 'Yok' || r.status === 'Gelmedi').length },
    { 'Bilgi': 'Toplam Çalışılan', 'Değer': (employeeReport.filter(r => r.status === 'Tam Gün').length + employeeReport.filter(r => r.status === 'Yarım Gün').length * 0.5).toFixed(1) }
  ]

  const summarySheet = XLSX.utils.json_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Özet')

  // Detail data
  const detailData = employeeReport.map(record => {
    const date = new Date(record.work_date + 'T12:00:00')
    const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']

    return {
      'Tarih': formatDate(record.work_date),
      'Gün': dayNames[date.getDay()],
      'Durum': record.status,
      'Proje': record.location_name || '-',
      'Mesai': record.overtime_hours || 0
    }
  })

  const detailSheet = XLSX.utils.json_to_sheet(detailData)
  XLSX.utils.book_append_sheet(workbook, detailSheet, 'Detay')

  const fileName = `Personel_Rapor_${employeeName.replace(/\s/g, '_')}_${startDate}_${endDate}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

export const exportEmployeeReportToPDF = (employeeReport, startDate, endDate) => {
  const doc = new jsPDF()
  addTurkishSupport(doc)

  const employeeName = employeeReport[0]?.employees?.full_name || 'Personel'
  const position = employeeReport[0]?.employees?.position || '-'
  const salary = employeeReport[0]?.employees?.salary || 0
  const dailyWage = salary / 30

  // Title
  doc.setFontSize(16)
  doc.text(`Personel Puantaj Raporu`, 14, 15)

  // Employee info
  doc.setFontSize(10)
  doc.text(`Ad Soyad: ${employeeName}`, 14, 25)
  doc.text(`Birim: ${position}`, 14, 31)
  doc.text(`Donem: ${formatDate(startDate)} - ${formatDate(endDate)}`, 14, 37)

  // Summary
  doc.setFontSize(12)
  doc.text('Devam Durumu', 14, 47)

  const fullDays = employeeReport.filter(r => r.status === 'Tam Gün').length
  const halfDays = employeeReport.filter(r => r.status === 'Yarım Gün').length
  const onLeave = employeeReport.filter(r => r.status === 'İzinli').length
  const sick = employeeReport.filter(r => r.status === 'Raporlu').length
  const absent = employeeReport.filter(r => r.status === 'Yok' || r.status === 'Gelmedi').length
  const totalDays = fullDays + halfDays * 0.5
  const totalOvertime = employeeReport.reduce((sum, r) => {
    const dayMultiplier = r.status === 'Tam Gün' ? 1 : r.status === 'Yarım Gün' ? 0.5 : 0
    return sum + (dayMultiplier > 0 ? (r.overtime_hours || 0) : 0)
  }, 0)

  doc.setFontSize(10)
  doc.text(`Tam Gun: ${fullDays} | Yarim Gun: ${halfDays} | Izinli: ${onLeave} | Raporlu: ${sick} | Gelmedi: ${absent}`, 14, 53)
  doc.text(`Toplam Calisilan: ${totalDays.toFixed(1)} gun | Mesai: ${totalOvertime} saat`, 14, 59)

  // Financial summary
  const workEarnings = totalDays * dailyWage
  const overtimeEarnings = totalOvertime * (dailyWage / 9)
  const grossEarnings = workEarnings + overtimeEarnings

  doc.setFontSize(12)
  doc.text('Mali Ozet', 14, 69)
  doc.setFontSize(10)
  doc.text(`Calisma Ucreti: ${formatCurrency(workEarnings)}`, 14, 75)
  doc.text(`Mesai Ucreti: ${formatCurrency(overtimeEarnings)}`, 14, 81)
  doc.text(`BRUT KAZANC: ${formatCurrency(grossEarnings)}`, 14, 87)
  doc.text(`NET ODEME: ${formatCurrency(grossEarnings)}`, 14, 93)

  // Detail table
  doc.setFontSize(12)
  doc.text('Puantaj Detaylari', 14, 103)

  const tableData = employeeReport.map(record => {
    const date = new Date(record.work_date + 'T12:00:00')
    const dayNames = ['Pz', 'Pt', 'Sa', 'Ca', 'Pe', 'Cu', 'Ct']

    return [
      formatDate(record.work_date),
      dayNames[date.getDay()],
      record.status,
      record.location_name || '-',
      record.overtime_hours || '-'
    ]
  })

  doc.autoTable({
    startY: 108,
    head: [['Tarih', 'Gun', 'Durum', 'Proje', 'Mesai']],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] }
  })

  doc.save(`Personel_Rapor_${employeeName.replace(/\s/g, '_')}_${startDate}_${endDate}.pdf`)
}
