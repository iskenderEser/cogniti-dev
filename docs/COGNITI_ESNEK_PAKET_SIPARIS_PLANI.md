# Esnek Paket sipariş süreci

Kullanıcı kararı (9 Kasım 2026): Her adımın teknik planı onaylanır; uygulama ve hedefli testlerden sonra kısa bilgi verilir ve sonraki adıma geçiş onayı beklenir. Abonelik satın alma işlemleri ayrı dosya ve akışta geliştirilecek.

## Onaylı iş kuralları

- Üretici roller yalnız kendi kişisel bakiyeleri için satın alır.
- Yönetici roller ve Firma Admini firma ortak bakiyesi için satın alır.
- Takım Müdürü satın alamaz. Cogniti Admin satın alma sürecine dahil olmaz.
- Gönderim yetkileri satın alma yoluyla genişlemez.
- Gönderide kişisel/ortak bakiye kullanıcı tarafından seçilir. Otomatik geçiş veya bakiye birleştirme yapılmaz.
- Seçilen bakiyede yeterli token yoksa gönderim yapılmaz.
- Planlı gönderi için token ayrılır; gerçekleşince tüketilir, iptal/gerçekleşmeme halinde serbest bırakılır.
- Esnek Paket satın alımları tek seferliktir; kullanım satın alma yılının 31 Aralık sonuna kadardır.

## Adım 1 — sahiplik ve sipariş kaydı

**Hazırlama:** SQL ve sunucu modülleri hazır. **Veritabanında uygulama:** Kullanıcı Supabase SQL Editor sonucunu `cogniti_esnek_paket_siparis_adim1_kuruldu = true` olarak iletti; kurulum doğrulandı. Bu sonuç gerçek sipariş veya gönderim testi değildir. **Ürün ekranı:** Sipariş butonu/API 9 Kasım 2026 ekran bağlantısı adımında bağlandı; gerçek kullanıcı kabulü bekliyor.

- `lib/satinAlma/esnekPaket.ts`: Üretici/yönetici rol eşlemesi ve istek doğrulama.
- `lib/satinAlma/esnekPaketSunucu.ts`: Oturumdan kimlik alma, rol kapısı ve denetimli sipariş çağrısı. İstemciden firma/sahip/rol kabul edilmez.
- `scripts/sql/cogniti_esnek_paket_siparis_adim1.sql`: Bakiye sahipliği, Esnek Paket siparişleri ve sipariş başına tek yükleme. Sipariş ve yükleme aynı transaction içindedir.
- Fiyat ve tarife sürümü veritabanında güncel listeyle karşılaştırılır; sipariş anındaki birim/toplam fiyat ve satın alan kişi/rol kayda alınır. Fiyat değişiminde yeniden onay gerekir.
- Tekrar onay ve eş zamanlı istekler aynı işlem anahtarıyla tek sipariş oluşturur.
- Eski firma token havuzuna yeni satın alma yazılmaz: eski tüketim fonksiyonlarının kişisel tokenları ortak tüketmesi engellenir. Mevcut KKÖ ve geçmiş kayıtlar değiştirilmez. Yeni bakiyelerin gönderim bağlantısı sonraki adımlardadır.
- Tablolar anonim/oturumlu kullanıcıya ve doğrudan service_role yazımına kapalıdır. Fonksiyon yalnız sunucu service_role üzerinden çalışır.

**Doğrulama:** Gerçek yerel PostgreSQL 18.6, yalnız `/tmp` Unix socket, sahte temel tablolar, değiştirilmemiş kurulum SQL'i. 13 senaryo başarılı; 13 üretici ve 8 yönetici/Firma Admin rolü, kapalı roller, tenant ayrımı, fiyat, tekrar kurulum, iki bağımsız bağlantıyla eş zamanlı sipariş, atomik geri alma ve eski hesapların korunması sınandı. Sunucu modülünün 4 hedefli testi başarılı. Gerçek Supabase, gönderim ve tarayıcı deneyimi henüz doğrulanmadı. Ayrıntı: `COGNITI_ESNEK_SIPARIS_ADIM1_TEST_SONUCLARI.json`.

## Adım 2 — kişisel/ortak bakiye gösterimi

**Hazırlama:** SQL, API ve ortak navbar bileşeni hazır. **Veritabanında uygulama:** Kullanıcı `cogniti_token_bakiye_ozeti_adim2_kuruldu = true` sonucunu iletti; SQL kurulumu doğrulandı. Bu sonuç gerçek sipariş/gönderim veya görsel doğrulama değildir. **Tarayıcı:** Görsel doğrulama yapılmadı.

- `scripts/sql/cogniti_token_bakiye_ozeti_adim2.sql`: Salt okuma RPC. Kimlikten aktif firma çözülür; yalnız kendi kişisel bakiyesi ve firmanın ortak bakiyesi döner. Başka kişinin kişisel bakiyesi dönmez. Eski KKÖ kayıtları bu toplama katılmaz.
- `app/api/token-bakiyeleri/route.ts`: Oturum/rol kontrolü, sunucudan kimlik ile RPC çağrısı, `private, no-store` yanıtı. Firma/sahip sorgu parametreleri kullanılmaz. Hata, sıfır bakiye olarak dönmez.
- `components/panel/TokenBakiyeOzeti.tsx` ve CSS modülü: Kişisel Bakiyem ve Firma Ortak Bakiyesi ayrı gösterilir. Kişisel alımı yoksa kişisel özet gösterilmez. Ortak alım yoksa sıfır değerlerle açıkça belirtilir. Mobil için satır sarmalama ve alt alta yerleşim tanımlı.
- `PanelNavbar` yalnız firma kimliği bulunan iç kullanıcılarda bu bileşeni açar. Cogniti Admin/partner/eczane hesapları dışarıdadır. TM ortak bakiyeyi okuyabilir; satın alma yetkisi kazanmaz. Firma Admini için yalnız yeni okuma adresine GET/HEAD izni eklendi.
- Hesap: toplam = yükleme miktarları; kullanılan = miktar-kalan; kullanılabilir kalan = süresi dolmamış yüklemelerin kalanı; süresi dolan = süresi dolmuş yüklemelerin tüketilmemiş kalanı. Süre sonu, tüketim olarak sayılmaz. Bu hesapta `kalan` tüketilmemiş miktarı temsil eder; gelecekte rezervasyon için azaltılmayacak.
- Rezervasyon henüz bağlı değildir; ayrılan miktar bu aşamada sıfırdır. Adım 5'te gerçek rezervasyon sorgusu ile değiştirilecek, kullanılabilir kalandan düşülecek; kullanılmış tokena eklenmeyecek. Gönderim ve satın alma ekranı bu aşamada bağlı değildir.
- Sayfa geçişi, tekrar odaklanma (5 saniye sınırı), elle yenileme ve `cogniti-token-bakiye-yenile` olayı özet okumasını yeniler. Başarılı satın alma/gönderim entegrasyonları ilgili adımlarında bu olayı tetikleyecek. Kullanıcı/firma/rol değişiminde eski bileşen kaldırılır; bekleyen okuma iptal edilir.

**Doğrulama:** Gerçek yerel PostgreSQL 18.6 ile 10 bakiye senaryosu ve önceki 13 sipariş senaryosu başarılı. Dört API/validasyon testi ve gerçek React bileşeninin sahte API ile gösterim, hata ve yenileme kontrolleri başarılı. TypeScript başarılı. Lint: 0 hata; yeni RPC'nin henüz şema snapshotında bulunmaması ve navbar'daki mevcut img kullanımı için 2 uyarı. Canlı Supabase/gerçek gönderim/mobil CSS geometrisi doğrulanmış sayılmaz. Sonuç: `COGNITI_ESNEK_BAKIYE_ADIM2_TEST_SONUCLARI.json`.

## Adım 3 — ortak seçim ve gönderim önizlemesi

**Hazırlama:** Ortak bileşen, HTTP ucu ve SQL önizleme hazır. **Veritabanında uygulama:** Kullanıcı `cogniti_gonderim_onizleme_adim3_kuruldu = true` sonucunu iletti; önizleme SQL kurulumu doğrulandı. Bu sonuç gerçek gönderim veya ekran bağlantısının tamamlandığını göstermez. **Ekran bağlantısı:** Gerçek gönderim/tüketim güvenli bağlanmadan mevcut gönderim ekranlarında etkinleştirilmedi. **Tarayıcı:** Açılmadı; görsel doğrulama yok.

- `components/token/GonderimBakiyeSecimi.tsx`: Açık kişisel/ortak seçimi, kullanılabilir bakiye, gereken/ayrılacak token, uygun/atlanan kayıt, işlem sonrası kalan veya eksik miktar. Otomatik bakiye seçmez/değiştirmez. Kişisel alım yoksa yalnız ortak seçenek görünür. Yeni seçimde alt önizleme yeniden oluşturulur; A→B→A seçiminde bile eski yanıt gösterilmez. Hata sıfır veya onay gibi gösterilmez. Gerçek gönderim düğmesi içermez.
- `app/api/gonderim-token-onizleme/route.ts`: Oturum, rol, istek kökeni, içerik boyutu ve kesin girdi sözleşmesi doğrulanır. Firma/sahip/gönderen/istemci token hesabı kabul edilmez. `private,no-store` yanıtı.
- `scripts/sql/cogniti_gonderim_onizleme_adim3.sql`: Kendi kişisel veya firmasının ortak bakiyesini doğrular. Plan tarihinde sona ermiş yüklemeler kullanılabilir sayılmaz. Tüketim/rezervasyon/sipariş oluşturmaz; yanıt `gercek_gonderim_acik=false` taşır.
- İlk kaynak bağlayıcıları: üreticinin `yayin_acilis` işlemi (onaylı, henüz yayınlanmamış kendi soru seti adayları; aktif hedef rol/takım sayımı) ve UTT/KD_UTT `eclub_oneri` işlemi (mevcut `eclub_yayin_toplu_islem(...,true)` kanonik kota/tekrar/inceleme/tarih önizlemesi). Diğer akışlara sahte alıcı×yayın hesabı uygulanmaz; desteklenmeyen akışlar reddedilir. BM önerisi, C-Club ve Eczanem'in sonraki dağıtımlarının bakiye bağlantıları gerçek tüketim entegrasyonu sırasında ayrıca doğrulanacak; bu adımda uygulanmış sayılmaz.
- Yayın açılışı ile E-Club/Eczanem sonraki dağıtım ücretleri birbirine karıştırılmaz. E-Club/Eczanem hedefli ilk yayın açılışının sonraki dağıtım tüketimi burada sayılmaz. Yayının diğer içerik/puan koşulları gerçek yayın açılışında mevcut akış tarafından tekrar doğrulanır; önizleme yayın izni değildir.
- Sonraki adımda gerçek tüketim kilidi, son yeterlilik kontrolü ve ekran bağlantıları kurulmadan yeni bakiye seçimi ile gönderim açılmayacak. Planlı rezervasyon bağlantısı Adım 5'te kalır.

**Doğrulama:** Gerçek yerel PostgreSQL 18.6 ve değiştirilmemiş E-Club SQLleriyle 10 senaryo başarılı. Dört HTTP/sözleşme testi ve React'te açık seçim, yetersizlik, A→B→A, gecikmiş yanıt iptali, hata/tekrar ve planlı metin testleri başarılı. TypeScript başarılı; lint 0 hata, henüz şema snapshotında olmayan yeni RPC için 1 uyarı. Test sonucu: `COGNITI_GONDERIM_ONIZLEME_ADIM3_TEST_SONUCLARI.json`. Supabase/gerçek gönderim/mobil CSS geometrisi doğrulanmadı.

## Kalan işler ve uygulama durumu

4. Seçilen hesapta yeterlilik/tüketim: ilk iki bağlayıcı (anlık saha yayın açılışı, UTT E-Club anlık önerisi) hazır; kullanıcı `cogniti_esnek_gonderim_adim4_kuruldu = true` ile SQL kurulumunu doğruladı. Diğer gönderim kaynakları ayrıca bağlanacak. Ayrıntı: `COGNITI_ESNEK_GONDERIM_ADIM4.md`.
5. Yayın Yönetimi ileri tarihli açılışında ayırma, gerçek açılışta tüketim ve iptal/başarısız açılışta serbest bırakma hazır; kullanıcı `cogniti_planli_yayin_token_rezervasyonu_kuruldu = true` sonucuyla SQL kurulumunu doğruladı. Ayrıntı: `COGNITI_PLANLI_YAYIN_TOKEN_REZERVASYONU.md`.
6. Satın Alınan Paketler ekranına gerçek sipariş ve detay bağlantısı.
7. Token Kullanımı raporlarında bakiye ve satın alma kaynağının izlenmesi.

Siparişi tamamla butonu/modal/API entegrasyonu da ayrıca teknik plan ve kullanıcı onayıyla bağlanacak. Veri tabanındaki fonksiyonun hazır olması kullanıcıya açık satın alma akışının tamamlandığı anlamına gelmez.

## Ara öncelik — Eczanem 30 gün (kullanıcı kararı)

Adım 4'ün teknik planı konuşulurken kullanıcı önce Eczanem dağıtımına PM çıkışından itibaren 30 gün sınırı getirilmesini istedi. Bu geliştirme hazır, yerel testleri geçti; kullanıcı SQL kurulumunu `eczanem_yayin_gonderim_30_gun_kuruldu = true` sonucu ile doğruladı. Ayrıntı: `ECZANEM_GONDERIM_30_GUN.md`. Sonrasında token bloklama/tüketim ve rol bazlı Esnek Paket'in kalan adımlarına dönülecek. Ürün terimleri: **Kişisel Token Hesabı** ve **Firma Token Hesabı**; bakiye yalnız kullanılabilir kalan miktarı ifade eder. Önceki bileşenlerdeki etiketler bu terminolojiye henüz geçirilmedi.

## Eczanem token bloklama ara adımı

Kullanıcı PM ailesine özgü Eczanem bloklama/tüketim/serbest bırakma geliştirmesine izin verdi. Eski yayınlar için kararı “mevcut hesapla sürsün”. Kod/SQL ve yerel testler hazır; 9 Kasım 2026 tarihinde kullanıcı `eczanem_pm_token_bloklama_kuruldu = true` sonucu ile Supabase kurulumunu doğruladı. Gerçek gönderimde bloklama/tüketim henüz canlı test edilmedi. Ayrıntı: `ECZANEM_PM_TOKEN_BLOKLAMA.md`. Bu akış yalnız PM ailesinin Eczanem yayınlarını bağlar; diğer gönderimler ve rol bazlı satın alma hattının kalan işleri tamamlanmış sayılmaz. Navbar hesap etiketleri Kişisel Token Hesabı/Firma Token Hesabı olarak güncellendi.

## Adım 4 — ilk iki gerçek gönderim bağlantısı

Kullanıcı 4. adım uygulamasını onayladı. Üreticinin anlık UTT/BM saha açılışı ve UTT/KD_UTT anlık E-Club önerisi, açık hesap seçimi + güncel kontrol + aynı transaction içinde tüketime bağlandı. PM Eczanem blokları kullanılabilir miktardan düşülür. Yeni anlık akışlar seçilen Esnek hesabı kullanır; eski KKÖ'ye otomatik geçmez. Eski planlı işler mevcut tüketim yolunu korur. Diğer gönderim kaynakları, Adım 5 plan rezervasyonu ve satın alma ekranı tamamlandı sayılmaz.

**Hazırlama/test:** SQL ve kod hazır; yerel PostgreSQL 16 yeni + 10 önceki senaryo başarılı. Hedefli API/React, TypeScript ve lint kontrolleri geçti (4 RPC snapshot uyarısı). **Veritabanında uygulama:** 9 Kasım 2026 tarihinde kullanıcı `cogniti_esnek_gonderim_adim4_kuruldu = true` sonucu ile kurulumu doğruladı. **Canlı/tarayıcı:** Doğrulanmadı. SQL: `scripts/sql/cogniti_esnek_gonderim_adim4.sql`.

## Medikal Müdür yetkisi düzeltmesi — 9 Kasım 2026

Medikal Müdürün önceden tanımlı Eczanem yetkisi, PM'ye özel süre/hesap kontrolleri nedeniyle yanlış engellenmişti. Kullanıcı düzeltmeyi istedi. Kod ve ayrı düzeltme SQL'i hazır; yerel testler başarılı. Kullanıcı `eczanem_medikal_yayin_yetkisi_duzeltildi = true` sonucuyla kurulumu doğruladı; gerçek kullanıcı gönderimi henüz canlı test edilmedi. PM bloklama/30 gün kuralları PM ailesinde korunur; Medikal yayınlar mevcut firma tüketimiyle sürer ve bu PM kurallarına tabi değildir. Ayrıntı: `ECZANEM_MEDIKAL_YETKI_DUZELTMESI.md`.

## Yeni karar — Medikal için ortak token/süre akışı (9 Kasım 2026)

Kullanıcı yeni Medikal Eczanem yayınlarının PM ailesiyle aynı hesap seçimi/bloklama/tüketim/30 gün/serbest bırakma kurallarına bağlanmasını onayladı. Geçmiş Medikal yayınlar mevcut hesap ve tüketim yolunda korunacak. Önceki genel Medikal muafiyetinin yerini, yalnız ilk geçişte işaretlenen geçmiş Medikal yayın muafiyeti alacak. Mevcut PM motoru ortaklaştırıldı; ayrı Medikal tüketim motoru kurulmadı. Kod/SQL ve testler hazır; kullanıcı `eczanem_ortak_uretici_token_kuruldu = true` sonucuyla yeni SQL kurulumunu doğruladı. Gerçek kullanıcı gönderimi henüz canlı test edilmedi. Ayrıntı: `ECZANEM_ORTAK_URETICI_TOKEN.md`. SQL: `scripts/sql/eczanem_ortak_uretici_token.sql`.

## UTT hesap seçimi yanlışlığı — geri alma talebi (9 Kasım 2026)

UTT'nin E-Club dağıtımında token hesabı seçmesi yanlış bulundu. Kullanıcı yanlış SQL bağlantısının kaldırılmasını istedi. Kullanıcı `eclub_utt_hesap_secimi_kaldirildi = true` sonucuyla yalnız bu RPC/dalı kaldıran geri alma SQL'inin başarıyla uygulandığını doğruladı. E-Club tüketimini üreticinin seçtiği hesaba bağlama henüz yapılmadı. Saha açılışı ve PM/Medikal Eczanem korunur. Ayrıntı: `ECLUB_UTT_HESAP_SECIMI_GERI_AL.md`. SQL: `scripts/sql/eclub_utt_hesap_secimi_geri_al.sql`.

## Ortak üretici açılış tüketimi — yeni uygulama (9 Kasım 2026)

Kullanıcı E-Club yayınlarının üretici çıkışında kapsamdaki kayıtlı üye sayısı kadar, üreticinin seçtiği hesaptan tüketilmesini onayladı. UTT/BM ve E-Club yayınları aynı alıcı kaynağı/tüketim motoruna bağlandı; UTT'nin hesap seçimi ekran/API bağlantısı kaldırıldı, yeni yayının UTT dağıtımında ikinci tüketim yoktur. İK E-Club'a kapalıdır; saha yayınlarında ortak motoru kullanır. Eczanem ve geçmiş yayınların davranışı korunur. Yeni plan hesabı kaydeder, gerçek aktivasyonda tüketir; rezervasyon ayrı kalan iştir. Kod/SQL ve yerel testler hazır; kullanıcı `cogniti_ortak_yayin_anlik_tuketim_kuruldu = true` sonucuyla SQL kurulumunu doğruladı. Gerçek kullanıcıyla canlı gönderim testi henüz yapılmadı. Ayrıntı: `COGNITI_ORTAK_YAYIN_ANLIK_TUKETIM.md`. SQL: `scripts/sql/cogniti_ortak_yayin_anlik_tuketim.sql`.

## BM önerisi token tüketiminden ayrılıyor — 9 Kasım 2026

Kullanıcı BM önerisinin tokenla ilişkisi olmamasını onayladı. BM öneri tüketim tetikleyicisini ve işlevini kaldıran SQL ile API'deki token özel hata kapılarının kaldırılması hazır. Öneri yetki/tarih/haftalık-aylık limitleri korunur. Yeni tüketim yazılmayacağından token raporları yeni önerileri ücretlendirmez; geçmiş tüketim ve rapor kayıtları silinmez/iade edilmez. Yerel 6 PostgreSQL ve 4 API testi, TypeScript/lint kontrolleri başarılı. Kullanıcı `bm_oneri_token_tuketimi_kaldirildi = true` sonucuyla SQL kurulumunu doğruladı. Gerçek kullanıcıyla canlı öneri testi henüz yapılmadı. SQL: `scripts/sql/bm_oneri_token_tuketimini_kaldir.sql`. Ayrıntı: `BM_ONERI_TOKEN_TUKETIMINI_KALDIR.md`.

## İleri tarihli yayın rezervasyonu — 9 Kasım 2026

Kullanıcı yayın yönetimindeki ileri tarihli açılış alanına bağlanmasını onayladı. Yeni saha/E-Club planlarında seçilmiş hesaptan ayırma, tarih değişikliğinde yeniden ayırma, gerçek açılışta tek tüketim, iptal/başarısızlıkta bırakma ve navbar/önizleme bağlantıları hazır. Eczanem'in dağıtım bloklaması ayrı korunur; eski planlara geriye dönük ayırma yazılmaz. 15 yeni PostgreSQL senaryosu ve hedefli API/React, TypeScript/lint kontrolleri başarılı. Kullanıcı `cogniti_planli_yayin_token_rezervasyonu_kuruldu = true` sonucuyla SQL kurulumunu doğruladı. Gerçek kullanıcı ve üretim cron kabulü henüz yapılmadı. SQL: `scripts/sql/cogniti_planli_yayin_token_rezervasyonu.sql`. Ayrıntı: `COGNITI_PLANLI_YAYIN_TOKEN_REZERVASYONU.md`.


## Esnek Paket sipariş ekranı bağlantısı — 9 Kasım 2026

**Hazırlama:** Paketler ve Fiyatlar → Esnek Paket kartına “Siparişi tamamla” butonu ve Cogniti ortak onay modalı eklendi. Modal token adedi, birim fiyat, KDV hariç toplam ve role göre Kişisel Token Hesabı/Firma Token Hesabı bilgisini gösterir. Üretici kişisel, yönetici/Firma Admini ortak hesap için sipariş verir; TM ve Cogniti Admini satın alamaz. Abonelik için satın alma akışı eklenmedi.

- `components/satinAlma/EsnekPaketSiparis.tsx` yalnız Esnek Paket siparişini yönetir. Çift tıklama kilidi ve sunucudaki mevcut işlem anahtarı kullanılır. Gönderim öncesinde anahtar ve onaylanan fiyat oturum depolamasına alınır; yanıt kaybolduğunda sayfa yenilense bile aynı sipariş yeniden denenir. Belirsiz sipariş sonuçlanmadan yeni bir sipariş başlatılmaz.
- `app/api/satin-alma/esnek-paket/route.ts` aynı köken/JSON/boyut ve kesin istek kontrolünden sonra mevcut sunucu modülüne bağlanır. Firma/sahip/rol istemciden kabul edilmez. Onaylanan hesap türü yalnız sunucunun çözdüğü rolün değişmediğini kontrol eder; sahipliği seçmez.
- Esnek hesaplayıcı güncel tarife sürümünü de onaya taşır. Fiyat değişiminde modal kapanır, fiyat yeniden okunur ve kullanıcıdan yeni onay beklenir. Başarılı kayıt navbar token özetini yeniler. Hata başarı gibi gösterilmez.
- Firma Admini geçiş kuralında yalnız yeni sipariş ucunun POST yöntemi açıldı.

**Veritabanı:** Yeni SQL hazırlanmadı/çalıştırılmadı. Daha önce kullanıcı tarafından kurulduğu doğrulanan `cogniti_esnek_paket_siparis_olustur` sipariş ve yüklemeyi atomik kaydeder.

**Doğrulama:** 9 sunucu/API/yetki testi, sipariş React bileşeninde 37 davranış kontrolü ve mevcut hesaplayıcı/sayfada 55 kontrol başarılı. React testlerinde ortak modal kabuğu ve API sahtedir; gerçek sipariş bileşeni çalıştırıldı. TypeScript başarılı. Lintte hata yok; mevcut sipariş RPC'sinin şema snapshotında olmaması için bir uyarı var. SQL değişmediği için önceki PostgreSQL testleri tekrarlanmadı. Canlı sipariş, tarayıcı ve ödeme tahsilatı doğrulanmadı. Bu adım ödeme sağlayıcısı entegrasyonu içermez.

**Sıradaki işler:** Satın Alınan Paketler ekranını yeni sipariş/yükleme kayıtlarına bağlama; Token Kullanımı'nda hesap/kaynak ayrımı; gerçek kullanıcıyla uçtan uca kabul. Kullanıcının sonraki adım onayı beklenir.


## Satın Alınan Paketler — gerçek Esnek sipariş kayıtları (9 Kasım 2026)

**Hazırlama:** Admin → Firma → Satın Alınan Paketler listesi yeni Esnek Paket siparişlerine bağlandı. Satın alma tarihi (Türkiye saati), paket, satın alanın sipariş anında kaydedilmiş adı, kişisel/firma token hesabı, token miktarı, birim fiyat ve KDV hariç paket tutarı gösterilir. Detay açılımında sipariş numarası, paket tutarı, %20 KDV, genel tutar ve son kullanım zamanı bulunur. İstatistik kartı ve manuel yükleme/satın alma işlemi eklenmedi. Eski KKÖ/abonelik tabloları satın alma gibi gösterilmez; abonelik satın alma akışı henüz yoktur.

- Salt okuma RPC: `scripts/sql/cogniti_satin_alinan_paketler_okuma.sql`. Doğrudan tablo erişimi açılmaz. Aktif Cogniti Admini mevcut firma yönetimi kapsamında yalnız okur; Firma Admini yalnız kendi aktif, Firma Admini açık firmasını okuyabilir. Diğer roller bu yönetim listesine erişemez. Bu yetki satın alma yetkisi vermez.
- `GET /admin/api/firmalar/[firma_id]/satin-alinan-paketler` mevcut firma yönetimi okuma bekçisini kullanır; oturum kimliğini ve doğrulanmış firma/sayfayı RPC'ye taşır. Firma Admini geçiş kuralı yalnız kendi firma yolundaki GET/HEAD için açılır.
- Her sayfada en fazla 20 kayıt, tarih ve sipariş numarasıyla kararlı sıralama. Hata/SQL eksikliği boş liste olarak gösterilmez. Firma/sayfa değişiminde bekleyen okuma iptal edilir. Mobilde mevcut ortak tablo bileşeni kullanılır.

**Doğrulama:** PostgreSQL 18.6'da yalnız `/tmp` Unix socket ve sahte temel/sipariş kayıtlarıyla değiştirilmemiş SQL'ler çalıştırıldı; 8 senaryo geçti. Yetki, firma ayrımı, sayfalama, tekrar kurulum, tablo izninin kapalı kalması ve kayıtların değişmemesi doğrulandı. Yerel PostgreSQL durduruldu. 4 API/yetki testi ve gerçek React bileşeninin sahte API ile 27 kontrolü geçti. TypeScript başarılı, lint 0 hata; yeni RPC henüz şema snapshotında olmadığı için 1 uyarı. Bu yöntem canlı sistemin bütün şemasını veya tarayıcıdan gerçek kullanıcı deneyimini doğrulamaz; test edilen kod ve SQL davranışlarını doğrular.

**Veritabanında uygulama:** Kullanıcı `cogniti_satin_alinan_paketler_okuma_kuruldu = true` sonucunu iletti; okuma SQL kurulumu doğrulandı (9 Kasım 2026). Gerçek sipariş ve tarayıcı kabulü yapılmadı. Yeni SQL yalnız liste okur; satın alma/tüketim kayıtlarını değiştirmez.

**Sonraki iş:** Token Kullanımı ekranının kişisel/firma hesapları ve gerçek tüketim kaynaklarıyla uyumlanması. Okuma SQL kurulumu doğrulandı; sonraki adım için kullanıcının onayı beklenir.


## Token Kullanımı — kişisel/firma hesapları ve tüketim kaynakları (9 Kasım 2026)

**Hazırlama:** Admin → Firma → Token Kullanımı yeni Esnek Paket bakiyelerini ve tüketimlerini gösterir. Hesap tablosunda kişisel hesap sahibi veya Firma Token Hesabı, toplam alınan, kullanılan, blokeli/ayrılan, kullanılabilir ve süresi dolan miktarlar ayrıdır. Hesap özeti tüm zamanları kapsar. Tüketim listesi hesaba göre süzülür; aynı hesap/gönderen/yayın/gönderim türü toplanır, 50 kayıtla sayfalanır. Son tüketim, hesap, gönderen/rol, yayın/ürün, gönderim türü ve token miktarı; detayda ilk/son tüketim ve yayın kimliği bulunur.

- `scripts/sql/cogniti_firma_esnek_token_kullanimi.sql` salt okuma RPC'sidir. Anlık saha/E-Club tüketimi `cogniti_esnek_gonderim_tuketimleri`, Eczanem tüketimi yalnız `durum=tuketildi` bloklardan okunur. Eczanem gönderiminin hesabı ve üreticisi `eczanem_yayin_token_hesaplari` üzerinden çözülür; `pm_id` alanı Medikal Müdürü de kapsayan mevcut ortak kayıttır. UTT/E-Club son dağıtıcı adına yeni tüketim yazılmaz. Eski Esnek E-Club dağıtım kayıtları varsa ayrı geçmiş türüyle gösterilir; silinmez/iade edilmez.
- Blok ve plan ayırmaları mevcut `cogniti_yukleme_ayrilan` yardımcısıyla okunur. Ayrılan token tüketim listesine eklenmez; süresi dolmuş yükleme kullanılabilir sayılmaz. Rapor yükleme, tüketim veya rezervasyon yazmaz. Çoklanan yayın görünümü yanal tek kayıt okumasıyla toplamları katlamaz.
- Yeni `GET /admin/api/firmalar/[firma_id]/esnek-token-kullanimi` mevcut firma yönetimi okuma yetkisini kullanır. SQL de aktif admin/Firma Admini ve firma/hesap kapsamını doğrular. Firma Admini yalnız kendi aktif, yetkisi açık firmasını okur. Yeni tablo okuma izni veya satın alma yetkisi açılmaz.
- Eski KKÖ/önceki token raporu silinmedi; aynı sayfanın “KKÖ ve Önceki Token Kayıtları” açılımında mevcut `TokenYonetimi` bileşeniyle korunur. Yeni Esnek hesabı eski token hesabı açılmış olmasına bağlı değildir. Yeni rapor hatası eski veriyi veya sıfır tüketimi taklit etmez.
- Ad/rol etiketleri mevcut kullanıcı kaydından çözülür; organizasyon/ad/rol değişimlerinin tarihsel snapshot borcu bu adımda çözülmüş sayılmaz.

**Doğrulama:** Gerçek yerel PostgreSQL 18.6 yalnız `/tmp` Unix socket ile çalıştırıldı; Supabase'e bağlanmadı. Sahte firma, tüm rol grupları, hesap, yükleme, yayın ve tüketim/plan/blok kayıtları hazırlandı. Yeni rapor ve sipariş SQLleri değiştirilmeden, ortak ayırma işlevinin repodaki tanımıyla çalıştırıldı. 10 senaryo geçti: yetki/kapsam, PM ve Medikal hesabı, blok/gerçek tüketim ayrımı, süresi dolan ve serbest plan, hesap filtresi, kararlı sayfalama, yinelenen yayın görünümü ve salt okuma. Rapor okuma olduğu için yeni yarış/tüketim testi eklenmedi. Yerel PostgreSQL durduruldu. 5 API/validasyon/yetki testi ve gerçek React bileşeninde sahte API/tablo/KKÖ kabuğuyla 28 kontrol geçti. TypeScript başarılı; lint 0 hata, yeni RPC snapshotı için 1 uyarı. Bu yöntem canlı sistemin bütün şemasını veya tarayıcıdan gerçek kullanıcı deneyimini doğrulamaz; test edilen kod ve SQL davranışlarını doğrular. Sonuç: `COGNITI_FIRMA_ESNEK_TOKEN_KULLANIMI_TEST_SONUCLARI.json`.

**Veritabanında uygulama:** Kullanıcı `cogniti_firma_esnek_token_kullanimi_kuruldu = true` sonucunu iletti; okuma SQL kurulumu doğrulandı (9 Kasım 2026). Gerçek kullanıcı/tarayıcı kabulü doğrulanmadı. Commit/push yapılmadı.

**Kalan:** Kullanıcının onayıyla gerçek kullanıcı uçtan uca satın alma → navbar bakiyesi → hesap seçimi/gönderim → satın alma/tüketim raporları kabulü. Açık talimat olmadan gerçek sipariş veya gönderim başlatılmaz.


## TB-ESNEK-01 — gerçek kullanıcıyla uçtan uca kabul

**Durum: BEKLİYOR — teknik borç (9 Kasım 2026).** Kullanıcı gerçek kullanıcı testini teknik borca bırakmayı istedi. Açık yeni talimat olmadan gerçek sipariş, yayın veya gönderim testi başlatılmaz. Kapanma koşulu: yetkili üreticinin kişisel, yönetici/Firma Admininin firma hesabına sipariş vermesi; tek sipariş/tek yükleme; doğru navbar bakiyesi; seçilen hesapta gerçek gönderim tüketimi ve yetersiz bakiye engeli; satın alma/tüketim raporlarına doğru yansıma. Yerel testler ve SQL kurulumundaki true sonuçları bu kabulün yerine geçmez.

**Rapor erişimi hakkında mevcut sınır:** Yeni kişisel/firma hesap raporu Admin → Firma → Abonelik Yönetimi → Token Kullanımı ekranına bağlandı. Firma Admini kendi firmasını, Cogniti Admini mevcut salt okuma yönetim yetkisiyle firma kaydını okuyabilir. Üretici/yönetici rollerin `/token` sayfası bu yeni Esnek rapora henüz bağlanmadı; navbar özetleri bağlıdır. Kullanıcıya yönelik rol kapsamlı rapor bağlantısı tamamlanmış sayılmaz. Bu not o bağlantıyı geliştirme veya erişim kapsamını genişletme onayı değildir.
