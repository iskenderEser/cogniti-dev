# Viva — yayın sonrası video ve sohbet indirme

25 Ekim 2026. Kullanıcı kararı: yayın bittikten sonra 7 gün indirme erişimi.

## 26 Ekim 2026 — Daily yerel kontrollere geçiş

Viva'nın özel kayıt düğmeleri ve `chat-webvtt` isteyen başlangıç çağrısı kaldırıldı. Kayıt Daily arayüzünden sunucu tarafından yönetilir. Yerel kayıt menüsünün sohbet çıktısı üretimi canlıda doğrulanmadı; yeni kayıtlarda sohbet dosyası oluşacağı garanti edilmez. Mevcut video/sohbet dosyalarının indirme ve yetkilendirme akışı korunur. Aşağıdaki başlangıç düğmesine ilişkin maddeler önceki uygulamanın tarihsel kaydıdır.

## Önceki uygulama

- Eski “Sohbeti aç / metni indir” kısayolu, ayrılmadan önce indirme uyarısı ve kapanış ara ekranı kaldırıldı.
- Sunucunun Kaydı başlat düğmesi Daily SDK startRecording({type:"cloud",dataOutputs:["chat-webvtt"]}) kullanır. Otomatik kayıt kapalıdır. Kamera, mikrofon, ekran paylaşımı ve sohbet Daily Prebuilt içinde kalır.
- Daily'nin yerel kayıt düğmesi kapatıldı: sohbet çıktısını istemeyen ikinci bir başlangıç yolu bırakılmadı. Sunucu Viva başlığındaki Kaydı başlat / Kaydı durdur düğmesini kullanır.
- Yayıncı etkinlik sayfasında ve oda ekranında Videoyu indir / Sohbet metnini indir düğmeleri bulunur. Görüşmeden ayrılmak indirme alanını kaldırmaz.
- Her iki dosyada yayın sahipliği/aktif organizasyon ve oda/oturum eşleşmesi sunucuda doğrulanır; bağlantı üretildikten sonra yetki ve süre yeniden kontrol edilir.
- Yayının gerçek kapanış zamanı sabitlenir; sonraki güncellemeler süreyi uzatmaz. Zaman aşımıyla kapanan yayında planlanan bitiş esas alınır. Yeni bağlantı üretimi kapanıştan 168 saat sonra engellenir.
- İmzalı adresler saklanmaz veya değiştirilmez. Daily bağlantıları 900 saniyelik istenir; önceden verilmiş bağlantı sağlayıcı süresi bitene kadar kullanılabilir. Bu işlem Daily'deki dosyaları otomatik silmez.

## Açık kalan sağlayıcı doğrulaması

Daily chat-webvtt üretimini belgeliyor. Ancak açık REST access-link belgesi yalnız download_link/expires alanlarını tanımlıyor; ayrı sohbet bağlantısının gerçek yanıt biçimi doğrulanamadı. Hesaptaki kayıt listesi teknik kontrolde boştu. Kod yalnız sağlayıcı yanıtında açıkça chat-webvtt olarak etiketlenen ek bağlantıyı kabul eder; video URL'sinden tahmini metin adresi üretmez. Sağlayıcı ayrı bağlantı döndürmezse sohbet indirmesi açıklayıcı 404 verir. Dolayısıyla sohbetin uçtan uca indirildiği veya bu özelliğin bütünüyle tamamlandığı iddia edilmiyor. Yeni bir gerçek kayıt üzerinde yanıtın doğrulanması ve gerekirse bağlantı çözümleyicisinin buna uyarlanması gerekiyor.

Sohbet dosyası, kayıt açıkken oluşan yazışmaları kapsar. Önceki kayıtlarda chat-webvtt istenmediğinden geriye dönük sohbet dosyası üretildiği varsayılmaz. Dosya WebVTT (.vtt) metin biçimidir; konuşma transkripsiyonu değildir.

## Uygulama ve doğrulama

- scripts/sql/viva_kayit_indirme_7gun.sql kullanıcı tarafından çalıştırılacak. Yeni kapanış kolonu, sabitleme tetikleyicisi ve yalnız service_role erişimli indirme fonksiyonu içerir. Uygulanmadan yeni listeleme/indirme RPC'si kullanılamaz.
- 7 hedefli uygulama testi geçti: süre sınırı; sağlayıcı bağlantısını değiştirmeden çözümleme; yetkisiz indirme reddi; işlem sırasında yetki kaybı; kayıt hazır bildiriminin yeniden denenmesi; sunucuya özel chat-webvtt başlangıcı; indirmeden yayını bitirebilme.
- Sentetik sağlayıcı yanıtıyla yapılan bağlantı testi gerçek Daily sohbet yanıtının doğrulandığı anlamına gelmez.
- Değişen üretim dosyalarında lint: 0 hata, 0 uyarı.
- Veritabanına bağlanılmadı, SQL çalıştırılmadı. Gerçek görüşme/görsel test yapılmadı. Commit, push ve deployment yapılmadı.

## Resmi kaynaklar

- [Daily kayıt çıktı seçenekleri](https://docs.daily.co/reference/daily-js/types/daily-streaming-options)
- [Daily kayıt başlatma](https://docs.daily.co/reference/daily-js/instance-methods/start-recording)
- [Daily kayıt indirme bağlantısı](https://docs.daily.co/reference/rest-api/recordings/get-recording-link)
- [Daily imzalı bağlantıları değiştirmeden kullanma](https://docs.daily.co/docs/rest-api/access-links)
