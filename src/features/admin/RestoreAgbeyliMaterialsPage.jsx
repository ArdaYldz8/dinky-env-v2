import { useState } from 'react'
import { supabase } from '../../services/supabase'

export default function RestoreAgbeyliMaterialsPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // AGBEYLI Projesi Malzemeleri
  const materials = [
    // Angalage İmalat (AG.1)
    { item_name: 'ANGL PLAK', item_code: 'ANGL-PLAK-AGB', category: 'Plaka', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Tij 304', item_code: 'TIJ-304-AGB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Somun 304', item_code: 'SOMUN-304-AGB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },

    // Ayak İmalat (AG.3-1)
    { item_name: 'HEB 200 Profil', item_code: 'HEB-200-AGB', category: 'Profil', unit: 'metre', current_stock: 0, is_project_material: true },
    { item_name: 'Blak Base', item_code: 'BLAK-BASE-AGB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Plate (Ayak)', item_code: 'PLATE-AYAK-AGB', category: 'Plaka', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Somun (Ayak)', item_code: 'SOMUN-AYAK-AGB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Rondela (Ayak)', item_code: 'RONDELA-AYAK-AGB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },

    // Makas İmalat (AG.3-2)
    { item_name: 'IPE 300 Profil', item_code: 'IPE-300-AGB', category: 'Profil', unit: 'metre', current_stock: 0, is_project_material: true },
    { item_name: 'Plate A (Makas)', item_code: 'PLATE-A-MKS-AGB', category: 'Plaka', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK A (Makas)', item_code: 'BLAK-A-MKS-AGB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Plate B (Makas)', item_code: 'PLATE-B-MKS-AGB', category: 'Plaka', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Gusset 1', item_code: 'GUSSET-1-AGB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Gusset 2', item_code: 'GUSSET-2-AGB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Gusset 3', item_code: 'GUSSET-3-AGB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK B (Makas)', item_code: 'BLAK-B-MKS-AGB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK C (Makas)', item_code: 'BLAK-C-MKS-AGB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Plate C (Makas)', item_code: 'PLATE-C-MKS-AGB', category: 'Plaka', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Blak A (Makas Small)', item_code: 'BLAK-A-MKS-SM-AGB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Blak B (Makas Small)', item_code: 'BLAK-B-MKS-SM-AGB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Civata (Makas)', item_code: 'CIVATA-MKS-AGB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Somun (Makas)', item_code: 'SOMUN-MKS-AGB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Rondela (Makas)', item_code: 'RONDELA-MKS-AGB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },

    // Çapraz İmalat (AG.3-3)
    { item_name: 'C 127 x 8 MM Boru', item_code: 'C127X8-AGB', category: 'Boru', unit: 'metre', current_stock: 0, is_project_material: true },
    { item_name: 'C 101.6 x 6 MM Boru', item_code: 'C101X6-AGB', category: 'Boru', unit: 'metre', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK A (Çapraz)', item_code: 'BLAK-A-CPZ-AGB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK B (Çapraz)', item_code: 'BLAK-B-CPZ-AGB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK C (Çapraz)', item_code: 'BLAK-C-CPZ-AGB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK D (Çapraz)', item_code: 'BLAK-D-CPZ-AGB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Plate (Çapraz)', item_code: 'PLATE-CPZ-AGB', category: 'Plaka', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Civata (Çapraz)', item_code: 'CIVATA-CPZ-AGB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Somun (Çapraz)', item_code: 'SOMUN-CPZ-AGB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Rondela (Çapraz)', item_code: 'RONDELA-CPZ-AGB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },

    // Aşıklar İmalat (AG.3-4)
    { item_name: 'HEA 100 N1 Profil', item_code: 'HEA-100-N1-AGB', category: 'Profil', unit: 'metre', current_stock: 0, is_project_material: true },
    { item_name: 'HEA 100 N2 Profil', item_code: 'HEA-100-N2-AGB', category: 'Profil', unit: 'metre', current_stock: 0, is_project_material: true },
    { item_name: 'HEA 200 Profil (Aşık)', item_code: 'HEA-200-ASK-AGB', category: 'Profil', unit: 'metre', current_stock: 0, is_project_material: true },
  ]

  // Stok hareketleri - fazları temsil eden
  const stockMovements = [
    // AG.1 - Angalage İmalat (38 Blak Base)
    { item_code: 'ANGL-PLAK-AGB', quantity: 38, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG1', notes: 'Angalage İmalat - AG.1' },
    { item_code: 'TIJ-304-AGB', quantity: 304, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG1', notes: 'Angalage İmalat - AG.1' },
    { item_code: 'SOMUN-304-AGB', quantity: 304, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG1', notes: 'Angalage İmalat - AG.1' },

    // AG.3-1 - Ayak A İmalat (18 ayak - 73 MT)
    { item_code: 'HEB-200-AGB', quantity: 7, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-1A', notes: 'Ayak A İmalat - 18 ayak (73 MT)' },
    { item_code: 'BLAK-BASE-AGB', quantity: 18, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-1A', notes: 'Ayak A İmalat - 18 ayak' },
    { item_code: 'PLATE-AYAK-AGB', quantity: 72, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-1A', notes: 'Ayak A İmalat' },
    { item_code: 'SOMUN-AYAK-AGB', quantity: 288, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-1A', notes: 'Ayak A İmalat' },
    { item_code: 'RONDELA-AYAK-AGB', quantity: 144, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-1A', notes: 'Ayak A İmalat' },

    // AG.3-1 - Ayak B İmalat (16 ayak - 64 MT)
    { item_code: 'HEB-200-AGB', quantity: 6, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-1B', notes: 'Ayak B İmalat - 16 ayak (64 MT)' },
    { item_code: 'BLAK-BASE-AGB', quantity: 16, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-1B', notes: 'Ayak B İmalat - 16 ayak' },
    { item_code: 'PLATE-AYAK-AGB', quantity: 64, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-1B', notes: 'Ayak B İmalat' },
    { item_code: 'SOMUN-AYAK-AGB', quantity: 256, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-1B', notes: 'Ayak B İmalat' },
    { item_code: 'RONDELA-AYAK-AGB', quantity: 128, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-1B', notes: 'Ayak B İmalat' },

    // AG.3-1 - Ayak C İmalat (2 ayak - 6 MT)
    { item_code: 'HEB-200-AGB', quantity: 0.5, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-1C', notes: 'Ayak C İmalat - 2 ayak (6 MT)' },
    { item_code: 'BLAK-BASE-AGB', quantity: 2, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-1C', notes: 'Ayak C İmalat - 2 ayak' },
    { item_code: 'PLATE-AYAK-AGB', quantity: 8, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-1C', notes: 'Ayak C İmalat' },
    { item_code: 'SOMUN-AYAK-AGB', quantity: 32, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-1C', notes: 'Ayak C İmalat' },
    { item_code: 'RONDELA-AYAK-AGB', quantity: 16, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-1C', notes: 'Ayak C İmalat' },

    // AG.3-1 - Ayak D İmalat (2 ayak - 6 MT)
    { item_code: 'HEB-200-AGB', quantity: 0.5, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-1D', notes: 'Ayak D İmalat - 2 ayak (6 MT)' },
    { item_code: 'BLAK-BASE-AGB', quantity: 2, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-1D', notes: 'Ayak D İmalat - 2 ayak' },
    { item_code: 'PLATE-AYAK-AGB', quantity: 8, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-1D', notes: 'Ayak D İmalat' },
    { item_code: 'SOMUN-AYAK-AGB', quantity: 32, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-1D', notes: 'Ayak D İmalat' },
    { item_code: 'RONDELA-AYAK-AGB', quantity: 16, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-1D', notes: 'Ayak D İmalat' },

    // AG.3-2 - Makas A İmalat (12 makas - 87 MT)
    { item_code: 'IPE-300-AGB', quantity: 8, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2A', notes: 'Makas A İmalat - 12 makas (87 MT)' },
    { item_code: 'PLATE-A-MKS-AGB', quantity: 56, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2A', notes: 'Makas A İmalat' },
    { item_code: 'BLAK-A-MKS-AGB', quantity: 24, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2A', notes: 'Makas A İmalat' },
    { item_code: 'PLATE-B-MKS-AGB', quantity: 96, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2A', notes: 'Makas A İmalat' },
    { item_code: 'GUSSET-1-AGB', quantity: 12, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2A', notes: 'Makas A İmalat' },
    { item_code: 'GUSSET-2-AGB', quantity: 24, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2A', notes: 'Makas A İmalat' },
    { item_code: 'GUSSET-3-AGB', quantity: 12, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2A', notes: 'Makas A İmalat' },
    { item_code: 'BLAK-B-MKS-AGB', quantity: 6, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2A', notes: 'Makas A İmalat' },
    { item_code: 'BLAK-C-MKS-AGB', quantity: 24, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2A', notes: 'Makas A İmalat' },
    { item_code: 'CIVATA-MKS-AGB', quantity: 144, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2A', notes: 'Makas A İmalat' },
    { item_code: 'SOMUN-MKS-AGB', quantity: 144, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2A', notes: 'Makas A İmalat' },
    { item_code: 'RONDELA-MKS-AGB', quantity: 288, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2A', notes: 'Makas A İmalat' },

    // AG.3-2 - Makas B İmalat (8 makas - 59 MT)
    { item_code: 'IPE-300-AGB', quantity: 5, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2B', notes: 'Makas B İmalat - 8 makas (59 MT)' },
    { item_code: 'PLATE-A-MKS-AGB', quantity: 24, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2B', notes: 'Makas B İmalat' },
    { item_code: 'PLATE-B-MKS-AGB', quantity: 64, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2B', notes: 'Makas B İmalat' },
    { item_code: 'BLAK-A-MKS-AGB', quantity: 32, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2B', notes: 'Makas B İmalat' },
    { item_code: 'GUSSET-1-AGB', quantity: 8, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2B', notes: 'Makas B İmalat' },
    { item_code: 'BLAK-B-MKS-AGB', quantity: 8, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2B', notes: 'Makas B İmalat' },
    { item_code: 'PLATE-C-MKS-AGB', quantity: 8, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2B', notes: 'Makas B İmalat' },
    { item_code: 'GUSSET-2-AGB', quantity: 16, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2B', notes: 'Makas B İmalat' },
    { item_code: 'GUSSET-3-AGB', quantity: 16, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2B', notes: 'Makas B İmalat' },
    { item_code: 'CIVATA-MKS-AGB', quantity: 96, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2B', notes: 'Makas B İmalat' },
    { item_code: 'SOMUN-MKS-AGB', quantity: 96, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2B', notes: 'Makas B İmalat' },
    { item_code: 'RONDELA-MKS-AGB', quantity: 192, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2B', notes: 'Makas B İmalat' },

    // AG.3-2 - Makas C İmalat (2 makas - 4 MT)
    { item_code: 'IPE-300-AGB', quantity: 0.5, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2C', notes: 'Makas C İmalat - 2 makas (4 MT)' },
    { item_code: 'BLAK-A-MKS-SM-AGB', quantity: 4, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2C', notes: 'Makas C İmalat' },
    { item_code: 'BLAK-B-MKS-SM-AGB', quantity: 4, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2C', notes: 'Makas C İmalat' },
    { item_code: 'CIVATA-MKS-AGB', quantity: 24, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2C', notes: 'Makas C İmalat' },
    { item_code: 'SOMUN-MKS-AGB', quantity: 24, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2C', notes: 'Makas C İmalat' },
    { item_code: 'RONDELA-MKS-AGB', quantity: 28, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2C', notes: 'Makas C İmalat' },

    // AG.3-2 - Makas D İmalat (2 makas - 5 MT)
    { item_code: 'IPE-300-AGB', quantity: 0.5, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2D', notes: 'Makas D İmalat - 2 makas (5 MT)' },
    { item_code: 'BLAK-A-MKS-SM-AGB', quantity: 4, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2D', notes: 'Makas D İmalat' },
    { item_code: 'BLAK-B-MKS-SM-AGB', quantity: 4, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2D', notes: 'Makas D İmalat' },
    { item_code: 'CIVATA-MKS-AGB', quantity: 24, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2D', notes: 'Makas D İmalat' },
    { item_code: 'SOMUN-MKS-AGB', quantity: 24, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2D', notes: 'Makas D İmalat' },
    { item_code: 'RONDELA-MKS-AGB', quantity: 48, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-2D', notes: 'Makas D İmalat' },

    // AG.3-3 - Çapraz A İmalat (4 çapraz - 52 MT)
    { item_code: 'C127X8-AGB', quantity: 9, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-3A', notes: 'Çapraz A İmalat - 4 çapraz (52 MT)' },
    { item_code: 'BLAK-A-CPZ-AGB', quantity: 16, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-3A', notes: 'Çapraz A İmalat' },
    { item_code: 'BLAK-B-CPZ-AGB', quantity: 24, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-3A', notes: 'Çapraz A İmalat' },
    { item_code: 'PLATE-CPZ-AGB', quantity: 24, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-3A', notes: 'Çapraz A İmalat' },
    { item_code: 'BLAK-C-CPZ-AGB', quantity: 8, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-3A', notes: 'Çapraz A İmalat' },
    { item_code: 'CIVATA-CPZ-AGB', quantity: 96, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-3A', notes: 'Çapraz A İmalat' },
    { item_code: 'SOMUN-CPZ-AGB', quantity: 96, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-3A', notes: 'Çapraz A İmalat' },
    { item_code: 'RONDELA-CPZ-AGB', quantity: 192, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-3A', notes: 'Çapraz A İmalat' },

    // AG.3-3 - Çapraz B İmalat (16 çapraz - 122 MT)
    { item_code: 'C101X6-AGB', quantity: 21, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-3B', notes: 'Çapraz B İmalat - 16 çapraz (122 MT)' },
    { item_code: 'BLAK-A-CPZ-AGB', quantity: 32, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-3B', notes: 'Çapraz B İmalat' },
    { item_code: 'BLAK-B-CPZ-AGB', quantity: 96, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-3B', notes: 'Çapraz B İmalat' },
    { item_code: 'PLATE-CPZ-AGB', quantity: 96, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-3B', notes: 'Çapraz B İmalat' },
    { item_code: 'BLAK-C-CPZ-AGB', quantity: 16, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-3B', notes: 'Çapraz B İmalat' },
    { item_code: 'BLAK-D-CPZ-AGB', quantity: 32, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-3B', notes: 'Çapraz B İmalat' },
    { item_code: 'CIVATA-CPZ-AGB', quantity: 384, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-3B', notes: 'Çapraz B İmalat' },
    { item_code: 'SOMUN-CPZ-AGB', quantity: 384, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-3B', notes: 'Çapraz B İmalat' },
    { item_code: 'RONDELA-CPZ-AGB', quantity: 768, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-3B', notes: 'Çapraz B İmalat' },

    // AG.3-3 - Çapraz C İmalat (6 çapraz - 47 MT)
    { item_code: 'C101X6-AGB', quantity: 8, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-3C', notes: 'Çapraz C İmalat - 6 çapraz (47 MT)' },
    { item_code: 'BLAK-A-CPZ-AGB', quantity: 24, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-3C', notes: 'Çapraz C İmalat' },
    { item_code: 'BLAK-B-CPZ-AGB', quantity: 36, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-3C', notes: 'Çapraz C İmalat' },
    { item_code: 'PLATE-CPZ-AGB', quantity: 36, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-3C', notes: 'Çapraz C İmalat' },
    { item_code: 'BLAK-C-CPZ-AGB', quantity: 12, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-3C', notes: 'Çapraz C İmalat' },
    { item_code: 'CIVATA-CPZ-AGB', quantity: 144, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-3C', notes: 'Çapraz C İmalat' },
    { item_code: 'SOMUN-CPZ-AGB', quantity: 144, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-3C', notes: 'Çapraz C İmalat' },
    { item_code: 'RONDELA-CPZ-AGB', quantity: 288, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-3C', notes: 'Çapraz C İmalat' },

    // AG.3-4 - Aşıklar İmalat
    { item_code: 'HEA-100-N1-AGB', quantity: 11, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-4', notes: 'Aşıklar İmalat - HEA 100 N1 (127 MT)' },
    { item_code: 'HEA-100-N2-AGB', quantity: 32, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-4', notes: 'Aşıklar İmalat - HEA 100 N2 (376 MT)' },
    { item_code: 'HEA-200-ASK-AGB', quantity: 3, movement_type: 'Çıkış', reference_no: 'AGBEYLI-AG3-4', notes: 'Aşıklar İmalat - HEA 200 (28 MT)' },
  ]

  const handleRestore = async () => {
    try {
      setLoading(true)
      setMessage('')

      // 1. Malzemeleri ekle
      const { data: insertedMaterials, error: materialsError } = await supabase
        .from('stock_items')
        .insert(materials)
        .select()

      if (materialsError) throw materialsError

      // 2. Her malzeme için ID'sini bul ve stok hareketlerini ekle
      const movementsWithIds = []
      for (const movement of stockMovements) {
        const material = insertedMaterials.find(m => m.item_code === movement.item_code)
        if (material) {
          movementsWithIds.push({
            stock_item_id: material.id,
            quantity: movement.quantity,
            movement_type: movement.movement_type,
            movement_date: new Date().toISOString(),
            reference_no: movement.reference_no,
            notes: movement.notes
          })
        }
      }

      const { error: movementsError } = await supabase
        .from('stock_movements')
        .insert(movementsWithIds)

      if (movementsError) throw movementsError

      setMessage(`✅ Başarılı! ${materials.length} malzeme ve ${stockMovements.length} stok hareketi eklendi.`)
    } catch (error) {
      console.error('Restore hatası:', error)
      setMessage(`❌ Hata: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            <i className="fas fa-warehouse mr-2"></i>
            AGBEYLI Projesi Malzeme Geri Yükleme
          </h1>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <p className="text-sm text-blue-700">
              <strong>Proje:</strong> AGBEYLI<br />
              <strong>Toplam Malzeme:</strong> {materials.length} adet<br />
              <strong>Toplam Hareket:</strong> {stockMovements.length} adet<br />
              <strong>Fazlar:</strong> Angalage İmalat, Ayak İmalat (A/B/C/D), Makas İmalat (A/B/C/D), Çapraz İmalat (A/B/C), Aşıklar İmalat
            </p>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-2">Malzeme Kategorileri:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className="bg-gray-50 p-2 rounded">
                <span className="font-medium">Profiller:</span> HEB 200, IPE 300, HEA 100/200
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="font-medium">Borular:</span> C 127x8, C 101.6x6
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="font-medium">Bağlantılar:</span> Blak Base, Gusset, BLAK A/B/C/D
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="font-medium">Plakalar:</span> Plate, Plate A/B/C
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="font-medium">Bağlantı:</span> Civata, Somun, Rondela
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="font-medium">Özel:</span> Tij 304, Angal Plak
              </div>
            </div>
          </div>

          <button
            onClick={handleRestore}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                İşleniyor...
              </>
            ) : (
              <>
                <i className="fas fa-download"></i>
                Malzemeleri Geri Yükle
              </>
            )}
          </button>

          {message && (
            <div className={`mt-4 p-4 rounded-lg ${message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
