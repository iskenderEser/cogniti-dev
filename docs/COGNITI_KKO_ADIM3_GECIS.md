# KKÖ — Adım 3: Paket ile kullanım ayrımı

9 Kasım 2026. Kapsam yalnız aynı token hesabının geçiş kontrolleridir.

## Onaylanan kurallar

- KKÖ kullanan hesap paket alabilir. Paket etkinleştirildiğinde aynı hesabın KKÖ tercihi kapatılır.
- Önceki KKÖ tüketim kayıtları korunur; yeni satın alınan paket tokenlarından mahsup edilmez.
- Kullanılabilir paket tokenı, açık sipariş veya blokeli gönderi varsa paketten KKÖ’ye geçilemez. Kullanıcı bu kuralı açıkça onayladı.
- Bu engeller kalmadığında KKÖ seçilebilir. Aynı hesapta zaten KKÖ etkinse tekrar etkinleştirme reddedilir.
- Üretici kişisel hesabı, yönetici/Firma Admini firma hesabı üzerinde işlem yapabilir. Başka hesap türü ve yetkisiz roller reddedilir.
- Hesap durumu okunamamışsa veya miktarlar geçersizse geçiş izni verilmez.

## Hazırlanan ve henüz bağlanmayan bölüm

Ortak geçiş kontrolü `lib/satinAlma/kkoPaketGecisi.ts` dosyasındadır. Kontrol yalnız izin/ret ve sonraki tek kullanım tercihini üretir. Geçişi veritabanına uygulamaz; mevcut sipariş, tüketim veya fatura akışını değiştirmez.

Bu kontrolün çalışan sipariş/etkinleştirme işlemine bağlantısı henüz yapılmadı. Onaylanan planın 5. adımında, ilgili kişisel/firma hesabı veritabanında kilitlenerek durum okunmalı; kontrol, tercih değişikliği ve paket yüklemesi tek transaction içinde uygulanmalıdır. Eski KKÖ tüketimleri ve mevcut blokeli gönderilerin kaynak kayıtları korunmalıdır. Başarısız paket alımında KKÖ kapatılmamalıdır. İstemciden gelen durum güvenilir kaynak olarak kullanılamaz.

Modal veya etkinleştirme uç noktası eklenmedi. Proforma, faturalama, aylık yenileme ve gönderim tüketimi geliştirmesi yapılmadı. SQL hazırlanmadı; canlı veritabanı değiştirilmedi. Bu adım tek başına canlıda KKÖ–paket birlikteliğinin engellendiği anlamına gelmez.

## Doğrulama

`tests/kkoPaketGecisi.hedef.test.ts`: 6 test başarılı. Tüm izinli/yasak roller; yanlış hesap; kalan token/açık sipariş/bloke; mükerrer KKÖ; KKÖ’den pakete geçişte önceki tüketimi koruma ve sıfır mahsup; geçersiz durum kontrolleri test edildi. Adım 2 ile birlikte 11 test başarılıdır. Yeni dosyalarda lint ve `tsc -p tsconfig.build.json --noEmit --incremental false` başarılıdır. Bu testler saf kontrol fonksiyonlarını sınar; veritabanı veya gerçek kullanıcı testi değildir.
