# Viva — Daily Ön Araştırması

Tarih: 25 Ekim 2026  
Amaç: İkinci aşamanın detaylı iş planına teknik temel oluşturmak.  
Durum: Resmî Daily belgeleri ve mevcut Viva kaynakları incelendi. Daily hesabı/API anahtarı kullanılmadı; oda açılmadı, görüşme veya kayıt denenmedi. Uygulama kodu ve DB değiştirilmedi.

**Sonuç:** İkinci aşamayı Daily Prebuilt ile kurmak mevcut Viva yapısıyla uyumlu görünüyor. Kamera, mikrofon, cihaz seçimi, ekran paylaşımı ve temel görüşme arayüzünü Daily’den alacağız. Geliştirme Viva kimlik/yetkilerinin Daily’ye aktarılması, oda yaşam döngüsü ve kayıt olaylarının eşleştirilmesi üzerinde olacak. Bu sonuç bir belge araştırmasıdır; canlı entegrasyon kanıtı değildir.

## 1. İş paylaşımı

| İhtiyaç | Daily’nin hazır karşılığı | Viva/Cogniti’de yapılacak bağlantı |
|---|---|---|
| Görüşme ekranı ve medya | Daily Prebuilt; kamera/mikrofon, cihaz ve görüşme araçları | Mevcut oda alanına yerleştirme; giriş/çıkış ve hata durumlarını Cogniti akışına bağlama |
| Ön giriş, sohbet, el kaldırma | Hazır özellikler, oda/token ayarları | Etkinliğe uygun ayarları seçme; mevcut davet kontrolünü koruma |
| Kimin katılabileceği | Özel oda ve kişiye bağlı meeting token | Her girişte mevcut Viva yetkisini sunucuda doğrulama |
| Sunucu ve izleyici | Katılımcı medya/yönetim izinleri | Düzenleyen, firma/EClub katılımcısı ve özel misafir karşılıklarını üretme |
| Kayıt | Daily kayıt üretimi ve olayları | İkinci aşamada başlat/durdur/hazır/hata bilgisini etkinlikle ilişkilendirme |
| Arşiv, transkripsiyon, randomize sorular, cevap analizi | Mevcut Cogniti altyapısı | Üçüncü aşamada canlı oturum çıktısını mevcut yeteneklere bağlama |

Prebuilt’in özelleştirme ve hazır özellikleri için [Daily Prebuilt ayarları](https://docs.daily.co/guides/products/prebuilt/customizing-daily-prebuilt); uygulamaya gömme yöntemi için [createFrame](https://docs.daily.co/reference/daily-js/factory-methods/create-frame).

## 2. Etkinlik ile oda ilişkisi

Daily odaları API’den oluşturulup güncellenebilir. Varsayılan oda herkese açık olduğundan Viva odası açıkça `private` oluşturulmalı. Odanın katılım başlangıcı/bitişi ile içerideki kişilerin çıkarılması ayrı ayarlardır. [Daily Rooms](https://docs.daily.co/reference/rest-api/rooms)

**Önerilen Viva tasarımı — araştırmadan çıkan mühendislik kararı:** Bir etkinlik için aynı oda eşleştirmesi kullanılmalı; her sayfa yenilemede yeni oda açılmamalı. Oda oluşturma isteğinin yanıtı kaybolursa mevcut oda kontrol edilerek toparlanmalı. Viva DB işlemiyle Daily HTTP isteği tek bir transaction değildir; yarım kalan eşleştirme için yeniden deneme/kurtarma adımı planlanmalı. Biten etkinliğin eski tokenlarıyla yeniden açılmasını önlemek için oda adını başka etkinliğe devretmemeli; yeniden açma gerekiyorsa ayrı oda nesli değerlendirilmelidir.

Mevcut kodda `etkinlik_id`, sahiplik, zaman ve durum alanları hazır. Yeni Daily eşleştirme alanları henüz kurulmadı. Gerekli SQL hazırlanırsa **kullanıcı çalıştıracak**; araştırma DB’ye erişim yetkisi vermez.

## 3. Kimlik ve izinler

Daily tokenı oda ve kullanıcı bazlıdır. `room_name` mutlaka belirtilmeli; oda adı bulunmayan token bütün domain odalarına erişim açabilir. Token sunucuda üretilip `join({url, token})` ile aktarılmalı. Token imzalıdır, şifreli değildir; içine gizli bilgi konmamalıdır. [Meeting tokens](https://docs.daily.co/reference/rest-api/meeting-tokens)

Daily’nin `canSend`, `canReceive`, `canAdmin` izinleri katılımcının medya ve yönetim olanaklarını sınırlar; izinler görüşme sırasında da değiştirilebilir. Sadece kamerayı başlangıçta kapalı açmak, kamerayı açma yetkisini kaldırmaz. [Daily izinleri](https://docs.daily.co/docs/daily-js/guides/permissions)

**Viva için önerilen eşleme:**

| Viva kimliği | Daily karşılığı | Plan öncesi netleşecek kısım |
|---|---|---|
| Düzenleyen | Sunucu/yönetici; yetkisi sunucudan doğrulanır | Ayrı eş sunucu ilk sürümde yok; birinci aşama kararı korunur |
| Firma içi / EClub katılımcısı | Yönetici olmayan katılımcı | Kamera/mikrofonu serbest toplantı mı, sunucunun söz verdiği yayın mı? |
| Özel davetli | İlgili etkinliğe bağlı doğrulanmış izleyici; medya gönderme/yönetim yetkisi verilmez | “Yalnız izler” kararının sohbet/el kaldırma kapsamı |

Kişi bilgisi istemcinin gönderdiği rol, e-posta veya `userData` alanından yetki olarak alınmamalı. Daily `user_id` değeri, ilgili Viva kimliği/davetine bağlanan sunucu üretimi opak bir kimlik olabilir. Bu, tasarım önerisidir; uygulamada henüz kurulmadı.

## 4. Davet iptali ve süre bitimi

**Sadece Viva sayfasını kapatmak veya yeni token vermeyi durdurmak açık görüşmeyi sonlandırmaz.** Tokenın `exp` süresiyle `eject_at_token_exp` davranışı ayrı değerlendirilmelidir. Token geçerliyse yeniden girişte kullanılabilir; çok kısa token süresi ile zorunlu çıkarma birlikte seçilirse meşru görüşme de kesilebilir. [Token süreleri](https://docs.daily.co/reference/rest-api/meeting-tokens)

Daily, sunucudan `user_ids` veya oturum kimliğiyle çıkarma ve `ban` seçeneği sunuyor. [Eject API](https://docs.daily.co/reference/rest-api/rooms/session/eject)

**Plana etkisi:** Davet iptali, katılımcı çıkarma, etkinliği bitirme ve kapsam kaybı Daily tarafına da uygulanmalı. Birinci aşamadaki 30 saniyelik sayfa kontrolü tek başına yeterli sayılmamalı. “Kaydı kapat + Daily’den çıkar” işleminin bir tarafı başarısız olursa yeniden deneme gerekir. Eski tokenla yeniden giriş, `ban` kapsamı ve yeniden bağlanma davranışı gerçek hesapla küçük bir denemede doğrulanmalı; bu araştırma anında/süresiz iptal garantisi vermez.

Sunucunun tarayıcıyı kapatması, ağının kopması ve “herkes için bitir” eylemi ayrı durumlar olarak planlanmalıdır. Son kişinin odadan ayrılması otomatik olarak Viva etkinliğinin kalıcı bitişi sayılmamalıdır; bu bir ürün ve yaşam döngüsü önerisidir.

## 5. Kayıt üretimi ve mevcut Cogniti arşivi

Daily bulut, yalnız ses, yerel ve ham parça kayıt seçenekleri sunuyor. Bulut kayıt tarayıcı/cihazdan bağımsız sunucu tarafında üretilir. Kayıt belgelerinde ücretli hesap koşulu ve üç saate kadar kayıt belirtiliyor. Kayıt oluşturma izniyle arayüzde kayıt düğmesini gösterme ayarı ayrı ele alınmalı. [Kayıt rehberi](https://docs.daily.co/docs/guides/features/recording)

`recording.ready-to-download` olayı, kayıt hazır olduğunda `recording_id`, oda ve süre gibi bilgileri getirir; hata ayrıca bildirilebilir. [Kayıt hazır olayı](https://docs.daily.co/reference/rest-api/webhooks/events/recording-ready-to-download)

Daily’nin özel depoya doğrudan yazması için belgelenen yollardan biri Amazon S3’tür; bunun Cogniti’nin mevcut depolama alanına otomatik olarak uyduğu varsayılmayacak. [Özel S3 kayıt deposu](https://docs.daily.co/guides/products/live-streaming-recording/storing-recordings-in-a-custom-s3-bucket)

Kayıt indirme bağlantısı geçici ve imzalıdır; kalıcı arşiv adresi olarak saklanmamalı. Kalıcı kayıt kimliği tutulup gerektiğinde yeni bağlantı alınabilir. [Kayıt erişim bağlantısı](https://docs.daily.co/reference/rest-api/recordings/get-recording-link)

**Aşama sınırı:** İkinci aşamada kayıt üretimini ve durumunu Viva etkinliğiyle eşleştireceğiz. Üçüncü aşamada mevcut Cogniti arşiv/transkripsiyon hattına aktaracağız. Yeni bir arşiv veya transkripsiyon sistemi tasarlamayacağız. Daily kaydının mevcut video/ses hattına hangi girişten bağlanacağı kaynak üzerinden doğrulanmalı; videoların Bunny TUS/GUID standardı ve ses/PDF gibi araçlardan ayrılığı korunmalı. Büyük kayıt dosyasını tarayıcıya veya kısa ömürlü bir HTTP isteğine yükleyen bir aktarım varsayılmamalı.

Mevcut BLUEBOOK ve `lib/ogrenmeAraci/transkriptKuyrukIsleyici.ts` kaynakları transkript altyapısını gösteriyor. Podcast iş kuyruğunun canlı yayına hiçbir uyarlama gerektirmeden bağlanacağı sonucu çıkarılmadı.

## 6. Görüşme ve kayıt olayları

Daily webhookları kart tanımlanmış hesap gerektiriyor. İmzalı doğrulama isteği var; webhook olayları yinelenebilir ve kesin sıra garantisi yoktur. [Webhooks](https://docs.daily.co/reference/rest-api/webhooks)

**Önerilen bağlantı:** Oda/oturum ile Viva etkinliği eşleştirilerek doğrulanmış olaylar işlenecek. Kayıt “hazırlanıyor” ve “hazır” durumları ayrılacak. Olay tekrarları aynı sonucu ikinci kez üretmemeli; gecikmiş bir olay iptal edilmiş etkinliği tekrar canlıya çevirmemeli. HTTP isteği içinde uzun dosya aktarımı yerine mevcut kalıcı iş mekanizmalarına bağlanılacak. Webhook kurulumu sırasında doğrulama isteğinin imzasını kontrol edebilmek için HMAC sırrı önceden hazırlanmalı. Hesap özelliği ve sağlayıcı belgelerindeki güncel kurulum davranışı küçük denemede doğrulanacak.

## 7. Türkçe, tema ve mobil

Daily Prebuilt Türkçeyi `lang: "tr"` ile destekliyor. [Dil desteği](https://docs.daily.co/docs/prebuilt/language)

Prebuilt, Cogniti’nin mevcut oda alanına iframe olarak yerleşebilir; boyutu dış kapsayıcıdan yönetilir. [createFrame](https://docs.daily.co/reference/daily-js/factory-methods/create-frame)

**Deneme planına girecekler:** Türkçe arayüz, mevcut Cogniti temasıyla renk uyumu, masaüstü ekran paylaşımı, telefondan yayını izleme, kamera/mikrofon izni verilmemesi, ağ kesilmesi ve tekrar bağlanma. Mobilde görüşmeye katılmak ile telefondan ekran paylaşımı başlatmak aynı destek iddiası değildir; cihaz/tarayıcıda ayrıca sınanmalı. Tablet bulunmaması, birinci aşamanın kapanışını tekrar açmayacak.

## 8. Üçüncü aşamaya engel olmadan Prebuilt kullanmak

Prebuilt özel entegrasyonları ana alanda veya yan panelde açabiliyor. `controlledBy` ile sunucu kontrolü, `shared` ile başlatma/durdurmayı diğer katılımcılara yansıtma olanakları var. [setCustomIntegrations](https://docs.daily.co/reference/daily-js/instance-methods/set-custom-integrations)

**Sınır:** Bir içeriğin herkeste açılması PDF sayfası, video saniyesi, soru süresi ve cevapların otomatik eş zamanlandığı anlamına gelmez. `sendAppMessage` ile anlık mesaj gönderilebilir, fakat mesajlar saklanmaz ve geç katılanlara geçmiş mesaj teslim edilmez. `setMeetingSessionData` güncel rehberde yalnız custom call object modunda kullanılabilir; Prebuilt için temel kabul edilmemelidir. [Mesajlar ve ortak durum](https://docs.daily.co/docs/daily-js/guides/custom-messages)

**Plana etkisi:** İkinci aşamada Prebuilt korunmalı. Üçüncü aşama için mevcut Cogniti oynatıcı/soru ekranlarının ana alan/yan panelde çalışabileceği küçük bir uygunluk denemesi yeterlidir. İçerik/soru durumu ve cevapların yetkili, kalıcı kaydı Cogniti’de kalmalı; yeni bir soru motoru geliştirilmemeli. İç içe iframe’de oturum/çerez ve CSP davranışı da bağlantı sırasında doğrulanmalıdır.

## 9. Hesap ve maliyet

25 Ekim 2026’da kontrol edilen liste: aylık ilk 10.000 katılımcı-dakika ücretsiz; sonraki ilk video/ses dilimi 0,004 USD/katılımcı-dakika. Bulut video kaydı 0,01349 USD/kayıt-dakika; sayfada ayrıca 0,003 USD/dakika depolama bedeli listeleniyor. Kayıt katılımcı sayısıyla çarpılmıyor. Ücretsiz kota sonrası video kullanımını otomatik durduran sert harcama sınırı belirtilmiyor. [Daily fiyatlandırması](https://www.daily.co/pricing/video-sdk/)

**Plana etkisi:** Cogniti’nin arşivi hazır olsa da Daily’nin kayıt üretimi ve geçici depolama maliyeti ayrı hesaba katılmalı. Hesabın kayıt/webhook erişimi, güncel fiyatı ve limitleri kullanıcı hesabında doğrulanmadan bütçe veya sınırsız kapasite varsayılmamalı. Bu araştırmada hesap açılmadı, kart girilmedi veya ücretli işlem yapılmadı.

## 10. Detaylı plandan önce küçük denemede doğrulanacaklar

| Deneme | Kanıt / beklenen çıktı |
|---|---|
| Özel oda + sunucu + üye/izleyici | Doğru kişiler girer; izleyici medya/yönetim izni alamaz |
| İptal ve eski token | Açık katılımcı çıkarılır; eski tokenla girişin davranışı belgelenir |
| Kopma ve bitirme | Tek kişinin ayrılması ile herkes için bitiş ayrılır |
| Kayıt | Yalnız yetkili başlatır; hazır/hata olayı doğru etkinliğe bağlanır |
| Olay tekrarları | Aynı veya gecikmiş olay kayıt/durumu çoğaltmaz ya da geri açmaz |
| Cogniti entegrasyon alanı | Mevcut örnek içerik panelde açılır; gerçek soru/analiz entegrasyonu yapılmaz |
| Masaüstü + mevcut telefon | Ses/görüntü, ekran paylaşımını izleme, izin reddi ve yeniden bağlanma gözlenir |

Bu denemeler henüz yapılmadı. Ücretli hesap özellikleri veya gerçek DB işlemi gerekiyorsa gerekli hesap/SQL adımı kullanıcıyla yürütülecek. Araştırma sonunda yeniden Zoom/Meet karşılaştırması veya farklı bir canlı yayın altyapısına geçiş işi açılmadı.

## 11. İkinci aşamanın iş planına taşınacak sıra

Öneri: hesap/özellikleri doğrula → oda ve kimlik eşleştirmesi → yetkili katılım → Prebuilt’i yerleştirme → iptal/bitirme/yeniden bağlanma → kayıt ve webhooklar → gerçek görüşme kabulü. Bu sıra mevcut ana planın 7–12. adımlarını ayrıntılandırır. Canlı kayıt denemesi yapılmadan “görüşme çalışıyor”, arşive aktarım yapılmadan “Cogniti arşivine bağlandı” denmeyecek.

**25 Ekim kullanıcı yanıtları:** Teams/Zoom/Meet benzeri tanıdık toplantı deneyimi kullanılacak; kayıt sunucu tarafından elle başlatılıp durdurulacak. Üye kamera/mikrofonunun kendisinde olması bu yönün uygulama karşılığıdır. Sunucudan önce bekleme ilk plan varsayımıdır; bu ürünlerde davranış hesap/toplantı ayarına göre değişir. Özel davetlinin etkinlikle sınırlı izleyici olması korunur. Ayrıntı: [2. aşama checklisti](./VIVA_ASAMA_2_DETAYLI_CHECKLIST.md).

## Plan öncesi ek bulgu — bekleme ve token

Daily’nin [bekleme rehberi](https://docs.daily.co/docs/daily-js/guides/waiting-room), token taşıyan kişinin lobiyi atladığını belirtiyor; [token oluşturma şeması](https://docs.daily.co/reference/rest-api/meeting-tokens/create-meeting-token) ayrıca `knocking` alanını listeliyor. Sunucuyu bekleme ve Viva’nın yetkili tokenı birlikte canlı denemede doğrulanacak. Hazır davranış yeterli olmazsa ilk katılım tokenını sunucunun doğrulanmış başlangıcına kadar vermeyen en küçük sunucu bağlantısı değerlendirilecek; hazır görüşme/cihaz araçları yeniden geliştirilmeyecek. Bu deneme henüz yapılmadı.
