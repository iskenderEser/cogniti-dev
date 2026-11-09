# Medikal Müdür — Eczanem mevcut yetkisinin korunması

## Durum — 9 Kasım 2026

Kullanıcı Medikal Müdürün önceden tanımlı Eczanem yayın yetkisini hatırlattı ve yanlış daraltmanın düzeltilmesini istedi. Uygulama kodu ve düzeltme SQL'i hazır; hedefli yerel testler başarılı. **9 Kasım 2026: Kullanıcı `eczanem_medikal_yayin_yetkisi_duzeltildi = true` sonucuyla Supabase düzeltme kurulumunu doğruladı.** Gerçek kullanıcı/tarayıcı/gönderim testi yapılmadı.

SQL: `scripts/sql/eczanem_medikal_yayin_yetkisi_duzelt.sql`.
Ön koşul: mevcut Eczanem 30 gün ve PM token bloklama kurulumları. Bu dosya bu kurulumlardan **sonra** çalıştırılır; önceki kurulum dosyaları tarihi migration olarak korunur.
Beklenen sonuç: `eczanem_medikal_yayin_yetkisi_duzeltildi = true`.

## Düzeltme

- Yayına alma yetkisi ortak `ECZANEM_TALEP_ACAN_ROLLER` kaynağından okunur: PM ailesi ve Medikal Müdür. PM hesabı seçimi yalnız PM ailesinde zorunludur. Medikal isteği PM hesabı alanı taşıyamaz.
- Ortak yayın onay modalı gerçek üretici rolünü alır. Medikal Eczanem yayınında PM token seçimi ve bu seçime bağlı Yayınla kilidi gösterilmez. Yayın Yönetimi ve aynı modalı kullanan Agora editöründe rol bilgisi taşınır; seçilen hesap PM handlerına iletilir.
- SQL süre kapısı Medikal çıkışını tanır, yayının aynı üreticiye ve Eczanem hedefine ait olduğunu ve yayında olduğunu denetler. Medikal çıkışına PM'nin 30 günlük dağıtım sınırı uygulanmaz. PM kuralları değişmez.
- UTT eczaneye tesliminde Medikal kaynak PM token hesabı/bloku gerektirmez. Eczane danışana tesliminde mevcut firma token tüketim fonksiyonu kullanılır; ücretsiz/muaf token tüketimi oluşturulmaz. Esnek PM hesabından tüketilmez, geriye dönük token veya iade yazılmaz.
- Ayrım yayın çıkışında kaydedilen rol/üretici üzerinden yapılır; bugünkü rol değiştirilerek PM yayınının 30 gün veya hesap koşulları aşılamaz. Eksik kaynak verisi Medikal sayılmaz.
- Sunucunun Medikal kaynak işareti UTT/eczane listelerine taşınır. PM geri sayımı ve buna bağlı seçim kilidi Medikal kartlara uygulanmaz. Gerçek gönderim isteği istemcinin muafiyet bilgisine güvenmez; kaynak verisini sunucuda tekrar okur ve SQL yeniden doğrular.
- Talep yetkileri, ürün/kazanım/puan/öğrenme aracı doğrulamaları ve diğer rollerin hedefleri genişletilmedi. Diğer roller için yeni Eczanem izni verilmedi.

## Testler

- Yerel PostgreSQL 18.6, yalnız `/tmp` Unix socket, sahte temel tablolar; gerçek mevcut süre/blok/PM09 ve yeni düzeltme SQLleri. Önceki 12 süre ve 16 blok senaryosunun ardından düzeltme kuruldu, 8 düzeltme senaryosu başarılı. Son test düzeltme sonrasında PM'nin gerçek bloklama ve teslim tüketimini ayrıca doğrular.
- Yeni senaryolar: tekrar kurulum; 60 günlük Medikal yayının UTT→eczane→danışan teslimi ve mevcut firma tüketimine tek delegasyon; Medikal PM hesabı seçemez/diğer üretici açılamaz; Medikal plan/aktivasyon; çıkış rolünün korunması; PM sınırlarının unvan değişikliğiyle aşılamaması; sahip/kapalı yayın kontrolü; PM başarılı blok/tüketim.
- Yayın API'sinde 13 hedefli test; süre yardımcı/sunucu metadata testinde 6 test; Eczanem toplu gönderim API yardımcı testinde 10 senaryo başarılı. Gerçek React modalında Medikal Yayınla kilidinin olmaması ve PM hesap zorunluluğu, iki gerçek dağıtım kartında Medikal süre kilidi/sayacı olmaması doğrulandı.
- TypeScript başarılı; hedefli ESLint 0 hata, şema snapshotındaki RPCler için 2 uyarı. Tarayıcı geometri/gerçek push teslimi ve bütün canlı firma tüketim şeması doğrulanmadı; eski tüketim delegasyonu yerel testte gözlemci stub kullanır.
- Sonuç: `ECZANEM_MEDIKAL_YETKI_TEST_SONUCLARI.json`. Yerel PostgreSQL test sonunda durduruldu. SQL kurulumu kullanıcı başarı sonucuyla doğrulandı; canlı kullanıcı/gönderim testi henüz yapılmadı. Commit/push yapılmadı.

## Yeni karar — Medikal için ortak token/süre akışı (9 Kasım 2026)

Kullanıcı yeni Medikal Eczanem yayınlarının PM ailesiyle aynı hesap seçimi/bloklama/tüketim/30 gün/serbest bırakma kurallarına bağlanmasını onayladı. Geçmiş Medikal yayınlar mevcut hesap ve tüketim yolunda korunacak. Önceki genel Medikal muafiyetinin yerini, yalnız ilk geçişte işaretlenen geçmiş Medikal yayın muafiyeti alacak. Mevcut PM motoru ortaklaştırıldı; ayrı Medikal tüketim motoru kurulmadı. Kod/SQL ve testler hazır; kullanıcı `eczanem_ortak_uretici_token_kuruldu = true` sonucuyla yeni SQL kurulumunu doğruladı. Gerçek kullanıcı gönderimi henüz canlı test edilmedi. Ayrıntı: `ECZANEM_ORTAK_URETICI_TOKEN.md`. SQL: `scripts/sql/eczanem_ortak_uretici_token.sql`.
