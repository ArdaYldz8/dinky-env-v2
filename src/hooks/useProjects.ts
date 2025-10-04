import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabase'
import { queryKeys } from '@/lib/queryClient'
import type { Tables } from '@/types'

type Project = Tables<'projects'>

// Fetch all projects
export function useProjects(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.projects.list(filters || {}),
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select(`
          *,
          customers(company_name),
          employees!projects_project_manager_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters?.project_type && filters.project_type !== 'all') {
        query = query.eq('project_type', filters.project_type)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    },
  })
}

// Fetch single project
export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          customers(company_name, contact_person, phone, email),
          employees!projects_project_manager_id_fkey(full_name, email, phone)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id, // Only run if id exists
  })
}

// Create project mutation
export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newProject: Partial<Project>) => {
      const { data, error } = await supabase
        .from('projects')
        .insert(newProject)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate and refetch projects list
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
    },
  })
}

// Update project mutation
export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Project> }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Invalidate specific project and list
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() })
    },
  })
}

// Delete project mutation
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
    },
  })
}

// Fetch project phases
export function useProjectPhases(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.phases(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_phases')
        .select('*, projects(project_name)')
        .eq('project_id', projectId)
        .order('order_number')

      if (error) throw error
      return data
    },
    enabled: !!projectId,
  })
}

// Fetch project tasks for a phase
export function useProjectTasks(phaseId: string) {
  return useQuery({
    queryKey: queryKeys.projects.tasks(phaseId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_tasks')
        .select('*, employees(full_name)')
        .eq('phase_id', phaseId)
        .order('order_number')

      if (error) throw error
      return data
    },
    enabled: !!phaseId,
  })
}
