# Viva gerçek kullanım üzerinden token tüketimi

28 Ekim 2026 kullanıcı kararı. Kod hazırlanmış ve yerel testler tamamlanmıştır; canlı veritabanı kurulumu ve gerçek Daily yayın testi bekler.

## Kurulum

1. Uygulama değişikliklerini aynı sürümde devreye alın: Daily kullanım okuyucusu, Viva cron bağlantısı, ortak fiyat kaynağı ve miktara göre token raporları birlikte bulunmalıdır.
2. Kullanıcı Supabase SQL Editor'da `scripts/sql/cogniti_token_viva_kullanim_kurulum.sql` dosyasının tamamını çalıştırır. Mevcut token/KKÖ aylık, Viva 2.4/2.5 ve gün sonu kurulumları önkoşuldur. Aynı SQL tekrar çalıştırılabilir; geçmiş tüketimler silinmez. Eski `cogniti_token_viva_kurulum.sql` dosyasını bunun ardından yeniden çalıştırmayın; eski davet tetikleyicilerini geri getirir.
3. Sonuçta `viva_kullanim_tuketimi_kuruldu` ve `yeni_yayin_kurali_aktif` true olmalıdır. Bu sonuç yapısal kurulumu gösterir; gerçek yayın testi yerine geçmez.
4. Mevcut Viva cron'u ve imzalı Daily webhook akışı çalışır durumda olmalıdır. Ek cron veya yeni gizli anahtar gerekmez; sunucudaki mevcut Daily API ayarları kullanılır. Yayın kapandıktan sonra cron kullanım mutabakatını yeniden deneyerek tamamlar.

## Beklenen davranış

Davet ücretsizdir. Yayın bitince Daily katılımcı süreleri, yayın sahibi dahil toplanır. Tüketim `kişi-dakika × 0,004 × 55 × 1,5 ÷ KKÖ birim fiyatı` ile bulunur; toplam 0,5 ve üstünde yukarı, altında aşağı tam tokena yuvarlanır. Bugün KKÖ fiyatı 9,90 TL; 100 kişi × 60 dakika = 200 token. KKÖ fiyatı fiyatlar sayfasıyla ortak kaynaktan alınır ve iş başında sabitlenir.

KKÖ'de sıfır bakiye yeni yayını engeller; devam eden yayın sonradan aşım oluşturabilir. Bu aşım yalnız ilgili ayın tüketimine dahildir, sonraki ayın hakkından düşülmez. Aylık pakette normal negatif bakiye/mahsup sürer. Ay geçişinden sonra mutabakat eski ayı düzeltir. Geçmiş davet ücretleri korunur; bunların bulunduğu etkinliklere ikinci ücret yazılmaz. Kurulum anındaki geçmiş veya devam eden eski yayınlar geriye dönük yeni ücretlendirmeye alınmaz. Yeni yayınlar ve gelecekteki ücretsiz plan/taslaklar yeni modele girer.

Yayın kapanışından en az 45 saniye sonra okuma yapılır; en az 30 saniye arayla iki aynı sonuçla kesinleşir. Eksik/aktif Daily oturumu yeniden denenir. Sonucun 20 saniyede oluşacağı taahhüt edilmez. `cogniti_viva_tuketim_isleri` tablosu fiyatları, ölçümü, aşımı, dönemi ve işlem durumunu saklar. Tüketim tek toplu kayıt olarak `cogniti_token_tuketimleri.miktar` alanına yazılır; tekrar çağrı ikinci kayıt üretmez. Gün sonu kartları ve admin görünümü miktarı toplar/gösterir.

## Yapılan doğrulama

- 49 hedefli uygulama testi; TypeScript kontrolü başarılı, kapsamlı lint kontrolünde hata yok.
- 14 gerçek yerel PostgreSQL senaryosu: tekrar kurulum, geçmiş kayıt, ücretsiz davet, KKÖ/aylık aşım, sonraki yükleme, yuvarlama, eksik sağlayıcı verisi, kısa katılım, önceki ay mutabakatı, iki bağlantıyla eş zamanlılık, firma içi rol kapsamı ve RPC erişimi.
- 14 gün sonu rapor testi.

Yerel PostgreSQL testi: `VIVA_PG_BIN=/yerel/postgresql/bin node tests/vivaTuketim.postgres.mjs`. Yalnız /tmp altında sahte veriler ve Unix socket kullanır; Supabase/Daily bağlantısı kurmaz. Bu testler canlı şemayı veya gerçek yayın deneyimini doğrulamaz.

## 28 Ekim — odasız yayın tüketim kuyruğu düzeltmesi

Daily oda adı hiç oluşmamış ve bitmiş/iptal edilmiş etkinlik 0 token, 0 saniye ile tamamlanır; tüketim hareketi oluşturulmaz. Bekleyen yaşam döngüsü kaydı odasız etkinliği engellemez. İşleyici bu sonucu kuyruk sonu sanmadan sonraki işe geçer. Odası bulunan bir yayının kapanışı tamamlanmadığında ise o iş bekler, uygun sonraki iş alınır; kapanış kontrolü kaldırılmaz.

Ana kurulum SQL’i ve uygulama işleyicisi güncellendi. Mevcut kurulum için kullanıcı `scripts/sql/cogniti_token_viva_kuyruk_duzeltmesi.sql` dosyasını çalıştırır. Yama yalnız tüketim fonksiyonunu günceller; eski işlevden yükseltme ve tekrar uygulama test edildi. Kullanıcı SQL sonucunu viva_kuyruk_duzeltildi=true olarak doğruladı; veritabanı yaması uygulandı. Production uygulama deployment durumu doğrulanmadı. Bu çalışma sırasında gerçek yayınlara veya Daily’ye istek gönderilmedi.

Doğrulama: 17/17 yerel PostgreSQL senaryosu, 8/8 tüketim uygulama testi ve TypeScript kontrolü başarılı. PostgreSQL testleri yalnız /tmp ve Unix socket üzerinde sentetik verilerle çalıştırıldı; canlıya bağlanmadı.

## 28 Ekim 21:56 — bekleyen gerçek tüketimlerin tamamlanması

Kullanıcının uyguladığı kuyruk yaması ardından mevcut yaşam döngüsü ve tüketim işleyicileri ilgili yayınlar için hedefli çağrıldı. Deneme 12: 641 kişi-saniye, 0 token; Deneme 13: 1645 kişi-saniye, 1 token; Deneme 14: 45 kişi-saniye, 0 token. Üç yaşam döngüsü ve tüketim işi tamam, kapanış hata kodları boş. Gerçek tüketim tablosunda yalnız Deneme 13 için tek viva_sure hareketi, miktar=1 doğrulandı; sıfır sonuçlara hareket oluşmadı.

Bu sonuç elle başlatılan mevcut işleyicinin sonucudur; cron’un periyodik olarak çağrı yaptığı doğrulanmadı. Cron ayarı, webhook veya deployment değiştirilmedi. Mevcut cron etkinliğini kontrol etmek için yalnız okuma yapan `scripts/sql/viva_cron_durumu.sql` hazırdır; kullanıcı çalıştırır.


### 28 Ekim 2026 — cron hedefi, commit öncesi durum

Kullanıcı `cogniti_viva_yasam` görevinin aktif=false olduğunu doğruladı ve sonra aynı görevi active=true yaptı. Dakikalık iki çalıştırma succeeded döndü. İlk HTTP kontrolü eski `hapbilgi.vercel.app` hedefinde 401 ve uygulamanın Yetkisiz erişim yanıtını verdi. Kullanıcının doğruladığı yeni adres doğrultusunda Vault'taki `hapbilgi_cron_base_url` değeri kullanıcı tarafından `https://cogniti-dev.vercel.app` yapıldı. Anahtar adı/değeri değiştirilmedi. Yeni hedefteki 126925 numaralı HTTP kontrolü 200, zaman aşımı yok ve 15 iş/0 hata döndürdü. Bu yanıtta tuketim alanı yoktu; güncel tüketim kodu henüz push/deployment edilmemişti. Otomatik gerçek tüketimin üretim doğrulaması deployment sonrasına kalır. Teknik Hapbilgi adlarının toplu dönüşümü ayrı task kapsamıdır.

Commit öncesi kontrol: `npm run typecheck:build` ve `git diff --check` başarılı. Dokuz hedefli test dosyasında 139 testin 138'i başarılı, biri başarısız: `tests/vivaArayuz.hedef.test.ts` içindeki takvim düğmeleri beklentisi. Bu test gövdesi baz commit'te de aynı; ilgili `VivaDetayIcerigi` bileşeni pakette değiştirilmemiş ve takvim prop'unu göstermiyor. Bu commit hazırlığında ürün davranışı veya test beklentisi değiştirilmedi. Daha önceki tüketim doğrulamasında 17 yerel PostgreSQL senaryosu ve 8 tüketim uygulama testi başarılıydı. Tam production build ve deployment sonrası otomatik kontör kabulü yapılmış sayılmaz.
