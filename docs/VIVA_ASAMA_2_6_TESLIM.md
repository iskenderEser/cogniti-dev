# Viva — 2.6 Teknik teslim ve canlı kabul

25 Ekim 2026. **İkinci aşamanın geliştirme ve hedefli teknik doğrulaması hazır.** İkinci aşamanın canlı kabulü henüz yapılmadı. Commit/push/deployment, üretim webhook/cron etkinleştirmesi ve kullanıcı görüşme/cihaz kabulü ayrı takip edilir. Üçüncü aşama başlatılmadı.

## Bu adımda yapılanlar

- Sunucunun başlangıç bildirimi 401/403 gibi kalıcı bir ret aldığında sonsuz tekrar kesildi; kullanıcıya etkinliği yenilemesi söylenir. Geçici 202/429/5xx ve ağ hataları yeniden denenebilir.
- 2.5 ile değişen sunucu kayıt yetkisi ve SDK dinleyici sayısına ait iki eski test beklentisi güncellendi.
- İsteğe bağlı Cogniti örneği Daily’nin hazır ana entegrasyon alanına bağlandı. Sunucu oda adresinin sonuna `?onizleme=1` ekleyip katıldığında Daily menüsünde **Cogniti önizleme** seçeneğini görebilir. Normal kullanımda açılmaz; katılımcı/izleyiciye eklenmez ve diğer kişilere otomatik paylaşılmaz.
- Örnek, gerçek içerik/soru/puan üretmez; aynı Cogniti etkinliğine erişimin çerçeve içinde doğrulanıp doğrulanamadığını açıkça gösterir. Token, davet bağlantısı veya kullanıcı bilgisi entegrasyon URL’sine konmaz. Dar CSP yalnız Cogniti ve `cogniti-viva.daily.co` atalarını kabul eder. Çerez/CSP/tam ekranın gerçek tarayıcı sonucu kullanıcıda; başarı varsayılmadı.

## Doğrulama kanıtları

Bu adımda **10 hedefli teknik kontrol başarılı**: dört katılım/rol/oda/sürüm kontrolü; üç SDK/temizlik/önizleme/başlangıç reddi kontrolü; üç kayıt indirme yetkisi ve hazır dosya yeniden deneme kontrolü. Önceki 88 test yeniden çalıştırılmadı.

`npm run typecheck:build` başarılı. Değişen üretim dosyalarında lint **0 hata, 0 uyarı**. Viva, davet, webhook, cron ve önizleme yollarının Next.js **compile** derlemesi başarılı (4,3 saniye); prerender/generate çalıştırılmadı. Bu seçili derleme tam uygulamanın production kabulü sayılmaz. `.env.local` Git tarafından dışlanıyor; gizli değerler çıktıya alınmadı.

Önceki kanıtlar korunur: 2.1’de 18, 2.2’de 24, 2.4’te 9, 2.5’te 7 kullanıcı SQL testi başarılı. Daily’nin oda, token/presence, çevrimdışı ban ve kayıt yetkisi API kontrolleri ilgili adımların ayrı JSON kayıtlarında bulunur. API token doğrulaması, gerçek görüşme veya kayıt dosyasının oynatılması yerine geçmez. Ajan DB’ye bağlanmadı, SQL çalıştırmadı ve tarayıcı/cihaz denemesi yapmadı.

## Push/deployment sonrasında

1. Kullanıcı onayıyla commit/push ve Vercel deployment yapılır. Bu teslim otomatik push yetkisi değildir.
2. `.env.local` içindeki **DAILY_WEBHOOK_SECRET**, Vercel Production ortamına aynı adla **Secret** olarak eklenir; değeri sohbete yazılmaz. DAILY_DOMAIN ve DAILY_API_KEY önceki ayarlardır. Preview ortamında da görüşme denenecekse aynı değişkenler o ortam için ayrıca tanımlanır.
3. Yeni kod ve sır aynı deployment’ta hazırken, gerçek üretim HTTPS adresiyle webhook kaydı yapılır:

```sh
node --env-file=.env.local scripts/viva-daily-webhook.mjs https://URETIM_ADRESI/api/viva/daily-webhook
```

Çıktıda **ACTIVE** beklenir. Gerçek adres henüz varsayılmadı ve komut çalıştırılmadı. İmzalı ilk test başarısızsa deployment adresi, Vercel erişim koruması ve sır eşitliği kontrol edilir; imza denetimi kapatılmaz. FAILED durumunda aynı komut aynı URL’yi güncelleyip yeniden etkinleştirir.

4. Kullanıcı, önceden pasif kurduğu cron için aşağıdaki sorguyu çalıştırır:

```sql
SELECT cron.alter_job(job_id := jobid, active := true)
FROM cron.job WHERE jobname = 'cogniti_viva_yasam';

SELECT count(*) = 1 AS cron_tek_kayit, coalesce(bool_or(active), false) AS cron_aktif
FROM cron.job WHERE jobname = 'cogniti_viva_yasam';
```

İki sonuç **true** beklenir. Mevcut Vault base URL’sinin bu production adresine, Vault cron sırrının Vercel CRON_SECRET değerine karşılık geldiği kullanıcı tarafından kontrol edilir; sırlar görüntüye/sohbete konmaz. Cron hem yaşam döngüsünü hem kayıt kuyruğunu işler. İlk işlemden sonra Vercel loglarında `/api/cron/viva` için başarılı yanıt kontrol edilir. SQL’de active=true olması tek başına HTTP işleminin başarılı olduğunu kanıtlamaz.

5. Aşağıdaki kısa canlı kabul kullanıcıyla yapılır. Webhook/cron açılmadan otomatik kayıt durumlarının çalıştığı varsayılmaz.

## Kullanıcının kısa canlı kabulü

1. Yetkili sunucu etkinliği oluşturur; diğer üye sunucudan önce gelince bekler. Sunucu girince üye katılır. Özel davetli yalnız izler; mikrofon/kamera/yönetim açamaz. Gerçek e-posta/çerez kabulü **REDBOOK TB-03** kapsamındadır, önceki aşamaları yeniden açmaz.
2. İki oturumla ses/görüntü, ekran paylaşımını izleme, sohbet ve el kaldırma denenir. Telefonda paylaşım başlatma desteği, paylaşımı izlemekten ayrıdır. Fiziksel tablet yok; tablet test edilmiş sayılmaz.
3. Sunucu birinci kaydı başlatır/durdurur; yeniden başlatarak ikinci parçayı üretir. Görüşme sürerken kayıt göstergesi, bitince iki ayrı hazır parça ve dosyanın gerçekten açılması kontrol edilir. Kayıt listesi/indirme ilk sürümde yalnız etkinlik sahibindedir.
4. Sayfa yenileme, ağ kopması ve sunucunun kendi ayrılması denenir; bunlar etkinliği kalıcı kapatmamalıdır. Başka kişinin daveti/katılımı iptal edildiğinde açık oturumun çıkarıldığı ve eski tokenla dönülemediği ayrıca gözlenir.
5. Sunucu **Herkes için bitir** der; tüm kişiler çıkar, etkinlik yeniden açılamaz. Son kayıt hazır olunca listede görünür. Gecikmiş bildirim görüşmeyi yeniden başlatmamalıdır.
6. Sunucu `?onizleme=1` ile örnek entegrasyonu açar. Cogniti oturum durumu ve Daily tam ekranında örneğin açılıp kapanması gözlenir. Üçüncü taraf çerez kısıtı varsa örnek açık bir doğrulama hatası göstermelidir; bu sonuç üçüncü aşamadaki içerik erişim kararına devredilir.

## İki bağlantılı SQL yarış kontrolü

2.6.09 için `viva_asama2_6_yaris_A.sql` ve `viva_asama2_6_yaris_B.sql` hazırlandı; **çalıştırılmadı**. Tek SQL editöründe peş peşe çalıştırmak eş zamanlılık testi değildir.

Cron pasifken iki ayrı SQL editörü/bağlantısı açılır. B hazır tutulur, A başlatılır; A’nın 10 saniyelik kilit aralığında B çalıştırılır. B çıktısında `kilit_beklemesi_gozlendi`, `tek_bitirme_sonucu`, `test_verisi_temizlendi` true beklenir. B geç başlatılırsa ilk alan false olabilir; bu durumda yarış kanıtı oluşmaz. A yalnız belirli etiketli yeni bir sentetik etkinlik oluşturur; B onu temizler. B yarım kalırsa aynı dosya tekrar çalıştırılarak yalnız bu test kaydı temizlenir. Mevcut kullanıcılar yalnız okunur; Daily/HTTP çağrısı yapılmaz. Bu tek kontrol eş zamanlı herkes için bitir işlemlerini sınar; tüm oda/olay yarışlarının doğrulandığı iddia edilmez.

## Üçüncü aşamaya devir

| Alan | Mevcut kaynak ve korunacak sözleşme |
|---|---|
| Görüşme | Daily JS **0.94.0**, Prebuilt; Daily domain `cogniti-viva.daily.co` |
| Kimlikler | Viva `etkinlik_id`; deterministik `oda_adi` + `nesil`; Daily `oturum_id`; her dosya için `daily_id`, varsa `instance_id` ayrı |
| Roller | Sahip → sunucu; yetkili firma/EClub → katılımcı; doğrulanmış etkinlik daveti → medya/yönetim göndermeyen izleyici |
| İçerik | `components/ogrenme-araci/TuketimOynaticisi.tsx`, `FlipPdfOynatici.tsx`, `PodcastOynatici.tsx`, `GorselOynatici.tsx`; mevcut yayın + araç kimliği ve erişim kuralları korunur |
| Soru | BLUEBOOK’taki mevcut atanmış/randomize soru kümesi, doğrulama ve tek cevap sözleşmesi kullanılır. Viva’ya bağlanması henüz yapılmadı; yeni soru motoru kurulmaz |
| Kayıt | `viva_daily_kayitlar`: etkinlik/nesil/oda/oturum/dosya/instance kimlikleri, zaman, süre ve hazır/hata durumu; süreli link kalıcı URL değildir |
| Medya arşivi | Mevcut `app/(panel)/uretim/api/hazir-video/route.ts`, Bunny webhook/mutabakat hattı; video yalnız Bunny GUID olarak tutulur, statik araç yükleme paketine sokulmaz |
| Transkript | `lib/ogrenmeAraci/transkriptKuyrukIsleyici.ts`, `app/api/cron/transkript-kuyruk/route.ts` ve mevcut yönetim API’leri; yeni transkripsiyon sistemi kurulmaz |
| Hata kurtarma | Oda/yaşam döngüsü/olay lease’leri ve aynı cron üzerinden yeniden deneme; hazır kayıt için kontrollü API taraması; FAILED webhook için aynı kurulum komutu |

**Son durum:** Geliştirme ve teknik teslim hazır; yukarıdaki production etkinleştirme, kullanıcı canlı kabulü ve iki bağlantılı SQL sonucu henüz bekliyor. Kullanıcının ikinci aşamayı kapatma kabulü alınmış sayılmadı. Üçüncü aşamaya kendiliğinden geçilmedi.
