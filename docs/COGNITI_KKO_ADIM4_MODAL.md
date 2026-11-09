# KKÖ — Adım 4: Seçim modalı

9 Kasım 2026. Yalnız ekran hazırlandı.

- Kullandığın Kadar Öde kartının sağ altına Siparişi Tamamla butonu eklendi.
- Yalnız üretici, yönetici ve Firma Admini rollerinde, kullanıcı kimliği varken görünür.
- Ayrı `KkoSecimModali` bileşeni Cogniti ortak AlertDialog bileşenlerini kullanır.
- Modal kişisel/firma hesabını, aylık 1.500 token limitini, 9,90 TL/token fiyatını, kullanılan kadar ay sonunda faturalamayı, peşin alım olmadığını, devretmemeyi ve KDV hariç bilgisini gösterir.
- Vazgeç modalı kapatır. Kullanıcı/rol değişince önceki açık modal gösterilmez.
- Onayla butonu kayıt bağlantısı henüz kurulmadığı için pasiftir. Modalda “KKÖ seçimi henüz kullanıma açılmadı.” açıklaması görünür. Başarı bildirimi veya sahte kayıt oluşturulmaz.
- Etkinleştirme, API, SQL, token yükleme/tüketim, proforma ve faturalama eklenmedi. Bunlar bu adımın kapsamında değildir. Esnek Paket sipariş bileşeni değiştirilmedi.

## Doğrulama

`node tests/kkoSecimModali.hedef.test.cjs`: 290 doğrulama başarılı (tüm roller, içerik, hesap türü, açma/kapatma, kimlik değişimi, onayın pasifliği). Gerçek React bileşeni ve sahte ortak modal kabuğu kullanıldı; tarayıcı/görsel test yapılmadı.

`node tests/esnekPaketSiparisUi.hedef.test.cjs`: mevcut 49 doğrulama başarılı. Değişen TS/TSX ve test dosyalarında lint ve `tsc -p tsconfig.build.json --noEmit --incremental false` başarılıdır.
