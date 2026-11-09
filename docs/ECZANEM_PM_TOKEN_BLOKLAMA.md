# PM ailesi Eczanem token bloklama

## Durum

Kod ve SQL hazır, izole yerel testler tamamlandı. **9 Kasım 2026: Kullanıcı `eczanem_pm_token_bloklama_kuruldu = true` sonucunu iletti; Supabase SQL kurulumu doğrulandı.** Bu sonuç gerçek gönderimde bloklama/tüketim testi değildir. Tarayıcıda görsel doğrulama yapılmadı. Bu çalışma rol bazlı Esnek Paket satın alma butonu/modalı veya diğer gönderim akışlarının tamamlandığı anlamına gelmez.

Kurulum: `scripts/sql/eczanem_pm_token_bloklama.sql`.
Ön koşullar: Esnek Paket Adım 1/2/3 SQLleri, PM kaynaklı Eczanem 30 günlük gönderim SQL'i ve mevcut Eczanem/token gönderim kurulumları.
Beklenen sonuç: `eczanem_pm_token_bloklama_kuruldu = true`.

## Kullanıcı kararları ve davranış

- Yalnız `pm`, `jr_pm`, `kd_pm` kaynaklı Eczanem yayınları. Diğer üreticiler bu akışa girmez.
- PM yayın onayında **Kişisel Token Hesabı** veya **Firma Token Hesabı** seçer. Seçim sunucuda yeniden doğrulanır ve yayına sabitlenir. UTT/eczane çalışanı değiştiremez. Yeni Eczanem yayını hesap seçilmeden kaydedilemez.
- UTT yayını eczaneye teslim ettiğinde o andaki aktif uygun danışanların kimlikleri sabitlenir. Aktif üyelik ve aktif danışan gerekir; E-Club geçişinde olanlar ve zaten teslim edilmiş çiftler sayılmaz. Kişi başına bir token ayrılır. Yeni üyeler aynı yayının eski bloku dışındadır; blok dışı gönderim başka hesaba aktarılmaz.
- Blok, Esnek Paket yüklemesinin tüketilmemiş `kalan` miktarını azaltmaz. Kullanılabilir miktar hesaplanırken aktif bloklar çıkarılır. Başarılı eczane→danışan teslimi aynı transaction içinde ilgili yüklemenin kalanını 1 azaltır ve bloku tüketilmiş işaretler. Yeniden denemede `ON CONFLICT` yeni satır yaratmadığından ikinci tüketim olmaz.
- Aynı yükleme farklı bloklarda fazla ayrılamaz. Hesap kilidi ile eş zamanlı ayrımlar sıralanır; önce son kullanımı yakın yüklemeler kullanılır. Seçilen hesap yetersizse UTT teslimi ve o işlemdeki bloklar birlikte geri alınır.
- Blok bitişi PM ilk çıkışı + 30×24 saat ile satın alınan tokenın son kullanım anından erken olanıdır. Süre bitince harcanmamış tokenlar artık blok sayılmaz. Satın alma ömrü devam ediyorsa yeniden kullanılabilir; satın alma ömrü de bittiyse süresi dolmuş token sayılır. İade işlemi yeni yükleme veya ikinci token yaratmaz.
- Kullanılmayan blokların serbest kalması sorguda bitiş anıyla hesaplanır; cron gecikmesine bağlı değildir. Ham blok kaydı denetim geçmişi olarak korunur. Okuma anında `bitis_at <= şimdi` olan kullanılmamış kayıt serbesttir.
- Eczane ekranında token/bakiye/hesap görünmez. Blok yetersizliği eczaneye teknik hesap detayı taşımayan gönderim hatasıyla iletilir. UTT'ye PM ile iletişime geçmesi gerektiği bildirilir.
- PM kendi yayınında hesabı, blokeli/tüketilen/serbest kalan adetleri okuyabilir. Navbar toplam/kullanılan/blokeli/kalan ayrımını gösterir. Gönderim önizlemesi de aktif Eczanem bloklarını kullanılabilir miktardan düşer.

## Eski yayın kararı

Kullanıcı soruya **“Eski yayınlar mevcut hesapla sürsün”** cevabını verdi. İlk SQL kurulumunda var olan Eczanem yayınları bir defa işaretlenir. Mevcut firma tüketim fonksiyonundan devam eder; yeni Esnek hesaba taşınmaz. Daha önce teslim edilenlere geriye dönük blok veya tüketim yazılmaz. Tekrar SQL çalıştırmak yeni yayınları eski kapsama katmaz. Eski yayınlar için de kurulmuş 30 günlük gönderim sınırı korunur. PM arayüzü eski yayında hesap değiştirme seçeneği sunmaz.

## Değişiklikler

- `scripts/sql/eczanem_pm_token_bloklama.sql`: geçiş kaydı, yayın-hesap bağı, üye bazlı blok ve teslim kaydı, UTT teslim tetikleyicisi, mevcut danışan tüketim fonksiyonunun tek tüketim yolu olarak güncellenmesi; bakiye/önizleme okumalarına blok düşümü.
- Toplu Eczanem RPC'sinde yayınlar, eski firma hesabı ve yeni hesaplar sabit sırada kilitlenir. Eski/yeni ve kişisel/ortak karma işlemlerin kısmi kayıt bırakması önlenir.
- `components/eczanem/PmTokenHesapSecimi.tsx`, yayın onay modalı/hook/API: açık hesap seçimi.
- `PmYayinTokenHesabi.tsx` ve `/yayin-yonetimi/api/eczanem-token-hesabi`: yalnız kendi firmasındaki kendi yayınına PM ailesi erişir; kimlik/firma/hesap sahibi istemciden alınmaz. Aynı köken JSON kontrolü ve `no-store`.
- Eczane ve UTT gönderim hata mesajları; ortak navbar hesap adları ve Blokeli etiketi.

## Testler ve sınırlar

- Gerçek yerel PostgreSQL 18.6; yalnız /tmp Unix socket, sahte firma/kullanıcı/üyelik/tarife tabloları. PM09, 30 gün, Esnek sipariş/özet ve bloklama SQLleri değiştirilmeden kuruldu. Eski tüketim fonksiyonuna delegasyon, bu testte gözlemci sahte fonksiyonla sınandı; eski sistemin bütün şeması yeniden kurulmuş sayılmaz.
- **16 bloklama senaryosu** başarılı: tek kurulum/tekrar, kişisel/firma ayrımı, gerçek UTT ve danışan RPC yolları, tekrar gönderim, snapshot dışı kişi, süre sonu serbestlik, hesap yetkileri, hesap değişmezliği, yetersizlikte rollback, eski yayınlar, iki bağlantıyla eş zamanlı blok ve aynı danışana tüketim, gerçek toplu RPC'de karma seçim rollback, tüm üyeler tamamlandığında sıfır blok, token ömrü ve anonim erişim.
- Önceki 30 gün **12 senaryosu** da aynı koşuda başarılı. Sonuç `ECZANEM_PM_TOKEN_BLOK_TEST_SONUCLARI.json`.
- PM hesap API'si 3 hedefli test; yayın API'si 9 hedefli senaryo (PM hesabı seçimi dahil); eczane gönderimi 10 hedefli senaryo (eczane hesabı gizliliği dahil); navbar ve PM modal/detay gerçek React bileşenleri sahte API ile geçti.
- TypeScript başarılı. Lint: 0 hata; mevcut img ve şema snapshotında yer almayan RPC'ler için 4 uyarı.
- Canlı Supabase SQL kurulumu kullanıcı sonucu ile doğrulandı; gerçek gönderimde bloklama/tüketim, gerçek kullanıcı siparişi, gerçek push teslimi ve tarayıcı/mobil geometri doğrulanmadı. Satın alma ekranı henüz bağlı olmadığından yeni Esnek token alımının uçtan uca kullanım testi satın alma hattı tamamlanınca yapılacak.

## Medikal Müdür yetkisi düzeltmesi — 9 Kasım 2026

Medikal Müdürün önceden tanımlı Eczanem yetkisi, PM'ye özel süre/hesap kontrolleri nedeniyle yanlış engellenmişti. Kullanıcı düzeltmeyi istedi. Kod ve ayrı düzeltme SQL'i hazır; yerel testler başarılı. Kullanıcı `eczanem_medikal_yayin_yetkisi_duzeltildi = true` sonucuyla kurulumu doğruladı; gerçek kullanıcı gönderimi henüz canlı test edilmedi. PM bloklama/30 gün kuralları PM ailesinde korunur; Medikal yayınlar mevcut firma tüketimiyle sürer ve bu PM kurallarına tabi değildir. Ayrıntı: `ECZANEM_MEDIKAL_YETKI_DUZELTMESI.md`.

## Yeni karar — Medikal için ortak token/süre akışı (9 Kasım 2026)

Kullanıcı yeni Medikal Eczanem yayınlarının PM ailesiyle aynı hesap seçimi/bloklama/tüketim/30 gün/serbest bırakma kurallarına bağlanmasını onayladı. Geçmiş Medikal yayınlar mevcut hesap ve tüketim yolunda korunacak. Önceki genel Medikal muafiyetinin yerini, yalnız ilk geçişte işaretlenen geçmiş Medikal yayın muafiyeti alacak. Mevcut PM motoru ortaklaştırıldı; ayrı Medikal tüketim motoru kurulmadı. Kod/SQL ve testler hazır; kullanıcı `eczanem_ortak_uretici_token_kuruldu = true` sonucuyla yeni SQL kurulumunu doğruladı. Gerçek kullanıcı gönderimi henüz canlı test edilmedi. Ayrıntı: `ECZANEM_ORTAK_URETICI_TOKEN.md`. SQL: `scripts/sql/eczanem_ortak_uretici_token.sql`.
