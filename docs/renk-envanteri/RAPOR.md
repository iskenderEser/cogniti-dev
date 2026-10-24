# HapBilgi görsel renk envanteri

**İnceleme tarihi:** 17 Ekim 2026, Türkiye saati.  
**Referans:** Repodaki mevcut çalışma ağacı; dosyaların SHA-256 değerleri tam JSON içinde kayıtlıdır.

## 1. Kapsam ve bütün listeye erişim

| İncelenen | Sonuç |
| --- | --- |
| Kaynak dosyası | 1205 |
| Renk/görünüm bulgusu içeren dosya | 300 |
| Kaynak konumuyla kaydedilen inceleme kaydı | 18971 |
| Renk/gradyan/anahtar ifade kataloğu | 1765 |
| Normalleştirilmiş HEX ifadeleri; alpha dahil | 1377 |
| Uygulama kaynağı kapsamındaki HEX ifadeleri | 1024 |
| Pill/rozet/yuvarlak kontrol adayı | 469 |
| CSS değişken tanımı | 172 |
| Depodaki statik görsel varlığı | 18 |
| AST/CSS ayrıştırma hatası | 0 |

Bir kaynak kullanımı; renk bileşeni, tam stil ifadesi ve Tailwind sınıfı olarak birden fazla inceleme kaydı üretebilir. Bu sayılar ekranda aynı anda görünen öğe sayısı veya algısal olarak ayrı renk sayısı değildir.

- [Görsel ve aranabilir renk kataloğu](renk-katalogu.html): renk örnekleri ve her ifadenin bütün kaynak konumları.
- [Bütün renk ifadeleri](TUM_RENKLER.md): tam renk/gradyan listesi.
- [Dosya bazında bütün kullanımlar](DOSYA_BAZINDA_TUM_KULLANIMLAR.md): bütün dosya/satır, özellik, koşul ve ifadeler.
- [Pill ve yuvarlak kontrol indeksi](PILL_VE_YUVARLAK_KONTROLLER.md): adlandırılmış bileşenler ve inline adaylar.
- [CSS değişkenlerinin bütün tanımları](CSS_DEGISKENLERI.md).
- [Tam CSV](tum-kullanimlar.csv) ve [tam JSON](renk-envanteri.json): kısıtlanmamış kayıtlar, bağlamlar, saydamlıklar, seçiciler ve dosya imzaları.
- [Özel bileşenlerin doğrulanmış tabloları](ozel-bilesenler.json): rol/durum/pill eşlemeleri ve HOYK gün renkleri.
- [Kapsam kontrolü](DOGRULAMA.json): bağımsız ham renk taraması ve kritik kaynak kontrolleri.

### Dahil edilen kaynak türleri

TS/TSX/JS/JSX sabitleri ve ifadeleri; CSS Modules ve global CSS; Tailwind renk sınıfları ve alpha ekleri; JSX SVG fill/stroke/stop değerleri; CSS ve SVG gradyanları; Canvas renk hesapları; ECharts renk ayarları; gölgeler, outline/ring ve border renkleri; hover/focus/active/aria/data-state/dark/disabled sınıfları; saydamlık, pulse animasyonu ve görüntü filtreleri; URL içine kodlanmış SVG rengi; PWA manifest renkleri. SQL/altyapı kaynakları da renk ifadesi bakımından tarandı.

`node_modules`, derleme çıktıları, test beklentileri ve düz metin doküman örnekleri uygulama rengi olarak sayılmadı. Kurulu Tailwind tema dosyası sınıf karşılıklarının kaynağı olarak okundu; renkli HTML tasarım prototipleri ayrıca kaydedildi.

PNG/JPEG/WebP/ICO içeriği görsel varlık listesinde bulunur. Fotoğrafın her pikseli bir arayüz renk sabiti değildir. Uzaktaki yüklenmiş kapak/banner/logoların pikselleri, iframe içindeki Bunny oynatıcı arayüzü ve tarayıcının kendi varsayılan kontrolleri repo dışındaki içeriklerdir; bunlar için sabit renk uydurulmadı. Kaynakta dinamik verilen alan/ifade tam kayıtta korundu. Bu çalışma veritabanı veya canlı kullanıcı verisi sorgusu içermedi.

### Kaynak kapsamları

| Kapsam | İnceleme kaydı |
| --- | --- |
| Tasarım prototipi | 1763 |
| Tema ve rehber çalışması | 896 |
| Uygulama kaynağı | 16312 |

“Tema ve rehber çalışması” içinde son eklenen `app/tema.css` de bulunur: mavi/ortak tanımları genel uygulamaya yüklenir; yeşil tanımlar seçilen kapsama göre uygulanır. Demo/prototip renkleri mevcut sayfaların renkleriyle karıştırılmadan etiketlenmiştir. Uygulama kaynaklarında bulunmak, her kod yolunun her rolde aynı anda çizildiği anlamına gelmez.

## 2. Mevcut sitenin ana renk aileleri

| Alan | Kaynakta görülen renkler | Kullanım / kaynak |
| --- | --- | --- |
| Beyaz ve açık yüzeyler | #ffffff; #f9fafb; #f3f4f7; #f7f9fc; #f8fafc | Kart, panel, sayfa ve giriş zeminleri. [app/login/page.tsx:18](/Users/iskendereser/Desktop/hapbilgi/app/login/page.tsx:18) |
| Marka ve eylem vurgusu | #bc2d0d; #56aeff; #237ac8; #2563eb | Bordo marka; genel tema mavisi; sade kontrol/E-Club mavisi; yayın/puan mavisi. [components/panel/PanelNavbar.tsx:13](/Users/iskendereser/Desktop/hapbilgi/components/panel/PanelNavbar.tsx:13) |
| Eski ortak metin ailesi | #111827; #1f2937; #374151; #6b7280; #737373 | Başlık, ana/ikincil metin ve sol menü. [components/panel/SolListe.tsx:130](/Users/iskendereser/Desktop/hapbilgi/components/panel/SolListe.tsx:130) |
| E-Club ve yeni kontrol metinleri | #203653; #20324c; #40556d; #617590; #718198; #71859d; #8190a3 | Başlık, açıklama, alan etiketi, tarih ve sayısal bilgi. [components/kontrol/sade-kontroller.module.css:3](/Users/iskendereser/Desktop/hapbilgi/components/kontrol/sade-kontroller.module.css:3) |
| Kenar/ayırıcı aileleri | #e5e7eb; #dbe5ef; #dfe7f1; #e3eaf2; #e7edf4; #e8eef5 | Kart, form, menü, tablo ve raf çizgileri. [components/kontrol/sade-kontroller.module.css:5](/Users/iskendereser/Desktop/hapbilgi/components/kontrol/sade-kontroller.module.css:5) |
| Aktif sol menü | Metin #185fa5; zemin rgba(86,174,255,0.12); halka rgba(86,174,255,0.35) | Normal metin #374151; hover zemin rgba(0,0,0,0.05). [components/panel/SolListe.tsx:130](/Users/iskendereser/Desktop/hapbilgi/components/panel/SolListe.tsx:130) |
| Başarı ve olumsuz durumlar | #16a34a; #15803d; #065f46; #dc2626; #e24b4a; #bc2d0d | Farklı durum sözlükleri ve bileşenler. İşlevleri ayrı satırlarda kayıtlıdır. [components/HataMesaji.tsx:18](/Users/iskendereser/Desktop/hapbilgi/components/HataMesaji.tsx:18) |

Bu tablo ana ailelerin okuma rehberidir. Her ton ve bütün alpha varyantları **TUM_RENKLER.md** dosyasında eksiksiz kayıtlıdır. Mevcut sitede tek bir “mavi” ya da tek bir “gri” değeri bulunmuyor.

## 3. E-Club HOYK ilerleme çerçevesi — ayrıntılı çözümleme

Kaynaklar: [lib/eclub/hoykSureCercevesi.ts:4](/Users/iskendereser/Desktop/hapbilgi/lib/eclub/hoykSureCercevesi.ts:4); [components/eclub/EclubHoykSureCercevesi.tsx:6](/Users/iskendereser/Desktop/hapbilgi/components/eclub/EclubHoykSureCercevesi.tsx:6); [app/(panel)/eclub/panel/_components/EclubFirmaVideoKatalogu.tsx:93](/Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/panel/_components/EclubFirmaVideoKatalogu.tsx:93).

| Bileşen | Renk / davranış |
| --- | --- |
| Başlangıç yeşili | RGB(22,163,74) = #16a34a |
| Orta durak sarısı | RGB(217,147,0) = #d99300 |
| Son kırmızı | RGB(220,38,38) = #dc2626 |
| Çizim | Canvas 2D; 3,5 px; yuvarlak uç/köşe; dış taşma 3,5 px. Her yaklaşık 1 px parça için renk yeniden hesaplanır. |
| Uzunluk | Çevre × clamp(geçen gün / 15, 0, 1). 0. günde çizgi uzunluğu sıfırdır. Üst kenarın sol yuvarlak köşe sonundan başlayıp saat yönünde uzar. |
| Renk hesabı | Çevre konumu 0–0,5: yeşil→sarı. 0,5–1: sarı→kırmızı. Her RGB kanalı doğrusal karışıp Math.round ile yuvarlanır. |
| 15. güne geçiş | Uzunluk 450 ms yumuşatılarak ilerler; sonrasında bütün görünür çizgi 320 ms içinde kırmızıya karışır. İlk yüklemede zaten 15. gündeyse başlangıçtan kırmızıdır. |
| Süresi geçmiş, tamamlanmamış | Animasyonlu çerçeve yerine ortak kartın #dc2626 renkli 2 px sabit çerçevesi. |
| Tamamlanmış | Ortak kartın #2563eb renkli 2 px sabit çerçevesi; ilerleme Canvas’ı verilmez. |
| Sınır | İlerleme rengi ve kırmızılaşma oranı kaynak fonksiyonuyla hesaplanır; üç ana durak arasındaki ara tonlar aşağıda ve fonksiyonda tanımlıdır. |

### Gün sonu / çizgi ucu renkleri

| Geçen gün | Çevre oranı | RGB | HEX |
| --- | --- | --- | --- |
| 0 | 0% | rgb(22,163,74) | #16a34a |
| 1 | 6.67% | rgb(48,161,64) | #30a140 |
| 2 | 13.33% | rgb(74,159,54) | #4a9f36 |
| 3 | 20% | rgb(100,157,44) | #649d2c |
| 4 | 26.67% | rgb(126,154,35) | #7e9a23 |
| 5 | 33.33% | rgb(152,152,25) | #989819 |
| 6 | 40% | rgb(178,150,15) | #b2960f |
| 7 | 46.67% | rgb(204,148,5) | #cc9405 |
| 8 | 53.33% | rgb(217,140,3) | #d98c03 |
| 9 | 60% | rgb(218,125,8) | #da7d08 |
| 10 | 66.67% | rgb(218,111,13) | #da6f0d |
| 11 | 73.33% | rgb(218,96,18) | #da6012 |
| 12 | 80% | rgb(219,82,23) | #db5217 |
| 13 | 86.67% | rgb(219,67,28) | #db431c |
| 14 | 93.33% | rgb(220,53,33) | #dc3521 |
| 15 | 100% | rgb(220,38,38) | #dc2626 |

0. gün rengi fonksiyon çıktısıdır; kartın çevresinde henüz çizgi görünmez. Ara animasyon karelerinin rengi günler tablosuyla sınırlı değildir: önce konuma göre iki durak karıştırılır, sonra kırmızılaşma oranıyla #dc2626’ya karıştırılır. Tam hesap [lib/eclub/hoykSureCercevesi.ts:16](/Users/iskendereser/Desktop/hapbilgi/lib/eclub/hoykSureCercevesi.ts:16) içindedir.

### Açılan yayındaki süre/durum pili

[app/(panel)/eclub/panel/_components/EclubVideoOynatici.tsx:81](/Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/panel/_components/EclubVideoOynatici.tsx:81) zemin olarak aynı gün rengi fonksiyonunu kullanır. Tamamlanmış yayın #2563eb; süresi geçmiş yayın #dc2626 olur. Aktif RGB zemininin doğrusal parlaklığı 0,179’dan büyükse yazı #172a44, diğer durumda #fff olur. Bu yüzden bu pilin yazı rengi de duruma göre değişir.

## 4. Ortak HOYK kartının bütün renk katmanları

[components/yayin/YayinKarti.tsx:120](/Users/iskendereser/Desktop/hapbilgi/components/yayin/YayinKarti.tsx:120) aşağıdaki katmanları taşır. Bu dosyadaki bütün kaynak kullanımları tam listede mevcuttur.

| Katman / durum | Renk ifadesi |
| --- | --- |
| Kart gövdesi | var(--hoyk-kart-zemini, #fff); normal border-gray-200; shadow-sm, hover:shadow-md |
| Kapak alt zemini | bg-gray-100; gerçek kapak yoksa aşağıdaki araca özgü gradyan |
| Durum kapsülü | rgba(0,0,0,0.04); inset 0 0 0 0.5px rgba(0,0,0,0.08) |
| Yeni / yarım kaldı / izlendi | text-blue-600 / text-amber-600 / text-gray-700 |
| Döngü ve kategori | Döngü #1e3a8a; kategori text-gray-600; ayırıcı text-gray-300 |
| Başlık / ürün ID | text-gray-900 / text-gray-400 |
| Tarih ve izlenme metni | text-gray-500 |
| Firma-talep kimliği | #bc2d0d |
| Beğeni | Normal text-gray-400; hover:text-gray-600; seçili text-red-500 ve fill-current. Etkileşim kapalı dalında da text-red-500 atanıyor. |
| Favori | Normal text-gray-400; hover:text-blue-500; seçili sayı text-blue-500, yıldız fill/text #2563eb. Etkileşim kapalı dalı text-blue-500. |
| Puan pili | linear-gradient(to right, #1e3a8a 0%, #2563eb 55%, #3b82f6 100%); yazı #fff; shadow-xs |
| Ek puan pili | linear-gradient(to right, #267d39 0%, #2e9143 55%, #3db856 100%); yazı #fff; shadow-xs |
| Baştan izle alanı | bg-amber-50 / text-amber-700 |

E-Club üye kartı sarmalayıcısı, ortak kartın durum kapsülünü ve durum metnini kapatır (`kapsulZeminiGoster=false`, `durumGoster=false`). Böylece yukarıdaki normal kart kapsülü E-Club’ın her varyantında çizilmiş kabul edilmez. Firma rozeti açıksa zemin #1e3a8a, yazı beyaz, kenar white/40; oynat düğmesi zemini #10233a/65, kenarı white/45 ve ikonu beyazdır. Kaynak: [app/(panel)/eclub/panel/_components/EclubFirmaVideoKatalogu.tsx:91](/Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/panel/_components/EclubFirmaVideoKatalogu.tsx:91).

## 5. Öğrenme aracı türü pilleri ve varsayılan kapaklar

Pill renk sözlüğü: [lib/ogrenmeAraci/turSunumu.ts:3](/Users/iskendereser/Desktop/hapbilgi/lib/ogrenmeAraci/turSunumu.ts:3). Uygulama: [components/ogrenme-araci/YayinTuruPill.tsx:25](/Users/iskendereser/Desktop/hapbilgi/components/ogrenme-araci/YayinTuruPill.tsx:25).

| Tür | Metin | Sözlük zemini | Uygulanan zemin | Kenar |
| --- | --- | --- | --- | --- |
| Video | #1d4ed8 | #dbeafe | #dbeafee8 | white/60 |
| Podcast | #7e22ce | #f3e8ff | #f3e8ffe8 | white/60 |
| Dijital Broşür | #047857 | #d1fae5 | #d1fae5e8 | white/60 |
| Literatür | #b45309 | #fef3c7 | #fef3c7e8 | white/60 |

Zemine eklenen `e8`, 232/255 ≈ %90,98 opaklıktır. Kenar %60 beyazdır; blur ve shadow da bileşenin görünümüne katılır. Bunları yalnız sözlükteki altı karakterli HEX’lerle değerlendirmek eksik sonuç verir.

| Varsayılan kapak | Gradyan durakları | Ek ayrıntı |
| --- | --- | --- |
| Video | #1e3a8a → #0f172a | Beyaz ikon; white/95 başlık |
| Podcast | #2a1343 → #140824 | Apple simgesi #b150e2 → #6821a8; simge içi beyaz |
| Dijital broşür | #064e3b → #022c22 | Beyaz ikon ve metin |
| Literatür | #78350f → #451a03 | Beyaz ikon ve metin |
| Bağımsız büyük podcast kapağı | #2a1343 → #1a0c2d → #120721 | Ayrı PodcastVarsayilanKapak varyantı; shadow-inner |
| Kapak üstündeki tür etiketi | bg-black/40; text-white/80 | Araç pill’inden ayrı etiket |

Kaynaklar: [components/ogrenme-araci/AracVarsayilanKapak.tsx:52](/Users/iskendereser/Desktop/hapbilgi/components/ogrenme-araci/AracVarsayilanKapak.tsx:52); [components/ogrenme-araci/PodcastKapakGorseli.tsx:14](/Users/iskendereser/Desktop/hapbilgi/components/ogrenme-araci/PodcastKapakGorseli.tsx:14).

## 6. Diğer pill ve rozet sözlükleri

### Nötr, teknik ve üretim varyantı

| Pill | Zemin | Metin | Kenar |
| --- | --- | --- | --- |
| Nötr / aşama | #f3f4f6 | #4b5563 | #e5e7eb |
| Teknik adı | #f9fafb | #4b5563 | #e5e7eb |
| Hazır öğrenme aracı | #dbeafe | #1d4ed8 | #93c5fd |
| Hazır soru | #fbe4de | #bc2d0d | #e9b3a6 |
| İçerik üreticisi | #f5f3ff | #6d28d9 | #ddd6fe |
| Seçili olmayan PillButon | transparent | #6b7280 | #e5e7eb |

Pill kenarı 0,5 px; PillButon kenarı 1 px. Seçili buton, verilen renk sözlüğünü kullanır. Kaynaklar: [components/pill/Pill.tsx:40](/Users/iskendereser/Desktop/hapbilgi/components/pill/Pill.tsx:40); [components/pill/TeknikPill.tsx:12](/Users/iskendereser/Desktop/hapbilgi/components/pill/TeknikPill.tsx:12); [components/pill/VaryantPill.tsx:39](/Users/iskendereser/Desktop/hapbilgi/components/pill/VaryantPill.tsx:39).

### Hedef rol pilleri

| Hedef | Zemin | Metin | Kenar |
| --- | --- | --- | --- |
| Ürün Tanıtım Temsilcileri | #eff6ff | #1d4ed8 | #bfdbfe |
| Bölge Müdürleri | #fef2f2 | #bc2d0d | #fecaca |
| Eczacılar | #fff5f5 | #e30a17 | #e30a17 |
| Eczane Teknisyenleri | #eaf7e4 | #10304a | #7ed957 |
| Eczane Müşterileri | #fffbeb | #b45309 | #fde68a |

Kaynak: [app/(panel)/talepler/_types.ts:132](/Users/iskendereser/Desktop/hapbilgi/app/(panel)/talepler/_types.ts:132).

### Dosya tipi etiketleri

| Uzantı grubu | Etiket | Zemin | Metin |
| --- | --- | --- | --- |
| pdf | PDF | #fef2f2 | #bc2d0d |
| docx | DOC | #eff6ff | #1d4ed8 |
| pptx | PPT | #fff7ed | #c2410c |
| xlsx | XLS | #f0fdf4 | #15803d |
| txt | TXT | #f9fafb | #374151 |
| png | IMG | #fdf4ff | #7e22ce |
| mp4 | VID | #f0fdf4 | #16a34a |
| mp3 | POD | #f5f3ff | #6d28d9 |
| bilinmeyen | BILINMEYEN | #f9fafb | #737373 |

Kaynak: [app/(panel)/talepler/_types.ts:174](/Users/iskendereser/Desktop/hapbilgi/app/(panel)/talepler/_types.ts:174).

### Üretim durumları — role göre bütün renk eşlemeleri

Hücre sırası **zemin / metin / kenar**. Aynı durum kodu üretici ve İÜ tarafında farklı aksiyon anlamı taşıyabilir. Bu tablo mevcut fonksiyonlar çağrılarak alındı.

| Durum kodu | Üretici renkleri | İÜ renkleri |
| --- | --- | --- |
| talep_olusturuldu | #f0fdf4 / #16a34a / #bbf7d0 | #f0fdf4 / #16a34a / #bbf7d0 |
| iu_iletildi | #f9fafb / #737373 / #e5e7eb | #fff1f0 / #bc2d0d / #fecaca |
| iu_hazirliyor | #f9fafb / #737373 / #e5e7eb | #fff1f0 / #bc2d0d / #fecaca |
| iu_duzeltiyor | #fefce8 / #854d0e / #fde68a | #fefce8 / #854d0e / #fde68a |
| onay_bekleniyor | #fff1f0 / #bc2d0d / #fecaca | #f9fafb / #737373 / #e5e7eb |
| video_bekleniyor | #fff1f0 / #bc2d0d / #fecaca | #f9fafb / #737373 / #e5e7eb |
| video_isleniyor | #f9fafb / #737373 / #e5e7eb | #f9fafb / #737373 / #e5e7eb |
| hazir_video | #f0fdf4 / #16a34a / #bbf7d0 | #f0fdf4 / #16a34a / #bbf7d0 |
| hazir_arac_iletildi | #f0fdf4 / #16a34a / #bbf7d0 | #f0fdf4 / #16a34a / #bbf7d0 |
| hazir_soru_seti | #f0fdf4 / #16a34a / #bbf7d0 | #f0fdf4 / #16a34a / #bbf7d0 |
| yayin_bekleniyor | #fff1f0 / #bc2d0d / #fecaca | #f9fafb / #737373 / #e5e7eb |
| onaylandi | #f0fdf4 / #16a34a / #bbf7d0 | #f0fdf4 / #16a34a / #bbf7d0 |
| planlandi | #f5f3ff / #6d28d9 / #ddd6fe | #f5f3ff / #6d28d9 / #ddd6fe |
| yayinda | #eff6ff / #1d4ed8 / #bfdbfe | #eff6ff / #1d4ed8 / #bfdbfe |
| yayin_durduruldu | #fef2f2 / #bc2d0d / #fecaca | #fef2f2 / #bc2d0d / #fecaca |
| yayin_siliniyor | #f9fafb / #737373 / #e5e7eb | #f9fafb / #737373 / #e5e7eb |
| yayin_silme_hatasi | #fef2f2 / #bc2d0d / #fecaca | #fef2f2 / #bc2d0d / #fecaca |
| yayin_oncesi_silindi | #f9fafb / #737373 / #e5e7eb | #f9fafb / #737373 / #e5e7eb |
| iptal | #f9fafb / #737373 / #e5e7eb | #f9fafb / #737373 / #e5e7eb |
| sistem_hatasi | #fef2f2 / #bc2d0d / #fecaca | #fef2f2 / #bc2d0d / #fecaca |

Kaynak: [lib/utils/durum/mesaj.ts:63](/Users/iskendereser/Desktop/hapbilgi/lib/utils/durum/mesaj.ts:63) ve [components/pill/DurumPill.tsx:25](/Users/iskendereser/Desktop/hapbilgi/components/pill/DurumPill.tsx:25). DurumAnahtari filtrelerinde sayı rozeti `m.renk.text` zemin ve #fff metin kullanır: [components/DurumAnahtari.tsx:83](/Users/iskendereser/Desktop/hapbilgi/components/DurumAnahtari.tsx:83).

### E-Club çek talebi durum pilleri

| Durum kodu / etiket | Zemin | Metin | Kenar |
| --- | --- | --- | --- |
| beklemede / Beklemede (UTT) | #fefce8 | #854d0e | #fde68a |
| bm_onayinda / BM Onayında | #fff7ed | #b45309 | #fed7aa |
| tm_onayinda / TM Onayında | #f5f3ff | #6d28d9 | #ddd6fe |
| onaylandi / TM Onayladı | #ecfdf5 | #065f46 | #a7f3d0 |
| teslimat_bekliyor / TM Onayladı | #f0fdfa | #0f766e | #99f6e4 |
| cek_kodlari_gonderildi / Çek Kodu Gönderildi | #edf6fd | #237ac8 | #b6d9f5 |
| iptal / İptal Edildi | #fef2f2 | #bc2d0d | #fecaca |

Kaynak: [lib/eclub/store/eclubStoreTipler.ts:52](/Users/iskendereser/Desktop/hapbilgi/lib/eclub/store/eclubStoreTipler.ts:52). `onaylandi` ve `teslimat_bekliyor` aynı görünen metni taşısa da ayrı renk üçlüleri kullanır.

### Çek teslimat rozetleri

| Durum | Kenar / zemin / metin Tailwind sınıfları |
| --- | --- |
| Uygulanmaz | border-slate-200 / bg-slate-50 / text-slate-500 |
| Henüz başlamadı | border-slate-200 / bg-slate-50 / text-slate-600 |
| Teslimat başarısız | border-red-200 / bg-red-50 / text-red-700 |
| Teslim edildi | border-emerald-200 / bg-emerald-50 / text-emerald-700 |
| Kısmen teslim edildi | border-amber-200 / bg-amber-50 / text-amber-700 |
| Gönderiliyor | border-cyan-200 / bg-cyan-50 / text-cyan-700 |
| Gönderim bekliyor | border-blue-200 / bg-blue-50 / text-blue-700 |

Kaynak: [app/(panel)/eclub/hediye-takip/_components/CekTakipKarti.tsx:25](/Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/hediye-takip/_components/CekTakipKarti.tsx:25). Bu tablo görsel durum eşlemesidir; teslimatın gerçekten yapıldığını kanıtlamaz.

### Hediye çeki günleri pili

| Durum | Zemin | Metin | Kenar / nokta |
| --- | --- | --- | --- |
| Talep günleri açık | #f0fdf4 | #166534 | #bbf7d0; nokta #16a34a, 6 px aynı renk glow |
| Kapalı, en çok 10 gün kalmış | #1e3a8a | #ffffff | #1e3a8a; nokta çizilmez |
| Kapalı, daha uzun süre var | #fffbeb | #92400e | #fef3c7; nokta #f59e0b |

Kaynak: [components/eclub/EclubHediyeCekiGunleriPill.tsx:17](/Users/iskendereser/Desktop/hapbilgi/components/eclub/EclubHediyeCekiGunleriPill.tsx:17).

### Diğer ortak pill aileleri

- Tarih pili: #fff zemin / #6b7280 metin / #e5e7eb kenar: [components/ui/tarih-pill.module.css:9](/Users/iskendereser/Desktop/hapbilgi/components/ui/tarih-pill.module.css:9).
- Navbar bilgi/özet kapsülleri: rgba(0,0,0,0.04) zemin / rgba(0,0,0,0.08) iç çizgi; #6b7280 etiket ve #111827 veya #1f2937 değer: [components/panel/PanelNavbar.tsx:16](/Users/iskendereser/Desktop/hapbilgi/components/panel/PanelNavbar.tsx:16).
- Sade dönem/filtre kapsülü: #fff yüzey, #718198 pasif metin, #237ac8 seçili zemin ve beyaz metin; hover #edf6ff: [components/kontrol/sade-kontroller.module.css:65](/Users/iskendereser/Desktop/hapbilgi/components/kontrol/sade-kontroller.module.css:65).
- shadcn Badge: primary, secondary, destructive, outline, ghost ve link varyantları; focus/aria-invalid/dark/hover alpha dalları: [components/ui/badge.tsx:7](/Users/iskendereser/Desktop/hapbilgi/components/ui/badge.tsx:7).
- Sayfalarda inline yazılmış piller, lig rozetleri ve yuvarlak buton/ikon adayları: [tam kaynak indeksi](PILL_VE_YUVARLAK_KONTROLLER.md).

## 7. Bildirim, buton, form, tablo, menü ve modal

| Bildirim | Zemin | Metin | Kenar |
| --- | --- | --- | --- |
| Hata | #fef2f2 | #bc2d0d | #fecaca |
| Başarı | #f0fdf4 | #16a34a | #bbf7d0 |
| Uyarı | #fefce8 | #854d0e | #fde68a |
| Bilgi | #eff6ff | #1d4ed8 | #bfdbfe |

Kaynak: [components/HataMesaji.tsx:18](/Users/iskendereser/Desktop/hapbilgi/components/HataMesaji.tsx:18). Adım/detay/kapat öğelerinin opacity değerleri sırasıyla 0,8 / 0,7 / 0,6’dır.

Sade kontrol ailesinin tam renkleri: #fff yüzey, #203653 ana metin, #718198 yardımcı metin, #dbe5ef çizgi, #237ac8 eylem, #edf6ff hover. Seçili kapsül gölgesi rgba(35,122,200,.2), alan gölgesi rgba(36,64,98,.05), açılır menü gölgesi rgba(31,74,111,.16). Disabled alanlar opacity .5; yıl seçici butonları .4. [components/kontrol/sade-kontroller.module.css:2](/Users/iskendereser/Desktop/hapbilgi/components/kontrol/sade-kontroller.module.css:2).

Sayfa özelindeki farklı butonlar, modal perdeleri, tablo başlık/satır/hover kenarları ve form focus/hata çizgileri tek bir genel değere indirgenmedi. Her koşul ve bütün kaynak satırları dosya bazındaki listede bulunur. `bg-black/40`, `white/60`, `ring-primary/50` gibi sınıflarda taban renk ve alpha ayrı kaydedildi. `cozum` taban CSS değerini, `alpha` saydamlık ekini taşır.

## 8. Grafik, lig, iskelet ve görsel filtreleri

### E-Club performans grafiğinin araç renkleri

| Araç | Grafik rengi | Hafif zemin |
| --- | --- | --- |
| Video | #237ac8 | #edf5ff |
| Podcast | #8c65c9 | #f3effa |
| Görsel | #d99438 | #fff6e8 |
| Literatür | #23947a | #edf8f4 |

Kaynak: [lib/eclub/performans.ts:3](/Users/iskendereser/Desktop/hapbilgi/lib/eclub/performans.ts:3). Bu renk eşlemesi HOYK üzerindeki araç pill’i sözlüğünden farklıdır. Grafik çizgisi opaklığı .17; aktif nokta gölgesi renge `40` ekler (%25,10). Tooltip #fff / #e3eaf2 / #203653; grid çizgisi #edf1f6; eksen metni #8a99af; bu hafta çizgisi #9eb6d3 ve yazısı #6f89aa. [lib/eclub/performansGrafik.ts:9](/Users/iskendereser/Desktop/hapbilgi/lib/eclub/performansGrafik.ts:9).

### Lig ve madalya çizimleri

E-Club Ligi metal yazı fill/stroke/gölge üçlüleri, radial/linear/repeating gradyanları ve lider vurguları [app/(panel)/eclub/ligi/eclub-league.module.css:1](/Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/ligi/eclub-league.module.css:1) içinde tam listelenmiştir. Örneğin metal metinlerde #2f3945 / beyaz %94; altın #603000 / rgba(255,229,139,.95); bronz #572716 / rgba(255,194,151,.94) kullanılır. HB Ligi, C-Club ve üretici/saha liglerinin bütün kaynakları alan etiketleriyle tam listede yer alır.

### Yükleniyor, alpha ve filtreler

Skeleton’lar #e8eef5 veya beyaz gibi zeminler ve `animate-pulse` kullanır. Kurulu Tailwind pulse animasyonunda %50 karesinde opacity 0,5’tir (`node_modules/tailwindcss/theme.css:457–461`). C-Club banner’ında grayscale/saturate/brightness/contrast filtreleri; avatarlarda ve madalyalarda drop-shadow; panel perdelerinde blur/alpha tanımları vardır. Bunlar taban rengin görünen sonucunu etkilediğinden kayıtlara dahil edildi.

URL kodlu bir örnek de bulundu: [components/eclub/eclub-performans.module.css:7](/Users/iskendereser/Desktop/hapbilgi/components/eclub/eclub-performans.module.css:7) içindeki select oku, data SVG içinde `%237c8da4` yani #7c8da4 stroke kullanır.

## 9. Tailwind, CSS değişkenleri ve dinamik renkler

Tailwind 4’ün isimli renkleri kurulu `node_modules/tailwindcss/theme.css` dosyasından çözüldü. Örneğin `text-blue-500`, `text-red-500` ve `border-gray-200` modern OKLCH değerleri taşır. Kodda ayrıca yazılan #2563eb veya #e5e7eb ile aynı ifade olarak birleştirilmedi. Tam değerler ve her sınıfın kaynak yeri kayıtlıdır.

CSS `var(...)` kullanımları ve fallback’ler; yerel renk sözlükleri; `color-mix(...)`; JavaScript’in renk koduna eklediği `18`, `22`, `33`, `40`, `e8` saydamlıkları; hover/focus/active/disabled/dark koşulları ayrı korunur. `.educationTypeCard` içindeki yerel `--accent` ile genel shadcn `--accent` aynı isimli fakat farklı kapsamlı değişkenlerdir. İlgili tanımlar [değişken tablosunda](CSS_DEGISKENLERI.md) ayrı satırlardadır.

Mevcut `app/tema.css` iki açık tema tanımı ve shadcn köprüsünü taşır. Bileşen kaynaklarında ayrıca `dark:` varyantları bulunduğundan koyu durum sınıfları da envanterde korunmuştur. Dinamik bir renk ifadesi sabit HEX gibi sunulmadı; örneğin `sunum.renk`, `renk.bg`, `meta.metin`, `grup.renk`, `tasarim.border` ve Canvas karışım fonksiyonu kendi kaynak bağlamıyla kaydedildi.

## 10. Alanlara göre tam kayıt sayıları

| Alan | İnceleme kaydı |
| --- | --- |
| C-Club | 718 |
| Diğer ortak ve sayfa | 2762 |
| E-Club | 3346 |
| Eczanem | 2619 |
| Mağaza ve sipariş | 1449 |
| Ortak kabuk ve ana sayfa | 1451 |
| Rapor ve grafik | 1636 |
| T-Club | 261 |
| Tema ve rehber | 896 |
| Yayın ve öğrenme araçları | 3107 |
| Yönetim | 726 |

Alan adı dosya yolundan üretilmiş bulma etiketidir; ortak bileşen birden fazla modülde kullanılabilir. Kaynak dosyası referansı kesin kayıttır.

## 11. Statik görsel varlıkları

| Dosya | Bayt | İçerik türü |
| --- | --- | --- |
| app/favicon.ico | 25931 | Piksel içeriği; CSS renk sabiti değildir. Varlık olarak kaydedildi. |
| public/cc-ligi-yil-lider-0926.png | 3474908 | Piksel içeriği; CSS renk sabiti değildir. Varlık olarak kaydedildi. |
| public/cclub-ligi-0926-gumus-seffaf.png | 2087373 | Piksel içeriği; CSS renk sabiti değildir. Varlık olarak kaydedildi. |
| public/cclub-ligi-0926-gumus.png | 1703412 | Piksel içeriği; CSS renk sabiti değildir. Varlık olarak kaydedildi. |
| public/cclub-ligi-0926.png | 1717480 | Piksel içeriği; CSS renk sabiti değildir. Varlık olarak kaydedildi. |
| public/eclub-ligi1-0926.png | 1592058 | Piksel içeriği; CSS renk sabiti değildir. Varlık olarak kaydedildi. |
| public/eclub-ligi1-0926.webp | 1163092 | Piksel içeriği; CSS renk sabiti değildir. Varlık olarak kaydedildi. |
| public/eclub/sizin-yeriniz.png | 70203 | Piksel içeriği; CSS renk sabiti değildir. Varlık olarak kaydedildi. |
| public/hapbilgi-dikey-TM-1-logo.png | 825625 | Piksel içeriği; CSS renk sabiti değildir. Varlık olarak kaydedildi. |
| public/hapbilgi-yatay-TM-1-logo-optimized.png | 44000 | Piksel içeriği; CSS renk sabiti değildir. Varlık olarak kaydedildi. |
| public/hapbilgi-yatay-TM-1-logo.png | 2636162 | Piksel içeriği; CSS renk sabiti değildir. Varlık olarak kaydedildi. |
| public/hepifarma_logo_dark.png | 18239 | Piksel içeriği; CSS renk sabiti değildir. Varlık olarak kaydedildi. |
| public/icon-192.png | 15411 | Piksel içeriği; CSS renk sabiti değildir. Varlık olarak kaydedildi. |
| public/icon-512.png | 43360 | Piksel içeriği; CSS renk sabiti değildir. Varlık olarak kaydedildi. |
| public/kursu_5_0926-banner.png | 1226918 | Piksel içeriği; CSS renk sabiti değildir. Varlık olarak kaydedildi. |
| public/logo-download.png | 29235 | Piksel içeriği; CSS renk sabiti değildir. Varlık olarak kaydedildi. |

## 12. İnceleme sonucu ve sınırı

- Kaynak taraması, farklı renk yazım biçimlerini ve dinamik görsel hesaplarını birlikte kaydetti.
- Kritik HOYK/Pill/üretim/rol/çek sözlükleri koddan ayrıca çözüldü; HOYK gün örnekleri gerçek fonksiyondan üretildi.
- Bağımsız ham HEX kapsam kontrolü ve kaynak imzası kontrolü [DOGRULAMA.json](DOGRULAMA.json) dosyasındadır.
- Kaynak kod envanteri, bütün rollerin tarayıcıdan uçtan uca yazılım testi değildir.
- Bu çalışma sırasında site renklerini veya iş kurallarını değiştiren kod yazılmadı. İnceleme aracı ve rapor dosyaları üretildi.

Tekrar üretim: `node scripts/denetim/renk-envanteri.mjs`. Ana renk/konum tabloları yeniden üretilir; bu ayrıntılı yorum raporu 17 Ekim çalışma ağacına aittir.
