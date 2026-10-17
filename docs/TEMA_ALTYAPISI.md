# HapBilgi ortak tema altyapısı

**Güncel sonuç — 17 Ekim 2026:** Çift tema uygulaması kullanıcı tarafından tamamlandı ve onaylandı. Güncel durum için [Çift Tema Sonuç Kaydı](CIFT_TEMA_SONUC.md) esas alınır. Aşağıdaki ilk altyapı ilerleme ve test kayıtları çalışmanın önceki aşamalarını anlatır.

## Güncel öncelik — 17 Ekim 2026

**Güncel kullanıcı kararı: Bileşen ortaklaştırması yapılmayacak; yalnız renk sistemi ve çift tema çalışmasıyla devam edilecek.** Sistemin mevcut karmaşıklığı nedeniyle önceki bileşen ortaklaştırma yönü kapsamdan çıkarıldı. Mevcut tema altyapısı, renk envanteri ve kaynak eşlemeleri renk çalışmasının referansıdır; bileşen birleştirme planı değildir.

**Uygulama sırası:** [Renk Ortaklaştırması İş Planı](RENK_ORTAKLASTIRMA_IS_PLANI.md). İlk sekiz adım tamamlandı; kontrol, gezinme, form, pill/durum, HOYK/oynatıcı, yardımcı görünümler ve çizim renkleri ortak kaynağa bağlı. [8. adımda](RENK_ORTAKLASTIRMA_ADIM8.md) ECharts/SVG/Canvas için tema takibi ve CSS’den otomatik TS çıktısı eklendi. 47/47 test, TypeScript ve hedef lint başarılı. Önceki genel CSS katalog bulgusu ve kontrol sınırları sonuç kaydında belirtilir. 9–10. adımlar başlamadı; önceki teslimlerin sınırları kendi raporlarında korunur.

**Yöntem:** Mevcut bileşen yapıları, prop/varyant sözleşmeleri ve sayfa/rol/durum farkları korunur. Renkler, kullanım amacı ve yerel CSS kapsamı gözetilerek mevcut yerlerinde tema değişkenlerine bağlanır. Tek bir ekran bütün platformun temsilcisi yapılmaz. Hazır kaynaklardan küçük renk değişiklikleri hazırlanır, gerekli kontrol yapılır ve hemen özet sunulur.

**Bağlayıcı koruma ve onay koşulu:** Renk çalışmasında mevcut metrik değerler, font ailesi/büyüklüğü/kalınlığı, nesne ölçüleri/yerleri, tablo yapıları ve davranışlar korunur. Mavi tema mevcut kullanım renklerini korur; yeşil karşılıklar onaylı palete göre ele alınır. Her adım sonunda özet sunulur; gerekli ekran kontrolü kullanıcıyla yapılır. Zorunlu fark, seçenek veya bilinmeyen durum/nesne için açık kullanıcı onayı beklenir.

Aşağıdaki ilerleme, ilk tema altyapısının durumunu gösterir; gerçek kullanımların tamamının ortak sisteme taşındığı anlamına gelmez.

## İlerleme

1. **Ortak renk altyapısı:** Hazır. İki palet, CSS değişkenleri, mevcut genel stil/bileşen eşlemeleri ve renk önizlemesi bağlandı.
2. **Gerçek renk kullanım eşlemeleri:** Sade Kontrollerin altı temel rengi, odak/ok/seçili metin ve gölgeleri ortak kaynağa bağlandı; Radix Select'in iki focus rengi de değişken kullanıyor. 40/40 hedef kontrol başarılı; [2. adım kaydında](RENK_ORTAKLASTIRMA_ADIM2.md) tamamlanma dayanağı ve ek tarayıcı kontrollerinin kapsamı ayrı belirtilmiştir. Diğer aileler ve sayfa/rol/durum kullanımları sırayla ele alınacak; tek ekrandan genelleme yapılmayacak.
3. **Yaygınlaştırma:** Başladı. Kontrol, menü/kabuk, buton/form, pill/durum, HOYK/oynatıcı, kart/yardımcı görünüm ve çizim ailelerinin renkleri bağlandı. İşlevsel rol/araç/durum paletleri iki temada aynı; nötr pill ve tarih yüzeyleri onaylı palete uyar. Mevcut mavi değerler ve renk dışı kaynak korundu. Sayfa özelindeki kalan renkler ve rol kapsamı 9. adımda izlenecek.
4. **Tercihin kalıcılığı:** Bekliyor. Gerçek siteye tema seçicisi eklenecek; hesap tercihi doğrulanmış kimlik/şema üzerinden kaydedilecek ve ilk çizimden önce uygulanacak.

Marka hâlen **HapBilgi**. Tema seçmek marka veya domain değiştirmez.

## Kaynaklar

- `app/tema.css`: Ana paletlerin renk değerleri ve mevcut shadcn CSS değişkenlerine köprü.
- `lib/tema/temalar.ts`: `mavi` / `yesil` kimlikleri, görünen adlar ve varsayılan `mavi` seçimi. Renkler burada tekrarlanmaz.
- `app/globals.css`: Ortak CSS'yi yükler; Tailwind renk adlarını bu değişkenlere eşler.
- `app/layout.tsx`: Sunucunun ilk HTML'inde `data-tema="mavi"` üretir.
- `app/renk-demo`: Ana paleti ortak değişkenlerden okuyan çalışma örneği.

## Renk kullanımı

Renk adından ziyade kullanım amacı seçilir:

```tsx
<section className="bg-tema-zemin text-tema-metin">
  <button className="bg-tema-eylem text-tema-eylem-metin hover:bg-tema-eylem-hover">
    Devam et
  </button>
</section>
```

CSS Modules veya mevcut inline stillerde aynı kaynak kullanılır:

```css
.panel {
  background: var(--tema-yuzey);
  color: var(--tema-metin);
  border: 1px solid var(--tema-cizgi);
}
```

`--tema-puan-zemini` gibi değişkenler gradyan da içerebildiği için `background` ile kullanılır. `--tema-hata`, `--tema-basari`, `--tema-uyari` ve `--tema-bilgi` işlem sonuçlarını ifade eder; dekoratif vurgu için kullanılmaz.

Mevcut `--primary`, `--card`, `--border` vb. değişkenlerle çalışan bileşenler aynı köprüden yararlanır. Eski `mavi`, `bordo` gibi Tailwind adları uyumluluk için korunur; yeni bileşenlerde amaç belirten adlar tercih edilir.

## Tema kapsamı

`data-tema="mavi"` kırık beyaz–mavi, `data-tema="yesil"` sütlü kahve–yeşil paleti seçer. Kök HTML'de uygulama genelini, alt bir kapsayıcıda yalnız o alanı etkiler. İç içe kapsamlar desteklenir; köprü değişkenleri her tema sınırında yeniden hesaplanır.

İki seçenek de açık temadır. İşletim sistemi koyu mod tercihi bu paletleri değiştirmez. İlk aşamada varsayılan mavi görünüm sunucudan uygulanır; renk önizlemesindeki seçim yalnız o sayfanın React state'inde kalır.

Bu ilk adım, bütün ekranların dönüşümü anlamına gelmez. Önizlemenin ayrıntılı kapak/rozet kuralları ve gerçek sayfalardaki sabit renklerin tema değişkenlerine bağlanması sonraki adımlardadır. Hesap tercihi, veritabanı alanı veya kalıcı tema seçimi bu aşamada eklenmedi.

## Doğrulama

Hedef test: `node --import ./tests/_alias.mjs --test tests/temaAltyapisi.hedef.test.ts`.

Testler CSS'yi Happy DOM'da çalıştırır: mevcut mavi değerler, yeşil kapsamın kardeş alanı etkilememesi, iç içe temalarda bileşen köprüsünün sıfırlanması ve iki yönlü geçişte durum renkleri sınanır. Gerçek CSS derlemesi ve görünüm ayrıca yerel tarayıcıda denetlenir; bu testler tüm rollerin ekranlarının dönüştürüldüğü anlamına gelmez.

### İlk adımın sonucu — 17 Ekim 2026

- Tema hedef testleri: **4/4 başarılı**.
- `npm run typecheck:build`: başarılı.
- Değişen TS/TSX ve hedef test dosyalarının ESLint kontrolü: hata/uyarı yok.
- Mevcut PostCSS/Tailwind zinciriyle `globals.css` derlemesi: tema değişkenleri çıktı içinde, uyarı yok.
- Önizlemedeki görünür 489 alt öğenin renk/stil değerleri ve on kartın ölçü/metinleri, değişiklik öncesiyle her iki temada aynı.
- 1440×1000 masaüstü ve 390×844 mobil görünümde yatay taşma yok; mobilde iki tema seçimi doğrulandı.
- Veritabanı veya canlı dağıtım işlemi yapılmadı; sonuç yerel uygulamada doğrulandı.

## Grafik ve hesaplanan renkler — 8. adım

- `app/tema.css` tek renk kaynağıdır. `lib/tema/hesaplananRenkler.generated.ts` içindeki 99 çizim rengi `scripts/denetim/hesaplanan-renkleri-uret.mjs` ile üretilir; elle düzenlenmez. Veri URL'sindeki SVG seçim oku doğrudan CSS'de kalır.
- CSS çizim renkleri değişince `node scripts/denetim/hesaplanan-renkleri-uret.mjs` çalıştırılır. `typecheck:build` içindeki `--check`, çıktının güncel olmasını zorunlu kılar.
- `lib/tema/cizimRenkleri.ts` ECharts/Canvas için gerçek renk çözümlemesi ve üst kapsam tema takibini sağlar. ECharts örneği ve HOYK animasyon konumu tema geçişinde korunur. Progress mevcut `--primary` köprüsünü kullanır.
- İşlevsel araç/süre/kazanım/kayıp ve madalya renkleri iki temada aynı kalır. Dekoratif seri ve yüzey/eksen/etiket renkleri onaylı yeşil karşılıkları kullanır.
- [Sonuç ve kontrol sınırları](RENK_ORTAKLASTIRMA_ADIM8.md): 47/47 test başarılı; gerçek tarayıcı veya canlı dağıtım yapılmadı.
