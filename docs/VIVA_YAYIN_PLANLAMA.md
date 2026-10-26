# Viva — Anlık yayın, planlama ve takvime ekleme

25 Ekim 2026. Kullanıcı onayıyla geliştirildi.

## Ekran akışı

- Yeni yayında önce **Şimdi başlat / Yayın planla** seçilir. Kendiliğinden yayın türü seçilmez.
- **Şimdi başlat:** başlık, katılımcılar ve dakika cinsinden süre. Başlangıç/bitiş istemciden gönderilmez; veritabanı kendi saatini kullanır. Oluşturulduktan sonra yayın sahibi oda sayfasına yönlenir ve mevcut güvenli katılım akışı başlar. Kamera/mikrofon başlangıçta kapalıdır. `canli` durumu, mevcut Daily presence doğrulamasıyla belirlenir.
- **Yayın planla:** başlangıç tarihi ve başlangıç saati ayrı alanlardır. Tarih seçmek saati doldurmaz/değiştirmez. Bugün ilerideki bir saat de seçilebilir. Türkiye saati UTC'ye çevrilir; bitiş seçilen süreyle hesaplanır.
- Süre varsayılan 60 dakika; 1–1440 dakika değiştirilebilir. Bu alan mevcut oda erişim bitişini belirler. Daily kayıtlarının kendi süre sınırları ayrıdır.
- **Taslak olarak kaydet** planlama için ayrı düğmedir. Taslak yalnız sahibine görünür. Planlanmış yayında taslağa geri dönüş sunulmaz.
- Düzenleme aynı ayrı tarih/saat ve süre alanlarını kullanır. Başlatılmış anlık yayın yeniden planlanmaz.

## İki takvim düğmesi

Kaydedilmiş, erişim süresi bitmemiş planlanmış yayının detayında yetkili üyeler **Google Takvim’e ekle** ve **Outlook Takvim’e ekle** düğmelerini görür. Taslak, iptal, bitmiş ve anlık yayınlarda gösterilmez. Misafir davet ekranına eklenmedi.

Google düğmesi başlık, açıklama, başlangıç/bitiş ve normal Viva etkinlik bağlantısıyla Google'ın etkinlik formunu açar. Outlook düğmesi Outlook'a aktarılabilen `.ics` dosyasını indirir. Kullanıcı takvimine kaydı kendisi onaylar; hesap bağlama, otomatik davet gönderme ve sürekli senkronizasyon yapılmaz. Viva'da daha sonra yapılan değişiklik dış takvimdeki kopyayı otomatik güncellemez. Katılım bağlantısı Daily tokenı veya misafir davet sırrı içermez; mevcut Viva oturum ve yetki kontrolüne döner.

## Veritabanı güncellemesi ve kullanıcı sonucu

`scripts/sql/viva_anlik_planlama.sql` mevcut `viva_islem` ve `viva_ozet` fonksiyonlarını günceller; yeni tablo/kolon eklemez. Mevcut kurulum dosyaları değiştirilmedi. Tür, değişmez oluşturma özetinde tutulur; eski kayıtlar `planli` kabul edilir. Aynı anahtarlı anlık oluşturma tekrarı başlangıcı değiştirmez. Sahiplik, organizasyon kapsamı, sürüm kontrolü ve service_role RPC sınırı korunur.

Kullanıcı SQL'i çalıştırdı ve `planlama_fonksiyonu = true` sonucunu paylaştı. Bu sonuç fonksiyonun mevcut olduğunu doğrular; tek başına anlık yayın oluşturma veya gerçek Daily görüşme kabulü değildir. Ajan canlı veritabanında SQL çalıştırmadı.

## Doğrulama ve kalan kontrol

React arayüzü, form doğrulaması, takvim verisi ve mevcut Prebuilt akışındaki 55 test başarılıydı. Son iki arayüz testi eklendikten sonra arayüz/planlama grubunun 21/21 kontrolü yeniden başarılı oldu; toplam 57 farklı hedefli test geçti. TypeScript kontrolü başarılı. ESLint 0 hata; şema snapshotında bulunmayan mevcut Viva RPC'leri için verilen üç uyarı, canlı şema yenilemesi yapılmadığından korunur.

`tests/vivaPlanlama.postgres.mjs` izole PostgreSQL testi hazırdır. Salt okunur test çalışması paylaşımlı bellek oluşturma hatasında durdu; kısıt dışı test izni kullanıcı tarafından durduruldu. Dolayısıyla bu PostgreSQL testinin başarılı olduğu iddia edilmez. Gerçek görüşme ve Google/Outlook hesabında kaydetme işlemi kullanıcı tarafından kontrol edilmelidir. Tam production build/deployment yapılmadı.

Kaynaklar: [Google etkinlik bağlantısı](https://developers.google.com/workspace/calendar/api/concepts/inviting-attendees-to-events), [Outlook iCalendar aktarımı](https://support.microsoft.com/en-us/outlook/import-or-subscribe-to-a-calendar-in-outlook-com-or-outlook-on-the-web).
