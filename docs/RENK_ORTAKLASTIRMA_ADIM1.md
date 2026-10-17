# Renk ortaklaştırması — 1. adım sonucu

**Tarih:** 17 Ekim 2026.  
**Durum:** TAMAMLANDI — ilk küçük kontrol renk grubunun ortak tanımları ve eşlemesi hazır.

## Yapılan değişiklik

Sade Kontrollerin ilk kuralındaki altı yerel renk için `app/tema.css` içine amaç belirten karşılıklar eklendi. Mavi tanımlar mevcut kaynak değerleriyle aynıdır. Yeşil tanımlar mevcut onaylı palet değişkenlerinden çözülür; ikinci bir yeşil palet kopyalanmadı.

Bu adım renklerin ortak kaynağını hazırlar. Kontrollerin bu değişkenleri kullanması 2. adımdadır; `components/kontrol/sade-kontroller.module.css` bu adımda değiştirilmedi.

## Kaynak ve eşleme tablosu

Kaynak: [sade-kontroller.module.css](../components/kontrol/sade-kontroller.module.css), ilk kuralın 2–7. satırları. Ortak tanımlar: [tema.css](../app/tema.css).

| Yerel kaynak | Kullanım amacı ve mevcut tüketimi | Mevcut mavi | Ortak değişken | Yeşil karşılık | Onaylı palet kaynağı |
| --- | --- | --- | --- | --- | --- |
| `--surface` | Kontrol, menü, arama, kapsül, native seçim ve tarih yüzeyi | `#fff` | `--tema-kontrol-yuzey` | `var(--tema-yuzey)` → `#fcfdf8` | Rehber demosundaki panel yüzeyi |
| `--text` | Form seçimi, menü/seçenek, arama ve alan ana metni | `#203653` | `--tema-kontrol-metin` | `var(--tema-metin)` → `#2c4137` | Rehber demosundaki ana metin |
| `--muted` | Yardımcı metin, boş durum, pasif kapsül ve sekme metni | `#718198` | `--tema-kontrol-ikincil-metin` | `var(--tema-ikincil-metin)` → `#68766e` | Rehber açıklamasındaki ikincil metin |
| `--line` | Kontrol/menü/arama/kapsül kenarı ve sekme ayırıcısı | `#dbe5ef` | `--tema-kontrol-cizgi` | `var(--tema-cizgi)` → `#dfe3d7` | Rehber demosundaki panel kenarı |
| `--blue` | Kontrol vurgusu, seçili seçenek/sekme, kapsül zemini ve checkbox vurgusu | `#237ac8` | `--tema-kontrol-eylem` | `var(--tema-eylem)` → `#355545` | Rehber demosundaki eylem rengi |
| `--hover` | Seçenek üzerine gelme/seçim zemini ve kapsül üzerine gelme zemini | `#edf6ff` | `--tema-kontrol-hover` | `var(--tema-secili)` → `#edf2e7` | Rehber demosundaki seçili sekme zemini |

Yeşil kaynak referansları: [rehber-demo CSS](../app/rehber-demo/demo.module.css) ve [rehber CSS](../components/rehber/rehber.module.css). Bunların ortak paletteki karşılıkları kullanıldı.

Bu grup mevcut altı yerel değişkenle sınırlıdır. Doğrudan yazılmış focus/ok renkleri, gölgeler, seçili kapsülün beyaz metni, yerel sayfa istisnaları ve diğer aileler bu adımda taşınmadı. Durum/başarı/hata renkleri değiştirilmedi. Kontrol mavisi `#237ac8`, genel eylem mavisi `#2563eb` ile birleştirilmedi.

## Korunan kapsam

- Bileşen, prop/varyant, DOM, ölçü, font, yerleşim veya davranış değişikliği yapılmadı.
- `app/globals.css` ve `lib/tema/temalar.ts` için yeni değişiklik gerekmedi; mevcut köprü ve tema kimlikleri korundu.
- Kontrol CSS'sinin SHA-256 değeri değişiklik öncesi ve sonrası aynı: `277b81fc85d63a3d8785c0034679cfbc0b82addbb7e2f4f4e3a0bd37c7ea5127`.
- Tema CSS'sindeki önceki **91 bildirimin** seçici, özellik, değer, sıralama ve `!important` durumunun korunduğu PostCSS ayrıştırmasıyla karşılaştırıldı. Yalnız altı rengin iki tema için toplam 12 tanımı eklendi.

## Doğrulama sonucu

| Kontrol | Sonuç | Doğruladığı kapsam |
| --- | --- | --- |
| `node --import ./tests/_alias.mjs --test tests/temaAltyapisi.hedef.test.ts` | **5/5 başarılı** | Mevcut genel/shadcn renkleri, mavi/yeşil geçiş, kardeş kapsam izolasyonu, iç içe tema sıfırlanması ve kontrol renkleri |
| Kontrol kaynak CSS'siyle karşılaştırma | Başarılı | Altı mavi karşılık, gerçek `.trigger` yerel değişkenleriyle Happy DOM'da karşılaştırıldı; mavi → yeşil → mavi geçişinde yeşil karşılıklar ve dışarıdaki mavi kontrol sınandı |
| `npm run typecheck:build` | Başarılı | Next.js rota tipleri ve uygulama TypeScript kontrolü |
| `./node_modules/.bin/eslint tests/temaAltyapisi.hedef.test.ts` | Başarılı; hata/uyarı yok | Değişen test dosyası |
| Mevcut PostCSS/Tailwind yapılandırmasıyla `app/globals.css` derlemesi | Başarılı; uyarı yok | Altı değişkenin her iki tema için toplam 12 tanımı gerçek derlenmiş CSS içinde mevcut |
| Önceki tema bildirimleri ve kontrol CSS kaynağı | Başarılı | Mevcut tanımların ve henüz dönüştürülmeyen tüketicinin korunumu |

Bu adımda gerçek tarayıcı/rol ekranı kontrolü, veritabanı işlemi veya canlı dağıtım yapılmadı. Ortak tanımlar henüz kontrollere bağlanmadığı için ekran dönüşümü tamamlanmış sayılmaz; ilgili kullanım ve görünüm kontrolleri 2. adımda yapılacak. Tüm rollerin sonraki kapsam kontrolü iş planında açık kalır.

## Sonraki küçük teslim

2. adımda Sade Kontrollerin ilk kuralındaki altı yerel renk, burada hazırlanan ortak değişkenlere bağlanacak. Diğer renkler ve yerel kullanım istisnaları bu geçişten ayrı izlenecek. Bu adımda 2. adım başlatılmadı.
