# Dinky Metal ERP - Kullanıcı Hesapları Kurulum Rehberi

## 📋 Genel Bakış

Sistemde 9 farklı kullanıcı rolü ve hesabı bulunmaktadır. Her kullanıcının farklı yetkileri ve erişim seviyeleri vardır.

## 👥 Kullanıcı Rolleri ve Erişim Seviyeleri

### 1. Patron (patron@dinky.com)
**Tam Yetki** - Tüm modüllere erişim
- ✅ Personel Yönetimi
- ✅ Projeler
- ✅ Stok Yönetimi
- ✅ Kalite Kontrol
- ✅ Müşteriler
- ✅ Raporlar
- ✅ Ayarlar
- ✅ Tüm CRUD işlemleri

### 2. Genel Müdür (genelmudur@dinky.com)
**Yönetim Yetkisi** - Ayarlar hariç tüm modüller
- ✅ Personel Yönetimi
- ✅ Projeler
- ✅ Stok Yönetimi
- ✅ Kalite Kontrol
- ✅ Müşteriler
- ✅ Raporlar
- ❌ Ayarlar (sadece okuma)

### 3. Muhasebeci (muhasebe@dinky.com)
**Muhasebe ve Finans Yetkisi**
- ✅ Projeler (Okuma/Güncelleme)
- ✅ Müşteriler (Tam erişim)
- ✅ Raporlar (Tam erişim)
- ❌ Personel Yönetimi
- ❌ Stok Yönetimi
- ❌ Kalite Kontrol

### 4. Depo Sorumlusu (depo@dinky.com)
**Stok Yönetimi Yetkisi**
- ✅ Stok Yönetimi (Tam erişim)
- ✅ Dashboard
- ❌ Diğer tüm modüller

### 5-9. Kalite Kontrol Ustaları (usta1@dinky.com - usta5@dinky.com)
**Kalite Kontrol Yetkisi**
- ✅ Kalite Kontrol (Tam erişim)
- ✅ Dashboard
- ❌ Diğer tüm modüller

## 🔐 Hesap Bilgileri

| Sıra | Rol | Email | Varsayılan Şifre | Erişim Seviyesi |
|------|-----|-------|------------------|-----------------|
| 1 | Patron | patron@dinky.com | Dinky2024! | Tam yetki |
| 2 | Genel Müdür | genelmudur@dinky.com | Dinky2024! | Yönetici |
| 3 | Muhasebeci | muhasebe@dinky.com | Dinky2024! | Muhasebe |
| 4 | Depo Sorumlusu | depo@dinky.com | Dinky2024! | Stok |
| 5 | Usta 1 | usta1@dinky.com | Dinky2024! | Kalite Kontrol |
| 6 | Usta 2 | usta2@dinky.com | Dinky2024! | Kalite Kontrol |
| 7 | Usta 3 | usta3@dinky.com | Dinky2024! | Kalite Kontrol |
| 8 | Usta 4 | usta4@dinky.com | Dinky2024! | Kalite Kontrol |
| 9 | Usta 5 | usta5@dinky.com | Dinky2024! | Kalite Kontrol |

## 🚀 Kurulum Adımları

### 1. Supabase SQL Migration Çalıştırma

Supabase Dashboard'a girin ve SQL Editor'ü açın:

```bash
# Terminal'den migration dosyalarını çalıştır
npx supabase db execute --file supabase-migrations/01_add_roles_system.sql
npx supabase db execute --file supabase-migrations/02_create_user_accounts.sql
```

Veya Supabase Dashboard → SQL Editor → New Query:
1. `01_add_roles_system.sql` dosyasının içeriğini yapıştır ve çalıştır
2. `02_create_user_accounts.sql` dosyasının içeriğini yapıştır ve çalıştır

### 2. Kullanıcı Hesaplarını Oluşturma

Supabase Dashboard → Authentication → Users:

Her kullanıcı için:
1. "Add user" butonuna tıkla
2. **Email**: Yukarıdaki tablodan ilgili email'i gir
3. **Password**: `Dinky2024!`
4. **Auto Confirm**: ✅ İşaretle
5. "Create user" tıkla

### 3. Kullanıcıları Çalışanlara Bağlama

Kullanıcılar oluşturulduktan sonra, SQL Editor'de şu komutu çalıştır:

```sql
SELECT link_user_to_employee();
```

Bu komut, her kullanıcıyı ilgili çalışan kaydına bağlar.

### 4. Doğrulama

Kullanıcıların doğru şekilde oluşturulduğunu kontrol et:

```sql
SELECT * FROM user_roles_view;
```

9 kullanıcı ve rolleri listelenmeli.

## 📱 Kullanıcı Testleri

Her hesapla giriş yaparak yetkilerini test edin:

1. **patron@dinky.com** - Tüm menü öğeleri görünmeli
2. **genelmudur@dinky.com** - Ayarlar hariç tüm menü öğeleri
3. **muhasebe@dinky.com** - Sadece: Dashboard, Projeler, Müşteriler, Raporlar
4. **depo@dinky.com** - Sadece: Dashboard, Stok
5. **usta1-5@dinky.com** - Sadece: Dashboard, Kalite Kontrol

## 🔒 Güvenlik Notları

1. **İlk giriş sonrası şifreleri değiştirin**
2. Supabase RLS (Row Level Security) aktiftir
3. Her rol sadece yetkili olduğu verilere erişebilir
4. API çağrıları otomatik olarak kullanıcı rolüne göre filtrelenir

## ⚙️ Rol Değiştirme

Bir kullanıcının rolünü değiştirmek için:

```sql
UPDATE employees
SET role = 'yeni_rol'
WHERE email = 'kullanici@dinky.com';
```

Mevcut roller:
- `patron`
- `genel_mudur`
- `muhasebeci`
- `depocu`
- `usta`
- `admin`

## 🆘 Sorun Giderme

### Problem: Kullanıcı giriş yapamıyor
**Çözüm**:
- Supabase Dashboard → Authentication'da kullanıcının "Confirmed" olduğunu kontrol edin
- Email doğrulaması gerekiyorsa "Confirm email" tıklayın

### Problem: Kullanıcı "Rol atanmamış" hatası alıyor
**Çözüm**:
```sql
SELECT link_user_to_employee();
```
komutunu tekrar çalıştırın.

### Problem: Kullanıcı yetkisi olmayan sayfaları görüyor
**Çözüm**:
- Browser cache'i temizleyin
- Çıkış yapıp tekrar giriş yapın
- RLS politikalarının aktif olduğunu kontrol edin

## 📞 Destek

Sorunlarınız için:
- GitHub Issues: https://github.com/ArdaYldz8/dinky-env-v2/issues
- Email: support@dinky.com
