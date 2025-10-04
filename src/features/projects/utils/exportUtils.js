import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

export function exportProjectToPDF(project, phases) {
  const doc = new jsPDF()

  // Başlık
  doc.setFontSize(18)
  doc.text(project.project_name, 14, 20)

  doc.setFontSize(11)
  let yPos = 30

  // Proje Bilgileri
  doc.text(`Müşteri: ${project.customers?.company_name || '-'}`, 14, yPos)
  yPos += 7
  doc.text(`Proje Yöneticisi: ${project.employees?.full_name || '-'}`, 14, yPos)
  yPos += 7
  doc.text(`Durum: ${project.status}`, 14, yPos)
  yPos += 7
  if (project.budget) {
    doc.text(`Bütçe: ₺${project.budget.toLocaleString('tr-TR')}`, 14, yPos)
    yPos += 7
  }

  yPos += 5

  // İstatistikler
  const totalPhases = phases.length
  const completedPhases = phases.filter(p => p.status === 'Tamamlandı').length
  const totalTasks = phases.reduce((sum, p) => sum + (p.tasks?.length || 0), 0)
  const completedTasks = phases.reduce((sum, p) =>
    sum + (p.tasks?.filter(t => t.status === 'Tamamlandı').length || 0), 0)

  doc.setFontSize(12)
  doc.text('Proje Özeti', 14, yPos)
  yPos += 8
  doc.setFontSize(10)
  doc.text(`• Toplam Aşama: ${totalPhases} (${completedPhases} Tamamlandı)`, 14, yPos)
  yPos += 6
  doc.text(`• Toplam Görev: ${totalTasks} (${completedTasks} Tamamlandı)`, 14, yPos)
  yPos += 10

  // Aşamalar ve Görevler
  phases.forEach((phase, phaseIndex) => {
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text(`${phase.phase_code} - ${phase.phase_name}`, 14, yPos)
    yPos += 6
    doc.setFont(undefined, 'normal')
    doc.setFontSize(10)
    doc.text(`Durum: ${phase.status} | İlerleme: %${phase.progress}`, 14, yPos)
    yPos += 8

    if (phase.tasks && phase.tasks.length > 0) {
      const taskData = phase.tasks.map(task => [
        task.task_code,
        task.task_name,
        task.status,
        `%${task.progress}`,
        task.assigned_employee?.full_name || '-'
      ])

      doc.autoTable({
        startY: yPos,
        head: [['Kod', 'Görev', 'Durum', 'İlerleme', 'Atanan']],
        body: taskData,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8 },
        margin: { left: 14 }
      })

      yPos = doc.lastAutoTable.finalY + 10
    } else {
      doc.setFontSize(9)
      doc.setTextColor(128)
      doc.text('Bu aşamada görev yok', 20, yPos)
      doc.setTextColor(0)
      yPos += 10
    }
  })

  // Tarih
  doc.setFontSize(8)
  doc.setTextColor(128)
  doc.text(`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 14, doc.internal.pageSize.height - 10)

  // İndirme
  doc.save(`${project.project_name}_Proje_Raporu.pdf`)
}

export function exportProjectToExcel(project, phases) {
  const workbook = XLSX.utils.book_new()

  // Proje Özet Sayfası
  const summaryData = [
    ['Proje Raporu'],
    [],
    ['Proje Adı', project.project_name],
    ['Müşteri', project.customers?.company_name || '-'],
    ['Proje Yöneticisi', project.employees?.full_name || '-'],
    ['Durum', project.status],
    ['Bütçe', project.budget ? `₺${project.budget.toLocaleString('tr-TR')}` : '-'],
    ['Planlanan Başlangıç', project.planned_start_date || '-'],
    ['Planlanan Bitiş', project.planned_end_date || '-'],
    [],
    ['İstatistikler'],
    ['Toplam Aşama', phases.length],
    ['Tamamlanan Aşama', phases.filter(p => p.status === 'Tamamlandı').length],
    ['Toplam Görev', phases.reduce((sum, p) => sum + (p.tasks?.length || 0), 0)],
    ['Tamamlanan Görev', phases.reduce((sum, p) => sum + (p.tasks?.filter(t => t.status === 'Tamamlandı').length || 0), 0)]
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Proje Özeti')

  // Aşamalar Sayfası
  const phasesData = [
    ['Aşama Kodu', 'Aşama Adı', 'Durum', 'İlerleme (%)', 'Görev Sayısı', 'Tamamlanan Görev']
  ]

  phases.forEach(phase => {
    phasesData.push([
      phase.phase_code,
      phase.phase_name,
      phase.status,
      phase.progress,
      phase.tasks?.length || 0,
      phase.tasks?.filter(t => t.status === 'Tamamlandı').length || 0
    ])
  })

  const phasesSheet = XLSX.utils.aoa_to_sheet(phasesData)
  XLSX.utils.book_append_sheet(workbook, phasesSheet, 'Aşamalar')

  // Görevler Sayfası
  const tasksData = [
    ['Aşama Kodu', 'Görev Kodu', 'Görev Adı', 'Ürün Bilgisi', 'Durum', 'İlerleme (%)', 'Atanan Personel']
  ]

  phases.forEach(phase => {
    if (phase.tasks && phase.tasks.length > 0) {
      phase.tasks.forEach(task => {
        tasksData.push([
          phase.phase_code,
          task.task_code,
          task.task_name,
          task.product_info || '-',
          task.status,
          task.progress,
          task.assigned_employee?.full_name || '-'
        ])
      })
    }
  })

  const tasksSheet = XLSX.utils.aoa_to_sheet(tasksData)
  XLSX.utils.book_append_sheet(workbook, tasksSheet, 'Görevler')

  // İndirme
  XLSX.writeFile(workbook, `${project.project_name}_Proje_Raporu.xlsx`)
}

export function exportPhaseToExcel(phase, projectName) {
  const workbook = XLSX.utils.book_new()

  // Aşama Detayı
  const phaseData = [
    ['Aşama Raporu'],
    [],
    ['Proje', projectName],
    ['Aşama Kodu', phase.phase_code],
    ['Aşama Adı', phase.phase_name],
    ['Durum', phase.status],
    ['İlerleme', `%${phase.progress}`],
    ['Planlanan Başlangıç', phase.planned_start_date || '-'],
    ['Planlanan Bitiş', phase.planned_end_date || '-'],
    []
  ]

  if (phase.tasks && phase.tasks.length > 0) {
    phaseData.push(['Görevler'])
    phaseData.push(['Kod', 'Görev Adı', 'Ürün Bilgisi', 'Durum', 'İlerleme', 'Atanan'])

    phase.tasks.forEach(task => {
      phaseData.push([
        task.task_code,
        task.task_name,
        task.product_info || '-',
        task.status,
        `%${task.progress}`,
        task.assigned_employee?.full_name || '-'
      ])
    })
  }

  const sheet = XLSX.utils.aoa_to_sheet(phaseData)
  XLSX.utils.book_append_sheet(workbook, sheet, 'Aşama Detayı')

  XLSX.writeFile(workbook, `${phase.phase_code}_${phase.phase_name}.xlsx`)
}
