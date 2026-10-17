# HapBilgi renk ortaklaştırması — adım adım iş planı

**Tarih:** 17 Ekim 2026.  
**Durum:** 1–8. adımlar ve 9. adımın kod/otomatik doğrulama teslimi hazır. Kullanıcının belirlediği kapsamda kalan renk bağlantıları ve 10. adımın son kaynak kontrolü tamamlandı; 785 kaynağın taramasında gerekçesiz bekleyen aktif arayüz rengi bulunmadı. Bilgi/yönetim sayfaları kapsam dışında; gerekçeli sabit çizim renkleri kayıtlıdır. Gerçek tarayıcı görsel kontrolleri ve önceki test/lint/CSS bulguları tamamlanmış sayılmaz.

## Amaç ve sınır

Mevcut arayüz renklerini, kullanım amaçlarına göre `app/tema.css` içindeki ortak tema değişkenlerine bağlamak. Kırık beyaz–mavi görünüm mevcut ekranların kendi renklerini koruyacak; sütlü kahve–yeşil görünüm onaylı paletten karşılık alacak.

**Bileşen ortaklaştırması yapılmayacak.** Mevcut bileşenler, prop/varyant sözleşmeleri, DOM yapıları, rol ve durum farkları korunacak. Font ailesi/büyüklüğü/kalınlığı, ölçü, konum, tablo yapısı, metrik hesabı ve işlem davranışı bu çalışmada değiştirilmeyecek.

Ortaklaştırılan şey renk tanımlarıdır. Aynı HEX değerinin iki yerde kullanılması, iki kullanımın aynı amaca sahip olduğu anlamına gelmez. Farklı amaçlar ayrı değişken alabilir; mevcut farklı tonlar da kendiliğinden tek tona indirgenmez. Örneğin genel bileşen mavisi `#56aeff`, kontrol mavisi `#237ac8` ve yayın/puan mavisi `#2563eb` mevcut görevleriyle korunur.

## Hazır başlangıç kaynakları

- [Tema altyapısı ve önceki doğrulamalar](TEMA_ALTYAPISI.md): iki palet, CSS değişkenleri, Tailwind/shadcn köprüsü ve yerel önizleme hazır. Buradaki geçmiş test sonuçları bu planın uygulanma sonucu değildir.
- [Renk envanteri](renk-envanteri/RAPOR.md): 1.205 kaynak dosyası incelenmiş, 300 dosyada renk/görünüm kaydı bulunmuş. Sayılar kaynak envanterine aittir; dönüştürülmüş ekran sayısı değildir.
- [Tam kullanım listesi](renk-envanteri/DOSYA_BAZINDA_TUM_KULLANIMLAR.md), [renk kataloğu](renk-envanteri/renk-katalogu.html) ve [özel renk eşlemeleri](renk-envanteri/ozel-bilesenler.json).
- [Mevcut kaynak matrisi](ORTAK_GORSEL_SISTEM_MATRISI.md) ve [Sade Kontroller eşlemesi](ortak-gorsel-sistem/ADIM1_SADE_KONTROLLER.md): bileşen birleştirmek için değil, renk kaynaklarını ve etkilenen kullanımları bulmak için referans.

Bu araştırma tekrar yapılmaz. Her küçük değişiklikten önce yalnız o bölümün kaynakta değişmiş veya eksik bilgisi tamamlanır. Tek bir ekran bütün platformun temsilcisi kabul edilmez.

## Her teslimde uygulanacak yöntem

1. Ele alınacak küçük renk kullanım grubu ve etkilenen kaynaklar belirlenir. Geniş bir aile tek seferde değiştirilmez; gerekiyorsa aşağıdaki adım birkaç teslimle kapanır.
2. O gruptaki her eşleme için kaynak, kullanım/rol/durum, CSS özelliği, mevcut mavi değer, tema değişkeni ve yeşil karşılık kaydedilir. Saydamlık, gradyan durakları, gölge ve hover/focus/disabled halleri de eşlemeye dahildir.
3. Hazır karşılık varsa kullanılır. Eksik karşılık, mevcut CSS kapsamı ve anlamı korunarak ortak renk kaynağına eklenir. Yalnız renk tanımı veya onu tüketen sınıf/ifade değiştirilir; genel HEX bul/değiştir yapılmaz.
4. Mavi görünüm değişiklik öncesiyle, yeşil görünüm onaylı paletle karşılaştırılır. Etkilenen farklı kullanım ve etkileşim durumları kontrol edilir. Ekran boyutuna göre renk kuralı bulunmayan ve responsive stilleri değişmeyen bir bölümde aynı renkleri ayrıca mobilde doğrulamak teslim şartı yapılmaz. Yerleşim veya responsive davranış değişirse ilgili masaüstü/mobil kontrolü yapılır.
5. Yapılan değişiklik, geçen kontroller, eksik kalan kontroller ve sonraki küçük teslim hemen bildirilir. Hazırlama, otomatik test, tarayıcı kontrolü ve yayın durumu ayrı yazılır.

Onaylı paletten açıkça çözülen eşlemeler mevcut kapsamda ilerler. Yeni renk kararı, belirsiz durum veya renk dışı zorunlu fark çıkarsa yalnız ilgili konu kullanıcı kararına bırakılır; bağımsız ve doğrulanmış işler devam eder.

## Uygulama adımları

### 1. İlk renk grubunun değişken eşlemelerini hazırlamak

**İş:** Mevcut `app/tema.css`, `app/globals.css` ve `lib/tema/temalar.ts` temel alınır. Sade Kontrollerin hazır referansından ilk küçük renk grubu seçilir; yalnız bu grubun eksik tema karşılıkları tanımlanır. Bütün platformun yeni bir sözlüğünün bitmesi başlangıç şartı yapılmaz.

**Teslim:** Seçilen grubun kaynak → kullanım amacı → mavi/yeşil karşılık tablosu ve gereken ortak renk tanımları.

**Kabul:** Mevcut mavi değerler birebir korunur. İki tema, iç içe tema kapsamı ve mevcut Tailwind/shadcn köprüleri bozulmaz. Kullanılmayan, tahmini yeni değişkenler eklenmez.

**Sonuç — 17 Ekim 2026:** Altı kontrol renginin mevcut mavi değerleri ve onaylı yeşil karşılıkları ortak kaynağa eklendi. Hedef testler 5/5, TypeScript, ESLint ve gerçek PostCSS/Tailwind derlemesi başarılı. Mevcut 91 tema bildirimi ve kontrol CSS kaynağı korundu. [Eşleme tablosu, kontrol kapsamı ve sonuçlar](RENK_ORTAKLASTIRMA_ADIM1.md).

### 2. Sade Kontrollerin renklerini bağlamak

**İş:** Önce `components/kontrol/sade-kontroller.module.css` içindeki küçük bir grup, ardından aynı kontrol ailesindeki kalan renkler ele alınır. `SadeKontroller.tsx`, `KisiKontroller.tsx`, `components/ui/select.tsx`, dönem ve yayın türü seçimlerindeki ek renkler kendi kullanımında korunur. Kişi seçimi, kapsül filtre, altı çizgili sekme, arama ve tablo sürümü ayrı dikkate alınır.

**Teslim:** Mevcut kontrollerin iki temada renk değişkenlerinden çalışması; bileşen ve sarmalayıcı yapıları aynı kalır.

**Kabul:** Normal, seçili, açık menü, hover, focus ve disabled halleri kontrol edilir. Kaynak eşlemesindeki 57 aile dışı kullanım dosyası ve 47 rotalık olası etki listesi takip edilir; bunlar doğrulanmış ekran sayısı olarak sunulmaz. Farklı prop/varyant, yerel stil ve rol koşulu taşıyan kullanımlar ayrıca değerlendirilir.

**Sonuç — 17 Ekim 2026:** Tamamlandı. Kontrollerin renkleri ortak kaynağa bağlandı; Radix Select'in yalnız iki focus rengi değiştirildi. 221 CSS bildirimi karşılaştırmasında mavi değer ve renk dışı fark 0. Tema testleri 6/6, davranış testleri mavi 17/17 ve yeşil 17/17; TypeScript, ESLint ve CSS derlemesi başarılı. Bu kontrollerde renkler ekran boyutundan bağımsız, responsive kurallar değişmeden korunmuştur. Masaüstünde iki tema, 390 px mobilde mavi görüntülendi. Mobil yeşil, gerçek menü etkileşimi ve hesaplanmış DOM ölçüleri yapılmış sayılmaz; ek tarayıcı kayıtları kapanış şartı değildir. [Ayrıntılı sonuç ve kontrol kapsamı](RENK_ORTAKLASTIRMA_ADIM2.md).

### 3. Menü, gezinme ve sayfa kabuğunu geçirmek

**İş:** `components/panel/PanelNavbar.tsx`, `SolListe.tsx`, `MobilDrawer.tsx` ve `components/ui/sayfa-yenile-basligi.tsx` içindeki zemin, metin, simge, çizgi, seçili alan, hover ve odak renkleri sırayla bağlanır.

**Teslim:** Masaüstü menüsü, mobil menü ve mevcut başlıkların iki temada aynı yerleşimle çalışması.

**Kabul:** Aktif/pasif menü, açılan alt menü, bildirim rozeti ve farklı rol menülerinin renkleri kontrol edilir. Menü içeriği, bağlantılar, görünürlük ve yetkiler değişmez. Logo ve marka görselleri korunur.

**Sonuç — 17 Ekim 2026:** Tamamlandı. Üst menü, sol liste, mobil çekmece ve panel layout'unda yalnız 72 renk ifadesi bağlandı. Başlık bileşeni ve CSS'sinde kendi renk tanımı olmadığı için değişiklik gerekmedi. Mavi değer farkı ve renk dışı kaynak farkı 0; önceki 113 tema bildirimi korundu. Menü testi 31 rol girdisini iki temada kapsıyor. Seçili 21 testin 20'si başarılı; değişmemiş HBStore metnini farklı apostrofla bekleyen bir mevcut test başarısız. TypeScript ve CSS derlemesi başarılı; ESLint'teki mevcut 2 hata/1 uyarı aynı, yeni bulgu yok. Gerçek tarayıcı etkileşimi yapılmış sayılmadı. [Eşlemeler, doğrulama ve mevcut bulgular](RENK_ORTAKLASTIRMA_ADIM3.md).

### 4. İşlem butonları ve form renklerini geçirmek

**İş:** `components/ui/button.tsx`, `yenile-butonu.tsx`, `input.tsx`, `label.tsx` ve envanterdeki ilgili yerel renk kullanımları küçük gruplarla ele alınır. Aynı görünen farklı butonlar birleştirilmez.

**Teslim:** Buton, giriş alanı, etiket ve form geri bildirimlerinin tema karşılıkları.

**Kabul:** Normal, hover, focus, disabled, yükleniyor ve hata halleri korunur. Klavye odağı, giriş içeriği, doğrulama ve tıklama/yenileme davranışları değişmez.

**Sonuç — 17 Ekim 2026:** Tamamlandı. Yenile butonunun dört sabit rengi ortak kaynağa, `Button` hata varyantının beyaz metni mevcut `destructive-foreground` karşılığına bağlandı. `Input` ve `Label` zaten tema köprüsünü kullanıyor; kaynak değişikliği gerekmedi. Önceki 157 tema bildirimi, 20 durum kuralı ve 56 statik bileşen çıktısının renk dışı içeriği korundu. Beş yeni renk sınıfının derlenen mavi değer farkı 0. Hedef testler 16/16, TypeScript ve ESLint başarılı. PostCSS/Tailwind çalıştırması başarılı; genel CSS'nin yeniden ayrıştırılmasında renk kataloğundan gelen aynı mevcut hata değişiklik öncesinde ve sonrasında görüldü, ayrı kaydedildi. Sayfa özelindeki yerel renk istisnaları 9. adım kapsamında izlenir. [Eşleme ve doğrulama sonucu](RENK_ORTAKLASTIRMA_ADIM4.md).

### 5. Pill, rozet, tarih ve durum renklerini geçirmek

**İş:** `components/pill/`, `components/ogrenme-araci/YayinTuruPill.tsx`, `components/ui/badge.tsx`, `tarih-pill.module.css` ve ilgili yerel renkler, mevcut anlam sözlükleriyle ele alınır.

**Teslim:** Dekoratif vurgu ile işlem/durum rengini ayıran, her iki temada karşılığı belirli eşlemeler.

**Kabul:** Başarı, hata, uyarı, üretim aşaması, araç türü ve hedef rol ayrımları korunur. Üretici/İÜ gibi farklı rol karşılıkları tek renge zorlanmaz. Alpha değerleri, rozet metinleri ve simge dolguları korunur. Durum, süre ve araç türü renklerindeki mevcut işlevsel palet başlangıçta korunur; tema nedeniyle değiştirilmesi gereken belirsiz bir karşılık için ayrıca karar alınır.

**Sonuç — 17 Ekim 2026:** Tamamlandı. Ortak pill ailesi, araç türü pili, Badge, tarih, üretim/rol/çek sözlükleri ve çek günleri/teslimat rozetleri ortak kaynağa bağlandı. Nötr yüzey/metin iki temaya uyarlanır; 112 işlevsel renk değişkeni iki temada mevcut değerini korur. Renk sonuna HEX alpha ekleyen üç hedef rol halkası ve araç pili kullanımı geçerli ortak karşılıklara geçirildi. Önceki 165 tema bildirimi, 16 tarih CSS bildirimi ve renk dışı kaynak korundu. 31 rol × 20 üretim durumu iki temada karşılaştırıldı; hedef testler 45/45 ve TypeScript başarılı. Lint: hata 0, mevcut uyarı 1, yeni bulgu 0. Önceki genel CSS katalog bulgusu aynı. Gerçek oturum, teslimat, veritabanı işlemi veya canlı dağıtım yapılmadı. [Eşleme, kontrol kapsamı ve sonuç](RENK_ORTAKLASTIRMA_ADIM5.md).

### 6. HOYK, varsayılan kapak ve oynatıcı arayüzlerini geçirmek

**İş:** `components/yayin/YayinKarti.tsx`, `components/ogrenme-araci/AracVarsayilanKapak.tsx` ve gerçek sayfalardaki yerel renk kapsamları bağlanır. Ardından Podcast/Görsel/Video oynatıcılarının uygulamanın kontrol ettiği arayüz renkleri ele alınır. Demoya özel kart/kapak renkleri gerçek kullanım kapsamına göre değerlendirilir.

**Teslim:** Yayın kartının zemin, metin, puan/ek puan, beğeni/favori ve varsayılan kapak renklerinin iki temada çalışması.

**Kabul:** Kartın farklı rol, yayın türü ve durum kullanımları korunur. Gerçek yüklenmiş kapaklara filtre uygulanmaz. Süre çerçevesinin yeşil → sarı → kırmızı anlamı ve 15 günlük hesabı değişmez. Oynatıcı açılması, mevcut kontroller ve izleme davranışı etkilenmez.

Video TUS yükleme, asenkron transkod, `hazir-video`/webhook akışı ve ham GUID saklama standardı korunur; video ile statik araçların yükleme/doğrulama akışları birleştirilmez. Dış Bunny iframe içeriği uygulama CSS'siyle dönüştürülmüş kabul edilmez.

**Sonuç — 17 Ekim 2026:** Tamamlandı. HOYK, dört araç kapağı, Podcast/Görsel/Flip PDF/Video oynatıcı arayüzleri ve gerçek kart slotları ortak kaynağa bağlandı. 216 değişken eklendi; 281 önceki bildirim korundu. 275 gerçek CSS ve 45 satır içi mavi karşılık aynı; 23 TSX kaynağında renk dışı fark 0. Yeni hedef testler 6/6; toplam 64 testin 62'si başarılı, iki eski E-Club testinin aynı başarısızlığı değişiklik öncesi kaynakla da doğrulandı. TypeScript ve lint başarılı. Genel CSS'nin önceki katalog bulgusu aynı. Hesaplanan süre renkleri, yükleme/izleme/puan akışları ve gerçek içerik görselleri korundu; canlı dağıtım yapılmadı. [Sonuç ve kontrol sınırları](RENK_ORTAKLASTIRMA_ADIM6.md).

### 7. Kart, tablo, açılır pencere ve yardımcı görünümleri geçirmek

**İş:** `components/ui/card.tsx`, `table.tsx`, `alert-dialog.tsx`, `tooltip.tsx`, akordiyonlar, `components/HataMesaji.tsx`, boş durum ve skeleton renkleri sırayla bağlanır. Portal içinde açılan menü/pencerelerin tema kapsamı ayrıca kontrol edilir.

**Teslim:** Yüzey, satır seçimi/hover, başlık, ayırıcı, örtü, pencere, tooltip ve yüklenme görünümlerinin tema karşılıkları.

**Kabul:** Tablo kolonları, sıralama/filtreleme, ölçüler, açılıp kapanma ve odak davranışları aynı kalır. Açılan içerik doğru temayı alır. Boş, hata, yükleniyor ve dolu haller kontrol edilir.

**Sonuç — 17 Ekim 2026:** Tamamlandı. Kart/tablo çizgileri, pencere/Tooltip, dört bildirim türü, lig akordiyonları, dokuz skeleton ailesi, ortak boş durum ve gönderim/yayın detay görünümleri ortak kaynağa bağlı. 185 değişken eklendi; önceki 631 bildirim korundu. 391 gerçek CSS ve 12 bildirim rengi mavi karşılığıyla aynı; 693 CSS Module bildirimi korundu, 24 kaynakta renk dışı fark 0. Yeni testler 7/7; toplam 63 testte 62 başarılı ve değişmeyen C-Club kaynağındaki bir mevcut test başarısızlığı var. TypeScript başarılı; mevcut bir lint hatası/sekiz uyarı aynı, yeni bulgu yok. Genel CSS'nin önceki katalog bulgusu sürüyor. Portalların kök tema mirası ve etkileşimler sınandı; gerçek oturum veya canlı dağıtım yapılmadı. [Sonuç ve kontrol sınırları](RENK_ORTAKLASTIRMA_ADIM7.md).

### 8. Grafik ve hesaplanan renkleri geçirmek

**İş:** `components/raporlar/DagilimGrafik.tsx`, `lib/eclub/performansGrafik.ts`, `components/ui/progress.tsx` ve envanterdeki SVG/Canvas/ECharts renkleri kendi çizim yöntemlerine göre ele alınır. Mevcut TypeScript/çizim tüketicileri ortak renk kaynağından beslenir; elle ikinci bir palet kopyası tutulmaz.

**Teslim:** Grafik zemini, eksen, etiket, tooltip ve dekoratif serilerin tema karşılıkları; işlevsel renklerin korunmuş kullanımları.

**Kabul:** Açık ekranda tema değiştiğinde çizim güncellenir. Değerler, seri sırası, ölçek, animasyon süresi ve renklerin anlattığı durum aynı kalır. HOYK süre çerçevesinin ara renk hesapları ve sınır durumları ayrıca korunur.

Ölçüm seçeneklerinde mevcut `lib/utils/raporUtils.ts` içindeki `PERIYOTLAR` kullanımı korunur: Haftalık, Aylık, Dönemlik, Yıllık. Günlük seçenek eklenmez; BM/TM başlangıç seçimi haftalık kalır.

**Sonuç — 17 Ekim 2026:** Tamamlandı. ECharts, SVG ve Canvas renkleri ortak kaynaktan beslenir; açık çizimler tema değişimini izler. 100 değişken/152 bildirim eklendi, önceki 945 bildirim korundu. Mavi eşlemeler, 48 grafik seçeneği ve 1.128 HOYK renk örneği önceki kodla aynı; Progress kaynağı değişmedi. 47/47 test, TypeScript ve hedef lint başarılı. Önceki genel CSS katalog bulgusu aynı; gerçek Chrome/rol oturumu veya canlı dağıtım yapılmadı. [Sonuç ve kontrol sınırları](RENK_ORTAKLASTIRMA_ADIM8.md).

### 9. Sayfalarda kalan yerel renkleri tamamlamak ve tüm rolleri kapsamak

**İş:** Hazır envanterden, önceki adımlarda tamamlanmamış uygulama kullanımları bulunur. Giriş/hesap, ana sayfalar, üretim, kulüpler, Eczanem/Store, raporlar ve yönetim ekranları kaynaklarına göre küçük teslimlerle ele alınır. Yeniden genel araştırma başlatılmaz.

**Teslim:** Her kullanım için kaynak/sayfa, rol, durum, iki tema kontrolü ve açık eksiklerin yazıldığı kapsam kaydı. Güncel rol listesi `lib/utils/roller.ts`, menü kapsamları `components/panel/panelNav.config.ts` ve ilgili mevcut sayfa erişim kurallarından alınır.

**Kabul:** Tüm roller kapsam kaydında yer alır. Ortak bir parçanın önceki kontrolü referans gösterilebilir; her rolün farklı menü/sayfa/durum kullanımı ayrıca değerlendirilir. Otomatik yazılım testi ve gerçek oturumdaki görsel kontrol ayrı kaydedilir. Erişilemeyen rol veya durum tamamlanmış gösterilmez. Yalnız kalan renk/rol kapsamı kontrol edilir; ilgisiz özellik testleri bu işin teslim şartına çevrilmez.

E-Club ekranlarına gelindiğinde çek teslimatı iş kuralı ayrıca korunur: e-posta eczacıya, push aynı eczanede çalışan E-Club üyelerinin HapBilgi hesaplarına gider. İlgili renk değişikliğinin alıcı ve teslimat akışını etkilemediği kod/veri akışı üzerinden kontrol edilir; gerçek teslimat doğrulaması yapılmış sayılmaz.

Çek Talebi Toplam Puan ile Yayın Tamamlama Performansı, ilgili ekran kontrolünde yayın/dönem ve 1–8. haftaların net puan birikimi açısından karşılaştırılır; hesap farkı çıkarsa ayrı bulgu olarak bildirilir, renk işi içinde puan hesabı değiştirilmez.

**Sonuç — 17 Ekim 2026:** Kod ve otomatik doğrulama teslim edildi. 207 kaynak ortak renk kaynağına bağlı; 5.093 Tailwind kullanımında mavi farkı ve 193 TS/TSX kaynağında renk dışı fark 0. Tüm 31 rolün kontrol durumu kaydedildi. Gerçek rol görsel kontrolleri açık olduğundan genel kutu açık kalır. [Teslim ve kontrol sınırları](RENK_ORTAKLASTIRMA_ADIM9.md).

- [x] Yerel renklerin ortak kaynağa bağlanması.
- [x] Tüm rollerin kapsam kaydı ve hedefli otomatik doğrulama.
- [ ] Gerçek rol oturumlarında iki tema görsel kontrolü.

### 10. Kalan renk kontrolü ve kapanış

**İş:** Son durumda hedeflenen uygulama kaynaklarında kalan sabit renkler kontrol edilir. Gerekli kapsamda envanter güncellenir; başlangıç araştırması tekrarlanmaz. Ortak tanıma taşınmış renk, gerekçeli sabit renk ve çözülmemiş kullanım birbirinden açıkça ayrılır.

**Teslim:** Son kaynak/kapsam kaydı, kontrol sonuçları, açık kararlar ve tema altyapısının güncel durumu.

**Kabul:**

- Uygulama renkleri ortak tema kaynağından çözülür; kalan her sabit renk için kaynak ve gerekçe kayıtlıdır. Gerekçesi bulunmayan kullanım açık iş olarak kalır.
- Her iki temada metin/zemin okunabilirliği, etkileşim durumları, çizimler ve açılan içerikler kontrol edilmiştir.
- Mavi tema değişiklik öncesiyle aynı görünür; yeşil tema onaylı palete uyar. Renk dışı farklar giderilmiştir.
- Tüm rollerin gerekli yazılım ve görünüm kontrol durumları kayıtlıdır; eksik kontrol varsa genel tamamlanma ilan edilmez. Hazır küçük teslimler ayrıca sunulmaya devam eder.
- Hazırlama, hedef testler, tarayıcı doğrulaması ve canlı yayın durumu ayrı raporlanır.

## Hedefli doğrulama düzeni

- Ortak tema kaynağı veya köprüsü değiştiğinde mevcut `tests/temaAltyapisi.hedef.test.ts` çalıştırılır. Mavi değerler, iki yönlü geçiş ve kapsam mirası sınanır.
- CSS tüketimi değiştiğinde mevcut PostCSS/Tailwind zincirindeki gerçek çıktı gerektiği ölçüde kontrol edilir; yalnız kaynak metni eşleşmesi doğruluk kanıtı sayılmaz.
- Etkilenen mevcut testler seçilir. Yeni test ancak somut bir davranış/renk çözümleme riskini doğruluyorsa eklenir; yapılan değişikliği metin olarak tekrar eden kontroller yazılmaz.
- TS/TSX değişikliği olan teslimlerde `npm run typecheck:build` ve değişen işlem dosyalarının ESLint kontrolü yapılır. Yeni değişiklik veya bulgu yoksa geçen kontroller tekrar tekrar çalıştırılmaz.
- İki tema, ilgili etkileşim durumları ve renk dışı stillerin korunumu doğrulanır. Ekran boyutuna özgü renk/yerleşim kuralı etkileniyorsa ilgili masaüstü/mobil kontrolü yapılır; aynı değişkeni kullanan değişmemiş responsive görünüm için mükerrer renk kontrolü teslim şartı yapılmaz. Tek ekran görüntüsü bütün platformun doğrulaması sayılmaz.
- Bu renk çalışmasında SQL, veri yazma veya yeni test kaydı üretme adımı yoktur. Renk testlerinden veritabanı iş kurallarının ya da gerçek e-posta/push teslimatının doğrulandığı sonucu çıkarılmaz.

## Operasyon sınırları ve sonraki iş

Tema seçicisinin gerçek siteye eklenmesi ve tercihin hesapta kalıcı tutulması, renk eşlemelerinin ardından ayrı teslim olarak ele alınacak. Bu plan, yeni hesap kolonu veya migration ekleme işi başlatmaz; o aşamada mevcut şema ve tercih akışı doğrulanır.

Hediye Takibi uçtan uca testleri beklemededir ve kullanıcı kararıyla park edilmiştir. İki aylık sınır değiştirilmez, sahte sipariş veya fiziksel test başlatılmaz. **Hediye Takibi test verileri silinecek.** Kullanıcı açıkça temizlik başlatana ve başarı sonucunu doğrulayana kadar mevcut kayıtlar korunur. Eczanem → İndirim Onayı sekmesindeki (F) test verilerinin temizliği de ayrı bekleyen iştir.

## İlerleme kaydı

- [x] **1 — İlk renk grubunun eşlemesi:** Tamamlandı; altı ortak renk tanımı hazır, hedef testler 5/5. [Sonuç](RENK_ORTAKLASTIRMA_ADIM1.md).
- [x] **2 — Sade Kontroller:** Tamamlandı; renk bağlantıları ve 40/40 hedef kontrol başarılı. [Sonuç ve kontrol kapsamı](RENK_ORTAKLASTIRMA_ADIM2.md).
- [x] **3 — Menü ve kabuk:** Tamamlandı; 72 renk ifadesi ortak kaynağa bağlı, mavi ve renk dışı fark 0. [Sonuç ve kontrol kapsamı](RENK_ORTAKLASTIRMA_ADIM3.md).
- [x] **4 — Buton ve formlar:** Tamamlandı; ortak bileşenlerde beş renk sınıfı bağlandı, 16/16 hedef test başarılı. [Sonuç ve kontrol kapsamı](RENK_ORTAKLASTIRMA_ADIM4.md).
- [x] **5 — Pill ve durum renkleri:** Tamamlandı; işlevsel palet ve rol ayrımları korunarak ortak kaynağa bağlı, 45/45 hedef test başarılı. [Sonuç ve kontrol kapsamı](RENK_ORTAKLASTIRMA_ADIM5.md).
- [x] **6 — HOYK, kapak ve oynatıcı arayüzü:** Tamamlandı; mavi ve renk dışı karşılaştırmalar başarılı, yeni hedef testler 6/6. [Sonuç ve mevcut test bulguları](RENK_ORTAKLASTIRMA_ADIM6.md).
- [x] **7 — Kart, tablo ve yardımcı görünümler:** Tamamlandı; renk dışı fark 0, yeni testler 7/7. [Sonuç ve mevcut bulgular](RENK_ORTAKLASTIRMA_ADIM7.md).
- [x] **8 — Grafik ve hesaplanan renkler:** Tamamlandı; açık çizimde tema geçişi ve işlevsel renkler korunur, 47/47 test başarılı. [Sonuç ve kontrol sınırları](RENK_ORTAKLASTIRMA_ADIM8.md).
- [ ] **9 — Yerel renkler ve tüm roller:** Kod, otomatik doğrulama ve 31 rolün kapsam kaydı teslim edildi; gerçek rol görsel kontrolleri açık. [Sonuç](RENK_ORTAKLASTIRMA_ADIM9.md).
- [ ] **10 — Kalan renk kontrolü ve kapanış:** Kaynak renk bağlantıları ve 785 dosyalık son kaynak kontrolü tamamlandı; kapsam içinde gerekçesiz bekleyen aktif arayüz rengi 0. Genel görsel onay iddia edilmediği için genel kutu açık tutulur. [Kapanış kaydı ve kontrol sınırları](RENK_ORTAKLASTIRMA_ADIM10.md).

9. adımın kod/kapsam kaydı ve 10. adımın kaynak kapanışı teslim edildi. Aktif arayüzde bilinen eksik renk bağlantısı kalmadı; gerçek tarayıcıda bütün sayfaların görsel doğrulaması yapılmış sayılmaz.
