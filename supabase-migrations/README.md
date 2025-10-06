# Supabase Migrations - Dinky ERP v2

## Migration Geçmişi

### 01_add_roles_system.sql
- **Tarih**: İlk kurulum
- **Amaç**: RBAC (Role-Based Access Control) sistemi kurulumu
- **Değişiklikler**:
  - `user_role` enum type oluşturuldu
  - `employees` tablosuna `role` ve `user_id` kolonları eklendi
  - RLS (Row Level Security) politikaları oluşturuldu
  - 9 adet örnek çalışan kaydı eklendi

### 02_create_user_accounts.sql
- **Tarih**: İlk kurulum
- **Amaç**: Kullanıcı hesaplarını çalışanlara bağlama
- **Değişiklikler**:
  - `link_user_to_employee()` fonksiyonu oluşturuldu
  - `user_roles_view` view'ı oluşturuldu

### 03_separate_user_roles.sql ✅ **YENİ**
- **Tarih**: 2025-10-06
- **Amaç**: Kullanıcı rollerini çalışanlardan ayırma
- **Problem**: Çalışan silindiğinde kullanıcı yetkilerinin de kaybolması
- **Çözüm**: `user_roles` tablosu oluşturuldu

#### Değişiklikler:
1. **Yeni Tablo**: `user_roles`
   - `id`: UUID primary key
   - `user_id`: auth.users referansı (CASCADE DELETE)
   - `email`: Kullanıcı email
   - `role`: Kullanıcı rolü
   - `is_active`: Aktiflik durumu

2. **Veri Migrasyon**: Mevcut `employees` tablosundaki roller `user_roles`'a kopyalandı

3. **Güncellenen Fonksiyonlar**:
   - `get_user_role()`: Artık `user_roles` tablosunu kullanıyor

4. **RLS Politikaları**:
   - Patron ve Admin: Tam yetki
   - Genel Müdür: Okuma yetkisi
   - Diğer kullanıcılar: Sadece kendi kayıtlarını görebilir

5. **View**: `complete_user_info`
   - Kullanıcı, rol ve çalışan bilgilerini birleştiren view

## Yeni Yapı

### Önceki Yapı (❌ Sorunlu)
```
auth.users → employees (user_id, role)
```
- Çalışan silindiğinde rol bilgisi kayboluyordu

### Yeni Yapı (✅ Doğru)
```
auth.users → user_roles (role, email)
           → employees (opsiyonel bağlantı)
```
- Kullanıcı rolleri bağımsız
- Çalışan silinse bile kullanıcı hesabı ve yetkileri korunuyor
- Bir kullanıcının çalışan kaydı olmasa da sisteme giriş yapabiliyor

## Kullanım

### Yeni Kullanıcı Ekleme
```sql
-- 1. Supabase Dashboard'dan kullanıcı oluştur
-- 2. user_roles tablosuna rol ekle
INSERT INTO user_roles (user_id, email, role, is_active)
VALUES (
  'AUTH_USER_ID',
  'user@dinky.com',
  'muhasebeci',
  true
);

-- 3. İsteğe bağlı: Çalışan kaydı oluştur
INSERT INTO employees (full_name, email, user_id, ...)
VALUES (...);
```

### Kullanıcı Rolü Değiştirme
```sql
UPDATE user_roles
SET role = 'genel_mudur'
WHERE email = 'user@dinky.com';
```

### Kullanıcı Bilgilerini Görüntüleme
```sql
SELECT * FROM complete_user_info;
```

## Frontend Değişiklikleri

### useUserRole Hook
- Artık `employees` yerine `user_roles` tablosunu sorguluyor
- Dosya: `src/hooks/useUserRole.ts`

### Database Types
- `user_roles` table type eklendi
- Dosya: `src/types/database.types.ts`

## Roller

| Rol | Açıklama | Yetkiler |
|-----|----------|----------|
| `patron` | Patron | Tam yetki |
| `genel_mudur` | Genel Müdür | Ayarlar hariç tam yetki |
| `muhasebeci` | Muhasebeci | Finans, müşteriler, raporlar |
| `depocu` | Depo Sorumlusu | Stok yönetimi |
| `usta` | Kalite Kontrol Ustası | Kalite kontrol |
| `admin` | Sistem Yöneticisi | Tam sistem yetkisi |
