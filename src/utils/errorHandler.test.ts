import { describe, it, expect } from 'vitest'
import { handleSupabaseError } from './errorHandler'

describe('Error Handler', () => {
  it('handles unique constraint violation', () => {
    const error = {
      code: '23505',
      message: 'duplicate key value violates unique constraint'
    }
    const result = handleSupabaseError(error)
    expect(result).toContain('Bu kayıt zaten mevcut')
  })

  it('handles foreign key violation', () => {
    const error = {
      code: '23503',
      message: 'violates foreign key constraint'
    }
    const result = handleSupabaseError(error)
    expect(result).toBe('İlişkili kayıtlar nedeniyle bu işlem yapılamıyor')
  })

  it('handles not null violation', () => {
    const error = {
      code: '23502',
      message: 'null value in column "email"'
    }
    const result = handleSupabaseError(error)
    expect(result).toBe('Zorunlu alanlar eksik')
  })

  it('handles permission denied', () => {
    const error = {
      code: '42501',
      message: 'permission denied'
    }
    const result = handleSupabaseError(error)
    expect(result).toBe('Yetki hatası')
  })

  it('returns generic message for unknown errors', () => {
    const error = {
      code: 'UNKNOWN',
      message: 'Some unknown error'
    }
    const result = handleSupabaseError(error)
    expect(result).toBe('Bir hata oluştu. Lütfen tekrar deneyin.')
  })

  it('handles string errors', () => {
    const result = handleSupabaseError('Network error')
    expect(result).toBe('Bir hata oluştu. Lütfen tekrar deneyin.')
  })
})
