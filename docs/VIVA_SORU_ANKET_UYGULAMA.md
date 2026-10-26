# Viva — Daily soru / anket uyarlaması

25 Ekim 2026.

Daily'nin virtual-class-demo projesindeki soru oluşturma → yayına açma → cevap toplama → sonucu gösterme → kapatma akışı, mevcut Daily Prebuilt çerçevesini koruyarak Viva'ya uyarlandı. Yerleşik bir Prebuilt anket düğmesi olduğu iddia edilmez; Daily'nin örneğindeki app-message mekanizması kullanılır.

## Kullanım

1. Yayıncı Viva etkinliğinin yayın odasında Soru / Anket alanına sorusunu ve 2–8 seçeneği yazar, Soruyu listeye ekle der. Görüşmeye katılmadan sorular hazırlanabilir.
2. Önceden hazırlanmış sorular JSON dosyasından da yüklenebilir. Örnek soru dosyasını indir bağlantısı alandadır. Daily örneğindeki question/options alanları kullanılır; tek soru nesnesi veya soru nesneleri dizisi kabul edilir. Bir dosyada en fazla 50 soru bulunabilir.
3. Yayıncı görüşmeye katıldıktan sonra listedeki Soruyu aç düğmesiyle istediği soruyu yayınlar. Aynı anda bir soru açık olur; açık soru kapatılmadan bir sonraki açılmaz.
4. Üye katılımcılar kendi Viva ekranlarında seçenek işaretler. Cevap yayıncıya ulaştığında Cevabınız alındı gösterilir. Özel davetli izleyici soruyu görebilir; mevcut yalnız izleme yetkisi gereği cevap gönderemez.
5. Yayıncı seçenek başına cevap sayısını görür ve Soruyu kapat der. Ardından başka bir soru açabilir.

## Kapsam ve saklama

Bu, Daily örneği gibi oturumluk bir soru/anket akışıdır. Hazırlanan sorular ve cevaplar sayfa belleğinde tutulur; merkezi DB kaydı, sonuç arşivi veya puanlama oluşturulmaz. Sayfa kapanır/yenilenir veya yayıncı ayrılırsa anketin kalıcı devamı ve cevapların kurtarılması sağlanmaz. Önceden hazırlanan soru dosyası kullanıcının kendi dosyası olarak korunur. Cogniti öğrenme aracı soruları ve onların hak/puan kuralları değiştirilmedi.

Yazışma ve video indirmesine ait 7 günlük kural bu oturumluk anket sonuçlarını kapsamaz; ankete arşiv veya indirme özelliği eklenmedi.

## Kontroller

- Soruyu açıp kapatan mesajın göndereni Daily katılımcı listesindeki owner ile doğrulanır; mesajın iddia ettiği rol kabul edilmez.
- Cevaplar yayıncıya özel mesajla gönderilir. İzleyici cevabı, geçersiz seçenek, kapanmış/eski sorunun cevabı reddedilir.
- Oylar Daily user_id (yoksa session_id) üzerinden tekilleştirilir; isim değiştirmek ikinci cevap oluşturmaz.
- Geç katılan kişi mevcut soruyu yayıncıdan alır. Eski sıradaki soru mesajı kapanmış soruyu yeniden açmaz.
- Anket mesajları ayrı kanaldadır; Daily sohbet mesajları karıştırılmaz. Ayrılmada anket dinleyicileri ve cevap zamanlayıcısı temizlenir.

## Doğrulama

Beş hedefli anket testi başarılı: dosya/soru doğrulama; açma–cevap–sonuç–kapatma zinciri; sahte yayıncı/izleyici/mükerrer oy reddi; geç katılım ve eski mesaj; oturum temizliği. Ayrıca mevcut Prebuilt katılım, kayıt ve herkes için bitirme akışlarından üç hedefli kontrol başarılıdır.

Veritabanına bağlanılmadı, SQL çalıştırılmadı. Bu özellik için yeni SQL veya ortam değişkeni gerekmiyor. Commit/push/deploy yapılmadı. Gerçek görüşme ve görsel kontrol kullanıcıya aittir; teslimi bekleten bir koşul olarak tutulmaz.

## Kaynaklar

- Daily anlatımı: https://www.daily.co/blog/building-e-learning-applications-with-daily/#polls
- İncelenen örnek: https://github.com/daily-demos/virtual-class-demo/blob/main/contexts/PollProvider.js
- Form, seçenek ve sonuç ekranları: https://github.com/daily-demos/virtual-class-demo/tree/main/components/Call
- Daily API: https://docs.daily.co/reference/daily-js/instance-methods/send-app-message
