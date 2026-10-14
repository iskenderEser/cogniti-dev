# E-Club gönderim planı veri modeli — Adım 3

Bu belge Adım 3 veri modelini ve güncel tarih bazlı planlama sözleşmesini açıklar.
İlk kurulumun `timestamptz` alanı, `eclub_gonderi_saatini_temizle.sql` ile
Türkiye takvim tarihine çevrilir. Kullanıcı 14 Ekim 2026'da canlı SQL sonucundaki
beş kontrolün tamamını `true` olarak doğruladı.

## Kayıt birimi

`eclub_yayin_gonderim_planlari` tablosunda her yayın–alıcı planı ayrı satırdır.
Çoklu seçimde bir işlem anahtarı paylaşılabilir; UTT, işlem anahtarı, yayın ve
üye birleşimi aynı kayıt isteğinin ikinci kez plan üretmesini engeller.
Değiştirilmiş girdinin aynı işlem anahtarıyla kabul edilmemesi kayıt RPC'sinde
kontrol edilecektir; tekillik kısıtı tek başına içerik eşitliğini kanıtlamaz.

## Alanlar

| Alan | İşlev |
|---|---|
| `plan_id` | Planın benzersiz kimliği |
| `utt_id`, `kisi_id`, `yayin_id` | Gönderen, alıcı ve mühürlü yayın |
| `urun_id` | Haftalık ürün kotası için yayından sunucuda çözülen ürün |
| `hedef_gonderim_at` | Planlanan Türkiye takvim tarihi (`date`); kolon adı mevcut RPC bağlantısı için korunur |
| `created_at` | Planın oluşturulma zamanı; gönderim zamanı değildir |
| `durum` | Bekliyor, işleniyor, gerçekleşti veya gerçekleşmedi |
| `islem_anahtari` | Mükerrer plan oluşturmayı engelleyen istemci işlem anahtarı |
| `oneri_id`, `gerceklesti_at` | Yalnız başarılı gerçek gönderimden sonra yazılan sonuç |
| `isleme_alindi_at`, `lease_bitis`, `deneme_sayisi` | İşleyicinin sahiplenme ve kesinti sonrası toparlanma alanları |
| `son_hata_kodu`, `son_hata_at` | Gerçekleşmeme veya teknik hata kaydı |
| `guncellenme_at` | Son durum yazımının zamanı; yazan RPC tarafından güncellenecek |

Araç kimliği plan kimliğinin, kotasının veya tekrar hesabının parçası değildir.
Öneri yazılırken öğrenme aracı yayından çözülecektir.

## Durum ve kayıt bütünlüğü

- `bekliyor`: Kota rezervasyonu vardır; öneri henüz oluşmamıştır.
- `isleniyor`: İşleyici planı sahiplenmiştir; rezervasyon devam eder.
- `gerceklesti`: Öneri kaydı ve gerçek gönderim zamanı birlikte bulunur.
- `gerceklesmedi`: Öneri oluşmamıştır; neden kaydı zorunludur, rezervasyon kalkar.

İşleniyor durumunda geçerli bir sahiplenme süresi zorunludur; diğer durumlarda
`lease_bitis` boş olmalıdır. Bir öneri en fazla bir planın sonucu olabilir.
Planın başarısı ile öneri oluşturulması aynı transaction içinde yazılacaktır.
Bağlanan önerinin UTT, üye ve yayın eşleşmesi bu transactionda doğrulanacaktır.
Tablodaki tek kolon FK'si tek başına bu üçlü eşleşmeyi doğrulamaz.

## Kota hesabına bağlantı

Bekleyen/işlenen planlar hedef gönderim tarihinde rezervasyon olarak sayılır.
Gerçekleşmiş plan ayrıca sayılmaz; onun bağlı olduğu öneri gerçek gönderim
zamanında sayılır. İşleyici değerlendirdiği planı kendi rezervasyonundan ayırır;
başarılı işlem rezervasyonu gerçek gönderime tek transactionda dönüştürür.

Haftalık planlama en fazla takip eden haftaya, dönem planlaması yalnız içinde
bulunulan iki aylık takvim dönemine yapılabilir. Hedef gün Pazartesi–Cuma
olmalıdır. Bu koşulların atomik SQL kontrolleri Adım 4'te eklenecektir.
Tablo oluşturulması bu kuralların uygulanmış olduğu anlamına gelmez.

## Öğrenme ve bildirim

Plan oluşturulurken `eclub_oneri_kayitlari` satırı, uygulama bildirimi, push,
puan veya öğrenme süresi oluşturulmaz. Bunlar gerçek gönderim akışında başlar.
Bu SQL'de bunları başlatan trigger, RPC veya zamanlanmış iş yoktur.

## Yetki ve kurulum

Tablo RLS ile kapalıdır; `PUBLIC`, `anon`, `authenticated` erişimleri kaldırılır.
Yalnız sunucu `service_role` rolü SELECT/INSERT/UPDATE yapabilir. İşlem sahibinin
rol ve kapsam doğrulaması sonraki adımlarda API ve RPC'de yapılacaktır.
Bağlı ana kayıtlar otomatik silinmez; FK'ler varsayılan NO ACTION kullanır.

Kurulum dosyası: `scripts/sql/eclub_yayin_gonderim_planlari.sql`.
Tip sözleşmesi: `lib/eclub/gonderimPlanTipleri.ts`.
Mevcut tabloları, kayıtları, fonksiyonları ve diğer modülleri değiştirmez.
Tam kurulum sırası ve canlı doğrulama Adım 12'de hazırlanacaktır.

## Adım 4 — atomik kota ve tarih kontrolü

Kurulum dosyası: `scripts/sql/eclub_gonderim_kota_ve_tarih_kontrolu.sql`.
Bu dosya Adım 3 kurulumundan sonra çalıştırılır. Canlı veritabanına ajan
tarafından bağlantı veya SQL uygulaması yapılmamıştır.

- `eclub_gonderim_kontrol_hesapla`: Türkiye saatindeki tarih, aktif erişim,
  inceleme, haftalık ürün kotası, ilk gönderim/yeniden gönderim ayrımı ve
  önceki/sonraki gönderim-plan aralığını tek kaynaktan hesaplar.
- `eclub_gonderim_uygunlugu`: sunucu saatini kullanan, yalnız service_role
  erişimli uygunluk okumasıdır. İşlem sırasında yazım kapısı yeniden kontrol eder.
- Öneri ve plan tablolarının yazım trigger'ları ilgili UTT–üye kapsamını kilitler;
  kontrol ve yazım aynı transactiondadır. Aynı kapsam kilidi bütün ürün ve
  yayın hesaplarını kapsar. Çoklu kayıt RPC'si üye kilitlerini önceden sıralı
  alacaktır; RPC/API bağlantısı sonraki adımlardadır.
- Bekleyen/işlenen planlar ve gerçekleşmiş öneriler birlikte sayılır. Kendi
  planını gerçekleştiren işlem kendi rezervasyonunu ikinci kez saymaz.
- Öneriye nullable `plan_id` ve plan başına tek öneri indeksi eklenir.
  Transaction sonunda çalışan kısıt trigger'ları plan sonucunun ve önerinin
  birlikte tamamlandığını doğrular; yarım gerçekleşme commit edilemez.
- Gerçek önerinin başlangıcı veritabanı saatidir. Plan hedefi, oluşturulma
  zamanı ve kimlikleri durum güncellemesiyle değiştirilemez.
- Planlama en fazla takip eden haftaya ve yalnız mevcut iki aylık döneme
  yapılır. Hedef hafta sonu olamaz. Günü geçen plan başka güne kaydırılmaz.

SQL dosyasının son sorgusu dört yapısal kontrol sonucu döndürür.
Bu kontrollerin başarılı olması tüm davranış/sınır testlerinin yapıldığı
anlamına gelmez; Adım 11'deki test kapsamı ayrıca uygulanacaktır.
Eski RPC'nin 21 günlük kontrolü ve eski ayarlar Adım 5'e kadar yerindedir;
yeni uygulama API'si ve plan işleyicisi henüz bağlanmamıştır.

## Adım 5 — gönderim RPC'si ve ayar geçişi

Kurulum dosyası: `scripts/sql/eclub_gonderim_rpc_yeni_kurgu.sql`.
Adım 3 ve 4 kurulumlarından sonra tamamı birlikte çalıştırılır.

- Kanonik `eclub_yayin_gonder` yalnız UTT, üye, yayın ve varsa plan kimliği alır.
  Adım 4 kontrolünü transaction kilidi altında uygular; araç bilgisi yayından gelir.
- Mevcut `eclub_oneri_atomik_kaydet` RPC'sinin imzası korunur ve kanonik yazıcıya
  yönlendirilir. Eski araç/tarih girdileri kota veya süreyi değiştiremez.
- Başarılı yeni gönderimin geçerliliği gerçek başlangıcından 15 gündür.
  Süre trigger'ı doğrudan yazımda da uygulanır. Geçmiş önerilerin süreleri bu
  kurulumda değiştirilmez.
- Planlı gönderimde öneri ve plan sonucu aynı transactionda tamamlanır. Daha
  önce gerçekleşmiş plan yeniden öneri oluşturmaz. Bildirim/worker bağlantısı
  ilgili sonraki adımlarda hazırlanacaktır.
- Ayar kurulumunun ON CONFLICT kısmı değeri de 15'e yazar. Eski araç/video
  tekrar ayarı kaldırılır; tarihsel tekrar ayarı dosyası onu yeniden oluşturmaz.
- Kodun geçerlilik süresi 15'e alınır. Admin ekranı bu süreyi salt okunur
  gösterir; admin API'si eski ayarları veya farklı süreleri kabul etmez.
- GET geçmişindeki aralık artık başlangıçtan 15 gündür. API'nin tam uygunluk
  hesabına bağlanması ve süresiz `zaten_gonderildi` kapısının kaldırılması Adım
  6'dadır; planlama ekranı Adım 8'dedir. Bu adım bütün kullanıcı akışının
  tamamlandığı anlamına gelmez.

Yerel doğrulama: süre/ayar, öğrenme ve gönderim incelemesine ait 12 test geçti.
TypeScript kontrolü geçti. SQL'in canlı çalıştırılması ajan tarafından yapılmadı;
dosyanın son sorgusu beş yapısal kontrol sonucu döndürür. SQL davranış testleri
Adım 11 kapsamındadır.

## Adım 6 — gönderim ve planlama API'leri

Kurulum: `scripts/sql/eclub_gonderim_api_toplu.sql`; Adım 3–5 kurulumları gereklidir.
SQL'i proje sahibi çalıştırır. Bu adımda veritabanına bağlanılmadı.

`POST /eclub/oneriler/api` kimliği oturumdan alır; istemci UTT kimliği belirleyemez.

- `islem: "gonder"`: `yayin_idler` ve `kisi_idler` birlikte kaydedilir. Eski tek
  `yayin_id` girdisi de desteklenir. Süresiz `zaten_gonderildi` kontrolü kaldırıldı.
- `islem: "planla"`: bunlara ek olarak `YYYY-MM-DD` biçiminde `hedef_gonderim_tarihi` ve UUID
  `islem_anahtari` zorunludur. Aynı yayın–üye için aynı anahtar ve tarihle yeniden
  istek yeni plan üretmez; farklı tarihle kullanılması reddedilir.
- `islem: "kontrol"`: aynı seçim kayıt oluşturmadan değerlendirilir. Hedef tarih
  yoksa anlık, varsa plan uygunluğu hesaplanır. Önizleme kayıt garantisi değildir;
  kaydetme sırasında kilit altında bütün kontroller tekrar çalışır.
- Toplu RPC bütün alıcı kapsamlarını sıralı kilitler. Aynı ürünün yayınları seçim
  sırasıyla kalan hakları tüketir; uygun olmayan yayın–alıcı çiftleri nedenleriyle
  döner. Teknik SQL hatası transactionı geri alır ve API başarısız yanıt verir.
- Önizleme, önceki uygun seçimlerin ürün kotası tüketimini bellekte ekler;
  veritabanına geçici öneri/plan bile yazmaz. Gerçek kayıt aynı transactiondaki
  önceki kayıtları görür. Her alıcı–ürünün seçim sonundaki hakkı `haftalik_ozet`
  içindedir; çift bazlı sonuçlarda kontrol öncesi hak, seçimin o satırından sonraki
  hak, dönemlik aday dahil tekrar sayısı ve ilk/yeniden gönderim bilgisi bulunur.
- Plan önizlemesinin `uygun_tarihler` alanı bütün seçimin birlikte uygun olduğu
  takvim tarihlerini içerir. Planlama yalnız sonraki günlerden yapılır. Adaylar
  yalnız mevcut/takip eden haftanın iş günleri ve mevcut iki aylık
  dönem içinde kalır. Son kararı ortak SQL kontrolü verir.
- Plan oluşturma bildirim, öneri veya öğrenme süresi başlatmaz. Anlık gönderimde
  bildirim yalnız başarıyla oluşturulan gerçek öneriler için çağrılır.

`GET /eclub/oneriler/api?sayfa=1&sayfa_boyutu=100` gönderim geçmişini;
`GET /eclub/oneriler/api?kaynak=planlar&sayfa=1&sayfa_boyutu=100` planları döndürür.
Her iki liste yalnız oturumdaki UTT'ye aittir, zaman/kimlik ile sıralanır ve toplam
ile devam bilgisi içerir. Mevcut geçmiş hook'u bütün sayfaları okur; başarısız
sayfayı boş liste saymaz. Kota geçmişin tarayıcıya gelen kısmından hesaplanmaz;
SQL tam geçmişi ve bekleyen/işlenen planları kullanır.

Sınırlar: en fazla 20 yayın, 100 alıcı ve toplam 300 çift. Yeni RPC'nin şema
snapshot'ında bulunmaması lint'te iki `olu-rpc` uyarısı üretir; SQL kurulumu sonrası
şema snapshot'ı proje sahibi tarafından güncellenebilir. Snapshot uydurularak
RPC kurulmuş gösterilmedi. Ekranın kalıcı gönderildi filtresi Adım 8'de, cron
Adım 7'de ele alınacaktır; bu adım ekranın tamamlandığı anlamına gelmez.

Yerel doğrulama: HTTP girdisi, Türkiye takvimi, hafta/dönem sınırı, hafta sonu ve
sayfalama testleri ile süre/ayar ve ilgili E-Club regresyon testleri çalıştırıldı.
SQL davranış/yarış testleri Adım 11 kapsamındadır. Kurulum dosyasının son kontrolü
`toplu_islem_rpc_var = true` bekler; bu sonuç tek başına davranış testi değildir.

Adım 6 doğrulama sonucu: 19/19 yerel test ve TypeScript kontrolü başarılı.
Lint: hata yok; yalnız yeni RPC için yukarıdaki iki şema snapshot uyarısı var.

Adım 6 kurulum sonucu kullanıcı tarafından `toplu_islem_rpc_var = true` olarak
iletildi; RPC kurulumu yapısal olarak doğrulandı.

## Adım 7 — zamanlanmış gönderim işleyicisi

Kurulum sırası:
1. `scripts/sql/eclub_planlanan_gonderim_isleyici.sql`
2. `scripts/sql/eclub_planlanan_gonderim_cron.sql`

SQL'i proje sahibi çalıştırır; ajan veritabanına bağlanmaz. Ön koşullar Adım 3–6
kurulumu, mevcut pg_cron/pg_net/Vault ve `hapbilgi_cron_base_url` ile
`hapbilgi_cron_secret` Vault kayıtlarıdır. Gizli değerler çıktıya alınmaz.

`POST /api/cron/eclub-yayin-gonderim` (aynı yetkiyle GET de desteklenir) yalnız
`Authorization: Bearer CRON_SECRET` ile çalışır. Anahtar yoksa erişim kapalıdır.
Supabase cron mevcut diğer kuyruklar gibi pg_net ile bu uç noktayı çağırır.
Uygulama saati veya istemci tarihi gerçek gönderim zamanı olarak kabul edilmez.

`eclub_planlanan_gonderimi_isle(text[])` her çağrıda en fazla bir planı sonuçlandırır:

- Hedef zamanı gelmiş bekleyen planlar ve lease'i bitmiş işlenen planlar adaydır.
  Gelecek hedefler ve sonuçlanmış planlar aday değildir.
- Önce mevcut UTT–üye kapsam kilidi, sonra erişim ve plan satır kilitleri alınır.
  Meşgul kapsam/satır beklenmeden atlanır. Sahiplenme ve gerçekleşme aynı SQL
  transactionındadır; HTTP kesilirse commit edilmiş plan tekrar aday olmaz.
- Ortak Adım 4 kontrolü gerçek DB saatinde, kendi rezervasyonu hariç uygulanır.
  Araçlar için uygulamanın açık/kapalı bayrakları da worker tarafından iletilir.
  Aynı UTT–üye–ürün haftalık hesap ve UTT–üye–yayın tekrar hesabı kullanılır.
- Günü geçmiş plan, yetki/üyelik kaybı, durmuş yayın veya kota/tarih uyuşmazlığı
  `gerceklesmedi` olarak sonuçlanır; nedeni `son_hata_kodu` ve zamanı
  `son_hata_at` alanlarına yazılır. Hedef zamanı değiştirilmez.
- Planın hedef anından önce gönderim yapılmaz. Dakikalık cron nedeniyle gönderim
  bir sonraki kontrolle gerçekleşebilir; mevcut sözleşmedeki aynı Türkiye takvim
  günü sınırı uygulanır. Ek bir keyfi gecikme penceresi oluşturulmaz.
- Sahiplenmede 180 saniyelik teknik lease yazılır. Kanonik Adım 5 yazıcısı öneriyi
  oluşturup planı aynı transactionda `gerceklesti` yapar. Plan başına tek öneri
  indeksi ve karşılıklı sonuç constraint trigger'ları korunur.
- Kayıt sırasında yakalanan SQL hatasında iç işlem geri alınır ve plan hata
  koduyla `gerceklesmedi` olur. SQL çağrısı iptal edilirse transaction tamamen
  geri alınır; sonraki cron aynı kurallar altında hâlâ bekleyen planı görebilir.

Uygulama döngüsü en fazla 20 plan ve yeni işe başlamak için 45 saniye bütçe
kullanır; uç nokta süresi 60 saniyedir. Teknik RPC hatası boş kuyruk sayılmaz.
Bildirim çağrısı yalnız gerçek öneri sonucu için yapılır; başarısız plan bildirilmez.
Bildirimdeki hata gerçek gönderimi tekrar çalıştırmaz. Mevcut bildirim yardımcısı
hataları loglayan akışı korur; teslimatın kalıcı yeniden denemesi ve SQL commit
ile HTTP sonucu arasındaki bildirim kaybı penceresi Adım 10'da ele alınacaktır.
Bu adım bildirim teslimatının tamamlandığını iddia etmez.

Cron adı `hapbilgi_eclub_yayin_gonderim_planlari`, sıklığı dakikada birdir.
Yeni cron **pasif kurulur**: uygulama uç noktası henüz dağıtılmadığı için
Adım 12'de dağıtım/doğrulamayla birlikte etkinleştirilir. Yeniden kurulum mevcut
aktif/pasif tercihini korur ve aynı adla tek iş bırakır. İlk kurulum kontrolleri:

- İşleyici: `plan_isleyici_rpc_var = true`, `plan_basina_tek_oneri_var = true`.
- Cron: `plan_cron_tek_kayit = true`, `plan_cron_dakikalik = true`,
  `plan_cron_aktif = false`.

Yerel testler cron anahtar kontrolünü, boş kuyruk davranışını, başarısız planda
bildirim yapılmamasını, bildirim hatasının yeniden gönderim oluşturmamasını,
RPC hatalarının gizlenmemesini ve iş/süre sınırlarını sahte bağımlılıklarla sınar.
SQL yarış, lease ve mükerrer cron davranışı Adım 11'de izole PostgreSQL'de
sınanacaktır; yerel döngü testi canlı SQL davranış testi olarak kaydedilmez.

Adım 7 yerel doğrulama: ilgili 26/26 test ve TypeScript kontrolü geçti.
Lint'te hata yok; yeni işleyici RPC'sinin şema snapshot'ında bulunmamasına bağlı
bir `olu-rpc` uyarısı var. SQL kurulumu ve cron çalışması henüz doğrulanmadı.

Kullanıcı işleyici SQL'inin iki yapısal kontrolünü `true` olarak doğruladı.
Cron kurulumunda doğrudan `cron.job` güncellemesi `42501` yetki hatası verdi.
Kurulum dosyası, aktif/pasif durumunu Supabase'in desteklediği
`cron.alter_job(job_id := ..., active := ...)` üzerinden ayarlayacak şekilde
düzeltildi. Kullanıcı düzeltilmiş cron'u tek kayıt, dakikalık ve pasif
(`true / true / false`) olarak doğruladı.

## Adım 8 — UTT yayın gönderim ve planlama ekranı

Sayfanın hedef kitle kartları, yayın türü filtreleri, yayın kartları ve mobil
akışı korunur. Gönderim kapsülleri Tümü, Gönderime Hazır, Planlananlar,
Gönderilenler sırasındadır. Gönderime Hazır yalnız UTT incelemesinin tamamlanması
anlamına gelir; geçmiş gönderim bu statüyü kaldırmaz. Alıcı ve kota uygunluğu
ayrıca sunucudan kontrol edilir. Bekleyen/işlenen planların benzersiz yayınları
Planlananlar sayacına girer. Gerçekleşmeyen planlar nedeni ile görünür;
gerçekleşen planın önerisi Gönderilenler geçmişinde yer alır.

Şimdi gönder ve Planla aynı çoklu yayın/alıcı seçim panelini kullanır.
Eski yayın başına ayrı gönderim çağrıları ve arac_id üzerinden tekrar engeli
kaldırılmıştır. Önizleme kayıt oluşturmaz. Alıcı seçenekleri sunucunun toplu
uygunluk sonucuna göre açılır; kalan ürün bazlı haftalık hak ve engel nedeni
gösterilir. Kaydetmeden önce seçim tekrar doğrulanır ve özet onaylanır.
Tek kayıt isteğinden sonra listeler yenilenir. Plan yanıtı kaybolduğunda aynı
onay işleminin anahtarı korunur; eşzamanlı çift tıklama istemcide engellenir.

Tarih ve saat kullanıcı tarafından açıkça seçilir, varsayılan saat yoktur.
Türkiye saatinde hedef hafta içi, gelecekte, en fazla takip eden hafta ve
aynı mevcut iki aylık dönem içinde olmalıdır. İki sınır birlikte uygulanır.
Plan kaydı bildirim oluşturmaz ve öğrenme süresini başlatmaz.
Geçmiş ve plan listeleri API sayfalarının tamamından alınır.

Yerel doğrulama: TypeScript kontrolü başarılı; değişen uygulama dosyalarında
lint hatası yok. Güncel olmayan sema.json nedeniyle toplu RPC için iki uyarı
vardır; şema çekmek için DB bağlantısı yapılmamıştır. Tarih, statü, API ve
işleyici testlerine ek olarak gerçek React bileşeni sahte bağımlılıklarla
sınandı: inceleme kapısı, boş saat, kota engeli, onay öncesi kayıt yapılmaması,
çoklu yayın için tek kayıt çağrısı ve yanıt kaybında anahtarın korunması.
Chrome arayüz doğrulaması araç erişimi onaylanmadığı için tamamlanamadı.
Gerçek gönderim veya plan oluşturulmadı; cron pasif bırakıldı.
## Kullanıcı düzeltmesi — Adım 9 ileri sarma maddesi

İş planının 9. adımındaki ileri sarmanın soru hakkını kapatan koşulun
düzeltileceğine ilişkin ifade yanlıştır ve iş planında düzeltilecektir.
Kullanıcının açık talimatına göre mevcut davranış doğrudur ve korunacaktır:
ileri sarma oransal puan kaybı oluşturur ve soru hakkını kapatır.
Bu davranış yeni gönderim kurgusuyla uyumsuzluk olarak değerlendirilmeyecek
ve kaldırılmayacaktır.


## Kullanıcı kapsam düzeltmeleri — Adım 9 ve Adım 10

Adım 9 geliştirme kapsamından çıkarıldı; üye kodları korunacaktır. İleri sarma
oransal puan kaybı ve soru hakkının kapanmasını korur. Yeniden gönderimde mevcut
puan davranışı da korunur; iş planındaki aksi beklenti yanlış kabul edilmiştir.
Adım 10 yalnız yayın bildirim zamanını ve bildirim hatası/yeniden deneme akışını
kontrol eder. Puan/rapor bağlantıları ve çek teslimatı kapsamdan çıkarılmıştır.

## Adım 10 — Yayın bildirim akışı doğrulaması

`tests/eclubYayinBildirimAkisi.hedef.test.ts` gerçek API, bildirim yardımcısı,
plan sarmalayıcısı ve push göndericisini transpile ederek yalnız enjekte edilmiş
sahte DB/transport bağımlılıklarıyla çalıştırır. İzin verilmeyen import reddedilir;
canlı istemci ve web-push taşıyıcısı yüklenmez. Push testindeki ortam değerleri
sahte ve testin VM kapsamındadır, uygulama ortamı değiştirilmez.

Doğrulanan davranışlar:

- Plan kaydı ve uygunluk önizlemesi bildirim çağırmaz.
- Anlık gönderimde SQL sonucu alındıktan sonra yalnız kaydedilen öneri bildirilir.
- Plan işleyicisinin başarılı sonucu aynı öneri kimliğiyle bildirilir;
  gerçekleşmeyen plan bildirilmez.
- Uygulama içi bildirim başarıyla yazıldığında push aynı öneri kimliğini taşır.
- Push geçici hatalarda aynı gövdeyle en fazla üç kez denenir (500/1000 ms
  bekleme); yayın gönderim RPC'si ve yeni bildirim insert'i bu yolda çağrılmaz.
- Kalıcı 410 abonelik hatası aboneliği pasifler, yeniden denenmez.
- Bildirim hatası tamamlanmış planı yeniden gönderime sokmaz.

Mevcut sınırlama: uygulama içi bildirim insert'i başarısız olursa yardımcı
hatayı loglayıp döner; otomatik yeniden deneme/kuyruk yoktur ve push başlatılmaz.
Yardımcı hatayı dışarı fırlatmadığından bu hata plan işleyicisindeki
`bildirim_hatasi` sayacına da yansımaz. Push üç denemede başarısız olursa daha
sonra kalıcı kuyruktan tekrar deneme bu yayın akışında yoktur. Kontrol sırasında
bu mekanizmalar eklenmedi; mevcut davranış doğrulandı.

Yeni 10 test ve mevcut plan işleyicisinin 7 testi: toplam 17/17 başarılı.
Üretim kodu veya SQL değiştirilmedi, DB'ye bağlanılmadı, gerçek gönderim/push
oluşturulmadı. Testler çağrı ve hata davranışını doğrular; canlı DB transaction
ve cihaza gerçek bildirim teslimatını doğruladıkları iddia edilmez.

## Adım 11 — Yerel sınır, yarış ve işlem zinciri testleri

Sonuç: 41/41 native PostgreSQL testi, 64/64 ilgili regresyon testi başarılı.
`npm run typecheck:build` başarılı; uygulama lint'inde hata yok. Şema
snapshot'ında yeni gönderim/işleyici RPC'leri bulunmadığı için üç uyarı var.
Test dosyalarının lint'i ve `git diff --check` de kontrol edildi.
Ayrıntılı senaryo listesi ve SQL kaynak SHA-256 değerleri
`docs/ECLUB_GONDERIM_ADIM11_TEST_SONUCLARI.json` dosyasındadır.

`tests/eclubGonderim.postgres.mjs` PostgreSQL 17.10'u yeni bir `/tmp` kümesinde
başlatır. TCP dinleme kapalıdır; tüm bağlantılar test kümesinin Unix socket'ine
kurulur, DB URL/şifre ortam değişkenleri okunmaz. Sahte temel tablolar
`tests/fixtures/eclub-gonderim-postgres.sql` dosyasından kurulur. Gerçek gönderim
SQL'leri değiştirilmeden çalıştırılır. Yeniden kurulum da sınanır. Geçmiş/due
plan senaryoları yalnız bu kümede trigger'ları geçici atlayan fixture yardımıyla
hazırlanır; asıl işlemlerde trigger ve constraint'ler aktiftir. Ayrıca gerçek
plan oluşturma, hedef anını bekleme, işleyicinin gerçekleştirmesi ve tek öneri
oluşması fixture atlatması olmadan uçtan uca SQL zincirinde doğrulandı.
İş bitiminde tüm bağlantılar kapatılır ve yerel PostgreSQL durdurulur.

Kapsam: haftalık üçüncü/dördüncü ve ürün/üye/UTT ayrımı; gönderim+plan toplamı;
ilk gönderim ve iki tekrar; önceki dönem; 15 günün bir milisaniye öncesi/tam
sınırı/sonrası; önceki ve sonraki plan; hafta sonu hedefi/hafta sonu planlama;
takip eden hafta ve mevcut iki aylık dönem sınırlarının birlikte uygulanması;
yıl ve Türkiye gece yarısı geçişleri; çoklu seçim/önizleme; eski RPC tarih/araç
girdilerinin etkisizliği; plan tekilliği ve değişmezliği; doğrudan INSERT kotası;
ikili oturumlarda gönderim yarışı, gönderim-plan yarışı ve ters alıcı sıraları;
mükerrer işleyici, lease, günü geçen plan, yetki/yayın/araç kaybı ve rollback.

Mevcut üye tamamlama/cevaplama RPC'si değiştirilmeden aynı izole veritabanında
kuruldu. Dört öğrenme aracının kanıtı/puanı/sorusu, aynı izlemede ikinci puan
oluşmaması, ileri sarma kaybı ve soru hakkının kapanması, yanlış cevapta sıfır
kayıp ve süresi geçmiş öneride puan/soru açılmaması doğrulandı. İleri sarma için
repo dosyasından mevcut tek RPC gövdesi aynen yüklendi; o migration'ın kapsam
dışı Store sorguları kurulmadı. Hafta sonu öğrenme ve 15 gün sınırı ortak
TypeScript karar fonksiyonuyla ayrıca sınandı.

Eski arac_id tekrar kuralını zorunlu tutan regresyon testi yeni yayın esaslı
kurguya güncellendi. Üretim kodu ve SQL değiştirilmedi. Supabase bağlantısı,
gerçek üye/gönderim/push ve cron etkinleştirmesi yapılmadı. Bu sonuç sahte temel
şema üzerinde yerel SQL/API/bileşen doğrulamasıdır; tam Supabase şemasının bütün
trigger'ları, tarayıcı üzerinden canlı öğrenme veya cihaz teslimatı testi değildir.
Canlı kurulum/doğrulama Adım 12 kapsamında kalır.

Tekrar çalıştırma:

- PostgreSQL binary paketi proje dışında `/tmp/hapbilgi-eclub-pg11` altındadır:
  `@embedded-postgres/darwin-arm64@17.10.0-beta.17`.
- `node tests/eclubGonderim.postgres.mjs` (yerel native PostgreSQL için paylaşılan
  bellek izni gerekir; gerçek saatli gönderim senaryoları hafta içi çalışır).
- `node --import ./tests/_alias.mjs --test tests/eclubGonderim*.test.ts tests/eclubYayin*.test.ts tests/eclubIzlemeKurali.smoke.test.ts tests/eclubOgrenmeAraciYayinKimligi.smoke.test.ts tests/eclubPuanYazmaEczane.hedef.test.ts tests/eclubGonderiAyarlari.smoke.test.ts`

## Adım 12 — Kurulum ve dağıtım hazırlığı

Operasyon sırası `docs/ECLUB_GONDERIM_OPERASYON_REHBERI.md` içindedir.
Salt okunur kurulum kontrolü ve cron/Vault/veri tutarlılığı kontrolü hazırlandı.
Cron etkinleştirme/durdurma ayrı SQL dosyalarıdır; kullanıcı çalıştırır.
BLUEBOOK yeni yayın esaslı kota, planlama sınırları, 15 günlük gerçek gönderim
süresi, durum kapsülleri ve mevcut üye davranışlarıyla güncellendi.

Yerel SQL paketi 46/46 geçti. Ek beş senaryo salt okunur kurulum kontrolünü,
gizli değerin çıktıya alınmamasını, doğrudan cron.job UPDATE yetkisi olmadan
kurulumu, tekrar etkinleştirme/durdurmayı ve eksik Vault kaydında reddetmeyi
sınar. Cron/Vault işlevleri yerel taklittir; gerçek Supabase uzantı davranışı
ve canlı HTTP teslimatı olarak sunulmaz. Mevcut Adım 11 JSON kaydı korunmuştur.

Son canlı SQL kontrolleri, uygulama dağıtımı, cron etkinleştirme ve gerçek plan
doğrulaması kullanıcı sonuçlarını bekler. Bu adım tamamlandı sayılmamıştır.

Adım 12 yerel production build: `npm run build` başarılı. Next 16.2.0 /
Turbopack derlemesi 35.3 saniyede tamamlandı; 212 statik sayfa üretildi ve
`/api/cron/eclub-yayin-gonderim` dinamik route olarak derlendi. İlk kısıtlı
ortamdaki takılma sonrası izinli ortamda tamamlandı. Bu production deployment
doğrulaması değildir. Operasyon test/build kaydı
`docs/ECLUB_GONDERIM_ADIM12_TEST_SONUCLARI.json` dosyasındadır.

Adım 12 canlı yapısal kurulum kontrolü: kullanıcı 40/40 `uygun=true`
sonucunu paylaştı. Sonuçlar Adım 12 JSON kaydına işlendi. Cron/Vault/veri
durum kontrolü, deployment ve cron etkinleştirme henüz doğrulanmadı.

Adım 12 cron/Vault/veri durum kontrolü kullanıcı tarafından doğrulandı:
cron tek/dakikalık/doğru endpoint, Vault base URL ve secret hazır; cron pasif.
Tüm plan sayıları ve iki uyuşmazlık sayacı 0. Production deployment, cron
etkinleştirme ve gerçek plan doğrulaması bekleniyor.
