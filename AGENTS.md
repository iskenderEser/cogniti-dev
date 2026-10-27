<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Zorunlu çalışma kuralı: Dar kapsam ve doğrudan teslim

1. **Doğrulanmış bulgudan devam et.** Yeni bir çelişki veya somut kanıt eksikliği yoksa tamamlanan araştırmayı tekrarlama.
2. **İstenen kapsamı koru.** Kullanıcı, eczane, ürün, dönem veya kayıt kapsamını kendiliğinden genişletme. Kapsam değişikliği gerekiyorsa gerekçeyi ve önerilen kapsamı kullanıcıya bildir; onay gelmeden genişletme.
3. **Şemayı doğrula.** Tablo ve kolon adlarını varsayarak sorgu yazma. Daha önce doğrulanan şema bilgisini kullan; eksik alanları sorguyu hazırlamadan önce doğrula.
4. **Sorunu çözen en küçük düzeltmeyi hazırla.** Yalnız somut hata risklerini karşılayan kontroller ekle; görev dışı düzenleme ve yeni özellik ekleme.
5. **Doğrulamayı hedefli yap.** Değişikliğin doğruluğunu sınayan gerekli testleri çalıştır. İlgisiz incelemeleri ve geniş test çalışmalarını teslim şartına dönüştürme. Yeterli doğrulama sağlandığında teslim et.
6. **Hazır sonucu geciktirmeden ilet.** Kullanıcı dosyayı istediğinde mevcut dosya bağlantısını hemen paylaş; test ve uygulanma durumunu açıkça belirt. Tamamlanmamış ek kontrolleri gizleme veya sonucu teslim etmek için ilgisiz işlerin bitmesini bekleme.
7. **Tamamlanmamış işi tamamlandı diye bildirme.** Hazırlama, test ve veritabanında uygulama durumlarını ayrı raporla. Kullanıcının çalıştıracağını belirttiği SQL'i kendin veritabanında çalıştırma; başarı sonucu görülmeden uygulanmış kabul etme.

## Zorunlu KVKK yurt dışı veri aktarımı kontrolü

Her yeni çalışma oturumunun başında `docs/hukuki/KVKK_YURTDISI_VERI_AKTARIMI_TAKIP.md` dosyasını oku. Dosyadaki durum `TAMAMLANDI` değilse kullanıcıya bir kez şu soruyu yönelt: “Supabase ile Türkiye KVKK Standart Sözleşme-2 sürecinde yeni bir gelişme var mı?” Kullanıcının verdiği güncel bilgiyi takip dosyasına işle. İmzalı sözleşme ve KVKK bildirim kaydı görülmeden durumu `TAMAMLANDI` olarak değiştirme. Bu kontrol, kullanıcının asıl talebi üzerindeki çalışmayı engellemez.

## İkinci zorunlu hatırlatma: E-Club çek teslimatı

E-Club'da puan karşılığı çekler eczacıya e-posta ile gönderilir; ayrıca çek bilgisi, E-Club üyesi olan ve ilgili eczanede çalışan herkesin HapBilgi hesabına push notification olarak gönderilir. Bu davranışı ilgili her geliştirme ve incelemede tekrar irdele; mevcut uygulamanın bu iş kuralını gerçekten sağladığını kod ve veri akışı üzerinden doğrulamadan doğru kabul etme.

## Hediye Takibi uçtan uca test hatırlatması

Her yeni çalışma oturumunda `docs/ECLUB_CANLI_DOGRULAMA_TAKIBI.md` dosyasındaki **Hediye Takibi uçtan uca testi** bölümünü kontrol et. Durum `TAMAMLANDI` değilse kullanıcıya oturumda bir kez “Hediye Takibi uçtan uca testleri hâlâ bekliyor.” hatırlatmasını yap. Kullanıcı canlı testi şimdilik park etti: açık talimat almadan iki aylık dönem sınırını değiştirme, test için sahte sipariş oluşturma veya fiziksel testi başlatma. Hedef test tamamlanmadan durumu `TAMAMLANDI` yapma. Bu hatırlatma kullanıcının asıl talebini engellemez.

## Zorunlu hatırlatma: Hediye Takibi test verilerinin silinmesi

Hediye Takibi görünüm testi için oluşturulan test verileri henüz silinmemiştir. Bu veriler, kullanıcı açıkça temizlik işlemini başlatana kadar korunacak; iş tamamlandığında `scripts/sql/eclub_hediye_takip_test_verisi_temizle.sql` çalıştırılarak silinecektir. Temizlik SQL'inin başarıyla çalıştırıldığı kullanıcı tarafından doğrulanmadan test verilerini silinmiş kabul etme. Hediye Takibi ile ilgili her geliştirme ve incelemede kullanıcıya “Hediye Takibi test verileri silinecek.” zorunlu hatırlatmasını yap.

## Eczanem İndirim Onayı test verisi hatırlatması

Eczanem>İndirim Onayı sekmesindeki (F) veriler silinecek

## Hatırlatma: Cogniti marka dönüşümünde 5, 7 ve 9. adımlar

Kullanıcı kararı: **5. e-posta kimliği**, **7. `cogniti.net` domain bağlantısı** ve **9. gerçek ortam son kontrolü** tek bir `cogniti.net` geçişi kapsamında birlikte ele alınacak. **6. dış platformlar adımı (6.1–6.7) tamamlandı.**

- **7 — Domain:** `cogniti.net` için DNS, Vercel/hosting bağlantısı ve HTTPS tamamlanacak. Yeni domaine bağlı Supabase Auth site/redirect adresleri, Bunny origin/domain izinleri ve uygulama/cron/ortam değişkeni değerleri bu geçişte gözden geçirilecek.
- **5 — E-posta kimliği:** Resend gönderici adı/adresi ve domain doğrulaması; `RESEND_API_KEY`, `ECLUB_DAVET_EMAIL_FROM`, `ECLUB_CEK_EMAIL_FROM`, `HAPBILGI_SITE_URL` değerleri ile hosting ayarları kontrol edilecek. Supabase Auth şifre sıfırlama e-postasının göndericisi, SMTP/şablon ayarları ve dönüş adresleri doğrulanacak. Teknik değişken adları korunacak; gizli değerler belgeye veya sohbete yazılmayacak.
- **9 — Son kontrol:** Yeni domainde giriş, gerçek davet → e-posta → şifre oluşturma → giriş ve şifre sıfırlama; logo/banner, medya, e-posta ve bildirim kimliği doğrulanıp marka geçişi kaydedilecek. Kontrollü gerçek kayıt testlerinden önce test e-postası gönderme.
- E-posta metin taslakları `docs/COGNITI_EPOSTA_SABLON_STOGU.md` ve BLUEBOOK içinde tutuluyor. Kullanıcı kapsamı **tüm sistem bildirimleri** olarak onayladı. Taslak hazırlamak, yeni otomatik gönderim veya alıcı kuralı ekleme yetkisi değildir; metin onayı ve gönderim entegrasyonu ayrı izlenecek. Çek metinlerinde sağlayıcı adı yerine **Hediye çeki** kullanılacak; şablon stoğu değişirse iki kayıt birlikte güncellenecek.

## Üçüncü zorunlu kural: Video Mimarisi ve Öğrenme Araçları Ayrımı

**Videoları ASLA diğer öğrenme araçları (PDF, Görsel, Podcast) ile aynı ortak yükleme/doğrulama paketine veya ara durum tablolarına sokma.**

1. **Doğrudan TUS & Bunny Stream Ayrımı**: Videolar doğrudan istemciden Bunny Stream TUS protokolüyle yüklenir; sunucuya uğramaz. Statik araçların (PDF/Görsel/Podcast) depolama ve yükleme mekanizmaları video için geçerli DEĞİLDİR.
2. **Asenkron Transkod Kuralı**: Bunny Stream'e TUS ile yüklenen bir video hemen işlenmez (transcoding asenkrondur). Yükleme anında `storageSize` 0 döner. Bu nedenle video aktarımının hemen arkasına senkron dosya boyutu kontrolü (`storageSize > 0`) veya blocking `yarim-yuklemeler (aktarim_tamamlandi)` doğrulamaları ASLA EKLENEMEZ.
3. **Akış Bütünlüğü**: Video yükleme tamamlanması yalnızca `PUT /uretim/api/hazir-video` uç noktası ve arka plan mutabakat / webhook zinciri üzerinden yönetilir. Araya fazladan senkron onay veya kabuk doğrulama adımları sıkıştırılamaz.

## Dördüncü zorunlu kural: Video Depolama Standardı (GUID) ve Oynatıcı Çözümlemesi

**Veritabanında video adresi olarak ASLA tam embed/play internet linki saklama; standart her zaman ham Bunny Video GUID'sidir.**

1. **DB Saklama Kuralı (GUID)**: `ogrenme_araclari.dosya_yolu`, `videolar.video_url` veya `talepler.hazir_video_url` alanlarında tam URL (`https://player.mediadelivery.net/...`) DEĞİL, yalnızca 36 karakterlik ham Bunny GUID (`fcae5775-cf9b-4283-9ec8-deb1f3b62b7c`) saklanır.
2. **Kütüphane ve Ortam Bağımsızlığı**: Bunny kütüphane numarası (`LIBRARY_ID: 707975`) ortam değişkenindedir. Veritabanına tam link yazmak veriyi ortama bağımlı kılar ve ileride token authentication/domain restriction geçişlerini imkansızlaştırır.
3. **Dinamik Çözümleme**: İstemci veya oynatıcı iframe'ine verilecek tam oynatma adresi (`https://player.mediadelivery.net/embed/{LIBRARY_ID}/{GUID}`) her zaman API / sunucu katmanında çalışma anında dinamik olarak çözümlenerek üretilir; DB'ye statik olarak yazılmaz.

## Zorunlu ölçüm zamanı standardı

HapBilgi’de günlük ölçüm yoktur. Kullanıcıya sunulan ölçüm zamanı seçenekleri yalnızca **Haftalık, Aylık, Dönemlik ve Yıllık** olabilir. Ana sayfa, rapor ve takip ekranlarında `lib/utils/raporUtils.ts` içindeki `PERIYOTLAR` ortak kaynağını kullan; ayrı bir günlük seçenek listesi oluşturma. BM ve TM ana sayfaları haftalık seçimle başlar. Teknik tarih hesaplarında gün sınırının bulunması, günlük ölçüm seçeneği sunulmasına gerekçe değildir. Yeni geliştirmelerde ve incelemelerde bu kuralı uygula.

## Çek Talebi toplam puan kontrolü

Çek Talebi sayfasındaki **Toplam Puan** değerinin haftalık kayıt ve birikim durumunu kontrol et. Yayın Tamamlama Performansı verileriyle yayın ve dönem bazında karşılaştır; 1–8. haftalarda kazanılan net puanın doğru biriktiğini doğrula.


## Zorunlu hatırlatma: Tüm rollerde yazılım testi

**Tüm rollerde yazılım testi yapılacak.**

Test yöntemi, aşağıdaki metnin aynısıdır:

Testi şu yöntemle yaptım:

1. **Ayrı bir yerel PostgreSQL kurdum.** `/tmp` altında çalıştı; Supabase’e bağlanmadı. Yalnız yerel Unix socket bağlantısı kullanıldı.

2. **Sahte test verileri hazırladım.** UTT, üye, ürün, yayın, gönderim ve plan kayıtlarını temsil eden tablolar oluşturdum. Gerçek kullanıcı verisi kullanılmadı.

3. **Repodaki SQL’leri değiştirmeden çalıştırdım.** Gönderim, kota kontrolü, plan kaydı ve plan işleyicisini bu ortamda kurdum.

4. **Her senaryo için başlangıç durumunu hazırladım.** Örneğin iki gönderim bulunan durumda üçüncüyü denedim; üç gönderim bulunan durumda dördüncünün reddedildiğini kontrol ettim. Tarih, dönem ve 15 gün sınırlarında da beklenen sonuçla gerçek sonucu karşılaştırdım.

5. **Yarışları iki bağımsız bağlantıyla sınadım.** Aynı kotayı tüketmeye çalışan işlemleri birlikte çalıştırdım. Bir işlem kilidi tutarken diğerinin beklediğini ve ilk işlem tamamlandıktan sonra güncel kotayı gördüğünü doğruladım.

6. **Planın gerçekleşme zincirini çalıştırdım.** Plan oluşturdum, hedef zamanını bekledim, işleyiciyi çağırdım. Tek öneri oluştuğunu, sürenin gerçek gönderimden başladığını ve tekrar çalıştırmanın ikinci öneri üretmediğini kontrol ettim.

7. **Uygulama testlerini ayrıca çalıştırdım.** API ve React bileşenlerini sahte bağımlılıklarla; tarih ve uygunluk yardımcılarını doğrudan test ettim. TypeScript ve lint kontrollerini de yaptım.

Sonuçları kaydettim ve yerel PostgreSQL’i durdurdum. **Bu yöntem canlı sistemin bütün şemasını veya tarayıcıdan gerçek kullanıcı deneyimini doğrulamaz; test edilen kod ve SQL davranışlarını doğrular.**

Mevcut E-Club Adım 11 test sonuçları (`docs/ECLUB_GONDERIM_ADIM11_TEST_SONUCLARI.json`):

```json
{
  "postgres": "17.10",
  "passed": 41,
  "tests": [
    "Beş migration gerçek PostgreSQL’de kurulur ve tekrar kurulabilir",
    "Haftalık üçüncü izinli, dördüncü reddedilir; farklı ürün ayrı sayılır",
    "Haftalık kota üye bazlıdır, diğer üye etkilenmez",
    "Gerçek gönderimler ile bekleyen planların haftalık toplamı üçtür",
    "İlk gönderim ve iki tekrar izinli; üçüncü tekrar reddedilir",
    "Önceki dönemden gelen yayın hedef dönemde iki tekrar hakkını kullanır",
    "15 günün bir milisaniye öncesi kapalı; tam sınır ve sonrası açık",
    "Sonraki planla 15 gün korunur; önceki plan da hesaba katılır",
    "Dönem sınırında 15 günlük bekleme kaybolmaz",
    "Hafta sonu gönderim hedefi kapalı; hafta sonundan gelecek hafta planı açık",
    "Takip eden haftanın son iş günü izinli; ikinci ileri hafta kapalı",
    "Takip eden hafta mevcut dönemi aşamaz; yıl geçişi de kapalı",
    "Türkiye gece yarısı dönem ve hafta hesabında kullanılır",
    "Plan geçmişe/şimdiki ana yapılamaz",
    "Çoklu önizleme birlikte kota hesaplar ve hiç kayıt yazmaz",
    "Çoklu anlık gönderimde aynı ürünün dördüncüsü atlanır, diğer ürün geçer",
    "Gerçek gönderim süresi 15 gündür; eski RPC istemci tarihini/aracını kullanmaz",
    "Plan kaydı rezervasyon oluşturur; öneri oluşturmaz; tekrar anahtarı tekildir",
    "Plan kimliği/zamanı ve gerçekleşmiş gönderim süresi değiştirilemez",
    "İki bağımsız oturumda üçüncü/dördüncü yarışını kilit sınırlar",
    "Eş zamanlı anlık gönderim ve plan aynı haftalık kotayı aşamaz",
    "Ters alıcı sıralı eş zamanlı toplu planlar deadlock oluşturmaz",
    "Planın gerçekleşmesi rezervasyonu iki kere saymaz; plan başına tek öneri",
    "Aynı planı iki eş zamanlı işleyici ikinci kez gönderemez",
    "Henüz gelmemiş plan ve aktif lease sahiplenilmez; süresi bitmiş lease işlenir",
    "Planın günü geçtiğinde gönderim yapılmaz ve tarih kaydırılmaz",
    "Yayın durduğunda, yetki kalktığında veya araç kapandığında plan gerçekleşmez",
    "Transaction iptalinde öneri ve gerçekleşme birlikte geri alınır; yeniden işlenebilir",
    "Anon/authenticated plan tablosuna veya yeni gönderim RPC’sine erişemez",
    "Gerçek plan oluşturma → zamanı gelmesi → tek öneri/15 günlük süre zinciri",
    "Aynı yayın iki eş zamanlı seçimde ikinci kez gönderilemez",
    "İki eş zamanlı aynı anahtarlı plan isteği tek kayıt oluşturur",
    "Gerçekleşmeyen plan rezervasyonu kota tüketmez",
    "Doğrudan INSERT de kota kapısından geçer; RPC atlanarak dördüncü kayıt açılamaz",
    "Aynı üyenin diğer UTT gönderimleri ilk UTT kotasını tüketmez",
    "UTT incelemesi tamamlanmamış yayın gönderilemez veya planlanamaz",
    "Alıcının aktif eczane bağı kalkınca plan gönderilmez",
    "Üyenin dört araçtaki tamamlaması mevcut RPC ile puan ve soru üretir",
    "İleri sarma mevcut davranışını korur: oransal kayıp ve soru hakkının kapanması",
    "Yanlış cevap sıfır kayıp, doğru cevap puan; aynı izleme tekrar cevaplanamaz",
    "15 günlük süresi geçmiş öneri tamamlanır; puan ve sorular açılmaz"
  ],
  "scope": "Yalnız yerel Unix socket, sahte temel tablolar, değiştirilmemiş gönderim SQLleri",
  "yerel_regresyon": {
    "toplam": 64,
    "basarili": 64,
    "basarisiz": 0
  },
  "typecheck": "npm run typecheck:build: başarılı",
  "lint": {
    "hata": 0,
    "uyari": 3,
    "neden": "Gönderim RPCleri sema.json snapshotında yok; DB bağlantısıyla şema çekilmedi."
  },
  "sql_sha256": {
    "eclub_yayin_gonderim_planlari.sql": "5306017dd973818f2dd5bc6df5dc3d6f99ab2c4c2696013a894c9fbf2b1b25ca",
    "eclub_gonderim_kota_ve_tarih_kontrolu.sql": "d8c3fd0f14a3f073d66c2bf2589b7e510a1a89193e89b279c7090bcee0a0ce7a",
    "eclub_gonderim_rpc_yeni_kurgu.sql": "c08002115cc7a6957b0d2cebce3dc30e5d1bbbbf1df2ebfe6b7c677824d3ef6f",
    "eclub_gonderim_api_toplu.sql": "7c97e09ecb44c69f90ce39d685944b36da53f4023ec900e878d0bdc793a05372",
    "eclub_planlanan_gonderim_isleyici.sql": "a7f59609fd1fa17d0ff5a50468a9eff9262bb5a88f87784f5c264dff7643a67f",
    "eclub_puan_yazma_fonksiyonlari_eczane.sql": "3fac690e848043cd24beabf607619817a2d3db07af770ce3a39bf9e6abb6c67c",
    "eclub_ileri_sarma_kurali.sql": "ac01e3be055ade07fd2cd4e100867a858730abb87633f4bf8d642e3040d56a66"
  }
}
```

## Cogniti token sistemi — bekleyen teknik borç (27 Ekim 2026)

Token sisteminin temel uygulaması ve SQL kurulumları yapılmıştır; aşağıdaki işler beklemektedir. Ayrıntılar `docs/COGNITI_TOKEN_PLANI.md` ve `docs/BLUEBOOK.MD` içindedir. Kullanıcı SQL dosyalarını kendisi çalıştırır; veritabanında SQL çalıştırma.

- Planlı yayının gerçek açılışında token tüketimini doğrula; plan kaydında tüketim olmadığını kullanıcı doğruladı.
- 100 token uyarısını, yetkili onayıyla 1.500 token yüklenmesini, sıfır bakiye sonrası pasife almayı ve adminin token yükleyip yeniden açmasını gerçek ekranlarda doğrula.
- Token ekranının firma rollerindeki görünümünü ve yetkilerini gerçek kullanıcılarla kontrol et; kullanıcıyla görsel düzenlemeleri ele al. Eczacılar ve eczane çalışanları token bilgisi görmez.
- Eczanem tüketiminde gönderim anındaki bağlayan UTT, bölge ve takım bilgisini koruyacak tarihsel kapsamı ele al. Şu anda mevcut bağ ve organizasyon kullanıldığından geçmiş görünüm değişebilir.
- Eş zamanlı işlem testi kullanıcı kararıyla geçildi; doğrulanmış kabul etme ve yeni bir yöntem için kullanıcı talimatını bekle.
- Token çalışması ve ilgili dosyalar henüz commit ve push edilmedi; bu işlemler kullanıcı talimatıyla yapılır.
