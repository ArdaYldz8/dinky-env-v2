import { useState } from 'react'
import { supabase } from '../../services/supabase'
import Button from '../../shared/components/Button'

export default function RestoreMaterialsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const materials = [
    { item_name: 'HEA 200 Profil', item_code: 'HEA-200', category: 'Profil', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'HEA 180 Profil', item_code: 'HEA-180', category: 'Profil', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'HEA 160 Profil', item_code: 'HEA-160', category: 'Profil', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'HEA 140 Profil', item_code: 'HEA-140', category: 'Profil', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: '300x400x15 Sac Plaka', item_code: 'PLK-300x400x15', category: 'Plaka', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: '250x300x12 Sac Plaka', item_code: 'PLK-250x300x12', category: 'Plaka', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: '200x200x10 Sac Plaka', item_code: 'PLK-200x200x10', category: 'Plaka', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'M20 Civata', item_code: 'CVT-M20', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'M16 Civata', item_code: 'CVT-M16', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'M12 Civata', item_code: 'CVT-M12', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'M20 Somun', item_code: 'SMN-M20', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'M16 Somun', item_code: 'SMN-M16', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'M12 Somun', item_code: 'SMN-M12', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'M20 Pul', item_code: 'PUL-M20', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'M16 Pul', item_code: 'PUL-M16', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'M12 Pul', item_code: 'PUL-M12', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: '6mm Kaynak Elektrodu', item_code: 'KYN-6MM', category: 'Kaynak', unit: 'kg', current_stock: 0, is_project_material: true },
    { item_name: 'Astar Boya', item_code: 'BYA-ASTAR', category: 'Boya', unit: 'litre', current_stock: 0, is_project_material: true },
    { item_name: 'Son Kat Boya', item_code: 'BYA-SONKAT', category: 'Boya', unit: 'litre', current_stock: 0, is_project_material: true },
    { item_name: '80x80x5 Köşebent', item_code: 'KSB-80x80x5', category: 'Profil', unit: 'metre', current_stock: 0, is_project_material: true },
    { item_name: '60x60x4 Köşebent', item_code: 'KSB-60x60x4', category: 'Profil', unit: 'metre', current_stock: 0, is_project_material: true },
    { item_name: '150x150x8 Sac Plaka', item_code: 'PLK-150x150x8', category: 'Plaka', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: '100x100x6 Sac Plaka', item_code: 'PLK-100x100x6', category: 'Plaka', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'M10 Civata', item_code: 'CVT-M10', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'M10 Somun', item_code: 'SMN-M10', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'M10 Pul', item_code: 'PUL-M10', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: '4mm Kaynak Elektrodu', item_code: 'KYN-4MM', category: 'Kaynak', unit: 'kg', current_stock: 0, is_project_material: true },
  ]

  const handleRestore = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Step 1: Insert materials
      const { data: items, error: itemsError } = await supabase
        .from('stock_items')
        .insert(materials)
        .select()

      if (itemsError) throw itemsError

      setResult(prev => ({ ...prev, materials: `✅ ${items.length} malzeme eklendi` }))

      // Step 2: Get İLHAN project
      const { data: projects, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .ilike('project_name', '%İLHAN%')
        .limit(1)

      if (projectError || !projects || projects.length === 0) {
        throw new Error('İLHAN projesi bulunamadı!')
      }

      const projectId = projects[0].id
      setResult(prev => ({ ...prev, project: `✅ İLHAN projesi bulundu` }))

      // Step 3: Create movements
      const findItem = (code) => items.find(item => item.item_code === code)

      const movements = [
        // Faz 1
        { item_id: findItem('HEA-200').id, movement_type: 'Çıkış', quantity: 12, project_id: projectId, notes: 'Faz 1: Temel Yapı - Ana Kirişler', movement_date: '2024-01-15' },
        { item_id: findItem('HEA-180').id, movement_type: 'Çıkış', quantity: 8, project_id: projectId, notes: 'Faz 1: Temel Yapı - Destek Kirişleri', movement_date: '2024-01-15' },
        { item_id: findItem('PLK-300x400x15').id, movement_type: 'Çıkış', quantity: 24, project_id: projectId, notes: 'Faz 1: Temel Yapı - Taban Plakaları', movement_date: '2024-01-16' },
        { item_id: findItem('CVT-M20').id, movement_type: 'Çıkış', quantity: 200, project_id: projectId, notes: 'Faz 1: Temel Yapı - Bağlantı Elemanları', movement_date: '2024-01-16' },
        { item_id: findItem('SMN-M20').id, movement_type: 'Çıkış', quantity: 200, project_id: projectId, notes: 'Faz 1: Temel Yapı - Bağlantı Elemanları', movement_date: '2024-01-16' },
        { item_id: findItem('PUL-M20').id, movement_type: 'Çıkış', quantity: 400, project_id: projectId, notes: 'Faz 1: Temel Yapı - Bağlantı Elemanları', movement_date: '2024-01-16' },
        { item_id: findItem('KYN-6MM').id, movement_type: 'Çıkış', quantity: 45, project_id: projectId, notes: 'Faz 1: Temel Yapı - Kaynak İşlemleri', movement_date: '2024-01-17' },
        // Faz 2
        { item_id: findItem('HEA-160').id, movement_type: 'Çıkış', quantity: 16, project_id: projectId, notes: 'Faz 2: Kolonlar', movement_date: '2024-01-22' },
        { item_id: findItem('HEA-140').id, movement_type: 'Çıkış', quantity: 10, project_id: projectId, notes: 'Faz 2: Ara Kirişler', movement_date: '2024-01-22' },
        { item_id: findItem('PLK-250x300x12').id, movement_type: 'Çıkış', quantity: 32, project_id: projectId, notes: 'Faz 2: Bağlantı Plakaları', movement_date: '2024-01-23' },
        { item_id: findItem('CVT-M16').id, movement_type: 'Çıkış', quantity: 300, project_id: projectId, notes: 'Faz 2: Kolon Bağlantıları', movement_date: '2024-01-23' },
        { item_id: findItem('SMN-M16').id, movement_type: 'Çıkış', quantity: 300, project_id: projectId, notes: 'Faz 2: Kolon Bağlantıları', movement_date: '2024-01-23' },
        { item_id: findItem('PUL-M16').id, movement_type: 'Çıkış', quantity: 600, project_id: projectId, notes: 'Faz 2: Kolon Bağlantıları', movement_date: '2024-01-23' },
        { item_id: findItem('KYN-6MM').id, movement_type: 'Çıkış', quantity: 38, project_id: projectId, notes: 'Faz 2: Kaynak İşlemleri', movement_date: '2024-01-24' },
        // Faz 3
        { item_id: findItem('KSB-80x80x5').id, movement_type: 'Çıkış', quantity: 120, project_id: projectId, notes: 'Faz 3: Takviye Köşebentleri', movement_date: '2024-01-29' },
        { item_id: findItem('KSB-60x60x4').id, movement_type: 'Çıkış', quantity: 80, project_id: projectId, notes: 'Faz 3: Yardımcı Takviyeler', movement_date: '2024-01-29' },
        { item_id: findItem('PLK-200x200x10').id, movement_type: 'Çıkış', quantity: 28, project_id: projectId, notes: 'Faz 3: Küçük Bağlantı Plakaları', movement_date: '2024-01-30' },
        { item_id: findItem('PLK-150x150x8').id, movement_type: 'Çıkış', quantity: 36, project_id: projectId, notes: 'Faz 3: Takviye Plakaları', movement_date: '2024-01-30' },
        { item_id: findItem('CVT-M12').id, movement_type: 'Çıkış', quantity: 400, project_id: projectId, notes: 'Faz 3: İkincil Bağlantılar', movement_date: '2024-01-31' },
        { item_id: findItem('SMN-M12').id, movement_type: 'Çıkış', quantity: 400, project_id: projectId, notes: 'Faz 3: İkincil Bağlantılar', movement_date: '2024-01-31' },
        { item_id: findItem('PUL-M12').id, movement_type: 'Çıkış', quantity: 800, project_id: projectId, notes: 'Faz 3: İkincil Bağlantılar', movement_date: '2024-01-31' },
        { item_id: findItem('KYN-4MM').id, movement_type: 'Çıkış', quantity: 25, project_id: projectId, notes: 'Faz 3: İnce Kaynak İşlemleri', movement_date: '2024-02-01' },
        // Faz 4
        { item_id: findItem('PLK-100x100x6').id, movement_type: 'Çıkış', quantity: 48, project_id: projectId, notes: 'Faz 4: Küçük Detay Plakaları', movement_date: '2024-02-05' },
        { item_id: findItem('CVT-M10').id, movement_type: 'Çıkış', quantity: 200, project_id: projectId, notes: 'Faz 4: Detay Bağlantıları', movement_date: '2024-02-06' },
        { item_id: findItem('SMN-M10').id, movement_type: 'Çıkış', quantity: 200, project_id: projectId, notes: 'Faz 4: Detay Bağlantıları', movement_date: '2024-02-06' },
        { item_id: findItem('PUL-M10').id, movement_type: 'Çıkış', quantity: 400, project_id: projectId, notes: 'Faz 4: Detay Bağlantıları', movement_date: '2024-02-06' },
        { item_id: findItem('KYN-4MM').id, movement_type: 'Çıkış', quantity: 15, project_id: projectId, notes: 'Faz 4: Son Kaynak İşlemleri', movement_date: '2024-02-07' },
        // Faz 5
        { item_id: findItem('BYA-ASTAR').id, movement_type: 'Çıkış', quantity: 85, project_id: projectId, notes: 'Faz 5: Astar Boyama', movement_date: '2024-02-12' },
        { item_id: findItem('BYA-SONKAT').id, movement_type: 'Çıkış', quantity: 95, project_id: projectId, notes: 'Faz 5: Son Kat Boyama', movement_date: '2024-02-14' },
      ]

      const { data: movementsData, error: movementsError } = await supabase
        .from('stock_movements')
        .insert(movements)
        .select()

      if (movementsError) throw movementsError

      setResult(prev => ({ ...prev, movements: `✅ ${movementsData.length} stok hareketi eklendi`, success: true }))
    } catch (error) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">🔧 Malzeme Geri Yükleme Aracı</h1>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Dikkat</h3>
          <p className="text-sm text-yellow-700">
            Bu araç İLHAN projesi için PDF'den alınan malzemeleri ve stok hareketlerini geri yükler.
            Toplam 27 malzeme ve 30 stok hareketi eklenecektir.
          </p>
        </div>

        <Button
          onClick={handleRestore}
          disabled={loading || result?.success}
          className="mb-6"
        >
          {loading ? 'Yükleniyor...' : result?.success ? '✅ Tamamlandı' : '▶️ Geri Yüklemeyi Başlat'}
        </Button>

        {result && (
          <div className={`rounded-lg p-4 ${result.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
            <h3 className="font-semibold mb-2">{result.error ? '❌ Hata' : '✅ Sonuç'}</h3>
            {result.error ? (
              <p className="text-red-700">{result.error}</p>
            ) : (
              <div className="space-y-1 text-sm">
                {result.materials && <p>{result.materials}</p>}
                {result.project && <p>{result.project}</p>}
                {result.movements && <p>{result.movements}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
