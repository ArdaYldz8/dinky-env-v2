import { useState } from 'react'
import { supabase } from '../../services/supabase'

export default function RestoreHasanBalMaterialsPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // HASAN BAL Projesi Malzemeleri
  const materials = [
    // Angalage İmalat (H.B.1 ve H.B.2)
    { item_name: 'ANGL PLAK', item_code: 'ANGL-PLAK-HB', category: 'Plaka', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Tij', item_code: 'TIJ-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Somun (Angalage)', item_code: 'SOMUN-ANG-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },

    // Ayak İmalat - Ahır (H.B.5-1)
    { item_name: 'HEB 300 Profil', item_code: 'HEB-300-HB', category: 'Profil', unit: 'metre', current_stock: 0, is_project_material: true },
    { item_name: 'Blak Base (Ahır)', item_code: 'BLAK-BASE-AHIR-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Plate A (Ayak)', item_code: 'PLATE-A-AYAK-HB', category: 'Plaka', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Plate B (Ayak)', item_code: 'PLATE-B-AYAK-HB', category: 'Plaka', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Somun (Ayak)', item_code: 'SOMUN-AYAK-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Rondela (Ayak)', item_code: 'RONDELA-AYAK-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },

    // Makas İmalat - Ahır (H.B.5-2)
    { item_name: 'IPE 240 Profil', item_code: 'IPE-240-HB', category: 'Profil', unit: 'metre', current_stock: 0, is_project_material: true },
    { item_name: 'Plate (Makas)', item_code: 'PLATE-MAKAS-HB', category: 'Plaka', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK A (Makas)', item_code: 'BLAK-A-MKS-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK B (Makas)', item_code: 'BLAK-B-MKS-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK C (Makas)', item_code: 'BLAK-C-MKS-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK D (Makas)', item_code: 'BLAK-D-MKS-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Gusset (Makas)', item_code: 'GUSSET-MKS-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Civata (Makas)', item_code: 'CIVATA-MKS-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Somun (Makas)', item_code: 'SOMUN-MKS-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Rondela (Makas)', item_code: 'RONDELA-MKS-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },

    // Çapraz İmalat - Ahır (H.B.5-3 ve H.B.5-4)
    { item_name: 'NPU 120 Profil', item_code: 'NPU-120-HB', category: 'Profil', unit: 'metre', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK A (Çapraz)', item_code: 'BLAK-A-CPZ-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK B (Çapraz)', item_code: 'BLAK-B-CPZ-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK C (Çapraz)', item_code: 'BLAK-C-CPZ-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK D (Çapraz)', item_code: 'BLAK-D-CPZ-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK E (Çapraz)', item_code: 'BLAK-E-CPZ-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK F (Çapraz)', item_code: 'BLAK-F-CPZ-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Civata (Çapraz)', item_code: 'CIVATA-CPZ-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Somun (Çapraz)', item_code: 'SOMUN-CPZ-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Rondela (Çapraz)', item_code: 'RONDELA-CPZ-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },

    // Aşıklar İmalat - Ahır (H.B.5-5)
    { item_name: 'L50X50X5 Köşebent', item_code: 'L50X50X5-HB', category: 'Profil', unit: 'metre', current_stock: 0, is_project_material: true },
    { item_name: 'CS180/80/20*2 C Profil', item_code: 'CS180-80-20-HB', category: 'Profil', unit: 'metre', current_stock: 0, is_project_material: true },

    // Ayak İmalat - Depo (H.B.6-1)
    { item_name: 'Blak Base (Depo)', item_code: 'BLAK-BASE-DEPO-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },

    // Makas İmalat - Depo (H.B.6-2)
    { item_name: 'HEA 200 Profil', item_code: 'HEA-200-HB', category: 'Profil', unit: 'metre', current_stock: 0, is_project_material: true },
    { item_name: 'Plate (Depo Makas)', item_code: 'PLATE-DEPO-MKS-HB', category: 'Plaka', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Gusset (Depo)', item_code: 'GUSSET-DEPO-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK A (Depo Makas)', item_code: 'BLAK-A-DEPO-MKS-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK B (Depo Makas)', item_code: 'BLAK-B-DEPO-MKS-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Civata (Depo)', item_code: 'CIVATA-DEPO-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Somun (Depo)', item_code: 'SOMUN-DEPO-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'Rondela (Depo)', item_code: 'RONDELA-DEPO-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },

    // Çapraz İmalat - Depo (H.B.6-3)
    { item_name: 'NPU 80 Profil', item_code: 'NPU-80-HB', category: 'Profil', unit: 'metre', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK A (Depo Çapraz)', item_code: 'BLAK-A-DEPO-CPZ-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK B (Depo Çapraz)', item_code: 'BLAK-B-DEPO-CPZ-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK C (Depo Çapraz)', item_code: 'BLAK-C-DEPO-CPZ-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },
    { item_name: 'BLAK D (Depo Çapraz)', item_code: 'BLAK-D-DEPO-CPZ-HB', category: 'Bağlantı', unit: 'adet', current_stock: 0, is_project_material: true },

    // Aşıklar İmalat - Depo (H.B.6-4)
    { item_name: 'CS160/80/20*2 C Profil', item_code: 'CS160-80-20-HB', category: 'Profil', unit: 'metre', current_stock: 0, is_project_material: true },
  ]

  // Stok hareketleri - fazları temsil eden
  const stockMovements = [
    // H.B.1 - Angalage Ahır İmalat (40 Blak Base)
    { item_code: 'ANGL-PLAK-HB', quantity: 40, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB1', notes: 'Angalage Ahır İmalat - H.B.1' },
    { item_code: 'TIJ-HB', quantity: 320, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB1', notes: 'Angalage Ahır İmalat - H.B.1' },
    { item_code: 'SOMUN-ANG-HB', quantity: 320, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB1', notes: 'Angalage Ahır İmalat - H.B.1' },

    // H.B.2 - Angalage Depo İmalat (8 Blak Base)
    { item_code: 'ANGL-PLAK-HB', quantity: 8, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB2', notes: 'Angalage Depo İmalat - H.B.2' },
    { item_code: 'TIJ-HB', quantity: 64, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB2', notes: 'Angalage Depo İmalat - H.B.2' },
    { item_code: 'SOMUN-ANG-HB', quantity: 64, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB2', notes: 'Angalage Depo İmalat - H.B.2' },

    // H.B.5-1 - Ayak İmalat Ahır (40 ayak - 180 MT)
    { item_code: 'HEB-300-HB', quantity: 15, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-1', notes: 'Ayak İmalat Ahır - 40 ayak (180 MT)' },
    { item_code: 'BLAK-BASE-AHIR-HB', quantity: 40, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-1', notes: 'Ayak İmalat Ahır - 40 ayak' },
    { item_code: 'PLATE-A-AYAK-HB', quantity: 80, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-1', notes: 'Ayak İmalat Ahır' },
    { item_code: 'PLATE-B-AYAK-HB', quantity: 160, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-1', notes: 'Ayak İmalat Ahır' },
    { item_code: 'SOMUN-AYAK-HB', quantity: 640, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-1', notes: 'Ayak İmalat Ahır' },
    { item_code: 'RONDELA-AYAK-HB', quantity: 320, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-1', notes: 'Ayak İmalat Ahır' },

    // H.B.5-2 - Makas İmalat Ahır (10 makas - 196 MT)
    { item_code: 'IPE-240-HB', quantity: 17, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-2', notes: 'Makas İmalat Ahır - 10 makas (196 MT)' },
    { item_code: 'PLATE-MAKAS-HB', quantity: 80, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-2', notes: 'Makas İmalat Ahır' },
    { item_code: 'BLAK-A-MKS-HB', quantity: 20, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-2', notes: 'Makas İmalat Ahır' },
    { item_code: 'BLAK-B-MKS-HB', quantity: 20, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-2', notes: 'Makas İmalat Ahır' },
    { item_code: 'BLAK-C-MKS-HB', quantity: 20, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-2', notes: 'Makas İmalat Ahır' },
    { item_code: 'BLAK-D-MKS-HB', quantity: 40, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-2', notes: 'Makas İmalat Ahır' },
    { item_code: 'GUSSET-MKS-HB', quantity: 80, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-2', notes: 'Makas İmalat Ahır - Gusset' },
    { item_code: 'CIVATA-MKS-HB', quantity: 460, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-2', notes: 'Makas İmalat Ahır' },
    { item_code: 'SOMUN-MKS-HB', quantity: 460, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-2', notes: 'Makas İmalat Ahır' },
    { item_code: 'RONDELA-MKS-HB', quantity: 920, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-2', notes: 'Makas İmalat Ahır' },

    // H.B.5-3 - Çapraz A İmalat (6 çapraz - 130 MT)
    { item_code: 'NPU-120-HB', quantity: 11, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-3', notes: 'Çapraz A İmalat - 6 çapraz (130 MT)' },
    { item_code: 'BLAK-A-CPZ-HB', quantity: 24, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-3', notes: 'Çapraz A İmalat' },
    { item_code: 'BLAK-B-CPZ-HB', quantity: 12, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-3', notes: 'Çapraz A İmalat' },
    { item_code: 'BLAK-C-CPZ-HB', quantity: 72, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-3', notes: 'Çapraz A İmalat' },
    { item_code: 'BLAK-D-CPZ-HB', quantity: 12, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-3', notes: 'Çapraz A İmalat' },
    { item_code: 'CIVATA-CPZ-HB', quantity: 288, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-3', notes: 'Çapraz A İmalat' },
    { item_code: 'SOMUN-CPZ-HB', quantity: 288, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-3', notes: 'Çapraz A İmalat' },
    { item_code: 'RONDELA-CPZ-HB', quantity: 576, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-3', notes: 'Çapraz A İmalat' },

    // H.B.5-4 - Çapraz B İmalat (3 çapraz - 217 MT)
    { item_code: 'NPU-120-HB', quantity: 19, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-4', notes: 'Çapraz B İmalat - 3 çapraz (217 MT)' },
    { item_code: 'BLAK-A-CPZ-HB', quantity: 108, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-4', notes: 'Çapraz B İmalat' },
    { item_code: 'BLAK-B-CPZ-HB', quantity: 24, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-4', notes: 'Çapraz B İmalat' },
    { item_code: 'BLAK-C-CPZ-HB', quantity: 12, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-4', notes: 'Çapraz B İmalat' },
    { item_code: 'BLAK-D-CPZ-HB', quantity: 12, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-4', notes: 'Çapraz B İmalat' },
    { item_code: 'BLAK-E-CPZ-HB', quantity: 6, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-4', notes: 'Çapraz B İmalat' },
    { item_code: 'BLAK-F-CPZ-HB', quantity: 12, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-4', notes: 'Çapraz B İmalat' },
    { item_code: 'CIVATA-CPZ-HB', quantity: 192, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-4', notes: 'Çapraz B İmalat' },
    { item_code: 'SOMUN-CPZ-HB', quantity: 192, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-4', notes: 'Çapraz B İmalat' },
    { item_code: 'RONDELA-CPZ-HB', quantity: 384, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-4', notes: 'Çapraz B İmalat' },

    // H.B.5-5 - Aşıklar İmalat Ahır (L: 23 MT, CS180: 83 MT)
    { item_code: 'L50X50X5-HB', quantity: 4, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-5', notes: 'Aşıklar İmalat Ahır - L50x50x5 (23 MT)' },
    { item_code: 'CS180-80-20-HB', quantity: 83, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB5-5', notes: 'Aşıklar İmalat Ahır - CS180/80/20*2 (992 MT)' },

    // H.B.6-1 - Ayak İmalat Depo (8 ayak - 20 MT)
    { item_code: 'HEB-300-HB', quantity: 2, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB6-1', notes: 'Ayak İmalat Depo - 8 ayak (20 MT)' },
    { item_code: 'BLAK-BASE-DEPO-HB', quantity: 8, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB6-1', notes: 'Ayak İmalat Depo - 8 ayak' },
    { item_code: 'PLATE-A-AYAK-HB', quantity: 16, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB6-1', notes: 'Ayak İmalat Depo' },
    { item_code: 'PLATE-B-AYAK-HB', quantity: 32, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB6-1', notes: 'Ayak İmalat Depo' },
    { item_code: 'SOMUN-AYAK-HB', quantity: 128, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB6-1', notes: 'Ayak İmalat Depo' },
    { item_code: 'RONDELA-AYAK-HB', quantity: 64, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB6-1', notes: 'Ayak İmalat Depo' },

    // H.B.6-2 - Makas İmalat Depo (4 makas - 55 MT)
    { item_code: 'HEA-200-HB', quantity: 5, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB6-2', notes: 'Makas İmalat Depo - 4 makas (55 MT)' },
    { item_code: 'PLATE-DEPO-MKS-HB', quantity: 104, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB6-2', notes: 'Makas İmalat Depo - Plate (2+3+6+8+11)' },
    { item_code: 'GUSSET-DEPO-HB', quantity: 24, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB6-2', notes: 'Makas İmalat Depo - Gusset (4+7+9)' },
    { item_code: 'BLAK-A-DEPO-MKS-HB', quantity: 16, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB6-2', notes: 'Makas İmalat Depo' },
    { item_code: 'BLAK-B-DEPO-MKS-HB', quantity: 8, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB6-2', notes: 'Makas İmalat Depo' },
    { item_code: 'CIVATA-DEPO-HB', quantity: 120, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB6-2', notes: 'Makas İmalat Depo' },
    { item_code: 'SOMUN-DEPO-HB', quantity: 120, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB6-2', notes: 'Makas İmalat Depo' },
    { item_code: 'RONDELA-DEPO-HB', quantity: 240, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB6-2', notes: 'Makas İmalat Depo' },

    // H.B.6-3 - Çapraz İmalat Depo (2 çapraz - 94 MT)
    { item_code: 'NPU-80-HB', quantity: 8, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB6-3', notes: 'Çapraz İmalat Depo - 2 çapraz (94 MT)' },
    { item_code: 'BLAK-A-DEPO-CPZ-HB', quantity: 48, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB6-3', notes: 'Çapraz İmalat Depo' },
    { item_code: 'BLAK-B-DEPO-CPZ-HB', quantity: 16, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB6-3', notes: 'Çapraz İmalat Depo' },
    { item_code: 'BLAK-C-DEPO-CPZ-HB', quantity: 8, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB6-3', notes: 'Çapraz İmalat Depo' },
    { item_code: 'BLAK-D-DEPO-CPZ-HB', quantity: 8, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB6-3', notes: 'Çapraz İmalat Depo' },
    { item_code: 'CIVATA-DEPO-HB', quantity: 192, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB6-3', notes: 'Çapraz İmalat Depo' },
    { item_code: 'SOMUN-DEPO-HB', quantity: 192, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB6-3', notes: 'Çapraz İmalat Depo' },
    { item_code: 'RONDELA-DEPO-HB', quantity: 384, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB6-3', notes: 'Çapraz İmalat Depo' },

    // H.B.6-4 - Aşıklar İmalat Depo (L: 13 MT, CS160: 25 MT)
    { item_code: 'L50X50X5-HB', quantity: 3, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB6-4', notes: 'Aşıklar İmalat Depo - L50x50x5 (13 MT)' },
    { item_code: 'CS160-80-20-HB', quantity: 25, movement_type: 'Çıkış', reference_no: 'HASAN-BAL-HB6-4', notes: 'Aşıklar İmalat Depo - CS160/80/20*2 (298 MT)' },
  ]

  const handleRestore = async () => {
    try {
      setLoading(true)
      setMessage('')

      // 0. HASAN BAL projesini bul
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .ilike('project_name', '%HASAN%BAL%')
        .single()

      if (!project) {
        setMessage('❌ HASAN BAL projesi bulunamadı. Önce projeyi oluşturun.')
        return
      }

      // 1. Önce mevcut malzemeleri kontrol et
      const { data: existingMaterials } = await supabase
        .from('stock_items')
        .select('item_code, id')
        .in('item_code', materials.map(m => m.item_code))

      const existingCodes = new Map(existingMaterials?.map(m => [m.item_code, m.id]) || [])
      const newMaterials = materials.filter(m => !existingCodes.has(m.item_code))

      let allMaterials = []

      // 2. Sadece yeni malzemeleri ekle
      if (newMaterials.length > 0) {
        const { data, error: materialsError } = await supabase
          .from('stock_items')
          .insert(newMaterials)
          .select()

        if (materialsError) throw materialsError
        allMaterials = data
      }

      // 3. Mevcut malzemeleri de listeye ekle
      if (existingCodes.size > 0) {
        const { data } = await supabase
          .from('stock_items')
          .select('*')
          .in('item_code', Array.from(existingCodes.keys()))

        allMaterials = [...allMaterials, ...(data || [])]
      }

      // 4. Helper function to find item (İlhan pattern)
      const findItem = (code) => allMaterials.find(item => item.item_code === code)

      // 5. Create movements with proper dates (İlhan pattern)
      const movements = stockMovements.map(movement => ({
        item_id: findItem(movement.item_code).id,
        quantity: movement.quantity,
        movement_type: movement.movement_type,
        project_id: project.id,
        notes: movement.notes,
        movement_date: new Date().toISOString().split('T')[0]
      }))

      const { error: movementsError } = await supabase
        .from('stock_movements')
        .insert(movements)

      if (movementsError) throw movementsError

      const newCount = newMaterials.length
      const existingCount = existingCodes.size
      setMessage(`✅ Başarılı! ${newCount} yeni malzeme eklendi, ${existingCount} mevcut malzeme kullanıldı. ${movements.length} stok hareketi eklendi.`)
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
            HASAN BAL Projesi Malzeme Geri Yükleme
          </h1>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <p className="text-sm text-blue-700">
              <strong>Proje:</strong> HASAN BAL<br />
              <strong>Toplam Malzeme:</strong> {materials.length} adet<br />
              <strong>Toplam Hareket:</strong> {stockMovements.length} adet<br />
              <strong>Fazlar:</strong> Angalage (Ahır/Depo), Çelik Ahır İmalat, Çelik Depo İmalat
            </p>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-2">Malzeme Kategorileri:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className="bg-gray-50 p-2 rounded">
                <span className="font-medium">Profiller:</span> HEB 300, IPE 240, HEA 200, NPU 120/80
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="font-medium">C Profiller:</span> CS180/80, CS160/80
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="font-medium">Köşebent:</span> L50x50x5
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="font-medium">Bağlantılar:</span> Blak Base, BLAK A-F, Gusset
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="font-medium">Plakalar:</span> Plate A/B, Plate
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="font-medium">Bağlantı:</span> Civata, Somun, Rondela, Tij
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
