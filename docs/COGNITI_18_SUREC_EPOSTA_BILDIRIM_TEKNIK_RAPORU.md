# Cogniti 18 İş Süreci — Otomatik E-posta, Bildirim Mimarisi ve Süreç İyileştirmeleri Teknik Raporu

**Tarih:** 24 Kasım 2026 · **Dal / Son Push:** `main` (`origin/main` @ `e1702366`)  
**Güncelleme Kuralı:** Bu belge her süreç adımı tamamlandığında güncel teknik durumla güncellenir.

---

## 1. Çalışmanın Amacı ve Kapsamı

Bu çalışmanın amacı, Cogniti platformundaki **18 ana iş sürecinin tamamını** baştan sona denetleyerek:
1. Her süreçteki her rolün (Ziyaretçi/Aday, Cogniti Admin, Firma Admini, İç Kullanıcı/Üretici/Yönetici, TM, BM, UTT/Kd. UTT, E-Club Eczacı/Teknisyen, Eczanem Üyesi, Agora İş Partneri) doğru anda, doğru kanaldan (**E-posta**, **Web Push / Uygulama İçi Bildirim** veya **Ekran İçi Toast**) standart ve kurumsal bildirim almasını sağlamak,
2. Doğru bildirimin üretilmesini veya güvenliğini engelleyen **alt iş akışı, yetki, şema ve veri bütünlüğü eksiklerini** (geçici şifre yerine tek kullanımlık davet, KVKK onay sahipliği, müşteri bağlama onayı, tek Firma Admini kısıtı, kurumsal belge/inceleme akışı vb.) veritabanı (PostgreSQL RPC/Trigger), sunucu API ve istemci katmanlarında kalıcı olarak çözmek,
3. Dağınık veya bileşen içine gömülü bildirim metinlerini tek doğruluk kaynağında (`lib/bildirimler/toastMesajlari.ts` ve `lib/uretim/toastMesaj.ts`) toplamaktır.

---

## 2. İzlenen Yöntem ve Teknik Standartlar

### 2.1. Süreç İnceleme ve Onay Yöntemi
Her bir süreç (1'den 18'e kadar) sırasıyla tek tek ele alınır:
1. **Kod, SQL ve `BLUEBOOK.MD` Denetimi:** İlgili sürecin tüm Next.js App Router uçları (`route.ts`), sunucu yardımcıları (`lib/**`), React bileşenleri ve `scripts/sql/**` altındaki PostgreSQL fonksiyonları/tabloları okunur; varsayım yapılmaz.
2. **İş Akışı ve Güvenlik Boşluklarının Giderilmesi:** Süreçte bildirimlerin doğru alıcıya, doğru hukuki/teknik zeminde gitmesini engelleyen bir mimari açık varsa önce bu açık adım adım SQL + API + UI olarak kapatılır.
3. **10 Sütunlu Standart Süreç Tablosu:** Sürecin tüm alt adımları şu 10 sütunla çıkarılır:
   - `Ana İş Süreci | Alt İş Süreci Adımı | Bildirim Durumu | Bildirim Durumu Gerekçesi | Mevcut Durum (Kodda) | Kimden | Kime | Konu Başlığı | E-posta Mesaj İçeriği (Somut Örnek) | Bildirim Mesajı İçeriği (Toast)`
   - Tabloda `{...}` yer tutucuları kullanılmaz; gerçekçi somut kişi, firma, tutar ve bağlantı örnekleri yazılır.
4. **Kodlama ve Hedefli Doğrulama:** Kullanıcı onayından sonra değişiklikler kodlanır; veritabanı değişiklikleri kullanıcı tarafından Supabase'de çalıştırılıp `Success. No rows returned` ile teyit edilir; ardından `node --import ./tests/_alias.mjs --test`, `npx eslint` ve `npm run typecheck:build` çalıştırılır.

### 2.2. Kanal Seçim Kuralı
- **E-posta (Resend REST API):** Kalıcı kayıt, ticari/hukuki kanıt, oturumsuz dış erişim bağlantısı (24/48 saatlik şifre ve üyelik davetleri), şifre değişimi, paket/proforma onayı, hediye çeki kodu teslimatı/iptali ve canlı yayın/sınav davetlerinde kullanılır.
- **Web Push & Uygulama İçi Bildirim (`lib/push/orkestrasyon.ts`, `lib/push/icerik.ts`):** Günlük sık tekrarlanan operasyonel olaylarda (üretim hattı görev adımları, yeni yayın açılışı, kasa indirim onay/reddi, çek hazırlama/teslim/iptal durum değişimi) e-posta kutusunu boğmamak için kullanılır.
- **Toast Bildirimi (`lib/bildirimler/toastMesajlari.ts`):** Kullanıcının kendi ekranında tetiklediği her senkron işlemin (POST/PUT/PATCH/DELETE) hemen ardından anlık geri bildirim olarak gösterilir.

### 2.3. E-posta ve Toast Teknik Sözleşmesi
- **Dış / Kullanıcı E-postaları:**
  - Hitap: `Sayın Ad Soyad,` (ad soyad yoksa role uygun `Sayın Üyemiz,` / `Sayın Eczacımız,` / `Sayın Firma Yöneticisi,`).
  - Gövde: Paragraflar arası 1 boş satır (`<p style="margin: 0 0 16px 0;">`), hem `html` hem düz metin `text` üretimi, tüm dinamik alanlarda HTML kaçışı (`&`, `<`, `>`, `"`, `'`).
  - İmza: Yalnızca **`Cogniti · bilgi taşır`**.
- **Cogniti Admin İç Bildirim E-postaları:**
  - `Sayın...` hitabı ve `Cogniti · bilgi taşır` imzası **bulunmaz**; doğrudan olay başlığı ve maddeli özet (`<ul><li><strong>Etiket:</strong> Değer</li></ul>`) gönderilir.
- **Konu Başlıkları:** 4–5 kelimelik, Türkçe Title Case (her kelimenin baş harfi büyük), iç kısaltma (`KKÖ` vb.) içermeyen yapı.
- **Güvenilirlik:** Resend çağrılarında `AbortSignal.timeout(8000–10000)` ve tekil `Idempotency-Key` kullanılır; kritik teslimatlarda (E-Club ve FirmaStore çekleri, Viva davetleri) PostgreSQL lease (`FOR UPDATE SKIP LOCKED`) tabanlı kuyruk + yedek cron işleyicisi çalışır.
- **Sayfa Geçişli Toast Taşıyıcısı:** İşlem sonrası `router.push(...)` yapılan akışlarda `sonrakiSayfaToastYaz(mesaj, tur)` ile `sessionStorage` üzerine yazılıp hedef sayfada `sonrakiSayfaToastOku()` ile tek seferlik gösterilir.

---

## 3. Şimdiye Kadar Yapılan İşler (Süreç 1–11)

### 3.1. `origin/main` Üzerine Push Edilmiş Süreçler (Süreç 1–10 · `ef030612` → `e1702366`)

#### Süreç 1 — Karşılama ve Kurumsal Üyelik Başvurusu (`5dfc97df`, `ef030612`, `556d7050`, `2147990a`)
- **Mimari / İş Akışı Değişiklikleri:**
  - Kullanılmayan eski `/welcome/musteri-talebi` sayfası ve API ucu kaldırıldı (`5dfc97df`).
  - `scripts/sql/cogniti_kurumsal_uyelik_basvurulari.sql` ile kurumsal başvurular için belge yükleme, taslak saklama, tek gönderim kilidi ve admin inceleme durum makinesi kuruldu.
  - `app/kurumsal-uyelik/api/basvuru/route.ts`, `app/kurumsal-uyelik/api/basvuru/belge/route.ts` ve `app/admin/api/kurumsal-basvurular/route.ts` uçları ile `app/admin/uyelik-basvurulari/KurumsalBasvuruInceleme.tsx` admin inceleme ekranı yazıldı.
- **E-postalar ve Bildirimler:**
  - Ön başvuru alındığında (`app/uyelik-basvurusu/api/route.ts`): Başvurana **`Kurumsal Üyelik Ön Başvurunuz Alındı`**, Cogniti Admin'e **`Yeni Kurumsal Üyelik Başvurusu — {Firma}`**.
  - Ön başvuru onaylandığında (`app/admin/api/uyelik-basvurulari/route.ts`): 48 saatlik tek kullanımlık **`Cogniti Kurumsal Üyelik Formu Davetiniz`**.
  - Kurumsal üyelik formu gönderildiğinde ve incelendiğinde (`lib/firma/kurumsalUyelikDogrulama.ts`): Başvurana **`Cogniti Kurumsal Üyelik Başvurunuz Alındı`**, Admin'e **`Kurumsal Üyelik Başvurusu İncelemesi — {Firma}`**, onayda **`Cogniti Kurumsal Üyeliğiniz Onaylandı`**, rette düzeltme bağlantılı **`Cogniti Kurumsal Üyelik Başvurunuz Hakkında`**.
  - Tüm başvuru ve admin adımları `SUREC1_TOAST`'a bağlandı.

#### Süreç 2 — Kimlik, Oturum, Şifre ve Firma / Kullanıcı Yönetimi (`af08adf9`, `2147990a`)
- **Mimari / İş Akışı Değişiklikleri:**
  - `scripts/sql/firma_admin_tekillik.sql` ile firma başına yalnızca tek aktif `firma_admin` bulunabilmesi veritabanı seviyesinde zorunlu kılındı.
  - `scripts/sql/cogniti_kullanici_davetleri.sql` ve `lib/admin/kullaniciDaveti.ts` ile yeni iç kullanıcı ekleme (tekli ve Excel toplu yükleme) akışında 24 saatlik tek kullanımlık şifre oluşturma daveti (`/sifre-olustur?token=...`) ve davet yeniden gönderme ucu (`app/admin/api/firmalar/[firma_id]/kullanicilar/davet/route.ts`) kuruldu.
- **E-postalar ve Bildirimler:**
  - Şifre güncellendiğinde (`app/api/auth/sifre-degisti-bildir/route.ts`): **`Cogniti Hesap Şifreniz Güncellendi`**.
  - Yeni iç kullanıcı davetinde (`lib/admin/kullaniciDaveti.ts`): **`Cogniti Hesabınız Açıldı Şifrenizi Belirleyin`**.
  - Firma Admini yetkisi açıldığında (`lib/admin/firmaAdminEposta.ts`): **`Cogniti Firma Admini Yetkiniz Tanımlandı`**.
  - Kullanıcı rol değişimi, pasife alma ve yeniden aktifleştirmede (`lib/admin/kullaniciDurumEposta.ts`): **`Cogniti Kullanıcı Rolünüz Güncellendi`**, **`Cogniti Hesabınız Pasife Alındı`**, **`Cogniti Hesabınız Aktif Edildi`**.
  - Tüm kullanıcı/firma yönetim ekranları `SUREC2_TOAST`'a bağlandı.

#### Süreç 3 — Token Satın Alma, Abonelik / Paket Başlangıcı ve Token Yükleme (`59050832`, `2147990a`, `76d73d5f`)
- **Mimari / İş Akışı Değişiklikleri:**
  - Eski manuel token yükleme arayüzü ve API kodu (`app/admin/_components/TokenYonetimi.tsx`, `app/admin/api/firmalar/[firma_id]/token/route.ts`) temizlendi.
- **E-postalar ve Bildirimler (`lib/satinAlma/satinAlmaEposta.ts`):**
  - Aylık Abonelik (`app/api/satin-alma/abonelik/route.ts`): Alıcıya **`Cogniti Abonelik Paketiniz Başlatıldı`**, Admin'e iç bildirim.
  - Esnek Paket (`lib/satinAlma/esnekPaketSunucu.ts`): Alıcıya **`Cogniti Esnek Paketiniz Yüklendi`**, Admin'e iç bildirim.
  - Kullandığın Kadar Öde (`app/api/satin-alma/kko/route.ts`): Alıcıya **`Cogniti Kullandığın Kadar Öde Paketi Başlatıldı`**, Admin'e iç bildirim.
  - Satın alma modalları `SUREC3_TOAST`'a bağlandı.

#### Süreç 4 — Proforma ve Fatura Süreci (`76d73d5f`)
- **Mimari / İş Akışı Değişiklikleri:**
  - `scripts/sql/cogniti_proforma_onay_belge_oku.sql` ile 9 farklı proforma onay tablosundan (`kko`, `esnek`, `abonelik`, `viva`, `banner`, `agora`, `icerik`, `firmastore`, `eczane`) onaylanmış belge özetini güvenli okuyan RPC kuruldu.
- **E-postalar ve Bildirimler (`lib/satinAlma/proformaEposta.ts`):**
  - 9 proforma onay API ucunun tamamına bağlandı:
    - Firma Admini onayladığında Cogniti Admin'e **`{Firma} Proforma Onay - {Satın Alım}`** ve Firma Admini'ne **`{Satın Alım} Proforma Onayınız Alındı`**.
    - Cogniti Admin firma adına açıklamalı onayladığında Firma Admini'ne **`{Satın Alım} Proforma Faturanız Onaylandı`**.
  - 11 proforma bileşeninin tamamı `SUREC4_TOAST`'a bağlandı.

#### Süreç 5 — İçerik Üretim Hattı (`16c94e27`)
- **E-postalar ve Bildirimler:**
  - İçerik üretimi siparişi onaylandığında (`app/api/satin-alma/icerik-uretimi/route.ts`): Alıcıya **`Cogniti İçerik Üretimi Siparişiniz Onaylandı`** + Cogniti Admin'e iç bildirim.
  - Bunny Stream hazır video işleme hatası nedeniyle yayın durdurulduğunda (`lib/video/yayinVideoBildirim.ts`): **`Yayınınız Video Hatası Nedeniyle Durduruldu`**.
  - Üretim hattı görev adımları (talep, senaryo, video, soru seti, İÜ atama/devir) e-posta yerine mevcut Web Push + `lib/uretim/toastMesaj.ts` ve `SUREC5_TOAST` ile standartlaştırıldı.

#### Süreç 6 — Yayın Yönetimi ve Katalog (`e1702366`)
- Yayınlama, ileri tarihli planlama, hemen yayınlama, plan tarihi/token rezervasyonu güncelleme, plan iptali, yayını durdurma/yeniden başlatma ve yayın adayı silme akışlarında hedef kitle Web Push bildirimleri korundu ve tüm üretici ekranları `SUREC6_TOAST`'a bağlandı.

#### Süreç 7 — Bölge Müdürü Öneri İş Süreçleri (`e1702366`)
- BM temsilcilerine öneri gönderdiğinde (`lib/tclub/oneri/oneriEposta.ts`) her temsilciye önerilen yayın listesini ve son tamamlama tarihini içeren **`Bölge Müdürünüz Önerisini İletti`** e-postası + Web Push + `SUREC7_TOAST` bağlandı.

#### Süreç 8 — T-Club & Süreç 9 — C-Club (`e1702366`)
- Temsilci (T-Club) ve Bölge Müdürü (C-Club) öğrenme tamamlama, soru cevaplama, puan saatleri dışı tamamlama, ileri sarma puan kaybı ve soru hakkı kapanması bildirimleri `SUREC8_TOAST` ve `SUREC9_TOAST` altında merkezîleştirildi.

#### Süreç 10 — E-Club (`e1702366`)
- **E-postalar ve Bildirimler:**
  - E-Club 24 saatlik üyelik daveti (`lib/eclub/uyelikDaveti.ts`): **`Cogniti E-Club Üyelik Davetiniz`**.
  - E-Club hediye çeki teslimatı (`lib/eclub/store/cekEpostaKuyrukIsleyici.ts`): Eczacıya **`E-Club Hediye Çekiniz Hazır`** e-postası + eczanedeki tüm aktif E-Club üyelerinin hesabına Web Push.
  - E-Club çek talebi iptali (`lib/eclub/store/cekIptalEposta.ts`): Eczacıya **`E-Club Çek Talebiniz İptal Edildi`** e-postası.
  - Tüm E-Club ekranları `SUREC10_TOAST`'a bağlandı. *(Hatırlatma: Hediye Takibi test verileri silinecek.)*

---

### 3.2. Yerelde Tamamlanmış, Test Edilmiş ve Supabase SQL'leri Uygulanmış İşler *(Commit / Push Bekleyen — 39 Değişen + 14 Yeni Dosya)*

#### A. Toplu E-posta Konu Başlığı Standardizasyonu
- Süreç 1–10 kapsamındaki 15 kaynak dosya ve 2 test dosyasında yer alan **26 e-posta konu başlığı** 4–5 kelimelik Türkçe Title Case standardına geçirildi.

#### B. Süreç 11 — Eczanem 8 Adımlık Mimari Revizyon ve Bildirim Tamamlaması
Eczanem üyelerinin doğru e-posta ve bildirimleri güvenli biçimde alabilmesi için **6 yeni SQL migration dosyası** yazıldı ve **tamamı Supabase üzerinde çalıştırılarak `Success. No rows returned` ile doğrulandı**:

1. **Adım 1 — Geçici Şifre Yerine 24 Saatlik Tek Kullanımlık Davet:**
   - **SQL:** `scripts/sql/eczanem_uyelik_daveti.sql` (`eczanem_uyelik_davetleri` tablosu, `eczanem_davet_bekleyen_kayit` trigger'ı, `eczanem_davet_yenile`, `eczanem_davet_islem_al`, `eczanem_davet_islem_bitir` RPC'leri).
   - **Sunucu & UI:** `lib/eczanem/uyelikDaveti.ts` (**`Cogniti Eczanem Üyelik Davetiniz`**), `app/(panel)/eczanem/eczane/api/musteri-ekle/route.ts`, `app/sifre-olustur/api/route.ts`, `proxy.ts` (`eczanem_davet_bekliyor` oturum bekçisi).
2. **Adım 2 — Üye Sahipliğinde KVKK Onayı ve E-posta Doğrulaması:**
   - **SQL:** `scripts/sql/eczanem_kvkk_onay_akisi.sql` (`eczanem_musteriler.kvkk_onay_tarihi` `DROP NOT NULL`; davet beklerken `NULL`, üye kendi şifresini oluştururken `eczanem_davet_islem_bitir` içinde atomik `now()` kaydı).
   - **UI:** `components/auth/DavetSifreKarti.tsx` ve `components/auth/SifreBelirlemeFormu.tsx` üzerinde resmî `YASAL_METINLER` Radix Dialog modalları ve zorunlu KVKK + Kullanım Koşulları onay kutusu.
3. **Adım 3 — Bekleyen Davet Yönetimi ve Aktif Eşik / Video Dağıtım Hariç Tutma:**
   - **SQL:** `scripts/sql/eczanem_davet_yonetimi.sql` (`v_eczanem_musteri_liste_admin` görünümüne `ad, soyad, davet_bekliyor, davet_gonderildi` eklendi; `eczanem_utt_eczaneye_gonder` ve `eczanem_musterilere_video_gonder` RPC'lerinde davet bekleyen üyeler 10 aktif üye eşiğinden ve video dağıtımından hariç tutuldu; `eczanem_bekleyen_davet_bilgi_guncelle` ve `eczanem_bekleyen_davet_iptal` RPC'leri eklendi).
   - **Sunucu & UI:** `app/(panel)/eczanem/eczane/api/davet/route.ts` (`POST` yeniden gönder, `PATCH` ad/e-posta güncelle + Auth rollback koruması + yeni davet, `DELETE` davet iptali + Auth silme), `lib/eczanem/gonderim.ts`, `app/(panel)/eczanem/eczane/uyeler/page.tsx` (`Davet Bekliyor` kartı, filtresi, rozeti, düzenleme modalı ve `AlertDialog` iptal onayı).
4. **Adım 4 — Kayıtlı Üyeyi Eczaneye Bağlama ve Pasif Üyeyi Yeniden Aktifleştirme İçin Üye Onayı (7 Gün Süreli):**
   - **SQL:** `scripts/sql/eczanem_baglama_onay_talepleri.sql` (`eczanem_baglama_talepleri` tablosu, `eczanem_baglama_talebi_olustur`, `eczanem_baglama_talebi_karar_ver`, `eczanem_baglama_talebi_iptal_et` RPC'leri).
   - **Sunucu & UI:** `lib/eczanem/baglamaTalebiEposta.ts` (**`Cogniti Eczanem Bağlantı Onay Talebi`**), `app/eczanem/api/baglama-talepleri/route.ts`, `app/eczanem/_components/EczaneBaglamaTalepleriKarti.tsx` (hem `/eczanem` hem `/eczanem/kapali` sayfalarında gösterilir; `/eczanem/api/baglama-talepleri` yolu `proxy.ts` içinde `modulKapisiMuaf` listesine eklendi).
5. **Adım 5 — Telefon Sorgu Hız Sınırı ve SHA-256 Denetim İzi:**
   - **SQL:** `scripts/sql/eczanem_telefon_sorgu_siniri.sql` (`eczanem_telefon_sorgu_kayitlari` tablosu, `eczanem_telefon_sorgu_kontrol` RPC — 15 dakikada personel başına 20, eczane başına 40 sorgu sınırı; ham telefon yerine yalnızca SHA-256 özeti kaydedilir).
   - **Sunucu:** `lib/eczanem/telefonSorguSiniri.ts` (aşım durumunda HTTP `429`).
6. **Adım 6 — İç Kullanıcı (`kullanicilar`) ve İş Partneri (`agora_is_partnerleri`) Telefon Çakışma Kontrolü:**
   - **SQL:** `scripts/sql/eczanem_telefon_cakisma_kontrolu.sql` (`eczanem_telefon_baska_kimlik_kontrol` RPC ve genişletilmiş `hapbilgi_kimlik_telefon_ayir_trg()` trigger'ı).
   - **Sunucu:** `lib/eczanem/eclubUyesiKontrol.ts` (`digerKimlikTelefonuMu`).
7. **Adım 7 — Pasife Alma (30 Günlük Puan Kullanım Süresi) ve Bağ Kaldırma E-postaları:**
   - **Sunucu & UI:** `lib/eczanem/uyelikDurumEposta.ts` (**`Cogniti Eczanem Üyeliğiniz Pasife Alındı`**, **`Cogniti Eczanem Üyelik Bağınız Kaldırıldı`**), `app/(panel)/eczanem/eczane/api/musteriler/route.ts`, `app/eczanem/api/videolar/route.ts` (`pasif_uyelikler` alanı), `app/eczanem/page.tsx` (30 günlük bilgilendirme bandı) ve `app/eczanem/_components/EczanemPuanlarim.tsx`.
8. **Adım 8 — "Üye" Terminolojisi, İndirim Reddi Web Push ve `SUREC11_TOAST`:**
   - `lib/eczanem/kasa.ts` içinde eczane indirim talebini reddettiğinde (`siparisReddet`) üyeye `pushYayinlaEczanemMusterilereArkada(adminSupabase, "eczanem_siparis", [siparis.musteri_id])` Web Push bildirimi eklendi.
   - `SUREC11_TOAST` `lib/bildirimler/toastMesajlari.ts` içine eklendi ve `app/(panel)/eczanem/eczane/uyeler/page.tsx`, `app/eczanem/_components/EczaneBaglamaTalepleriKarti.tsx`, `app/eczanem/_components/EczanemPuanlarim.tsx`, `app/(panel)/eczanem/eczane/_components/EczanemSiparisKuyrugu.tsx` bileşenlerine bağlandı.
   - **Doğrulama:** `tests/eczanemUyelikDaveti.hedef.test.ts` ve Eczanem regresyon paketleri (`51/51` ve `28/28` test), ESLint (`0 hata`) ve `npm run typecheck:build` (`0 hata`) geçti. *(Hatırlatma: Eczanem>İndirim Onayı sekmesindeki (F) veriler silinecek.)*

---

## 4. Süreç 12 — FirmaStore *(Tamamlandı, Doğrulandı ve Supabase SQL Uygulandı)*

### 4.1. Doğrulanan Teknik Mimari
- **Veri Modeli ve RPC'ler:**
  - Fiziksel mağaza, adres ve kategori tabloları kaldırılmış olup (`scripts/sql/firmastore_adres_tamamen_kaldir.sql`, `scripts/sql/firmastore_kategori_tamamen_kaldir.sql`) yalnızca dijital hediye çekleri (`store_urunler`, `store_urun_firma_ayarlari`) çalışır.
  - `STORE_ALABILEN_ROLLER` (`utt`, `kd_utt`, `bm`) yalnızca **1–7 Ocak, 1–7 Nisan, 1–7 Temmuz, 1–7 Ekim** (TR saati, `lib/tclub/store/takvim.ts`) penceresinde tamamlanan çeyreğin (`kaynak_ceyrek_baslangici`) çek karşılıklı puan bakiyesiyle tekli (`store_cek_siparis_olustur`) veya çoklu (`store_coklu_cek_talep_olustur`) talep oluşturur.
  - **12 Saatlik Bekleme Kapısı (`scripts/sql/firmastore_12_saat_bekleme.sql`):** `store_bekleme_bitti_mi` (`created_at + interval '12 hours'`) dolmadan kullanıcı `/store/siparislerim` üzerinden talebini iptal edebilir (`store_siparis_iptal` → stok ve puan anında iade edilir). Erken iptal edilen veya 12 saati dolmayan talepler `store_admin_kuyrukta_mi` filtresi ve `store_admin_islem_suresi` `BEFORE UPDATE` trigger'ı sayesinde Cogniti Admin kuyruğuna girmez.
  - **Dönemlik Proforma Onayı (`scripts/sql/cogniti_firmastore_proforma_onayi.sql`):** Sipariş penceresi kapandıktan (8. gün `00:00`) ve 12 saatlik bekleyen kalmadıktan sonra Firma Admini `cogniti_firmastore_proforma` RPC'si ile onaylar; Süreç 4'te kurulan `proformaOnayEpostasiGonder(..., { tur: "firmastore" })` devreye girer.
  - **Admin Talep İşlemleri ve E-posta Kuyruğu (`scripts/sql/firmastore_firma_talep_yonetimi.sql`, `app/admin/store/api/siparis/route.ts`):**
    - `store_admin_firma_talep_islem` RPC'si `hazirla`, `teslim`, `iptal` ve `eposta_yeniden` işlemlerini yürütür.
    - `hazirla`, `teslim` ve `iptal` işlemlerinin üçünde de `app/admin/store/api/siparis/route.ts` üzerinden `pushYayinlaArkada(db, "store_siparis", [siparis.kullanici_id], ...)` Web Push bildirimi aktiftir.
    - `teslim` işleminde `store_cek_teslimleri` ve `store_cek_eposta_kuyrugu` atomik yazılır; hemen `lib/tclub/store/cekEposta.ts` (`firmaStoreEpostalariniIsle`, 120 sn lease, `Idempotency-Key: firmastore-cek/{is_id}`) çağrılır ve başarısız olursa `app/api/cron/firmastore-cek-eposta/route.ts` 23 saat boyunca üstel geri çekilmeyle (`60 * 2^(deneme-1)` sn, en çok 5 deneme) tekrar dener.

### 4.2. Süreç 12 Kapsamında Yapılan Teknik Geliştirmeler
1. **12.6 — Çek Teslim E-postasının Standarda Alınması (`scripts/sql/firmastore_firma_talep_yonetimi.sql`, `scripts/sql/firmastore_cek_eposta_standardi.sql`):**
   - `store_admin_firma_talep_islem` (`teslim` dalı) içinde `store_cek_eposta_kuyrugu.govde` JSON'una yazılan e-posta **`FirmaStore Hediye Çekiniz Hazır`** konu başlığı, `Sayın Ad Soyad,` hitabı, maddeli çek kodu ve tıklanabilir `Hediye çekini kullan` bağlantısı içeren HTML (`html`) + düz metin (`text`) gövde ve **`Cogniti · bilgi taşır`** imzasıyla güncellendi. *(Supabase'de `scripts/sql/firmastore_cek_eposta_standardi.sql` çalıştırıldı ve `Success. No rows returned` ile doğrulandı.)*
2. **12.7 — Admin İptal E-postası ve `Taleplerim` İptal Nedeni Görünümü (`lib/tclub/store/cekIptalEposta.ts`, `app/admin/store/api/siparis/route.ts`, `app/(panel)/store/siparislerim/page.tsx`):**
   - Admin bir talebi zorunlu `not` (iptal nedeni) girerek iptal ettiğinde (`action === "iptal"`), `firmaStoreCekIptalEpostasiGonder` ile talep sahibine **`FirmaStore Çek Talebiniz İptal Edildi`** konulu, iptal nedenini ve iade edilen puanı içeren standart HTML + düz metin e-posta (`Idempotency-Key: firmastore-cek-iptal/{siparis_id}`) gönderilir.
   - Kullanıcının `/store/siparislerim` (`Taleplerim`) ekranında iptal edilen talepler için `İptal nedeni: {s.iptal_sebebi}` satırı gösterilir.
3. **12.2 / 12.3 / 12.5 / 12.6 / 12.7 — `SUREC12_TOAST` Entegrasyonu (`lib/bildirimler/toastMesajlari.ts`, `app/(panel)/store/page.tsx`, `app/(panel)/store/[urun_id]/page.tsx`, `app/(panel)/store/siparislerim/page.tsx`, `app/admin/store/_components/FirmaCekTalepleri.tsx`):**
   - Çoklu ve tekli çek talebi oluşturulduğunda `Çek talebiniz alındı.` (`sonrakiSayfaToastYaz` / `sonrakiSayfaToastOku` ile `/store/siparislerim`'e taşınır), kullanıcı 12 saat içi iptalinde `Talebiniz iptal edildi ve puanınız iade edildi.`, admin işlemlerinde ise `Talep hazırlamaya alındı.`, `Çek kodları teslim edildi ve e-posta gönderimi başlatıldı.`, `Talep iptal edildi ve puan kullanıcıya iade edildi.` ve `Hediye çeki e-postası yeniden gönderim kuyruğuna alındı.` toast mesajları bağlandı.

---

## 5. Süreç 13 — Viva (Canlı Yayın) *(Tamamlandı, Doğrulandı ve Supabase SQL Uygulandı)*

1. **13.3 — Harici E-posta Davet Şablonu ve Kayıt Anında Kuyruk Tetiklemesi (`scripts/sql/viva_eposta_gonderim_isleyici.sql`, `scripts/sql/viva_eposta_davet_standardi.sql`, `lib/viva/epostaGonderimSunucu.ts`, `app/(panel)/viva/api/route.ts`):**
   - `viva_eposta_is_al` fonksiyonundaki konu başlığı **`Cogniti Viva Canlı Yayın Davetiniz`** olarak güncellendi; `vivaDavetEpostaGovdesi` içinde `Sayın Katılımcımız,` hitabı, maddeli yayın zamanı ve `Canlı yayına katıl` bağlantısı içeren HTML (`html`) + düz metin (`text`) ve **`Cogniti · bilgi taşır`** imzası kuruldu.
   - `POST /viva/api` (`olustur`, `kaydet`, `davet_yeniden_dene`) sonrasında `vivaEpostaKuyrugunuIsle` cron'u beklemeden hemen tetiklenir. *(Supabase'de `scripts/sql/viva_eposta_davet_standardi.sql` çalıştırıldı ve doğrulandı.)*
2. **13.4 — Harici Misafir OTP Doğrulama Kodu E-postası (`lib/viva/sunucu.ts`):**
   - `vivaKodGonder` içinde **`Viva Katılım Doğrulama Kodunuz`** konulu e-posta `Sayın Ad Soyad,` (`ad === 'Davetli'` ise `Sayın Katılımcımız,`) hitabı, HTML + düz metin gövde ve **`Cogniti · bilgi taşır`** imzasıyla standartlaştırıldı.
3. **13.2 & 13.5 — İç Kullanıcı (`ic`) ve E-Club Üyesi (`eclub`) Katılımcı Davet E-postası + Etkinlik İptal E-postası (`lib/viva/katilimciEposta.ts`, `app/(panel)/viva/api/route.ts`):**
   - Planlı veya anlık yayın kaydedildiğinde seçilen iç kullanıcılara ve E-Club üyelerine **`Cogniti Viva Canlı Yayın Davetiniz`** (`Idempotency-Key: viva-katilimci-davet/{etkinlik_id}/{alici}/v{surum}`) gönderilir.
   - Etkinlik iptal edildiğinde (`islem === "iptal"`) davetli iç kullanıcılar, E-Club üyeleri ve harici davetlilere **`Cogniti Viva Canlı Yayını İptal Edildi`** (`Idempotency-Key: viva-iptal/{etkinlik_id}/{alici}`) gönderilir.
4. **13.1 / 13.3 / 13.4 / 13.5 / 13.6 — `SUREC13_TOAST` Entegrasyonu (`lib/bildirimler/toastMesajlari.ts`, `components/viva/VivaEkrani.tsx`, `components/viva/VivaMisafir.tsx`, `components/viva/VivaKayitlar.tsx`):**
   - `Viva canlı yayını planlandı ve davetler gönderildi.`, `Davet e-postası yeniden gönderildi.` dahil tüm Viva bildirim mesajları `SUREC13_TOAST` üzerinden bağlandı.

---

## 6. Süreç 14 — Agora İş Partneri Süreci *(Tamamlandı, Doğrulandı ve Supabase SQL Uygulandı)*

### 6.1. Doğrulanan Teknik Mimari
- **Veri Modeli ve Tablo Yetki Sınırı:**
  - `agora_is_partnerleri`, `agora_partner_profilleri`, `agora_partner_egitimleri`, `agora_siparisleri`, `agora_partner_canli_egitimler`, `agora_partner_canli_oturumlar` ve `agora_canli_siparisleri` tablolarının tamamında `REVOKE ALL ON TABLE ... FROM PUBLIC, anon, authenticated, service_role` kuralı geçerlidir; doğrudan tablo okuma/yazma kapalıdır ve tüm erişim `SECURITY DEFINER` RPC'ler üzerinden yürür.
  - Başvuru ve yetkilendirme tek aşamalı kararla (`agora_partner_tek_asama_karar`) ilerler; `agora_siparisleri` ve `agora_canli_siparisleri` tablolarında brüt satış bedeli `satin_alma_bedeli`, net partner hak edişi ise `odenecek_tutar` kolonunda tutulur (`agora_partner_canli_hakedis_ve_rapor_entegrasyonu.sql`).

### 6.2. Süreç 14 Kapsamında Yapılan Teknik Geliştirmeler
1. **Salt Okunur Güvenli E-posta Okuma RPC'si (`scripts/sql/agora_eposta_bildirim_okuma.sql`):**
   - Tablo `REVOKE` sınırını bozmadan yalnızca `service_role` yetkisiyle çalışan `public.agora_eposta_bildirim_oku(p_tur, p_id)` (`'partner'`, `'yayin_siparis'`, `'canli_siparis'`) `SECURITY DEFINER` fonksiyonu hazırlandı. Hem Süreç 14 partner sipariş e-postalarını hem Süreç 15 alıcı firma sipariş onay e-postalarını besler. *(Supabase'de çalıştırıldı ve `Success. No rows returned` ile doğrulandı.)*
2. **14.1 / 14.2 / 14.3 — Başvuru Alındı, Başvuru Onayı ve Başvuru Reddi E-postaları (`lib/agora/partnerEposta.ts`, `app/partner/api/kayit/route.ts`, `app/admin/api/partnerler/route.ts`):**
   - Partner başvurusu alındığında adaya **`Cogniti İş Partnerliği Başvurunuz Alındı`**, Cogniti yönetimine (`COGNITI_ADMIN_EMAIL` tanımlıysa) **`Yeni İş Partnerliği Başvurusu - {Ad Soyad / Firma}`** e-postası gönderilir.
   - Başvuru onaylandığında **`Cogniti İş Partnerliği Başvurunuz Onaylandı`** şablonu `Sayın Ad Soyad,` hitabı, maddeli `Şifremi oluştur` bağlantısı, tekil **`Cogniti · bilgi taşır`** imzası ve `Idempotency-Key` ile standartlaştırıldı.
   - Başvuru reddedildiğinde adaya **`Cogniti İş Partnerliği Başvurunuz Hakkında`** bilgilendirme e-postası gönderilir.
3. **14.5 & 14.8 — Partner Erişim Durumu ve Admin Yayın Müdahale E-postaları (`app/admin/api/partnerler/[partnerId]/erisim/route.ts`, `app/admin/api/partnerler/[partnerId]/yayinlar/route.ts`, `lib/agora/partnerEposta.ts`):**
   - Admin partner erişimini açıp kapattığında **`Cogniti Partner Erişiminiz Aktif Edildi`** / **`Cogniti Partner Erişiminiz Pasife Alındı`**, admin partnerin Agora yayınını aktife/pasife aldığında veya kaldırdığında **`Cogniti Agora Yayın Durumunuz Güncellendi`** e-postası gönderilir.
4. **14.9 & 14.10 — Agora Video/Podcast ve Canlı Yayın Sipariş E-postaları (`app/(panel)/agora/api/siparis/route.ts`, `app/(panel)/agora/api/canli/route.ts`, `lib/agora/partnerEposta.ts`):**
   - Yeni Agora Video/Podcast siparişinde (`data.mevcut === false`) partnere **`Agora Yayınınız İçin Sipariş Alındı`**, canlı yayın oturumu siparişinde **`Agora Canlı Yayın Oturumunuz Sipariş Edildi`** (yayın zamanı, süre/kontenjan, satış tutarı ve net hak ediş bilgileriyle) gönderilir.
5. **`SUREC14_TOAST` Entegrasyonu (`lib/bildirimler/toastMesajlari.ts`, `app/partner/basvuru/PartnerBasvuruFormu.tsx`, `app/partner/api/sifre-olustur/route.ts`, `app/admin/_components/PartnerYonetimi.tsx`):**
   - Başvuru, şifre oluşturma, admin onay/ret, erişim açma/kapatma ve admin yayın durumu işlemleri `SUREC14_TOAST` üzerinden standartlaştırıldı.

---

## 7. Süreç 15 — Agora Alıcı Firma Süreci *(Tamamlandı ve Doğrulandı)*

### 7.1. Doğrulanan Teknik Mimari
- Alıcı firmadaki üretici roller (`URETICI_ROLLER`), `POST /agora/api/siparis` (`agora_satin_al`) ile hazır soru setli Video/Podcast lisansını ve `POST /agora/api/canli` (`agora_canli_oturum_satin_al`) ile Viva canlı yayın oturumunu firma token hesabından satın alır; eksik bakiye `borca_yazilan_token` olarak `asim_borcu`na işlenir.
- Satın alınan Video/Podcast yayınları `/agora-yayinlari` ve `/agora-yayinlari/yonetim` (`agora_yayin_ayarla` + ortak `useYayinYonetimi`) üzerinden hedef kitleye açıldığında Süreç 6'daki `video_yayini` Web Push akışı çalışır; satın alınan canlı yayınlar için `/agora-yayinlari/canli` üzerinden açılan davetler Süreç 13'teki Viva davet akışını (`Cogniti Viva Canlı Yayın Davetiniz`) kullanır; aylık Agora proforma onayları ise Süreç 4'teki `proformaOnayEpostasiGonder` ile yürür.

### 7.2. Süreç 15 Kapsamında Yapılan Teknik Geliştirmeler
1. **15.2a & 15.2b — Agora Video/Podcast Siparişinde Alıcı Üretici ve Firma Admini E-postaları (`lib/agora/aliciEposta.ts`, `app/(panel)/agora/api/siparis/route.ts`):**
   - Yeni sipariş oluştuğunda (`data.mevcut === false`), `public.agora_eposta_bildirim_oku('yayin_siparis', siparis_id)` üzerinden alıcı üreticiye **`Agora Yayın Siparişiniz Tamamlandı`**, firmanın `firma_admin_aktif` bayrağı açık ve aktif `firma_admin` kullanıcısı mevcutsa (alıcıdan farklıysa) **`Firmanızda Yeni Agora Yayın Siparişi`** e-postası gönderilir.
2. **15.3a & 15.3b — Agora Canlı Yayın (Viva) Siparişinde Alıcı Üretici ve Firma Admini E-postaları (`lib/agora/aliciEposta.ts`, `app/(panel)/agora/api/canli/route.ts`):**
   - Canlı yayın oturumu siparişi tamamlandığında `public.agora_eposta_bildirim_oku('canli_siparis', siparis_id)` üzerinden alıcı üreticiye **`Agora Canlı Yayın Siparişiniz Oluşturuldu`**, aktif Firma Adminine **`Firmanızda Yeni Canlı Yayın Siparişi`** e-postası gönderilir.
3. **15.2 / 15.3 / 15.4 — `SUREC15_TOAST` Entegrasyonu (`lib/bildirimler/toastMesajlari.ts`, `components/agora/AgoraVitrini.tsx`, `components/agora/AgoraCanliYayinlar.tsx`, `components/agora/AgoraYayinlarim.tsx`):**
   - Video/Podcast siparişi, canlı yayın oturumu siparişi, yayın hedef rol/ürün ayar kaydı ve yayın yönetimine ekleme mesajları `SUREC15_TOAST` üzerinde toplandı. *(Ek SQL gerektirmez; Süreç 14'te uygulanan `agora_eposta_bildirim_oku` RPC'sini kullanır.)*

---

## 8. Süreç 16 — BOLIS (Bilgi Derinliği Ölçüm ve Sınav Merkezi) *(Tamamlandı ve Doğrulandı)*

1. **16.2 — Hazır Liste (`hazir_liste`) Sınav Davet E-postası ve `?davet=` Koduyla Doğrudan Eşleştirme (`lib/bolis/eposta.ts`, `app/(panel)/bolis/api/route.ts`, `app/(panel)/bolis/api/[sinavId]/route.ts`, `app/api/bolis-sinav/[kod]/route.ts`, `components/bolis/BolisSinavEkrani.tsx`):**
   - Sınav `yayinda` durumuna alındığında (`POST`, `PUT` veya `PATCH`), `kayit_tipi === "hazir_liste"` ise henüz sınavı tamamlamamış e-postalı katılımcılara **`Cogniti Sınav Davetiniz`** (`Idempotency-Key: bolis-davet/{sinav_id}/{davet_kodu}`) gönderilir; bağlantıda kişisel veri taşımayan `?davet={davet_kodu}` parametresiyle katılımcı tek tıkla doğrulanır (manuel e-posta/telefon girişi de korunur).
2. **16.4 — Katılımcı Sınav Sonuç Özeti E-postası (`lib/bolis/eposta.ts`, `app/api/bolis-sinav/[kod]/route.ts`):**
   - Sınav teslim edildiğinde (`islem === "teslim"`), e-posta adresi bulunan katılımcıya (`hazir_liste` ve `kendi_kaydi`; `anonim` hariç) **`Cogniti Sınav Sonucunuz`** (`Idempotency-Key: bolis-sonuc/{oturum_id}`) gönderilir.
3. **16.1 / 16.2 / 16.3 / 16.5 / 16.6 — `SUREC16_TOAST` ve Sayfa Geçişi Bildirimleri (`lib/bildirimler/toastMesajlari.ts`, `components/bolis/BolisSinavFormu.tsx`, `components/bolis/BolisAnaSayfa.tsx`, `components/bolis/BolisRaporEkrani.tsx`):**
   - Taslak kaydı, yayınlama, kapatma, silme (`sonrakiSayfaToastYaz` / `sonrakiSayfaToastOku`), bağlantı kopyalama ve Excel rapor indirme bildirimleri `SUREC16_TOAST` üzerinden standartlaştırıldı. *(Ek SQL gerektirmez.)*

---

## 9. Süreç 17 — Raporlama ve Performans İzleme *(Tamamlandı ve Doğrulandı)*

- İncelenen tüm rapor ekranları (`app/(panel)/raporlar/utt`, `bm`, `tm`, `yonetici`, `tclub-uretici`, `yayin-raporlari` ve `app/partner/raporlar`) ile ilgili API rotaları salt okunur (`GET`) analitik ekranlarıdır; kayıt yazma, dış davet veya ticari durum geçişi bulunmadığından otomatik e-posta, Web Push veya toast bildirimi gerektirmez.
- Ölçüm zamanı standardı (`lib/utils/raporUtils.ts` içindeki `PERIYOTLAR`: yalnızca **Haftalık, Aylık, Dönemlik ve Yıllık**, günlük seçenek yok) tüm raporlarda doğrulandı.

---

## 10. Süreç 18 — Bildirimler, İletişim ve Sözleşmeler *(Tamamlandı ve Doğrulandı)*

- **18.1 — Uygulama İçi Bildirim ve Rozet Merkezi (`app/bildirimler/api/route.ts`, `lib/utils/bildirimOlustur.ts`, `lib/utils/eclubBildirim.ts`):** `bildirimler` ve `eclub_bildirimler` tablolarındaki okunmamış kayıtları ve menü rozet sayılarını yöneten taşıyıcı altyapıdır; okundu işaretleme (`PUT /bildirimler/api`) arka planda sessiz çalışır ve rozet sayısını düşürür.
- **18.2 — Web Push İzin Kartı ve Tarayıcı Abonelik Yönetimi (`app/providers/PushAbonelik.tsx`, `app/api/push/abonelik/route.ts`, `lib/push/icerik.ts`, `lib/push/orkestrasyon.ts`):** Hesap bazlı ilk rıza (`K-P12`), 7 günlük erteleme kartı ve PII taşımayan (`K-P6`) 9 olay türü eksiksiz çalışır.
- **18.3 & 18.4 — Sözleşme / KVKK Onayları ve Bilgi Sayfaları:** Kurumsal Üyelik (Süreç 1), Eczanem Üye Kaydı (Süreç 11) ve Agora Partner Başvurusu (Süreç 14) KVKK/sözleşme onayları ilgili süreçlerde e-posta ve toast bildirimleriyle tamamlanmıştır; panel içi `/sozlesmeler` ve `/iletisim` sayfaları salt okunur bilgi ekranlarıdır.

---

## 11. Genel Tamamlanma Özeti ve Kapanış Durumu (18 / 18 Süreç Tamamlandı ✅)

- **Tamamlanan Süreçler (1–18):**
  - **Süreç 1–10:** Kodlandı, doğrulandı, Supabase SQL'leri uygulandı ve `origin/main` (`e1702366`) üzerine push edildi.
  - **Süreç 11–18 (Eczanem, FirmaStore, Viva, Agora İş Partneri, Agora Alıcı Firma, BOLIS, Raporlama, Bildirimler/İletişim/Sözleşmeler):** Tamamı kodlandı, hedefli testlerle ve ESLint/TypeScript kontrolleriyle doğrulandı; gerekli tüm Supabase SQL dosyaları (`eczanem_*.sql` × 6, `firmastore_cek_eposta_standardi.sql`, `viva_eposta_davet_standardi.sql`, `agora_eposta_bildirim_okuma.sql`) Supabase üzerinde çalıştırılıp doğrulandı.
- **Versiyon Kontrol ve Parkta Bekleyenler *(Kullanıcı Talimatıyla Yürütülür)*:**
  1. **Yerel Değişikliklerin Commit ve Push Edilmesi:** Toplu konu başlığı standardizasyonu ve Süreç 11–18 kapsamındaki yerel değişiklikler kullanıcı talimatıyla commit ve push edilecektir.
  2. **AGENTS.md Kapsamında Parkta Bekleyen Zorunlu Hatırlatmalar *(Açık Talimat Olmadan Dokunulmaz)*:**
     - **Eczanem>İndirim Onayı sekmesindeki (F) veriler silinecek.**
     - **Hediye Takibi test verileri silinecek** (`scripts/sql/eclub_hediye_takip_test_verisi_temizle.sql`) ve **Hediye Takibi uçtan uca testleri** bekliyor.
     - **TB-VIVA-01**, **TB-ESNEK-01**, **TB-ICERIK-01** canlı kabul testleri ve **Agora partner IBAN MOD 97** canlıya geçiş kontrolü park durumundadır.
