# Viva — 2.2 Kullanıcı SQL Sonuçları

Tarih: 25 Ekim 2026

Kaynak: Kullanıcının sohbette paylaştığı kurulum tablosu ve eklediği test çıktısı. Ajan DB’ye erişmedi veya SQL çalıştırmadı.

## Kurulum

| Kontrol | Sonuç |
|---|---|
| katilim_fonksiyonu | true |
| anonim_erisim_kapali | true |
| istemci_rpc_kapali | true |
| sunucu_rpc_acik | true |

## Test çıktısı

| sira | test                                                       | sonuc    | detay                                                                                                                                                          |
| ---- | ---------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | 01 — Taslak etkinlikte sahip de katılım alamaz             | BAŞARILI | null                                                                                                                                                           |
| 2    | 02 — Üye ve misafir kimliği karıştırılamaz                 | BAŞARILI | null                                                                                                                                                           |
| 3    | 03 — Yalnız etkinlik sahibi sunucu rolü alır               | BAŞARILI | null                                                                                                                                                           |
| 4    | 04 — Başlangıç ve bitiş katılım kapısına taşınır           | BAŞARILI | Başlangıç öncesi token vermeme kuralı uygulama katmanında ayrıca sınanır.                                                                                      |
| 5    | 05 — Davet edilmemiş kullanıcı katılım alamaz              | BAŞARILI | null                                                                                                                                                           |
| 6    | 06 — Başka veya olmayan etkinliğe geçilemez                | BAŞARILI | null                                                                                                                                                           |
| 7    | 07 — Yalnız davet bağlantısı katılım sağlamaz              | BAŞARILI | null                                                                                                                                                           |
| 8    | 08 — Doğrulanmamış e-posta oturumu reddedilir              | BAŞARILI | null                                                                                                                                                           |
| 9    | 09 — Doğrulanmış misafir yalnız etkinliğe özel izleyicidir | BAŞARILI | null                                                                                                                                                           |
| 10   | 10 — Yanlış cookie özetiyle katılım reddedilir             | BAŞARILI | null                                                                                                                                                           |
| 11   | 11 — Süresi dolmuş misafir oturumu reddedilir              | BAŞARILI | null                                                                                                                                                           |
| 12   | 12 — Oturum yenilenince eski cookie erişemez               | BAŞARILI | null                                                                                                                                                           |
| 13   | 13 — Yeni doğrulanmış oturum izleyici kalır                | BAŞARILI | null                                                                                                                                                           |
| 14   | 14 — İptal edilmiş davet yeni token alamaz                 | BAŞARILI | null                                                                                                                                                           |
| 15   | 15 — Yenilenen davet eski bağlantıyı açmaz                 | BAŞARILI | null                                                                                                                                                           |
| 16   | 16 — Kapalı oda hazır eşleşme olarak dönmez                | BAŞARILI | null                                                                                                                                                           |
| 17   | 17 — Değişen tarihte eski oda güncel sayılmaz              | BAŞARILI | null                                                                                                                                                           |
| 18   | 18 — Firma üyesi sunucu değil katılımcı rolü alır          | BAŞARILI | null                                                                                                                                                           |
| 19   | 19 — Çıkarılmış firma üyesi yeni katılım alamaz            | BAŞARILI | null                                                                                                                                                           |
| 20   | 20 — İptal etkinliğe sahip ve misafir katılamaz            | BAŞARILI | null                                                                                                                                                           |
| 21   | 21 — Bitişi geçmiş etkinliğe katılım reddedilir            | BAŞARILI | null                                                                                                                                                           |
| 22   | 22 — EClub üyesi katılımcıdır, sunucu değildir             | BAŞARILI | null                                                                                                                                                           |
| 23   | 23 — Çıkarılmış EClub üyesi yeni katılım alamaz            | BAŞARILI | null                                                                                                                                                           |
| 24   | 24 — Katılım RPCsi yalnız sunucuya açıktır                 | BAŞARILI | null                                                                                                                                                           |
| 25   | Kapsam                                                     | BİLGİ    | Yetki RPCsi ve sıralı SQL kuralları. Daily token/medya, gerçek e-posta/cookie akışı ve iki bağlantılı yarış sınanmaz. Test kayıtları ROLLBACK ile geri alınır. |

**24 başarılı, 0 başarısız, 0 atlanan.** 25. satır kapsam bilgisidir, test sayısına eklenmedi.

Bu çıktı yetki RPC’sini ve sıralı SQL kurallarını doğrular. Gerçek görüşme, medya engeli, e-posta/cookie akışı veya iki bağlantılı yarış yapılmış sayılmaz.

2.2.08’in join() bağlantısı ve 2.2.09’un gerçek host katılımıyla doğrulaması 2.3’te açık kalır. Aktif oturumdan çıkarma/ban ve eski tokenla yeniden giriş sınırı 2.4’te bağlanacak. 2.3 başlamadı.
