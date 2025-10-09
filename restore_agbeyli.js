const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ksmlzjucjzzmwmcwqonb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbWx6anVjanp6bXdtY3dxb25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1NTgzNTAsImV4cCI6MjA1MTEzNDM1MH0.CZEtD3o0RYqEbbsK4fy7gNFg3qNcMfx2eJD_TdoR_wE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreAgbeyliMaterials() {
  console.log('🔍 Getting AĞBEYLI project...');

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('name', 'AĞBEYLI')
    .single();

  if (projectError || !project) {
    console.error('❌ AĞBEYLI project not found:', projectError);
    return;
  }

  console.log(`✅ Found project: ${project.id}`);
  console.log('🗑️  Deleting existing materials...');

  const { error: deleteError } = await supabase
    .from('project_materials')
    .delete()
    .eq('project_id', project.id);

  if (deleteError) {
    console.error('❌ Error deleting materials:', deleteError);
    return;
  }

  console.log('✅ Existing materials deleted');
  console.log('📦 Inserting new materials...');

  const materials = [
    // angalage imalati AG.1
    { material_name: 'ANGL PLAK', quantity: 38, unit: 'adet' },
    { material_name: 'TİJ 304', quantity: 304, unit: 'adet' },
    { material_name: 'SOMUN 304', quantity: 304, unit: 'adet' },

    // ayak A imalat AG.3-1 - 18 ayak - 73 MT
    { material_name: 'HEB 200 (Ayak A)', quantity: 7, unit: 'metre' },
    { material_name: 'Blak Base (Ayak A)', quantity: 18, unit: 'adet' },
    { material_name: 'Plate (Ayak A)', quantity: 72, unit: 'adet' },
    { material_name: 'SOMUN (Ayak A)', quantity: 288, unit: 'adet' },
    { material_name: 'RONDELA (Ayak A)', quantity: 144, unit: 'adet' },

    // ayak B imalat AG.3-1 - 16 ayak - 64 MT
    { material_name: 'HEB 200 (Ayak B)', quantity: 6, unit: 'metre' },
    { material_name: 'Blak Base (Ayak B)', quantity: 16, unit: 'adet' },
    { material_name: 'Plate (Ayak B)', quantity: 64, unit: 'adet' },
    { material_name: 'SOMUN (Ayak B)', quantity: 256, unit: 'adet' },
    { material_name: 'RONDELA (Ayak B)', quantity: 128, unit: 'adet' },

    // ayak C imalat AG.3-1 - 2 ayak - 6 MT
    { material_name: 'HEB 200 (Ayak C)', quantity: 0.5, unit: 'metre' },
    { material_name: 'Blak Base (Ayak C)', quantity: 2, unit: 'adet' },
    { material_name: 'Plate (Ayak C)', quantity: 8, unit: 'adet' },
    { material_name: 'SOMUN (Ayak C)', quantity: 32, unit: 'adet' },
    { material_name: 'RONDELA (Ayak C)', quantity: 16, unit: 'adet' },

    // ayak D imalat AG.3-1 - 2 ayak - 6 MT
    { material_name: 'HEB 200 (Ayak D)', quantity: 0.5, unit: 'metre' },
    { material_name: 'Blak Base (Ayak D)', quantity: 2, unit: 'adet' },
    { material_name: 'Plate (Ayak D)', quantity: 8, unit: 'adet' },
    { material_name: 'SOMUN (Ayak D)', quantity: 32, unit: 'adet' },
    { material_name: 'RONDELA (Ayak D)', quantity: 16, unit: 'adet' },

    // makas A imalat AG.3-2 - 12 makas - 87 MT
    { material_name: 'IPE 300 (Makas A)', quantity: 8, unit: 'metre' },
    { material_name: 'Plate A (Makas A)', quantity: 56, unit: 'adet' },
    { material_name: 'BLAK A (Makas A)', quantity: 24, unit: 'adet' },
    { material_name: 'Plate B (Makas A)', quantity: 96, unit: 'adet' },
    { material_name: 'Gusset 1 (Makas A)', quantity: 12, unit: 'adet' },
    { material_name: 'Gusset 2 (Makas A)', quantity: 24, unit: 'adet' },
    { material_name: 'BLAK B (Makas A)', quantity: 6, unit: 'adet' },
    { material_name: 'BLAK C (Makas A)', quantity: 24, unit: 'adet' },
    { material_name: 'Gusset 3 (Makas A)', quantity: 12, unit: 'adet' },
    { material_name: 'CİVATA (Makas A)', quantity: 144, unit: 'adet' },
    { material_name: 'SOMUN (Makas A)', quantity: 144, unit: 'adet' },
    { material_name: 'RONDELA (Makas A)', quantity: 288, unit: 'adet' },

    // makas B imalat AG.3-2 - 8 makas - 59 MT
    { material_name: 'IPE 300 (Makas B)', quantity: 5, unit: 'metre' },
    { material_name: 'Plate A (Makas B)', quantity: 24, unit: 'adet' },
    { material_name: 'Plate B (Makas B)', quantity: 64, unit: 'adet' },
    { material_name: 'BLAK A (Makas B)', quantity: 32, unit: 'adet' },
    { material_name: 'Gusset 1 (Makas B)', quantity: 8, unit: 'adet' },
    { material_name: 'BLAK B (Makas B)', quantity: 8, unit: 'adet' },
    { material_name: 'Plate C (Makas B)', quantity: 8, unit: 'adet' },
    { material_name: 'Gusset 2 (Makas B)', quantity: 16, unit: 'adet' },
    { material_name: 'Gusset 3 (Makas B)', quantity: 16, unit: 'adet' },
    { material_name: 'CİVATA (Makas B)', quantity: 96, unit: 'adet' },
    { material_name: 'SOMUN (Makas B)', quantity: 96, unit: 'adet' },
    { material_name: 'RONDELA (Makas B)', quantity: 192, unit: 'adet' },

    // makas C imalat AG.3-2 - 2 makas - 4 MT
    { material_name: 'IPE 300 (Makas C)', quantity: 0.5, unit: 'metre' },
    { material_name: 'Blak A (Makas C)', quantity: 4, unit: 'adet' },
    { material_name: 'Blak B (Makas C)', quantity: 4, unit: 'adet' },
    { material_name: 'CİVATA (Makas C)', quantity: 24, unit: 'adet' },
    { material_name: 'SOMUN (Makas C)', quantity: 24, unit: 'adet' },
    { material_name: 'RONDELA (Makas C)', quantity: 28, unit: 'adet' },

    // makas D imalat AG.3-2 - 2 makas - 5 MT
    { material_name: 'IPE 300 (Makas D)', quantity: 0.5, unit: 'metre' },
    { material_name: 'Blak A (Makas D)', quantity: 4, unit: 'adet' },
    { material_name: 'Blak B (Makas D)', quantity: 4, unit: 'adet' },
    { material_name: 'CİVATA (Makas D)', quantity: 24, unit: 'adet' },
    { material_name: 'SOMUN (Makas D)', quantity: 24, unit: 'adet' },
    { material_name: 'RONDELA (Makas D)', quantity: 48, unit: 'adet' },

    // capraz A imalat AG.3-3 - 4 capraz - 52 MT
    { material_name: 'C 127 X 8 MM (Çapraz A)', quantity: 9, unit: 'metre' },
    { material_name: 'BLAK A (Çapraz A)', quantity: 16, unit: 'adet' },
    { material_name: 'BLAK B (Çapraz A)', quantity: 24, unit: 'adet' },
    { material_name: 'Plate (Çapraz A)', quantity: 24, unit: 'adet' },
    { material_name: 'BLAK C (Çapraz A)', quantity: 8, unit: 'adet' },
    { material_name: 'CİVATA (Çapraz A)', quantity: 96, unit: 'adet' },
    { material_name: 'SOMUN (Çapraz A)', quantity: 96, unit: 'adet' },
    { material_name: 'RONDELA (Çapraz A)', quantity: 192, unit: 'adet' },

    // capraz B imalat AG.3-3 - 16 capraz - 122 MT
    { material_name: 'C 101.6 X 6 MM (Çapraz B)', quantity: 21, unit: 'metre' },
    { material_name: 'BLAK A (Çapraz B)', quantity: 32, unit: 'adet' },
    { material_name: 'BLAK B (Çapraz B)', quantity: 96, unit: 'adet' },
    { material_name: 'Plate (Çapraz B)', quantity: 96, unit: 'adet' },
    { material_name: 'BLAK C (Çapraz B)', quantity: 16, unit: 'adet' },
    { material_name: 'BLAK D (Çapraz B)', quantity: 32, unit: 'adet' },
    { material_name: 'CİVATA (Çapraz B)', quantity: 384, unit: 'adet' },
    { material_name: 'SOMUN (Çapraz B)', quantity: 384, unit: 'adet' },
    { material_name: 'RONDELA (Çapraz B)', quantity: 768, unit: 'adet' },

    // capraz C imalat AG.3-3 - 6 capraz - 47 MT
    { material_name: 'C 101.6 X 6 MM (Çapraz C)', quantity: 8, unit: 'metre' },
    { material_name: 'BLAK A (Çapraz C)', quantity: 24, unit: 'adet' },
    { material_name: 'BLAK B (Çapraz C)', quantity: 36, unit: 'adet' },
    { material_name: 'Plate (Çapraz C)', quantity: 36, unit: 'adet' },
    { material_name: 'BLAK C (Çapraz C)', quantity: 12, unit: 'adet' },
    { material_name: 'CİVATA (Çapraz C)', quantity: 144, unit: 'adet' },
    { material_name: 'SOMUN (Çapraz C)', quantity: 144, unit: 'adet' },
    { material_name: 'RONDELA (Çapraz C)', quantity: 288, unit: 'adet' },

    // asiklar imalat AG.3-4
    { material_name: 'HEA 100 N1', quantity: 11, unit: 'metre' },
    { material_name: 'HEA 100 N2', quantity: 32, unit: 'metre' },
    { material_name: 'HEA 200 (Aşıklar)', quantity: 3, unit: 'metre' }
  ];

  const materialsWithProjectId = materials.map(m => ({
    ...m,
    project_id: project.id
  }));

  const { data, error } = await supabase
    .from('project_materials')
    .insert(materialsWithProjectId);

  if (error) {
    console.error('❌ Error inserting materials:', error);
    return;
  }

  console.log(`✅ Successfully inserted ${materials.length} materials for AĞBEYLI project`);
}

restoreAgbeyliMaterials();
