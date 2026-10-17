# HOYK renk karşılaştırması

Adres: `http://localhost:3000/renk-demo`.

Kullanıcı, Cogniti marka geçişi öncesinde HOYK yoğunluğu yüksek bir ekranda mevcut beyaz ağırlıklı görünümle yeşil/toprak paleti arasında geçiş görmek istedi. Marka/domain geçişi proje tamamlandığında yapılacak; bu çalışma yalnız renk önizlemesidir.

Önizleme, gerçek `YayinKarti` bileşenini on örnek yayınla kullanır. Üstteki Kırık beyaz–mavi / Sütlü kahve–yeşil düğmeleri aynı DOM üzerinde renk değiştirir. Her iki görünümde marka HapBilgi'dir. Filtre, arama, beğeni ve favori durumu geçişte korunur. Örnek içerik için canlı veritabanına istek atılmaz.

## Ortak altyapıya geçiş — 17 Ekim 2026

Ana palet artık `app/tema.css` ortak kaynağından gelir; tema kimlikleri `lib/tema/temalar.ts` içinde `mavi` ve `yesil` olarak tanımlıdır. İlk altyapı adımı ve gerçek ekranlardaki renk eşlemeleri `docs/TEMA_ALTYAPISI.md` dosyasında izlenir. Kullanıcının güncel kararıyla bileşen ortaklaştırması yapılmayacak; mevcut yapılar korunarak yalnız renk çalışması sürdürülecek. Aşağıdaki görsel palet korunmuştur. Ayrıntılı önizleme kuralları yalnız yerel yeşil tema kapsamındadır; bütün gerçek ekranların dönüşümü henüz yapılmadı.

## Palet

| Alan | Kırık beyaz–mavi | Sütlü kahve–yeşil |
| --- | --- | --- |
| Sayfa zemini | `#f9fafb` | `#f6f5ef` |
| Kart yüzeyi | `#ffffff` | `#ffffff` |
| Panel/arama yüzeyi | `#ffffff` | `#fcfdf8` |
| Gezinme zemini | `#ffffff` | `#f6f5ef` |
| Ana metin | `#1f2937` | `#2c4137` |
| İkincil metin | `#6b7280` | `#68766e` |
| Ana eylem | `#2563eb` | `#355545` |
| Seçili alan | `#eff6ff` | `#edf2e7` |
| Bilgi alanı | `#f1f5f9` | `#eef1e6` |
| Toprak vurguları | — | `#967346`, `#b49a72` |
| Puan rozeti | Mavi gradyan | `#f4f6ed`, metin `#536d4c` |
| Ek puan rozeti | Yeşil gradyan | `#e8eedd`, metin `#536d4c` |
| Açılan pencere | Beyaz | `#fffefb`, kenar `#e0d6c6` |

Kullanıcının düzeltmesiyle yalnız zemin değil tüm renk ayrıntıları walkthrough referansına uyarlandı. Kaynaklar `app/rehber-demo/demo.module.css` ve `components/rehber/rehber.module.css`: sayfa, panel, sekme, düğme, kapak, puan alanı, balon ve odak renkleri doğrudan bu dosyalardan alındı. Yoğun kartlardaki küçük metinler için walkthrough balonunun okunaklı `#68766e` rengi kullanıldı.

Örnek kartların varsayılan video/görsel kapakları açık adaçayı, podcast/literatür kapakları krem ve sütlü kahve tonları kullanır. Yayın türü pilleri, durum metinleri, puan/ek puan, beğeni/favori, çizgiler, gezinme, pencere ve odak ayrıntıları da bu palete uyar. Durumların metinleri ve seçili simgelerin doluluğu korunur. Yüklenmiş gerçek yayın görsellerine filtre veya renk müdahalesi uygulanmaz. İki palet kullanıcı tarafından benimsendi; gerçek ekranların dönüşümü aşamalı ilerleyecek.

Ortak kartta gözlem/stil amaçlı `data-hoyk-*` kancaları ile `--hoyk-kart-zemini` ve `--hoyk-puan-zemini` değişkenleri bulunur. Varsayılan kapak `data-arac-varsayilan-kapak` kancası taşır. [Renk ortaklaştırması 6. adımında](RENK_ORTAKLASTIRMA_ADIM6.md) kart/kapak renkleri gerçek bileşenlere taşındı; bu iki yerel değişkenin varsayılanı artık ortak tema kaynağından gelir. Önizlemenin eski kart/kapak renk ezmeleri kaldırıldı. 5. adımın kabulü gereği işlevsel durum ve araç pili renkleri iki temada korunur; demoya özgü gölge ölçüleri ayrı kalır.

## Önizlemenin önceki tarayıcı doğrulaması

- 1440×1000 ve 390×844 tarayıcı görünümlerinde iki paletin on kartının metinleri, ölçüleri ve konumları aynı.
- Mobilde yatay sayfa taşması yok.
- Filtre ve beğeni seçimi palet geçişinde korundu.
- `eclubHoykDurumGorunumu.hedef.test.ts` ve `eclubHoykSecim.hedef.test.ts`: 5/5 başarılı.
- `npm run typecheck:build`: başarılı.
- Değişen TSX dosyalarının ESLint kontrolü: başarılı.
- Veritabanı değişikliği veya genel marka geçişi yapılmadı.
