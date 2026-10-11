# E-Club Canlı Doğrulama Takibi

Faz 3B ve 3C için kod, SQL ve hedef test doğrulaması tamamlanmıştır. Faz 6 otomatik E-Club regresyonu 28 Eylül 2026 tarihinde hatasız tamamlanmıştır (`5571c7d`). Gerçek Resend ve web push teslimatı ise HapBilgi canlı olmadığı ve gerçek kullanıcı barındırmadığı için kullanıcının kararıyla geliştirme fazlarından ayrılmış, canlıya çıkış öncesi operasyon kapısı olarak bırakılmıştır.

Bu liste otomatik Faz 6 sonucunu geçersiz kılmaz; Production ortam değişkenleri ve kontrollü gerçek alıcı hazır olduğunda uygulanacak dış servis doğrulamasıdır.

- [ ] Vercel Production ortamında ana eczacıya gerçek çek e-postası teslimini doğrula.
- [ ] Aynı eczanedeki bütün aktif E-Club çalışanlarının aktif aboneliklerine gerçek push teslimini doğrula.
- [ ] E-posta ve bütün push işleri tamamlanmadan çek talebinin `cek_kodlari_gonderildi` durumuna geçmediğini doğrula.
- [ ] Başarısız teslimatın outbox durumunda ve firma takip tablosunda görünür olduğunu doğrula.

Bu maddeler başarıyla tamamlanmadan E-Club çek teslimatı canlı kullanıma açılmaz. Uygulama sırası ve hata yönetimi `ECLUB_CEK_OPERASYON_REHBERI.md` belgesindedir.

## Hediye Takibi uçtan uca testi

**Durum:** BEKLEMEDE — kullanıcı kararıyla fiziksel test şimdilik park edildi (1 Ekim 2026).

**Hatırlatma:** Hediye Takibi uçtan uca testleri yapılacak.

Sipariş Takibi ekranı, UTT sipariş onayı ve ilgili SQL kurulumu hazırlanmıştır. Veritabanı kontrolünde `siparis_verildi_mi = true` olan çek talebi bulunmadığı için canlı liste ve onay işlemi henüz gerçek bir kayıtla doğrulanamamıştır. Kod ve hedef testlerin geçmesi, bu uçtan uca testin yerine geçmez.

Fiziksel test için iki hazırlık gerekir: test ortamında iki aylık kazanım/talep dönemini güvenli ve yalnız test kapsamıyla aşabilmek; düşük puan eşiği olan Çekli Puan yayınını üretim hattından açıp tek tamamlamayla çek hakkı oluşturabilmek. Bu sınırlar şimdilik değiştirilmez. Üretim davranışı test kolaylığı için kalıcı biçimde gevşetilmez.

Tamamlanma kapıları:

- [ ] Kontrollü test ortamında satış şartlı sipariş ve isteğe bağlı sipariş için ana eczacıdan gerçek uygulama akışıyla çek talebi oluşturulur.
- [ ] İlgili UTT'nin Sipariş Takibi ekranında eczane, ürün, dönem, satış koşulu, adet + mal fazlası, çek tutarı ve depo tercihi doğrulanır.
- [ ] UTT siparişi onaylar; onay zamanı kalıcı kayda yazılır, yenilemeden sonra görünür ve ikinci onay engellenir.
- [ ] Siparişsiz çek ve sipariş verilmemiş isteğe bağlı çek, Sipariş Takibi listesine girmez; Çek Takibi davranışı bozulmaz.

Bu maddeler gerçek uygulama ve veritabanı akışında doğrulanmadan durum `TAMAMLANDI` yapılmaz. Testi yeniden başlatmak ve test ortamındaki zaman sınırı yöntemini seçmek için kullanıcıdan açık talimat beklenir.

## Hediye Çeki kartları — geçici görünüm verisi

**Durum:** Test verisi eklendi; kartlar Chrome'da doğrulandı. Temizlik bekliyor (9 Ekim 2026).

Kapsam, Adil Güçlü'nün `1110000000003` GLN'li Test Eczanesi 003 hesabında kart tasarımını gerçek veri okumasıyla çalışmaktır. Abilon için 100, Laropen için 300, Forma XL için 650 örnek puan hazırlanmıştır. Yalnız üç işaretli izleme ve üç sabit UUID'li puan kaydı eklenir. Üretim hattı, gönderim, gerçek tüketim, sipariş, onay, çek teslimatı ve iki aylık takvim sınırları bu çalışma kapsamında test edilmez. Çek talep butonları ve uygulamanın talep API'si bu örnek kayıtlar için kapalıdır.

- Ekleme: `scripts/sql/eclub_cek_karti_test_verisi_ekle.sql`.
- Temizlik: `scripts/sql/eclub_cek_karti_test_verisi_temizle.sql`.
- Kimlikler: `lib/eclub/store/gorunumTesti.ts` içindeki `e120...101–103` puan kayıtları; `e120...001–003` izleme kayıtları.
- Sayfanın okuma fonksiyonunda yanlış `k.urun_adi` referansı varsa ekleme SQL'i bunu `urunler` bağıyla düzeltir; bu hata düzeltmesi temizlikte geri alınmaz.
- Kayıtlar kullanıcı açıkça temizlik istediğinde silinecek. Temizlik sonucu kullanıcı tarafından doğrulanmadan silinmiş sayılmayacak.
- Önceki Hediye Takibi (`e110...`) test kayıtları bu iki SQL'in kapsamı dışındadır ve korunur.

Bu görünüm çalışması Hediye Takibi uçtan uca testinin yerine geçmez; onun durumu `BEKLEMEDE` kalır.

**Doğrulama — 9 Ekim 2026:** Kullanıcı SQL sonucunda Abilon 100, Laropen 300 ve Forma XL 650 puanı `2026-P4` döneminde doğruladı. Sayfa yenilendiğinde üç test kartı ve salt okunur etiketleri göründü; Laropen ve Forma XL talep butonları pasif, Abilon ise puan eşiğinin altında. Ekranın toplam puanı 1.050. Henüz düzeltilmeyen mevcut gösterimler: puanı sıfır olan diğer yayınlar da listeleniyor; Abilon'da 200 puan eşiği sağlanmadığı hâlde 20 TL çek tutarı gösteriliyor. Görünüm düzenlemesinde bu iki konu ele alınacak. Test verileri silinmedi.


## Sipariş ve yıl sonu puan kapanışı — 10 Ekim 2026

**Durum:** Kullanıcı SQL’i canlı DB’de çalıştırdı ve başarı sonucunu doğruladı (10 Ekim 2026). Otomatik kapanışın gerçek zamanlı çalışması henüz gözlenmedi.

- Kurulum: `scripts/sql/eclub_puan_siparis_ve_yil_sonu_kapanisi.sql`; önceki tam devir kurulumu ve pg_cron gerektirir.
- Sipariş verilmemiş zorunlu yayın puanları talep penceresi kapandığında devredilmeden bakiyeden çıkarılır.
- Önceki yılın kullanılmamış bakiyesi Türkiye saatiyle 8 Ocak 00.00'da çıkarılır; 1–7 Ocak hakkı, yeni yıl kazanımları ve mevcut taleplere ayrılan puan korunur.
- Kazanım ve talep geçmişi korunur. Dönem koşulu sabitlenir; silinme miktarı ve nedeni ayrı kayıtta tutulur. Önceden kullanılmış, yeni kuralla çelişen bir devir varsa işlem geri alınır.
- Günlük kapanış işi ve sayfa okuması aynı hesabı kullanır. Mevcut okuma fonksiyonunun kolonları ve onay/teslimat işlevleri değiştirilmez.
- İzole doğrulama: `scripts/denetim/eclub-puan-kapanisi-dogrula.mjs`. PGlite ile yerel PostgreSQL'de sınır saatleri, devir, iptal, yıl sonu, yeni yıl, tekrar çalışma, okuma RPC'si ve erişim yetkisi test edilir; bu çalışma canlı DB'ye bağlanmaz.
- Kullanıcının SQL sonucunu doğrulaması ve cron kaydının kurulması görülmeden canlı uygulama tamamlanmış sayılmaz.
- Hediye Takibi uçtan uca testleri park edilmiş durumdadır. Mevcut test kazanım/sipariş kayıtları silinmez; kapanış kuralları bu kayıtların kullanılabilir bakiyesini etkileyebilir. Test verilerinin temizliği ayrıca kullanıcı talimatı bekler.

**Kullanıcı SQL sonucu — 10 Ekim 2026:** `sql_sonucu=TAMAMLANDI`, `silinen_bakiye_kaydi=1`, `siparissiz_zorunlu_yayin_silinen_puan=100`, `yil_sonu_silinen_puan=0`, `silinen_toplam_puan=100`. Bir zorunlu yayın bakiyesi kapandı; bu çalıştırmada yıl sonu kaynaklı silinme yok. SQL transaction’ı otomatik kapanış işinin kaydını da içerir; zamanlanmış işin gerçek çalışması ve 8 Ocak canlı sınırı ayrıca doğrulanacaktır. Kazanım/test kayıtlarının fiziksel temizliği yapılmış sayılmaz.


## Eczane E-Club firma ve ürün gezinmesi — 10 Ekim 2026

- Sidebar E-Club altında firma → Yayınlar / Hediye Çekleri / Çek Talepleri biçiminde düzenlendi. Firmaya özel sayfalar ve API kapsamı aktif eczane–firma bağı ile modül bayraklarından çözülür. Çek bildirim rozetleri ve görüldü işlemi aynı firmaya bağlıdır.
- Hediye çekleri firma sayfasında ürün başlıkları altında gösterilir; yayın bazındaki puan, koşul ve talep kayıtları korunur. Yeni yayın/çek push bağlantıları firma sayfasına gider; eski genel adresler çalışmaya devam eder. Çek e-postası ve push alıcıları değiştirilmedi.
- Chrome'da Hepifarma'nın üç sekmesi açıldı. Hediye çeklerinde 950 puan ve 185 TL, çek taleplerinde boş durum görüldü. 390 px mobilde üç stat kartı alt alta ve yatay taşma olmadan görüntülendi; mobil menü firma ağacını gösterdi. Canlı hesapta yalnız bir firma bulunduğundan çok firma ayrımı otomatik kapsam testleriyle doğrulandı.
- İlgili 26 otomatik test, Next.js rota tipleri/TypeScript ve değişen işlem dosyalarının lint kontrolü geçti. Geniş E-Club paketinde 363 testin 355'i geçti; Hediye Takibi, yayın yönetimi ve eski giriş adresi beklentilerine ait 8 mevcut kaynak kontrolü başarısız kaldı. Bu kontrollerin başarısız olduğu kaynak dosyaları HEAD ile aynı.
- Bu çalışma gerçek sipariş, çek talebi veya e-posta/push teslimatı oluşturmadı; yeni SQL gerektirmedi. Hediye Takibi uçtan uca testi beklemede, test verileri korunuyor. Sıfır puanlı yayınların mevcut görünürlüğü ayrıca düzenlenecek.


## Eczane Çek Talepleri — geçici görünüm verisi (10 Ekim 2026)

**Durum:** Kullanıcı canlı SQL sonucunda yedi örnek talebin başarıyla eklendiğini doğruladı. 10 Ekim 2026’da Chrome’da ürün bazlı takip görünümünde yedi örnek talep kontrol edildi.

- Hedef: Adil Güçlü / Test Eczanesi 003 / Hepifarma. Mevcut üç yayını kullanan `e130...001–007` talep kimlikleriyle yedi durumun görünümü hazırlanır.
- Ekleme: `scripts/sql/eclub_cek_talepleri_test_verisi_ekle.sql`; temizlik: `scripts/sql/eclub_cek_talepleri_test_verisi_temizle.sql`. SQL'in tamamı tek parça çalıştırılır.
- Kayıtlar mevcut talep API'sinden okunur; kartta Test verisi / Salt okunur etiketi taşır. İptal butonu pasiftir; API test kimliklerinin iptalini RPC'den önce reddeder. Çek kodları gerçek olmayan TEST kodlarıdır.
- `2098-P1–P6 / 2099-P1` test dönemleri mevcut puan bakiyesinden düşülmez. Gerçek puan, devir, sipariş onayı, uygulama bildirimi veya e-posta/push outbox işi üretilmez. Gerçek teslimat davranışı bu testte doğrulanmış sayılmaz.
- Kontrol: `scripts/denetim/eclub-cek-talepleri-gorunumu-dogrula.mjs`. Yedi durum ve tekrar çalıştırma, yalnız test kayıtlarının temizliği, kimlik çakışmasında geri alma ve beklenmeyen gönderim trigger'ında tam geri alma kontrolleri geçti. TypeScript kontrolü geçti.
- Beklenen sayfa statları: Toplam Talep 7 / Onay Sürecinde 5 / Teslim Edilen 1 / İptal 1. Canlı veri yüklemesi kullanıcı sonucuyla doğrulandı; Chrome görünüm kontrolü henüz yapılmadı.
- Bu yedi test kaydı diğer `e110...` Hediye Takibi ve `e120...` puan görünüm kayıtlarından ayrıdır. Kullanıcı temizlik talimatı vermeden temizlenmez; temizlik başarısı görülmeden silinmiş sayılmaz.

**Depo kontrolü düzeltmesi:** İlk SQL çalıştırması test eczanesinin depo tercihleri hazır olmadığı için geri alındı. Görünüm verisindeki sipariş verilmiş bayrağı kapatıldı; adet/MF yalnız test kartının örnek koşulu olarak gösterilir. Depo kaydı oluşturulmaz ve üretim trigger'ı değiştirilmez. Yerel kontrol, gerçek sipariş/depo trigger'ı ve depo hazır değil durumuyla yeniden çalıştırılır.

**Kullanıcı SQL sonucu:** Laropen / beklemede / 300 puan / 60 TL; Forma XL / bm_onayinda / 500 puan / 150 TL; Abilon / tm_onayinda / 300 puan / 60 TL; Laropen / onaylandi / 400 puan / 80 TL; Forma XL / teslimat_bekliyor / 500 puan / 150 TL; Laropen / cek_kodlari_gonderildi / 500 puan / 100 TL; Abilon / iptal / 300 puan / 60 TL. Yedi satırda sql_sonucu=TAMAMLANDI ve siparis_verildi_mi=false. Gerçek teslimat veya sipariş testi tamamlanmış sayılmaz. Test verileri korunuyor.


## E-Club firma ve ürün çalışma alanı — 10 Ekim 2026

- Sidebar `E-Club → Firmalar` olarak sadeleştirildi. Firma logosu ve adı `/eclub/firmalar` ekranında standart kart içinde gösteriliyor.
- Firma içinde üç genel stat, ürünlerin altı çizgili yatay sekmeleri ve Yayınlar / Hediye Çeki Talebi / Hediye Çeki Takibi toggle’ı yer alıyor. Ürün seçimi geçişlerde korunuyor.
- Chrome’da Hepifarma logosu, Laropen yayınları ve talep kartları, Abilon’un iki, Forma XL’nin iki ve Laropen’in üç örnek takip kaydı doğrulandı. Test kayıtları salt okunur kaldı; talep/iptal/sipariş/teslimat işlemi başlatılmadı.
- 390 px mobil görünümde üç stat 366 px genişlikle alt alta dizildi; sayfa genişliği ve scrollWidth 390 px. Ürün sekmesinde sağ ok tuşuyla Forma XL’den Laropen’e geçiş doğrulandı. Masaüstü 1440 px görünümü de kontrol edildi.
- İlgili 16 test, TypeScript kontrolü ve değişen geliştirme dosyalarının ESLint kontrolü geçti.
- Teslimat kod ve veri akışı yeniden incelendi: SQL outbox tek aktif eczacıya e-posta, aynı eczanedeki aktif hesapların tamamına push kaydı oluşturuyor; uygulama bildirimi de aynı eczane kapsamını kullanıyor. Push firma takip rotasına yönleniyor. Gerçek e-posta/push teslimatı bu görünüm çalışmasında denenmedi.
- Yeni SQL çalıştırılmadı. Hediye Takibi uçtan uca testleri beklemede. Hediye Takibi test verileri silinecek; kullanıcı temizlik talimatına kadar korunuyor.

## Eczanenin yayın tamamlama performansı — 11 Ekim 2026

**Durum:** Firma/ürün sayfasına taşındı; kod ve otomatik testler doğrulandı. Gerçek oturumdaki görsel ve veri karşılaştırması henüz yapılmadı.

- Yeni sıra: Yayınlar → Yayın Tamamlama Performansı → Hediye Çeki Talebi → Hediye Çeki Takibi. Ürün seçimi korunur; E-Club Store kapalıyken yayınlar ve performans açıktır.
- Dört yayın tipi, ECharts cetveli, hafta seçimi ve eczane üyelerinin tamamlanan yayın/net puan katkıları gerçek kayıtların salt okunur API hesabına bağlandı. Görünüm testi olarak işaretlenmiş izlemeler bu performans hesabına katılmaz.
- Demodaki 1–8 cetveli korunur; son bölüm iki aylık takvim döneminin kalan günlerini de kapsar. Kazanım/talep dönemleri değiştirilmedi.
- Türkiye saatindeki dönem ve hafta sınırları, puan/üye/ürün/eczane izolasyonu, mükerrer kayıtlar, 1000 satırdan büyük veri, yetkisiz erişim, hata/yeniden deneme, grafik tıklaması ve yenilemede seçim korunması test edildi. ECharts SVG çizimi 1100 ve 330 px genişlikte doğrulandı. Gerçek tarayıcı oturumu açılmadı.
- Yeni SQL, sahte sipariş, talep, bildirim veya gerçek veri yazma işlemi yapılmadı. Çek e-posta/push teslimatına müdahale edilmedi; bu belge başındaki canlı teslimat ve Hediye Takibi testlerinin bekleme durumu korunur. Hediye Takibi test verileri silinecek.

### Onaylı HTML tasarımına uyum düzeltmesi — 11 Ekim 2026

Eklenen yayın tipi seçim kontrolü ve performans Yenile butonu kaldırıldı. Nokta tıklaması yayın türünü ve haftayı birlikte seçer; alt kart bu seçimin gerçek üye katkılarını gösterir. Demodaki hafta bağlantıları korunur. Performans sekmesinde ek firma özeti kaldırıldı; demodaki üç stat kartı kullanılır. Statlar, üye satırları, simgeler, boşluklar, renkler, masaüstü/mobil cetvel ölçüleri onaylı HTML kaynağına eşlendi. SVG çizici kullanılır. Onaylı HTML'den alınan bağımsız CSS ve ECharts çizim referansına karşı eşleşme testleri eklendi; dört yayın türünün nokta tıklaması React testinde doğrulandı. Gerçek tarayıcı oturumunda görsel karşılaştırma yapılmadı.
