import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../services/supabase'
import { handleSupabaseError } from '../../utils/errorHandler'

/**
 * Custom hook for fetching data from Supabase
 * Handles loading states, errors, and automatic refetching
 *
 * @param {string} table - Supabase table name
 * @param {Object} options - Query options
 * @returns {Object} Data fetch state and methods
 */
export default function useDataFetch(table, options = {}) {
  const {
    select = '*',
    filters = [],
    orderBy = null,
    limit = null,
    enabled = true,
  } = options

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)

      let query = supabase.from(table).select(select)

      // Apply filters
      filters.forEach(({ column, operator, value }) => {
        query = query[operator](column, value)
      })

      // Apply ordering
      if (orderBy) {
        const { column, ascending = true } = orderBy
        query = query.order(column, { ascending })
      }

      // Apply limit
      if (limit) {
        query = query.limit(limit)
      }

      const { data: result, error: fetchError } = await query

      if (fetchError) throw fetchError

      setData(result || [])
    } catch (err) {
      setError(handleSupabaseError(err))
    } finally {
      setLoading(false)
    }
  }, [table, select, filters, orderBy, limit, enabled])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch,
  }
}
