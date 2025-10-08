import { useState } from 'react'
import { supabase } from '../../services/supabase'
import Button from '../../shared/components/Button'

export default function RestoreHKuruMaterialsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const materials = [
    // H.K.1 Materials
    { item_name: 'Angalaj Plaka', item_code: 'ANGL-PLAK-HK', category: 'Plaka', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Tij', item_code: 'TIJ-HK', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Somun (H.K.)', item_code: 'SOMUN-HK', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },

    // H.K.3-1 Ayak Materials
    { item_name: 'HEA 180 Profil', item_code: 'HEA-180-HK', category: 'Profil', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Blak Base', item_code: 'BLAK-BASE-HK', category: 'Plaka', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Plate A', item_code: 'PLATE-A-HK', category: 'Plaka', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Plate B', item_code: 'PLATE-B-HK', category: 'Plaka', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Rondela (Ayak)', item_code: 'RONDELA-AYAK-HK', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },

    // H.K.3-2 Makas Materials
    { item_name: 'IPE 200 Profil', item_code: 'IPE-200-HK', category: 'Profil', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK A', item_code: 'BLAK-A-HK', category: 'Plaka', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK B', item_code: 'BLAK-B-HK', category: 'Plaka', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK C', item_code: 'BLAK-C-HK', category: 'Plaka', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK E', item_code: 'BLAK-E-HK', category: 'Plaka', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Gusset', item_code: 'GUSSET-HK', category: 'Plaka', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Civata (Makas)', item_code: 'CIVATA-MAKAS-HK', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Somun (Makas)', item_code: 'SOMUN-MAKAS-HK', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Rondela (Makas)', item_code: 'RONDELA-MAKAS-HK', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },

    // H.K.3-3 Capraz Materials
    { item_name: 'C 76X3 Profil', item_code: 'C76X3-HK', category: 'Profil', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Plate (Çapraz)', item_code: 'PLATE-CAPRAZ-HK', category: 'Plaka', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK A (Çapraz)', item_code: 'BLAK-A-CAPRAZ-HK', category: 'Plaka', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK B (Çapraz)', item_code: 'BLAK-B-CAPRAZ-HK', category: 'Plaka', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK C (Çapraz)', item_code: 'BLAK-C-CAPRAZ-HK', category: 'Plaka', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK D', item_code: 'BLAK-D-HK', category: 'Plaka', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Civata (Çapraz)', item_code: 'CIVATA-CAPRAZ-HK', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Somun (Çapraz)', item_code: 'SOMUN-CAPRAZ-HK', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Rondela (Çapraz)', item_code: 'RONDELA-CAPRAZ-HK', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },

    // H.K.3-4 Aşıklar Materials
    { item_name: 'L60X60X6 Köşebent', item_code: 'L60X60X6-HK', category: 'Profil', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'R120/60/3 Profil', item_code: 'R120-60-3-HK', category: 'Profil', unit: 'adet', current_stock: 0, is_project_material: true },

    // H.K.3-5 Havalandırma Materials
    { item_name: 'R60X40X3 Profil', item_code: 'R60X40X3-HK', category: 'Profil', unit: 'adet', current_stock: 0, is_project_material: true },
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

      // Step 2: Get H-KURU project
      const { data: projects, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .ilike('project_name', '%KURU%')
        .limit(1)

      if (projectError || !projects || projects.length === 0) {
        throw new Error('H-KURU projesi bulunamadı!')
      }

      const projectId = projects[0].id
      setResult(prev => ({ ...prev, project: `✅ H-KURU projesi bulundu` }))

      // Step 3: Create movements
      const findItem = (code) => items.find(item => item.item_code === code)

      const movements = [
        // H.K.1 - Angalage Ahir imalati
        { item_id: findItem('ANGL-PLAK-HK').id, movement_type: 'Çıkış', quantity: 44, project_id: projectId, notes: 'H.K.1: Angalage Ahır İmalati', movement_date: '2024-01-10' },
        { item_id: findItem('TIJ-HK').id, movement_type: 'Çıkış', quantity: 352, project_id: projectId, notes: 'H.K.1: Angalage Ahır İmalati', movement_date: '2024-01-10' },
        { item_id: findItem('SOMUN-HK').id, movement_type: 'Çıkış', quantity: 352, project_id: projectId, notes: 'H.K.1: Angalage Ahır İmalati', movement_date: '2024-01-10' },

        // H.K.3-1 - Ayak imalat
        { item_id: findItem('HEA-180-HK').id, movement_type: 'Çıkış', quantity: 19, project_id: projectId, notes: 'H.K.3-1: Ayak İmalat', movement_date: '2024-01-15' },
        { item_id: findItem('BLAK-BASE-HK').id, movement_type: 'Çıkış', quantity: 44, project_id: projectId, notes: 'H.K.3-1: Ayak İmalat', movement_date: '2024-01-15' },
        { item_id: findItem('PLATE-A-HK').id, movement_type: 'Çıkış', quantity: 88, project_id: projectId, notes: 'H.K.3-1: Ayak İmalat', movement_date: '2024-01-15' },
        { item_id: findItem('PLATE-B-HK').id, movement_type: 'Çıkış', quantity: 176, project_id: projectId, notes: 'H.K.3-1: Ayak İmalat', movement_date: '2024-01-15' },
        { item_id: findItem('SOMUN-HK').id, movement_type: 'Çıkış', quantity: 704, project_id: projectId, notes: 'H.K.3-1: Ayak İmalat - Somun', movement_date: '2024-01-15' },
        { item_id: findItem('RONDELA-AYAK-HK').id, movement_type: 'Çıkış', quantity: 352, project_id: projectId, notes: 'H.K.3-1: Ayak İmalat', movement_date: '2024-01-15' },

        // H.K.3-2 - Makas imalat
        { item_id: findItem('IPE-200-HK').id, movement_type: 'Çıkış', quantity: 18, project_id: projectId, notes: 'H.K.3-2: Makas İmalat', movement_date: '2024-01-20' },
        { item_id: findItem('BLAK-A-HK').id, movement_type: 'Çıkış', quantity: 88, project_id: projectId, notes: 'H.K.3-2: Makas İmalat', movement_date: '2024-01-20' },
        { item_id: findItem('BLAK-B-HK').id, movement_type: 'Çıkış', quantity: 176, project_id: projectId, notes: 'H.K.3-2: Makas İmalat', movement_date: '2024-01-20' },
        { item_id: findItem('BLAK-C-HK').id, movement_type: 'Çıkış', quantity: 22, project_id: projectId, notes: 'H.K.3-2: Makas İmalat', movement_date: '2024-01-20' },
        { item_id: findItem('BLAK-E-HK').id, movement_type: 'Çıkış', quantity: 20, project_id: projectId, notes: 'H.K.3-2: Makas İmalat', movement_date: '2024-01-20' },
        { item_id: findItem('GUSSET-HK').id, movement_type: 'Çıkış', quantity: 22, project_id: projectId, notes: 'H.K.3-2: Makas İmalat', movement_date: '2024-01-20' },
        { item_id: findItem('CIVATA-MAKAS-HK').id, movement_type: 'Çıkış', quantity: 286, project_id: projectId, notes: 'H.K.3-2: Makas İmalat', movement_date: '2024-01-20' },
        { item_id: findItem('SOMUN-MAKAS-HK').id, movement_type: 'Çıkış', quantity: 286, project_id: projectId, notes: 'H.K.3-2: Makas İmalat', movement_date: '2024-01-20' },
        { item_id: findItem('RONDELA-MAKAS-HK').id, movement_type: 'Çıkış', quantity: 396, project_id: projectId, notes: 'H.K.3-2: Makas İmalat', movement_date: '2024-01-20' },

        // H.K.3-3 - Capraz imalat
        { item_id: findItem('C76X3-HK').id, movement_type: 'Çıkış', quantity: 23, project_id: projectId, notes: 'H.K.3-3: Çapraz İmalat', movement_date: '2024-01-25' },
        { item_id: findItem('PLATE-CAPRAZ-HK').id, movement_type: 'Çıkış', quantity: 144, project_id: projectId, notes: 'H.K.3-3: Çapraz İmalat', movement_date: '2024-01-25' },
        { item_id: findItem('BLAK-A-CAPRAZ-HK').id, movement_type: 'Çıkış', quantity: 144, project_id: projectId, notes: 'H.K.3-3: Çapraz İmalat', movement_date: '2024-01-25' },
        { item_id: findItem('BLAK-B-CAPRAZ-HK').id, movement_type: 'Çıkış', quantity: 32, project_id: projectId, notes: 'H.K.3-3: Çapraz İmalat', movement_date: '2024-01-25' },
        { item_id: findItem('BLAK-C-CAPRAZ-HK').id, movement_type: 'Çıkış', quantity: 32, project_id: projectId, notes: 'H.K.3-3: Çapraz İmalat', movement_date: '2024-01-25' },
        { item_id: findItem('BLAK-D-HK').id, movement_type: 'Çıkış', quantity: 48, project_id: projectId, notes: 'H.K.3-3: Çapraz İmalat', movement_date: '2024-01-25' },
        { item_id: findItem('CIVATA-CAPRAZ-HK').id, movement_type: 'Çıkış', quantity: 348, project_id: projectId, notes: 'H.K.3-3: Çapraz İmalat', movement_date: '2024-01-25' },
        { item_id: findItem('SOMUN-CAPRAZ-HK').id, movement_type: 'Çıkış', quantity: 348, project_id: projectId, notes: 'H.K.3-3: Çapraz İmalat', movement_date: '2024-01-25' },
        { item_id: findItem('RONDELA-CAPRAZ-HK').id, movement_type: 'Çıkış', quantity: 696, project_id: projectId, notes: 'H.K.3-3: Çapraz İmalat', movement_date: '2024-01-25' },

        // H.K.3-4 - Aşıklar imalat
        { item_id: findItem('L60X60X6-HK').id, movement_type: 'Çıkış', quantity: 5, project_id: projectId, notes: 'H.K.3-4: Aşıklar İmalat', movement_date: '2024-01-30' },
        { item_id: findItem('R120-60-3-HK').id, movement_type: 'Çıkış', quantity: 112, project_id: projectId, notes: 'H.K.3-4: Aşıklar İmalat', movement_date: '2024-01-30' },

        // H.K.3-5 - Havalandırma imalat
        { item_id: findItem('R60X40X3-HK').id, movement_type: 'Çıkış', quantity: 4, project_id: projectId, notes: 'H.K.3-5: Havalandırma İmalat', movement_date: '2024-02-05' },
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">🔧 H-KURU Projesi Malzeme Geri Yükleme</h1>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Dikkat</h3>
          <p className="text-sm text-yellow-700 mb-2">
            Bu araç H-KURU (Hüseyin Kuru) projesi için PDF'den alınan malzemeleri ve stok hareketlerini geri yükler.
          </p>
          <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
            <li>Toplam 30 farklı malzeme</li>
            <li>33 stok hareketi</li>
            <li>5 ana faz: Angalage Ahır, Ayak, Makas, Çapraz, Aşıklar, Havalandırma</li>
          </ul>
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
