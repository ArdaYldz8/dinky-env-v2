import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

// Company branding colors
const COLORS = {
  primary: '#4F46E5',      // Indigo
  secondary: '#6366F1',    // Light Indigo
  success: '#10B981',      // Green
  warning: '#F59E0B',      // Amber
  danger: '#EF4444',       // Red
  dark: '#1F2937',         // Gray 800
  light: '#F9FAFB',        // Gray 50
  border: '#E5E7EB'        // Gray 200
}

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

// RGB converter for hex colors
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0]
}

// Turkish character mapper for PDF compatibility
const turkishToAscii = (text) => {
  if (typeof text !== 'string') return text

  const charMap = {
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U'
  }

  return text.replace(/[çÇğĞıİöÖşŞüÜ]/g, match => charMap[match] || match)
}

// Add professional header to PDF
const addPDFHeader = (doc, title, subtitle = '') => {
  const pageWidth = doc.internal.pageSize.width

  // Header background
  doc.setFillColor(...hexToRgb(COLORS.primary))
  doc.rect(0, 0, pageWidth, 35, 'F')

  // Company name
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('DINKY ERP', 14, 15)

  // Title
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text(title, 14, 25)

  // Subtitle and date
  if (subtitle) {
    doc.setFontSize(10)
    doc.text(subtitle, 14, 32)
  }

  // Generation date (right aligned)
  doc.setFontSize(9)
  const dateText = `Olusturma: ${new Date().toLocaleString('tr-TR')}`
  const dateWidth = doc.getTextWidth(dateText)
  doc.text(dateText, pageWidth - dateWidth - 14, 32)

  return 40 // Return starting Y position for content
}

// Add professional footer to PDF
const addPDFFooter = (doc) => {
  const pageCount = doc.internal.getNumberOfPages()
  const pageHeight = doc.internal.pageSize.height
  const pageWidth = doc.internal.pageSize.width

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    // Footer line
    doc.setDrawColor(...hexToRgb(COLORS.border))
    doc.setLineWidth(0.5)
    doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15)

    // Page number
    doc.setFontSize(9)
    doc.setTextColor(...hexToRgb(COLORS.dark))
    doc.text(`Sayfa ${i} / ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' })

    // Company info
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text('DINKY ERP - Isletme Yonetim Sistemi', 14, pageHeight - 10)
  }
}

// ========================================
// EXCEL STYLING UTILITIES
// ========================================

const applyExcelStyling = (worksheet, headerRow, dataRows) => {
  const range = XLSX.utils.decode_range(worksheet['!ref'])

  // Column widths
  const colWidths = []
  for (let C = range.s.c; C <= range.e.c; C++) {
    let maxWidth = 10
    for (let R = range.s.r; R <= range.e.r; R++) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
      const cell = worksheet[cellAddress]
      if (cell && cell.v) {
        const cellLength = cell.v.toString().length
        maxWidth = Math.max(maxWidth, cellLength)
      }
    }
    colWidths.push({ wch: Math.min(maxWidth + 2, 50) })
  }
  worksheet['!cols'] = colWidths

  // Header styling
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C })
    if (!worksheet[cellAddress]) continue

    worksheet[cellAddress].s = {
      fill: { fgColor: { rgb: '4F46E5' } },
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      }
    }
  }

  // Total row styling (last row)
  const lastRow = range.e.r
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cellAddress = XLSX.utils.encode_cell({ r: lastRow, c: C })
    if (!worksheet[cellAddress]) continue

    worksheet[cellAddress].s = {
      fill: { fgColor: { rgb: 'E5E7EB' } },
      font: { bold: true, sz: 11 },
      alignment: { horizontal: C === 0 ? 'left' : 'right' },
      border: {
        top: { style: 'medium', color: { rgb: '000000' } },
        bottom: { style: 'medium', color: { rgb: '000000' } }
      }
    }
  }

  // Alternate row colors
  for (let R = 1; R < lastRow; R++) {
    const fillColor = R % 2 === 0 ? 'FFFFFF' : 'F9FAFB'
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
      if (!worksheet[cellAddress]) continue

      worksheet[cellAddress].s = {
        fill: { fgColor: { rgb: fillColor } },
        alignment: { horizontal: C <= 2 ? 'left' : 'right' },
        border: {
          top: { style: 'thin', color: { rgb: 'E5E7EB' } },
          bottom: { style: 'thin', color: { rgb: 'E5E7EB' } }
        }
      }
    }
  }

  return worksheet
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
  applyExcelStyling(worksheet)
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Günlük Rapor')

  const fileName = `Gunluk_Puantaj_${date.replace(/-/g, '_')}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

export const exportDailyReportToPDF = (dailyReport, date) => {
  const doc = new jsPDF('landscape')

  // Add professional header
  const startY = addPDFHeader(doc, 'Gunluk Puantaj Raporu', formatDate(date))

  // Summary statistics
  const fullDay = dailyReport.filter(r => r.status === 'Tam Gün').length
  const halfDay = dailyReport.filter(r => r.status === 'Yarım Gün').length
  const onLeave = dailyReport.filter(r => r.status === 'İzinli').length
  const sick = dailyReport.filter(r => r.status === 'Raporlu').length
  const absent = dailyReport.filter(r => r.status === 'Yok' || r.status === 'Gelmedi').length

  // Stats boxes
  doc.setFontSize(10)
  const statsY = startY + 5
  const boxWidth = 50
  const boxHeight = 20
  let currentX = 14

  const stats = [
    { label: 'Tam Gun', value: fullDay, color: COLORS.success },
    { label: 'Yarim Gun', value: halfDay, color: COLORS.warning },
    { label: 'Izinli', value: onLeave, color: COLORS.secondary },
    { label: 'Raporlu', value: sick, color: '#F97316' },
    { label: 'Gelmedi', value: absent, color: COLORS.danger }
  ]

  stats.forEach(stat => {
    // Box background
    doc.setFillColor(...hexToRgb(stat.color))
    doc.roundedRect(currentX, statsY, boxWidth, boxHeight, 3, 3, 'F')

    // Label
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(stat.label, currentX + boxWidth / 2, statsY + 8, { align: 'center' })

    // Value
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(stat.value.toString(), currentX + boxWidth / 2, statsY + 16, { align: 'center' })

    currentX += boxWidth + 5
  })

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
      turkishToAscii(record.employees?.full_name || '-'),
      turkishToAscii(record.employees?.position || '-'),
      turkishToAscii(record.location_name || '-'),
      turkishToAscii(record.status),
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

  autoTable(doc, {
    startY: statsY + boxHeight + 10,
    head: [['Personel', 'Departman', 'Proje', 'Durum', 'Mesai', 'Gunluk Ucret', 'Mesai Ucreti', 'Toplam']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: hexToRgb(COLORS.border),
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: hexToRgb(COLORS.primary),
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: hexToRgb(COLORS.light)
    },
    footStyles: {
      fillColor: hexToRgb(COLORS.border),
      textColor: hexToRgb(COLORS.dark),
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 30 },
      2: { cellWidth: 40 },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 30, halign: 'right' },
      6: { cellWidth: 30, halign: 'right' },
      7: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
    }
  })

  addPDFFooter(doc)
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
  applyExcelStyling(worksheet)
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Haftalık Rapor')

  const startDate = formatDate(weeklyReport.startDate)
  const endDate = formatDate(weeklyReport.endDate)
  const fileName = `Haftalik_Rapor_${startDate.replace(/\./g, '_')}_${endDate.replace(/\./g, '_')}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

export const exportWeeklyReportToPDF = (weeklyReport) => {
  const doc = new jsPDF('landscape')

  const startY = addPDFHeader(
    doc,
    'Haftalik Rapor',
    `${formatDate(weeklyReport.startDate)} - ${formatDate(weeklyReport.endDate)}`
  )

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
      if (status === 'Tam Gün') return '✓'
      if (status === 'Yarım Gün') return '½'
      return '✗'
    }

    return [
      turkishToAscii(emp.employee),
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

  autoTable(doc, {
    startY: startY + 5,
    head: [['Personel', 'Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt', 'Paz', 'Toplam', 'Mesai', 'Kazanc']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: hexToRgb(COLORS.border),
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: hexToRgb(COLORS.primary),
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: hexToRgb(COLORS.light)
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 15, halign: 'center' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 15, halign: 'center' },
      6: { cellWidth: 15, halign: 'center' },
      7: { cellWidth: 15, halign: 'center' },
      8: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      9: { cellWidth: 20, halign: 'center' },
      10: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
    }
  })

  addPDFFooter(doc)
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
  applyExcelStyling(worksheet)
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Aylık Bordro')

  const monthNames = ['Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran',
    'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik']
  const fileName = `Aylik_Bordro_${monthNames[month - 1]}_${year}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

export const exportMonthlyReportToPDF = (monthlyReport, month, year) => {
  const doc = new jsPDF('landscape')

  const monthNames = ['Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran',
    'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik']

  const startY = addPDFHeader(doc, 'Aylik Bordro Raporu', `${monthNames[month - 1]} ${year}`)

  const tableData = monthlyReport.map(emp => [
    turkishToAscii(emp.employee),
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

  autoTable(doc, {
    startY: startY + 5,
    head: [['Personel', 'Gunluk', 'Tam', 'Yarim', 'Yok', 'Top.', 'Mesai', 'M.Ucret', 'Brut', 'Avans', 'Kesinti', 'Net']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 2,
      lineColor: hexToRgb(COLORS.border),
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: hexToRgb(COLORS.primary),
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: hexToRgb(COLORS.light)
    },
    footStyles: {
      fillColor: hexToRgb(COLORS.border),
      textColor: hexToRgb(COLORS.dark),
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 22, halign: 'right' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 15, halign: 'center' },
      7: { cellWidth: 22, halign: 'right' },
      8: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
      9: { cellWidth: 22, halign: 'right' },
      10: { cellWidth: 22, halign: 'right' },
      11: { cellWidth: 25, halign: 'right', fontStyle: 'bold', fillColor: hexToRgb(COLORS.success), textColor: 255 }
    }
  })

  addPDFFooter(doc)
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

  // Calculate stats
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
  const workEarnings = totalDays * dailyWage
  const overtimeEarnings = totalOvertime * (dailyWage / 9)
  const grossEarnings = workEarnings + overtimeEarnings

  // Summary sheet with complete info
  const summaryData = [
    { 'Alan': 'PERSONEL BİLGİLERİ', 'Değer': '' },
    { 'Alan': 'Ad Soyad', 'Değer': employeeName },
    { 'Alan': 'Birim', 'Değer': position },
    { 'Alan': 'Günlük Ücret', 'Değer': dailyWage },
    { 'Alan': 'Aylık Maaş', 'Değer': salary },
    { 'Alan': 'Dönem', 'Değer': `${formatDate(startDate)} - ${formatDate(endDate)}` },
    { 'Alan': '', 'Değer': '' },
    { 'Alan': 'DEVAM DURUMU', 'Değer': '' },
    { 'Alan': 'Tam Gün', 'Değer': fullDays },
    { 'Alan': 'Yarım Gün', 'Değer': halfDays },
    { 'Alan': 'İzinli', 'Değer': onLeave },
    { 'Alan': 'Raporlu', 'Değer': sick },
    { 'Alan': 'Gelmedi', 'Değer': absent },
    { 'Alan': 'Toplam Çalışılan', 'Değer': totalDays.toFixed(1) + ' gün' },
    { 'Alan': 'Toplam Mesai', 'Değer': totalOvertime + ' saat' },
    { 'Alan': '', 'Değer': '' },
    { 'Alan': 'MALİ ÖZET', 'Değer': '' },
    { 'Alan': 'Çalışma Ücreti', 'Değer': workEarnings },
    { 'Alan': 'Mesai Ücreti', 'Değer': overtimeEarnings },
    { 'Alan': 'BRÜT KAZANÇ', 'Değer': grossEarnings },
    { 'Alan': 'Avanslar', 'Değer': 0 },
    { 'Alan': 'Kesintiler', 'Değer': 0 },
    { 'Alan': 'NET ÖDEME', 'Değer': grossEarnings }
  ]

  const summarySheet = XLSX.utils.json_to_sheet(summaryData)

  // Apply custom styling to summary
  const summaryRange = XLSX.utils.decode_range(summarySheet['!ref'])
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 35 }]

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Özet')

  // Detail sheet
  const detailData = employeeReport.map(record => {
    const date = new Date(record.work_date + 'T12:00:00')
    const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']

    return {
      'Tarih': formatDate(record.work_date),
      'Gün': dayNames[date.getDay()],
      'Durum': record.status,
      'Proje': record.location_name || '-',
      'Mesai (Saat)': record.overtime_hours || 0
    }
  })

  const detailSheet = XLSX.utils.json_to_sheet(detailData)
  applyExcelStyling(detailSheet)
  XLSX.utils.book_append_sheet(workbook, detailSheet, 'Detay')

  const fileName = `Personel_Rapor_${employeeName.replace(/\s/g, '_')}_${startDate}_${endDate}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

export const exportEmployeeReportToPDF = (employeeReport, startDate, endDate) => {
  const doc = new jsPDF()

  const employeeName = employeeReport[0]?.employees?.full_name || 'Personel'
  const position = employeeReport[0]?.employees?.position || '-'
  const salary = employeeReport[0]?.employees?.salary || 0
  const dailyWage = salary / 30

  // Calculate stats
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
  const workEarnings = totalDays * dailyWage
  const overtimeEarnings = totalOvertime * (dailyWage / 9)
  const grossEarnings = workEarnings + overtimeEarnings

  const startY = addPDFHeader(doc, 'Personel Puantaj Raporu', `${formatDate(startDate)} - ${formatDate(endDate)}`)

  // Info section with 3 columns
  const infoY = startY + 5

  // Column 1: Employee Info
  doc.setFillColor(...hexToRgb(COLORS.light))
  doc.roundedRect(14, infoY, 58, 35, 2, 2, 'F')
  doc.setTextColor(...hexToRgb(COLORS.dark))
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('PERSONEL', 17, infoY + 5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(turkishToAscii(employeeName), 17, infoY + 11)
  doc.text(turkishToAscii(position), 17, infoY + 16)
  doc.setFontSize(7)
  doc.text(`Gunluk: ${formatCurrency(dailyWage)}`, 17, infoY + 22)
  doc.text(`Aylik: ${formatCurrency(salary)}`, 17, infoY + 27)

  // Column 2: Attendance Stats
  doc.setFillColor(...hexToRgb(COLORS.light))
  doc.roundedRect(74, infoY, 58, 35, 2, 2, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('DEVAM DURUMU', 77, infoY + 5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`Tam Gun: ${fullDays}  Yarim: ${halfDays}`, 77, infoY + 11)
  doc.text(`Izinli: ${onLeave}  Raporlu: ${sick}`, 77, infoY + 16)
  doc.text(`Gelmedi: ${absent}`, 77, infoY + 21)
  doc.setFont('helvetica', 'bold')
  doc.text(`Toplam: ${totalDays.toFixed(1)} gun`, 77, infoY + 27)

  // Column 3: Financial Summary
  doc.setFillColor(...hexToRgb(COLORS.success))
  doc.roundedRect(134, infoY, 62, 35, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('MALI OZET', 137, infoY + 5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`Calisma: ${formatCurrency(workEarnings)}`, 137, infoY + 11)
  doc.text(`Mesai: ${formatCurrency(overtimeEarnings)}`, 137, infoY + 16)
  doc.text(`(${totalOvertime} saat)`, 137, infoY + 21)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(`${formatCurrency(grossEarnings)}`, 137, infoY + 29)

  // Detail table
  doc.setTextColor(...hexToRgb(COLORS.dark))
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Puantaj Detaylari', 14, infoY + 45)

  const tableData = employeeReport.map(record => {
    const date = new Date(record.work_date + 'T12:00:00')
    const dayNames = ['Pz', 'Pt', 'Sa', 'Ca', 'Pe', 'Cu', 'Ct']

    return [
      formatDate(record.work_date),
      dayNames[date.getDay()],
      turkishToAscii(record.status),
      turkishToAscii(record.location_name || '-'),
      record.overtime_hours || '-'
    ]
  })

  autoTable(doc, {
    startY: infoY + 50,
    head: [['Tarih', 'Gun', 'Durum', 'Proje', 'Mesai']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: hexToRgb(COLORS.border),
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: hexToRgb(COLORS.primary),
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: hexToRgb(COLORS.light)
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 70 },
      4: { cellWidth: 25, halign: 'center' }
    }
  })

  addPDFFooter(doc)
  doc.save(`Personel_Rapor_${employeeName.replace(/\s/g, '_')}_${startDate}_${endDate}.pdf`)
}
