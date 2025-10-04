import { useState, useEffect } from 'react'
import Modal from '../../../shared/components/Modal'
import Button from '../../../shared/components/Button'
import { supabase } from '../../../services/supabase'
import { FileText, Upload, Download, Trash2, Eye } from 'lucide-react'

export default function ProjectFilesModal({ isOpen, onClose, projectId }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (isOpen && projectId) {
      loadFiles()
    }
  }, [isOpen, projectId])

  async function loadFiles() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFiles(data || [])
    } catch (error) {
      console.error('Dosyalar yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleFileUpload(event) {
    const file = event.target.files[0]
    if (!file) return

    setUploading(true)
    try {
      // Dosya yolu
      const fileExt = file.name.split('.').pop()
      const fileName = `${projectId}/${Date.now()}.${fileExt}`

      // Supabase Storage'a yükle
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Veritabanına kaydet
      const { error: dbError } = await supabase
        .from('project_files')
        .insert([{
          project_id: projectId,
          file_name: file.name,
          file_path: fileName,
          file_type: fileExt,
          file_size: file.size
        }])

      if (dbError) throw dbError

      await loadFiles()
      event.target.value = ''
    } catch (error) {
      console.error('Dosya yüklenirken hata:', error)
      alert('Dosya yüklenemedi: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleFileDelete(fileId, filePath) {
    if (!confirm('Bu dosyayı silmek istediğinizden emin misiniz?')) return

    try {
      // Storage'dan sil
      const { error: storageError } = await supabase.storage
        .from('project-files')
        .remove([filePath])

      if (storageError) throw storageError

      // Veritabanından sil
      const { error: dbError } = await supabase
        .from('project_files')
        .delete()
        .eq('id', fileId)

      if (dbError) throw dbError

      await loadFiles()
    } catch (error) {
      console.error('Dosya silinirken hata:', error)
      alert('Dosya silinemedi: ' + error.message)
    }
  }

  async function handleFileDownload(filePath, fileName) {
    try {
      const { data, error } = await supabase.storage
        .from('project-files')
        .download(filePath)

      if (error) throw error

      // Blob oluştur ve indir
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Dosya indirilirken hata:', error)
      alert('Dosya indirilemedi: ' + error.message)
    }
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Proje Dosyaları" size="xl">
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Upload */}
          <div className="mb-6">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Dosya yüklemek için tıklayın</span> veya sürükleyin
                </p>
                <p className="text-xs text-gray-500">PDF, Excel, Word, Resim (MAX. 10MB)</p>
              </div>
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
                accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png"
              />
            </label>
            {uploading && (
              <div className="mt-2 text-sm text-indigo-600 text-center">
                Yükleniyor...
              </div>
            )}
          </div>

          {/* Dosya Listesi */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {files.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="mx-auto mb-2 text-gray-400" size={48} />
                <p>Henüz dosya eklenmemiş</p>
              </div>
            ) : (
              files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="text-indigo-600" size={24} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{file.file_name}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{formatFileSize(file.file_size)}</span>
                        <span>•</span>
                        <span>{new Date(file.created_at).toLocaleDateString('tr-TR')}</span>
                        <span>•</span>
                        <span className="uppercase">{file.file_type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleFileDownload(file.file_path, file.file_name)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="İndir"
                    >
                      <Download size={18} />
                    </button>
                    <button
                      onClick={() => handleFileDelete(file.id, file.file_path)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Sil"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button variant="secondary" onClick={onClose}>
              Kapat
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}
