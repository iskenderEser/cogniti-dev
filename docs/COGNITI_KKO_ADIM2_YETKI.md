# KKÖ — Adım 2: Rol ve hesap kuralları

9 Kasım 2026. Kapsam yalnız yetki altyapısıdır.

- Üretici roller yalnız Kişisel Token Hesabı için yetkilidir.
- Yönetici roller ve Firma Admini yalnız Firma Token Hesabı için yetkilidir.
- TM, Cogniti Admini ve diğer roller yetkisizdir.
- Ortak ekran/sunucu rol kontrolü `lib/satinAlma/kkoYetkisi.ts` içindedir.
- Sunucu yardımcısı oturumu, güncel rolü, kullanıcının ve firmanın aktifliğini doğrular. Firma ve kişisel hesap sahibi oturumdan belirlenir; istemciden kimlik kabul edilmez.
- Etkin KKÖ hesabını yeniden etkinleştirmeyi reddeden kontrol hazırdır. Hesap durumu okunamamışsa izin verilmez.

## Uygulama sınırı

Henüz bu yardımcıları çağıran seçim ekranı veya etkinleştirme uç noktası yoktur. Modal 4. adımda, kayıt bağlantısı 5. adımda yapılacaktır. 5. adımda durum veritabanında ilgili hesap kilitlenerek okunmalı; mükerrer etkinleştirme kontrolü ve kayıt aynı işlemde yapılmalıdır. Bu adım eş zamanlı kayıt güvencesi kurulduğu anlamına gelmez.

Esnek Paket, proforma, faturalama, token tüketimi veya aylık yenileme değiştirilmedi. Yeni SQL hazırlanmadı veya veritabanında çalıştırılmadı.

## Doğrulama

`tests/kkoYetkisi.hedef.test.ts`: 5 test başarılı. Tüm tanımlı roller, kişisel/firma hesabı ayrımı, mükerrer/bilinmeyen etkinlik durumu, oturum ve okuma hataları, pasif kullanıcı/firma kontrol edildi. Sunucu bağımlılıkları sahtedir; gerçek kullanıcı ve veritabanı testi yapılmadı. Yeni dosyalarda lint başarılıdır. `next typegen` ardından `tsc -p tsconfig.build.json --noEmit --incremental false` başarılıdır.
