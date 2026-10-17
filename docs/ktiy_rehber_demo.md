# Cogniti'nin hareketli rehberi Kity

Platformun yeni adı Cogniti; walkthrough avatarının adı Kity'dir. Karşılama, tur düğmeleri ve açıklama balonunun imzasında Kity kullanılır.

Önizleme: `http://localhost:3000/rehber-demo`.

Başlat düğmesinden sonra avatar Yayınlarım, yayın kartı, Puanlarım ve Hesabım hedeflerine yürür. Hedefe varınca işaret eder; açıklama balonu açılır. Otomatik tur duraklatılabilir; ileri/geri düğmeleri ve Escape ile kapatma desteklenir. Yeniden başlatma ilk adıma döner. Hedefler kimliklerinden bulunur; kaydırma ve ekran boyutu değişimlerinde konumları yeniden ölçülür. Azaltılmış hareket tercihiyle yürüyüş ve otomatik ilerleme kapalıdır.

Bitir düğmesi ve otomatik turun sonu, veda akışını başlatır: anlatım/işaret katmanı kapanır, Kity mevcut konumundan ekranın merkezine yürür, dört pozla elini kaldırıp sallar ve 750 ms içinde saydamlaşarak kaybolur. El hareketi 1.400 ms sürer. Tamamlama ve kapatma geri çağrıları veda sonunda bir kez çalışır. Veda sırasında Escape veya sağ üstteki × beklemeyi atlar. Azaltılmış hareket tercihinde merkeze doğrudan yerleşir, sabit el kaldırma pozu gösterir ve kapanır.

Bu sayfa örnek içerikli bir önizlemedir. Gerçek üyelik, yayın izleme veya puan işlemi yapmaz. Mevcut kullanıcı sayfalarına otomatik tur eklenmedi. `components/rehber/YuruyenRehber.tsx`, hedef kimlikleri ve adım açıklamaları verilerek başka sayfalarda kullanılabilir.

## Görsel

- Kullanıcının referansı: `/Users/iskendereser/Desktop/cogniti welcome.png`.
- Projede kullanılan çıktı: `public/rehber/cogniti-sprite.png`.
- Yerleşim: dört sütun, iki satır; altı yürüyüş karesi, bir bekleme, bir işaret etme pozu. Sol yön için kareler aynalanır.
- Üretim: yerleşik `image_gen` aracı; şeffaf arka plan. CLI kullanılmadı.

Kullanılan üretim istemi:

```text
Create a production sprite sheet for a walking website guide using the attached woman as the exact identity and clothing reference. Preserve her recognizable face, shoulder-length brown hair, plain white t-shirt, blue straight-leg jeans, black belt and white sneakers. Photorealistic, friendly, anatomically correct. OUTPUT: exactly 4 equal columns by 2 equal rows, 8 frames total, square 2048x2048 canvas if possible, each cell 512x1024. TRUE transparent background, no floor, no background, no shadows outside the figure, no checkerboard, no text, no borders. Every cell shows exactly one full-body woman, identical scale, feet at same baseline 95% of cell height, head at 6% height, centered pelvis at same x coordinate, with generous margins; no part crosses a cell boundary. Read cells left to right, top to bottom. Frames 1-6: a smooth six-frame looping walk cycle traveling toward the RIGHT in three-quarter side view, face partly visible: (1) left foot forward contact/right foot back, (2) weight down, (3) right knee passes left leg, (4) right foot forward contact/left foot back, (5) weight down opposite leg, (6) left knee passes right leg. Arms swing opposite legs. Real distinct leg poses. Frame 7 (bottom row third cell): standing facing viewer, relaxed arms and friendly smile, full body. Frame 8 (bottom row fourth cell): standing three-quarter facing RIGHT, one arm extended horizontally to the RIGHT with index finger pointing, full body. Uniform lighting and identity throughout all 8 frames, no duplicate people within a cell. This is an animation asset sheet, not a collage.
```

## Doğrulama

- `tests/yuruyenRehber.hedef.test.ts`: ekran sınırları, hedefe yürüyüş, duraklatılmış otomatik turda elle geçiş, bitirme, kayıp hedef, Escape, yeniden başlatma ve animasyon temizliği.
- Tarayıcıda 1366×900 ve 390×844 boyutlarında hareket, işaret etme, balon konumu ve kaydırma kontrol edildi.
- Şema veya veritabanı değişikliği yoktur.

## Kity veda görseli

- Çıktı: `public/rehber/kity-veda.png`; gerçek alfa, 1774×887, tek satırda dört kare.
- Aynı kimlik ve kıyafetlerle kollar aşağıda → el göğüste → el başın yanında → bilekten veda pozu.
- Yerleşik `image_gen` aracı kullanıldı; CLI kullanılmadı.
- `components/rehber/KityVeda.tsx` hareketi ve kapanışı yönetir.
- Beş hedef test; aşama sırası, ekran merkezi, saydamlaşma, tek tamamlama ve Esc/animasyon temizliği dahil başarılı.
- Tarayıcıda el kaldırma sırasında avatar kutusunun merkezi `[683, 450]`, ekran merkezi `[683, 450]`; devamında saydamlaşma ve tüm hareketli katmanın kaldırılması doğrulandı.

Veda görselinin üretim istemi:

```text
Create one transparent PNG animation sprite sheet for the farewell of Kity, the exact same photorealistic female website guide as in the supplied reference images. Image 1 is her existing animation sheet: match the FRONT-FACING STANDING woman in cell 7 (bottom row, third column) in identity, hair, body scale, clothing and friendly smile. Image 2 is the original identity reference. White plain T-shirt, blue straight-leg jeans, black belt, white sneakers. OUTPUT exactly FOUR EQUAL CELLS in ONE HORIZONTAL ROW, a 2:1 landscape canvas (2048x1024 if possible), each cell portrait 1:2. Every frame shows one complete full-body woman from head to shoes. ALL FOUR: same forward-facing stationary body, identical camera and proportions, pelvis exactly centered within its cell, feet together on a baseline at 95% cell height, head at 6%, generous empty margins so hands never cross cell boundaries. Frame 1: both arms relaxed down. Frame 2: her right arm (on viewer's left) starts rising, elbow bent, hand at chest level, palm toward viewer. Frame 3: that arm fully raised beside her head, open palm toward viewer, beginning friendly goodbye wave. Frame 4: same raised arm, wrist tilted slightly to wave goodbye. The other arm stays down, feet do not move. Genuine transparent alpha background; no scene, floor, contact shadow, text, labels, grid lines, borders or checkerboard. Natural skin tones, clean antialiased cutout, no colorful fringe. Keep identity and alignment extremely consistent across the four frames, suitable for smooth sequential animation.
```
