# Cogniti marka dönüşümü

Tarih: 18 Ekim 2026.

**19 Ekim 2026 güncellemesi:** bi sohbet özelliği tüm uygulama bileşenleriyle kaldırıldı. Aşağıdaki 18 Ekim doğrulama sonuçları tarihsel kayıttır; bi artık platform işlevi değildir.

## Durum

Yerel kodda marka adı, iki temanın logosu ve favicon/PWA simgeleri uygulandı. Kullanıcı yeşil renk eşlemesini ve küçük simgelerde soldaki hız çizgilerinin kullanılmasını onayladı. Kullanıcı 18.10.2026 tarihinde gerçek oturumla son ekran ve akış kontrollerini yaptığını ve doğruladığını bildirdi. Uygulama içindeki marka dönüşümü kullanıcı doğrulamasıyla tamamlandı. Domainin canlı ortama bağlanması yapılmadı; canlı ortam geçişi ayrı iştir.

## Uygulananlar

- Cogniti ve “bilgi taşır” ifadesi; giriş ekranı, tarayıcı/uygulama adı ve açıklaması.
- Onaylanan gerçek vektör logolar: `public/marka/cogniti-blue.svg`, `public/marka/cogniti-green.svg`. Tema değişince ortak logo bileşeni ilgili sürümü gösterir.
- Küçük simge: `public/marka/cogniti-icon.svg`; yalnız logonun üç renkli hız çizgisi yolu kullanıldı. `app/favicon.ico` (16/32/48), `app/apple-icon.png` (180), `public/icon-192.png` ve `public/icon-512.png` bu simgeden üretildi. Mevcut Sharp aracı kullanıldı, yeni araç indirilmedi.
- Ortak logo bileşeni: `components/marka/CognitiLogo.tsx`.
- Panel, Eczanem, giriş, şifre yenileme, davet ve yönetici logo önizlemesi. Mevcut logo alanlarının ölçüleri korundu; yeni yatay logo bu alanlara oranı bozulmadan sığdırıldı.
- Kullanıcıya görünen menü etiketleri, bilgi sayfası etiketi, hesap mesajları, alt bilgi ve bildirim başlıkları.
- Yasal metinlerde yalnız platformun marka adı değiştirildi; şirket, hak sahibi ve hükümler korunuyor.
- E-posta davet başlığı, çek e-postasındaki platform adı ve depo talebi konusu.
- Grafik PNG dışa aktarımındaki filigran temaya göre mavi veya yeşil Cogniti logosu oldu.
- Metadata ana adresi `https://cogniti.net` olarak tanımlandı. Bu, DNS veya hosting domain bağlantısının yapıldığı anlamına gelmez.

## Açık kararlar ve sonraki işlemler

1. Yeşil logo renkleri onaylandı ve uygulandı: `#BED5F5 → #EDF2E7`, `#006CE6 → #4F7254`, `#004CEF → #355545`, `#3F4D5F → #68766E`, `#09131D → #2C4137`.
2. Favicon ve uygulama simgesi için soldaki hız çizgileri onaylandı ve uygulandı.
3. Canlı domain geçişinde hosting/DNS, Supabase site/redirect adresleri, Bunny izinli origin/domain alanları, ortam değişkenleri ve e-posta gönderici ayarları gerçek hesaplar üzerinden ele alınmalı. Bu ayarlara işlem yapılmadı. Mevcut `HAPBILGI_SITE_URL` değişkeninin adı teknik uyumluluk için korunur; canlı değerinin yeni domain olması gerekir.
4. Veritabanı dönüşümü kullanıcı tarafından uygulandı ve sonuçla doğrulandı. Eczanem'in üç bannerı ve E-Club ana sayfa bannerı kullanıcı tarafından yeni logoyla güncellendiği bildirilerek tamamlandı.
5. Kity ve renk demoları tarihsel örnek içeriklerini korur. Mia'nın mevcut MP3 kaydı eski marka adını söylüyor; Kity adımında Cogniti metinleriyle yeni kayıt hazırlanacak. Kayıt kendiliğinden değiştirilmedi.
6. Kullanıcının kararıyla e-posta gönderici/domain teknik kurulumu gerçek e-posta ile kayıt testleri aşamasına ertelendi. AGENTS.md'ye bu aşamada hatırlatma kuralı eklendi. E-posta içerik taslakları `docs/COGNITI_EPOSTA_SABLON_STOGU.md` içinde tutuluyor; taslak hazırlığı gönderim entegrasyonu veya gerçek teslimat testi değildir.

## Korunanlar

- Sayfa URL'leri marka adımında korunmuştu; ikinci iş adımında onaylanan değişiklikler uygulandı ve kullanıcı doğruladı. Güncel kayıt: `docs/ONAYLI_URL_DEGISIKLIKLERI_2026_10_18.md`.
- Veritabanı/tablo/kolon adları, auth kimlikleri, firma kayıtları.
- Cookie/localStorage/sessionStorage anahtarları, olay adları, ortam değişkeni adları ve teknik proje/dosya adları.
- İş metrikleri, puanlar, gönderim/teslimat kuralları, fontlar ve mevcut kontrollerin ölçüleri.
- E-Club çek e-posta alıcısı ve push hedeflemesi: e-posta dosyasında yalnız görünür platform adı değişti; alıcı ve teslimat kodu korunuyor. Gerçek e-posta/push gönderilmedi.

## Doğrulama

- `npm run typecheck:build`: başarılı.
- Panelin bütün tanımlı rollerdeki renk/menü kontrolleri: 3/3 başarılı. Yeni ortak logo modülü test yükleyicisine eklendi.
- İlgili Eczanem yüzeyi, üye engeli, firma co-branding ve bi API kontrolleri: 23/23 başarılı.
- Üretim varyantı metinlerinin iki kontrolü başarılı. Aynı dosyanın değişmeyen rapor başlığını kontrol eden üçüncü testi mevcut kaynakla uyuşmuyor; bu marka değişikliği kapsamında rapor başlığı değiştirilmedi.
- Değişen kaynakların ESLint kontrolünde mevcut PushAbonelik satır 90 `set-state-in-effect` hatası ve dört mevcut uyarı görüldü. Marka değişikliğinde bu dosyada yalnız görünür ad değişti; lint hatasını gizlemek için davranış değiştirilmedi.
- Gerçek tarayıcı/rol oturumu son kontrolünü kullanıcı yaptı ve 18.10.2026 tarihinde doğruladı. Ajan Chrome kullanmadı.
- Ajan canlı dağıtım, DNS işlemi veya veritabanı güncellemesi yapmadı. Aşağıdaki marka dönüşüm SQL'i kullanıcı tarafından çalıştırıldı ve sonucu paylaşıldı.

## Tam dönüşüm: veritabanı ve banner eşlemesi — 18.10.2026

### Adım 1 — Kullanıcının çalıştırdığı ön kontrol: tamamlandı

`scripts/sql/cogniti_marka_db_on_kontrol.sql` sonucu kullanıcı tarafından paylaşıldı:

- Tek platform firması: `15853eba-a94c-4528-9a07-0ee0b8677a02`, adı `Hapbilgi`.
- `logo_url = null`; firma aktif, E-Club açık, Eczanem kapalı.
- Bir E-Club bannerı var; Eczanem banner kaydı yok.
- Veritabanındaki beş banner istisnası eski firma adına bağlı.
- Kimlik ayrımı fonksiyonunun iki hata mesajı eski marka adını içeriyor.

### Adım 2 — Kod eşlemesi: uygulandı

- `lib/eclub/banner.ts` içindeki ortak platform firma kimliği kullanılıyor. Ana sayfa sorgusu, admin banner alanları ve yükleme sınırı firma adından bağımsız hale getirildi.
- Platform için beş, diğer firmalar için üç banner kuralı korundu. Eczanem alanları üç banner olarak kaldı.
- Aynı banner kayıtları, depolama yolları, rol ve aktif modül kontrolleri korunuyor. Görsel ölçüleri, renkler ve yerleşimler değiştirilmedi.
- İlgili kurulum SQL'leri de aynı kimlik eşlemesini ve Cogniti mesajlarını kullanacak şekilde güncellendi.
- Mevcut banner testleri: 4/4 başarılı. Değişen kodun ESLint kontrolü ve `npm run typecheck:build`: başarılı. Dönüşüm SQL'i veritabanında çalıştırılmadı; bu sonuçlar SQL'in uygulanmasını doğrulamaz.

### Adım 3 — Veritabanı dönüşümü: kullanıcı uyguladı, sonuç doğrulandı

`scripts/sql/cogniti_marka_db_donusumu.sql` kullanıcı tarafından çalıştırıldı. Paylaşılan sonuç:

- Aynı firma kimliği `15853eba-a94c-4528-9a07-0ee0b8677a02`; firma adı `Cogniti`.
- `banner_kimlige_bagli = true`; `eski_marka_mesajlari_kaldirildi = true`.
- `logo_url = null`, `aktif = true`, `eclub_aktif = true`, `eczanem_aktif = false` korundu.
- E-Club banner adedi `1`, Eczanem banner adedi `0`; ön kontrol ile aynı.
- Teknik fonksiyon adları korundu. Kimlik ayrımı fonksiyonunda yalnız iki mesajın marka metni değiştirildi.
- SQL ajan tarafından çalıştırılmadı; uygulanma durumu kullanıcının paylaştığı sonuçla doğrulandı.

### Eczanem üç sayfa bannerı — görsel kontrol tamamlandı

Kullanıcı `scripts/sql/cogniti_eczanem_banner_gorsel_kontrol.sql` sonucunu paylaştı. Üyeler, Üye Yayınları ve İndirim Onayı alanlarında birer PNG kayıtlı; üçü de Hepifarma firmasına (`0c504d88-b9fb-40bb-beae-5bae33cb99ac`) bağlı.

- Üç görselin tamamı uygulama içi tarayıcıda açılarak incelendi; Chrome kullanılmadı.
- Üçünde de `cogniti` yazısı var; `HapBilgi` yazısı görülmedi.
- Üçünde de yazının yanında eski baykuş simgesi bulunuyor. Onaylanan hareket çizgili yeni Cogniti logosu kullanılmıyor.
- Logo PNG'nin içine gömülü; ortak site logosunun değişmesi bu dosyaları değiştirmez. Kullanıcı yeni Cogniti PNG'leri paylaşıldıktan sonra üç bannerın manuel güncellemesini gerçekleştirdiğini bildirdi. Bu iş kullanıcı bildirimiyle tamamlandı; güncellenen uzak görseller ajan tarafından tekrar açılmadı.
- Ajan görselleri, depolama kayıtlarını veya sayfa düzenlerini değiştirmedi. Bu kontrol platform firmasının E-Club ana sayfa bannerının görsel kontrolünü kapsamaz.

### Adım 4 — Banner görselleri: kullanıcı doğrulamasıyla tamamlandı

Ön kontroldeki eski E-Club ana sayfa görsel adresi artık bulunamadı. Kullanıcı ana sayfa bannerının da yeni logoyla güncellendiğini açıkça doğruladı. Eczanem'in üç bannerıyla birlikte bu adım kullanıcı bildirimiyle tamamlandı; ajan güncellenmiş görselleri tekrar açmadı.

### Adım 5 — E-posta: teknik kurulum kayıt testlerine ertelendi

Kullanıcı gönderici adı/adresi, domain ve gerçek gönderim ayarlarının gerçek e-posta ile kayıt testlerinde ele alınmasını istedi. Bu iş tamamlanmış sayılmıyor; AGENTS.md'de ilgili testlere başlarken hatırlatılacak.

Kullanıcı **“Tüm sistem bildirimlerini kapsa”** seçimini onayladı. `docs/COGNITI_EPOSTA_SABLON_STOGU.md` dosyasında E01–E35 metin stoğu hazırlandı: mevcut e-postalar, dokuz push olay ailesi, üretim ve yayın sonuçları, öneriler, Challenge Club, Eczanem, mağaza siparişleri ve çek talebi durumları. Mevcut bildirim ile yalnız durum kaydı bulunan akışlar ayrıldı; yeni e-posta alıcı ve tetikleyici kararları verilmedi. Taslaklar mevcut gönderici ayarlarını veya gönderim davranışını değiştirmedi; gerçek e-posta gönderilmedi.

Kullanıcı kararıyla çek metinleri sağlayıcıdan bağımsız **Hediye çeki** olarak genellendi. Şablon belgesinin tamamı DOCS dosyası yanında BLUEBOOK içine de ayrı kayıt olarak eklendi. Bu değişiklik uygulamadaki mevcut e-posta gönderim koduna uygulanmadı; teknik entegrasyon gerçek kayıt testleri aşamasına bırakılmış durumda.
