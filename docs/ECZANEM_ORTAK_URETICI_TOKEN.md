# Eczanem ortak üretici token akışı — PM ailesi ve Medikal Müdür

## Durum — 9 Kasım 2026

Kullanıcı yeni Medikal Eczanem yayınlarının PM ile aynı hesap seçimi, bloklama, 30 günlük süre, tüketim ve serbest bırakma kurallarını kullanmasını onayladı. Geçmiş Medikal yayınlara müdahale edilmeyecek; mevcut hesap/tüketim yolunda kalacaklar.

Kod ve SQL hazır, hedefli yerel testler başarılı. **9 Kasım 2026: Kullanıcı `eczanem_ortak_uretici_token_kuruldu = true` sonucuyla Supabase kurulumunu doğruladı.** Gerçek kullanıcı/tarayıcı/gönderim kabulü yapılmadı.
SQL: `scripts/sql/eczanem_ortak_uretici_token.sql`.
Beklenen sonuç: `eczanem_ortak_uretici_token_kuruldu = true`.
Ön koşullar: mevcut PM 30 gün/blok kurulumu ve `eczanem_medikal_yayin_yetkisi_duzelt.sql`. Bu migration son sırada uygulanır. Önceki SQL dosyaları tarihsel migration olarak korunur.

## Davranış

- Ortak yetki kaynağı `ECZANEM_TALEP_ACAN_ROLLER`: `pm`, `jr_pm`, `kd_pm`, `med_md`. Diğer üreticilere yeni Eczanem yetkisi verilmez.
- Yeni Medikal yayını da Kişisel Token Hesabı/Firma Token Hesabı açık seçimiyle açılır. Yayın Yönetimi modalı, yayın API'si, yayın satırındaki hesap özeti ve hesap RPC kapısı aynı ortak rol kapsamını kullanır.
- Ayrı bir Medikal blok/tüketim motoru yazılmadı. Mevcut tetikleyiciler ve işlevler genişletildi. `eczanem_pm_token_*`, `pm_id` ve bileşenlerin eski teknik adları uyumluluk için korunur; Medikalde de aynı kayıtlar ve kilitler kullanılır.
- UTT eczaneye teslimde o andaki uygun aktif Eczanem üyeleri için seçilen hesaptan blok ayırır. Başarılı danışan teslimi aynı bloktan bir token tüketir. Eksik blok/yetersizlikte işlem geri alınır; otomatik hesap değiştirme yoktur.
- Yeni yayının 30×24 saati gerçek ilk üretici çıkışından başlar. Plan kaydı başlangıcı başlatmaz. Durdurma/devam etme süreyi yenilemez. Kayıtlı çıkış rolü ve üretici kimliği korunur.
- Süre dolunca yeni dağıtım kapanır. Kullanılmamış blok sorgu anında serbest sayılır; yeni yükleme/iade tokenı yaratılmaz. Yüklemenin kendi son kullanımı geçmişse kullanılabilir tokena dönmez. Bu davranış mevcut PM akışıyla aynıdır.
- UTT ve eczane yayın kartları yeni Medikal yayınlarda kalan süreyi ve son dağıtım tarihini gösterir. Eczane token hesabı/bakiye bilgisi görmez.

## Eczanem üyelerine gönderimde token tüketimi — 12 Kasım 2026

- Üretici yayın için token hesabını seçer. 30 günlük dağıtım süresi yayının ilk gerçek açılışında başlar. UTT, yayının bu süre içinde eczaneye iletilmesini ve eczanenin danışanlara dağıtımını takip eder.
- UTT yayını eczaneye ilk ilettiğinde, o anda uygun olan her danışan için üreticinin seçtiği hesaptan 1 token ayrılır. Tüketim, eczacı veya teknisyen yayını token ayrılan danışana başarıyla gönderdiğinde kaydedilir. Her gerçekleşen danışan gönderimi için ayrılan 1 token kullanılır.
- İlk iletimde token ayrılan danışanlar yayın ve eczane bazında kaydedilir. Sonradan eklenen danışanlar o yayının ayrımına dahil edilmez.
- Süre sonunda gönderilmeyen danışanlar için ayrılan tokenlar serbest kalır. Yüklemenin kullanım süresi devam ediyorsa bu tokenlar aynı hesapta yeniden kullanılabilir. Bu işlem firma ile Cogniti arasında hak devri oluşturmaz.

## Geçmiş Medikal yayınlar

- Migration yayın tablosunu transaction süresince kilitler ve ilk kurulumda var olan Medikal Eczanem yayın/planlarının kimliklerini bir defa işaretler. Çıkış snapshotı varsa kaynak rolü o kayıttan alınır; çıkış olmamış planlarda mevcut üretici rolü kullanılır. PM hesap bağı bulunan yayın geçmiş Medikal kapsamına alınmaz.
- Bu kimlikler mevcut eski tüketim listesine de eklenir. Yayının tarihi, kaynağı, token miktarı veya eski gönderimleri değiştirilmez; geriye dönük blok/tüketim/iade oluşturulmaz.
- Geçmiş Medikal plan aktive olduğunda da eski tüketim yolunda kalır. Kullanıcı eski yayın hesabını yeni Esnek hesaba çeviremez.
- Tekrar kurulum yeni yayınları geçmiş kapsama eklemez. Medikal süre muafiyeti artık yalnız bu işaretli geçmiş yayınlar içindir; yeni Medikal yayın muaf değildir.
- Sunucu, kendi erişim kontrolünden geçmiş yayın kimlikleri için süre snapshotını ve geçmiş işaretini okur. Eksik şema/okuma hatası muafiyet sayılmaz. İstemcinin gönderdiği muafiyet/kimlik/firma alanları dağıtım yetkisi değildir; SQL tekrar kontrol eder.

## Testler

- PostgreSQL 18.6, yalnız `/tmp` Unix socket, sahte temel tablolar; Supabase bağlantısı yok. Önceki 12 süre + 16 blok + 8 Medikal yetki düzeltmesi senaryosunun ardından ortak migration kuruldu. Tarihi testlerde Medikal reddi/muafiyeti önceki migration davranışını sınar; yeni son davranışı aşağıdaki ortak testler doğrular.
- **11 ortak senaryo başarılı:** kurulum/tekrar, geçmiş Medikal 60 günlük yayın ve plan korunması, yeni hesap zorunluluğu, uygun üyeye blok, gerçek teslim ve tekrar, 30 gün sonunda dağıtım kapanması/serbestlik, yeni yayının tekrar kurulumda eskiye katılmaması, gerçek plan aktivasyonundan süre başlangıcı, hesap değişmezliği/başka üretici ve yetkisiz rol reddi, ortak hesap yetersizliğinde rollback/kişisel hesabın korunması, anonim erişim engeli.
- Yayın API 13; ortak hesap API 3; süre/metadata 7; toplu danışan gönderimi 10 hedefli test başarılı. Gerçek React modalında Medikal hesap seçimi zorunluluğu ve PM davranışı; iki gerçek kartta süre/istisna gösterimi doğrulandı. Gecikmiş yanıt veya sahte miktarla tüketim yapılmaz.
- `npm run typecheck:build`: başarılı. Hedefli lint: 0 hata, mevcut img ve RPC şema snapshotı için 4 uyarı.
- Eski firma tüketimi yerel testte gözlemci stub ile sınanır; bütün canlı tüketim şeması veya gerçek push teslimi doğrulanmış sayılmaz. Yerel PostgreSQL test sonunda durduruldu.
- Test sonucu: `ECZANEM_ORTAK_URETICI_TOKEN_TEST_SONUCLARI.json`. SQL kurulumu kullanıcı başarı sonucuyla doğrulandı; gerçek kullanıcı gönderimi henüz canlı test edilmedi. Commit/push yapılmadı.
