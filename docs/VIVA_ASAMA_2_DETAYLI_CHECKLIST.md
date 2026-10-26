# Viva — 2. Aşama Detaylı Checklist ve İş Planı

**Daily’yi Viva’ya bağlamak**  
Tarih: 25 Ekim 2026  
Kapsam: Ana planın 7–12. adımları.  
Durum: **2.1–2.5 teknik teslimleri ve kullanıcı SQL doğrulamaları tamamlandı; 2.6 geliştirme ve hedefli teknik teslimi hazır.** Bu adımda 10 hedefli kontrol, tip/lint ve seçili Next compile derlemesi başarılı. Production webhook/cron etkinleştirmesi, iki bağlantılı SQL sonucu ve kullanıcı canlı görüşme/cihaz kabulü henüz bekliyor. İkinci aşama kullanıcı kabulüyle kapatılacak; üçüncü aşama başlamadı.

[Ana proje planı](./VIVA_GELISTIRME_PROJE_ADIMLARI.md) · [Daily ön araştırması](./VIVA_DAILY_ON_ARASTIRMA.md) · [Birinci aşamanın kapanışı](./VIVA_ASAMA_1_DETAYLI_CHECKLIST.md)

## Hedef

Cogniti’de oluşturulmuş Viva etkinliğinde sunucu ve yetkili katılımcılar Daily Prebuilt ile canlı görüşebilecek. Sunucu ekran paylaşımını ve katılımcıları yönetebilecek; kaydı istediğinde başlatıp durdurabilecek. Etkinlik/davet kapanışı gerçek görüşmeye uygulanacak. Hazır kaydın kimliği ve durumu Viva etkinliğine bağlanacak.

İçeriklerin birlikte oynatılması, randomize sorular, cevap analizi, Cogniti arşivine aktarım ve mevcut transkripsiyon hattının bağlanması üçüncü aşamada kalır. Görüşme araçları Daily’den alınır.

## Kullanıcı kararları ve bunların plana karşılığı

| Konu | Karar / plan karşılığı | Statü |
|---|---|---|
| Kullanım alışkanlığı | Teams/Zoom/Meet benzeri tanıdık toplantı deneyimi; yeni bir temel görüşme iş akışı icat edilmeyecek | Kullanıcı yönü |
| Normal üye | Firma içi/EClub üyesi kendi kamera/mikrofonunu yönetir; sunucu hazır yönetim yetkileriyle müdahale edebilir | Kullanıcı yönünün uygulama karşılığı |
| Ekran paylaşımı | Daily’nin hazır paylaşımı ve sunucu izinleri kullanılır; toplantı katılımcısının paylaşımı desteklenen yetkilerle yönetilir | Uygulama karşılığı; bütün paylaşımı sadece sunucuya kilitleyen yeni bir ürün kararı alınmadı |
| Sunucudan önce giriş | İlk plan varsayılanı: katılımcı sunucuyu bekler; hazır Daily akışı tercih edilir | Mühendislik varsayımı; aşağıdaki denemeyle doğrulanacak |
| Kayıt | Sunucu istediğinde elle başlatır ve durdurur; otomatik kayıt açılmaz | Kullanıcının açık kararı |
| Özel davetli | E-posta doğrulaması korunur; yalnız ilgili etkinliğin izleyicisi, kalıcı üyelik yok | Önceki kullanıcı kararı korunur |
| Oluşturma yetkisi | Tüm iç roller kendi organizasyon kapsamında etkinlik açabilir | Birinci aşama kararı korunur |
| E-posta teslimatı | Gerçek teslimat/çerez akışının kabulü TB-03 teknik borcunda | Kullanıcı kararı; kapanış engeli yapılmaz |
| Cihaz | Canlı telefon denemesi push sonrasında; elde fiziksel tablet yok | Kullanıcı kararı; tablet yokluğu önceki aşamayı yeniden açmaz |

**Bekleme davranışı neden varsayım olarak yazıldı?** Teams’te lobi kurum/toplantı ayarlarına, Zoom’da sunucudan önce giriş ilgili ayarlara bağlıdır; bu ürünler için tek bir ortak varsayılan yoktur. Viva’da sunucuyu bekleme, tanıdık davranışlar içinden seçilen başlangıç önerisidir. [Teams lobi ayarları](https://support.microsoft.com/en-us/teams/meetings/using-the-lobby-in-microsoft-teams-meetings), [Zoom sunucudan önce giriş](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0058759).

Daily’nin bekleme rehberi geçerli tokenın lobiyi atladığını belirtirken token oluşturma şeması `knocking` alanını da listeliyor. Bu iki ayarın gerçek hesap/SDK davranışı ilk denemede doğrulanacak. Sunucu beklenirken katılım tokenı vermemek gerekirse yalnız eksik Viva bağlantısı yapılacak; yeni kamera testi, kabul listesi veya görüşme denetimleri geliştirilmeyecek. [Daily bekleme rehberi](https://docs.daily.co/docs/daily-js/guides/waiting-room), [Token oluşturma](https://docs.daily.co/reference/rest-api/meeting-tokens/create-meeting-token).

## İş paylaşımı ve sınırlar

| Daily’den kullanılacak | Viva’da kurulacak | Üçüncü aşamaya kalacak |
|---|---|---|
| Kamera/mikrofon, cihaz seçimi, ön giriş, ekran paylaşımı, sohbet, el kaldırma, katılımcı yönetimi | Mevcut yetkiden oda/token üretimi ve rol eşleştirmesi | Cogniti içerik oynatıcıları ve ortak sunum durumu |
| Görüşme ve kayıt motoru | Başlat/ayrıl/bitir/iptal, erişim kaybını Daily’ye uygulama | Randomize sorular, cevap kaydı/analizi ve raporlar |
| Hazır arayüz, Türkçe ve tema ayarları | Mevcut oda kapsayıcısı, Cogniti’ye dönüş ve hata akışı | Kaydın mevcut Cogniti medya arşivine ve transkripsiyonuna aktarımı |
| Sağlayıcı olayları ve kayıt erişimi | Olayları etkinlik/oturumla eşleştirme, güvenilir işleme, kayıt durumunu gösterme | Yeni bir kayıt arşivi veya soru altyapısı kurulmayacak |

**Yetki sınırı:** Ajan DB’ye erişmez ve SQL çalıştırmaz. Gereken migration/test SQL’i kullanıcıya verilir; başarı kullanıcı çıktısıyla doğrulanır. Bu belge API anahtarı ekleme, ücretli hesap işlemi, deploy veya push yapıldığı anlamına gelmez.

## Uygulama sırası

2.0 uygunluk → 2.1 oda/veri → 2.2 katılım/izin → 2.3 Prebuilt → 2.4 yaşam döngüsü → 2.5 kayıt/olaylar → 2.6 kabul/devir.
İlk çalışan teslim: sunucu ve normal üye aynı Viva etkinliğinde ses/görüntüyle buluşur. Ardından iptal/bitirme, en son kayıt ve olay bağlantısı tamamlanır. Kayıt için gereken minimum olay altyapısı ilgili adımla birlikte kurulabilir.

## 2.0. Başlangıç: hesap ve küçük uygunluk denemesi

- [ ] **2.0.01** Daily hesabı/domaini ile test ortamını kullanıcıyla belirle; kayıt ve webhook özelliklerinin hesapta kullanılabildiğini doğrula. Hesap açma, kart veya ücretli kullanım bu planın hazırlanmasıyla yapılmış sayılmaz.
- [x] **2.0.02** API anahtarı ve webhook sırrını yalnız sunucu ortamında kullanacak yapılandırmayı belirle; tarayıcıya açık değişkenlere veya belgelere gizli değer yazma. Yerel ve Vercel ortamlarını ayrı kaydet.
- [ ] **2.0.03** Özel odada bir sunucu ve bir yönetici olmayan katılımcıyla Prebuilt uygunluğunu dene; seçilen SDK sürümünü ve kullanılan ayarları kaydet.
- [ ] **2.0.04** Token taşıyan katılımcının sunucudan önce girişini dene. Daily bekleme/token ayarlarının birlikte çalışmasını doğrula; gerekirse ilk katılımcı tokenını sunucunun doğrulanmış başlangıcına kadar vermeyen en küçük Viva bağlantısını seç. Kamera testi veya bekleme odası arayüzünü yeniden geliştirme.
- [ ] **2.0.05** Sunucuya özel elle kayıt başlat/durdur ve kayıt hazır/hata olaylarını test hesabında dene; eski tokenla çıkarma/yeniden giriş davranışını da doğrula. Belgelerdeki ayarların seçilen SDK ve gerçek hesapta kabulünü kaydet.
- [x] **2.0.06** Deneme bulgularını kaynaklarıyla iş planına işle; desteklenmeyen hazır özellik varsa gereken küçük bağlantıyı açıkça yaz. Doğrulanmadan özel bir görüşme arayüzüne geçme.

**Bu bölümün teslimi:** Seçilen SDK/hesapla özel oda, roller, bekleme ve elle kayıt davranışının deneme kaydı. Henüz doğrulanmayan özellik açıkça işaretlenir.

## 2.1. Ana plan 7: Viva etkinliği ile Daily odasını eşleştirmek

- [x] **2.1.01** Birinci aşamadaki etkinlik kimliği, sahiplik, firma kapsamı, sürüm ve durum sözleşmesini başlangıç kaynağı olarak al; mevcut katılımcı/davet modelini yeniden kurma.
- [x] **2.1.02** Etkinlik–Daily oda adı/kimliği, oda nesli, sağlayıcı oturum kimliği ve eşleştirme durumunun veri sözleşmesini yaz. Bunlar yeni ihtiyaçlardır; mevcut DB kolonu varsayma.
- [x] **2.1.03** Kayıt kimlikleri/durumları, işlenmiş webhooklar ve başarısız sağlayıcı işlemleri için gereken en az kalıcı veriyi belirle; mevcut kuyruk/iş mekanizmalarının uygunluğunu kontrol et.
- [x] **2.1.04** Gereken migration ve RPC değişikliklerini doğrulanmış şemaya göre hazırla. SQL’i kullanıcı çalıştıracak; kurulum sonucunu kullanıcı çıktısıyla doğrula. Ajan DB’ye girmeyecek veya SQL çalıştırmayacak.
- [x] **2.1.05** Oda oluşturma/güncelleme isteklerini sunucu katmanında topla; günlüklerde ve hata mesajlarında anahtar, token veya özel davet bağlantısı açığa çıkarma.
- [x] **2.1.06** Viva odalarını açıkça private oluştur; başlangıç/bitiş, hazır görüşme özellikleri ve rol izinlerini ortak ayar kaynağından üret. Varsayılan public oda ayarına güvenme.
- [x] **2.1.07** Aynı etkinliğin tekrar açılması veya iki eş zamanlı başlatma isteğinde aynı geçerli oda eşleştirmesini kullan; her yenilemede oda üretme.
- [x] **2.1.08** Daily oda oluşturduktan sonra yanıt kaybı veya Viva kaydı başarısızlığında mevcut odayı bulma, eşleştirmeyi tamamlama ve yeniden deneme davranışını kur. DB ile Daily HTTP işlemini tek transaction sayma.
- [x] **2.1.09** Planlanmış etkinlik yeniden tarihlendiğinde oda zamanını ve yeni katılım bilgilerini uyumlu güncelle; daha önce verilmiş tokenların süresini geriye dönük değişmiş varsayma.
- [x] **2.1.10** Bitmiş/iptal edilmiş etkinliğin eski oda ve tokenlarla tekrar açılmasını önle. Silinen oda adının yeniden kullanımında eski token riskini değerlendir; gerekirse yeni oda nesli kullan.

**Bu bölümün teslimi:** Tekrar açıldığında aynı doğru odaya bağlanan; yarım işlemlerden toparlanabilen Viva–Daily eşleştirmesi.

## 2.2. Ana plan 8: kimliği ve yetkiyi Daily katılımına çevirmek

- [x] **2.2.01** Üye ve misafir için sunucu katılım işlemlerini mevcut Viva erişim fonksiyonlarına bağla; firma, katılımcılık, düzenleyen aktifliği ve etkinlik durumunu her yeni girişte güncel doğrula.
- [x] **2.2.02** Misafir girişinde mevcut etkinliğe özel doğrulanmış oturumu kullan; yalnız davet bağlantısı açılmış olması Daily tokenı almak için yeterli olmasın. Kalıcı Cogniti/EClub hesabı oluşturma.
- [x] **2.2.03** Düzenleyen kimliğini sunucu yetkisine çevir; yönetim, katılımcı kabul/çıkarma, paylaşım yönetimi ve kayıt haklarının gerçek Daily karşılıklarını uygula. Diğer firma yöneticileri kendiliğinden bu etkinliğin sunucusu olmasın.
- [x] **2.2.04** Firma içi/EClub üyelerini yönetici olmayan toplantı katılımcısı yap: kendi kamera/mikrofonunu yönetebilsin. Ekran paylaşımı ve sunucu sınırlamalarını Daily’nin hazır izinleriyle bağla; konuşmak için ayrı bir Cogniti onay ekranı geliştirme.
- [x] **2.2.05** Özel davetliye etkinlikle sınırlı izleme/dinleme yetkisi ver; kamera/mikrofon/ekran gönderimi, yönetim ve kayıt başlatma yetkisi verme. Düğme gizlemekle yetinme; sağlayıcı izinlerini test et.
- [x] **2.2.06** Daily kullanıcı kimliğini sunucuda Viva üyesi veya özel davetine bağla; istemcinin gönderdiği rol, kişi adı veya userData alanını yetki kaynağı olarak kullanma.
- [x] **2.2.07** Tokenı yalnız ilgili odaya ve belirlenen zamana bağla; exp/nbf ve içerideki kişiyi süre sonunda çıkarma davranışını birlikte tasarla. Çok kısa süreyle meşru görüşmeyi yanlışlıkla kesme.
- [x] **2.2.08** Katılım bilgisini yetkili isteğe no-store yanıtıyla ver; tokenı join çağrısına aktar. Tokenı URL, kalıcı tarayıcı kaydı veya katılımcı listesine yerleştirme.
- [x] **2.2.09** Sunucuyu bekleme davranışını 2.0.04 sonucuna göre uygula. Yetkisiz kişinin Daily bekleme alanından sunucu onayıyla Viva kapsamını atlamasını da önle.
- [x] **2.2.10** Katılımcı çıkarma, davet iptali/yenileme ve erişim süresi bitiminde yeni katılımı reddet; açık Daily oturumuna uygulanacak çıkarma/engel işlemini yaşam döngüsü bölümüne bağla.

**Bu bölümün teslimi:** Üye ve misafirin mevcut Cogniti/Viva yetkisiyle sınırlı Daily katılımı. Token ve sağlayıcı izinleri gerçek sonucu belirler.

## 2.3. Ana plan 9: Daily Prebuilt’i mevcut oda alanına yerleştirmek

- [x] **2.3.01** Uyumlu daily-js sürümünü seçip bağımlılık sürümünü sabitle; tarayıcıya ihtiyaç duyan kodu yalnız istemci oda bileşeninde yükle.
- [x] **2.3.02** Mevcut VivaOdaAlani yerini bir Prebuilt kapsayıcısıyla değiştir; üye ve özel misafir oda ekranlarında aynı görüşme bileşenini kullan.
- [x] **2.3.03** Kapsayıcı bağlandığında tek bir createFrame örneği oluştur; oda, rol ve geçerli katılım yanıtıyla join/load akışını kur. React tekrar bağlanmaları ikinci oda/medya örneği bırakmasın.
- [x] **2.3.04** Sayfadan çıkış veya bileşen kaldırılmasında Daily olay dinleyicilerini temizle ve leave/destroy işlemlerini uygula; geri dönüşte açık mikrofon veya eski iframe bırakma.
- [x] **2.3.05** Kamera, mikrofon, cihaz seçimi, ekran paylaşımı, katılımcılar, sohbet ve el kaldırmayı Daily’den kullan. Bu araçların ikinci bir Cogniti sürümünü yazma.
- [x] **2.3.06** Katılmadan önceki cihaz kontrolü ve bekleme deneyiminde Daily’nin hazır ekranlarını kullan; mevcut Viva erişim hatalarını kendi ortak hata bileşeninde göster.
- [x] **2.3.07** Türkçe arayüzü ve desteklenen tema ayarlarını Cogniti’nin mevcut görünümüne bağla; iframe içini CSS/DOM müdahalesiyle yeniden tasarlama.
- [x] **2.3.08** Mobilde kullanılabilir görüşme yüksekliği, tam ekran, ekran paylaşımını izleme ve çıkış/dönüş akışını düzenle; desteklenmeyen cihaz/tarayıcı için anlaşılır sonuç ver. Telefonda paylaşımı izlemekle paylaşımı başlatmayı ayrı doğrula.
- [x] **2.3.09** Cogniti’ye dönüşü, Daily’nin hazır ayrılma akışıyla birleştir. Kendi ayrılma ve herkes için bitirme eylemleri görsel olarak ayırt edilsin.

**Bu bölümün teslimi:** Cogniti oda sayfasının içinde çalışan, Türkçe Daily Prebuilt ve temiz giriş/çıkış davranışı.

## 2.4. Ana plan 10: görüşmenin başlaması, sürmesi ve bitmesi

- [x] **2.4.01** Düzenleyenin başlatma isteğini mevcut sahiplik/sürüm kontrolünden geçir; etkinliğin gerçek görüşme başlamadan canlı sayılmasını önle.
- [x] **2.4.02** Sunucunun gerçekten katıldığını doğrulanmış Daily oturum/presence olayıyla eşleştir; istemciden gelen tek bir başladı bildirimiyle etkinliğin canlı durumunu kesinleştirme.
- [x] **2.4.03** planlandi → canli ve canli → sona_erdi geçişlerini, iptal durumunu ve bunlara izin veren aktörü veri sözleşmesine ekle; geçersiz/geriye dönen geçişleri reddet.
- [x] **2.4.04** Sunucu gelmeden gelen üyeleri belirlenen bekleme akışında tut; sunucu geldiğinde kabulü ve reddi Daily yetkileriyle uygula.
- [x] **2.4.05** Kişinin görüşmeden ayrılmasını, sunucunun herkesi çıkarmasını ve ağ kopmasını ayrı ele al. Sunucunun bağlantısı koptu diye etkinliği otomatik kalıcı kapatma.
- [x] **2.4.06** Yeniden bağlanma ve sayfa yenilemede aynı etkinliğe güncel yetkiyle dön; geçersizleşen davet veya bitmiş etkinlik için eski tokenı yeniden kullanma.
- [x] **2.4.07** Herkes için bitir eylemini yalnız sunucuda aç; sunucuda doğrula, etkinliği kapat, varsa kaydı durdur ve Daily odasındaki katılımı sonlandır. Kapanışın bir parçası başarısızsa açık hata/yeniden deneme kaydı tut.
- [x] **2.4.08** Davet iptali, listeden çıkarma veya geçerli kapsamın kaybını açık Daily oturumuna server-side çıkarma/ban ile uygula; yalnız 30 saniyelik sayfa kontrolüne dayanma. Güncel rol/kapsam değişimini algılamak için mevcut olay veya sunucu mutabakat noktasını belirle.
- [ ] **2.4.09** Planlanan bitişte etkinlik kapanışını tarayıcı açık olmasına bağımlı bırakma. Sağlayıcı oda/token süre ayarlarıyla mevcut sunucu zamanlayıcı/cron olanaklarını birlikte değerlendir.
- [x] **2.4.10** Başlat/bitir/iptal isteklerinin yinelenmesi, yeniden planlama ile bitişin çakışması ve geç gelen meeting-ended olayı için tutarlı sonuç üret; eski sağlayıcı oturumundan gelen olay yeni oda neslini kapatmasın.

**Bu bölümün teslimi:** Gerçek görüşmeyle uyumlu canlı/sona erdi/iptal durumları; ayrı ayrılma/bitirme ve erişim kaybında çıkarma.

## 2.5. Ana plan 11: elle kayıt ve sağlayıcı olayları

Kod teslimindeki işaretler teknik uygulamayı gösterir. SQL gerektiren 2.5.04/05/12/13 kullanıcı sonuçlarıyla doğrulandı. Üretim HTTPS/webhook kaydı 2.5.09/11 deployment sonrasına kadar açık tutuldu. Gerçek dosya/cihaz testi kullanıcıdadır. Ayrıntı: [2.5 uygulama ve etkinleştirme](./VIVA_ASAMA_2_5_UYGULAMA.md).

- [x] **2.5.01** İlk sürüm kayıt profilini Daily bulut kaydı olarak doğrula; desteklenen biçim, süre, hesap limiti ve ücret bilgisini kullanılan hesapta kaydet. Cogniti arşivine aktarımı bu aşamaya çekme.
- [x] **2.5.02** Otomatik kayıt başlangıcını kapalı tut; yalnız düzenleyen Daily’nin hazır kaydı başlat/durdur işlevini kullanabilsin. Arayüz düğmesi ile gerçek sunucu/sağlayıcı yetkisini birlikte doğrula.
- [x] **2.5.03** Kayıt için istek gönderildi, kayıt başladı, durduruluyor, hazırlanıyor, hazır ve hata durumlarını ayır; başlamadığı halde kayıt alınıyor gösterme.
- [x] **2.5.04** Bir etkinlikte kaydı durdurup yeniden başlatmanın birden fazla dosya üretebileceğini destekle; tek kayıt kimliği varsayımıyla önceki parçaları ezme.
- [x] **2.5.05** Her kayıt kimliğini etkinlik ve Daily oturumuyla ilişkilendir; yinelenen başlatma/hazır olayları aynı kaydı çoğaltmasın.
- [x] **2.5.06** Kayıt başladı/durdu göstergesini ve Daily’nin hazır bildirimini koru. Hata olduğunda görüşmenin devam edip etmediğini ve kaydın durumunu ayrı göster.
- [x] **2.5.07** Hazır kayda erişimi Viva yetkisiyle sunucuda kontrol et; gerektiğinde yeni süreli erişim linki üret. İmzalı indirme adresini kalıcı arşiv URL’si veya herkese açık bağlantı gibi kullanma.
- [x] **2.5.08** Kayıt metadatası ve aktarım için gereken kimlikleri üçüncü aşamaya devir sözleşmesine yaz; mevcut Cogniti arşivi, Bunny video standardı ve transkript hattının yerine yeni sistem kurma.
- [ ] **2.5.09** Webhook endpointini oluştur; üretim/test ortamında Daily’nin ulaşabileceği HTTPS adresini ve oda/domain eşleştirmesini belirle.
- [x] **2.5.10** Webhook sırrını ilk kurulumdan önce hazırla; ilk test isteği dahil imza/zaman doğrulamasını seçilen sağlayıcı yöntemiyle uygula. İmzayı doğrulayamayan isteği uygulama olayı gibi işleme.
- [ ] **2.5.11** Gereken meeting/participant/recording olaylarına abone ol; her olayın hangi etkinlik ve oda nesline ait olduğunu doğrula.
- [x] **2.5.12** Webhooku kısa sürede yanıtla; gerçek olayları güvenilir biçimde kalıcı iş kaydına alıp uzun işleri ayrı yürüt. Sunucusuz ortamda yanıt sonrası unutulabilecek salt bellek işiyle yetinme.
- [x] **2.5.13** Olay kimliği ve uygun iş anahtarlarıyla yinelenen teslimleri etkisiz kıl; sırasız veya gecikmiş olayın iptal/bitiş durumunu geri açmasını önle. Katılım olaylarında sağlayıcı oturum kimliğini de dikkate al.
- [x] **2.5.14** Webhook teslimi kaçarsa veya FAILED durumuna düşerse mevcut Daily oturum/kayıt bilgisiyle toparlama ve yeniden etkinleştirme yolunu belirle; sürekli kontrolsüz polling kurma.
- [x] **2.5.15** Kayıt hazır/hata olayını Viva ekranına bağla; bu aşamada rapor, transkripsiyon ve cevap analizi geliştirme.

**Bu bölümün teslimi:** Yalnız sunucunun elle yönettiği kayıt; etkinliğe bağlı güvenilir hazır/hata bilgisi ve üçüncü aşamaya devredilebilir kayıt kimlikleri.

## 2.6. Ana plan 12: hedefli doğrulama ve aşama teslimi

**Teknik teslim hazır.** [2.6 teslim, etkinleştirme ve kullanıcı kabul adımları](./VIVA_ASAMA_2_6_TESLIM.md) · [10 hedefli teknik kontrolün sonucu](./VIVA_ASAMA_2_6_TEST_SONUCLARI.json). İşaretler kanıtlanan yazılım/API/teslim işlerini gösterir; gerçek görüşme, kayıt dosyasının oynatılması, CSP/çerez/tam ekran ve iki bağlantılı SQL denemesi yapılmış sayılmaz. 2.6.11 için isteğe bağlı örnek kodlandı; tarayıcı kabulü kullanıcıda.

- [x] **2.6.01** Fake Daily taşıma katmanıyla oda oluşturma/güncelleme ve yanıt kaybı testlerini yaz; gerçek hesabın kullanıldığı testleri ayrı adlandır ve ayrı sonuçlandır.
- [x] **2.6.02** Üye, EClub, düzenleyen, doğrulanmamış/iptal edilmiş özel davet ve yabancı etkinlik için token yetkilerini test et; mevcut organizasyon kapsamı testlerini yalnız değişiklik gerektirdiği ölçüde genişlet.
- [ ] **2.6.03** Token ve hazır bekleme davranışını gerçek Daily denemesinde doğrula: sunucudan önce giriş, kabul/ret ve geçerli tokenla beklemeyi atlama denemesi sonuçları kaydedilsin.
- [ ] **2.6.04** İki ayrı tarayıcı/oturum veya mevcut telefonla kamera/mikrofonu, ekran paylaşımını izlemeyi, sohbeti ve el kaldırmayı dene; Daily’nin hazır araçları üzerinde temel kullanım akışı çalışsın.
- [x] **2.6.05** Katılımcı ve izleyici izinlerini gerçek sağlayıcı üzerinde karşılaştır; özel misafirin medya/yönetim izni alamadığını token/SDK seviyesinde sına. Gerçek Cogniti kimlikli kabulü kullanıcı yürütür; ajan DB’ye erişmez.
- [ ] **2.6.06** Ağ kopması, tarayıcı yenilemesi, sunucunun ayrılması ve herkes için bitirmeyi ayrı sına; kapanmış etkinliğin yeniden bağlanmayla geri açılmadığını doğrula.
- [ ] **2.6.07** Davet iptali/yenileme ve katılımcı çıkarılmasında açık oturumu çıkarma, eski tokenla giriş ve sağlayıcı hata/yeniden deneme sonucunu sına.
- [ ] **2.6.08** Elle kayıt başlat/durdur, yetkisiz kayıt, kayıt hazır/hata, birden çok kayıt parçası ve olay tekrarlarını test et; örnek kaydın gerçekten oynadığını doğrula.
- [ ] **2.6.09** Yeni veri/işlemler için çift başlatma, eş zamanlı bitirme/iptal ve olay yarışı senaryolarını hedefli doğrula; SQL gerektiren kısmı kullanıcıya çalıştırılacak dosya olarak ver. Önceki iki bağlantılı yarış testi yapılmış sayılmasın.
- [ ] **2.6.10** Türkçe, ortak temalar ve dar ekran görünümünü geliştirici kontrolünde incele. Push sonrasında mevcut gerçek telefonla canlı deneyimi kullanıcıyla kontrol et; fiziksel tablet olmadığını kayıt altına al.
- [ ] **2.6.11** Üçüncü aşama için küçük bir Cogniti örnek ekranını Daily entegrasyon alanında açmayı dene; oturum/CSP ve tam ekran davranışını gözle. PDF/video eş zamanlama, gerçek soru/cevap, puan veya rapor entegrasyonu ekleme.
- [x] **2.6.12** Yeni uygulama kodunda tip ve lint kontrollerini, değişen davranışa yönelik gerekli regresyonları çalıştır. Mock, gerçek Daily, kullanıcı SQL ve cihaz sonuçlarını ayrı kaydet.
- [x] **2.6.13** Kullanım akışını teslim et: etkinlik oluştur → sunucu başlatır → üye katılır → ekran paylaşılır → sunucu kayıt başlatır/durdurur → herkes için bitirir → kayıt hazır bilgisi görülür.
- [x] **2.6.14** Özel misafirin gerçek e-posta/çerez akışını REDBOOK TB-03 altında tut; bu borcu veya tablet yokluğunu önceki aşamanın kapanışını yeniden açan koşul yapma. Gerçek misafir uçtan uca denemesi yapılmadıysa açıkça belirt.
- [x] **2.6.15** Etkinlik/oda/oturum/kayıt kimliklerini, rol karşılıklarını, API/SDK sürümünü ve hata kurtarma davranışını docs altında belgeleyip checklisti gerçek sonuçlarla güncelle.
- [ ] **2.6.16** İkinci aşamayı kullanıcı kabulüyle kapat; üçüncü aşamaya mevcut Cogniti içerik/soru/medya/transkript bağlantılarını, kayıt kimliklerini ve bilinen eksikleri devret. Planın yazılmasını entegrasyonun tamamlanması olarak işaretleme.

**Bu bölümün teslimi:** Kayıtlı test sonuçları, kullanıcıyla canlı görüşme kabulü, güncellenmiş checklist ve üçüncü aşama bağlantı sözleşmesi.

## Veri ve olay sözleşmesinde korunacak ayrımlar

Viva etkinliği, Daily odası, o odada gerçekleşen görüşme oturumu ve kaydın her biri farklı kimliktir. Bir etkinlikte yeniden bağlanma veya kayıt durdur/başlat nedeniyle birden çok oturum/kayıt parçası oluşabilir. Eski odanın veya oturumun olayı yeni durumu yanlış değiştirmemelidir.

Önerilen sağlayıcı eşleştirme ve iş durumları mevcut Viva etkinlik durumlarının yerine geçmez. Yeni tablo/kolon/API adları uygulama öncesi mevcut şema ve mimariyle kesinleştirilecek. Uygulama, olay alımı ve sağlayıcı çağrısında kimlik kapsamı sunucuda korunacak.

Kayıt hazır olması Cogniti arşivine aktarıldığı anlamına gelmez. Oda süresinin bitmesi, içerideki kişinin çıkarılması ve yeni katılımın reddi ayrı ayrı doğrulanır. Kayıt, katılımcı ve yaşam döngüsü için webhooklar aynı etkinlik doğrulamasını kullanır.

## Hedefli kabul matrisi

| Senaryo | Beklenen davranış | Kanıt |
|---|---|---|
| UTT + kendi EClub üyesi | Aynı etkinlikte görüşme, üye kendi medya kontrolünü kullanır | Kullanıcının gerçek kimlikli kabulü + Daily test kaydı |
| PM/medikal/iç rol | Mevcut takım/firma kapsamıyla katılım ve sunucu eşleştirmesi | Hedefli API/rol testleri; değişen akışta kullanıcı kabulü |
| Özel davetli | Doğrulanmış etkinlik oturumu gerekir; medya/yönetim hakkı verilmez | Token/SDK izin testi; gerçek e-posta akışı TB-03’te |
| Sunucudan önce giriş | Hazır/izinli bekleme akışı; tokenla istemeden atlama olmaz | Gerçek Daily denemesi |
| Yenileme/kopma | Kayıt/oda çoğalmaz, geçerli kimlik yeniden bağlanır | Uygulama testi + iki oturum |
| İptal/çıkarma | Açık oturum çıkarılır, eski tokenın sonucu kaydedilir | Sağlayıcı entegrasyon testi |
| Herkes için bitir | Bütün görüşme kapanır; gecikmiş olay geri açmaz | Yetki/yaşam döngüsü testi + canlı deneme |
| Elle kayıt | Yalnız sunucu başlatır/durdurur; dosya/metadata hazır sonucu doğrulanır | Kısa gerçek kayıt ve olay kaydı |
| Olay tekrarı/hata | Tek sonuç, doğru durum, yeniden denemeyle toparlama | Sahte olay testleri + webhook uygunluk denemesi |
| Telefon | Yayına katılım, sesi/görüntüyü ve paylaşılan ekranı izleme, geri dönüş | Push sonrası mevcut telefon |

**Tamamlanma ölçütü:** Yetkili sunucu ve katılımcı Viva içinden gerçek görüşme yapar; hazır görüşme araçları çalışır; sunucu elle kayıt alabilir; iptal/bitirme Daily’de uygulanır; kayıt sonucu etkinlikle ilişkilidir. Belgedeki uygulama/doğrulama işleri gerçek kanıtla işaretlenir. TB-03 ve fiziksel tablet yokluğu yapılmış test gibi gösterilmez; kullanıcı tarafından ertelenen takipler birinci aşamayı yeniden açmaz. Yeni bir eksik bulunursa somut etkisi ve devri ayrıca kaydedilir.

## Başlangıç kaynakları

Mevcut kaynaklar: `lib/viva/sozlesme.ts`, `lib/viva/sunucu.ts`, `components/viva/VivaEkrani.tsx`, `components/viva/VivaMisafir.tsx`, `app/(panel)/viva/api/route.ts`, `app/viva/davet/[token]/api/route.ts`, `scripts/sql/viva_asama1.sql`. Bunlar başlangıç kaynaklarıdır; tamamlanan Daily bağlantılarının güncel dosya/kimlik ve devir sözleşmesi 2.6 teslim belgesindedir.

- [Daily odaları](https://docs.daily.co/reference/rest-api/rooms)
- [Meeting token ve süreler](https://docs.daily.co/reference/rest-api/meeting-tokens)
- [Katılımcı izinleri](https://docs.daily.co/docs/daily-js/guides/permissions)
- [Prebuilt ayarları](https://docs.daily.co/guides/products/prebuilt/customizing-daily-prebuilt)
- [createFrame](https://docs.daily.co/reference/daily-js/factory-methods/create-frame) / [destroy](https://docs.daily.co/reference/daily-js/instance-methods/destroy)
- [Sunucudan katılımcı çıkarma](https://docs.daily.co/reference/rest-api/rooms/session/eject)
- [Kayıt](https://docs.daily.co/docs/guides/features/recording) / [hazır kayıt olayı](https://docs.daily.co/reference/rest-api/webhooks/events/recording-ready-to-download)
- [Webhooks](https://docs.daily.co/reference/rest-api/webhooks)
- [Prebuilt özel entegrasyonları](https://docs.daily.co/reference/daily-js/instance-methods/set-custom-integrations)
- [Güncel hesap/fiyat kontrolü](https://www.daily.co/pricing/video-sdk/)

## Takip sayımı

| Bölüm | Madde | Tamamlandı |
|---|---:|---:|
| 2.0 | 6 | 2 |
| 2.1 | 10 | 10 |
| 2.2 | 10 | 10 |
| 2.3 | 9 | 9 |
| 2.4 | 10 | 9 |
| 2.5 | 15 | 13 |
| 2.6 | 16 | 7 |
| **Toplam** | **76** | **60** |

2.1’in 10 maddesi oda eşleştirme kapsamıyla kapatıldı: 5 kurulum kontrolü true, 18 kullanıcı SQL testi, 42 uygulama testi ve 3 gerçek Daily oda kontrolü başarılı. [Kullanıcı SQL sonuçları](./VIVA_ASAMA_2_1_KULLANICI_SQL_SONUCU.md).

2.1.07’deki iş kirası/tek oda davranışı sıralı ve sahte bağımlılık testleriyle doğrulandı; iki gerçek DB bağlantısıyla yarış testi yapılmadı ve 2.6.09’da açık. 2.1.09 tarih değişikliğinde eşleşmeyi geçersiz kılar ve sonraki yetkili hazırlamada aynı odayı günceller; otomatik yaşam döngüsü bağlantısı 2.4’te. 2.1.09–2.1.10’un token tarafı 2.2.07/2.2.10 ve aktif oturum işlemleri 2.4 kapsamında izlenir. 2.2’de token üretimi doğrulandı; aktif oturum işlemleri 2.4’te açık kalır. Kapalı oda yeniden açılmaz, aynı oda adını silip yeniden oluşturma akışı eklenmedi.

## Adım bazlı ilerleme — kullanıcı kararı

2.1–2.6 ayrı ayrı yürütülür. Her adım sonunda yapılanlar 1–2 cümle ve sıradaki iş 1 cümleyle paylaşılır; kullanıcı **devam edelim** demeden sonraki adıma geçilmez. 2.0 hesabı/uygunluk hazırlıkları ilgili adımların içinde izlenir; yeni bir onay adımı açılmaz.

[2.1 uygulama ve kurulum kaydı](./VIVA_ASAMA_2_1_UYGULAMA.md) · [2.1 test sonuçları](./VIVA_ASAMA_2_1_TEST_SONUCLARI.json). Daily hesabı/domaini oluşturuldu, e-posta doğrulandı, kart tanımlandı; yerel ayarlar denetlendi, Vercel kaydı kullanıcı tarafından bildirildi. Token API’si ve boş odada sunucuyu bekleme 2.2’de doğrulandı. Prebuilt görüşmesi ve kayıt denemeleri 2.3/2.5 kapsamında kalır.


## 2.2 uygulama durumu — 25 Ekim 2026

[2.2 uygulama kaydı](./VIVA_ASAMA_2_2_UYGULAMA.md) · [2.2 test sonuçları](./VIVA_ASAMA_2_2_TEST_SONUCLARI.json).

67 uygulama testi (25 yeni + 42 regresyon), 6 gerçek Daily API kontrolü ve tip kontrolü başarılı. Lint: 0 hata, eski şema snapshot’ından 3 RPC uyarısı. 2.2.04/05/07 token izinleri ve süre sözleşmesi düzeyinde doğrulandı; görüşmede kamera/mikrofon engeli ve süre sonunda çıkarma ayrıca 2.3/2.6’da sınanacak.

2.2.01/02/03/06/10 kullanıcı kurulum çıktısı (4/4 true) ve 24/24 başarılı SQL testiyle doğrulandı; atlanan senaryo yok. [Kullanıcı SQL sonuçları](./VIVA_ASAMA_2_2_KULLANICI_SQL_SONUCU.md). 2.2.08’in tokenı join()’a aktarma bağlantısı 2.3’te tamamlandı. 2.2.09’da sunucunun sabit Daily user_id varlığına göre token kapısı kuruldu: boş gerçek odada bekleme ve sahte bağımlılıklarla olumlu/olumsuz senaryolar başarılı; gerçek host katılımı sonrası olumlu geçiş 2.3’te sınanacak. Bu açık doğrulamalar yapılmış sayılmaz.

Önceden teslim edilmiş tokenın anında iptali yoktur; aktif görüşmeden çıkarma/ban ve eski tokenla yeniden giriş sınırı 2.4’te açık kalır. 2.2 katılım/yetki altyapısı ve 2.3 görüşme bağlantısı tamamlandı; gerçek host/görüşme doğrulaması kullanıcıda. 2.3 teknik teslimi tamamlandı; 2.4 kullanıcı devam onayını bekliyor.

## 2.3 kapanışı — 25 Ekim 2026

[Uygulama kaydı](./VIVA_ASAMA_2_3_UYGULAMA.md) · [Sonuçlar](./VIVA_ASAMA_2_3_TEST_SONUCLARI.json).

2.3’ün 9 maddesi teknik teslim düzeyinde kapatıldı. 2.2.08/09 katılım ve bekleme bağlantısı kuruldu; gerçek host ile olumlu giriş kontrolü kullanıcıda. 2.3.08’in fiziksel cihaz/görünüm denemeleri kullanıcıda. 2.3.09’un kendi ayrılma/dönüş akışı hazır; herkes için bitirmenin kalıcı etkinlik durumuna bağlanması 2.4’te açık. Görsel/gerçek görüşme kontrolleri başarılı diye işaretlenmedi. Yeni SQL, test turu veya 2.4 çalışması başlatılmadı.

## 2.4 uygulama kaydı

[Yaşam döngüsü uygulaması](./VIVA_ASAMA_2_4_UYGULAMA.md). Kod hazır; 6 odaklı teknik kontrol ve 2 Daily API işlemi başarılı. Kullanıcı SQL doğrulaması: 4 kurulum kontrolü true, 9/9 test başarılı. Cron tek kayıt/pasif kuruldu. 2.4.07’nin aktif kayıt durdurma bağlantısı 2.5’te, 2.4.09’un cron etkinleştirmesi deployment sonrasında açık kalır. Kayıt durdurma bağlantısı kayıt modülüyle 2.5’te; görsel kontroller kullanıcıda.

[2.4 kullanıcı SQL sonuçları](./VIVA_ASAMA_2_4_KULLANICI_SQL_SONUCU.md). 2.5 başlamadı.
