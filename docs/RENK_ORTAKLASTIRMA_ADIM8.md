# Renk ortaklaştırması — 8. adım sonucu

**Tarih:** 17 Ekim 2026.  
**Durum:** TAMAMLANDI — yerel kod ve hedef doğrulama hazır. Canlı dağıtım yapılmadı.

Grafik, SVG ve hesaplanan Canvas renkleri `app/tema.css` kaynağına bağlandı. Açık çizimler tema değişimini izler. Bileşen ortaklaştırması yapılmadı; veri, metrik, rol kapsamı ve çizim geometrileri korundu.

## Yapılan çalışma

| Alan | Sonuç |
| --- | --- |
| ECharts | Mevcut `EChart` renk alanlarını ve renk callback sonuçlarını çizim anında gerçek renge çözer. Kök veya üst kapsamın `data-tema` değişimi aynı grafik örneğini günceller; yeniden kurulum yapılmaz. Veri ve formatter alanları renk olarak işlenmez. |
| Dağılım grafiği | Yedi dekoratif renk, eksen, etiket, ayırıcı, çizgi/alan, Tooltip ve tablo görünümü bağlandı. Her iki temada yedi farklı kategori rengi korunur. Pasta, sütun, çizgi ve tablo geçişi ile negatif değer gösterimi aynı. |
| E-Club performansı | Araç renkleri/hafif zeminler ve seçili nokta gölgesi CSS'den beslenir. Dört araç rengi iki temada aynı; yüzey, eksen, hafta işareti ve Tooltip yeşil karşılıklarını alır. Gölgenin eski `40` alfa değeri korunur. |
| HOYK Canvas | Üç uç renk ortak kaynaktan okunur. Açık çerçeve tema değişiminde mevcut gün/kırmızılaşma konumunda yeniden çizilir; 450/320 ms animasyon ve geometrisi değişmez. Oynatıcı bilgi pilinin tamamlandı/süre doldu renkleri de aynı kaynaktan alınır. |
| Lig çizimleri | Kazanım/kayıp grafiklerinin işlevsel renkleri korunur. Liderlik SVG'sinin dekoratif katmanları temaya uyar; C-Club madalyalarının altın/gümüş durak, kontur ve gölge anlamları aynı kalır. Beğeni/favori SVG renkleri de ortak kaynağa bağlıdır. |
| SVG seçim oku | E-Club dönem seçiminin veri URL'sindeki ok rengi CSS değişkeninden gelir. SVG ayrı belge olduğu için iki tema URL'sinde yalnız kodlanmış stroke rengi değişir; boyut ve yol aynıdır. |
| PNG ve Progress | PNG düğmesinin renkleri ve çıktı zemini ortak kaynağa bağlıdır; filigran/ölçek aynı. Progress zaten mevcut `--primary` köprüsünü kullandığı için kaynak dosyası değiştirilmedi; yüzde hareketi ve tema bağlantısı sınandı. |

**100 değişken / 152 bildirim** eklendi: 52 değişken temaya göre karşılık alır, 48 işlevsel/sabit değişken iki temada aynıdır. Önceki **945 bildirimin tamamı** korundu; toplam 1.097 bildirim bulunur.

Kapsam 13 mevcut TS/TSX kaynağı, bir CSS Module, tema CSS'si, üç yeni altyapı dosyası ve paket kontrol komutudur. Bir hedef test eklendi; iki mevcut grafik testi renkleri çözerek aynı tasarım referansını sınamaya devam eder. Onaylı HTML referansı değiştirilmedi.

## Tek renk kaynağı ve bakım

`lib/tema/hesaplananRenkler.generated.ts`, CSS'deki 99 çizim renginin otomatik çıktısıdır. Elle ikinci palet tutulmaz. DOM bulunmayan araç/süre hesapları bu çıktıyı kullanır; tarayıcıdaki ECharts/Canvas kapsayıcının hesaplanmış CSS renklerini okur. SVG veri URL'si doğrudan CSS'de kalır.

CSS çizim renkleri değiştirildiğinde çıktı şu komutla güncellenir:

```sh
node scripts/denetim/hesaplanan-renkleri-uret.mjs
```

`npm run typecheck:build` içindeki `--check`, eski çıktıyla kontrol veya build yapılmasını engeller. Mevcut tema kimlikleri ve varsayılan mavi seçimi korunur; kalıcı tercih veya yeni seçici eklenmedi.

## Doğrulama

| Kontrol | Sonuç |
| --- | --- |
| Mavi renk eşlemeleri | **94/94 aynı** |
| Gerçek Tailwind çıktısındaki değişen sınıflar | **13 kullanım / 9 farklı sınıf aynı; eksik 0** |
| SVG oku kullanılan CSS Module | **211/211 bildirim maviyle aynı; yalnız bir renk bildirimi bağlandı** |
| Önceki tema bildirimi korunumu | **945/945 aynı** |
| HOYK ara renk ve sınır karşılaştırması | **1.128/1.128 önceki fonksiyonla aynı** |
| E-Club grafik seçenekleri | **48/48 önceki seçeneklerle aynı; renk callback ve Tooltip sonuçları da aynı** |
| Yeni etkileşim/renk testleri | **6/6 başarılı** |
| Seçilen mevcut testler | **41/41 başarılı** |
| Toplam | **47/47 başarılı** |
| `npm run typecheck:build` | **Başarılı; üretilen renkler güncel** |
| Etkilenen 20 JS/TS/TSX dosyasının lint kontrolü | **0 hata, 0 uyarı** |

Renkler ve gerekli Tooltip varsayılan bağlantıları geri çözüldüğünde dokuz kaynak aynı kalır. ECharts tema takibi ve Canvas renk okuma bağlantıları ayrıca davranış testleriyle doğrulandı. HOYK çerçeve geometrisi, sabitleri, animasyon süreleri ve oynatıcıdaki renk dışı kaynak aynı; Progress byte düzeyinde değişmedi.

Yeni testler gerçek React ve ECharts örneğinde mavi–yeşil–mavi geçişini, örnek kimliğinin korunmasını, dört dağılım modunu, seçim callback'lerini, seçili nokta boyutunu, SVG geometrisini ve Canvas'ın aynı konumda yeniden çizimini sınar. Mevcut testlerde 1–8. haftalarda net puan birikimi, Türkiye tarih sınırları, araç ayrımları, rol kapsamı ve 1100/330 px ECharts SVG çizimi de kontrol edildi. Hesap testlerinde sahte veri kullanıldı; canlı Çek Talebi toplamıyla yeni bir veri karşılaştırması yapılmadı.

## Kontrol sınırları ve mevcut bulgular

- Happy DOM içinde gerçek React/Radix ve ECharts SVG çalıştırıldı. Canvas için kayıt tutan sahte 2D bağlam kullanıldı; Canvas piksel görüntüsü veya gerçek Chrome oturumu doğrulaması iddia edilmez. Progress'in kök tema değişkeni, mevcut renk sınıfları ve yüzde hareketi sınandı.
- Genel CSS'nin önceki katalog kaydından gelen `Missed semicolon` bulgusu aynı bildirim özetiyle sürer. PostCSS/Tailwind işlemi uyarısız tamamlanır; hedef kurallar AST üzerinden kontrol edildi. Genel CSS'nin tümünün temiz olduğu veya tam production build yapıldığı söylenmez.
- Kurulu ECharts sürümü değişmeyen `grid.containLabel` kullanımı için uyarı üretir. Testteki Next/Image taklidi de `unoptimized` özniteliği için React uyarısı üretir. Renk işi içinde yerleşim veya test altyapısı yeniden düzenlenmedi.
- Gerçek PNG indirme/filigran çıktısı, tüm rollerde gerçek oturum, medya oynatımı, canlı veritabanı veya e-posta/push teslimatı yapılmadı. TUS/GUID, puan, gönderim, alıcı ve teslimat akışları değiştirilmedi.

**İş planının 8. kutusu işaretlendi.** Kalan sayfa renkleri ve rol bazındaki ekran kapsamı 9. adımda ele alınacak; 9. adım başlatılmadı.

[Makine tarafından okunabilir kayıt](renk-ortaklastirma/adim8/DOGRULAMA.json) · [İş planı](RENK_ORTAKLASTIRMA_IS_PLANI.md)
