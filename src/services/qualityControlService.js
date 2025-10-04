import { supabase } from './supabase'

export const qualityControlService = {
  // Get all quality issues with filters
  async getIssues(filters = {}) {
    try {
      let query = supabase
        .from('quality_issues')
        .select(`
          *,
          project:projects(id, project_name),
          phase:project_phases(id, phase_name),
          task:project_tasks(id, task_name),
          reporter:employees!quality_issues_reporter_id_fkey(id, full_name, position),
          assigned_worker:employees!quality_issues_assigned_to_fkey(id, full_name, position),
          supervisor:employees!quality_issues_supervisor_id_fkey(id, full_name, position)
        `)
        .order('created_at', { ascending: false })

      if (filters.project_id) {
        query = query.eq('project_id', filters.project_id)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.priority) {
        query = query.eq('priority_level', filters.priority)
      }
      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to)
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo)
      }

      const { data, error } = await query

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Get issues error:', error)
      return { success: false, error: error.message }
    }
  },

  // Get single issue by ID
  async getIssueById(issueId) {
    try {
      const { data, error } = await supabase
        .from('quality_issues')
        .select(`
          *,
          project:projects(id, project_name, customer_id),
          phase:project_phases(id, phase_name),
          task:project_tasks(id, task_name),
          reporter:employees!quality_issues_reporter_id_fkey(id, full_name, position),
          assigned_worker:employees!quality_issues_assigned_to_fkey(id, full_name, position),
          supervisor:employees!quality_issues_supervisor_id_fkey(id, full_name, position)
        `)
        .eq('id', issueId)
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Get issue by ID error:', error)
      return { success: false, error: error.message }
    }
  },

  // Create new quality issue
  async createIssue(issueData) {
    try {
      const { data, error } = await supabase
        .from('quality_issues')
        .insert([{
          project_id: issueData.project_id,
          phase_id: issueData.phase_id || null,
          task_id: issueData.task_id || null,
          issue_title: issueData.issue_title || issueData.title,
          issue_description: issueData.issue_description || issueData.description,
          issue_location: issueData.issue_location || issueData.location,
          priority_level: issueData.priority_level || issueData.priority,
          reporter_id: issueData.reporter_id,
          assigned_to: issueData.assigned_to || null,
          supervisor_id: issueData.supervisor_id || null,
          before_photo_url: issueData.before_photo_url || null,
          reporter_notes: issueData.reporter_notes || null,
          estimated_fix_time: issueData.estimated_fix_time || null
        }])
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Create issue error:', error)
      return { success: false, error: error.message }
    }
  },

  // Update quality issue
  async updateIssue(issueId, updates) {
    try {
      const { data, error } = await supabase
        .from('quality_issues')
        .update(updates)
        .eq('id', issueId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Update issue error:', error)
      return { success: false, error: error.message }
    }
  },

  // Update issue status
  async updateStatus(issueId, status, notes = null) {
    try {
      const updates = { status }

      if (status === 'in_progress' && !updates.started_at) {
        updates.started_at = new Date().toISOString()
      }
      if (status === 'fixed' && !updates.completed_at) {
        updates.completed_at = new Date().toISOString()
      }
      if (status === 'approved' && !updates.reviewed_at) {
        updates.reviewed_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('quality_issues')
        .update(updates)
        .eq('id', issueId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Update status error:', error)
      return { success: false, error: error.message }
    }
  },

  // Assign worker to issue
  async assignWorker(issueId, workerId) {
    try {
      const { data, error } = await supabase
        .from('quality_issues')
        .update({
          assigned_to: workerId,
          status: 'assigned'
        })
        .eq('id', issueId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Assign worker error:', error)
      return { success: false, error: error.message }
    }
  },

  // Upload photo
  async uploadPhoto(file) {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('quality-control-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('quality-control-photos')
        .getPublicUrl(filePath)

      return { success: true, url: publicUrl }
    } catch (error) {
      console.error('Upload photo error:', error)
      return { success: false, error: error.message }
    }
  },

  // Add after photo and mark as fixed
  async addAfterPhoto(issueId, photoUrl) {
    try {
      const { data, error } = await supabase
        .from('quality_issues')
        .update({
          after_photo_url: photoUrl,
          status: 'fixed',
          completed_at: new Date().toISOString()
        })
        .eq('id', issueId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Add after photo error:', error)
      return { success: false, error: error.message }
    }
  },

  // Get comments for an issue
  async getComments(issueId) {
    try {
      const { data, error } = await supabase
        .from('qc_comments')
        .select(`
          *,
          employee:employees(id, full_name, position)
        `)
        .eq('issue_id', issueId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Get comments error:', error)
      return { success: false, error: error.message }
    }
  },

  // Add comment to issue
  async addComment(issueId, employeeId, commentText, commentType = 'general') {
    try {
      const { data, error } = await supabase
        .from('qc_comments')
        .insert([{
          issue_id: issueId,
          employee_id: employeeId,
          comment_text: commentText,
          comment_type: commentType
        }])
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Add comment error:', error)
      return { success: false, error: error.message }
    }
  },

  // Delete issue
  async deleteIssue(issueId) {
    try {
      const { error } = await supabase
        .from('quality_issues')
        .delete()
        .eq('id', issueId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Delete issue error:', error)
      return { success: false, error: error.message }
    }
  },

  // Get dashboard statistics
  async getDashboardStats(projectId = null) {
    try {
      let query = supabase
        .from('quality_issues')
        .select('id, status, created_at, started_at, completed_at')

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error } = await query

      if (error) throw error

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const stats = {
        total: data.length,
        open: data.filter(i => !['approved', 'rejected'].includes(i.status)).length,
        today: data.filter(i => new Date(i.created_at) >= today).length,
        byStatus: {
          reported: data.filter(i => i.status === 'reported').length,
          assigned: data.filter(i => i.status === 'assigned').length,
          in_progress: data.filter(i => i.status === 'in_progress').length,
          fixed: data.filter(i => i.status === 'fixed').length,
          review: data.filter(i => i.status === 'review').length,
          approved: data.filter(i => i.status === 'approved').length,
          rejected: data.filter(i => i.status === 'rejected').length
        },
        avgFixTime: this.calculateAvgFixTime(data)
      }

      return { success: true, data: stats }
    } catch (error) {
      console.error('Get dashboard stats error:', error)
      return { success: false, error: error.message }
    }
  },

  // Calculate average fix time
  calculateAvgFixTime(issues) {
    const completed = issues.filter(i => i.started_at && i.completed_at)
    if (completed.length === 0) return 0

    const totalMinutes = completed.reduce((sum, issue) => {
      const start = new Date(issue.started_at)
      const end = new Date(issue.completed_at)
      const minutes = (end - start) / (1000 * 60)
      return sum + minutes
    }, 0)

    return Math.round(totalMinutes / completed.length)
  }
}
