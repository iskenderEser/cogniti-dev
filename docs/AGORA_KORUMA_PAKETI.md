# Agora yayın koruma paketi — 5 Kasım 2026

## Kesinleşen kapsam

Koruma yalnız partner yayınının satın alma öncesi deneme erişimine aittir. Taslak orijinali korunur ve mevcut tek oynatıcıdan normal dinlenir. Yayımla, koruma paketini doğrular ve o medya kaydına bağlar. Satın alma tek firmaya sınırsız süre, tekrar ve hedef kitleyle kullanım verir; aynı eğitim diğer firmalar için vitrinde kalır. Satın alma, diğer alıcıların korumasını kaldırmaz. Firma havuzuna temiz orijinal aktarımı satın alma geliştirmesinde yapılacak; henüz uygulanmadı.

## Uygulanan kod

- Ortak `AgoraDenemeOynaticisi`: videonun merkezinde mevcut Cogniti logosu ve “Deneme Yayını”. Tam ekran işaretli sarmalayıcıda; iframe'e bağımsız tam ekran ve PiP izni verilmez.
- Podcastte yerel Türkçe Yelda sesiyle “Kogniti. Deneme yayını.” telaffuzuyla üretilmiş WAV dosyası. İlk Dinle ve oynatılan her 30 saniyelik yeni bölümde uyarı çalar; bu sırada içerik durur. Uyarı bitmeden içerik başlamaz. Uyarı hatası içerik oynatımını durdurur. İleri sarma yeni bölümün uyarısını atlatmaz.
- Deneme podcastinde indirme sunan yerel audio kontrolleri ve dosya bağlantısı yok. Kendi Dinle/Duraklat ve konum kontrolleri kullanılır.
- Podcast kaynağı doğrudan CDN bağlantısı olarak verilmez. Her metadata/akış/Range isteğinde aynı kaynak istek, aktif partner oturumu ve eğitim sahipliği yeniden kontrol edilir. Navigasyon/dış site isteği reddedilir. Ses baytları sunucudan cache edilmeden inline aktarılır. Kaynak anahtarı ve orijinal URL istemciye çıkmaz.
- Tek yayın kartında tek oynatıcı vardır. İkinci önizleme ve “Agora Korumasını Test Et” düğmesi kaldırıldı. Taslakta yüklenen orijinal sesli uyarısız oynar; Yayımla sonrasında aynı oyuncuya koruma uygulanır. Durumu sunucu belirler; kullanıcıya aç/kapat anahtarı verilmez.
- Yayımlanmış formun düzenleme alanları kilitli kalır; mevcut oynatıcı kilitli fieldset dışında olduğundan dinleme çalışır.
- Yayımla API'si hazır kaynağı ve koruma bağımlılıklarını kontrol eder. SQL hazırlama kaydı tam eğitim sürümüne ve medya yükleme ID'sine bağlıdır. Dosya veya eğitim değişirse yeniden doğrulama gerekir.
- SQL yayımlama fonksiyonu, trigger ve katalog görünümü hazırlanmamış paketi reddeder. Mevcut korumasız kayıtlar otomatik olarak korumalı işaretlenmez; korunmuş katalog görünümünden çıkarlar. İçerikler/veriler silinmez.

## SQL uygulaması

`scripts/sql/agora_partner_koruma_paketi.sql` önceki Agora kurulumlarının ardından **en son** çalıştırılır. Tanıtım videosu kaldırma değişikliği bu migration içinde de vardır; önceki tanıtım SQL'ini bunun ardından tekrar çalıştırma. Liste/PE/thumbnail RPC'lerine dokunmaz.

Beklenen sonuç: `agora_partner_koruma_paketi_hazir = true`.

Hazırlama RPC'si yalnız service_role tarafından çağrılır. İstemci `satın_alındı=true` veya `koruma=false` göndererek temiz içeriğe erişemez. Yeni alıcı erişim API'si kurulurken kimlik/firma ve satın alma kaydı sunucuda doğrulanmalı; deneme erişimi bu ortak oynatıcıya bağlanmalı.

## Video — henüz bekleyen sağlayıcı ayarı

5 Kasım 2026 kullanıcı kararıyla Bunny doğrulama işaretini zorunlu tutan ek video yayımlama engeli kaldırıldı. Partner incelemesinde mevcut oynatıcı erişimi kullanılır. Yayımlanmış içerikte filigran gösterilir. Agora alıcı tarafında indirme engelinin uçtan uca doğrulaması bekliyor. Aşağıdaki sağlayıcı ayarları bu doğrulama için takip edilir:

- `BUNNY_STREAM_TOKEN_KEY`: Stream Security ekranındaki **token authentication key**; yükleme API anahtarı değildir. İstemciye verilmez.
- Bunny Stream'de embed token authentication, Cogniti allowed domains, Block Direct URL File Access ve MediaCage Basic DRM doğrulanmalı; MP4 download/fallback erişimi kısıtlanmalı.
- Bu ayarlar doğrulandıktan sonra `AGORA_BUNNY_KORUMA_DOGRULANDI=1` ayarlanır. Tek başına bu ortam işareti sağlayıcıda koruma açmaz.
- Mevcut kütüphane Cogniti'nin diğer videolarınca paylaşıldığından burada kütüphane genel ayarı **değiştirilmedi**. İmzasız mevcut oynatıcıların kırılmaması için tüm video erişimleriyle birlikte geçiş doğrulanmalı. İlgisiz firmalara etki eden ayar sessizce açılmamalı.

Resmî kaynaklar:
- https://github.com/BunnyWay/documentation/blob/main/stream/token-authentication.mdx
- https://github.com/BunnyWay/documentation/blob/main/stream/security-options.mdx

## Teknik sınır ve kabul

Bu, kullanıcının istediği oynatıcıya bağlı caydırıcı korumadır; orijinale kalıcı filigran işlenmez. Teknik müdahaleyle audio kaynağını/kodu değiştirmeyi veya ekran/ses kaydını kesin önlemez. Görüntü ve sesin gerçek tarayıcıda, özellikle mobil Safari'de, dinleme/tam ekran kabulü henüz yapılmadı. Otomatik testler medya olaylarını sahte oynatıcıyla sınar; gerçek ses dinlendiği iddia edilmez.

Kullanıcı `agora_partner_koruma_paketi_hazir=true` sonucunu iletti. İlk ses testi 15 saniyelik podcastte yapıldı. Sonrasında tek oynatıcı akışı düzeltildi; yeni telaffuz ve yayımlama sonrası gerçek kullanıcı kontrolü bekliyor. Taslaktaki kullanıcı podcasti bu geliştirme sırasında yayımlanmadı. Alıcı Agora vitrini, gerçek satın alma ve firma havuzuna aktarım henüz kurulmadı.

## Tek oynatıcı düzeltmesi

Ayrı ses yayını/kopya oluşturulmadı. Aynı kaynak tek kontrol alanından oynatılır. Taslak için sunucu `korumaSurumu=0`, yayımlanmış paket için `korumaSurumu=1` verir. Yayımlanmış içerik query parametresi ile taslak moda geçirilemez. Bu düzeltme yeni SQL gerektirmez.
