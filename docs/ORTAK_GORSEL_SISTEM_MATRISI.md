# HapBilgi ortak görsel sistem — ortaklama matrisi

**Tarih:** 17 Ekim 2026. **Durum:** Bileşen ortaklaştırması kullanıcı kararıyla kapsamdan çıkarıldı. Bu matris önceki hazırlığın kaynak referansı olarak korunur; aktif bir bileşen birleştirme planı değildir. Çalışma yalnız renk sistemi ve çift tema üzerinden devam eder; güncel kapsam [tema altyapısı kaydındadır](TEMA_ALTYAPISI.md).

## Koruma koşulu

Mevcut bileşen yapısı, davranış, font ailesi/büyüklüğü/kalınlığı, ölçü, yerleşim, metrik ve tablo yapısı korunur. Aynı aile içindeki farklı değerler kaynaklarıyla ayrı tutulur. Yalnız renkler, kendi kullanım bağlamlarında tema değişkenlerine bağlanır. Mavi tema mevcut kullanım renklerini korur; yeşil karşılıklar onaylı palete göre ele alınır. Bileşen birleştirme veya görünümleri tek standarda çekme bu çalışmanın kapsamı dışındadır.

## 1. Aile haritası

Bu tablo mevcut kaynakların çalışma indeksidir; satırlar bileşen birleştirme onayı veya bütün ailelerin davranış incelemesinin tamamlandığı anlamına gelmez. İlk ayrıntılı eşleme F01 için çıkarıldı. Aynı aile veya bileşen adı, aynı görünüm ve davranış gereksinimi anlamına gelmez. Değiştirilecek bölümde mevcut prop, varyant, className, CSS kapsamı ve rol/sayfa/durum farkları korunur.

| Kod | Aile | Doğrulanmış mevcut kaynaklar | Durum |
| --- | --- | --- | --- |
| F01 | Sade Kontroller ve kişi/seçim sarmalayıcıları | components/kontrol/SadeKontroller.tsx; components/kontrol/KisiKontroller.tsx; components/kontrol/sade-kontroller.module.css; components/ui/select.tsx; components/ui/periyot-butonlari.tsx; components/ogrenme-araci/YayinTuruFiltresi.tsx; components/raporlar/TemsilciSecici.tsx | Kaynak eşlemesi hazır; her küçük geçişte ilgili kullanım farkları doğrulanacak |
| F02 | Pill, rozet ve tarih bilgisi | components/ogrenme-araci/YayinTuruPill.tsx; components/pill/AsamaPill.tsx; components/pill/DurumPill.tsx; components/pill/HedefRolPill.tsx; components/pill/Pill.tsx; components/pill/TeknikPill.tsx; components/pill/VaryantPill.tsx; components/ui/badge.tsx; components/ui/tarih-pill.module.css | Ayrıntılı eşleme ilgili aile adımında |
| F03 | Yayın kartı ve HOYK süre çerçevesi | components/yayin/YayinKarti.tsx; components/eclub/EclubHoykSureCercevesi.tsx; lib/eclub/hoykSureCercevesi.ts | Ayrıntılı eşleme ilgili aile adımında |
| F04 | Ortak kabuk, menü ve başlıklar | components/panel/PanelNavbar.tsx; components/panel/SolListe.tsx; components/panel/MobilDrawer.tsx; components/ui/sayfa-yenile-basligi.tsx | Ayrıntılı eşleme ilgili aile adımında |
| F05 | İşlem ve yenile butonları | components/ui/button.tsx; components/ui/yenile-butonu.tsx | Mevcut işlem sözleşmeleri ayrı incelenecek |
| F06 | Giriş alanı, etiket ve formlar | components/ui/input.tsx; components/ui/label.tsx | Ayrıntılı eşleme ilgili aile adımında |
| F07 | Kart ve tablolar | components/ui/card.tsx; components/ui/table.tsx | Sayfa tablolarının yapı/ölçü farkları ayrıca kaydedilecek |
| F08 | Akordiyon ve açılır içerik | components/ui/collapsible.tsx; components/cc-ligi/CcTakimLigAkordeonu.tsx; components/hbligi/field/TakimLigAkordeonu.tsx | Ayrıntılı eşleme ilgili aile adımında |
| F09 | Dialog, modal ve tooltip | components/ui/alert-dialog.tsx; components/ui/tooltip.tsx; components/raporlar/YayinDetayModal.tsx | Ayrıntılı eşleme ilgili aile adımında |
| F10 | Bildirim ve hata görünümleri | components/HataMesaji.tsx; components/panel/YayinSonucBildirimi.tsx | Ayrıntılı eşleme ilgili aile adımında |
| F11 | Skeleton ve boş durumlar | components/cc-ligi/CcLigiSkeleton.tsx; components/eclub/EclubAnaSayfaSkeleton.tsx; components/eclub/EclubFirmaCekTakibiSkeleton.tsx; components/eclub/EclubFirmaCekTalebiSkeleton.tsx; components/eclub/EclubFirmaPerformansSkeleton.tsx; components/eclub/EclubFirmaYayinlarSkeleton.tsx; components/eclub/EclubFirmalarSkeleton.tsx; components/eclub/EclubLigiSkeleton.tsx; components/tclub/TClubPageSkeleton.tsx | Ayrıntılı eşleme ilgili aile adımında |
| F12 | Grafik, ilerleme ve lig çizimleri | lib/eclub/performans.ts; lib/eclub/performansGrafik.ts; components/ui/progress.tsx; components/raporlar/DagilimGrafik.tsx | Dinamik ve rol/durum renkleri kendi bağlamında incelenecek |
| F13 | Öğrenme aracı kapağı ve oynatıcı görünümleri | components/ogrenme-araci/AracVarsayilanKapak.tsx; components/ogrenme-araci/PodcastOynatici.tsx; components/ogrenme-araci/GorselOynatici.tsx; components/izle/VideoOynatici.tsx | Arayüz kaynakları; video/statik araç yükleme akışları birleştirilmeyecek |

## 2. İlk aile: Sade Kontroller

- [Ayrıntılı kaynak ve görünüm matrisi](ortak-gorsel-sistem/ADIM1_SADE_KONTROLLER.md).
- [Tam import/JSX/prop/rota eşlemeleri ve başlangıç imzaları](ortak-gorsel-sistem/ADIM1_KAYNAK_ESLEME.json).
- [Değiştirilmeden kaydedilen 221 CSS bildirimi](ortak-gorsel-sistem/SADE_KONTROL_CSS_REFERANSI.json).
- [17/17 hedef test ve kaynak koruma sonucu](ortak-gorsel-sistem/ADIM1_DOGRULAMA.json).

59 doğrudan kaynak dosyasının 2'si aile içi, **57'si aile dışıdır**. 129 dosyalık olası etki grafiği **47 rota kaynağına** ulaşır. 195 JSX kaynak noktası kayıtlıdır. Bu rakamlar gerçek ekranda çizilen öğe veya doğrulanmış rol sayısı değildir.

## 3. Önceden kaydedilen örnek ekran

**UTT → Eğitim Yayınları → Ürün Eğitimleri**, adres: `/videolarim/urun`. Gerçek Chrome oturumunda sayfa görüntülendi. Başlangıç ve 1440 × 1000 masaüstü referansları alındı. Mobil kayıt ve hesaplanmış stil/ölçü okuması otomasyon bağlantısı kesildiği için tamamlanamadı.

**Güncel karar:** Bu görüntüler yalnız bu kullanımın tarihsel kaydıdır. Sayfa, platformdaki diğer HOYK veya kontrol kullanımlarını temsil etmez. Bu sayfanın eksik kayıtları ortak renk eşlemelerinin hazırlanmasını genel olarak engellemez; gerekli ekran kontrolü hazırlanan değişikliğin etkilenen kullanımlarına göre belirlenir.

[Masaüstü başlangıç görüntüsü](ortak-gorsel-sistem/referanslar/utt-urun-egitimleri-1440x1000.jpg). Görüntü mevcut duruma aittir; ortaklama uygulanmış değildir.

## 4. Güncel çalışma sınırı

1. Hazır renk envanteri ve kaynak listesinden küçük bir renk kullanım grubu ele alınır; yalnız o bölüm için eksik bilgi tamamlanır.
2. Bileşenler ve yerel kullanım seçenekleri korunarak renklerin tema değişkeni karşılıkları hazırlanır. Bileşen ortaklaştırması yapılmaz.
3. Gerekli doğrulama etkilenen kullanımlarda yapılır; her küçük teslimin özeti hemen sunulur. Belirsizlik veya seçenek arasında karar için açık kullanıcı onayı beklenir.
4. Önceki mobil/DOM kaydı ve tarayıcı temizleme teyidi eksikleri [tarihsel doğrulama kaydında](ortak-gorsel-sistem/ADIM1_DOGRULAMA.json) açık kalır; tamamlandıkları iddia edilmez ve yeni genel başlangıç koşulu yapılmaz.

**Bu matrisin hazırlanması sırasında uygulama kaynaklarına, ölçülere, renklere veya metrik hesaplarına değişiklik uygulanmadı.** Renk envanteri tekrar üretilmedi; kaynak bağlantıları tamamlandı. Bu tarihsel hazırlık, bileşen ortaklaştırması yapılacağı anlamına gelmez. Sonraki kontroller yalnız renk değişikliğinden etkilenen kullanımlara göre belirlenir.
