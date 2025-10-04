# Dinky Metal ERP v2

Modern, güvenli ve performanslı ERP sistemi - Çalışan, stok ve proje yönetimi için kapsamlı çözüm.

## 🎯 Proje Hakkında

Dinky Metal ERP v2, metal sektöründe faaliyet gösteren işletmeler için geliştirilmiş, modern web teknolojileri kullanılarak inşa edilmiş bir ERP sistemidir. Çalışan yönetimi, proje takibi, stok kontrolü ve detaylı raporlama özellikleri sunar.

### Temel Özellikler

- 👥 **Çalışan Yönetimi**: Tam kapsamlı CRUD, departman/pozisyon takibi, maaş bilgileri
- 📊 **Proje Yönetimi**: Müşteri ilişkilendirme, proje durumu, bütçe ve tarih takibi
- 📦 **Stok Yönetimi**: Ürün kayıtları, birim/kategori takibi, fiyat bilgileri
- 🏢 **Müşteri Yönetimi**: Firma bilgileri, iletişim detayları, vergi kayıtları
- 📈 **Raporlama**: Günlük/haftalık/aylık raporlar, çalışan bazlı analiz
- ⚙️ **Ayarlar**: Proje lokasyonları, aktivite izleme, mesai yönetimi
- 🔐 **Güvenlik**: Row Level Security (RLS), role-based access control
- 📱 **Responsive Tasarım**: Mobil, tablet ve masaüstü uyumlu

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Node.js 18+
- npm veya yarn
- Supabase hesabı ve projesi

### Kurulum

1. **Projeyi klonlayın**
```bash
git clone <repository-url>
cd dinky-erp-v2
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
```

3. **Environment dosyasını oluşturun**
```bash
cp .env.example .env.local
```

4. **.env.local dosyasını düzenleyin**
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_NAME=Dinky Metal ERP
VITE_APP_VERSION=2.0.0
```

5. **Veritabanı migrasyonlarını uygulayın**

Supabase Dashboard → SQL Editor'de şu dosyaları sırayla çalıştırın:
- [sql/migrations/001_security_and_performance_fixes.sql](sql/migrations/001_security_and_performance_fixes.sql)
- [sql/create_activity_monitoring.sql](sql/create_activity_monitoring.sql)

6. **Geliştirme sunucusunu başlatın**
```bash
npm run dev
```

Uygulama [http://localhost:5173](http://localhost:5173) adresinde çalışacaktır.

## 📁 Proje Yapısı

```
dinky-erp-v2/
├── src/
│   ├── components/        # Paylaşılan UI bileşenleri
│   │   ├── Layout.jsx     # Ana sayfa düzeni
│   │   └── Navbar.jsx     # Navigasyon çubuğu
│   ├── features/          # Feature-based modüller
│   │   ├── auth/          # Giriş/çıkış modülü
│   │   ├── customers/     # Müşteri yönetimi
│   │   ├── dashboard/     # Ana dashboard
│   │   ├── employees/     # Çalışan yönetimi
│   │   ├── projects/      # Proje yönetimi
│   │   ├── reports/       # Raporlama modülü
│   │   ├── settings/      # Sistem ayarları
│   │   └── stock/         # Stok yönetimi
│   ├── shared/
│   │   └── hooks/         # Paylaşılan React hooks
│   │       ├── useToast.js      # Toast bildirimleri
│   │       ├── useModal.js      # Modal yönetimi
│   │       └── useDataFetch.js  # Veri çekme
│   ├── stores/            # Zustand state yönetimi
│   │   └── authStore.js   # Authentication store
│   ├── services/          # Dış servisler
│   │   └── supabase.js    # Supabase client
│   ├── utils/             # Yardımcı fonksiyonlar
│   │   └── errorHandler.js # Merkezi hata yönetimi
│   ├── App.jsx            # Ana routing
│   └── main.jsx           # React entry point
├── sql/
│   └── migrations/        # Veritabanı migrasyonları
├── docs/                  # Dokümantasyon
│   ├── DEPLOYMENT.md      # Production deployment rehberi
│   └── SECURITY_CONFIGURATION.md # Güvenlik yapılandırması
├── .env.example           # Environment şablonu
├── package.json
└── vite.config.js         # Vite yapılandırması
```

## 🏗️ Mimari

### Frontend Stack

- **React 19.1.1**: Modern UI framework
- **Vite 7.1.7**: Hızlı build tool ve dev server
- **Zustand 5.0.8**: Hafif state management
- **Tailwind CSS 3.4.17**: Utility-first CSS framework
- **ApexCharts 4.4.0**: İnteraktif grafik ve chart kütüphanesi
- **React Router 7.5.2**: Client-side routing
- **Lucide React 0.468.0**: Modern icon seti

### Backend & Database

- **Supabase**: PostgreSQL 17.6.1 tabanlı Backend-as-a-Service
  - Authentication & Authorization
  - PostgreSQL veritabanı
  - Row Level Security (RLS)
  - Real-time subscriptions
  - RESTful API & GraphQL

### Veritabanı Şeması

**9 Ana Tablo**:
- `employees` - Çalışan bilgileri ve departman ilişkileri
- `customers` - Müşteri firma kayıtları
- `projects` - Proje yönetimi ve müşteri ilişkileri
- `stock_items` - Stok ürün kayıtları
- `attendance_records` - Çalışan devam kayıtları
- `project_locations` - Proje çalışma lokasyonları
- `activity_logs` - Sistem aktivite kayıtları
- `overtime_management` - Mesai yönetimi
- `departments` - Departman tanımları

**Güvenlik**:
- RLS politikaları tüm tablolarda aktif
- Foreign key ilişkileri indeksli
- Güvenli function tanımlamaları (`SECURITY DEFINER`)

## 🔧 Geliştirme

### Komutlar

```bash
# Geliştirme sunucusu
npm run dev

# Production build
npm run build

# Build önizleme
npm run preview

# Linting
npm run lint
```

### Kod Standartları

- **Feature-based architecture**: Her modül kendi dizininde
- **Shared hooks pattern**: Ortak hook'lar `src/shared/hooks/` altında
- **Centralized error handling**: `src/utils/errorHandler.js` kullanımı zorunlu
- **Turkish localization**: Tüm UI metinleri Türkçe
- **Consistent naming**: camelCase (JS), PascalCase (React components)

### Custom Hooks

#### useToast
Toast bildirimleri için:
```javascript
import { useToast } from '@/shared/hooks'

const { showSuccess, showError, showWarning } = useToast()
showSuccess('İşlem başarılı!')
showError('Bir hata oluştu')
```

#### useModal
Modal yönetimi için:
```javascript
import { useModal } from '@/shared/hooks'

const { isOpen, openModal, closeModal, modalData } = useModal()
openModal({ id: 123, name: 'Test' })
```

#### useDataFetch
Supabase veri çekme için:
```javascript
import { useDataFetch } from '@/shared/hooks'

const { data, loading, error, refetch } = useDataFetch({
  table: 'employees',
  select: '*',
  filters: { department: 'IT' },
  orderBy: { column: 'full_name', ascending: true }
})
```

### Error Handling

Merkezi hata yönetimi kullanın:
```javascript
import { handleSupabaseError } from '@/utils/errorHandler'

try {
  const { error } = await supabase.from('employees').insert(data)
  if (error) throw error
} catch (error) {
  const userMessage = handleSupabaseError(error)
  showError(userMessage)
}
```

## 📊 Modül Detayları

### Dashboard
- Çalışan sayısı, aktif projeler, müşteri sayısı özet kartları
- Departman bazlı çalışan dağılımı grafiği
- Son 30 günlük devam grafiği
- Proje durumu dağılımı

### Çalışan Yönetimi
- CRUD işlemleri (Ekleme, düzenleme, silme, listeleme)
- Departman ve pozisyon bazlı filtreleme
- Arama fonksiyonu
- Maaş bilgisi yönetimi

### Proje Yönetimi
- Müşteri ilişkilendirmeli proje kayıtları
- Proje yöneticisi ataması
- Durum takibi (Planlama, Devam Ediyor, Tamamlandı, İptal)
- Başlangıç/bitiş tarihi ve bütçe yönetimi

### Müşteri Yönetimi
- Firma bilgileri ve iletişim kayıtları
- Vergi dairesi ve vergi numarası takibi
- Adres bilgileri
- Arama ve filtreleme

### Stok Yönetimi
- Ürün kategorileri ve birim yönetimi
- Fiyat bilgisi takibi
- Stok kodu sistemi
- Arama ve listeleme

### Raporlama
- Günlük devam raporu
- Haftalık devam özeti
- Aylık devam analizi
- Çalışan bazlı raporlar
- Excel export hazır yapı

### Ayarlar
- **Proje Lokasyonları**: Çalışma alanları tanımlama
- **Aktivite İzleme**: Sistem log kayıtları görüntüleme
- **Mesai Yönetimi**: Fazla mesai kayıtları

## 🔐 Güvenlik

### Row Level Security (RLS)
Tüm tablolarda RLS aktif. Kullanıcılar sadece yetkileri dahilindeki verilere erişebilir.

### Authentication
Supabase Auth ile güvenli kimlik doğrulama:
- Email/password authentication
- Session yönetimi
- Otomatik token yenileme

### Güvenlik Yapılandırması
Production ortamı için [SECURITY_CONFIGURATION.md](docs/SECURITY_CONFIGURATION.md) rehberini takip edin:
- MFA aktivasyonu
- Şifre politikaları
- Rate limiting
- Leaked password protection

## 🚀 Production Deployment

Detaylı deployment rehberi için [DEPLOYMENT.md](docs/DEPLOYMENT.md) dokümanını inceleyin.

### Hızlı Deployment (Vercel)

1. **Build**
```bash
npm run build
```

2. **Deploy**
```bash
vercel --prod
```

3. **Environment Variables**
Vercel Dashboard'da environment variable'ları ekleyin.

### Desteklenen Platformlar
- ✅ Vercel (Önerilen)
- ✅ Netlify
- ✅ AWS S3 + CloudFront
- ✅ Self-hosted (Nginx)

## 📈 Performans

### Optimizasyonlar
- ✅ Foreign key indeksleri tüm ilişkiler için
- ✅ Composite indeksler sık kullanılan sorgular için
- ✅ Kullanılmayan indeksler temizlendi
- ✅ Vite code splitting otomatik
- ✅ Lazy loading for routes (React.lazy)

### Hedef Metrikler
- Lighthouse Performance: >90
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Cumulative Layout Shift: <0.1

## 🧪 Test (Planlanan)

Phase 3'te eklenecek:
- Unit tests (Vitest)
- Component tests (React Testing Library)
- E2E tests (Playwright)
- API tests

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

### Commit Mesaj Formatı
```
feat: Yeni özellik
fix: Hata düzeltme
docs: Dokümantasyon
style: Kod formatı
refactor: Kod iyileştirme
test: Test ekleme
chore: Rutin görevler
```

## 📝 Lisans

Bu proje özel kullanım içindir.

## 📞 İletişim & Destek

### Dokümantasyon
- [Deployment Rehberi](docs/DEPLOYMENT.md)
- [Güvenlik Yapılandırması](docs/SECURITY_CONFIGURATION.md)

### Sorun Bildirimi
GitHub Issues üzerinden bildirebilirsiniz.

## 🗺️ Roadmap

### ✅ Phase 1: Stabilization (Tamamlandı)
- Güvenlik açıkları giderildi
- Performans optimizasyonları uygulandı
- Kod kalitesi iyileştirildi

### ✅ Phase 2: Feature Completion (Tamamlandı)
- Tüm CRUD modülleri tamamlandı
- Shared hooks sistemi oluşturuldu
- Merkezi hata yönetimi eklendi

### 🔄 Phase 3: Testing (Planlanan)
- Test infrastructure kurulumu
- Unit ve integration testler
- E2E test senaryoları

### 📦 Phase 4: Production Ready (Devam ediyor)
- ✅ Deployment dokümantasyonu
- ✅ Güvenlik yapılandırması
- ✅ README dokümantasyonu
- ⏳ Final verification checklist

### 🚀 Future Enhancements
- TypeScript migration
- Real-time collaboration
- Mobile app (React Native)
- Advanced analytics
- Multi-language support

## 🎉 Teşekkürler

Bu proje modern web teknolojileri ve best practice'ler kullanılarak geliştirilmiştir.

---

**Version**: 2.0.0
**Last Updated**: 2025-10-02
**Status**: Production Ready
