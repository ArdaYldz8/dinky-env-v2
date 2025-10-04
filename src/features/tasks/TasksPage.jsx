import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import Modal from '../../shared/components/Modal'
import Button from '../../shared/components/Button'

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [toast, setToast] = useState(null)

  // New task form
  const [newTask, setNewTask] = useState({
    employee_id: '',
    title: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch employees
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name')

      if (empError) throw empError
      setEmployees(empData || [])

      // Fetch tasks with employee info
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select(`
          *,
          employees:assigned_to (full_name)
        `)
        .order('created_at', { ascending: false })

      if (taskError) throw taskError
      setTasks(taskData || [])
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

  const handleAddTask = async (e) => {
    e.preventDefault()

    if (!newTask.employee_id) {
      showToast('Lütfen personel seçin!', 'error')
      return
    }

    if (!newTask.title.trim()) {
      showToast('Lütfen görev açıklaması girin!', 'error')
      return
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .insert([{
          title: newTask.title.trim(),
          assigned_to: newTask.employee_id,
          status: 'Beklemede',
          priority: 'Orta',
        }])

      if (error) throw error

      showToast('Görev başarıyla eklendi!')
      setNewTask({ employee_id: '', title: '' })
      fetchData()
    } catch (error) {
      showToast('Görev eklenemedi: ' + error.message, 'error')
    }
  }

  const handleToggleStatus = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'Tamamlandı' ? 'Beklemede' : 'Tamamlandı'
    const completedAt = newStatus === 'Tamamlandı' ? new Date().toISOString() : null

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          completed_at: completedAt
        })
        .eq('id', taskId)

      if (error) throw error

      showToast(newStatus === 'Tamamlandı' ? 'Görev tamamlandı!' : 'Görev tekrar açıldı!')
      fetchData()
    } catch (error) {
      showToast('İşlem başarısız: ' + error.message, 'error')
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Bu görevi silmek istediğinizden emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      showToast('Görev silindi!')
      fetchData()
    } catch (error) {
      showToast('Silme işlemi başarısız: ' + error.message, 'error')
    }
  }

  // Filter tasks
  const filteredPendingTasks = tasks.filter(task => {
    if (task.status === 'Tamamlandı') return false
    if (selectedEmployee && task.assigned_to !== selectedEmployee) return false
    return true
  })

  const filteredCompletedTasks = tasks.filter(task => {
    if (task.status !== 'Tamamlandı') return false
    if (selectedEmployee && task.assigned_to !== selectedEmployee) return false
    return true
  }).slice(0, 5)

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

      {/* Header with Filter */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📋 Görev Yönetimi</h1>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Personel Filtresi:</label>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Tüm Personel</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.full_name}</option>
            ))}
          </select>
          {selectedEmployee && (
            <Button size="sm" variant="warning" onClick={() => setSelectedEmployee('')}>
              ✕ Temizle
            </Button>
          )}
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Task Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Yeni Görev Ekle</h2>
            <form onSubmit={handleAddTask} className="flex gap-3">
              <select
                value={newTask.employee_id}
                onChange={(e) => setNewTask({ ...newTask, employee_id: e.target.value })}
                className="flex-none w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Personel seçin...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                ))}
              </select>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Görev açıklaması..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <Button type="submit" variant="success">
                ➕ Ekle
              </Button>
            </form>
          </div>

          {/* Pending Tasks */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">⏰ Bekleyen Görevler</h2>
            </div>
            <div className="p-6">
              {filteredPendingTasks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-3">⏰</div>
                  <h3 className="text-lg font-medium mb-2">Bekleyen görev yok</h3>
                  <p className="text-sm">
                    {selectedEmployee ? 'Bu personelin bekleyen görevi yok' : 'Tüm görevler tamamlanmış!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPendingTasks.map(task => (
                    <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-2">{task.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>👤 {task.employees?.full_name || 'Atanmamış'}</span>
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                              Bekliyor
                            </span>
                            <span>📅 {new Date(task.created_at).toLocaleDateString('tr-TR')}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="success" onClick={() => handleToggleStatus(task.id, task.status)}>
                            ✓ Tamamla
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleDeleteTask(task.id)}>
                            🗑️
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          {/* Completed Tasks */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">✅ Tamamlanan Görevler</h2>
            </div>
            <div className="p-6">
              {filteredCompletedTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-3xl mb-2">✅</div>
                  <p className="text-sm">
                    {selectedEmployee ? 'Bu personelin tamamlanan görevi yok' : 'Henüz görev tamamlanmamış'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCompletedTasks.map(task => (
                    <div key={task.id} className="border border-gray-200 rounded-lg p-3 bg-green-50">
                      <h3 className="font-medium text-gray-900 text-sm mb-2">{task.title}</h3>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>👤 {task.employees?.full_name || 'Atanmamış'}</span>
                        <Button size="sm" variant="warning" onClick={() => handleToggleStatus(task.id, task.status)}>
                          ↺ Geri Al
                        </Button>
                      </div>
                    </div>
                  ))}
                  {tasks.filter(t => t.status === 'Tamamlandı').length > 5 && (
                    <div className="text-center text-sm text-gray-500 pt-2 border-t">
                      ℹ️ Toplam {tasks.filter(t => t.status === 'Tamamlandı').length} tamamlanan görev (Son 5 tanesi gösteriliyor)
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
