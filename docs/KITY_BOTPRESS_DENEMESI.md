# Kity — Botpress ile tek hesapta gerçek puan denemesi

19 Ekim 2026. İlk kapsam yalnız UTT/KD_UTT'nin kendi aylık net puanıdır.

## Durum ve sınır

Kod ve izole HTTP davranış testleri hazırlandı. Botpress/Vercel kurulumu ve oturumlu gerçek veri denemesi henüz yapılmadı. Testler gerçek handler kodunu, HMAC imzasını, Türkiye takvimini ve erişim kontrollerini çalıştırır; veritabanı ve oturum bağımlılıkları sahtedir. Test sonucu, canlı verinin veya AI yorumunun doğrulandığı anlamına gelmez.

Bu bir özel önizleme denemesidir. Botpress aracının yetkisi, bağlantıyı oluşturan tek hesaba aittir. Botpress'te soruyu yazan kişinin kimliğini otomatik doğrulamaz. Genel webchat olarak yayımlanmaz. Kity walkthrough'u, mevcut bi ve diğer roller değiştirilmez. Çok kullanıcılı kullanım için ayrı oturum–konuşma eşlemesi gerekir.

## Uygulama kurulumu

1. Yeni dosyaları aynı Vercel uygulamasına dağıt.
2. Sunucuda yalnız bu denemeye ait, en az 32 baytlık rastgele `KITY_BOTPRESS_TOKEN_SECRET` ortam değişkeni tanımla. Gizli değer sohbete yazılmaz; Botpress'e bu anahtar verilmez. Değişken yoksa her iki uç 503 ile kapalıdır.
3. Değişken eklenen Vercel sürümünü yeniden dağıt.
4. Vercel'de puanı okunacak UTT hesabıyla giriş yap. Aynı sitedeki tarayıcı geliştirici konsolunda aşağıdaki kodu çalıştır. Yalnız kısa süreli deneme token'ı panoya yazılır; Auth token'ı veya servis anahtarı alınmaz.

```js
const kityBaglantiYaniti = await fetch('/api/kity/baglanti', { method: 'POST' });
const kityBaglantiVerisi = await kityBaglantiYaniti.json();
if (!kityBaglantiYaniti.ok) throw new Error(kityBaglantiVerisi.hata);
copy(kityBaglantiVerisi.token);
```

Token 15 dakika geçerlidir. Süresi dolunca aynı işlemi tekrarla. Oturumdan çıkılması token'ı anında iptal etmez; süresi dolması veya sunucu anahtarının değiştirilmesi iptal eder. Kişinin/firmanın pasifleştirilmesi ve firma/rol değişimi her okumada yeniden denetlenir. Bir kişinin token'ını ortak kullanıcılı bota kaydetme.

## Botpress aracı

Build > Tools altında HTTP Request oluştur:

- Ad: `CognitiAylikNetPuan`
- Yöntem: GET
- Adres: `https://cogniti-dev.vercel.app/api/kity/puan`
- Sorgu parametresi: `ay` — zorunlu, `YYYY-AA`, örneğin `2026-09`; değeri soruya göre ajan belirler.
- Authentication: Bearer token. Panodaki kısa süreli token'ı yalnız bu gizli alana gir. Vibe sohbetine veya araç açıklamasına yapıştırma.
- Kullanıcı kimliği/rolü/firma parametresi eklenmez. Token'a bağlı kişi sunucuda çözülür.

Aracı Instructions/Playbook içinden referansla. Deneme davranışı:

> Aylık kişisel net puan sorusunda CognitiAylikNetPuan aracını kullan. Deneme tarihini bağlantının oluşturulduğu Türkiye takvim tarihi olarak al; tarihin değiştiği yeni bir oturumda güncelle. Ay adlarını, göreli zamanları ve takip bağlamını yıl ve aya çözerek ay parametresini gönder. Önizlemedeki Deniz örnek kayıtlarını gerçek veri sorularında kullanma. API başarılıysa yalnız dönen net_puan ve dönemi bildir. 401 bağlantının süresinin dolduğunu, 403 erişimin kapalı olduğunu, 404 puan özeti bulunmadığını, 503 verinin okunamadığını belirtir; hiçbirini sıfır puana çevirme. Başka kişinin verisini isteme veya varmış gibi yanıt verme.

İlk gerçek test sırasında eski örnek bilgi kaynağını pasife al. Deneme token'ı yalnız özel önizleme aracında tutulur; bu ayarla Publish kullanılmaz.

## Gerçek deneme kapıları

- Aynı UTT'nin raporu/kanonik puan kaynağı ile Eylül net puanını karşılaştır.
- Yeni sohbetlerde “Eylül ayında puanım kaç?” ve “Geçen ay puanım kaç?” sorularını ayrı sınayıp tool çağrısındaki ayı ve yanıtı kontrol et.
- Takip sorusunda önceki ayı doğru seçtiğini kontrol et.
- Süresi dolmuş token'da hata gösterdiğini ve örnek 1250 puana dönmediğini kontrol et.
- Başka kişi sorusunda test hesabının puanını o kişiye aitmiş gibi vermediğini kontrol et.

Canlı `get_kullanici_ozet` sıfır döndürüyorsa bu sıfırdır; daha önce örnek veride Temmuz için kayıt olmaması gerçek sistemde de kayıt bulunmayacağı anlamına gelmez. Yeni SQL veya veritabanı yazımı gerekmez.

## Kaynaklar

- [Botpress Viber araç bağlantısı ve gizli alanlar](https://botpress.com/docs/viber/build/tools-and-integrations/)
- Mevcut puan kaynağı: `lib/bi/uttPuan.ts`, `get_kullanici_ozet`.
- Yerel doğrulama: `node --import ./tests/_alias.mjs --test tests/kityBotpress.hedef.test.ts`.
