# Viva — 2.3 Daily Prebuilt teslimi

Tarih: 25 Ekim 2026

**Durum: Teknik geliştirme tamamlandı. Görsel ve gerçek görüşme testleri kullanıcı tarafından yapılacak. 2.4 başlamadı.**

- Daily JS 0.94.0 sabitlendi; SDK yalnız istemcide, katılım sırasında yüklenir.
- Üye ve özel davetli aynı VivaOdaAlani bileşenini kullanır. Mevcut katılım API’leri bağlandı; token yalnız join() parametresidir, URL’ye veya kalıcı tarayıcı deposuna yazılmaz.
- Sunucu/zaman/oda beklemesi, yeniden katılma ve erişim hataları bağlandı. Bekleme sırasında iframe açılmaz.
- Tek iframe oluşturma, geç yanıtı iptal etme, StrictMode, yerel ayrılma, pagehide ve kaldırılmada SDK destroy temizliği kuruldu.
- Kamera, mikrofon, cihaz kontrolü, paylaşım, sohbet ve el kaldırma Daily Prebuilt’ten gelir. İzleyici için kamera/mikrofon kaynağı açılmaz.
- Türkçe, Cogniti CSS renklerinden Daily tema API’si, mobil görüşme yüksekliği ve desteklenen tarayıcılarda Daily tam ekran düğmesi bağlandı. iframe içeriğine CSS/DOM müdahalesi yapılmadı.
- Daily’nin hazır ayrılma eylemi sonrası yeniden katılma ve Cogniti etkinliğine dönüş vardır. Herkes için bitirmenin kalıcı Viva durumuna bağlanması 2.4 kapsamındadır.

## Mevcut doğrulama

88/88 Viva testi (21 yeni + 67 önceki); tip kontrolü başarılı; değişen dosyalarda lint 0 hata/0 uyarı. Viva rotalarının Next compile kontrolü başarılı. Bu derleme tam production/deployment testi değildir; sayfa ön üretimi yapılmadı.

Yeni SQL gerekmedi; DB’ye erişilmedi veya SQL çalıştırılmadı. Commit/push yapılmadı. Daily SDK Node >=22.14.0 ister; yerel Node 24.14.0 ile doğrulandı.

## Kullanıcıya ait görsel doğrulama

Kullanıcının açık kararı: tüm görsel testleri kullanıcı yapacak. Tarayıcı aracı Work ayarlarında kapalıdır. Gerçek görüşme, sunucu katıldıktan sonra bekleyen kişinin girişi, kamera/mikrofon ve paylaşım deneyimi ile telefon/tablet görünümü yapılmış sayılmaz. Bunlar teknik teslimi engelleyen ajan işleri olarak tutulmayacak.

Manuel akış: Viva’da etkinliği aç → Yayın odasını aç → Görüşmeye katıl. Sunucu ve davetli ayrı oturumlarda denenir. Görüşmeden ayrılma ve etkinlik bilgilerine dönüş kontrol edilir.

## Sonraki adım

Kullanıcı devam dediğinde 2.4: başlatma, ayrılma, herkes için bitirme ve erişim iptalinin aktif görüşmeye uygulanması. Bu teslimle 2.4 başlatılmadı.
