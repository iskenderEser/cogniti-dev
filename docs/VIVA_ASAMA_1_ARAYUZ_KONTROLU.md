# Viva — Kullanıcı akışı ve dar ekran kontrolü

Tarih: 25 Ekim 2026

## Sonuç

Uygulama/arayüz testleri **21/21 başarılı**. `npm run typecheck:build` başarılı.
Değişen iki Viva bileşeni ve arayüz testinde ESLint: **0 hata, 0 uyarı**.
Testler gerçek TS/React bileşenlerini sahte ağ/DB/e-posta bağımlılıklarıyla çalıştırır.
Ajan veritabanına bağlanmadı; SQL veya gerçek e-posta gönderimi çalıştırmadı.

## Kontrol edilen akışlar

- Davetli üyenin listeyi görmesi; etkinlik oluşturma eyleminin sunulmaması.
- Etkinlik formu, Türkiye saati dönüşümü ve yanıt kaybında aynı işlem anahtarıyla tekrar.
- Planlanmış etkinlik oluşturma ve detayına yönlendirme.
- Düzenlemede artık kapsamda olmayan katılımcının kaldırılması.
- Sürüm çakışmasında hata gösterimi ve yazılmış başlığın korunması.
- Özel davet bağlantısı üretme ve güncel sürümle daveti iptal etme.
- Yetkisiz kullanıcının düzenleme formunu ve yönetim bağlantılarını görememesi.
- Odanın Daily için ayrılmış olması; kamera/mikrofon araçlarının yeniden üretilmemesi.
- Erişim kapanınca açık oda verisinin kaldırılması.
- Sahte taşıma katmanıyla misafir kod doğrulaması ve iptalde odanın kapanması.
- Rol, tarih, form ve giriş dönüşü kuralları; gövde/origin kontrolleri.
- Kodun yalnız davetin adresine gönderilmesi; taşıma hatası ve eksik ayar davranışı.

## Mobil/tablet için uygulanan düzenlemeler

Yalnız Viva ekranlarına uygulanan `components/viva/viva.module.css` eklendi.
Uzun düğme metinleri satıra bölünür; düğmeler mevcut alanı aşmaz ve en az 44 px yüksekliğe sahiptir.
768 px altında kart iç boşluğu 16 px, form alanı yazı boyutu 16 px olur.
Alan gruplarının varsayılan minimum genişliği kaldırıldı.
Katılımcı seçim düğmesi dar ekranda satır genişliğini kullanır.
Tarih ve misafir formu 768 px altında tek, tablet/masaüstünde iki sütun kullanmaya devam eder.
Renkler mevcut Cogniti tema değişkenlerinden gelir; yeni sabit renk eklenmedi.

Bu bölüm kod üzerinden incelenip uygulanmıştır. Gerçek tarayıcı ekran görüntüsü,
yatay taşma ölçümü, dokunmatik klavye ve iki temanın görsel kabulü yapılmadı.
Araç `Local browser use is disabled in Work settings` hatası verdiği için bu kontroller açık tutuldu.
DOM testleri CSS yerleşimini ölçmez ve bu görsel kontrollerin yerine geçmez.

## Teknik borç

Kullanıcı kararıyla gerçek e-posta teslimatı ve doğrulama kontrolü
`docs/REDBOOK.MD` içindeki **TB-03** kaydına taşındı. Viva 1. aşamasının kapanışını
bu kontrol bekletmeyecek; uygulamanın e-posta doğrulama zorunluluğu korunur.
Gerçek kod teslimatı, tarayıcıdaki misafir çerezi ve iptal/süre sonunda erişimin
kapanması izinli gerçek bir test adresiyle daha sonra doğrulanacak.

## Açık kalan doğrulama

- Gerçek tarayıcıda telefon/tablet/masaüstü ve iki tema kontrolü.
- Gerçek oturumla yönlendirme ve sayfalar arası akışın uçtan uca kabulü.
- Önceki kayıtta belirtilen çok bağlantılı yarış kontrolü yapılmadı.

SQL iş kuralları ayrı kullanıcı çıktılarıyla kayıtlıdır: ilk SQL dosyasında 27 başarılı,
2 atlandı; tamamlayıcı EClub dosyasında 7/7 başarılı. İlk iki eksik senaryo bu sonuçla kapanmıştır.

## Kullanıcı kabulü — 25 Ekim 2026

**1. aşama TAMAMLANDI.** Kullanıcı, Viva’nın Cogniti’ye kurulmasını ve ekranda görülmesini bu aşamanın kabulü olarak onayladı. Canlı telefon kontrolü push sonrasında yapılacak; elde tablet bulunmadığından fiziksel tablet testi bu aşamanın kapanışını bekletmeyecek. Gerçek e-posta kontrolü diğer modüller gibi REDBOOK TB-03 teknik borcunda izlenecek. Önceki açık test kayıtları yapılmış sayılmaz; bu kayıtlar aşamayı yeniden açık duruma getirmez. Çok bağlantılı yarış kontrolünün yapılmadığına ilişkin önceki teknik kayıt korunur. Daily bağlantısı 2., Cogniti yeteneklerinin bağlanması 3. aşamadır.
