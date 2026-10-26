# Viva — 2.5 Elle kayıt ve Daily olayları

25 Ekim 2026. Kod, hedefli teknik kontroller ve kullanıcı SQL doğrulaması tamamlandı: 4 kurulum kontrolü true, 7/7 SQL testi başarılı. Üretim webhook kaydı deployment sonrasında yapılacak. 2.6 başlamadı.

Daily Prebuilt’in kayıt menüsü kullanılır. Yalnız sunucu tokenı `enable_recording: cloud` alır; katılımcı/özel davetli kayıt açamaz. Otomatik başlangıç kapalıdır. Başlatma isteği/durdurma işlemi Daily’nin kendi arayüzünde gösterilir; Viva, SDK’nın doğrulanmış başladı/durdu/hata bildirimini ayrıca gösterir. Kayıt hatası görüşme bağlantısını hata durumuna geçirmez. Herkes için bitirme zincirinde aktif kayıt için durdurma komutu oda boşaltılmadan önce gönderilir; başarısız işlem kalıcı kapanış işiyle yeniden denenir. Komutun gönderilmesi dosyanın hazır olduğu anlamına gelmez.

Her kayıt parçası ayrı Daily kayıt kimliği, Viva etkinliği, oda adı/nesli ve sağlayıcı oturum kimliğiyle tutulur. Hazır durum geç başlangıç/hata olayıyla gerilemez. Henüz dosya kimliği oluşmamış kayıt hatası instance kimliğiyle tutulur; başlangıç bilgisi geldiğinde dosyayla birleştirilir. Özel misafirlerin yetkisi genişletilmedi. İlk sürümde kayıt listesini/indirmeyi yalnız etkinlik sahibi kullanır. Hazır kayıt için yetki sunucuda kontrol edilir; yeni süreli Daily erişim bağlantısı üretilir, sağlayıcı çağrısından sonra yetki tekrar doğrulanır. Link DB’ye yazılmaz.

Webhook: `/api/viva/daily-webhook`. HMAC-SHA256, Base64 sır, sabit süreli karşılaştırma ve beş dakikalık zaman penceresi kullanılır. Daily’nin belgelenmiş `timestamp + '.' + JSON.stringify(event)` imzası uygulanır. İlk imzalı test DB/ağ çağrısı olmadan yanıtlanır; bu yol proxy oturum sorgusuna girmez. Gerçek olay önce kalıcı kuyruğa yazılır; yazılamazsa 503 döner. Sonraki işlem mevcut `/api/cron/viva` içinde lease ve yeniden denemeyle yürür. Katılımcı tekrarları tür + sağlayıcı katılımcı oturumu; kayıt tekrarları tür + kayıt/instance kimliğiyle tekilleştirilir. Kişisel ad, userData, share_token, s3key ve indirme linki kuyruğa alınmaz. Eski olay bitmiş etkinliği yeniden açmaz; katılımcı olayları güncel erişim mutabakatını uyandırır, eski ayrılma olayından yeni kişiyi çıkarma kararı üretilmez.

Kaçırılan bildirimler için oda başına beş dakikalık kontrollü kayıt taraması vardır. Her çalışmada en fazla bir sayfa alınır; imleç kalıcıdır. Olağan tarama kapanıştan sonra 48 saate kadar sürer. Sahip “Kayıtları güncelle” ile daha eski etkinliğe de tarama isteyebilir. Ekran DB’deki hazır/hata durumunu gösterir; Daily API’sine tarayıcıdan sürekli polling yapılmaz. FAILED webhook aşağıdaki kurulum komutu tekrar çalıştırılarak yeniden etkinleştirilir; kaçırılan kayıtlar tarama yoluyla toparlanır.

## Kayıt profili

Cloud video kaydı: Daily’nin varsayılan MP4, H.264/AAC, 1080p/30 fps profili. Belgelenmiş varsayılan azami kayıt süresi 10.800 saniye (3 saat), boşta kalma süresi 300 saniyedir; uzun etkinliklerde ayrı kayıt parçaları gerekebilir. 25 Ekim 2026 açık liste fiyatı kayıt dakikası başına $0.01349, ek depolama $0.003/dakikadır; görüşme kullanım ücretinden ayrıdır. Hesap domaini ve token kayıt yetkisi gerçek Daily API’de doğrulandı. Hesabın `max_streaming_instances_per_room` değeri gerçek API’de **2** olarak doğrulandı (oda başına eşzamanlı kayıt/yayın instance sınırı). Hesaba özel indirim veya toplam kullanım/bütçe kotası doğrulanmış sayılmaz; bunlar Daily Billing/Support üzerinden kontrol edilir. Sırf limit görmek için hesap ayarı değiştirilmedi.

[Kayıt profili ve token yetkisi](https://docs.daily.co/docs/guides/features/recording), [süre/instance ayarları](https://docs.daily.co/reference/daily-js/types/daily-streaming-options), [liste fiyatı](https://www.daily.co/pricing/video-sdk/), [webhook imza ve yeniden etkinleştirme](https://docs.daily.co/reference/rest-api/webhooks).

## Kullanıcının çalıştıracağı SQL

1. `viva_asama2_5.sql`: kayıt, olay kuyruğu, tarama ve yalnız sunucuya açık RPC. Son dört kontrol true beklenir.
2. `viva_asama2_5_test.sql`: yedi odaklı kontrol. Yeni sentetik Viva kayıtları kullanır; mevcut kimlikler yalnız okunur, dosya sonunda ROLLBACK olur. Daily/e-posta çağrısı yoktur.

Ajan hiçbir DB’ye bağlanmadı ve SQL çalıştırmadı. Kullanıcı kurulumdaki dört kontrolün true ve yedi SQL testinin başarılı olduğunu paylaştı; kurulum bu sonuçlarla doğrulandı.

## Deployment sonrası etkinleştirme

1. `.env.local` içine oluşturulan **DAILY_WEBHOOK_SECRET** değerini Vercel’e aynı adla **Secret** olarak ekle. Anahtarın değerini sohbete koyma. DAILY_API_KEY ve DAILY_DOMAIN önceki adımlardan mevcut. Yeni sır git tarafından dışlanır; belgeye/çıktıya yazılmaz.
2. Bu kodu deploy ettikten sonra gerçek üretim HTTPS adresiyle çalıştır:

```sh
node --env-file=.env.local scripts/viva-daily-webhook.mjs https://URETIM_ADRESI/api/viva/daily-webhook
```

Komut kendi HMAC sırrını ilk istekten önce Daily’ye verir; endpoint imzalı kurulum testini doğrular. Aynı URL mevcutsa günceller/FAILED durumundan ACTIVE yapar; diğer webhookları değiştirmez. Çıktıda ACTIVE beklenir. Üretim adresi varsayılmadığı için komut henüz çalıştırılmadı.

3. 2.4’te pasif kurulan `cogniti_viva_yasam` cronunu, mevcut `viva_asama2_4_cron.sql` sonundaki ayrı etkinleştirme sorgusuyla aç. Bu cron hem yaşam döngüsünü hem kayıt olaylarını işler. Etkinleştirme yapılmadan kuyruk tüketiliyor sayılmaz.

Gerçek görüşmede kayıt başlat/durdur, ikinci parça, dosyanın açılması ve mobil görünüm kullanıcı tarafından kontrol edilecek. Bu kontroller yapılmış sayılmadı; mevcut kullanıcının görsel test sorumluluğu korunur.

## Üçüncü aşamaya devir

Devir alanları: `etkinlik_id`, `nesil`, `oda_adi`, `daily_id`, `instance_id`, `oturum_id`, `baslangic`, `sure`, `durum`, `hata_kodu`. Yalnız `hazir` dosya aktarım adayıdır. Aktarıcı kimliklerle yetkili yeni Daily linkini alır; hazır kayıt Cogniti arşivine aktarılmış kabul edilmez. Mevcut Bunny video GUID standardı, asenkron medya hattı ve transkripsiyon altyapısı üçüncü aşamada bağlanır. Bu adım yeni arşiv, transkripsiyon, soru veya analiz sistemi kurmaz.

## Doğrulama

- Altı odaklı teknik kontrol başarılı: HMAC/zaman, veri azaltma/tekrar, ilk testte DB çağrılmaması ve kalıcı yazı hatasında 503, oda/oturum ve süreli link, kapanış sırası/hata yeniden denemesi, rollere göre kayıt yetkisi.
- Tip kontrolü başarılı; lint 0 hata/3 şema snapshot uyarısı. Yeni RPC’ler DB şeması çekilerek doğrulanmadı.
- Gerçek Daily API sonucu ayrı JSON’da tutulur. Gerçek medya/kayıt dosyası üretilmedi; yalnız geçici özel teknik odalar kullanılıp silindi.
- Kullanıcı SQL doğrulaması tamamlandı: 4/4 kurulum, 7/7 test başarılı. Gerçek dosya/cihaz kabulü, production webhook ve cron etkinliği deployment sonrası bekleyenlerdir. Commit/push yapılmadı.

[Kullanıcı SQL sonuç kaydı](./VIVA_ASAMA_2_5_KULLANICI_SQL_SONUCU.md).
