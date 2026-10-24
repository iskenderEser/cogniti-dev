# CSS değişkenlerinin bütün tanımları

Aynı değişken adı farklı kapsamlarda farklı değer alabilir. Buradaki liste tanım yerlerini korur; farklı kapsamlardaki değerleri tek bir kesin renk gibi birleştirmez. Renk dışındaki ölçü/yazı değişkenleri de bağımlılığın kaybolmaması için bu listede bulunur.

| Değişken | Değer | Kapsam / seçici | Kaynak |
| --- | --- | --- | --- |
| `--depo-sayisi` | `1` | .ozetKartlari.ozetKartlari | [app/(panel)/eclub/listem/_components/EczaneBlogu.module.css:2](/Users/iskendereser/Desktop/cogniti-dev/app/(panel)/eclub/listem/_components/EczaneBlogu.module.css:2) |
| `--depo-sayisi` | `2` | .ozetKartlari[data-depo-sayisi="2"] | [app/(panel)/eclub/listem/_components/EczaneBlogu.module.css:7](/Users/iskendereser/Desktop/cogniti-dev/app/(panel)/eclub/listem/_components/EczaneBlogu.module.css:7) |
| `--depo-sayisi` | `3` | .ozetKartlari[data-depo-sayisi="3"] | [app/(panel)/eclub/listem/_components/EczaneBlogu.module.css:11](/Users/iskendereser/Desktop/cogniti-dev/app/(panel)/eclub/listem/_components/EczaneBlogu.module.css:11) |
| `--varyant-paper` | `var(--tema-yayin-kart)` | .varyantPanel | [app/(panel)/raporlar/yayin-raporlari/yayin-raporlari.module.css:27](/Users/iskendereser/Desktop/cogniti-dev/app/(panel)/raporlar/yayin-raporlari/yayin-raporlari.module.css:27) |
| `--varyant-ink` | `var(--tema-yayin-metin)` | .varyantPanel | [app/(panel)/raporlar/yayin-raporlari/yayin-raporlari.module.css:28](/Users/iskendereser/Desktop/cogniti-dev/app/(panel)/raporlar/yayin-raporlari/yayin-raporlari.module.css:28) |
| `--varyant-muted` | `var(--tema-yayin-varyant-yardimci)` | .varyantPanel | [app/(panel)/raporlar/yayin-raporlari/yayin-raporlari.module.css:29](/Users/iskendereser/Desktop/cogniti-dev/app/(panel)/raporlar/yayin-raporlari/yayin-raporlari.module.css:29) |
| `--varyant-line` | `var(--tema-yayin-varyant-cizgi)` | .varyantPanel | [app/(panel)/raporlar/yayin-raporlari/yayin-raporlari.module.css:30](/Users/iskendereser/Desktop/cogniti-dev/app/(panel)/raporlar/yayin-raporlari/yayin-raporlari.module.css:30) |
| `--varyant-track` | `var(--tema-yayin-varyant-iz)` | .varyantPanel | [app/(panel)/raporlar/yayin-raporlari/yayin-raporlari.module.css:31](/Users/iskendereser/Desktop/cogniti-dev/app/(panel)/raporlar/yayin-raporlari/yayin-raporlari.module.css:31) |
| `--varyant-tone` | `var(--tema-yayin-varyant-v1)` | .varyantKarti | [app/(panel)/raporlar/yayin-raporlari/yayin-raporlari.module.css:49](/Users/iskendereser/Desktop/cogniti-dev/app/(panel)/raporlar/yayin-raporlari/yayin-raporlari.module.css:49) |
| `--varyant-tone` | `var(--tema-yayin-varyant-v1)` | .normal | [app/(panel)/raporlar/yayin-raporlari/yayin-raporlari.module.css:51](/Users/iskendereser/Desktop/cogniti-dev/app/(panel)/raporlar/yayin-raporlari/yayin-raporlari.module.css:51) |
| `--varyant-tone` | `var(--tema-yayin-varyant-v2)` | .hazir_video | [app/(panel)/raporlar/yayin-raporlari/yayin-raporlari.module.css:52](/Users/iskendereser/Desktop/cogniti-dev/app/(panel)/raporlar/yayin-raporlari/yayin-raporlari.module.css:52) |
| `--varyant-tone` | `var(--tema-yayin-varyant-v3)` | .hazir_set | [app/(panel)/raporlar/yayin-raporlari/yayin-raporlari.module.css:53](/Users/iskendereser/Desktop/cogniti-dev/app/(panel)/raporlar/yayin-raporlari/yayin-raporlari.module.css:53) |
| `--varyant-tone` | `var(--tema-yayin-varyant-v4)` | .hazir_ikisi | [app/(panel)/raporlar/yayin-raporlari/yayin-raporlari.module.css:54](/Users/iskendereser/Desktop/cogniti-dev/app/(panel)/raporlar/yayin-raporlari/yayin-raporlari.module.css:54) |
| `--value` | `0` | .ring | [app/(panel)/raporlar/yonetici/yonetici-report.module.css:37](/Users/iskendereser/Desktop/cogniti-dev/app/(panel)/raporlar/yonetici/yonetici-report.module.css:37) |
| `--accent` | `var(--tema-yerel-rapor-eylem-metin-11)` | .educationTypeCard | [app/(panel)/raporlar/yonetici/yonetici-report.module.css:67](/Users/iskendereser/Desktop/cogniti-dev/app/(panel)/raporlar/yonetici/yonetici-report.module.css:67) |
| `--radius` | `0.75rem` | :root | [app/globals.css:8](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:8) |
| `--color-background` | `var(--background)` | theme | [app/globals.css:12](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:12) |
| `--color-foreground` | `var(--foreground)` | theme | [app/globals.css:13](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:13) |
| `--font-sans` | `var(--font-geist-sans)` | theme | [app/globals.css:14](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:14) |
| `--font-mono` | `var(--font-geist-mono)` | theme | [app/globals.css:15](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:15) |
| `--color-bordo` | `var(--tema-vurgu)` | theme | [app/globals.css:16](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:16) |
| `--color-mavi` | `var(--tema-bilesen-eylemi)` | theme | [app/globals.css:17](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:17) |
| `--color-kirmizi` | `var(--tema-hata)` | theme | [app/globals.css:18](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:18) |
| `--color-gri-metin` | `var(--tema-yardimci-metin)` | theme | [app/globals.css:19](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:19) |
| `--color-koyu-metin` | `var(--tema-baslik)` | theme | [app/globals.css:20](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:20) |
| `--color-gri-zemin` | `var(--tema-zemin)` | theme | [app/globals.css:21](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:21) |
| `--color-tema-zemin` | `var(--tema-zemin)` | theme | [app/globals.css:24](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:24) |
| `--color-tema-yuzey` | `var(--tema-yuzey)` | theme | [app/globals.css:25](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:25) |
| `--color-tema-kart` | `var(--tema-kart)` | theme | [app/globals.css:26](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:26) |
| `--color-tema-metin` | `var(--tema-metin)` | theme | [app/globals.css:27](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:27) |
| `--color-tema-ikincil` | `var(--tema-ikincil-metin)` | theme | [app/globals.css:28](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:28) |
| `--color-tema-vurgu` | `var(--tema-vurgu)` | theme | [app/globals.css:29](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:29) |
| `--color-tema-eylem` | `var(--tema-eylem)` | theme | [app/globals.css:30](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:30) |
| `--color-tema-eylem-hover` | `var(--tema-eylem-hover)` | theme | [app/globals.css:31](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:31) |
| `--color-tema-eylem-metin` | `var(--tema-eylem-metin)` | theme | [app/globals.css:32](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:32) |
| `--color-tema-secili` | `var(--tema-secili)` | theme | [app/globals.css:33](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:33) |
| `--color-tema-secili-metin` | `var(--tema-secili-metin)` | theme | [app/globals.css:34](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:34) |
| `--color-tema-cizgi` | `var(--tema-cizgi)` | theme | [app/globals.css:35](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:35) |
| `--color-tema-odak` | `var(--tema-odak)` | theme | [app/globals.css:36](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:36) |
| `--color-tema-basari` | `var(--tema-basari)` | theme | [app/globals.css:37](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:37) |
| `--color-tema-uyari` | `var(--tema-uyari)` | theme | [app/globals.css:38](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:38) |
| `--color-tema-hata` | `var(--tema-hata)` | theme | [app/globals.css:39](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:39) |
| `--color-card` | `var(--card)` | theme | [app/globals.css:42](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:42) |
| `--color-card-foreground` | `var(--card-foreground)` | theme | [app/globals.css:43](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:43) |
| `--color-popover` | `var(--popover)` | theme | [app/globals.css:44](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:44) |
| `--color-popover-foreground` | `var(--popover-foreground)` | theme | [app/globals.css:45](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:45) |
| `--color-primary` | `var(--primary)` | theme | [app/globals.css:46](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:46) |
| `--color-primary-foreground` | `var(--primary-foreground)` | theme | [app/globals.css:47](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:47) |
| `--color-secondary` | `var(--secondary)` | theme | [app/globals.css:48](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:48) |
| `--color-secondary-foreground` | `var(--secondary-foreground)` | theme | [app/globals.css:49](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:49) |
| `--color-muted` | `var(--muted)` | theme | [app/globals.css:50](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:50) |
| `--color-muted-foreground` | `var(--muted-foreground)` | theme | [app/globals.css:51](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:51) |
| `--color-accent` | `var(--accent)` | theme | [app/globals.css:52](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:52) |
| `--color-accent-foreground` | `var(--accent-foreground)` | theme | [app/globals.css:53](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:53) |
| `--color-destructive` | `var(--destructive)` | theme | [app/globals.css:54](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:54) |
| `--color-destructive-foreground` | `var(--destructive-foreground)` | theme | [app/globals.css:55](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:55) |
| `--color-border` | `var(--border)` | theme | [app/globals.css:56](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:56) |
| `--color-input` | `var(--input)` | theme | [app/globals.css:57](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:57) |
| `--color-ring` | `var(--ring)` | theme | [app/globals.css:58](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:58) |
| `--radius-sm` | `calc(var(--radius) - 4px)` | theme | [app/globals.css:59](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:59) |
| `--radius-md` | `calc(var(--radius) - 2px)` | theme | [app/globals.css:60](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:60) |
| `--radius-lg` | `var(--radius)` | theme | [app/globals.css:61](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:61) |
| `--radius-xl` | `calc(var(--radius) + 4px)` | theme | [app/globals.css:62](/Users/iskendereser/Desktop/cogniti-dev/app/globals.css:62) |
| `--demo-kahve-zemin` | `color-mix(in srgb, #f6f5ef 75%, #fff 25%)` | .navbarDiliSayfa | [app/renk-demo/renk.module.css:4](/Users/iskendereser/Desktop/cogniti-dev/app/renk-demo/renk.module.css:4) |
| `--tema-zemin` | `var(--demo-kahve-zemin)` | .navbarDiliSayfa[data-tema=yesil] | [app/renk-demo/renk.module.css:5](/Users/iskendereser/Desktop/cogniti-dev/app/renk-demo/renk.module.css:5) |
| `--tema-yan-zemin` | `var(--demo-kahve-zemin)` | .navbarDiliSayfa[data-tema=yesil] | [app/renk-demo/renk.module.css:5](/Users/iskendereser/Desktop/cogniti-dev/app/renk-demo/renk.module.css:5) |
| `--demo-navbar-zemin` | `#ffffff` | .navbarOnizleme | [app/renk-demo/renk.module.css:6](/Users/iskendereser/Desktop/cogniti-dev/app/renk-demo/renk.module.css:6) |
| `--hoyk-kart-zemini` | `var(--tema-kart)` | .sayfa[data-tema=yesil] | [app/renk-demo/renk.module.css:10](/Users/iskendereser/Desktop/cogniti-dev/app/renk-demo/renk.module.css:10) |
| `--hoyk-puan-zemini` | `var(--tema-puan-zemini)` | .sayfa[data-tema=yesil] | [app/renk-demo/renk.module.css:11](/Users/iskendereser/Desktop/cogniti-dev/app/renk-demo/renk.module.css:11) |
| `--tema-belge-zemini` | `#ffffff` | :root, [data-tema="mavi"] | [app/tema.css:4](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4) |
| `--tema-belge-metni` | `#171717` | :root, [data-tema="mavi"] | [app/tema.css:5](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:5) |
| `--tema-zemin` | `#f9fafb` | :root, [data-tema="mavi"] | [app/tema.css:6](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:6) |
| `--tema-yuzey` | `#ffffff` | :root, [data-tema="mavi"] | [app/tema.css:7](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:7) |
| `--tema-kart` | `#ffffff` | :root, [data-tema="mavi"] | [app/tema.css:8](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:8) |
| `--tema-yan-zemin` | `var(--tema-zemin)` | :root, [data-tema="mavi"] | [app/tema.css:9](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:9) |
| `--tema-cizgi` | `#e5e7eb` | :root, [data-tema="mavi"] | [app/tema.css:10](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:10) |
| `--tema-metin` | `#1f2937` | :root, [data-tema="mavi"] | [app/tema.css:11](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:11) |
| `--tema-ikincil-metin` | `#6b7280` | :root, [data-tema="mavi"] | [app/tema.css:12](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:12) |
| `--tema-yardimci-metin` | `#737373` | :root, [data-tema="mavi"] | [app/tema.css:13](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:13) |
| `--tema-baslik` | `#111827` | :root, [data-tema="mavi"] | [app/tema.css:14](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:14) |
| `--tema-vurgu` | `#bc2d0d` | :root, [data-tema="mavi"] | [app/tema.css:15](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:15) |
| `--tema-vurgu-acik` | `#fff3f0` | :root, [data-tema="mavi"] | [app/tema.css:16](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:16) |
| `--tema-secili` | `#eff6ff` | :root, [data-tema="mavi"] | [app/tema.css:17](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:17) |
| `--tema-secili-metin` | `#1d4ed8` | :root, [data-tema="mavi"] | [app/tema.css:18](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:18) |
| `--tema-eylem` | `#2563eb` | :root, [data-tema="mavi"] | [app/tema.css:19](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:19) |
| `--tema-eylem-hover` | `#1d4ed8` | :root, [data-tema="mavi"] | [app/tema.css:20](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:20) |
| `--tema-eylem-metin` | `#ffffff` | :root, [data-tema="mavi"] | [app/tema.css:21](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:21) |
| `--tema-bilgi-zemini` | `#f1f5f9` | :root, [data-tema="mavi"] | [app/tema.css:22](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:22) |
| `--tema-bilgi-metni` | `#52657a` | :root, [data-tema="mavi"] | [app/tema.css:23](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:23) |
| `--tema-toprak` | `#b45309` | :root, [data-tema="mavi"] | [app/tema.css:24](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:24) |
| `--tema-toprak-acik` | `#d97706` | :root, [data-tema="mavi"] | [app/tema.css:25](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:25) |
| `--tema-odak` | `#bc2d0d` | :root, [data-tema="mavi"] | [app/tema.css:26](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:26) |
| `--tema-puan-zemini` | `linear-gradient(to right, #1e3a8a 0%, #2563eb 55%, #3b82f6 100%)` | :root, [data-tema="mavi"] | [app/tema.css:27](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:27) |
| `--tema-puan-metni` | `#ffffff` | :root, [data-tema="mavi"] | [app/tema.css:28](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:28) |
| `--tema-ek-puan-zemini` | `linear-gradient(to right, #267d39 0%, #2e9143 55%, #3db856 100%)` | :root, [data-tema="mavi"] | [app/tema.css:29](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:29) |
| `--tema-ek-puan-metni` | `#ffffff` | :root, [data-tema="mavi"] | [app/tema.css:30](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:30) |
| `--tema-modal-zemini` | `#ffffff` | :root, [data-tema="mavi"] | [app/tema.css:31](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:31) |
| `--tema-modal-cizgisi` | `#e5e7eb` | :root, [data-tema="mavi"] | [app/tema.css:32](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:32) |
| `--tema-bilesen-eylemi` | `#56aeff` | :root, [data-tema="mavi"] | [app/tema.css:35](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:35) |
| `--tema-bilesen-ikincil` | `#f4f4f5` | :root, [data-tema="mavi"] | [app/tema.css:36](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:36) |
| `--tema-bilesen-ikincil-metni` | `#18181b` | :root, [data-tema="mavi"] | [app/tema.css:37](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:37) |
| `--tema-bilesen-soluk-metni` | `#71717a` | :root, [data-tema="mavi"] | [app/tema.css:38](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:38) |
| `--tema-kontrol-yuzey` | `#fff` | :root, [data-tema="mavi"] | [app/tema.css:41](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:41) |
| `--tema-kontrol-metin` | `#203653` | :root, [data-tema="mavi"] | [app/tema.css:42](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:42) |
| `--tema-kontrol-ikincil-metin` | `#718198` | :root, [data-tema="mavi"] | [app/tema.css:43](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:43) |
| `--tema-kontrol-cizgi` | `#dbe5ef` | :root, [data-tema="mavi"] | [app/tema.css:44](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:44) |
| `--tema-kontrol-eylem` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:45](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:45) |
| `--tema-kontrol-hover` | `#edf6ff` | :root, [data-tema="mavi"] | [app/tema.css:46](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:46) |
| `--tema-kontrol-eylem-metin` | `#fff` | :root, [data-tema="mavi"] | [app/tema.css:47](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:47) |
| `--tema-kontrol-odak` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:48](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:48) |
| `--tema-kontrol-golge` | `rgba(36,64,98,.05)` | :root, [data-tema="mavi"] | [app/tema.css:49](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:49) |
| `--tema-kontrol-menu-golge` | `rgba(31,74,111,.16)` | :root, [data-tema="mavi"] | [app/tema.css:50](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:50) |
| `--tema-kontrol-secili-golge` | `rgba(35,122,200,.2)` | :root, [data-tema="mavi"] | [app/tema.css:51](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:51) |
| `--tema-yenile-yuzey` | `#fff` | :root, [data-tema="mavi"] | [app/tema.css:54](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:54) |
| `--tema-yenile-cizgi` | `#d8e3ee` | :root, [data-tema="mavi"] | [app/tema.css:55](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:55) |
| `--tema-yenile-metin` | `#58708b` | :root, [data-tema="mavi"] | [app/tema.css:56](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:56) |
| `--tema-yenile-hover` | `#f4f8fb` | :root, [data-tema="mavi"] | [app/tema.css:57](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:57) |
| `--tema-pill-notr-zemin` | `#f3f4f6` | :root, [data-tema="mavi"] | [app/tema.css:59](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:59) |
| `--tema-pill-notr-metin` | `#4b5563` | :root, [data-tema="mavi"] | [app/tema.css:60](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:60) |
| `--tema-gezinme-metin` | `#374151` | :root, [data-tema="mavi"] | [app/tema.css:63](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:63) |
| `--tema-menu-secili-metin` | `#185fa5` | :root, [data-tema="mavi"] | [app/tema.css:64](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:64) |
| `--tema-menu-secili-zemin` | `rgba(86,174,255,0.12)` | :root, [data-tema="mavi"] | [app/tema.css:65](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:65) |
| `--tema-menu-secili-halka` | `rgba(86,174,255,0.35)` | :root, [data-tema="mavi"] | [app/tema.css:66](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:66) |
| `--tema-menu-hover` | `rgba(0,0,0,0.05)` | :root, [data-tema="mavi"] | [app/tema.css:67](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:67) |
| `--tema-ust-menu-zemin` | `#ffffff` | :root, [data-tema="mavi"] | [app/tema.css:68](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:68) |
| `--tema-secici-dolgu` | `color-mix(in srgb, #f9fafb 95%, #000 5%)` | :root, [data-tema="mavi"] | [app/tema.css:69](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:69) |
| `--tema-ust-menu-pill-zemin` | `rgba(0,0,0,0.04)` | :root, [data-tema="mavi"] | [app/tema.css:70](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:70) |
| `--tema-ust-menu-pill-cizgi` | `rgba(0,0,0,0.08)` | :root, [data-tema="mavi"] | [app/tema.css:71](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:71) |
| `--tema-ust-menu-pill-secili-metin` | `var(--tema-eylem)` | :root, [data-tema="mavi"] | [app/tema.css:72](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:72) |
| `--tema-ust-menu-pill-secili-zemin` | `var(--tema-secili)` | :root, [data-tema="mavi"] | [app/tema.css:73](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:73) |
| `--tema-ust-menu-pill-secili-cizgi` | `var(--tema-menu-secili-halka)` | :root, [data-tema="mavi"] | [app/tema.css:74](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:74) |
| `--tema-ust-menu-pill-hover` | `color-mix(in srgb, var(--tema-eylem) 7%, transparent)` | :root, [data-tema="mavi"] | [app/tema.css:75](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:75) |
| `--tema-ust-menu-logo-ayirici` | `var(--color-slate-200)` | :root, [data-tema="mavi"] | [app/tema.css:76](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:76) |
| `--tema-ust-menu-ayirici` | `var(--color-gray-200)` | :root, [data-tema="mavi"] | [app/tema.css:77](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:77) |
| `--tema-ust-menu-ozet-ayirici` | `#d1d5db` | :root, [data-tema="mavi"] | [app/tema.css:78](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:78) |
| `--tema-ust-menu-aciklama` | `#64748b` | :root, [data-tema="mavi"] | [app/tema.css:79](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:79) |
| `--tema-ust-menu-simge` | `var(--color-gray-700)` | :root, [data-tema="mavi"] | [app/tema.css:80](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:80) |
| `--tema-gezinme-avatar-zemin` | `#d4d4d4` | :root, [data-tema="mavi"] | [app/tema.css:81](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:81) |
| `--tema-gezinme-avatar-cizgi` | `#c9c9c9` | :root, [data-tema="mavi"] | [app/tema.css:82](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:82) |
| `--tema-mobil-menu-ayirici` | `#f0f0f0` | :root, [data-tema="mavi"] | [app/tema.css:83](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:83) |
| `--tema-hakkinda-baslik` | `#091c46` | :root, [data-tema="mavi"] | [app/tema.css:86](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:86) |
| `--tema-hakkinda-aciklama` | `#65748e` | :root, [data-tema="mavi"] | [app/tema.css:87](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:87) |
| `--tema-hakkinda-vurgu` | `#338eed` | :root, [data-tema="mavi"] | [app/tema.css:88](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:88) |
| `--tema-hakkinda-cizgi` | `#e5edf8` | :root, [data-tema="mavi"] | [app/tema.css:89](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:89) |
| `--tema-hakkinda-simge-zemin` | `#f0f6ff` | :root, [data-tema="mavi"] | [app/tema.css:90](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:90) |
| `--tema-hakkinda-adim-cizgi` | `#bad7fb` | :root, [data-tema="mavi"] | [app/tema.css:91](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:91) |
| `--tema-hakkinda-isik-baslangic` | `#d7e6ff` | :root, [data-tema="mavi"] | [app/tema.css:92](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:92) |
| `--tema-hakkinda-isik-orta` | `#e8f1ff` | :root, [data-tema="mavi"] | [app/tema.css:93](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:93) |
| `--tema-hakkinda-isik-son` | `#f9fbff` | :root, [data-tema="mavi"] | [app/tema.css:94](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:94) |
| `--tema-hakkinda-hat-baslangic` | `#4f9fff` | :root, [data-tema="mavi"] | [app/tema.css:95](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:95) |
| `--tema-hakkinda-hat-orta` | `#75b2ff` | :root, [data-tema="mavi"] | [app/tema.css:96](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:96) |
| `--tema-hakkinda-hat-son` | `#9bc8ff` | :root, [data-tema="mavi"] | [app/tema.css:97](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:97) |
| `--tema-hakkinda-nokta` | `#63a9f8` | :root, [data-tema="mavi"] | [app/tema.css:98](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:98) |
| `--tema-belge-zemini` | `#f8f8f3` | [data-tema="yesil"] | [app/tema.css:103](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:103) |
| `--tema-belge-metni` | `#2c4137` | [data-tema="yesil"] | [app/tema.css:104](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:104) |
| `--tema-zemin` | `#f8f8f3` | [data-tema="yesil"] | [app/tema.css:105](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:105) |
| `--tema-yuzey` | `#fcfdf8` | [data-tema="yesil"] | [app/tema.css:106](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:106) |
| `--tema-kart` | `#ffffff` | [data-tema="yesil"] | [app/tema.css:107](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:107) |
| `--tema-yan-zemin` | `#f8f8f3` | [data-tema="yesil"] | [app/tema.css:108](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:108) |
| `--tema-cizgi` | `#dfe3d7` | [data-tema="yesil"] | [app/tema.css:109](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:109) |
| `--tema-metin` | `#2c4137` | [data-tema="yesil"] | [app/tema.css:110](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:110) |
| `--tema-ikincil-metin` | `#68766e` | [data-tema="yesil"] | [app/tema.css:111](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:111) |
| `--tema-yardimci-metin` | `#68766e` | [data-tema="yesil"] | [app/tema.css:112](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:112) |
| `--tema-baslik` | `#2c4137` | [data-tema="yesil"] | [app/tema.css:113](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:113) |
| `--tema-vurgu` | `#355545` | [data-tema="yesil"] | [app/tema.css:114](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:114) |
| `--tema-vurgu-acik` | `#edf2e7` | [data-tema="yesil"] | [app/tema.css:115](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:115) |
| `--tema-secili` | `#edf2e7` | [data-tema="yesil"] | [app/tema.css:116](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:116) |
| `--tema-secili-metin` | `#4f7254` | [data-tema="yesil"] | [app/tema.css:117](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:117) |
| `--tema-eylem` | `#355545` | [data-tema="yesil"] | [app/tema.css:118](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:118) |
| `--tema-eylem-hover` | `#294636` | [data-tema="yesil"] | [app/tema.css:119](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:119) |
| `--tema-eylem-metin` | `#fffdf7` | [data-tema="yesil"] | [app/tema.css:120](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:120) |
| `--tema-bilgi-zemini` | `#eef1e6` | [data-tema="yesil"] | [app/tema.css:121](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:121) |
| `--tema-bilgi-metni` | `#65795f` | [data-tema="yesil"] | [app/tema.css:122](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:122) |
| `--tema-toprak` | `#967346` | [data-tema="yesil"] | [app/tema.css:123](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:123) |
| `--tema-toprak-acik` | `#b49a72` | [data-tema="yesil"] | [app/tema.css:124](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:124) |
| `--tema-odak` | `#af8b55` | [data-tema="yesil"] | [app/tema.css:125](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:125) |
| `--tema-puan-zemini` | `#f4f6ed` | [data-tema="yesil"] | [app/tema.css:126](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:126) |
| `--tema-puan-metni` | `#536d4c` | [data-tema="yesil"] | [app/tema.css:127](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:127) |
| `--tema-ek-puan-zemini` | `#e8eedd` | [data-tema="yesil"] | [app/tema.css:128](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:128) |
| `--tema-ek-puan-metni` | `#536d4c` | [data-tema="yesil"] | [app/tema.css:129](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:129) |
| `--tema-modal-zemini` | `#fffefb` | [data-tema="yesil"] | [app/tema.css:130](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:130) |
| `--tema-modal-cizgisi` | `#e0d6c6` | [data-tema="yesil"] | [app/tema.css:131](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:131) |
| `--tema-bilesen-eylemi` | `#355545` | [data-tema="yesil"] | [app/tema.css:132](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:132) |
| `--tema-bilesen-ikincil` | `#eef1e6` | [data-tema="yesil"] | [app/tema.css:133](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:133) |
| `--tema-bilesen-ikincil-metni` | `#2c4137` | [data-tema="yesil"] | [app/tema.css:134](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:134) |
| `--tema-bilesen-soluk-metni` | `#68766e` | [data-tema="yesil"] | [app/tema.css:135](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:135) |
| `--tema-kontrol-yuzey` | `var(--tema-yuzey)` | [data-tema="yesil"] | [app/tema.css:138](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:138) |
| `--tema-kontrol-metin` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:139](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:139) |
| `--tema-kontrol-ikincil-metin` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:140](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:140) |
| `--tema-kontrol-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:141](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:141) |
| `--tema-kontrol-eylem` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:142](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:142) |
| `--tema-kontrol-hover` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:143](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:143) |
| `--tema-kontrol-eylem-metin` | `var(--tema-eylem-metin)` | [data-tema="yesil"] | [app/tema.css:144](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:144) |
| `--tema-kontrol-odak` | `var(--tema-odak)` | [data-tema="yesil"] | [app/tema.css:145](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:145) |
| `--tema-kontrol-golge` | `color-mix(in srgb, var(--tema-eylem) 5%, transparent)` | [data-tema="yesil"] | [app/tema.css:146](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:146) |
| `--tema-kontrol-menu-golge` | `color-mix(in srgb, var(--tema-eylem) 16%, transparent)` | [data-tema="yesil"] | [app/tema.css:147](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:147) |
| `--tema-kontrol-secili-golge` | `color-mix(in srgb, var(--tema-eylem) 20%, transparent)` | [data-tema="yesil"] | [app/tema.css:148](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:148) |
| `--tema-yenile-yuzey` | `var(--tema-yuzey)` | [data-tema="yesil"] | [app/tema.css:150](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:150) |
| `--tema-yenile-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:151](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:151) |
| `--tema-yenile-metin` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:152](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:152) |
| `--tema-yenile-hover` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:153](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:153) |
| `--tema-pill-notr-zemin` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:155](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:155) |
| `--tema-pill-notr-metin` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:156](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:156) |
| `--tema-gezinme-metin` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:159](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:159) |
| `--tema-menu-secili-metin` | `var(--tema-secili-metin)` | [data-tema="yesil"] | [app/tema.css:160](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:160) |
| `--tema-menu-secili-zemin` | `color-mix(in srgb, var(--tema-vurgu) 12%, transparent)` | [data-tema="yesil"] | [app/tema.css:161](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:161) |
| `--tema-menu-secili-halka` | `color-mix(in srgb, var(--tema-vurgu) 35%, transparent)` | [data-tema="yesil"] | [app/tema.css:162](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:162) |
| `--tema-menu-hover` | `color-mix(in srgb, var(--tema-vurgu) 5%, transparent)` | [data-tema="yesil"] | [app/tema.css:163](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:163) |
| `--tema-ust-menu-zemin` | `#ffffff` | [data-tema="yesil"] | [app/tema.css:164](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:164) |
| `--tema-secici-dolgu` | `#f3f1e6` | [data-tema="yesil"] | [app/tema.css:165](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:165) |
| `--tema-ust-menu-pill-zemin` | `color-mix(in srgb, var(--tema-vurgu) 4%, transparent)` | [data-tema="yesil"] | [app/tema.css:166](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:166) |
| `--tema-ust-menu-pill-cizgi` | `color-mix(in srgb, var(--tema-vurgu) 8%, transparent)` | [data-tema="yesil"] | [app/tema.css:167](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:167) |
| `--tema-ust-menu-pill-secili-metin` | `var(--tema-vurgu)` | [data-tema="yesil"] | [app/tema.css:168](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:168) |
| `--tema-ust-menu-pill-secili-zemin` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:169](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:169) |
| `--tema-ust-menu-pill-secili-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:170](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:170) |
| `--tema-ust-menu-pill-hover` | `color-mix(in srgb, var(--tema-vurgu) 7%, transparent)` | [data-tema="yesil"] | [app/tema.css:171](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:171) |
| `--tema-ust-menu-logo-ayirici` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:172](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:172) |
| `--tema-ust-menu-ayirici` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:173](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:173) |
| `--tema-ust-menu-ozet-ayirici` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:174](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:174) |
| `--tema-ust-menu-aciklama` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:175](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:175) |
| `--tema-ust-menu-simge` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:176](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:176) |
| `--tema-gezinme-avatar-zemin` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:177](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:177) |
| `--tema-gezinme-avatar-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:178](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:178) |
| `--tema-mobil-menu-ayirici` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:179](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:179) |
| `--tema-hakkinda-baslik` | `var(--tema-baslik)` | [data-tema="yesil"] | [app/tema.css:182](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:182) |
| `--tema-hakkinda-aciklama` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:183](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:183) |
| `--tema-hakkinda-vurgu` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:184](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:184) |
| `--tema-hakkinda-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:185](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:185) |
| `--tema-hakkinda-simge-zemin` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:186](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:186) |
| `--tema-hakkinda-adim-cizgi` | `var(--tema-menu-secili-halka)` | [data-tema="yesil"] | [app/tema.css:187](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:187) |
| `--tema-hakkinda-isik-baslangic` | `color-mix(in srgb, var(--tema-eylem) 16%, var(--tema-yuzey))` | [data-tema="yesil"] | [app/tema.css:188](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:188) |
| `--tema-hakkinda-isik-orta` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:189](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:189) |
| `--tema-hakkinda-isik-son` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:190](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:190) |
| `--tema-hakkinda-hat-baslangic` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:191](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:191) |
| `--tema-hakkinda-hat-orta` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:192](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:192) |
| `--tema-hakkinda-hat-son` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:193](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:193) |
| `--tema-hakkinda-nokta` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:194](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:194) |
| `--tema-hata` | `#e24b4a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:203](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:203) |
| `--tema-basari` | `#15803d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:204](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:204) |
| `--tema-uyari` | `#b45309` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:205](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:205) |
| `--tema-bilgi` | `#2563eb` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:206](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:206) |
| `--tema-ters-metin` | `#ffffff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:207](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:207) |
| `--tema-secici-vurgu` | `var(--tema-kontrol-eylem)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:208](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:208) |
| `--tema-mobil-menu-ortu` | `rgba(0,0,0,0.45)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:211](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:211) |
| `--tema-mobil-menu-golge` | `rgba(0,0,0,0.15)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:212](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:212) |
| `--tema-hbstore-vurgu` | `#ff6200` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:213](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:213) |
| `--tema-hbstore-zemini` | `linear-gradient(135deg, #ff9a1f 0%, var(--tema-hbstore-vurgu) 55%, #f04400 100%)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:214](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:214) |
| `--tema-hbstore-golge` | `rgba(255, 98, 0, 0.32)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:215](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:215) |
| `--tema-hbstore-parilti` | `rgba(255,255,255,0.38)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:216](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:216) |
| `--tema-pill-varyant-arac-zemin` | `#dbeafe` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:219](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:219) |
| `--tema-pill-varyant-arac-metin` | `#1d4ed8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:220](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:220) |
| `--tema-pill-varyant-arac-cizgi` | `#93c5fd` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:221](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:221) |
| `--tema-pill-varyant-soru-zemin` | `#fbe4de` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:222](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:222) |
| `--tema-pill-varyant-soru-metin` | `#bc2d0d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:223](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:223) |
| `--tema-pill-varyant-soru-cizgi` | `#e9b3a6` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:224](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:224) |
| `--tema-pill-varyant-iu-zemin` | `#f5f3ff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:225](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:225) |
| `--tema-pill-varyant-iu-metin` | `#6d28d9` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:226](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:226) |
| `--tema-pill-varyant-iu-cizgi` | `#ddd6fe` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:227](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:227) |
| `--tema-uretim-aksiyon-zemin` | `#fff1f0` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:228](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:228) |
| `--tema-uretim-aksiyon-metin` | `#bc2d0d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:229](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:229) |
| `--tema-uretim-aksiyon-cizgi` | `#fecaca` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:230](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:230) |
| `--tema-uretim-bekleme-zemin` | `#f9fafb` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:231](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:231) |
| `--tema-uretim-bekleme-metin` | `#737373` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:232](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:232) |
| `--tema-uretim-bekleme-cizgi` | `#e5e7eb` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:233](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:233) |
| `--tema-uretim-revizyon-zemin` | `#fefce8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:234](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:234) |
| `--tema-uretim-revizyon-metin` | `#854d0e` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:235](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:235) |
| `--tema-uretim-revizyon-cizgi` | `#fde68a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:236](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:236) |
| `--tema-uretim-onay-zemin` | `#f0fdf4` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:237](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:237) |
| `--tema-uretim-onay-metin` | `#16a34a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:238](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:238) |
| `--tema-uretim-onay-cizgi` | `#bbf7d0` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:239](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:239) |
| `--tema-uretim-canli-zemin` | `#eff6ff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:240](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:240) |
| `--tema-uretim-canli-metin` | `#1d4ed8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:241](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:241) |
| `--tema-uretim-canli-cizgi` | `#bfdbfe` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:242](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:242) |
| `--tema-uretim-planli-zemin` | `#f5f3ff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:243](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:243) |
| `--tema-uretim-planli-metin` | `#6d28d9` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:244](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:244) |
| `--tema-uretim-planli-cizgi` | `#ddd6fe` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:245](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:245) |
| `--tema-uretim-hata-zemin` | `#fef2f2` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:246](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:246) |
| `--tema-uretim-hata-metin` | `#bc2d0d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:247](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:247) |
| `--tema-uretim-hata-cizgi` | `#fecaca` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:248](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:248) |
| `--tema-hedef-utt-zemin` | `#eff6ff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:249](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:249) |
| `--tema-hedef-utt-metin` | `#1d4ed8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:250](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:250) |
| `--tema-hedef-utt-cizgi` | `#bfdbfe` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:251](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:251) |
| `--tema-hedef-bm-zemin` | `#fef2f2` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:252](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:252) |
| `--tema-hedef-bm-metin` | `#bc2d0d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:253](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:253) |
| `--tema-hedef-bm-cizgi` | `#fecaca` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:254](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:254) |
| `--tema-hedef-eczaci-zemin` | `#fff5f5` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:255](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:255) |
| `--tema-hedef-eczaci-metin` | `#e30a17` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:256](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:256) |
| `--tema-hedef-eczaci-cizgi` | `#e30a17` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:257](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:257) |
| `--tema-hedef-eczane_teknisyeni-zemin` | `#eaf7e4` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:258](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:258) |
| `--tema-hedef-eczane_teknisyeni-metin` | `#10304a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:259](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:259) |
| `--tema-hedef-eczane_teknisyeni-cizgi` | `#7ed957` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:260](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:260) |
| `--tema-hedef-eczanem-zemin` | `#fffbeb` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:261](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:261) |
| `--tema-hedef-eczanem-metin` | `#b45309` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:262](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:262) |
| `--tema-hedef-eczanem-cizgi` | `#fde68a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:263](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:263) |
| `--tema-hedef-utt-halka` | `#1d4ed833` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:264](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:264) |
| `--tema-hedef-bm-halka` | `#bc2d0d33` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:265](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:265) |
| `--tema-hedef-eczaci-halka` | `#e30a1733` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:266](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:266) |
| `--tema-hedef-eczane_teknisyeni-halka` | `#10304a33` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:267](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:267) |
| `--tema-hedef-eczanem-halka` | `#b4530933` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:268](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:268) |
| `--tema-hedef-eczaci-secili` | `#e30a1722` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:269](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:269) |
| `--tema-hedef-eczane_teknisyeni-secili` | `#10304a22` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:270](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:270) |
| `--tema-arac-video-metin` | `#1d4ed8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:271](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:271) |
| `--tema-arac-video-zemin` | `#dbeafee8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:272](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:272) |
| `--tema-arac-podcast-metin` | `#7e22ce` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:273](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:273) |
| `--tema-arac-podcast-zemin` | `#f3e8ffe8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:274](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:274) |
| `--tema-arac-gorsel-metin` | `#047857` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:275](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:275) |
| `--tema-arac-gorsel-zemin` | `#d1fae5e8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:276](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:276) |
| `--tema-arac-flip_pdf-metin` | `#b45309` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:277](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:277) |
| `--tema-arac-flip_pdf-zemin` | `#fef3c7e8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:278](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:278) |
| `--tema-arac-pill-cizgi` | `#ffffff99` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:279](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:279) |
| `--tema-cek-talep-beklemede-metin` | `#854d0e` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:280](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:280) |
| `--tema-cek-talep-beklemede-zemin` | `#fefce8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:281](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:281) |
| `--tema-cek-talep-beklemede-cizgi` | `#fde68a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:282](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:282) |
| `--tema-cek-talep-bm_onayinda-metin` | `#b45309` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:283](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:283) |
| `--tema-cek-talep-bm_onayinda-zemin` | `#fff7ed` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:284](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:284) |
| `--tema-cek-talep-bm_onayinda-cizgi` | `#fed7aa` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:285](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:285) |
| `--tema-cek-talep-tm_onayinda-metin` | `#6d28d9` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:286](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:286) |
| `--tema-cek-talep-tm_onayinda-zemin` | `#f5f3ff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:287](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:287) |
| `--tema-cek-talep-tm_onayinda-cizgi` | `#ddd6fe` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:288](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:288) |
| `--tema-cek-talep-onaylandi-metin` | `#065f46` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:289](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:289) |
| `--tema-cek-talep-onaylandi-zemin` | `#ecfdf5` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:290](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:290) |
| `--tema-cek-talep-onaylandi-cizgi` | `#a7f3d0` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:291](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:291) |
| `--tema-cek-talep-teslimat_bekliyor-metin` | `#0f766e` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:292](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:292) |
| `--tema-cek-talep-teslimat_bekliyor-zemin` | `#f0fdfa` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:293](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:293) |
| `--tema-cek-talep-teslimat_bekliyor-cizgi` | `#99f6e4` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:294](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:294) |
| `--tema-cek-talep-cek_kodlari_gonderildi-metin` | `#237ac8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:295](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:295) |
| `--tema-cek-talep-cek_kodlari_gonderildi-zemin` | `#edf6fd` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:296](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:296) |
| `--tema-cek-talep-cek_kodlari_gonderildi-cizgi` | `#b6d9f5` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:297](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:297) |
| `--tema-cek-talep-iptal-metin` | `#bc2d0d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:298](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:298) |
| `--tema-cek-talep-iptal-zemin` | `#fef2f2` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:299](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:299) |
| `--tema-cek-talep-iptal-cizgi` | `#fecaca` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:300](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:300) |
| `--tema-cek-gun-acik-zemin` | `#f0fdf4` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:301](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:301) |
| `--tema-cek-gun-acik-cizgi` | `#bbf7d0` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:302](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:302) |
| `--tema-cek-gun-acik-metin` | `#166534` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:303](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:303) |
| `--tema-cek-gun-acik-nokta` | `#16a34a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:304](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:304) |
| `--tema-cek-gun-yakin-zemin` | `#1e3a8a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:305](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:305) |
| `--tema-cek-gun-kapali-zemin` | `#fffbeb` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:306](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:306) |
| `--tema-cek-gun-kapali-cizgi` | `#fef3c7` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:307](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:307) |
| `--tema-cek-gun-kapali-metin` | `#92400e` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:308](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:308) |
| `--tema-cek-gun-kapali-nokta` | `#f59e0b` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:309](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:309) |
| `--tema-cek-teslimat-uygulanmaz-cizgi` | `var(--color-slate-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:310](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:310) |
| `--tema-cek-teslimat-uygulanmaz-zemin` | `var(--color-slate-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:311](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:311) |
| `--tema-cek-teslimat-uygulanmaz-metin` | `var(--color-slate-500)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:312](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:312) |
| `--tema-cek-teslimat-baslamadi-cizgi` | `var(--color-slate-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:313](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:313) |
| `--tema-cek-teslimat-baslamadi-zemin` | `var(--color-slate-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:314](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:314) |
| `--tema-cek-teslimat-baslamadi-metin` | `var(--color-slate-600)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:315](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:315) |
| `--tema-cek-teslimat-hata-cizgi` | `var(--color-red-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:316](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:316) |
| `--tema-cek-teslimat-hata-zemin` | `var(--color-red-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:317](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:317) |
| `--tema-cek-teslimat-hata-metin` | `var(--color-red-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:318](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:318) |
| `--tema-cek-teslimat-tamam-cizgi` | `var(--color-emerald-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:319](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:319) |
| `--tema-cek-teslimat-tamam-zemin` | `var(--color-emerald-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:320](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:320) |
| `--tema-cek-teslimat-tamam-metin` | `var(--color-emerald-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:321](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:321) |
| `--tema-cek-teslimat-kismi-cizgi` | `var(--color-amber-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:322](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:322) |
| `--tema-cek-teslimat-kismi-zemin` | `var(--color-amber-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:323](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:323) |
| `--tema-cek-teslimat-kismi-metin` | `var(--color-amber-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:324](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:324) |
| `--tema-cek-teslimat-isleniyor-cizgi` | `var(--color-cyan-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:325](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:325) |
| `--tema-cek-teslimat-isleniyor-zemin` | `var(--color-cyan-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:326](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:326) |
| `--tema-cek-teslimat-isleniyor-metin` | `var(--color-cyan-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:327](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:327) |
| `--tema-cek-teslimat-bekliyor-cizgi` | `var(--color-blue-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:328](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:328) |
| `--tema-cek-teslimat-bekliyor-zemin` | `var(--color-blue-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:329](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:329) |
| `--tema-cek-teslimat-bekliyor-metin` | `var(--color-blue-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:330](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:330) |
| `--background` | `var(--tema-belge-zemini)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:333](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:333) |
| `--foreground` | `var(--tema-belge-metni)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:334](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:334) |
| `--card` | `var(--tema-kart)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:335](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:335) |
| `--card-foreground` | `var(--tema-belge-metni)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:336](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:336) |
| `--popover` | `var(--tema-modal-zemini)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:337](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:337) |
| `--popover-foreground` | `var(--tema-belge-metni)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:338](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:338) |
| `--primary` | `var(--tema-bilesen-eylemi)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:339](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:339) |
| `--primary-foreground` | `var(--tema-eylem-metin)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:340](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:340) |
| `--secondary` | `var(--tema-bilesen-ikincil)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:341](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:341) |
| `--secondary-foreground` | `var(--tema-bilesen-ikincil-metni)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:342](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:342) |
| `--muted` | `var(--tema-bilesen-ikincil)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:343](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:343) |
| `--muted-foreground` | `var(--tema-bilesen-soluk-metni)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:344](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:344) |
| `--accent` | `var(--tema-bilesen-ikincil)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:345](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:345) |
| `--accent-foreground` | `var(--tema-bilesen-ikincil-metni)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:346](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:346) |
| `--destructive` | `var(--tema-hata)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:347](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:347) |
| `--destructive-foreground` | `var(--tema-ters-metin)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:348](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:348) |
| `--border` | `var(--tema-cizgi)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:349](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:349) |
| `--input` | `var(--tema-cizgi)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:350](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:350) |
| `--ring` | `var(--tema-bilesen-eylemi)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:351](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:351) |
| `--tema-hoyk-cizgi` | `var(--color-gray-200)` | :root, [data-tema="mavi"] | [app/tema.css:357](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:357) |
| `--tema-hoyk-zemin` | `#fff` | :root, [data-tema="mavi"] | [app/tema.css:358](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:358) |
| `--tema-hoyk-kapak-zemini` | `var(--color-gray-100)` | :root, [data-tema="mavi"] | [app/tema.css:359](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:359) |
| `--tema-hoyk-baslik` | `var(--color-gray-900)` | :root, [data-tema="mavi"] | [app/tema.css:360](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:360) |
| `--tema-hoyk-soluk-metin` | `var(--color-gray-400)` | :root, [data-tema="mavi"] | [app/tema.css:361](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:361) |
| `--tema-hoyk-ikincil-metin` | `var(--color-gray-500)` | :root, [data-tema="mavi"] | [app/tema.css:362](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:362) |
| `--tema-hoyk-aciklama-metni` | `var(--color-gray-600)` | :root, [data-tema="mavi"] | [app/tema.css:363](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:363) |
| `--tema-hoyk-ayirici` | `var(--color-gray-300)` | :root, [data-tema="mavi"] | [app/tema.css:364](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:364) |
| `--tema-hoyk-talep-metni` | `#bc2d0d` | :root, [data-tema="mavi"] | [app/tema.css:365](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:365) |
| `--tema-hoyk-dongu-metni` | `#1e3a8a` | :root, [data-tema="mavi"] | [app/tema.css:366](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:366) |
| `--tema-hoyk-etkilesim-hover` | `var(--color-gray-600)` | :root, [data-tema="mavi"] | [app/tema.css:367](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:367) |
| `--tema-hoyk-begeni` | `var(--color-red-500)` | :root, [data-tema="mavi"] | [app/tema.css:368](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:368) |
| `--tema-hoyk-favori` | `var(--color-blue-500)` | :root, [data-tema="mavi"] | [app/tema.css:369](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:369) |
| `--tema-hoyk-favori-dolgu` | `#2563eb` | :root, [data-tema="mavi"] | [app/tema.css:370](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:370) |
| `--tema-hoyk-favori-simge` | `#2563eb` | :root, [data-tema="mavi"] | [app/tema.css:371](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:371) |
| `--tema-hoyk-kapsul-zemini` | `rgba(0,0,0,0.04)` | :root, [data-tema="mavi"] | [app/tema.css:372](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:372) |
| `--tema-hoyk-kapsul-cizgi` | `rgba(0,0,0,0.08)` | :root, [data-tema="mavi"] | [app/tema.css:373](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:373) |
| `--tema-kapak-video-ilk` | `#1e3a8a` | :root, [data-tema="mavi"] | [app/tema.css:374](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:374) |
| `--tema-kapak-video-son` | `#0f172a` | :root, [data-tema="mavi"] | [app/tema.css:375](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:375) |
| `--tema-kapak-video-metin` | `#fff` | :root, [data-tema="mavi"] | [app/tema.css:376](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:376) |
| `--tema-kapak-podcast-ilk` | `#2a1343` | :root, [data-tema="mavi"] | [app/tema.css:377](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:377) |
| `--tema-kapak-podcast-son` | `#140824` | :root, [data-tema="mavi"] | [app/tema.css:378](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:378) |
| `--tema-kapak-podcast-metin` | `#fff` | :root, [data-tema="mavi"] | [app/tema.css:379](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:379) |
| `--tema-kapak-gorsel-ilk` | `#064e3b` | :root, [data-tema="mavi"] | [app/tema.css:380](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:380) |
| `--tema-kapak-gorsel-son` | `#022c22` | :root, [data-tema="mavi"] | [app/tema.css:381](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:381) |
| `--tema-kapak-gorsel-metin` | `#fff` | :root, [data-tema="mavi"] | [app/tema.css:382](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:382) |
| `--tema-kapak-flip_pdf-ilk` | `#78350f` | :root, [data-tema="mavi"] | [app/tema.css:383](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:383) |
| `--tema-kapak-flip_pdf-son` | `#451a03` | :root, [data-tema="mavi"] | [app/tema.css:384](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:384) |
| `--tema-kapak-flip_pdf-metin` | `#fff` | :root, [data-tema="mavi"] | [app/tema.css:385](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:385) |
| `--tema-kapak-etiket-zemini` | `rgba(0,0,0,0.4)` | :root, [data-tema="mavi"] | [app/tema.css:386](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:386) |
| `--tema-kapak-podcast-buyuk-ara` | `#1a0c2d` | :root, [data-tema="mavi"] | [app/tema.css:387](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:387) |
| `--tema-kapak-podcast-buyuk-son` | `#120721` | :root, [data-tema="mavi"] | [app/tema.css:388](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:388) |
| `--tema-kapak-podcast-simge-ilk` | `#b150e2` | :root, [data-tema="mavi"] | [app/tema.css:389](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:389) |
| `--tema-kapak-podcast-simge-son` | `#6821a8` | :root, [data-tema="mavi"] | [app/tema.css:390](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:390) |
| `--tema-oynatici-yuzey` | `#fff` | :root, [data-tema="mavi"] | [app/tema.css:391](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:391) |
| `--tema-oynatici-zemin` | `var(--color-gray-50)` | :root, [data-tema="mavi"] | [app/tema.css:392](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:392) |
| `--tema-oynatici-transkript-zemini` | `color-mix(in oklab, var(--color-gray-50) 70%, transparent)` | :root, [data-tema="mavi"] | [app/tema.css:393](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:393) |
| `--tema-oynatici-cizgi` | `var(--color-gray-200)` | :root, [data-tema="mavi"] | [app/tema.css:394](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:394) |
| `--tema-oynatici-ic-cizgi` | `var(--color-gray-100)` | :root, [data-tema="mavi"] | [app/tema.css:395](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:395) |
| `--tema-oynatici-baslik` | `var(--color-gray-900)` | :root, [data-tema="mavi"] | [app/tema.css:396](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:396) |
| `--tema-oynatici-koyu-metin` | `var(--color-gray-800)` | :root, [data-tema="mavi"] | [app/tema.css:397](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:397) |
| `--tema-oynatici-metin` | `var(--color-gray-700)` | :root, [data-tema="mavi"] | [app/tema.css:398](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:398) |
| `--tema-oynatici-ikincil-metin` | `var(--color-gray-500)` | :root, [data-tema="mavi"] | [app/tema.css:399](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:399) |
| `--tema-oynatici-baglanti` | `#287fce` | :root, [data-tema="mavi"] | [app/tema.css:400](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:400) |
| `--tema-oynatici-eylem` | `#56aeff` | :root, [data-tema="mavi"] | [app/tema.css:401](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:401) |
| `--tema-oynatici-eylem-metni` | `#fff` | :root, [data-tema="mavi"] | [app/tema.css:402](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:402) |
| `--tema-oynatici-pdf-soluk-zemin` | `var(--color-slate-50)` | :root, [data-tema="mavi"] | [app/tema.css:403](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:403) |
| `--tema-oynatici-pdf-zemin` | `var(--color-slate-100)` | :root, [data-tema="mavi"] | [app/tema.css:404](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:404) |
| `--tema-oynatici-pdf-hover` | `var(--color-slate-100)` | :root, [data-tema="mavi"] | [app/tema.css:405](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:405) |
| `--tema-oynatici-pdf-cizgi` | `var(--color-slate-200)` | :root, [data-tema="mavi"] | [app/tema.css:406](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:406) |
| `--tema-oynatici-pdf-ikincil-metin` | `var(--color-slate-500)` | :root, [data-tema="mavi"] | [app/tema.css:407](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:407) |
| `--tema-oynatici-pdf-metin` | `var(--color-slate-600)` | :root, [data-tema="mavi"] | [app/tema.css:408](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:408) |
| `--tema-oynatici-pdf-secili-cizgi` | `#bc2d0d` | :root, [data-tema="mavi"] | [app/tema.css:409](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:409) |
| `--tema-oynatici-pdf-secili-zemin` | `var(--color-red-50)` | :root, [data-tema="mavi"] | [app/tema.css:410](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:410) |
| `--tema-oynatici-video-ilk-ortu` | `color-mix(in oklab, #10233a 20%, transparent)` | :root, [data-tema="mavi"] | [app/tema.css:411](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:411) |
| `--tema-oynatici-video-play-zemini` | `color-mix(in oklab, #10233a 80%, transparent)` | :root, [data-tema="mavi"] | [app/tema.css:412](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:412) |
| `--tema-oynatici-video-play-hover` | `color-mix(in oklab, #10233a 95%, transparent)` | :root, [data-tema="mavi"] | [app/tema.css:413](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:413) |
| `--tema-oynatici-video-odak` | `#56aeff` | :root, [data-tema="mavi"] | [app/tema.css:414](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:414) |
| `--tema-oynatici-video-bitis-ortusu` | `color-mix(in oklab, #10233a 75%, transparent)` | :root, [data-tema="mavi"] | [app/tema.css:415](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:415) |
| `--tema-oynatici-puan-zemini` | `var(--color-blue-50)` | :root, [data-tema="mavi"] | [app/tema.css:416](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:416) |
| `--tema-oynatici-puan-cizgi` | `var(--color-blue-200)` | :root, [data-tema="mavi"] | [app/tema.css:417](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:417) |
| `--tema-oynatici-puan-metni` | `var(--color-blue-700)` | :root, [data-tema="mavi"] | [app/tema.css:418](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:418) |
| `--tema-oynatici-bilgi-cizgi` | `#dbe5ef` | :root, [data-tema="mavi"] | [app/tema.css:419](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:419) |
| `--tema-oynatici-bilgi-baslik` | `#203653` | :root, [data-tema="mavi"] | [app/tema.css:420](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:420) |
| `--tema-oynatici-bilgi-metin` | `#687b90` | :root, [data-tema="mavi"] | [app/tema.css:421](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:421) |
| `--tema-oynatici-panel-eylem` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:422](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:422) |
| `--tema-oynatici-panel-eylem-hover` | `#1d69ad` | :root, [data-tema="mavi"] | [app/tema.css:423](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:423) |
| `--tema-oynatici-eclub-eylem-hover` | `#1d69aa` | :root, [data-tema="mavi"] | [app/tema.css:424](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:424) |
| `--tema-oynatici-eclub-geri` | `#71859d` | :root, [data-tema="mavi"] | [app/tema.css:425](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:425) |
| `--tema-oynatici-eclub-cizgi` | `#dfe7f1` | :root, [data-tema="mavi"] | [app/tema.css:426](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:426) |
| `--tema-oynatici-eclub-ic-cizgi` | `#e7edf4` | :root, [data-tema="mavi"] | [app/tema.css:427](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:427) |
| `--tema-oynatici-eclub-ikincil-metin` | `#8190a3` | :root, [data-tema="mavi"] | [app/tema.css:428](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:428) |
| `--tema-oynatici-eclub-sonuc-cizgi` | `#bfdbfe` | :root, [data-tema="mavi"] | [app/tema.css:429](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:429) |
| `--tema-oynatici-eclub-sonuc-zemin` | `#eff6ff` | :root, [data-tema="mavi"] | [app/tema.css:430](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:430) |
| `--tema-oynatici-eclub-sonuc-metin` | `#2563a8` | :root, [data-tema="mavi"] | [app/tema.css:431](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:431) |
| `--tema-oynatici-eclub-uyari-metin` | `#66788f` | :root, [data-tema="mavi"] | [app/tema.css:432](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:432) |
| `--tema-oynatici-eclub-iptal-metni` | `#617590` | :root, [data-tema="mavi"] | [app/tema.css:433](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:433) |
| `--tema-oynatici-eczanem-geri` | `#61768c` | :root, [data-tema="mavi"] | [app/tema.css:434](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:434) |
| `--tema-oynatici-eczanem-cizgi` | `#dfe7ef` | :root, [data-tema="mavi"] | [app/tema.css:435](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:435) |
| `--tema-oynatici-eczanem-ic-cizgi` | `#e7edf3` | :root, [data-tema="mavi"] | [app/tema.css:436](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:436) |
| `--tema-oynatici-eczanem-aciklama` | `#8191a4` | :root, [data-tema="mavi"] | [app/tema.css:437](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:437) |
| `--tema-oynatici-eczanem-eczane` | `#5f7893` | :root, [data-tema="mavi"] | [app/tema.css:438](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:438) |
| `--tema-oynatici-eczanem-bilgi-cizgi` | `#dce8f2` | :root, [data-tema="mavi"] | [app/tema.css:439](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:439) |
| `--tema-oynatici-eczanem-bilgi-zemin` | `#f5f9fc` | :root, [data-tema="mavi"] | [app/tema.css:440](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:440) |
| `--tema-oynatici-eczanem-bilgi-metin` | `#60758c` | :root, [data-tema="mavi"] | [app/tema.css:441](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:441) |
| `--tema-oynatici-eczanem-bilgi-simge` | `#4d8fc8` | :root, [data-tema="mavi"] | [app/tema.css:442](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:442) |
| `--tema-hoyk-secim-cizgi` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:443](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:443) |
| `--tema-hoyk-secim-halka` | `color-mix(in oklab, #237ac8 20%, transparent)` | :root, [data-tema="mavi"] | [app/tema.css:444](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:444) |
| `--tema-hoyk-bm-secim-halka` | `color-mix(in oklab, #237ac8 30%, transparent)` | :root, [data-tema="mavi"] | [app/tema.css:445](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:445) |
| `--tema-hoyk-secim-metni` | `#1d65aa` | :root, [data-tema="mavi"] | [app/tema.css:446](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:446) |
| `--tema-hoyk-secim-pasif-metni` | `#526780` | :root, [data-tema="mavi"] | [app/tema.css:447](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:447) |
| `--tema-hoyk-secim-kontrolu` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:448](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:448) |
| `--tema-hoyk-bm-secim-kontrolu` | `#2f7fc7` | :root, [data-tema="mavi"] | [app/tema.css:449](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:449) |
| `--tema-hoyk-gonderim-cizgi` | `#dce7f2` | :root, [data-tema="mavi"] | [app/tema.css:450](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:450) |
| `--tema-hoyk-gonderim-zemin` | `#f2f7fc` | :root, [data-tema="mavi"] | [app/tema.css:451](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:451) |
| `--tema-hoyk-gonderim-metin` | `#405976` | :root, [data-tema="mavi"] | [app/tema.css:452](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:452) |
| `--tema-hoyk-ek-icerik-cizgi` | `#e8eef5` | :root, [data-tema="mavi"] | [app/tema.css:453](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:453) |
| `--tema-hoyk-kosul-cizgi` | `#e1e9f3` | :root, [data-tema="mavi"] | [app/tema.css:454](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:454) |
| `--tema-hoyk-kosul-zemin` | `#f5f8fc` | :root, [data-tema="mavi"] | [app/tema.css:455](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:455) |
| `--tema-hoyk-onizleme-cizgi` | `#dbe4ef` | :root, [data-tema="mavi"] | [app/tema.css:456](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:456) |
| `--tema-hoyk-secim-zemin` | `#eaf3fd` | :root, [data-tema="mavi"] | [app/tema.css:457](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:457) |
| `--tema-hoyk-secim-eylemi` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:458](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:458) |
| `--tema-hoyk-onizleme-simge` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:459](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:459) |
| `--tema-hoyk-secim-kapali-zemin` | `#f2f5f8` | :root, [data-tema="mavi"] | [app/tema.css:460](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:460) |
| `--tema-hoyk-secim-kapali-metin` | `#8a9bad` | :root, [data-tema="mavi"] | [app/tema.css:461](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:461) |
| `--tema-hoyk-firma-zemin` | `#1e3a8a` | :root, [data-tema="mavi"] | [app/tema.css:462](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:462) |
| `--tema-hoyk-play-zemin` | `color-mix(in oklab, #10233a 65%, transparent)` | :root, [data-tema="mavi"] | [app/tema.css:463](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:463) |
| `--tema-hoyk-cekli-simge-zemin` | `#e2edff` | :root, [data-tema="mavi"] | [app/tema.css:464](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:464) |
| `--tema-hoyk-cekli-simge-metin` | `#0759e9` | :root, [data-tema="mavi"] | [app/tema.css:465](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:465) |
| `--tema-hoyk-kosul-baslik` | `#111b2f` | :root, [data-tema="mavi"] | [app/tema.css:466](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:466) |
| `--tema-hoyk-kosul-aciklama` | `#627694` | :root, [data-tema="mavi"] | [app/tema.css:467](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:467) |
| `--tema-hoyk-barem-cizgi` | `#dce9fa` | :root, [data-tema="mavi"] | [app/tema.css:468](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:468) |
| `--tema-hoyk-barem-etiket` | `#627997` | :root, [data-tema="mavi"] | [app/tema.css:469](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:469) |
| `--tema-hoyk-barem-zemin` | `#eaf4ff` | :root, [data-tema="mavi"] | [app/tema.css:470](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:470) |
| `--tema-hoyk-barem-adet` | `#071a3b` | :root, [data-tema="mavi"] | [app/tema.css:471](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:471) |
| `--tema-hoyk-barem-fazla` | `#1263ef` | :root, [data-tema="mavi"] | [app/tema.css:472](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:472) |
| `--tema-hoyk-ceksiz-ilk` | `#f0f6ff` | :root, [data-tema="mavi"] | [app/tema.css:473](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:473) |
| `--tema-hoyk-ceksiz-son` | `#f7faff` | :root, [data-tema="mavi"] | [app/tema.css:474](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:474) |
| `--tema-hoyk-ceksiz-simge-zemin` | `#dceaff` | :root, [data-tema="mavi"] | [app/tema.css:475](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:475) |
| `--tema-hoyk-ceksiz-metin` | `#1764e8` | :root, [data-tema="mavi"] | [app/tema.css:476](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:476) |
| `--tema-hoyk-lig-zemin` | `#deecff` | :root, [data-tema="mavi"] | [app/tema.css:477](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:477) |
| `--tema-hoyk-ic-cizgi` | `var(--color-gray-100)` | :root, [data-tema="mavi"] | [app/tema.css:478](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:478) |
| `--tema-hoyk-oneri-ayirici` | `color-mix(in oklab, var(--color-gray-200) 60%, transparent)` | :root, [data-tema="mavi"] | [app/tema.css:479](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:479) |
| `--tema-hoyk-bm-onizleme` | `#7d8ba0` | :root, [data-tema="mavi"] | [app/tema.css:480](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:480) |
| `--tema-hoyk-bm-alt-cizgi` | `#eef2f6` | :root, [data-tema="mavi"] | [app/tema.css:481](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:481) |
| `--tema-hoyk-oneri-bilgi-zemini` | `rgba(0,0,0,0.03)` | :root, [data-tema="mavi"] | [app/tema.css:482](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:482) |
| `--tema-hoyk-eczanem-eczane` | `#8fa0b2` | :root, [data-tema="mavi"] | [app/tema.css:483](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:483) |
| `--tema-hoyk-eczanem-ayirici` | `#e3e9ef` | :root, [data-tema="mavi"] | [app/tema.css:484](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:484) |
| `--tema-hoyk-eczanem-ozet-cizgi` | `#e5ebf1` | :root, [data-tema="mavi"] | [app/tema.css:485](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:485) |
| `--tema-hoyk-eczanem-ozet-zemin` | `#f8fafc` | :root, [data-tema="mavi"] | [app/tema.css:486](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:486) |
| `--tema-hoyk-eczanem-ozet-etiket` | `#8a99aa` | :root, [data-tema="mavi"] | [app/tema.css:487](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:487) |
| `--tema-oynatici-video-cc-bitis-ortusu` | `color-mix(in oklab, #10233a 80%, transparent)` | :root, [data-tema="mavi"] | [app/tema.css:488](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:488) |
| `--tema-hoyk-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:493](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:493) |
| `--tema-hoyk-zemin` | `var(--tema-kart)` | [data-tema="yesil"] | [app/tema.css:494](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:494) |
| `--tema-hoyk-kapak-zemini` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:495](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:495) |
| `--tema-hoyk-baslik` | `var(--tema-baslik)` | [data-tema="yesil"] | [app/tema.css:496](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:496) |
| `--tema-hoyk-soluk-metin` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:497](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:497) |
| `--tema-hoyk-ikincil-metin` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:498](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:498) |
| `--tema-hoyk-aciklama-metni` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:499](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:499) |
| `--tema-hoyk-ayirici` | `#a7b398` | [data-tema="yesil"] | [app/tema.css:500](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:500) |
| `--tema-hoyk-talep-metni` | `#776f58` | [data-tema="yesil"] | [app/tema.css:501](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:501) |
| `--tema-hoyk-dongu-metni` | `var(--tema-secili-metin)` | [data-tema="yesil"] | [app/tema.css:502](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:502) |
| `--tema-hoyk-etkilesim-hover` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:503](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:503) |
| `--tema-hoyk-begeni` | `#a0784d` | [data-tema="yesil"] | [app/tema.css:504](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:504) |
| `--tema-hoyk-favori` | `var(--tema-toprak)` | [data-tema="yesil"] | [app/tema.css:505](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:505) |
| `--tema-hoyk-favori-dolgu` | `var(--tema-toprak)` | [data-tema="yesil"] | [app/tema.css:506](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:506) |
| `--tema-hoyk-favori-simge` | `var(--tema-toprak)` | [data-tema="yesil"] | [app/tema.css:507](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:507) |
| `--tema-hoyk-kapsul-zemini` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:508](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:508) |
| `--tema-hoyk-kapsul-cizgi` | `#e1e7d8` | [data-tema="yesil"] | [app/tema.css:509](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:509) |
| `--tema-kapak-video-ilk` | `#dfe7d7` | [data-tema="yesil"] | [app/tema.css:510](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:510) |
| `--tema-kapak-video-son` | `#edf0e6` | [data-tema="yesil"] | [app/tema.css:511](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:511) |
| `--tema-kapak-video-metin` | `#456844` | [data-tema="yesil"] | [app/tema.css:512](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:512) |
| `--tema-kapak-podcast-ilk` | `#e8e7d8` | [data-tema="yesil"] | [app/tema.css:513](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:513) |
| `--tema-kapak-podcast-son` | `#f0f1e9` | [data-tema="yesil"] | [app/tema.css:514](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:514) |
| `--tema-kapak-podcast-metin` | `#776f58` | [data-tema="yesil"] | [app/tema.css:515](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:515) |
| `--tema-kapak-gorsel-ilk` | `#eef1e6` | [data-tema="yesil"] | [app/tema.css:516](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:516) |
| `--tema-kapak-gorsel-son` | `#dfe7d7` | [data-tema="yesil"] | [app/tema.css:517](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:517) |
| `--tema-kapak-gorsel-metin` | `#456844` | [data-tema="yesil"] | [app/tema.css:518](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:518) |
| `--tema-kapak-flip_pdf-ilk` | `#fffdf5` | [data-tema="yesil"] | [app/tema.css:519](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:519) |
| `--tema-kapak-flip_pdf-son` | `#e8e7d8` | [data-tema="yesil"] | [app/tema.css:520](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:520) |
| `--tema-kapak-flip_pdf-metin` | `#776f58` | [data-tema="yesil"] | [app/tema.css:521](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:521) |
| `--tema-kapak-etiket-zemini` | `#fcfdf880` | [data-tema="yesil"] | [app/tema.css:522](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:522) |
| `--tema-kapak-podcast-buyuk-ara` | `#e8e7d8` | [data-tema="yesil"] | [app/tema.css:523](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:523) |
| `--tema-kapak-podcast-buyuk-son` | `#f0f1e9` | [data-tema="yesil"] | [app/tema.css:524](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:524) |
| `--tema-kapak-podcast-simge-ilk` | `#a4b8aa` | [data-tema="yesil"] | [app/tema.css:525](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:525) |
| `--tema-kapak-podcast-simge-son` | `var(--tema-bilgi-metni)` | [data-tema="yesil"] | [app/tema.css:526](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:526) |
| `--tema-oynatici-yuzey` | `var(--tema-yuzey)` | [data-tema="yesil"] | [app/tema.css:527](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:527) |
| `--tema-oynatici-zemin` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:528](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:528) |
| `--tema-oynatici-transkript-zemini` | `color-mix(in srgb, var(--tema-zemin) 70%, transparent)` | [data-tema="yesil"] | [app/tema.css:529](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:529) |
| `--tema-oynatici-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:530](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:530) |
| `--tema-oynatici-ic-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:531](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:531) |
| `--tema-oynatici-baslik` | `var(--tema-baslik)` | [data-tema="yesil"] | [app/tema.css:532](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:532) |
| `--tema-oynatici-koyu-metin` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:533](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:533) |
| `--tema-oynatici-metin` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:534](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:534) |
| `--tema-oynatici-ikincil-metin` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:535](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:535) |
| `--tema-oynatici-baglanti` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:536](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:536) |
| `--tema-oynatici-eylem` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:537](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:537) |
| `--tema-oynatici-eylem-metni` | `var(--tema-eylem-metin)` | [data-tema="yesil"] | [app/tema.css:538](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:538) |
| `--tema-oynatici-pdf-soluk-zemin` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:539](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:539) |
| `--tema-oynatici-pdf-zemin` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:540](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:540) |
| `--tema-oynatici-pdf-hover` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:541](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:541) |
| `--tema-oynatici-pdf-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:542](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:542) |
| `--tema-oynatici-pdf-ikincil-metin` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:543](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:543) |
| `--tema-oynatici-pdf-metin` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:544](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:544) |
| `--tema-oynatici-pdf-secili-cizgi` | `var(--tema-odak)` | [data-tema="yesil"] | [app/tema.css:545](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:545) |
| `--tema-oynatici-pdf-secili-zemin` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:546](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:546) |
| `--tema-oynatici-video-ilk-ortu` | `color-mix(in srgb, var(--tema-eylem) 20%, transparent)` | [data-tema="yesil"] | [app/tema.css:547](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:547) |
| `--tema-oynatici-video-play-zemini` | `color-mix(in srgb, var(--tema-eylem) 80%, transparent)` | [data-tema="yesil"] | [app/tema.css:548](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:548) |
| `--tema-oynatici-video-play-hover` | `color-mix(in srgb, var(--tema-eylem) 95%, transparent)` | [data-tema="yesil"] | [app/tema.css:549](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:549) |
| `--tema-oynatici-video-odak` | `var(--tema-odak)` | [data-tema="yesil"] | [app/tema.css:550](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:550) |
| `--tema-oynatici-video-bitis-ortusu` | `color-mix(in srgb, var(--tema-eylem) 75%, transparent)` | [data-tema="yesil"] | [app/tema.css:551](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:551) |
| `--tema-oynatici-puan-zemini` | `var(--tema-puan-zemini)` | [data-tema="yesil"] | [app/tema.css:552](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:552) |
| `--tema-oynatici-puan-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:553](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:553) |
| `--tema-oynatici-puan-metni` | `var(--tema-puan-metni)` | [data-tema="yesil"] | [app/tema.css:554](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:554) |
| `--tema-oynatici-bilgi-cizgi` | `var(--tema-modal-cizgisi)` | [data-tema="yesil"] | [app/tema.css:555](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:555) |
| `--tema-oynatici-bilgi-baslik` | `var(--tema-baslik)` | [data-tema="yesil"] | [app/tema.css:556](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:556) |
| `--tema-oynatici-bilgi-metin` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:557](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:557) |
| `--tema-oynatici-panel-eylem` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:558](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:558) |
| `--tema-oynatici-panel-eylem-hover` | `var(--tema-eylem-hover)` | [data-tema="yesil"] | [app/tema.css:559](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:559) |
| `--tema-oynatici-eclub-eylem-hover` | `var(--tema-eylem-hover)` | [data-tema="yesil"] | [app/tema.css:560](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:560) |
| `--tema-oynatici-eclub-geri` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:561](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:561) |
| `--tema-oynatici-eclub-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:562](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:562) |
| `--tema-oynatici-eclub-ic-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:563](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:563) |
| `--tema-oynatici-eclub-ikincil-metin` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:564](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:564) |
| `--tema-oynatici-eclub-sonuc-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:565](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:565) |
| `--tema-oynatici-eclub-sonuc-zemin` | `var(--tema-puan-zemini)` | [data-tema="yesil"] | [app/tema.css:566](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:566) |
| `--tema-oynatici-eclub-sonuc-metin` | `var(--tema-puan-metni)` | [data-tema="yesil"] | [app/tema.css:567](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:567) |
| `--tema-oynatici-eclub-uyari-metin` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:568](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:568) |
| `--tema-oynatici-eclub-iptal-metni` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:569](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:569) |
| `--tema-oynatici-eczanem-geri` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:570](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:570) |
| `--tema-oynatici-eczanem-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:571](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:571) |
| `--tema-oynatici-eczanem-ic-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:572](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:572) |
| `--tema-oynatici-eczanem-aciklama` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:573](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:573) |
| `--tema-oynatici-eczanem-eczane` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:574](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:574) |
| `--tema-oynatici-eczanem-bilgi-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:575](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:575) |
| `--tema-oynatici-eczanem-bilgi-zemin` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:576](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:576) |
| `--tema-oynatici-eczanem-bilgi-metin` | `var(--tema-bilgi-metni)` | [data-tema="yesil"] | [app/tema.css:577](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:577) |
| `--tema-oynatici-eczanem-bilgi-simge` | `var(--tema-bilgi-metni)` | [data-tema="yesil"] | [app/tema.css:578](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:578) |
| `--tema-hoyk-secim-cizgi` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:579](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:579) |
| `--tema-hoyk-secim-halka` | `color-mix(in srgb, var(--tema-eylem) 20%, transparent)` | [data-tema="yesil"] | [app/tema.css:580](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:580) |
| `--tema-hoyk-bm-secim-halka` | `color-mix(in srgb, var(--tema-eylem) 30%, transparent)` | [data-tema="yesil"] | [app/tema.css:581](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:581) |
| `--tema-hoyk-secim-metni` | `var(--tema-secili-metin)` | [data-tema="yesil"] | [app/tema.css:582](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:582) |
| `--tema-hoyk-secim-pasif-metni` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:583](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:583) |
| `--tema-hoyk-secim-kontrolu` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:584](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:584) |
| `--tema-hoyk-bm-secim-kontrolu` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:585](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:585) |
| `--tema-hoyk-gonderim-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:586](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:586) |
| `--tema-hoyk-gonderim-zemin` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:587](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:587) |
| `--tema-hoyk-gonderim-metin` | `var(--tema-bilgi-metni)` | [data-tema="yesil"] | [app/tema.css:588](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:588) |
| `--tema-hoyk-ek-icerik-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:589](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:589) |
| `--tema-hoyk-kosul-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:590](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:590) |
| `--tema-hoyk-kosul-zemin` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:591](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:591) |
| `--tema-hoyk-onizleme-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:592](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:592) |
| `--tema-hoyk-secim-zemin` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:593](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:593) |
| `--tema-hoyk-secim-eylemi` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:594](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:594) |
| `--tema-hoyk-onizleme-simge` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:595](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:595) |
| `--tema-hoyk-secim-kapali-zemin` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:596](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:596) |
| `--tema-hoyk-secim-kapali-metin` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:597](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:597) |
| `--tema-hoyk-firma-zemin` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:598](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:598) |
| `--tema-hoyk-play-zemin` | `color-mix(in srgb, var(--tema-eylem) 65%, transparent)` | [data-tema="yesil"] | [app/tema.css:599](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:599) |
| `--tema-hoyk-cekli-simge-zemin` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:600](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:600) |
| `--tema-hoyk-cekli-simge-metin` | `var(--tema-secili-metin)` | [data-tema="yesil"] | [app/tema.css:601](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:601) |
| `--tema-hoyk-kosul-baslik` | `var(--tema-baslik)` | [data-tema="yesil"] | [app/tema.css:602](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:602) |
| `--tema-hoyk-kosul-aciklama` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:603](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:603) |
| `--tema-hoyk-barem-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:604](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:604) |
| `--tema-hoyk-barem-etiket` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:605](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:605) |
| `--tema-hoyk-barem-zemin` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:606](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:606) |
| `--tema-hoyk-barem-adet` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:607](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:607) |
| `--tema-hoyk-barem-fazla` | `var(--tema-secili-metin)` | [data-tema="yesil"] | [app/tema.css:608](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:608) |
| `--tema-hoyk-ceksiz-ilk` | `var(--tema-puan-zemini)` | [data-tema="yesil"] | [app/tema.css:609](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:609) |
| `--tema-hoyk-ceksiz-son` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:610](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:610) |
| `--tema-hoyk-ceksiz-simge-zemin` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:611](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:611) |
| `--tema-hoyk-ceksiz-metin` | `var(--tema-secili-metin)` | [data-tema="yesil"] | [app/tema.css:612](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:612) |
| `--tema-hoyk-lig-zemin` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:613](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:613) |
| `--tema-hoyk-ic-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:614](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:614) |
| `--tema-hoyk-oneri-ayirici` | `color-mix(in srgb, var(--tema-cizgi) 60%, transparent)` | [data-tema="yesil"] | [app/tema.css:615](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:615) |
| `--tema-hoyk-bm-onizleme` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:616](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:616) |
| `--tema-hoyk-bm-alt-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:617](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:617) |
| `--tema-hoyk-oneri-bilgi-zemini` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:618](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:618) |
| `--tema-hoyk-eczanem-eczane` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:619](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:619) |
| `--tema-hoyk-eczanem-ayirici` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:620](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:620) |
| `--tema-hoyk-eczanem-ozet-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:621](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:621) |
| `--tema-hoyk-eczanem-ozet-zemin` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:622](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:622) |
| `--tema-hoyk-eczanem-ozet-etiket` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:623](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:623) |
| `--tema-oynatici-video-cc-bitis-ortusu` | `color-mix(in srgb, var(--tema-eylem) 80%, transparent)` | [data-tema="yesil"] | [app/tema.css:624](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:624) |
| `--tema-hoyk-durum-yeni` | `var(--color-blue-600)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:631](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:631) |
| `--tema-hoyk-durum-devam` | `var(--color-amber-600)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:632](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:632) |
| `--tema-hoyk-durum-izlendi` | `var(--color-gray-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:633](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:633) |
| `--tema-hoyk-sure-doldu` | `#dc2626` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:634](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:634) |
| `--tema-hoyk-tamamlandi` | `#2563eb` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:635](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:635) |
| `--tema-hoyk-yeniden-zemin` | `var(--color-amber-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:636](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:636) |
| `--tema-hoyk-yeniden-metin` | `var(--color-amber-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:637](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:637) |
| `--tema-oynatici-gorsel-kontrol-zemini` | `rgba(0,0,0,0.75)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:638](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:638) |
| `--tema-oynatici-gorsel-kontrol-hover` | `rgba(255,255,255,0.2)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:639](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:639) |
| `--tema-oynatici-gorsel-kontrol-soluk` | `var(--color-gray-300)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:640](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:640) |
| `--tema-oynatici-gorsel-kontrol-metni` | `#fff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:641](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:641) |
| `--tema-oynatici-pdf-sayfa` | `#fff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:642](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:642) |
| `--tema-oynatici-video-yan-zemin` | `var(--color-gray-900)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:643](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:643) |
| `--tema-oynatici-video-play-halka` | `#fff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:644](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:644) |
| `--tema-oynatici-video-bitis-aciklama` | `rgba(255,255,255,0.75)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:645](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:645) |
| `--tema-oynatici-video-bitis-aciklama-cc` | `rgba(255,255,255,0.8)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:646](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:646) |
| `--tema-oynatici-video-ters-metin` | `#fff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:647](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:647) |
| `--tema-oynatici-uyari-zemini` | `var(--color-amber-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:648](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:648) |
| `--tema-oynatici-uyari-cizgi` | `var(--color-amber-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:649](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:649) |
| `--tema-oynatici-eclub-video-zemini` | `#10213d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:650](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:650) |
| `--tema-oynatici-eclub-risk-metin` | `#b23b31` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:651](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:651) |
| `--tema-oynatici-eclub-risk-eylem` | `#b23b31` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:652](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:652) |
| `--tema-oynatici-modal-ortu` | `rgba(0,0,0,0.4)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:653](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:653) |
| `--tema-oynatici-video-basari-simgesi` | `var(--color-emerald-400)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:654](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:654) |
| `--tema-oynatici-eczanem-video-zemini` | `#10233a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:655](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:655) |
| `--tema-oynatici-eczanem-bekleme-ortu` | `color-mix(in oklab, #10233a 65%, transparent)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:656](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:656) |
| `--tema-oynatici-risk` | `#bc2d0d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:657](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:657) |
| `--tema-oynatici-cc-basari-zemin` | `#f0fdf4` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:658](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:658) |
| `--tema-oynatici-cc-basari-cizgi` | `#bbf7d0` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:659](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:659) |
| `--tema-oynatici-cc-basari-metin` | `#16a34a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:660](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:660) |
| `--tema-oynatici-cc-kayip-zemin` | `#fef2f2` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:661](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:661) |
| `--tema-oynatici-cc-kayip-cizgi` | `#fecaca` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:662](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:662) |
| `--tema-oynatici-cc-kayip-metin` | `#dc2626` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:663](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:663) |
| `--tema-oynatici-cc-uyari-zemin` | `#fffbeb` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:664](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:664) |
| `--tema-oynatici-cc-uyari-cizgi` | `#fde68a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:665](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:665) |
| `--tema-oynatici-cc-challenge-metin` | `#7c3aed` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:666](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:666) |
| `--tema-oynatici-cc-challenge-zemin` | `rgba(124,58,237,0.08)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:667](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:667) |
| `--tema-oynatici-cc-challenge-cizgi` | `rgba(124,58,237,0.3)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:668](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:668) |
| `--tema-oynatici-cc-rozet-metin` | `#237ac8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:669](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:669) |
| `--tema-oynatici-cc-rozet-zemin` | `#edf6fd` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:670](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:670) |
| `--tema-oynatici-cc-rozet-cizgi` | `#bfdbfe` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:671](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:671) |
| `--tema-hoyk-sure-acik-zemin-metni` | `#172a44` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:672](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:672) |
| `--tema-hoyk-inceleme-uyari-zemin` | `#fff3f1` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:673](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:673) |
| `--tema-hoyk-inceleme-uyari-metin` | `#ad625c` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:674](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:674) |
| `--tema-hoyk-firma-cizgi` | `rgba(255,255,255,0.4)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:675](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:675) |
| `--tema-hoyk-play-cizgi` | `rgba(255,255,255,0.45)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:676](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:676) |
| `--tema-hoyk-ters-metin` | `#fff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:677](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:677) |
| `--tema-hoyk-siparis-uyari-zemin` | `#fdeaea` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:678](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:678) |
| `--tema-hoyk-siparis-uyari-metin` | `#cf261c` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:679](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:679) |
| `--tema-hoyk-oneri-sure-doldu` | `var(--color-red-600)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:680](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:680) |
| `--tema-hoyk-oneri-puan-metni` | `#0a1b39` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:681](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:681) |
| `--tema-hoyk-oneri-puan-zemini` | `linear-gradient(to right, #d4af37 0%, #ecd077 50%, #fae896 100%)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:682](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:682) |
| `--tema-hoyk-oneri-ortu` | `rgba(0,0,0,0.2)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:683](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:683) |
| `--tema-hoyk-saha-ortu-hover` | `rgba(0,0,0,0.15)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:684](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:684) |
| `--tema-hoyk-saha-ortu` | `rgba(0,0,0,0.05)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:685](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:685) |
| `--tema-hoyk-saha-play` | `rgba(0,0,0,0.6)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:686](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:686) |
| `--tema-hoyk-eczanem-play-zemin` | `rgba(255,255,255,0.95)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:687](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:687) |
| `--tema-hoyk-eczanem-tamamlama` | `#286fae` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:688](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:688) |
| `--tema-hoyk-eczanem-soru` | `#654db0` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:689](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:689) |
| `--tema-hoyk-eczanem-dogru` | `#16865f` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:690](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:690) |
| `--tema-hoyk-eczanem-ortu` | `linear-gradient(180deg, transparent 40%, rgba(15,35,56,0.65) 100%)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:691](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:691) |
| `--tema-oynatici-eczanem-basari-cizgi` | `#bde5d5` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:692](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:692) |
| `--tema-oynatici-eczanem-basari-zemin` | `#edf9f4` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:693](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:693) |
| `--tema-oynatici-eczanem-basari-metin` | `#157254` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:694](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:694) |
| `--tema-oynatici-eczanem-izleniyor-cizgi` | `#c9dff1` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:695](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:695) |
| `--tema-oynatici-eczanem-izleniyor-zemin` | `#edf6fd` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:696](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:696) |
| `--tema-oynatici-eczanem-izleniyor-metin` | `#286fae` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:697](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:697) |
| `--tema-oynatici-eczanem-bekliyor-cizgi` | `#e0e7ee` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:698](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:698) |
| `--tema-oynatici-eczanem-bekliyor-zemin` | `#f7f9fb` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:699](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:699) |
| `--tema-oynatici-eczanem-bekliyor-metin` | `#71849a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:700](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:700) |
| `--tema-oynatici-eczanem-kaynak-hata-simge` | `#b84c4c` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:701](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:701) |
| `--tema-oynatici-eczanem-kaynak-hata-baslik` | `#8f3636` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:702](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:702) |
| `--tema-oynatici-eczanem-kaynak-hata-metin` | `#9a6969` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:703](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:703) |
| `--tema-oynatici-eczanem-hata-cizgi` | `#efcaca` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:704](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:704) |
| `--tema-oynatici-eczanem-hata-zemin` | `#fff5f5` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:705](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:705) |
| `--tema-oynatici-eczanem-hata-metin` | `#a74646` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:706](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:706) |
| `--tema-oynatici-eczanem-hata-eylem-cizgi` | `#e4b6b6` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:707](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:707) |
| `--tema-oynatici-eczanem-basari-simge` | `#16865f` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:708](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:708) |
| `--tema-oynatici-eczanem-basari-eylem-cizgi` | `#abd7c6` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:709](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:709) |
| `--tema-hoyk-demo-arac-golgesi` | `#34482e08` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:710](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:710) |
| `--tema-hoyk-demo-puan-cizgi` | `#d8e0cb` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:711](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:711) |
| `--tema-hoyk-demo-ek-puan-cizgi` | `#dae3cc` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:712](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:712) |
| `--tema-hoyk-oneri-tarih-metni` | `var(--color-gray-700)` | :root, [data-tema="mavi"] | [app/tema.css:717](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:717) |
| `--tema-hoyk-oneren-metni` | `#1e3a8a` | :root, [data-tema="mavi"] | [app/tema.css:718](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:718) |
| `--tema-hoyk-oneri-tarih-metni` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:722](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:722) |
| `--tema-hoyk-oneren-metni` | `var(--tema-secili-metin)` | [data-tema="yesil"] | [app/tema.css:723](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:723) |
| `--tema-kart-cizgi` | `currentColor` | :root, [data-tema="mavi"] | [app/tema.css:729](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:729) |
| `--tema-tablo-cizgi` | `currentColor` | :root, [data-tema="mavi"] | [app/tema.css:730](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:730) |
| `--tema-pencere-cizgi` | `currentColor` | :root, [data-tema="mavi"] | [app/tema.css:731](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:731) |
| `--tema-pencere-zemini` | `var(--background)` | :root, [data-tema="mavi"] | [app/tema.css:732](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:732) |
| `--tema-ipucu-zemini` | `var(--foreground)` | :root, [data-tema="mavi"] | [app/tema.css:733](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:733) |
| `--tema-ipucu-metni` | `var(--background)` | :root, [data-tema="mavi"] | [app/tema.css:734](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:734) |
| `--tema-iskelet-kart` | `#fff` | :root, [data-tema="mavi"] | [app/tema.css:735](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:735) |
| `--tema-iskelet-sayfa` | `#f7f9fc` | :root, [data-tema="mavi"] | [app/tema.css:736](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:736) |
| `--tema-iskelet-baslik` | `#dfe8f2` | :root, [data-tema="mavi"] | [app/tema.css:737](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:737) |
| `--tema-iskelet-satir` | `#e8eef5` | :root, [data-tema="mavi"] | [app/tema.css:738](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:738) |
| `--tema-iskelet-cizgi` | `#dfe7f1` | :root, [data-tema="mavi"] | [app/tema.css:739](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:739) |
| `--tema-iskelet-ic-cizgi` | `#dce6f3` | :root, [data-tema="mavi"] | [app/tema.css:740](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:740) |
| `--tema-iskelet-lig-sayfa` | `#f6f8fb` | :root, [data-tema="mavi"] | [app/tema.css:741](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:741) |
| `--tema-iskelet-lig-satir` | `var(--color-slate-200)` | :root, [data-tema="mavi"] | [app/tema.css:742](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:742) |
| `--tema-iskelet-lig-banner` | `var(--color-slate-300)` | :root, [data-tema="mavi"] | [app/tema.css:743](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:743) |
| `--tema-iskelet-cc-sayfa` | `#f9fafb` | :root, [data-tema="mavi"] | [app/tema.css:744](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:744) |
| `--tema-iskelet-cc-etiket` | `#e5eaf0` | :root, [data-tema="mavi"] | [app/tema.css:745](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:745) |
| `--tema-iskelet-cc-baslik` | `#dfe6ee` | :root, [data-tema="mavi"] | [app/tema.css:746](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:746) |
| `--tema-iskelet-cc-aciklama` | `#e8edf3` | :root, [data-tema="mavi"] | [app/tema.css:747](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:747) |
| `--tema-iskelet-cc-banner` | `#dce4ed` | :root, [data-tema="mavi"] | [app/tema.css:748](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:748) |
| `--tema-iskelet-cc-bilgi` | `#e7eef8` | :root, [data-tema="mavi"] | [app/tema.css:749](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:749) |
| `--tema-iskelet-tclub-ilk` | `#f8fbff` | :root, [data-tema="mavi"] | [app/tema.css:750](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:750) |
| `--tema-iskelet-tclub-orta` | `#f6f8fb` | :root, [data-tema="mavi"] | [app/tema.css:751](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:751) |
| `--tema-iskelet-tclub-son` | `#fbfcfe` | :root, [data-tema="mavi"] | [app/tema.css:752](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:752) |
| `--tema-bos-durum-cizgi` | `var(--color-gray-200)` | :root, [data-tema="mavi"] | [app/tema.css:753](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:753) |
| `--tema-bos-durum-kesik-cizgi` | `var(--color-gray-300)` | :root, [data-tema="mavi"] | [app/tema.css:754](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:754) |
| `--tema-bos-durum-zemin` | `#fff` | :root, [data-tema="mavi"] | [app/tema.css:755](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:755) |
| `--tema-bos-durum-soluk-metin` | `var(--color-gray-400)` | :root, [data-tema="mavi"] | [app/tema.css:756](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:756) |
| `--tema-bos-durum-metin` | `var(--color-gray-500)` | :root, [data-tema="mavi"] | [app/tema.css:757](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:757) |
| `--tema-iskelet-yayin-cizgi` | `var(--color-gray-200)` | :root, [data-tema="mavi"] | [app/tema.css:758](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:758) |
| `--tema-iskelet-yayin-kapak` | `var(--color-gray-200)` | :root, [data-tema="mavi"] | [app/tema.css:759](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:759) |
| `--tema-iskelet-yayin-satir` | `var(--color-gray-100)` | :root, [data-tema="mavi"] | [app/tema.css:760](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:760) |
| `--tema-akordiyon-yuzey` | `#fff` | :root, [data-tema="mavi"] | [app/tema.css:761](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:761) |
| `--tema-akordiyon-cc-baslik` | `#10213d` | :root, [data-tema="mavi"] | [app/tema.css:762](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:762) |
| `--tema-akordiyon-cc-aciklama` | `#627d98` | :root, [data-tema="mavi"] | [app/tema.css:763](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:763) |
| `--tema-akordiyon-cc-cizgi` | `#e2e8f0` | :root, [data-tema="mavi"] | [app/tema.css:764](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:764) |
| `--tema-akordiyon-cc-simge-zemin` | `#ebf4ff` | :root, [data-tema="mavi"] | [app/tema.css:765](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:765) |
| `--tema-akordiyon-eylem` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:766](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:766) |
| `--tema-akordiyon-cc-kart-cizgi` | `#e0e8f2` | :root, [data-tema="mavi"] | [app/tema.css:767](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:767) |
| `--tema-akordiyon-cc-takim-acik` | `#f4f8fc` | :root, [data-tema="mavi"] | [app/tema.css:768](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:768) |
| `--tema-akordiyon-cc-ic-cizgi` | `#e2edf8` | :root, [data-tema="mavi"] | [app/tema.css:769](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:769) |
| `--tema-akordiyon-cc-ic-zemin` | `#fafcff` | :root, [data-tema="mavi"] | [app/tema.css:770](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:770) |
| `--tema-akordiyon-cc-hover` | `#fafcff` | :root, [data-tema="mavi"] | [app/tema.css:771](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:771) |
| `--tema-akordiyon-cc-katilim-zemini` | `#eef6ff` | :root, [data-tema="mavi"] | [app/tema.css:772](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:772) |
| `--tema-akordiyon-cc-ok-cizgi` | `#d6e3f0` | :root, [data-tema="mavi"] | [app/tema.css:773](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:773) |
| `--tema-akordiyon-cc-detay-etiket` | `#486581` | :root, [data-tema="mavi"] | [app/tema.css:774](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:774) |
| `--tema-akordiyon-cc-soluk-metin` | `#829ab1` | :root, [data-tema="mavi"] | [app/tema.css:775](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:775) |
| `--tema-akordiyon-cc-bm-cizgi` | `#dbe6f2` | :root, [data-tema="mavi"] | [app/tema.css:776](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:776) |
| `--tema-akordiyon-cc-bm-acik` | `#f0f6fc` | :root, [data-tema="mavi"] | [app/tema.css:777](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:777) |
| `--tema-akordiyon-cc-detay-zemini` | `#f8fbfe` | :root, [data-tema="mavi"] | [app/tema.css:778](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:778) |
| `--tema-akordiyon-cc-bm-hover` | `#f8fbfe` | :root, [data-tema="mavi"] | [app/tema.css:779](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:779) |
| `--tema-akordiyon-cc-bolge-zemini` | `#e8f1f9` | :root, [data-tema="mavi"] | [app/tema.css:780](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:780) |
| `--tema-akordiyon-cc-bolge-metni` | `#2d557a` | :root, [data-tema="mavi"] | [app/tema.css:781](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:781) |
| `--tema-akordiyon-cc-karne-cizgi` | `#e4edf5` | :root, [data-tema="mavi"] | [app/tema.css:782](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:782) |
| `--tema-akordiyon-sira-cizgi` | `#edf2f7` | :root, [data-tema="mavi"] | [app/tema.css:783](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:783) |
| `--tema-akordiyon-ic-soluk-zemin` | `#f8fafc` | :root, [data-tema="mavi"] | [app/tema.css:784](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:784) |
| `--tema-akordiyon-notr-simge-zemin` | `#f1f5f9` | :root, [data-tema="mavi"] | [app/tema.css:785](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:785) |
| `--tema-akordiyon-notr-metin` | `#475569` | :root, [data-tema="mavi"] | [app/tema.css:786](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:786) |
| `--tema-akordiyon-ikincil-metin` | `#64748b` | :root, [data-tema="mavi"] | [app/tema.css:787](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:787) |
| `--tema-akordiyon-hb-ust-etiket` | `#71859d` | :root, [data-tema="mavi"] | [app/tema.css:788](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:788) |
| `--tema-akordiyon-hb-baslik` | `#20324c` | :root, [data-tema="mavi"] | [app/tema.css:789](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:789) |
| `--tema-akordiyon-hb-aciklama` | `#8190a3` | :root, [data-tema="mavi"] | [app/tema.css:790](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:790) |
| `--tema-akordiyon-hb-takim-acik` | `#edf6fd` | :root, [data-tema="mavi"] | [app/tema.css:791](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:791) |
| `--tema-akordiyon-hb-takim-hover` | `#f8fafc` | :root, [data-tema="mavi"] | [app/tema.css:792](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:792) |
| `--tema-akordiyon-hb-takim-simge-zemin` | `#e2f0fc` | :root, [data-tema="mavi"] | [app/tema.css:793](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:793) |
| `--tema-akordiyon-hb-bolge-acik` | `#e6f4ea` | :root, [data-tema="mavi"] | [app/tema.css:794](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:794) |
| `--tema-akordiyon-hb-bolge-hover` | `#fafafa` | :root, [data-tema="mavi"] | [app/tema.css:795](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:795) |
| `--tema-akordiyon-hb-net` | `#0f172a` | :root, [data-tema="mavi"] | [app/tema.css:796](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:796) |
| `--tema-akordiyon-hb-kisi` | `#1e293b` | :root, [data-tema="mavi"] | [app/tema.css:797](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:797) |
| `--tema-akordiyon-hb-bolge-metni` | `#556981` | :root, [data-tema="mavi"] | [app/tema.css:798](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:798) |
| `--tema-akordiyon-hb-soluk-metin` | `#94a3b8` | :root, [data-tema="mavi"] | [app/tema.css:799](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:799) |
| `--tema-akordiyon-hb-utt-hover` | `#f1f5f9` | :root, [data-tema="mavi"] | [app/tema.css:800](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:800) |
| `--tema-akordiyon-cc-kart-golge` | `rgba(16,33,61,0.04)` | :root, [data-tema="mavi"] | [app/tema.css:801](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:801) |
| `--tema-akordiyon-panel-cizgi` | `rgba(148, 163, 184, 0.2)` | :root, [data-tema="mavi"] | [app/tema.css:802](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:802) |
| `--tema-akordiyon-panel-zemin` | `rgba(255, 255, 255, 0.96)` | :root, [data-tema="mavi"] | [app/tema.css:803](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:803) |
| `--tema-akordiyon-panel-golge` | `rgba(36, 64, 98, 0.06)` | :root, [data-tema="mavi"] | [app/tema.css:804](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:804) |
| `--tema-akordiyon-panel-simge-zemini` | `#edf6ff` | :root, [data-tema="mavi"] | [app/tema.css:805](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:805) |
| `--tema-akordiyon-tablo-baslik-metni` | `#7d8ea2` | :root, [data-tema="mavi"] | [app/tema.css:806](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:806) |
| `--tema-akordiyon-tablo-baslik-zemini` | `#f7f9fc` | :root, [data-tema="mavi"] | [app/tema.css:807](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:807) |
| `--tema-akordiyon-tablo-cizgi` | `#edf1f5` | :root, [data-tema="mavi"] | [app/tema.css:808](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:808) |
| `--tema-akordiyon-tablo-metin` | `#40556d` | :root, [data-tema="mavi"] | [app/tema.css:809](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:809) |
| `--tema-akordiyon-tablo-hover` | `#f8fbfe` | :root, [data-tema="mavi"] | [app/tema.css:810](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:810) |
| `--tema-gonderim-detay-zemin` | `#f8fbff` | :root, [data-tema="mavi"] | [app/tema.css:811](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:811) |
| `--tema-gonderim-detay-yuzey` | `#fff` | :root, [data-tema="mavi"] | [app/tema.css:812](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:812) |
| `--tema-gonderim-detay-panel-cizgi` | `#b9d3e9` | :root, [data-tema="mavi"] | [app/tema.css:813](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:813) |
| `--tema-gonderim-detay-baslik-cizgi` | `#e4ecf4` | :root, [data-tema="mavi"] | [app/tema.css:814](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:814) |
| `--tema-gonderim-detay-satir-cizgi` | `#dfe9f2` | :root, [data-tema="mavi"] | [app/tema.css:815](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:815) |
| `--tema-gonderim-detay-acik-sekme-cizgi` | `#d6e0ea` | :root, [data-tema="mavi"] | [app/tema.css:816](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:816) |
| `--tema-gonderim-detay-kapali-sekme-cizgi` | `#9fc5e4` | :root, [data-tema="mavi"] | [app/tema.css:817](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:817) |
| `--tema-gonderim-detay-kapali-sekme-zemin` | `#dcecf8` | :root, [data-tema="mavi"] | [app/tema.css:818](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:818) |
| `--tema-gonderim-detay-kapali-sekme-metin` | `#24618f` | :root, [data-tema="mavi"] | [app/tema.css:819](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:819) |
| `--tema-gonderim-detay-baslik-yardimci` | `#526a86` | :root, [data-tema="mavi"] | [app/tema.css:820](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:820) |
| `--tema-gonderim-detay-baslik` | `#29445f` | :root, [data-tema="mavi"] | [app/tema.css:821](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:821) |
| `--tema-gonderim-detay-kisi-metni` | `#2e4663` | :root, [data-tema="mavi"] | [app/tema.css:822](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:822) |
| `--tema-gonderim-detay-eczane-metni` | `#7b8da5` | :root, [data-tema="mavi"] | [app/tema.css:823](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:823) |
| `--tema-gonderim-detay-tarih-metni` | `#8a9bb0` | :root, [data-tema="mavi"] | [app/tema.css:824](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:824) |
| `--tema-gonderim-detay-bos-metin` | `#a8b4c2` | :root, [data-tema="mavi"] | [app/tema.css:825](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:825) |
| `--tema-gonderim-detay-bitis-metni` | `#647991` | :root, [data-tema="mavi"] | [app/tema.css:826](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:826) |
| `--tema-gonderim-detay-eczaci-metni` | `#607b96` | :root, [data-tema="mavi"] | [app/tema.css:827](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:827) |
| `--tema-gonderim-detay-acik-hover` | `#f1f5f9` | :root, [data-tema="mavi"] | [app/tema.css:828](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:828) |
| `--tema-gonderim-detay-kapali-hover` | `#cfe5f5` | :root, [data-tema="mavi"] | [app/tema.css:829](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:829) |
| `--tema-gonderim-detay-golge` | `rgba(31,74,111,.18)` | :root, [data-tema="mavi"] | [app/tema.css:830](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:830) |
| `--tema-yayin-detay-yuzey` | `#fff` | :root, [data-tema="mavi"] | [app/tema.css:831](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:831) |
| `--tema-yayin-detay-ust-zemin` | `#fbfcfd` | :root, [data-tema="mavi"] | [app/tema.css:832](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:832) |
| `--tema-yayin-detay-govde-zemin` | `#f8fafc` | :root, [data-tema="mavi"] | [app/tema.css:833](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:833) |
| `--tema-yayin-detay-dis-cizgi` | `#dbe4ee` | :root, [data-tema="mavi"] | [app/tema.css:834](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:834) |
| `--tema-yayin-detay-ust-cizgi` | `#e9eff5` | :root, [data-tema="mavi"] | [app/tema.css:835](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:835) |
| `--tema-yayin-detay-cizgi` | `#e2e8f0` | :root, [data-tema="mavi"] | [app/tema.css:836](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:836) |
| `--tema-yayin-detay-bos-cizgi` | `#cbd5e1` | :root, [data-tema="mavi"] | [app/tema.css:837](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:837) |
| `--tema-yayin-detay-simge-zemini` | `#eef5fc` | :root, [data-tema="mavi"] | [app/tema.css:838](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:838) |
| `--tema-yayin-detay-ust-etiket` | `#19335a` | :root, [data-tema="mavi"] | [app/tema.css:839](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:839) |
| `--tema-yayin-detay-baslik` | `#0e1e36` | :root, [data-tema="mavi"] | [app/tema.css:840](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:840) |
| `--tema-yayin-detay-eylem` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:841](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:841) |
| `--tema-yayin-detay-eylem-hover` | `#1d69aa` | :root, [data-tema="mavi"] | [app/tema.css:842](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:842) |
| `--tema-yayin-detay-aciklama` | `#64748b` | :root, [data-tema="mavi"] | [app/tema.css:843](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:843) |
| `--tema-yayin-detay-koyu-metin` | `#1e293b` | :root, [data-tema="mavi"] | [app/tema.css:844](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:844) |
| `--tema-yayin-detay-alan-etiket` | `#7e8f9f` | :root, [data-tema="mavi"] | [app/tema.css:845](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:845) |
| `--tema-yayin-detay-soluk-metin` | `#94a3b8` | :root, [data-tema="mavi"] | [app/tema.css:846](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:846) |
| `--tema-yayin-detay-tarih` | `#334155` | :root, [data-tema="mavi"] | [app/tema.css:847](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:847) |
| `--tema-yayin-detay-secenek-metni` | `#475569` | :root, [data-tema="mavi"] | [app/tema.css:848](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:848) |
| `--tema-yayin-detay-soluk-zemin` | `#f1f5f9` | :root, [data-tema="mavi"] | [app/tema.css:849](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:849) |
| `--tema-yayin-detay-kapat-hover` | `#f1f5f9` | :root, [data-tema="mavi"] | [app/tema.css:850](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:850) |
| `--tema-yayin-detay-iptal-hover` | `var(--color-gray-50)` | :root, [data-tema="mavi"] | [app/tema.css:851](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:851) |
| `--tema-yayin-detay-kapat-metin-hover` | `#0f172a` | :root, [data-tema="mavi"] | [app/tema.css:852](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:852) |
| `--tema-yayin-detay-soru-numara-zemin` | `#eff6ff` | :root, [data-tema="mavi"] | [app/tema.css:853](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:853) |
| `--tema-yayin-detay-soru-numara-metin` | `#2563eb` | :root, [data-tema="mavi"] | [app/tema.css:854](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:854) |
| `--tema-yayin-detay-secenek-cizgi` | `#f1f5f9` | :root, [data-tema="mavi"] | [app/tema.css:855](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:855) |
| `--tema-yayin-detay-secenek-harf-zemin` | `#e2e8f0` | :root, [data-tema="mavi"] | [app/tema.css:856](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:856) |
| `--tema-kart-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:861](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:861) |
| `--tema-tablo-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:862](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:862) |
| `--tema-pencere-cizgi` | `var(--tema-modal-cizgisi)` | [data-tema="yesil"] | [app/tema.css:863](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:863) |
| `--tema-pencere-zemini` | `var(--tema-modal-zemini)` | [data-tema="yesil"] | [app/tema.css:864](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:864) |
| `--tema-ipucu-zemini` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:865](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:865) |
| `--tema-ipucu-metni` | `var(--tema-eylem-metin)` | [data-tema="yesil"] | [app/tema.css:866](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:866) |
| `--tema-iskelet-kart` | `var(--tema-kart)` | [data-tema="yesil"] | [app/tema.css:867](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:867) |
| `--tema-iskelet-sayfa` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:868](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:868) |
| `--tema-iskelet-baslik` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:869](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:869) |
| `--tema-iskelet-satir` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:870](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:870) |
| `--tema-iskelet-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:871](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:871) |
| `--tema-iskelet-ic-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:872](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:872) |
| `--tema-iskelet-lig-sayfa` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:873](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:873) |
| `--tema-iskelet-lig-satir` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:874](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:874) |
| `--tema-iskelet-lig-banner` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:875](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:875) |
| `--tema-iskelet-cc-sayfa` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:876](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:876) |
| `--tema-iskelet-cc-etiket` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:877](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:877) |
| `--tema-iskelet-cc-baslik` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:878](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:878) |
| `--tema-iskelet-cc-aciklama` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:879](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:879) |
| `--tema-iskelet-cc-banner` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:880](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:880) |
| `--tema-iskelet-cc-bilgi` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:881](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:881) |
| `--tema-iskelet-tclub-ilk` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:882](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:882) |
| `--tema-iskelet-tclub-orta` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:883](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:883) |
| `--tema-iskelet-tclub-son` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:884](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:884) |
| `--tema-bos-durum-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:885](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:885) |
| `--tema-bos-durum-kesik-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:886](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:886) |
| `--tema-bos-durum-zemin` | `var(--tema-yuzey)` | [data-tema="yesil"] | [app/tema.css:887](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:887) |
| `--tema-bos-durum-soluk-metin` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:888](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:888) |
| `--tema-bos-durum-metin` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:889](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:889) |
| `--tema-iskelet-yayin-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:890](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:890) |
| `--tema-iskelet-yayin-kapak` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:891](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:891) |
| `--tema-iskelet-yayin-satir` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:892](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:892) |
| `--tema-akordiyon-yuzey` | `var(--tema-yuzey)` | [data-tema="yesil"] | [app/tema.css:893](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:893) |
| `--tema-akordiyon-cc-baslik` | `var(--tema-baslik)` | [data-tema="yesil"] | [app/tema.css:894](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:894) |
| `--tema-akordiyon-cc-aciklama` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:895](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:895) |
| `--tema-akordiyon-cc-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:896](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:896) |
| `--tema-akordiyon-cc-simge-zemin` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:897](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:897) |
| `--tema-akordiyon-eylem` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:898](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:898) |
| `--tema-akordiyon-cc-kart-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:899](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:899) |
| `--tema-akordiyon-cc-takim-acik` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:900](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:900) |
| `--tema-akordiyon-cc-ic-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:901](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:901) |
| `--tema-akordiyon-cc-ic-zemin` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:902](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:902) |
| `--tema-akordiyon-cc-hover` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:903](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:903) |
| `--tema-akordiyon-cc-katilim-zemini` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:904](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:904) |
| `--tema-akordiyon-cc-ok-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:905](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:905) |
| `--tema-akordiyon-cc-detay-etiket` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:906](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:906) |
| `--tema-akordiyon-cc-soluk-metin` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:907](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:907) |
| `--tema-akordiyon-cc-bm-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:908](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:908) |
| `--tema-akordiyon-cc-bm-acik` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:909](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:909) |
| `--tema-akordiyon-cc-detay-zemini` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:910](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:910) |
| `--tema-akordiyon-cc-bm-hover` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:911](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:911) |
| `--tema-akordiyon-cc-bolge-zemini` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:912](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:912) |
| `--tema-akordiyon-cc-bolge-metni` | `var(--tema-bilgi-metni)` | [data-tema="yesil"] | [app/tema.css:913](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:913) |
| `--tema-akordiyon-cc-karne-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:914](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:914) |
| `--tema-akordiyon-sira-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:915](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:915) |
| `--tema-akordiyon-ic-soluk-zemin` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:916](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:916) |
| `--tema-akordiyon-notr-simge-zemin` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:917](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:917) |
| `--tema-akordiyon-notr-metin` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:918](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:918) |
| `--tema-akordiyon-ikincil-metin` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:919](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:919) |
| `--tema-akordiyon-hb-ust-etiket` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:920](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:920) |
| `--tema-akordiyon-hb-baslik` | `var(--tema-baslik)` | [data-tema="yesil"] | [app/tema.css:921](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:921) |
| `--tema-akordiyon-hb-aciklama` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:922](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:922) |
| `--tema-akordiyon-hb-takim-acik` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:923](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:923) |
| `--tema-akordiyon-hb-takim-hover` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:924](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:924) |
| `--tema-akordiyon-hb-takim-simge-zemin` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:925](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:925) |
| `--tema-akordiyon-hb-bolge-acik` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:926](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:926) |
| `--tema-akordiyon-hb-bolge-hover` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:927](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:927) |
| `--tema-akordiyon-hb-net` | `var(--tema-baslik)` | [data-tema="yesil"] | [app/tema.css:928](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:928) |
| `--tema-akordiyon-hb-kisi` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:929](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:929) |
| `--tema-akordiyon-hb-bolge-metni` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:930](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:930) |
| `--tema-akordiyon-hb-soluk-metin` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:931](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:931) |
| `--tema-akordiyon-hb-utt-hover` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:932](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:932) |
| `--tema-akordiyon-cc-kart-golge` | `color-mix(in srgb, var(--tema-eylem) 4%, transparent)` | [data-tema="yesil"] | [app/tema.css:933](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:933) |
| `--tema-akordiyon-panel-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:934](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:934) |
| `--tema-akordiyon-panel-zemin` | `color-mix(in srgb, var(--tema-yuzey) 96%, transparent)` | [data-tema="yesil"] | [app/tema.css:935](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:935) |
| `--tema-akordiyon-panel-golge` | `color-mix(in srgb, var(--tema-eylem) 6%, transparent)` | [data-tema="yesil"] | [app/tema.css:936](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:936) |
| `--tema-akordiyon-panel-simge-zemini` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:937](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:937) |
| `--tema-akordiyon-tablo-baslik-metni` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:938](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:938) |
| `--tema-akordiyon-tablo-baslik-zemini` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:939](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:939) |
| `--tema-akordiyon-tablo-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:940](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:940) |
| `--tema-akordiyon-tablo-metin` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:941](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:941) |
| `--tema-akordiyon-tablo-hover` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:942](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:942) |
| `--tema-gonderim-detay-zemin` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:943](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:943) |
| `--tema-gonderim-detay-yuzey` | `var(--tema-yuzey)` | [data-tema="yesil"] | [app/tema.css:944](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:944) |
| `--tema-gonderim-detay-panel-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:945](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:945) |
| `--tema-gonderim-detay-baslik-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:946](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:946) |
| `--tema-gonderim-detay-satir-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:947](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:947) |
| `--tema-gonderim-detay-acik-sekme-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:948](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:948) |
| `--tema-gonderim-detay-kapali-sekme-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:949](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:949) |
| `--tema-gonderim-detay-kapali-sekme-zemin` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:950](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:950) |
| `--tema-gonderim-detay-kapali-sekme-metin` | `var(--tema-secili-metin)` | [data-tema="yesil"] | [app/tema.css:951](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:951) |
| `--tema-gonderim-detay-baslik-yardimci` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:952](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:952) |
| `--tema-gonderim-detay-baslik` | `var(--tema-baslik)` | [data-tema="yesil"] | [app/tema.css:953](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:953) |
| `--tema-gonderim-detay-kisi-metni` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:954](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:954) |
| `--tema-gonderim-detay-eczane-metni` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:955](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:955) |
| `--tema-gonderim-detay-tarih-metni` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:956](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:956) |
| `--tema-gonderim-detay-bos-metin` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:957](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:957) |
| `--tema-gonderim-detay-bitis-metni` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:958](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:958) |
| `--tema-gonderim-detay-eczaci-metni` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:959](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:959) |
| `--tema-gonderim-detay-acik-hover` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:960](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:960) |
| `--tema-gonderim-detay-kapali-hover` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:961](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:961) |
| `--tema-gonderim-detay-golge` | `color-mix(in srgb, var(--tema-eylem) 18%, transparent)` | [data-tema="yesil"] | [app/tema.css:962](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:962) |
| `--tema-yayin-detay-yuzey` | `var(--tema-modal-zemini)` | [data-tema="yesil"] | [app/tema.css:963](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:963) |
| `--tema-yayin-detay-ust-zemin` | `var(--tema-yuzey)` | [data-tema="yesil"] | [app/tema.css:964](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:964) |
| `--tema-yayin-detay-govde-zemin` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:965](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:965) |
| `--tema-yayin-detay-dis-cizgi` | `var(--tema-modal-cizgisi)` | [data-tema="yesil"] | [app/tema.css:966](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:966) |
| `--tema-yayin-detay-ust-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:967](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:967) |
| `--tema-yayin-detay-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:968](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:968) |
| `--tema-yayin-detay-bos-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:969](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:969) |
| `--tema-yayin-detay-simge-zemini` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:970](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:970) |
| `--tema-yayin-detay-ust-etiket` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:971](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:971) |
| `--tema-yayin-detay-baslik` | `var(--tema-baslik)` | [data-tema="yesil"] | [app/tema.css:972](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:972) |
| `--tema-yayin-detay-eylem` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:973](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:973) |
| `--tema-yayin-detay-eylem-hover` | `var(--tema-eylem-hover)` | [data-tema="yesil"] | [app/tema.css:974](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:974) |
| `--tema-yayin-detay-aciklama` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:975](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:975) |
| `--tema-yayin-detay-koyu-metin` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:976](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:976) |
| `--tema-yayin-detay-alan-etiket` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:977](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:977) |
| `--tema-yayin-detay-soluk-metin` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:978](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:978) |
| `--tema-yayin-detay-tarih` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:979](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:979) |
| `--tema-yayin-detay-secenek-metni` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:980](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:980) |
| `--tema-yayin-detay-soluk-zemin` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:981](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:981) |
| `--tema-yayin-detay-kapat-hover` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:982](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:982) |
| `--tema-yayin-detay-iptal-hover` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:983](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:983) |
| `--tema-yayin-detay-kapat-metin-hover` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:984](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:984) |
| `--tema-yayin-detay-soru-numara-zemin` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:985](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:985) |
| `--tema-yayin-detay-soru-numara-metin` | `var(--tema-secili-metin)` | [data-tema="yesil"] | [app/tema.css:986](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:986) |
| `--tema-yayin-detay-secenek-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:987](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:987) |
| `--tema-yayin-detay-secenek-harf-zemin` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:988](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:988) |
| `--tema-pencere-ortu` | `color-mix(in oklab, var(--color-black) 50%, transparent)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:995](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:995) |
| `--tema-bildirim-hata-zemin` | `#fef2f2` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:996](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:996) |
| `--tema-bildirim-hata-cizgi` | `#fecaca` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:997](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:997) |
| `--tema-bildirim-hata-metin` | `#bc2d0d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:998](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:998) |
| `--tema-bildirim-basari-zemin` | `#f0fdf4` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:999](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:999) |
| `--tema-bildirim-basari-cizgi` | `#bbf7d0` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1000](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1000) |
| `--tema-bildirim-basari-metin` | `#16a34a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1001](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1001) |
| `--tema-bildirim-uyari-zemin` | `#fefce8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1002](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1002) |
| `--tema-bildirim-uyari-cizgi` | `#fde68a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1003](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1003) |
| `--tema-bildirim-uyari-metin` | `#854d0e` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1004](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1004) |
| `--tema-bildirim-bilgi-zemin` | `#eff6ff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1005](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1005) |
| `--tema-bildirim-bilgi-cizgi` | `#bfdbfe` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1006](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1006) |
| `--tema-bildirim-bilgi-metin` | `#1d4ed8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1007](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1007) |
| `--tema-iskelet-cc-kazanim` | `#e7f4ee` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1008](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1008) |
| `--tema-iskelet-cc-kayip` | `#f7eaec` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1009](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1009) |
| `--tema-akordiyon-cc-kazanim` | `#107c41` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1010](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1010) |
| `--tema-akordiyon-cc-kayip` | `#c5221f` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1011](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1011) |
| `--tema-akordiyon-hb-kazanim` | `#16865f` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1012](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1012) |
| `--tema-akordiyon-hb-kayip` | `#d44b40` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1013](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1013) |
| `--tema-akordiyon-hb-kazanim-zemin` | `#f0fdf4` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1014](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1014) |
| `--tema-akordiyon-hb-karne-zemin` | `#fffdf5` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1015](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1015) |
| `--tema-akordiyon-hb-karne-cizgi` | `#fef3c7` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1016](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1016) |
| `--tema-akordiyon-hb-oneri-kazanimi` | `#d97706` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1017](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1017) |
| `--tema-akordiyon-hb-utt-acik` | `#fffbeb` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1018](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1018) |
| `--tema-lig-sira-altin-zemin` | `#fef3c7` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1019](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1019) |
| `--tema-lig-sira-cc-altin` | `#b45309` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1020](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1020) |
| `--tema-lig-sira-altin-cizgi` | `#fde68a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1021](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1021) |
| `--tema-lig-sira-bronz-zemin` | `#ffedd5` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1022](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1022) |
| `--tema-lig-sira-cc-bronz` | `#c2410c` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1023](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1023) |
| `--tema-lig-sira-bronz-cizgi` | `#fed7aa` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1024](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1024) |
| `--tema-lig-sira-hb-altin` | `#92400e` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1025](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1025) |
| `--tema-lig-sira-hb-bronz` | `#9a3412` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1026](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1026) |
| `--tema-lig-sira-gumus-zemin` | `#f1f5f9` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1027](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1027) |
| `--tema-lig-sira-gumus-metin` | `#475569` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1028](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1028) |
| `--tema-lig-sira-gumus-cizgi` | `#e2e8f0` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1029](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1029) |
| `--tema-akordiyon-cc-bm-golge` | `rgba(0,0,0,0.02)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1030](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1030) |
| `--tema-gonderim-detay-hata-metni` | `#a2643c` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1031](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1031) |
| `--tema-gonderim-detay-izleyen` | `var(--color-emerald-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1032](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1032) |
| `--tema-gonderim-detay-bekleyen` | `var(--color-amber-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1033](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1033) |
| `--tema-gonderim-detay-izlemeyen` | `var(--color-red-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1034](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1034) |
| `--tema-gonderim-detay-sure-doldu` | `var(--color-red-600)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1035](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1035) |
| `--tema-gonderim-detay-sure-bekleyen` | `var(--color-amber-600)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1036](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1036) |
| `--tema-yayin-detay-ortu` | `color-mix(in oklab, var(--color-black) 60%, transparent)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1037](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1037) |
| `--tema-yayin-detay-ters-metin` | `#fff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1038](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1038) |
| `--tema-yayin-detay-durum-zemin` | `#ecfdf5` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1039](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1039) |
| `--tema-yayin-detay-durum-metin` | `#167453` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1040](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1040) |
| `--tema-yayin-detay-durum-cizgi` | `#bbf7d0` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1041](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1041) |
| `--tema-yayin-detay-hata-simge` | `var(--color-red-500)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1042](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1042) |
| `--tema-yayin-detay-hata-metin` | `var(--color-red-600)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1043](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1043) |
| `--tema-yayin-detay-dogru-cizgi` | `#86efac` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1044](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1044) |
| `--tema-yayin-detay-dogru-halka` | `#86efac` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1045](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1045) |
| `--tema-yayin-detay-dogru-zemin` | `#f0fdf4` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1046](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1046) |
| `--tema-yayin-detay-dogru-metin` | `#166534` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1047](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1047) |
| `--tema-yayin-detay-dogru-harf` | `#22c55e` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1048](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1048) |
| `--tema-yayin-detay-dogru-isaret` | `#15803d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1049](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1049) |
| `--tema-akordiyon-hb-karne-etiket` | `#92400e` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1055](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1055) |
| `--tema-yayin-detay-eylem-metni` | `#fff` | :root, [data-tema="mavi"] | [app/tema.css:1059](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1059) |
| `--tema-yayin-detay-eylem-metni` | `var(--tema-eylem-metin)` | [data-tema="yesil"] | [app/tema.css:1062](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1062) |
| `--tema-cizim-arac-video-renk` | `#237ac8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1069](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1069) |
| `--tema-cizim-arac-video-zemin` | `#edf5ff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1070](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1070) |
| `--tema-cizim-arac-video-golge` | `#237ac840` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1071](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1071) |
| `--tema-cizim-arac-podcast-renk` | `#8c65c9` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1072](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1072) |
| `--tema-cizim-arac-podcast-zemin` | `#f3effa` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1073](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1073) |
| `--tema-cizim-arac-podcast-golge` | `#8c65c940` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1074](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1074) |
| `--tema-cizim-arac-gorsel-renk` | `#d99438` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1075](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1075) |
| `--tema-cizim-arac-gorsel-zemin` | `#fff6e8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1076](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1076) |
| `--tema-cizim-arac-gorsel-golge` | `#d9943840` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1077](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1077) |
| `--tema-cizim-arac-literatur-renk` | `#23947a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1078](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1078) |
| `--tema-cizim-arac-literatur-zemin` | `#edf8f4` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1079](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1079) |
| `--tema-cizim-arac-literatur-golge` | `#23947a40` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1080](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1080) |
| `--tema-cizim-kazanc-izleme` | `#28b56b` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1081](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1081) |
| `--tema-cizim-kazanc-cevaplama` | `#7c3aed` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1082](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1082) |
| `--tema-cizim-kazanc-oneri` | `#f59e0b` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1083](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1083) |
| `--tema-cizim-kazanc-eclub` | `#16a9c7` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1084](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1084) |
| `--tema-cizim-kazanc-negatif` | `#dc2626` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1085](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1085) |
| `--tema-cizim-kayip-cubuk` | `#ef4444` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1086](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1086) |
| `--tema-cizim-lig-izleme` | `#1aa160` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1087](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1087) |
| `--tema-cizim-lig-cevaplama` | `#6d5ce8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1088](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1088) |
| `--tema-cizim-lig-oneri` | `#f59e0b` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1089](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1089) |
| `--tema-cizim-lig-extra` | `#2f9ae9` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1090](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1090) |
| `--tema-cizim-lig-eclub` | `#237ac8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1091](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1091) |
| `--tema-cizim-lig-kayip` | `#e44c4c` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1092](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1092) |
| `--tema-cizim-lider-altin-zemin` | `#fff8e8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1093](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1093) |
| `--tema-cizim-lider-altin-cizgi` | `#f7cb70` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1094](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1094) |
| `--tema-cizim-lider-altin-simge` | `#e99a14` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1095](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1095) |
| `--tema-cizim-madalya-gumus-koyu` | `#4b5563` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1096](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1096) |
| `--tema-cizim-madalya-gumus-orta` | `#8c98a7` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1097](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1097) |
| `--tema-cizim-madalya-gumus-acik` | `#e5e7eb` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1098](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1098) |
| `--tema-cizim-madalya-gumus-golge` | `#2f3742` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1099](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1099) |
| `--tema-cizim-madalya-parlama` | `#ffffff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1100](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1100) |
| `--tema-cizim-madalya-gumus-kontur` | `#414b58` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1101](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1101) |
| `--tema-cizim-madalya-altin-koyu` | `#704000` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1102](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1102) |
| `--tema-cizim-madalya-altin-orta` | `#b9780b` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1103](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1103) |
| `--tema-cizim-madalya-altin-acik` | `#e7b746` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1104](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1104) |
| `--tema-cizim-madalya-altin-golge` | `#5b3000` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1105](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1105) |
| `--tema-cizim-madalya-altin-parlama` | `#ffe49a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1106](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1106) |
| `--tema-cizim-madalya-altin-ust-kontur` | `#6a3900` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1107](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1107) |
| `--tema-cizim-madalya-altin-alt-kontur` | `#623400` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1108](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1108) |
| `--tema-cizim-begeni` | `#ef4444` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1109](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1109) |
| `--tema-cizim-favori` | `#2563eb` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1110](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1110) |
| `--tema-cizim-begeni-rozet` | `#FEE2E2` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1111](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1111) |
| `--tema-cizim-favori-rozet` | `#DBEAFE` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1112](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1112) |
| `--tema-cizim-sure-baslangic` | `#16a34a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1113](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1113) |
| `--tema-cizim-sure-orta` | `#d99300` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1114](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1114) |
| `--tema-cizim-sure-bitis` | `var(--tema-hoyk-sure-doldu)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1115](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1115) |
| `--tema-cizim-sure-tamamlandi` | `var(--tema-hoyk-tamamlandi)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1116](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1116) |
| `--tema-cizim-dagilim-1` | `#378ADD` | :root, [data-tema="mavi"] | [app/tema.css:1120](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1120) |
| `--tema-cizim-dagilim-2` | `#1D9E75` | :root, [data-tema="mavi"] | [app/tema.css:1121](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1121) |
| `--tema-cizim-dagilim-3` | `#EF9F27` | :root, [data-tema="mavi"] | [app/tema.css:1122](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1122) |
| `--tema-cizim-dagilim-4` | `#D4537E` | :root, [data-tema="mavi"] | [app/tema.css:1123](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1123) |
| `--tema-cizim-dagilim-5` | `#7F77DD` | :root, [data-tema="mavi"] | [app/tema.css:1124](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1124) |
| `--tema-cizim-dagilim-6` | `#D85A30` | :root, [data-tema="mavi"] | [app/tema.css:1125](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1125) |
| `--tema-cizim-dagilim-7` | `#639922` | :root, [data-tema="mavi"] | [app/tema.css:1126](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1126) |
| `--tema-cizim-dagilim-eksik` | `#888780` | :root, [data-tema="mavi"] | [app/tema.css:1127](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1127) |
| `--tema-cizim-dagilim-metin` | `#6b7280` | :root, [data-tema="mavi"] | [app/tema.css:1128](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1128) |
| `--tema-cizim-dagilim-etiket` | `#374151` | :root, [data-tema="mavi"] | [app/tema.css:1129](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1129) |
| `--tema-cizim-dagilim-soluk` | `#9ca3af` | :root, [data-tema="mavi"] | [app/tema.css:1130](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1130) |
| `--tema-cizim-dagilim-eksen` | `#e5e7eb` | :root, [data-tema="mavi"] | [app/tema.css:1131](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1131) |
| `--tema-cizim-dagilim-ayirici` | `#f1f1ee` | :root, [data-tema="mavi"] | [app/tema.css:1132](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1132) |
| `--tema-cizim-dagilim-kart` | `#fff` | :root, [data-tema="mavi"] | [app/tema.css:1133](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1133) |
| `--tema-cizim-dagilim-cizgi` | `#94A3B8` | :root, [data-tema="mavi"] | [app/tema.css:1134](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1134) |
| `--tema-cizim-dagilim-alan` | `rgba(55,138,221,0.10)` | :root, [data-tema="mavi"] | [app/tema.css:1135](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1135) |
| `--tema-cizim-dagilim-secili` | `rgba(86,174,255,0.08)` | :root, [data-tema="mavi"] | [app/tema.css:1136](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1136) |
| `--tema-cizim-dagilim-hover` | `var(--color-gray-50)` | :root, [data-tema="mavi"] | [app/tema.css:1137](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1137) |
| `--tema-cizim-png-zemin` | `#fff` | :root, [data-tema="mavi"] | [app/tema.css:1138](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1138) |
| `--tema-cizim-png-cizgi` | `#e5e7eb` | :root, [data-tema="mavi"] | [app/tema.css:1139](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1139) |
| `--tema-cizim-png-dugme` | `rgba(255,255,255,0.9)` | :root, [data-tema="mavi"] | [app/tema.css:1140](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1140) |
| `--tema-cizim-png-metin` | `#6b7280` | :root, [data-tema="mavi"] | [app/tema.css:1141](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1141) |
| `--tema-cizim-performans-kart` | `#fff` | :root, [data-tema="mavi"] | [app/tema.css:1142](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1142) |
| `--tema-cizim-performans-cizgi` | `#e3eaf2` | :root, [data-tema="mavi"] | [app/tema.css:1143](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1143) |
| `--tema-cizim-performans-metin` | `#203653` | :root, [data-tema="mavi"] | [app/tema.css:1144](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1144) |
| `--tema-cizim-performans-eksen` | `#edf1f6` | :root, [data-tema="mavi"] | [app/tema.css:1145](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1145) |
| `--tema-cizim-performans-soluk` | `#8a99af` | :root, [data-tema="mavi"] | [app/tema.css:1146](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1146) |
| `--tema-cizim-performans-hafta-cizgi` | `#9eb6d3` | :root, [data-tema="mavi"] | [app/tema.css:1147](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1147) |
| `--tema-cizim-performans-hafta-metin` | `#6f89aa` | :root, [data-tema="mavi"] | [app/tema.css:1148](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1148) |
| `--tema-cizim-performans-bos-cizgi` | `#dce5ef` | :root, [data-tema="mavi"] | [app/tema.css:1149](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1149) |
| `--tema-cizim-puan-cubuk-zemin` | `#e9eef5` | :root, [data-tema="mavi"] | [app/tema.css:1150](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1150) |
| `--tema-cizim-lider-simge-zemin` | `#edf6ff` | :root, [data-tema="mavi"] | [app/tema.css:1151](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1151) |
| `--tema-cizim-lider-simge` | `#3187ed` | :root, [data-tema="mavi"] | [app/tema.css:1152](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1152) |
| `--tema-cizim-lider-yol` | `#e9eef6` | :root, [data-tema="mavi"] | [app/tema.css:1153](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1153) |
| `--tema-cizim-lider-ilerleme` | `#3287ef` | :root, [data-tema="mavi"] | [app/tema.css:1154](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1154) |
| `--tema-cizim-lider-etiket` | `#f3f8ff` | :root, [data-tema="mavi"] | [app/tema.css:1155](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1155) |
| `--tema-cizim-lider-etiket-cizgi` | `#d8e8fb` | :root, [data-tema="mavi"] | [app/tema.css:1156](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1156) |
| `--tema-cizim-lider-sen` | `#2f80ed` | :root, [data-tema="mavi"] | [app/tema.css:1157](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1157) |
| `--tema-cizim-lider-puan` | `#10213d` | :root, [data-tema="mavi"] | [app/tema.css:1158](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1158) |
| `--tema-cizim-lider-isaret-cizgi` | `#dbe8fa` | :root, [data-tema="mavi"] | [app/tema.css:1159](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1159) |
| `--tema-cizim-lider-yardimci` | `#8795aa` | :root, [data-tema="mavi"] | [app/tema.css:1160](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1160) |
| `--tema-cizim-lider-bolme` | `#dde6f1` | :root, [data-tema="mavi"] | [app/tema.css:1161](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1161) |
| `--tema-cizim-lider-alt-zemin` | `#f5f8fc` | :root, [data-tema="mavi"] | [app/tema.css:1162](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1162) |
| `--tema-cizim-lider-isaret` | `white` | :root, [data-tema="mavi"] | [app/tema.css:1163](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1163) |
| `--tema-cizim-madalya-donem-cizgi` | `#d6e2ef` | :root, [data-tema="mavi"] | [app/tema.css:1164](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1164) |
| `--tema-cizim-madalya-yil-cizgi` | `#dfe7f0` | :root, [data-tema="mavi"] | [app/tema.css:1165](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1165) |
| `--tema-cizim-rapor-yardimci` | `#737373` | :root, [data-tema="mavi"] | [app/tema.css:1166](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1166) |
| `--tema-cizim-rapor-baslik` | `#111827` | :root, [data-tema="mavi"] | [app/tema.css:1167](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1167) |
| `--tema-cizim-tooltip-kart` | `#fff` | :root, [data-tema="mavi"] | [app/tema.css:1168](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1168) |
| `--tema-cizim-tooltip-metin` | `#6d6e73` | :root, [data-tema="mavi"] | [app/tema.css:1169](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1169) |
| `--tema-cizim-dagilim-1` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:1172](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1172) |
| `--tema-cizim-dagilim-2` | `var(--tema-bilgi-metni)` | [data-tema="yesil"] | [app/tema.css:1173](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1173) |
| `--tema-cizim-dagilim-3` | `var(--tema-toprak)` | [data-tema="yesil"] | [app/tema.css:1174](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1174) |
| `--tema-cizim-dagilim-4` | `var(--tema-toprak-acik)` | [data-tema="yesil"] | [app/tema.css:1175](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1175) |
| `--tema-cizim-dagilim-5` | `var(--tema-secili-metin)` | [data-tema="yesil"] | [app/tema.css:1176](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1176) |
| `--tema-cizim-dagilim-6` | `var(--tema-eylem-hover)` | [data-tema="yesil"] | [app/tema.css:1177](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1177) |
| `--tema-cizim-dagilim-7` | `var(--tema-odak)` | [data-tema="yesil"] | [app/tema.css:1178](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1178) |
| `--tema-cizim-dagilim-eksik` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:1179](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1179) |
| `--tema-cizim-dagilim-metin` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:1180](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1180) |
| `--tema-cizim-dagilim-etiket` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:1181](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1181) |
| `--tema-cizim-dagilim-soluk` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:1182](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1182) |
| `--tema-cizim-dagilim-eksen` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:1183](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1183) |
| `--tema-cizim-dagilim-ayirici` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:1184](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1184) |
| `--tema-cizim-dagilim-kart` | `var(--tema-kart)` | [data-tema="yesil"] | [app/tema.css:1185](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1185) |
| `--tema-cizim-dagilim-cizgi` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:1186](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1186) |
| `--tema-cizim-dagilim-alan` | `#3555451a` | [data-tema="yesil"] | [app/tema.css:1187](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1187) |
| `--tema-cizim-dagilim-secili` | `#35554514` | [data-tema="yesil"] | [app/tema.css:1188](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1188) |
| `--tema-cizim-dagilim-hover` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:1189](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1189) |
| `--tema-cizim-png-zemin` | `var(--tema-kart)` | [data-tema="yesil"] | [app/tema.css:1190](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1190) |
| `--tema-cizim-png-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:1191](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1191) |
| `--tema-cizim-png-dugme` | `#fcfdf8e6` | [data-tema="yesil"] | [app/tema.css:1192](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1192) |
| `--tema-cizim-png-metin` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:1193](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1193) |
| `--tema-cizim-performans-kart` | `var(--tema-kart)` | [data-tema="yesil"] | [app/tema.css:1194](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1194) |
| `--tema-cizim-performans-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:1195](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1195) |
| `--tema-cizim-performans-metin` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:1196](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1196) |
| `--tema-cizim-performans-eksen` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:1197](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1197) |
| `--tema-cizim-performans-soluk` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:1198](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1198) |
| `--tema-cizim-performans-hafta-cizgi` | `var(--tema-bilgi-metni)` | [data-tema="yesil"] | [app/tema.css:1199](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1199) |
| `--tema-cizim-performans-hafta-metin` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:1200](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1200) |
| `--tema-cizim-performans-bos-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:1201](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1201) |
| `--tema-cizim-puan-cubuk-zemin` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:1202](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1202) |
| `--tema-cizim-lider-simge-zemin` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:1203](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1203) |
| `--tema-cizim-lider-simge` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:1204](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1204) |
| `--tema-cizim-lider-yol` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:1205](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1205) |
| `--tema-cizim-lider-ilerleme` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:1206](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1206) |
| `--tema-cizim-lider-etiket` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:1207](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1207) |
| `--tema-cizim-lider-etiket-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:1208](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1208) |
| `--tema-cizim-lider-sen` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:1209](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1209) |
| `--tema-cizim-lider-puan` | `var(--tema-baslik)` | [data-tema="yesil"] | [app/tema.css:1210](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1210) |
| `--tema-cizim-lider-isaret-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:1211](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1211) |
| `--tema-cizim-lider-yardimci` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:1212](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1212) |
| `--tema-cizim-lider-bolme` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:1213](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1213) |
| `--tema-cizim-lider-alt-zemin` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:1214](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1214) |
| `--tema-cizim-lider-isaret` | `var(--tema-kart)` | [data-tema="yesil"] | [app/tema.css:1215](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1215) |
| `--tema-cizim-madalya-donem-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:1216](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1216) |
| `--tema-cizim-madalya-yil-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:1217](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1217) |
| `--tema-cizim-rapor-yardimci` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:1218](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1218) |
| `--tema-cizim-rapor-baslik` | `var(--tema-baslik)` | [data-tema="yesil"] | [app/tema.css:1219](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1219) |
| `--tema-cizim-tooltip-kart` | `var(--tema-kart)` | [data-tema="yesil"] | [app/tema.css:1220](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1220) |
| `--tema-cizim-tooltip-metin` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:1221](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1221) |
| `--tema-svg-performans-secim-oku` | `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%237c8da4' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")` | :root, [data-tema="mavi"] | [app/tema.css:1227](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1227) |
| `--tema-svg-performans-secim-oku` | `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2368766e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")` | [data-tema="yesil"] | [app/tema.css:1230](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1230) |
| `--tema-yerel-lig-kart-01` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1237](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1237) |
| `--tema-yerel-lig-islevsel-cizgi-01` | `var(--color-emerald-100)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1238](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1238) |
| `--tema-yerel-lig-islevsel-zemin-01` | `var(--color-emerald-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1239](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1239) |
| `--tema-yerel-lig-islevsel-metin-01` | `var(--color-emerald-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1240](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1240) |
| `--tema-yerel-lig-islevsel-cizgi-02` | `var(--color-rose-100)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1241](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1241) |
| `--tema-yerel-lig-islevsel-zemin-02` | `var(--color-rose-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1242](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1242) |
| `--tema-yerel-lig-islevsel-metin-02` | `var(--color-rose-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1243](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1243) |
| `--tema-yerel-lig-islevsel-metin-03` | `#d78022` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1244](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1244) |
| `--tema-yerel-lig-islevsel-zemin-03` | `#fff6e8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1245](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1245) |
| `--tema-yerel-lig-islevsel-metin-04` | `#16865f` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1246](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1246) |
| `--tema-yerel-lig-islevsel-zemin-04` | `#ebf8f2` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1247](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1247) |
| `--tema-yerel-ana-sayfa-islevsel-metin-01` | `var(--color-gray-900)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1248](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1248) |
| `--tema-yerel-ana-sayfa-islevsel-metin-02` | `#d78022` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1249](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1249) |
| `--tema-yerel-ana-sayfa-islevsel-zemin-01` | `#fff6e8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1250](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1250) |
| `--tema-yerel-ana-sayfa-islevsel-metin-03` | `#16865f` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1251](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1251) |
| `--tema-yerel-ana-sayfa-islevsel-zemin-02` | `#ebf8f2` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1252](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1252) |
| `--tema-yerel-ana-sayfa-islevsel-metin-04` | `#7358c7` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1253](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1253) |
| `--tema-yerel-ana-sayfa-islevsel-zemin-03` | `#f2efff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1254](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1254) |
| `--tema-yerel-ana-sayfa-kart-01` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1255](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1255) |
| `--tema-yerel-eclub-kart-01` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1256](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1256) |
| `--tema-yerel-eclub-islevsel-metin-01` | `#a66215` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1257](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1257) |
| `--tema-yerel-eclub-islevsel-zemin-01` | `#fff6e8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1258](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1258) |
| `--tema-yerel-eclub-islevsel-metin-02` | `#16865f` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1259](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1259) |
| `--tema-yerel-eclub-islevsel-zemin-02` | `#ebf8f2` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1260](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1260) |
| `--tema-yerel-eclub-islevsel-metin-03` | `#bc4b4b` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1261](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1261) |
| `--tema-yerel-eclub-islevsel-zemin-03` | `#fff0f0` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1262](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1262) |
| `--tema-yerel-eclub-islevsel-metin-04` | `#dc2626` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1263](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1263) |
| `--tema-yerel-eclub-islevsel-metin-05` | `#16a34a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1264](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1264) |
| `--tema-yerel-eclub-islevsel-cizgi-01` | `var(--color-red-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1265](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1265) |
| `--tema-yerel-eclub-islevsel-zemin-04` | `var(--color-red-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1266](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1266) |
| `--tema-yerel-eclub-islevsel-metin-06` | `var(--color-red-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1267](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1267) |
| `--tema-yerel-eclub-islevsel-cizgi-02` | `#e5eef7` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1268](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1268) |
| `--tema-yerel-eclub-islevsel-zemin-05` | `#f8fbfe` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1269](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1269) |
| `--tema-yerel-eclub-islevsel-metin-07` | `#d97706` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1270](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1270) |
| `--tema-yerel-eclub-islevsel-cizgi-03` | `var(--color-emerald-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1271](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1271) |
| `--tema-yerel-eclub-islevsel-zemin-06` | `var(--color-emerald-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1272](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1272) |
| `--tema-yerel-eclub-islevsel-metin-08` | `var(--color-emerald-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1273](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1273) |
| `--tema-yerel-eclub-islevsel-cizgi-04` | `var(--color-amber-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1274](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1274) |
| `--tema-yerel-eclub-islevsel-zemin-07` | `var(--color-amber-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1275](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1275) |
| `--tema-yerel-eclub-islevsel-metin-09` | `var(--color-amber-800)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1276](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1276) |
| `--tema-yerel-eclub-islevsel-metin-10` | `var(--color-amber-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1277](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1277) |
| `--tema-yerel-eclub-kart-02` | `#ffffff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1278](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1278) |
| `--tema-yerel-eclub-islevsel-cizgi-05` | `#ffeadc` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1279](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1279) |
| `--tema-yerel-eclub-islevsel-zemin-08` | `#fffaf6` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1280](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1280) |
| `--tema-yerel-eclub-islevsel-zemin-09` | `#ffeadc` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1281](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1281) |
| `--tema-yerel-eclub-islevsel-metin-11` | `#f26a16` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1282](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1282) |
| `--tema-yerel-eclub-ters-metin-01` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1283](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1283) |
| `--tema-yerel-eclub-islevsel-zemin-10` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1284](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1284) |
| `--tema-yerel-eclub-islevsel-metin-12` | `#237ac8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1285](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1285) |
| `--tema-yerel-eclub-islevsel-zemin-11` | `#edf6fd` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1286](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1286) |
| `--tema-yerel-eclub-islevsel-metin-13` | `#5367c7` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1287](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1287) |
| `--tema-yerel-eclub-islevsel-zemin-12` | `#f0f1ff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1288](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1288) |
| `--tema-yerel-eclub-kart-03` | `#fff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1289](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1289) |
| `--tema-yerel-eclub-ters-metin-02` | `#fff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1290](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1290) |
| `--tema-yerel-eclub-kart-04` | `rgba(255, 255, 255, 0.96)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1291](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1291) |
| `--tema-yerel-eclub-kart-05` | `rgba(255, 255, 255, 0.3)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1292](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1292) |
| `--tema-yerel-eclub-kart-06` | `rgba(255, 255, 255, 0.24)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1293](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1293) |
| `--tema-yerel-eclub-golge-07` | `rgba(255, 255, 255, 0.12)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1294](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1294) |
| `--tema-yerel-eclub-golge-09` | `rgba(0, 0, 0, 0.45)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1295](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1295) |
| `--tema-yerel-eclub-islevsel-metin-14` | `#2f3945` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1296](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1296) |
| `--tema-yerel-eclub-islevsel-metin-15` | `rgba(255, 255, 255, 0.94)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1297](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1297) |
| `--tema-yerel-eclub-islevsel-metin-16` | `rgba(15, 20, 27, 0.72)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1298](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1298) |
| `--tema-yerel-eclub-islevsel-metin-17` | `#603000` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1299](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1299) |
| `--tema-yerel-eclub-islevsel-metin-18` | `rgba(255, 229, 139, 0.95)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1300](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1300) |
| `--tema-yerel-eclub-islevsel-metin-19` | `rgba(55, 25, 0, 0.74)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1301](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1301) |
| `--tema-yerel-eclub-islevsel-metin-20` | `#572716` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1302](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1302) |
| `--tema-yerel-eclub-islevsel-metin-21` | `rgba(255, 194, 151, 0.94)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1303](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1303) |
| `--tema-yerel-eclub-islevsel-metin-22` | `rgba(45, 18, 10, 0.74)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1304](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1304) |
| `--tema-yerel-eclub-islevsel-cizgi-06` | `#fde68a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1305](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1305) |
| `--tema-yerel-eclub-islevsel-metin-23` | `#92400e` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1306](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1306) |
| `--tema-yerel-eclub-islevsel-zemin-13` | `#fffbeb` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1307](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1307) |
| `--tema-yerel-eclub-islevsel-metin-24` | `#208a66` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1308](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1308) |
| `--tema-yerel-eclub-islevsel-metin-25` | `#d45c4b` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1309](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1309) |
| `--tema-yerel-eclub-islevsel-cizgi-07` | `var(--color-red-100)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1310](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1310) |
| `--tema-yerel-eclub-islevsel-metin-26` | `#a43737` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1311](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1311) |
| `--tema-yerel-eclub-islevsel-metin-27` | `#0f766e` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1312](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1312) |
| `--tema-yerel-eclub-islevsel-metin-28` | `#7c5ce7` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1313](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1313) |
| `--tema-yerel-eclub-islevsel-zemin-14` | `#fef2f2` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1314](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1314) |
| `--tema-yerel-eclub-islevsel-cizgi-08` | `var(--color-blue-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1315](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1315) |
| `--tema-yerel-eclub-islevsel-zemin-15` | `var(--color-blue-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1316](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1316) |
| `--tema-yerel-eclub-islevsel-metin-29` | `var(--color-blue-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1317](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1317) |
| `--tema-yerel-eclub-islevsel-cizgi-09` | `var(--color-violet-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1318](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1318) |
| `--tema-yerel-eclub-islevsel-zemin-16` | `var(--color-violet-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1319](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1319) |
| `--tema-yerel-eclub-islevsel-metin-30` | `var(--color-violet-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1320](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1320) |
| `--tema-yerel-eclub-ortu-01` | `var(--color-black)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1321](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1321) |
| `--tema-yerel-eclub-islevsel-metin-31` | `var(--color-amber-900)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1322](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1322) |
| `--tema-yerel-eclub-islevsel-zemin-17` | `var(--color-amber-100)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1323](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1323) |
| `--tema-yerel-eclub-islevsel-zemin-18` | `#fef3c7` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1324](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1324) |
| `--tema-yerel-eclub-islevsel-cizgi-10` | `var(--color-purple-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1325](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1325) |
| `--tema-yerel-eclub-islevsel-zemin-19` | `var(--color-purple-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1326](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1326) |
| `--tema-yerel-eclub-islevsel-metin-32` | `var(--color-purple-800)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1327](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1327) |
| `--tema-yerel-eclub-islevsel-cizgi-11` | `var(--color-emerald-300)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1328](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1328) |
| `--tema-yerel-eclub-islevsel-metin-33` | `var(--color-emerald-900)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1329](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1329) |
| `--tema-yerel-eclub-islevsel-metin-34` | `var(--color-purple-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1330](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1330) |
| `--tema-yerel-eclub-islevsel-zemin-20` | `var(--color-purple-600)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1331](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1331) |
| `--tema-yerel-eclub-islevsel-zemin-21` | `var(--color-purple-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1332](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1332) |
| `--tema-yerel-eclub-islevsel-metin-35` | `var(--color-purple-900)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1333](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1333) |
| `--tema-yerel-eclub-islevsel-zemin-22` | `#fff3f1` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1334](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1334) |
| `--tema-yerel-eclub-islevsel-metin-36` | `#ad625c` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1335](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1335) |
| `--tema-yerel-eclub-islevsel-metin-37` | `#2b8555` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1336](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1336) |
| `--tema-yerel-eclub-islevsel-metin-38` | `#aa7727` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1337](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1337) |
| `--tema-yerel-eclub-islevsel-zemin-23` | `#fff5df` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1338](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1338) |
| `--tema-yerel-eclub-islevsel-metin-39` | `#966819` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1339](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1339) |
| `--tema-yerel-eczanem-kart-01` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1340](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1340) |
| `--tema-yerel-eczanem-islevsel-metin-01` | `#b42318` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1341](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1341) |
| `--tema-yerel-eczanem-ters-metin-01` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1342](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1342) |
| `--tema-yerel-eczanem-islevsel-metin-02` | `#16865f` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1343](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1343) |
| `--tema-yerel-eczanem-islevsel-zemin-01` | `#eaf7f2` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1344](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1344) |
| `--tema-yerel-eczanem-islevsel-metin-03` | `#b7791f` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1345](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1345) |
| `--tema-yerel-eczanem-islevsel-zemin-02` | `#fff7e6` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1346](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1346) |
| `--tema-yerel-eczanem-islevsel-cizgi-01` | `#f2c9c9` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1347](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1347) |
| `--tema-yerel-eczanem-islevsel-zemin-03` | `#fffafa` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1348](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1348) |
| `--tema-yerel-eczanem-islevsel-zemin-04` | `#fdecec` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1349](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1349) |
| `--tema-yerel-eczanem-islevsel-metin-04` | `#7f1d1d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1350](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1350) |
| `--tema-yerel-eczanem-islevsel-zemin-05` | `#fff7e8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1351](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1351) |
| `--tema-yerel-eczanem-islevsel-zemin-06` | `#edf9f4` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1352](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1352) |
| `--tema-yerel-eczanem-islevsel-metin-05` | `#6550b9` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1353](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1353) |
| `--tema-yerel-eczanem-islevsel-zemin-07` | `#f2effc` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1354](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1354) |
| `--tema-yerel-eczanem-islevsel-cizgi-02` | `var(--color-red-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1355](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1355) |
| `--tema-yerel-eczanem-islevsel-zemin-08` | `var(--color-red-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1356](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1356) |
| `--tema-yerel-eczanem-islevsel-metin-06` | `var(--color-red-800)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1357](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1357) |
| `--tema-yerel-eczanem-islevsel-metin-07` | `var(--color-red-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1358](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1358) |
| `--tema-yerel-eczanem-islevsel-zemin-09` | `var(--color-red-100)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1359](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1359) |
| `--tema-yerel-eczanem-islevsel-cizgi-03` | `#f1d3d3` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1360](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1360) |
| `--tema-yerel-eczanem-islevsel-zemin-10` | `#fff7f7` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1361](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1361) |
| `--tema-yerel-eczanem-islevsel-metin-08` | `#a74646` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1362](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1362) |
| `--tema-yerel-eczanem-islevsel-cizgi-04` | `#e8bcbc` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1363](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1363) |
| `--tema-yerel-eczanem-islevsel-zemin-11` | `#fff1f1` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1364](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1364) |
| `--tema-yerel-eczanem-islevsel-metin-09` | `#913737` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1365](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1365) |
| `--tema-yerel-eczanem-islevsel-zemin-12` | `#fff0f0` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1366](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1366) |
| `--tema-yerel-eczanem-islevsel-metin-10` | `#b84444` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1367](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1367) |
| `--tema-yerel-eczanem-islevsel-metin-11` | `#8f3636` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1368](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1368) |
| `--tema-yerel-eczanem-islevsel-metin-12` | `#9a6969` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1369](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1369) |
| `--tema-yerel-eczanem-islevsel-metin-13` | `#ad7b7b` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1370](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1370) |
| `--tema-yerel-eczanem-islevsel-metin-14` | `var(--color-red-600)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1371](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1371) |
| `--tema-yerel-eczanem-islevsel-zemin-13` | `#16865f` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1372](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1372) |
| `--tema-yerel-eczanem-islevsel-zemin-14` | `#116d4d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1373](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1373) |
| `--tema-yerel-eczanem-islevsel-cizgi-05` | `#efd1d1` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1374](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1374) |
| `--tema-yerel-eczanem-islevsel-zemin-15` | `#fff5f5` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1375](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1375) |
| `--tema-yerel-eczanem-islevsel-metin-15` | `#a33434` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1376](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1376) |
| `--tema-yerel-eczanem-islevsel-cizgi-06` | `#bde5d5` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1377](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1377) |
| `--tema-yerel-eczanem-islevsel-metin-16` | `#157254` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1378](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1378) |
| `--tema-yerel-eczanem-islevsel-zemin-16` | `#b84444` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1379](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1379) |
| `--tema-yerel-eczanem-islevsel-zemin-17` | `#9f3636` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1380](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1380) |
| `--tema-yerel-eczanem-islevsel-zemin-18` | `#e7f6ee` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1381](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1381) |
| `--tema-yerel-eczanem-islevsel-metin-17` | `#188354` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1382](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1382) |
| `--tema-yerel-eczanem-islevsel-metin-18` | `#a2643c` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1383](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1383) |
| `--tema-yerel-eczanem-islevsel-metin-19` | `#28815c` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1384](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1384) |
| `--tema-yerel-eczanem-islevsel-metin-20` | `#2e8962` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1385](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1385) |
| `--tema-yerel-eczanem-islevsel-zemin-19` | `#fff5df` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1386](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1386) |
| `--tema-yerel-eczanem-islevsel-metin-21` | `var(--color-amber-800)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1387](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1387) |
| `--tema-yerel-eczanem-islevsel-cizgi-07` | `var(--color-gray-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1388](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1388) |
| `--tema-yerel-eczanem-islevsel-cizgi-08` | `#c8ead7` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1389](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1389) |
| `--tema-yerel-eczanem-islevsel-zemin-20` | `#eff9f4` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1390](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1390) |
| `--tema-yerel-eczanem-islevsel-metin-22` | `#276a4d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1391](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1391) |
| `--tema-yerel-eczanem-islevsel-cizgi-09` | `#f0dbc0` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1392](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1392) |
| `--tema-yerel-eczanem-islevsel-zemin-21` | `#fff9ed` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1393](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1393) |
| `--tema-yerel-eczanem-islevsel-metin-23` | `#8c5b20` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1394](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1394) |
| `--tema-yerel-eczanem-islevsel-cizgi-10` | `#efd7a5` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1395](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1395) |
| `--tema-yerel-eczanem-islevsel-metin-24` | `#946414` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1396](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1396) |
| `--tema-yerel-eczanem-islevsel-cizgi-11` | `#e2d8f5` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1397](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1397) |
| `--tema-yerel-eczanem-islevsel-zemin-22` | `#f8f6fd` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1398](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1398) |
| `--tema-yerel-eczanem-islevsel-zemin-23` | `#6550b9` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1399](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1399) |
| `--tema-yerel-eczanem-islevsel-zemin-24` | `#5743a4` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1400](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1400) |
| `--tema-yerel-hesap-kart-01` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1401](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1401) |
| `--tema-yerel-hesap-ters-metin-01` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1402](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1402) |
| `--tema-yerel-hesap-islevsel-zemin-01` | `var(--color-green-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1403](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1403) |
| `--tema-yerel-hesap-islevsel-metin-01` | `var(--color-green-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1404](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1404) |
| `--tema-yerel-hesap-islevsel-cizgi-01` | `var(--color-green-100)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1405](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1405) |
| `--tema-yerel-hesap-islevsel-zemin-02` | `var(--color-red-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1406](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1406) |
| `--tema-yerel-hesap-islevsel-cizgi-02` | `var(--color-red-100)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1407](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1407) |
| `--tema-yerel-hesap-islevsel-metin-02` | `#16a34a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1408](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1408) |
| `--tema-yerel-hesap-islevsel-metin-03` | `#bc2d0d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1409](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1409) |
| `--tema-yerel-uretim-kart-01` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1410](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1410) |
| `--tema-yerel-uretim-islevsel-metin-01` | `#16a34a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1411](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1411) |
| `--tema-yerel-uretim-islevsel-metin-02` | `#6b7280` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1412](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1412) |
| `--tema-yerel-ortak-sayfa-islevsel-metin-01` | `#2f7fc7` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1413](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1413) |
| `--tema-yerel-ortak-sayfa-islevsel-metin-02` | `#167453` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1414](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1414) |
| `--tema-yerel-ortak-sayfa-islevsel-metin-03` | `#9a6700` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1415](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1415) |
| `--tema-yerel-ortak-sayfa-islevsel-metin-04` | `#bc2d0d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1416](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1416) |
| `--tema-yerel-ortak-sayfa-islevsel-cizgi-01` | `#f4d89a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1417](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1417) |
| `--tema-yerel-ortak-sayfa-islevsel-zemin-01` | `#fffbeb` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1418](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1418) |
| `--tema-yerel-ortak-sayfa-islevsel-metin-05` | `#8a5a12` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1419](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1419) |
| `--tema-yerel-ortak-sayfa-islevsel-metin-06` | `#65400c` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1420](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1420) |
| `--tema-yerel-ortak-sayfa-kart-01` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1421](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1421) |
| `--tema-yerel-ortak-sayfa-ortu-01` | `var(--color-black)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1422](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1422) |
| `--tema-yerel-ortak-sayfa-islevsel-zemin-02` | `#eef6ff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1423](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1423) |
| `--tema-yerel-ortak-sayfa-islevsel-zemin-03` | `#ecfdf5` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1424](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1424) |
| `--tema-yerel-ortak-sayfa-islevsel-metin-07` | `#476b96` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1425](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1425) |
| `--tema-yerel-ortak-sayfa-islevsel-zemin-04` | `#eef5fd` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1426](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1426) |
| `--tema-yerel-ortak-sayfa-islevsel-zemin-05` | `#fce8e3` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1427](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1427) |
| `--tema-yerel-ortak-sayfa-islevsel-zemin-06` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1428](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1428) |
| `--tema-yerel-ortak-sayfa-ters-metin-01` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1429](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1429) |
| `--tema-yerel-ortak-sayfa-islevsel-zemin-07` | `#f7f9fc` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1430](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1430) |
| `--tema-yerel-ortak-sayfa-islevsel-metin-08` | `#7d8fa5` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1431](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1431) |
| `--tema-yerel-ortak-sayfa-islevsel-metin-09` | `#237ac8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1432](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1432) |
| `--tema-yerel-ortak-sayfa-islevsel-zemin-08` | `#edf6fd` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1433](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1433) |
| `--tema-yerel-ortak-sayfa-islevsel-metin-10` | `#16a34a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1434](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1434) |
| `--tema-yerel-ortak-sayfa-islevsel-zemin-09` | `#f0fdf4` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1435](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1435) |
| `--tema-yerel-ortak-sayfa-islevsel-metin-11` | `#a33f32` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1436](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1436) |
| `--tema-yerel-ortak-sayfa-islevsel-zemin-10` | `#fff1f0` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1437](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1437) |
| `--tema-yerel-ortak-sayfa-golge-02` | `rgba(0,0,0,0.06)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1438](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1438) |
| `--tema-yerel-hesap-cizgi-07` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1439](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1439) |
| `--tema-yerel-hesap-ters-metin-02` | `white` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1440](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1440) |
| `--tema-yerel-hesap-islevsel-zemin-03` | `rgba(188,45,13,0.08)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1441](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1441) |
| `--tema-yerel-hesap-islevsel-cizgi-03` | `rgba(188,45,13,0.25)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1442](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1442) |
| `--tema-yerel-rapor-islevsel-metin-01` | `#208a66` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1443](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1443) |
| `--tema-yerel-rapor-islevsel-metin-02` | `#d45c4b` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1444](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1444) |
| `--tema-yerel-rapor-kart-01` | `rgba(255, 255, 255, 0.88)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1445](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1445) |
| `--tema-yerel-rapor-kart-02` | `#fff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1446](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1446) |
| `--tema-yerel-rapor-kart-03` | `rgba(255, 255, 255, 0.78)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1447](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1447) |
| `--tema-yerel-rapor-islevsel-zemin-01` | `#eff9f5` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1448](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1448) |
| `--tema-yerel-rapor-islevsel-metin-03` | `#c58118` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1449](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1449) |
| `--tema-yerel-rapor-islevsel-zemin-02` | `#fff7e8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1450](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1450) |
| `--tema-yerel-rapor-islevsel-zemin-03` | `#fff3f0` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1451](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1451) |
| `--tema-yerel-rapor-ters-metin-01` | `#fff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1452](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1452) |
| `--tema-yerel-rapor-islevsel-zemin-04` | `#eaf8f2` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1453](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1453) |
| `--tema-yerel-rapor-islevsel-metin-04` | `#b87513` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1454](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1454) |
| `--tema-yerel-rapor-islevsel-zemin-05` | `#fff3d8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1455](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1455) |
| `--tema-yerel-rapor-islevsel-metin-05` | `#c94f40` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1456](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1456) |
| `--tema-yerel-rapor-islevsel-zemin-06` | `#ffece8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1457](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1457) |
| `--tema-yerel-rapor-islevsel-metin-06` | `#16865f` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1458](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1458) |
| `--tema-yerel-rapor-islevsel-metin-07` | `#d44b40` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1459](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1459) |
| `--tema-yerel-rapor-islevsel-cizgi-01` | `var(--color-red-100)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1460](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1460) |
| `--tema-yerel-rapor-islevsel-zemin-07` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1461](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1461) |
| `--tema-yerel-rapor-islevsel-metin-08` | `#a43737` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1462](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1462) |
| `--tema-yerel-rapor-islevsel-metin-09` | `#7d8ba0` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1463](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1463) |
| `--tema-yerel-rapor-ters-metin-02` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1464](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1464) |
| `--tema-yerel-rapor-islevsel-metin-10` | `#1D9E75` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1465](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1465) |
| `--tema-yerel-rapor-islevsel-metin-11` | `#D44B40` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1466](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1466) |
| `--tema-yerel-rapor-islevsel-cizgi-02` | `var(--color-amber-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1467](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1467) |
| `--tema-yerel-rapor-islevsel-zemin-08` | `var(--color-amber-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1468](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1468) |
| `--tema-yerel-rapor-islevsel-metin-12` | `var(--color-amber-800)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1469](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1469) |
| `--tema-yerel-rapor-islevsel-cizgi-03` | `var(--color-blue-100)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1470](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1470) |
| `--tema-yerel-rapor-islevsel-zemin-09` | `var(--color-blue-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1471](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1471) |
| `--tema-yerel-rapor-islevsel-metin-13` | `var(--color-blue-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1472](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1472) |
| `--tema-yerel-rapor-kart-04` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1473](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1473) |
| `--tema-yerel-rapor-kart-05` | `rgba(255, 255, 255, .84)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1474](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1474) |
| `--tema-yerel-rapor-kart-06` | `rgba(255, 255, 255, .95)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1475](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1475) |
| `--tema-yerel-rapor-islevsel-zemin-10` | `#fff1ee` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1476](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1476) |
| `--tema-yerel-rapor-islevsel-zemin-11` | `#edf9f4` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1477](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1477) |
| `--tema-yerel-rapor-islevsel-cizgi-04` | `#dcefe7` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1478](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1478) |
| `--tema-yerel-rapor-islevsel-zemin-12` | `#f3f0ff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1479](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1479) |
| `--tema-yerel-rapor-islevsel-cizgi-05` | `#e8e1ff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1480](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1480) |
| `--tema-yerel-rapor-islevsel-zemin-13` | `#fff8e9` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1481](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1481) |
| `--tema-yerel-rapor-islevsel-cizgi-06` | `#f6ead0` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1482](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1482) |
| `--tema-yerel-rapor-kart-07` | `rgba(255, 255, 255, 0.86)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1483](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1483) |
| `--tema-yerel-rapor-islevsel-metin-14` | `#7c5ce7` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1484](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1484) |
| `--tema-yerel-rapor-islevsel-metin-15` | `#2f8ed8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1485](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1485) |
| `--tema-yerel-rapor-islevsel-metin-16` | `#6f6bdc` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1486](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1486) |
| `--tema-yerel-rapor-islevsel-metin-17` | `#0284c7` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1487](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1487) |
| `--tema-yerel-rapor-islevsel-metin-18` | `#24a274` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1488](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1488) |
| `--tema-yerel-rapor-islevsel-metin-19` | `#d58a24` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1489](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1489) |
| `--tema-yerel-rapor-islevsel-metin-20` | `#d95f59` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1490](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1490) |
| `--tema-yerel-rapor-islevsel-zemin-14` | `#e8f3fc` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1491](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1491) |
| `--tema-yerel-rapor-islevsel-metin-21` | `#237ac8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1492](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1492) |
| `--tema-yerel-rapor-islevsel-zemin-15` | `#f0edff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1493](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1493) |
| `--tema-yerel-rapor-islevsel-zemin-16` | `#e8f7f1` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1494](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1494) |
| `--tema-yerel-rapor-islevsel-zemin-17` | `#fff2df` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1495](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1495) |
| `--tema-yerel-rapor-islevsel-metin-22` | `#c87412` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1496](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1496) |
| `--tema-yerel-rapor-islevsel-cizgi-07` | `var(--color-red-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1497](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1497) |
| `--tema-yerel-rapor-islevsel-metin-23` | `var(--color-red-600)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1498](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1498) |
| `--tema-yerel-rapor-islevsel-zemin-18` | `#fdf2f2` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1499](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1499) |
| `--tema-yerel-rapor-islevsel-metin-24` | `#e02424` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1500](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1500) |
| `--tema-yerel-rapor-islevsel-zemin-19` | `#f5f3ff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1501](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1501) |
| `--tema-yerel-rapor-islevsel-metin-25` | `#7c3aed` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1502](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1502) |
| `--tema-yerel-rapor-islevsel-zemin-20` | `#f0fdf4` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1503](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1503) |
| `--tema-yerel-rapor-islevsel-zemin-21` | `#fef2f2` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1504](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1504) |
| `--tema-yerel-rapor-islevsel-metin-26` | `#c85252` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1505](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1505) |
| `--tema-yerel-rapor-kart-08` | `rgba(255,255,255,.84)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1506](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1506) |
| `--tema-yerel-rapor-kart-09` | `rgba(255,255,255,.96)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1507](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1507) |
| `--tema-yerel-rapor-islevsel-metin-27` | `#20a776` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1508](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1508) |
| `--tema-yerel-rapor-islevsel-metin-28` | `#15956a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1509](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1509) |
| `--tema-yerel-rapor-islevsel-zemin-22` | `#fff2ef` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1510](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1510) |
| `--tema-yerel-rapor-islevsel-metin-29` | `#df5e4d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1511](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1511) |
| `--tema-yerel-rapor-islevsel-metin-30` | `#7b69dc` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1512](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1512) |
| `--tema-yerel-rapor-islevsel-metin-31` | `#25a875` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1513](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1513) |
| `--tema-yerel-rapor-islevsel-metin-32` | `#e69624` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1514](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1514) |
| `--tema-yerel-rapor-islevsel-zemin-23` | `#fff6e8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1515](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1515) |
| `--tema-yerel-rapor-kart-10` | `rgba(255,255,255,.72)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1516](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1516) |
| `--tema-yerel-rapor-kart-11` | `rgba(255,255,255,.75)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1517](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1517) |
| `--tema-yerel-rapor-kart-12` | `rgba(255,255,255,.62)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1518](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1518) |
| `--tema-yerel-rapor-kart-13` | `rgba(255,255,255,.68)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1519](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1519) |
| `--tema-yerel-rapor-islevsel-metin-33` | `#1e9b70` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1520](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1520) |
| `--tema-yerel-rapor-islevsel-metin-34` | `#dd6555` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1521](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1521) |
| `--tema-yerel-rapor-islevsel-cizgi-08` | `#f2e4bf` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1522](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1522) |
| `--tema-yerel-rapor-islevsel-metin-35` | `#eea11f` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1523](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1523) |
| `--tema-yerel-magaza-kart-01` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1524](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1524) |
| `--tema-yerel-magaza-ters-metin-01` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1525](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1525) |
| `--tema-yerel-magaza-islevsel-zemin-01` | `#b42318` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1526](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1526) |
| `--tema-yerel-magaza-islevsel-zemin-02` | `#fef3c7` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1527](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1527) |
| `--tema-yerel-magaza-islevsel-metin-01` | `#92400e` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1528](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1528) |
| `--tema-yerel-magaza-islevsel-zemin-03` | `#ecfdf3` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1529](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1529) |
| `--tema-yerel-magaza-islevsel-metin-02` | `#027a48` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1530](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1530) |
| `--tema-yerel-magaza-islevsel-metin-03` | `#16865f` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1531](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1531) |
| `--tema-yerel-magaza-islevsel-cizgi-01` | `#fde68a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1532](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1532) |
| `--tema-yerel-magaza-islevsel-metin-04` | `#b42318` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1533](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1533) |
| `--tema-yerel-magaza-islevsel-cizgi-02` | `#fed7aa` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1534](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1534) |
| `--tema-yerel-magaza-islevsel-zemin-04` | `#fffaf5` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1535](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1535) |
| `--tema-yerel-magaza-islevsel-metin-05` | `#9a3412` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1536](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1536) |
| `--tema-yerel-magaza-islevsel-metin-06` | `#c2410c` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1537](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1537) |
| `--tema-yerel-magaza-islevsel-metin-07` | `#7c2d12` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1538](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1538) |
| `--tema-yerel-magaza-islevsel-zemin-05` | `#fee4e2` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1539](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1539) |
| `--tema-yerel-magaza-ortu-01` | `var(--color-black)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1540](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1540) |
| `--tema-yerel-magaza-islevsel-cizgi-03` | `#a3d3be` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1541](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1541) |
| `--tema-yerel-magaza-islevsel-odak-01` | `#e2f5ec` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1542](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1542) |
| `--tema-yerel-magaza-islevsel-cizgi-04` | `#fbd5d5` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1543](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1543) |
| `--tema-yerel-magaza-islevsel-zemin-06` | `#fff5f5` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1544](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1544) |
| `--tema-yerel-magaza-islevsel-zemin-07` | `#fee2e2` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1545](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1545) |
| `--tema-yerel-magaza-islevsel-cizgi-05` | `#dce5ee` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1546](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1546) |
| `--tema-yerel-magaza-islevsel-zemin-08` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1547](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1547) |
| `--tema-yerel-magaza-islevsel-metin-08` | `#5f738c` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1548](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1548) |
| `--tema-yerel-magaza-islevsel-zemin-09` | `#f8fafc` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1549](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1549) |
| `--tema-yerel-magaza-islevsel-metin-09` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1550](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1550) |
| `--tema-yerel-magaza-islevsel-zemin-10` | `#991b1b` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1551](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1551) |
| `--tema-yerel-magaza-islevsel-cizgi-06` | `#a6f4c5` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1552](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1552) |
| `--tema-yerel-magaza-islevsel-golge-01` | `rgba(18,183,106,0.06)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1553](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1553) |
| `--tema-yerel-magaza-islevsel-zemin-11` | `#d1fadf` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1554](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1554) |
| `--tema-yerel-magaza-islevsel-zemin-12` | `#12b76a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1555](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1555) |
| `--tema-yerel-magaza-islevsel-metin-10` | `#05603a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1556](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1556) |
| `--tema-yerel-magaza-islevsel-golge-02` | `rgba(249,115,22,0.05)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1557](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1557) |
| `--tema-yerel-magaza-islevsel-zemin-13` | `#ffedd5` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1558](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1558) |
| `--tema-yerel-magaza-islevsel-zemin-14` | `#f97316` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1559](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1559) |
| `--tema-yerel-magaza-islevsel-zemin-15` | `#edf9f4` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1560](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1560) |
| `--tema-yerel-magaza-islevsel-metin-11` | `#6550b9` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1561](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1561) |
| `--tema-yerel-magaza-islevsel-zemin-16` | `#f2effc` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1562](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1562) |
| `--tema-yerel-magaza-islevsel-metin-12` | `#b7791f` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1563](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1563) |
| `--tema-yerel-magaza-islevsel-zemin-17` | `#fff7e8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1564](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1564) |
| `--tema-yerel-magaza-islevsel-metin-13` | `#8c6014` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1565](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1565) |
| `--tema-yerel-magaza-islevsel-zemin-18` | `#16865f` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1566](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1566) |
| `--tema-yerel-magaza-islevsel-zemin-19` | `#126f4f` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1567](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1567) |
| `--tema-yerel-lig-islevsel-cizgi-03` | `var(--color-red-100)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1568](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1568) |
| `--tema-yerel-lig-islevsel-metin-05` | `#a43737` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1569](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1569) |
| `--tema-yerel-lig-ters-metin-01` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1570](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1570) |
| `--tema-yerel-lig-islevsel-zemin-05` | `#f8fbff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1571](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1571) |
| `--tema-yerel-lig-islevsel-zemin-06` | `#f6f8fb` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1572](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1572) |
| `--tema-yerel-lig-islevsel-zemin-07` | `#fbfcfe` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1573](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1573) |
| `--tema-yerel-lig-islevsel-cizgi-04` | `var(--color-amber-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1574](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1574) |
| `--tema-yerel-lig-islevsel-zemin-08` | `var(--color-amber-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1575](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1575) |
| `--tema-yerel-lig-islevsel-metin-06` | `var(--color-amber-800)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1576](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1576) |
| `--tema-yerel-lig-islevsel-cizgi-05` | `var(--color-blue-100)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1577](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1577) |
| `--tema-yerel-lig-islevsel-zemin-09` | `var(--color-blue-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1578](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1578) |
| `--tema-yerel-lig-islevsel-metin-07` | `var(--color-blue-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1579](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1579) |
| `--tema-yerel-uretim-kart-02` | `#ffffff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1580](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1580) |
| `--tema-yerel-uretim-islevsel-zemin-01` | `#fffbeb` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1581](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1581) |
| `--tema-yerel-uretim-islevsel-metin-03` | `#b45309` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1582](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1582) |
| `--tema-yerel-uretim-islevsel-cizgi-01` | `#fde68a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1583](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1583) |
| `--tema-yerel-uretim-islevsel-zemin-02` | `#f0fdf4` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1584](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1584) |
| `--tema-yerel-uretim-islevsel-metin-04` | `#15803d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1585](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1585) |
| `--tema-yerel-uretim-islevsel-cizgi-02` | `#bbf7d0` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1586](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1586) |
| `--tema-yerel-uretim-islevsel-zemin-03` | `var(--color-red-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1587](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1587) |
| `--tema-yerel-uretim-islevsel-cizgi-03` | `var(--color-red-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1588](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1588) |
| `--tema-yerel-uretim-islevsel-metin-05` | `var(--color-red-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1589](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1589) |
| `--tema-yerel-uretim-islevsel-cizgi-04` | `var(--color-yellow-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1590](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1590) |
| `--tema-yerel-uretim-islevsel-cizgi-05` | `var(--color-yellow-400)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1591](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1591) |
| `--tema-yerel-uretim-islevsel-cizgi-06` | `var(--color-amber-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1592](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1592) |
| `--tema-yerel-uretim-islevsel-zemin-04` | `var(--color-amber-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1593](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1593) |
| `--tema-yerel-uretim-islevsel-metin-06` | `var(--color-amber-900)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1594](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1594) |
| `--tema-yerel-uretim-islevsel-metin-07` | `var(--color-amber-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1595](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1595) |
| `--tema-yerel-uretim-islevsel-zemin-05` | `var(--color-amber-500)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1596](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1596) |
| `--tema-yerel-uretim-ters-metin-01` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1597](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1597) |
| `--tema-yerel-uretim-islevsel-zemin-06` | `var(--color-green-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1598](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1598) |
| `--tema-yerel-uretim-islevsel-cizgi-07` | `#fecaca` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1599](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1599) |
| `--tema-yerel-uretim-islevsel-cizgi-08` | `#dfe8f3` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1600](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1600) |
| `--tema-yerel-uretim-islevsel-zemin-07` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1601](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1601) |
| `--tema-yerel-uretim-islevsel-cizgi-09` | `#56aeff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1602](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1602) |
| `--tema-yerel-uretim-islevsel-zemin-08` | `#f6faff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1603](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1603) |
| `--tema-yerel-uretim-islevsel-metin-08` | `#bc2d0d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1604](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1604) |
| `--tema-yerel-uretim-islevsel-zemin-09` | `#fef2f2` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1605](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1605) |
| `--tema-yerel-uretim-islevsel-cizgi-10` | `#fed7cc` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1606](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1606) |
| `--tema-yerel-uretim-islevsel-zemin-10` | `#e05a3f` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1607](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1607) |
| `--tema-yerel-uretim-islevsel-golge-01` | `#e05a3f` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1608](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1608) |
| `--tema-yerel-uretim-islevsel-metin-09` | `var(--color-red-500)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1609](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1609) |
| `--tema-yerel-uretim-islevsel-cizgi-11` | `var(--color-gray-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1610](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1610) |
| `--tema-yerel-uretim-islevsel-zemin-11` | `var(--color-gray-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1611](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1611) |
| `--tema-yerel-uretim-islevsel-metin-10` | `var(--color-gray-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1612](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1612) |
| `--tema-yerel-uretim-islevsel-metin-11` | `var(--color-gray-400)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1613](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1613) |
| `--tema-yerel-uretim-islevsel-metin-12` | `var(--color-gray-600)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1614](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1614) |
| `--tema-yerel-uretim-islevsel-cizgi-12` | `var(--color-emerald-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1615](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1615) |
| `--tema-yerel-uretim-islevsel-zemin-12` | `var(--color-emerald-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1616](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1616) |
| `--tema-yerel-uretim-islevsel-metin-13` | `var(--color-emerald-800)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1617](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1617) |
| `--tema-yerel-uretim-islevsel-metin-14` | `var(--color-emerald-600)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1618](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1618) |
| `--tema-yerel-uretim-islevsel-metin-15` | `#e53e3e` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1619](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1619) |
| `--tema-yerel-uretim-islevsel-metin-16` | `var(--color-emerald-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1620](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1620) |
| `--tema-yerel-uretim-islevsel-zemin-13` | `var(--color-green-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1621](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1621) |
| `--tema-yerel-uretim-islevsel-metin-17` | `var(--color-green-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1622](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1622) |
| `--tema-yerel-uretim-islevsel-cizgi-13` | `var(--color-green-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1623](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1623) |
| `--tema-yerel-uretim-islevsel-metin-18` | `var(--color-red-600)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1624](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1624) |
| `--tema-yerel-uretim-islevsel-metin-19` | `var(--color-green-800)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1625](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1625) |
| `--tema-yerel-uretim-islevsel-cizgi-14` | `var(--color-amber-500)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1626](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1626) |
| `--tema-yerel-uretim-islevsel-metin-20` | `var(--color-emerald-900)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1627](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1627) |
| `--tema-yerel-uretim-islevsel-metin-21` | `var(--color-red-800)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1628](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1628) |
| `--tema-yerel-uretim-ortu-01` | `var(--color-black)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1629](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1629) |
| `--tema-yerel-uretim-islevsel-zemin-14` | `#eff6ff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1630](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1630) |
| `--tema-yerel-uretim-islevsel-zemin-15` | `#fff7ed` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1631](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1631) |
| `--tema-yerel-uretim-islevsel-zemin-16` | `#f5f3ff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1632](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1632) |
| `--tema-yerel-uretim-islevsel-zemin-17` | `#ecfdf5` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1633](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1633) |
| `--tema-yerel-uretim-islevsel-zemin-18` | `#fff1f0` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1634](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1634) |
| `--tema-yerel-uretim-islevsel-zemin-19` | `#16a34a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1635](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1635) |
| `--tema-yerel-uretim-islevsel-cizgi-15` | `#16a34a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1636](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1636) |
| `--tema-yerel-uretim-islevsel-zemin-20` | `#fff7f5` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1637](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1637) |
| `--tema-yerel-uretim-islevsel-cizgi-16` | `#efb7aa` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1638](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1638) |
| `--tema-yerel-uretim-islevsel-cizgi-17` | `#dce9e2` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1639](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1639) |
| `--tema-yerel-uretim-islevsel-zemin-21` | `#f7fff9` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1640](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1640) |
| `--tema-yerel-uretim-islevsel-zemin-22` | `#fffafa` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1641](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1641) |
| `--tema-yerel-uretim-islevsel-cizgi-18` | `#f2ded9` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1642](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1642) |
| `--tema-yerel-uretim-ters-metin-02` | `white` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1643](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1643) |
| `--tema-yerel-uretim-islevsel-metin-22` | `#c85e49` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1644](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1644) |
| `--tema-yerel-uretim-islevsel-zemin-23` | `#bbf7d0` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1645](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1645) |
| `--tema-yerel-uretim-islevsel-metin-23` | `#a84f3f` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1646](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1646) |
| `--tema-yerel-uretim-islevsel-metin-24` | `#9ca3af` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1647](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1647) |
| `--tema-yerel-uretim-kart-03` | `#fff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1648](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1648) |
| `--tema-yerel-uretim-islevsel-metin-25` | `var(--color-amber-800)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1649](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1649) |
| `--tema-yerel-uretim-islevsel-metin-26` | `var(--color-gray-500)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1650](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1650) |
| `--tema-yerel-uretim-islevsel-metin-27` | `#92400e` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1651](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1651) |
| `--tema-yerel-uretim-islevsel-metin-28` | `#d97706` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1652](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1652) |
| `--tema-yerel-uretim-islevsel-cizgi-19` | `#a7f3d0` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1653](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1653) |
| `--tema-yerel-uretim-islevsel-cizgi-20` | `#10b981` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1654](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1654) |
| `--tema-yerel-uretim-islevsel-metin-29` | `#065f46` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1655](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1655) |
| `--tema-yerel-uretim-islevsel-zemin-24` | `#a7f3d0` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1656](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1656) |
| `--tema-yerel-uretim-islevsel-zemin-25` | `var(--color-red-100)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1657](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1657) |
| `--tema-yerel-uretim-islevsel-metin-30` | `var(--color-slate-800)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1658](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1658) |
| `--tema-yerel-uretim-islevsel-cizgi-21` | `var(--color-purple-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1659](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1659) |
| `--tema-yerel-uretim-islevsel-zemin-26` | `var(--color-purple-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1660](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1660) |
| `--tema-yerel-uretim-islevsel-metin-31` | `var(--color-purple-900)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1661](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1661) |
| `--tema-yerel-uretim-islevsel-metin-32` | `var(--color-purple-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1662](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1662) |
| `--tema-yerel-uretim-islevsel-cizgi-22` | `var(--color-purple-300)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1663](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1663) |
| `--tema-yerel-uretim-ortu-02` | `rgba(0,0,0,0.4)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1664](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1664) |
| `--tema-yerel-uretim-islevsel-zemin-27` | `var(--color-red-600)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1665](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1665) |
| `--tema-yerel-uretim-islevsel-metin-33` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1666](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1666) |
| `--tema-yerel-uretim-islevsel-cizgi-23` | `#e5e7eb` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1667](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1667) |
| `--tema-yerel-uretim-islevsel-metin-34` | `#56aeff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1668](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1668) |
| `--tema-yerel-uretim-islevsel-metin-35` | `#737373` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1669](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1669) |
| `--tema-yerel-uretim-islevsel-zemin-28` | `#e6f1fb` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1670](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1670) |
| `--tema-yerel-uretim-islevsel-zemin-29` | `white` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1671](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1671) |
| `--tema-yerel-uretim-ortu-03` | `rgba(0,0,0,0.55)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1672](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1672) |
| `--tema-yerel-uretim-islevsel-metin-36` | `#c2410c` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1673](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1673) |
| `--tema-yerel-uretim-islevsel-metin-37` | `#167453` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1674](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1674) |
| `--tema-yerel-uretim-islevsel-metin-38` | `#a33f32` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1675](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1675) |
| `--tema-yerel-uretim-cizgi-48` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1676](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1676) |
| `--tema-yerel-uretim-islevsel-metin-39` | `#b91c1c` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1677](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1677) |
| `--tema-yerel-uretim-kart-04` | `white` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1678](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1678) |
| `--tema-yerel-yonetim-kart-01` | `white` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1679](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1679) |
| `--tema-yerel-yonetim-ters-metin-01` | `white` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1680](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1680) |
| `--tema-yerel-yonetim-islevsel-zemin-01` | `#fef2f2` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1681](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1681) |
| `--tema-yerel-yonetim-islevsel-zemin-02` | `#fffbeb` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1682](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1682) |
| `--tema-yerel-yonetim-islevsel-cizgi-01` | `#fcd34d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1683](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1683) |
| `--tema-yerel-yonetim-islevsel-metin-01` | `#92400e` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1684](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1684) |
| `--tema-yerel-yonetim-islevsel-metin-02` | `#10b981` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1685](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1685) |
| `--tema-yerel-yonetim-islevsel-metin-03` | `#7c3aed` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1686](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1686) |
| `--tema-yerel-yonetim-islevsel-metin-04` | `#ea580c` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1687](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1687) |
| `--tema-yerel-yonetim-islevsel-metin-05` | `#b45309` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1688](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1688) |
| `--tema-yerel-yonetim-islevsel-cizgi-02` | `#fecaca` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1689](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1689) |
| `--tema-yerel-yonetim-islevsel-metin-06` | `#bc2d0d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1690](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1690) |
| `--tema-yerel-yonetim-kart-02` | `#ffffff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1691](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1691) |
| `--tema-yerel-yonetim-ortu-01` | `rgba(0,0,0,0.45)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1692](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1692) |
| `--tema-yerel-yonetim-golge-01` | `rgba(0,0,0,0.25)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1693](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1693) |
| `--tema-yerel-yonetim-islevsel-metin-07` | `#16a34a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1694](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1694) |
| `--tema-yerel-yonetim-islevsel-cizgi-03` | `#fca5a5` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1695](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1695) |
| `--tema-yerel-yonetim-islevsel-metin-08` | `white` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1696](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1696) |
| `--tema-yerel-yonetim-ortu-02` | `rgba(0,0,0,0.35)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1697](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1697) |
| `--tema-yerel-yonetim-islevsel-zemin-03` | `#f59e0b` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1698](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1698) |
| `--tema-yerel-yonetim-islevsel-zemin-04` | `#dc2626` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1699](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1699) |
| `--tema-yerel-yonetim-islevsel-zemin-05` | `#dcfce7` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1700](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1700) |
| `--tema-yerel-yonetim-islevsel-zemin-06` | `#fee2e2` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1701](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1701) |
| `--tema-yerel-yonetim-islevsel-metin-09` | `#dc2626` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1702](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1702) |
| `--tema-yerel-yonetim-islevsel-zemin-07` | `#f0fdf4` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1703](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1703) |
| `--tema-yerel-yonetim-islevsel-metin-10` | `#166534` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1704](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1704) |
| `--tema-yerel-yonetim-islevsel-cizgi-04` | `#bbf7d0` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1705](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1705) |
| `--tema-yerel-yonetim-islevsel-zemin-08` | `#16a34a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1706](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1706) |
| `--tema-yerel-yonetim-islevsel-metin-11` | `#854d0e` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1707](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1707) |
| `--tema-yerel-yonetim-islevsel-cizgi-05` | `#fef08a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1708](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1708) |
| `--tema-yerel-yonetim-islevsel-zemin-09` | `#ca8a04` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1709](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1709) |
| `--tema-yerel-yonetim-golge-02` | `rgba(0,0,0,0.03)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1710](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1710) |
| `--tema-yerel-yonetim-islevsel-zemin-10` | `#fef3c7` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1711](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1711) |
| `--tema-yerel-yonetim-islevsel-cizgi-06` | `#fde68a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1712](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1712) |
| `--tema-yerel-yonetim-islevsel-metin-12` | `#991b1b` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1713](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1713) |
| `--tema-yerel-yonetim-kart-03` | `#fff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1714](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1714) |
| `--tema-yerel-yonetim-islevsel-metin-13` | `#0f766e` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1715](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1715) |
| `--tema-yerel-yonetim-islevsel-metin-14` | `#d97706` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1716](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1716) |
| `--tema-yerel-yonetim-islevsel-zemin-11` | `white` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1717](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1717) |
| `--tema-yerel-yonetim-islevsel-zemin-12` | `#d1d5db` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1718](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1718) |
| `--tema-yerel-yonetim-islevsel-metin-15` | `#b91c1c` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1719](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1719) |
| `--tema-yerel-yonetim-islevsel-metin-16` | `#7f1d1d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1720](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1720) |
| `--tema-yerel-yonetim-kart-04` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1721](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1721) |
| `--tema-yerel-yonetim-islevsel-cizgi-07` | `var(--color-green-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1722](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1722) |
| `--tema-yerel-yonetim-islevsel-zemin-13` | `var(--color-green-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1723](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1723) |
| `--tema-yerel-yonetim-islevsel-metin-17` | `var(--color-green-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1724](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1724) |
| `--tema-yerel-yonetim-ters-metin-02` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1725](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1725) |
| `--tema-yerel-yonetim-islevsel-zemin-14` | `#15803d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1726](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1726) |
| `--tema-yerel-yonetim-ters-metin-03` | `#fff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1727](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1727) |
| `--tema-yerel-yonetim-islevsel-metin-18` | `#047857` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1728](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1728) |
| `--tema-yerel-yonetim-islevsel-cizgi-08` | `#86efac` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1729](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1729) |
| `--tema-yerel-yonetim-islevsel-metin-19` | `#15803d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1730](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1730) |
| `--tema-yerel-yonetim-islevsel-cizgi-09` | `var(--color-red-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1731](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1731) |
| `--tema-yerel-yonetim-islevsel-zemin-15` | `var(--color-red-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1732](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1732) |
| `--tema-yerel-yonetim-islevsel-metin-20` | `var(--color-red-900)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1733](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1733) |
| `--tema-yerel-yonetim-islevsel-metin-21` | `var(--color-red-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1734](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1734) |
| `--tema-yerel-yonetim-islevsel-cizgi-10` | `var(--color-red-100)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1735](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1735) |
| `--tema-yerel-yonetim-islevsel-metin-22` | `var(--color-green-800)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1736](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1736) |
| `--tema-yerel-yonetim-islevsel-metin-23` | `var(--color-red-800)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1737](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1737) |
| `--tema-yerel-yonetim-islevsel-cizgi-11` | `var(--color-red-400)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1738](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1738) |
| `--tema-yerel-yonetim-islevsel-zemin-16` | `var(--color-red-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1739](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1739) |
| `--tema-yerel-yonetim-islevsel-zemin-17` | `var(--color-green-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1740](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1740) |
| `--tema-yerel-yonetim-islevsel-metin-24` | `#6b7280` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1741](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1741) |
| `--tema-yerel-yonetim-islevsel-zemin-18` | `#9f260b` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1742](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1742) |
| `--tema-yerel-yonetim-islevsel-cizgi-12` | `var(--color-gray-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1743](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1743) |
| `--tema-yerel-yonetim-islevsel-zemin-19` | `var(--color-gray-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1744](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1744) |
| `--tema-yerel-yonetim-islevsel-metin-25` | `var(--color-gray-600)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1745](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1745) |
| `--tema-yerel-yonetim-ortu-03` | `var(--color-black)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1746](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1746) |
| `--tema-yerel-yonetim-golge-03` | `rgba(0,0,0,.18)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1747](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1747) |
| `--tema-yerel-yonetim-ortu-04` | `rgba(0,0,0,0.5)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1748](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1748) |
| `--tema-yerel-yonetim-islevsel-cizgi-13` | `#e5e7eb` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1749](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1749) |
| `--tema-yerel-yonetim-islevsel-metin-26` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1750](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1750) |
| `--tema-yerel-giris-kart-01` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1751](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1751) |
| `--tema-yerel-eczanem-islevsel-cizgi-12` | `var(--color-amber-300)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1752](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1752) |
| `--tema-yerel-eczanem-islevsel-zemin-25` | `var(--color-amber-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1753](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1753) |
| `--tema-yerel-eczanem-islevsel-metin-25` | `var(--color-amber-900)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1754](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1754) |
| `--tema-yerel-eczanem-islevsel-zemin-26` | `var(--color-amber-100)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1755](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1755) |
| `--tema-yerel-eczanem-islevsel-cizgi-13` | `var(--color-emerald-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1756](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1756) |
| `--tema-yerel-eczanem-islevsel-zemin-27` | `var(--color-emerald-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1757](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1757) |
| `--tema-yerel-eczanem-islevsel-metin-26` | `var(--color-emerald-900)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1758](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1758) |
| `--tema-yerel-eczanem-islevsel-metin-27` | `var(--color-emerald-800)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1759](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1759) |
| `--tema-yerel-eczanem-islevsel-zemin-28` | `var(--color-emerald-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1760](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1760) |
| `--tema-yerel-eczanem-islevsel-zemin-29` | `var(--color-emerald-800)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1761](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1761) |
| `--tema-yerel-eczanem-ortu-01` | `var(--color-black)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1762](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1762) |
| `--tema-yerel-eczanem-islevsel-cizgi-14` | `var(--color-amber-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1763](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1763) |
| `--tema-yerel-eczanem-islevsel-zemin-30` | `var(--color-red-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1764](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1764) |
| `--tema-yerel-eczanem-islevsel-zemin-31` | `var(--color-red-800)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1765](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1765) |
| `--tema-yerel-eczanem-islevsel-zemin-32` | `#fef2f2` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1766](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1766) |
| `--tema-yerel-eczanem-ortu-02` | `rgba(0,0,0,0.04)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1767](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1767) |
| `--tema-yerel-eczanem-golge-04` | `rgba(0,0,0,0.08)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1768](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1768) |
| `--tema-yerel-eczanem-kart-02` | `rgba(255,255,255,0.85)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1769](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1769) |
| `--tema-yerel-eczanem-islevsel-metin-28` | `#bc2d0d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1770](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1770) |
| `--tema-yerel-eczanem-ortu-03` | `rgba(0,0,0,0.45)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1771](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1771) |
| `--tema-yerel-eczanem-kart-03` | `#ffffff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1772](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1772) |
| `--tema-yerel-eczanem-golge-05` | `rgba(0,0,0,0.15)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1773](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1773) |
| `--tema-yerel-eczanem-islevsel-metin-29` | `#8250df` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1774](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1774) |
| `--tema-yerel-eczanem-islevsel-metin-30` | `#1a7f37` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1775](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1775) |
| `--tema-yerel-eczanem-islevsel-metin-31` | `#cf222e` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1776](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1776) |
| `--tema-yerel-eczanem-islevsel-odak-01` | `#fecaca` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1777](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1777) |
| `--tema-yerel-eczanem-islevsel-cizgi-16` | `#efd59f` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1778](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1778) |
| `--tema-yerel-eczanem-islevsel-metin-32` | `#956417` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1779](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1779) |
| `--tema-yerel-eczanem-islevsel-metin-33` | `#a57427` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1780](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1780) |
| `--tema-yerel-eczanem-islevsel-cizgi-17` | `#f0d1d1` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1781](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1781) |
| `--tema-yerel-eczanem-islevsel-metin-34` | `#7358c7` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1782](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1782) |
| `--tema-yerel-eczanem-islevsel-cizgi-18` | `#ded7f5` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1783](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1783) |
| `--tema-yerel-eczanem-islevsel-zemin-34` | `#f5f2ff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1784](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1784) |
| `--tema-yerel-eczanem-islevsel-metin-35` | `#6b55b7` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1785](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1785) |
| `--tema-yerel-eczanem-islevsel-cizgi-19` | `#f3d4d4` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1786](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1786) |
| `--tema-yerel-eczanem-islevsel-zemin-35` | `#f1eefc` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1787](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1787) |
| `--tema-yerel-eczanem-islevsel-metin-36` | `#7057be` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1788](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1788) |
| `--tema-yerel-eczanem-islevsel-metin-37` | `#654db0` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1789](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1789) |
| `--tema-yerel-eczanem-cizgi-35` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1790](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1790) |
| `--tema-yerel-eczanem-islevsel-zemin-36` | `#166534` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1791](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1791) |
| `--tema-yerel-eczanem-islevsel-cizgi-20` | `var(--color-red-100)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1792](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1792) |
| `--tema-yerel-eczanem-islevsel-metin-38` | `var(--color-red-900)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1793](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1793) |
| `--tema-yerel-eczanem-islevsel-cizgi-21` | `var(--color-red-400)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1794](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1794) |
| `--tema-yerel-eczanem-islevsel-zemin-37` | `#9f2409` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1795](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1795) |
| `--tema-yerel-eczanem-islevsel-zemin-38` | `#851e07` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1796](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1796) |
| `--tema-yerel-eczanem-islevsel-metin-39` | `#8f3030` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1797](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1797) |
| `--tema-yerel-eczanem-islevsel-cizgi-22` | `#b84444` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1798](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1798) |
| `--tema-yerel-eczanem-islevsel-odak-02` | `#b84444` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1799](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1799) |
| `--tema-yerel-eczanem-islevsel-cizgi-23` | `#efcaca` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1800](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1800) |
| `--tema-yerel-eczanem-islevsel-zemin-39` | `#fff3f3` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1801](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1801) |
| `--tema-yerel-eczanem-islevsel-metin-40` | `#a43f3f` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1802](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1802) |
| `--tema-yerel-giris-ortu-01` | `var(--color-black)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1803](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1803) |
| `--tema-yerel-giris-kart-02` | `#ffffff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1804](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1804) |
| `--tema-yerel-giris-ters-metin-01` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1805](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1805) |
| `--tema-yerel-giris-islevsel-zemin-01` | `var(--color-red-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1806](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1806) |
| `--tema-yerel-giris-islevsel-cizgi-01` | `var(--color-red-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1807](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1807) |
| `--tema-yerel-giris-islevsel-zemin-02` | `var(--color-green-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1808](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1808) |
| `--tema-yerel-giris-islevsel-cizgi-02` | `var(--color-green-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1809](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1809) |
| `--tema-yerel-giris-islevsel-metin-01` | `var(--color-green-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1810](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1810) |
| `--tema-yerel-ortak-sayfa-islevsel-zemin-11` | `#fef2f2` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1811](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1811) |
| `--tema-yerel-ortak-sayfa-islevsel-zemin-12` | `#fff7ed` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1812](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1812) |
| `--tema-yerel-ortak-sayfa-islevsel-metin-12` | `#c2410c` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1813](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1813) |
| `--tema-yerel-ortak-sayfa-islevsel-metin-13` | `#15803d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1814](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1814) |
| `--tema-yerel-ortak-sayfa-islevsel-zemin-13` | `#fdf4ff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1815](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1815) |
| `--tema-yerel-ortak-sayfa-islevsel-metin-14` | `#7e22ce` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1816](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1816) |
| `--tema-yerel-uretim-islevsel-zemin-30` | `#fee2e2` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1817](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1817) |
| `--tema-yerel-uretim-islevsel-metin-40` | `#991b1b` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1818](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1818) |
| `--tema-yerel-ana-sayfa-islevsel-metin-05` | `#2f7fc7` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1819](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1819) |
| `--tema-yerel-ana-sayfa-islevsel-metin-06` | `#16a34a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1820](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1820) |
| `--tema-yerel-ana-sayfa-islevsel-metin-07` | `#f59e0b` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1821](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1821) |
| `--tema-yerel-ana-sayfa-islevsel-metin-08` | `#8b5cf6` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1822](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1822) |
| `--tema-yerel-ana-sayfa-islevsel-zemin-04` | `#f0fdf4` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1823](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1823) |
| `--tema-yerel-ana-sayfa-islevsel-zemin-05` | `#fffbeb` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1824](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1824) |
| `--tema-yerel-ana-sayfa-islevsel-cizgi-01` | `#bbf7d0` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1825](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1825) |
| `--tema-yerel-ana-sayfa-islevsel-cizgi-02` | `#fef3c7` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1826](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1826) |
| `--tema-yerel-ana-sayfa-islevsel-metin-09` | `#166534` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1827](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1827) |
| `--tema-yerel-ana-sayfa-ters-metin-01` | `#ffffff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1828](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1828) |
| `--tema-yerel-ana-sayfa-islevsel-metin-10` | `#92400e` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1829](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1829) |
| `--tema-yerel-ana-sayfa-islevsel-zemin-06` | `#16a34a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1830](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1830) |
| `--tema-yerel-ana-sayfa-islevsel-zemin-07` | `#f59e0b` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1831](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1831) |
| `--tema-yerel-ana-sayfa-islevsel-golge-01` | `#16a34a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1832](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1832) |
| `--tema-yerel-ana-sayfa-ters-metin-02` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1833](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1833) |
| `--tema-yerel-ana-sayfa-islevsel-zemin-08` | `#f5f3ff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1834](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1834) |
| `--tema-yerel-ana-sayfa-islevsel-metin-11` | `#6d28d9` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1835](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1835) |
| `--tema-yerel-ana-sayfa-islevsel-zemin-09` | `#fff7ed` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1836](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1836) |
| `--tema-yerel-ana-sayfa-islevsel-metin-12` | `#c2410c` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1837](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1837) |
| `--tema-yerel-ana-sayfa-islevsel-metin-14` | `#15803d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1838](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1838) |
| `--tema-yerel-ana-sayfa-golge-01` | `rgba(0,0,0,0.08)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1839](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1839) |
| `--tema-yerel-ana-sayfa-ortu-01` | `rgba(0,0,0,0.5)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1840](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1840) |
| `--tema-yerel-ana-sayfa-ters-metin-03` | `white` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1841](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1841) |
| `--tema-yerel-ana-sayfa-islevsel-zemin-10` | `var(--color-emerald-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1842](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1842) |
| `--tema-yerel-ana-sayfa-islevsel-cizgi-03` | `var(--color-emerald-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1843](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1843) |
| `--tema-yerel-ana-sayfa-islevsel-metin-15` | `var(--color-emerald-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1844](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1844) |
| `--tema-yerel-ana-sayfa-ortu-02` | `var(--color-black)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1845](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1845) |
| `--tema-yerel-ana-sayfa-islevsel-metin-16` | `#a855f7` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1846](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1846) |
| `--tema-yerel-giris-islevsel-metin-02` | `#bc2d0d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1847](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1847) |
| `--tema-yerel-lig-islevsel-metin-08` | `#bc2d0d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1848](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1848) |
| `--tema-yerel-lig-islevsel-metin-09` | `#16a34a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1849](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1849) |
| `--tema-yerel-lig-islevsel-metin-10` | `#854d0e` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1850](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1850) |
| `--tema-yerel-lig-islevsel-zemin-10` | `#f0fdf4` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1851](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1851) |
| `--tema-yerel-lig-islevsel-cizgi-06` | `#bbf7d0` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1852](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1852) |
| `--tema-yerel-lig-islevsel-zemin-11` | `#fefce8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1853](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1853) |
| `--tema-yerel-lig-islevsel-cizgi-07` | `#fde68a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1854](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1854) |
| `--tema-yerel-lig-islevsel-zemin-12` | `#fef2f2` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1855](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1855) |
| `--tema-yerel-lig-islevsel-cizgi-08` | `#fecaca` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1856](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1856) |
| `--tema-yerel-lig-islevsel-zemin-13` | `#f3f4f6` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1857](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1857) |
| `--tema-yerel-lig-islevsel-cizgi-09` | `#e5e7eb` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1858](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1858) |
| `--tema-yerel-lig-kart-02` | `white` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1859](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1859) |
| `--tema-yerel-lig-islevsel-zemin-14` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1860](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1860) |
| `--tema-yerel-lig-islevsel-cizgi-10` | `#dfe7f1` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1861](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1861) |
| `--tema-yerel-lig-islevsel-golge-01` | `rgba(31,55,90,0.035)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1862](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1862) |
| `--tema-yerel-eclub-islevsel-metin-40` | `var(--color-red-600)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1863](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1863) |
| `--tema-yerel-eclub-islevsel-cizgi-12` | `#f1cccc` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1864](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1864) |
| `--tema-yerel-eclub-islevsel-zemin-24` | `#fff7f7` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1865](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1865) |
| `--tema-yerel-eclub-islevsel-zemin-25` | `#f0fbf7` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1866](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1866) |
| `--tema-yerel-eclub-cizgi-43` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1867](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1867) |
| `--tema-yerel-eclub-islevsel-metin-41` | `#16815f` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1868](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1868) |
| `--tema-yerel-eclub-islevsel-zemin-26` | `#dcf9ed` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1869](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1869) |
| `--tema-yerel-eclub-islevsel-metin-42` | `#07986a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1870](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1870) |
| `--tema-yerel-eclub-islevsel-zemin-27` | `#8b22ec` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1871](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1871) |
| `--tema-yerel-eclub-islevsel-zemin-28` | `#6414d4` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1872](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1872) |
| `--tema-yerel-eclub-islevsel-metin-43` | `#d78022` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1873](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1873) |
| `--tema-yerel-eclub-islevsel-metin-44` | `#7358c7` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1874](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1874) |
| `--tema-yerel-eclub-islevsel-zemin-29` | `#f2efff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1875](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1875) |
| `--tema-yerel-eclub-kart-07` | `white` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1876](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1876) |
| `--tema-yerel-eclub-islevsel-zemin-30` | `#fff1f0` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1877](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1877) |
| `--tema-yerel-eclub-islevsel-metin-45` | `#bc2d0d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1878](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1878) |
| `--tema-yerel-ortak-sayfa-islevsel-cizgi-02` | `var(--color-orange-100)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1879](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1879) |
| `--tema-yerel-ortak-sayfa-islevsel-golge-01` | `rgba(249, 115, 22, 0.25)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1880](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1880) |
| `--tema-yerel-ortak-sayfa-islevsel-zemin-14` | `var(--color-orange-500)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1881](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1881) |
| `--tema-yerel-ortak-sayfa-islevsel-zemin-15` | `var(--color-amber-500)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1882](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1882) |
| `--tema-yerel-ortak-sayfa-islevsel-zemin-16` | `var(--color-orange-600)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1883](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1883) |
| `--tema-yerel-ortak-sayfa-islevsel-metin-15` | `var(--color-orange-600)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1884](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1884) |
| `--tema-yerel-ortak-sayfa-islevsel-zemin-17` | `var(--color-emerald-400)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1885](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1885) |
| `--tema-yerel-ortak-sayfa-cizgi-09` | `var(--color-white)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1886](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1886) |
| `--tema-yerel-ortak-sayfa-islevsel-zemin-18` | `var(--color-orange-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1887](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1887) |
| `--tema-yerel-ortak-sayfa-islevsel-golge-02` | `var(--color-orange-500)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1888](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1888) |
| `--tema-yerel-ortak-sayfa-islevsel-metin-16` | `var(--color-amber-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1889](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1889) |
| `--tema-yerel-ortak-sayfa-islevsel-zemin-19` | `var(--color-amber-600)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1890](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1890) |
| `--tema-yerel-ortak-sayfa-islevsel-cizgi-03` | `var(--color-orange-500)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1891](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1891) |
| `--tema-yerel-lig-kart-03` | `rgba(255, 255, 255, .97)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1892](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1892) |
| `--tema-yerel-lig-islevsel-zemin-15` | `#eaf8f1` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1893](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1893) |
| `--tema-yerel-lig-islevsel-metin-11` | `#15955a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1894](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1894) |
| `--tema-yerel-lig-islevsel-zemin-16` | `#fff0ed` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1895](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1895) |
| `--tema-yerel-lig-islevsel-metin-12` | `#e0524d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1896](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1896) |
| `--tema-yerel-lig-islevsel-zemin-17` | `#f0eeff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1897](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1897) |
| `--tema-yerel-lig-islevsel-metin-13` | `#6957dd` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1898](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1898) |
| `--tema-yerel-lig-islevsel-zemin-18` | `#fff0c9` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1899](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1899) |
| `--tema-yerel-lig-islevsel-metin-14` | `#c47a00` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1900](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1900) |
| `--tema-yerel-lig-islevsel-zemin-19` | `#edf1f5` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1901](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1901) |
| `--tema-yerel-lig-islevsel-metin-15` | `#708094` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1902](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1902) |
| `--tema-yerel-lig-islevsel-zemin-20` | `#f7e3d5` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1903](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1903) |
| `--tema-yerel-lig-islevsel-metin-16` | `#ae5b25` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1904](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1904) |
| `--tema-yerel-lig-kart-04` | `#fff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1905](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1905) |
| `--tema-yerel-lig-islevsel-metin-17` | `#df4d4d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1906](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1906) |
| `--tema-yerel-lig-kart-05` | `rgba(255,255,255,.9)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1907](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1907) |
| `--tema-yerel-lig-islevsel-metin-18` | `#208a66` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1908](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1908) |
| `--tema-yerel-lig-islevsel-metin-19` | `#d45c4b` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1909](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1909) |
| `--tema-yerel-lig-islevsel-zemin-21` | `#e9f7ef` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1910](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1910) |
| `--tema-yerel-lig-islevsel-zemin-22` | `#fff3d7` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1911](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1911) |
| `--tema-yerel-lig-islevsel-metin-20` | `#c98508` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1912](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1912) |
| `--tema-yerel-lig-islevsel-metin-21` | `var(--color-rose-600)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1913](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1913) |
| `--tema-yerel-lig-islevsel-zemin-23` | `#fff8e9` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1914](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1914) |
| `--tema-yerel-lig-islevsel-metin-22` | `#f2a51a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1915](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1915) |
| `--tema-yerel-lig-islevsel-zemin-24` | `var(--color-amber-100)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1916](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1916) |
| `--tema-yerel-lig-islevsel-metin-23` | `var(--color-amber-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1917](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1917) |
| `--tema-yerel-lig-islevsel-zemin-25` | `var(--color-emerald-100)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1918](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1918) |
| `--tema-yerel-lig-islevsel-zemin-26` | `#f0faf5` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1919](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1919) |
| `--tema-yerel-lig-islevsel-zemin-27` | `#fff6f2` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1920](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1920) |
| `--tema-yerel-lig-islevsel-zemin-28` | `#daf3e6` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1921](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1921) |
| `--tema-yerel-lig-islevsel-zemin-29` | `#ffe2d9` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1922](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1922) |
| `--tema-yerel-lig-islevsel-metin-24` | `var(--color-emerald-600)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1923](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1923) |
| `--tema-yerel-lig-islevsel-metin-25` | `#7a4300` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1924](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1924) |
| `--tema-yerel-lig-islevsel-metin-26` | `#a65324` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1925](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1925) |
| `--tema-yerel-lig-islevsel-metin-27` | `var(--color-blue-500)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1926](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1926) |
| `--tema-yerel-lig-islevsel-zemin-30` | `var(--color-violet-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1927](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1927) |
| `--tema-yerel-lig-islevsel-metin-28` | `var(--color-violet-500)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1928](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1928) |
| `--tema-yerel-lig-islevsel-metin-29` | `var(--color-amber-500)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1929](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1929) |
| `--tema-yerel-lig-islevsel-zemin-31` | `var(--color-cyan-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1930](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1930) |
| `--tema-yerel-lig-islevsel-metin-30` | `var(--color-cyan-500)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1931](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1931) |
| `--tema-yerel-lig-islevsel-zemin-32` | `var(--color-rose-100)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1932](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1932) |
| `--tema-yerel-lig-kart-06` | `rgba(255, 255, 255, 0.96)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1933](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1933) |
| `--tema-yerel-lig-cizgi-22` | `rgba(255, 255, 255, 0.1)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1934](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1934) |
| `--tema-yerel-lig-golge-06` | `rgba(255, 255, 255, 0.08)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1935](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1935) |
| `--tema-yerel-lig-islevsel-cizgi-11` | `rgba(245, 185, 66, 0.3)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1936](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1936) |
| `--tema-yerel-lig-islevsel-metin-31` | `#f8bd45` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1937](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1937) |
| `--tema-yerel-lig-golge-08` | `rgba(0, 0, 0, 0.18)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1938](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1938) |
| `--tema-yerel-lig-golge-09` | `rgba(0, 0, 0, 0.45)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1939](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1939) |
| `--tema-yerel-lig-golge-10` | `rgba(0, 0, 0, 0.72)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1940](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1940) |
| `--tema-yerel-lig-islevsel-zemin-33` | `#40301c` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1941](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1941) |
| `--tema-yerel-lig-islevsel-cizgi-12` | `var(--color-violet-100)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1942](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1942) |
| `--tema-yerel-lig-islevsel-metin-32` | `var(--color-violet-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1943](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1943) |
| `--tema-yerel-ortak-sayfa-metin-01` | `var(--color-black)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1944](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1944) |
| `--tema-yerel-ortak-sayfa-golge-03` | `rgba(255,255,255,0.9)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1945](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1945) |
| `--tema-yerel-ortak-sayfa-islevsel-cizgi-04` | `var(--color-red-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1946](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1946) |
| `--tema-yerel-ortak-sayfa-islevsel-golge-03` | `#bc2d0d10` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1947](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1947) |
| `--tema-yerel-rapor-islevsel-cizgi-09` | `#7c5ce7` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1948](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1948) |
| `--tema-yerel-rapor-islevsel-metin-36` | `#059669` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1949](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1949) |
| `--tema-yerel-rapor-islevsel-zemin-24` | `var(--color-red-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1950](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1950) |
| `--tema-yerel-rapor-islevsel-metin-37` | `var(--color-red-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1951](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1951) |
| `--tema-yerel-rapor-islevsel-metin-38` | `#fef2f2` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1952](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1952) |
| `--tema-yerel-rapor-islevsel-cizgi-10` | `#fee2e2` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1953](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1953) |
| `--tema-yerel-rapor-islevsel-metin-39` | `#f5f3ff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1954](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1954) |
| `--tema-yerel-rapor-islevsel-cizgi-11` | `#ede9fe` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1955](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1955) |
| `--tema-yerel-rapor-islevsel-metin-40` | `#f0f9ff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1956](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1956) |
| `--tema-yerel-rapor-islevsel-cizgi-12` | `#e0f2fe` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1957](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1957) |
| `--tema-yerel-rapor-islevsel-zemin-25` | `#f0f9ff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1958](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1958) |
| `--tema-yerel-rapor-islevsel-metin-41` | `#d97706` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1959](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1959) |
| `--tema-yerel-rapor-islevsel-metin-42` | `#fffbeb` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1960](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1960) |
| `--tema-yerel-rapor-islevsel-cizgi-13` | `#fef3c7` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1961](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1961) |
| `--tema-yerel-rapor-islevsel-zemin-26` | `#fffbeb` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1962](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1962) |
| `--tema-yerel-rapor-islevsel-metin-43` | `#378ADD` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1963](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1963) |
| `--tema-yerel-rapor-islevsel-metin-44` | `#EF9F27` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1964](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1964) |
| `--tema-yerel-rapor-islevsel-metin-45` | `#7F77DD` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1965](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1965) |
| `--tema-yerel-rapor-islevsel-metin-46` | `#0F9FA8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1966](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1966) |
| `--tema-yerel-rapor-islevsel-metin-47` | `#D85A30` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1967](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1967) |
| `--tema-yerel-rapor-islevsel-metin-48` | `#E24B4A` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1968](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1968) |
| `--tema-yerel-rapor-islevsel-metin-49` | `#BC2D0D` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1969](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1969) |
| `--tema-yerel-uretim-islevsel-cizgi-24` | `#bde5d5` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1970](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1970) |
| `--tema-yerel-uretim-islevsel-zemin-31` | `#edf9f4` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1971](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1971) |
| `--tema-yerel-uretim-islevsel-metin-41` | `#157254` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1972](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1972) |
| `--tema-yerel-uretim-islevsel-cizgi-25` | `#efcaca` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1973](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1973) |
| `--tema-yerel-uretim-islevsel-zemin-32` | `#fff5f5` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1974](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1974) |
| `--tema-yerel-uretim-islevsel-metin-42` | `#a74646` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1975](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1975) |
| `--tema-yerel-ortak-sayfa-islevsel-cizgi-05` | `var(--color-amber-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1976](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1976) |
| `--tema-yerel-ortak-sayfa-islevsel-cizgi-06` | `var(--color-amber-600)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1977](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1977) |
| `--tema-yerel-ortak-sayfa-islevsel-zemin-20` | `var(--color-amber-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1978](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1978) |
| `--tema-yerel-ortak-sayfa-islevsel-metin-17` | `var(--color-amber-800)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1979](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1979) |
| `--tema-yerel-ortak-sayfa-islevsel-cizgi-07` | `var(--color-emerald-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1980](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1980) |
| `--tema-yerel-ortak-sayfa-islevsel-cizgi-08` | `var(--color-emerald-600)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1981](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1981) |
| `--tema-yerel-ortak-sayfa-islevsel-zemin-21` | `var(--color-emerald-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1982](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1982) |
| `--tema-yerel-ortak-sayfa-islevsel-metin-18` | `var(--color-emerald-800)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1983](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1983) |
| `--tema-yerel-ortak-sayfa-islevsel-zemin-22` | `#e8f6ef` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1984](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1984) |
| `--tema-yerel-ortak-sayfa-islevsel-metin-19` | `#218454` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1985](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1985) |
| `--tema-yerel-ortak-sayfa-islevsel-metin-20` | `var(--color-red-700)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1986](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1986) |
| `--tema-yerel-ortak-sayfa-islevsel-metin-21` | `#2c8660` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1987](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1987) |
| `--tema-yerel-ortak-sayfa-islevsel-metin-22` | `#a05d32` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1988](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1988) |
| `--tema-yerel-ortak-sayfa-islevsel-zemin-23` | `var(--color-red-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1989](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1989) |
| `--tema-yerel-uretim-islevsel-metin-43` | `#1d4ed8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1990](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1990) |
| `--tema-yerel-uretim-islevsel-cizgi-26` | `#bfdbfe` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1991](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1991) |
| `--tema-yerel-uretim-islevsel-metin-44` | `#6d28d9` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1992](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1992) |
| `--tema-yerel-uretim-islevsel-cizgi-27` | `#ddd6fe` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1993](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1993) |
| `--tema-yerel-uretim-islevsel-zemin-33` | `#fdf4ff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1994](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1994) |
| `--tema-yerel-uretim-islevsel-metin-45` | `#7e22ce` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1995](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1995) |
| `--tema-yerel-uretim-islevsel-cizgi-28` | `#e9d5ff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1996](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1996) |
| `--tema-yerel-magaza-islevsel-metin-14` | `#854d0e` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1997](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1997) |
| `--tema-yerel-magaza-islevsel-zemin-20` | `#fefce8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1998](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1998) |
| `--tema-yerel-magaza-islevsel-metin-15` | `#1d4ed8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:1999](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:1999) |
| `--tema-yerel-magaza-islevsel-zemin-21` | `#e6f1fb` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:2000](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2000) |
| `--tema-yerel-magaza-islevsel-cizgi-07` | `#bfdbfe` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:2001](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2001) |
| `--tema-yerel-magaza-islevsel-metin-16` | `#16a34a` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:2002](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2002) |
| `--tema-yerel-magaza-islevsel-zemin-22` | `#f0fdf4` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:2003](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2003) |
| `--tema-yerel-magaza-islevsel-cizgi-08` | `#bbf7d0` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:2004](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2004) |
| `--tema-yerel-magaza-islevsel-metin-17` | `#bc2d0d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:2005](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2005) |
| `--tema-yerel-magaza-islevsel-zemin-23` | `#fef2f2` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:2006](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2006) |
| `--tema-yerel-magaza-islevsel-cizgi-09` | `#fecaca` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:2007](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2007) |
| `--tema-yerel-ortak-sayfa-islevsel-metin-23` | `#56aeff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:2008](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2008) |
| `--tema-yerel-ortak-sayfa-islevsel-metin-24` | `#f59e0b` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:2009](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2009) |
| `--tema-yerel-ana-sayfa-yardimci-metin-01` | `var(--color-gray-400)` | :root, [data-tema="mavi"] | [app/tema.css:2013](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2013) |
| `--tema-yerel-ana-sayfa-yardimci-metin-02` | `#737373` | :root, [data-tema="mavi"] | [app/tema.css:2014](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2014) |
| `--tema-yerel-lig-yardimci-metin-01` | `#737373` | :root, [data-tema="mavi"] | [app/tema.css:2015](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2015) |
| `--tema-yerel-lig-ana-metin-01` | `#111827` | :root, [data-tema="mavi"] | [app/tema.css:2016](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2016) |
| `--tema-yerel-lig-sayfa-zemini-01` | `#f9fafb` | :root, [data-tema="mavi"] | [app/tema.css:2017](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2017) |
| `--tema-yerel-lig-cizgi-01` | `var(--color-blue-100)` | :root, [data-tema="mavi"] | [app/tema.css:2018](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2018) |
| `--tema-yerel-lig-secim-zemin-01` | `var(--color-blue-50)` | :root, [data-tema="mavi"] | [app/tema.css:2019](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2019) |
| `--tema-yerel-lig-eylem-metin-01` | `var(--color-blue-700)` | :root, [data-tema="mavi"] | [app/tema.css:2020](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2020) |
| `--tema-yerel-lig-ana-metin-02` | `#10213d` | :root, [data-tema="mavi"] | [app/tema.css:2021](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2021) |
| `--tema-yerel-lig-yardimci-metin-02` | `#718198` | :root, [data-tema="mavi"] | [app/tema.css:2022](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2022) |
| `--tema-yerel-lig-yardimci-metin-03` | `var(--color-gray-500)` | :root, [data-tema="mavi"] | [app/tema.css:2023](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2023) |
| `--tema-yerel-lig-cizgi-02` | `var(--color-gray-200)` | :root, [data-tema="mavi"] | [app/tema.css:2024](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2024) |
| `--tema-yerel-lig-ana-metin-03` | `var(--color-gray-900)` | :root, [data-tema="mavi"] | [app/tema.css:2025](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2025) |
| `--tema-yerel-lig-eylem-metin-02` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:2026](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2026) |
| `--tema-yerel-lig-ana-metin-04` | `#203653` | :root, [data-tema="mavi"] | [app/tema.css:2027](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2027) |
| `--tema-yerel-lig-yardimci-metin-04` | `#8190a3` | :root, [data-tema="mavi"] | [app/tema.css:2028](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2028) |
| `--tema-yerel-lig-secim-zemin-02` | `#edf6fd` | :root, [data-tema="mavi"] | [app/tema.css:2029](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2029) |
| `--tema-yerel-lig-cizgi-03` | `#dfe7f1` | :root, [data-tema="mavi"] | [app/tema.css:2030](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2030) |
| `--tema-yerel-lig-golge-01` | `rgba(31,55,90,0.035)` | :root, [data-tema="mavi"] | [app/tema.css:2031](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2031) |
| `--tema-yerel-lig-yardimci-metin-05` | `#8796a8` | :root, [data-tema="mavi"] | [app/tema.css:2032](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2032) |
| `--tema-yerel-lig-cizgi-04` | `#d8e2ec` | :root, [data-tema="mavi"] | [app/tema.css:2033](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2033) |
| `--tema-yerel-lig-sayfa-zemini-02` | `#f1f6fa` | :root, [data-tema="mavi"] | [app/tema.css:2034](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2034) |
| `--tema-yerel-lig-yardimci-metin-06` | `#8ba0b5` | :root, [data-tema="mavi"] | [app/tema.css:2035](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2035) |
| `--tema-yerel-lig-ana-metin-05` | `#40556d` | :root, [data-tema="mavi"] | [app/tema.css:2036](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2036) |
| `--tema-yerel-lig-ana-metin-06` | `var(--color-gray-800)` | :root, [data-tema="mavi"] | [app/tema.css:2037](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2037) |
| `--tema-yerel-lig-sayfa-zemini-03` | `#f7f9fc` | :root, [data-tema="mavi"] | [app/tema.css:2038](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2038) |
| `--tema-yerel-lig-yardimci-metin-07` | `#70849d` | :root, [data-tema="mavi"] | [app/tema.css:2039](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2039) |
| `--tema-yerel-lig-cizgi-05` | `#e5e7eb` | :root, [data-tema="mavi"] | [app/tema.css:2040](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2040) |
| `--tema-yerel-ana-sayfa-cizgi-01` | `#cdddec` | :root, [data-tema="mavi"] | [app/tema.css:2041](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2041) |
| `--tema-yerel-ana-sayfa-eylem-metin-01` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:2042](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2042) |
| `--tema-yerel-ana-sayfa-cizgi-02` | `#87bde8` | :root, [data-tema="mavi"] | [app/tema.css:2043](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2043) |
| `--tema-yerel-ana-sayfa-secim-zemin-01` | `#f1f7fe` | :root, [data-tema="mavi"] | [app/tema.css:2044](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2044) |
| `--tema-yerel-ana-sayfa-odak-01` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:2045](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2045) |
| `--tema-yerel-eclub-cizgi-01` | `#cfe3f4` | :root, [data-tema="mavi"] | [app/tema.css:2046](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2046) |
| `--tema-yerel-eclub-eylem-metin-01` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:2047](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2047) |
| `--tema-yerel-eclub-sayfa-zemini-01` | `#f4f9fd` | :root, [data-tema="mavi"] | [app/tema.css:2048](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2048) |
| `--tema-yerel-eclub-sayfa-zemini-02` | `var(--color-gray-50)` | :root, [data-tema="mavi"] | [app/tema.css:2049](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2049) |
| `--tema-yerel-eclub-ana-metin-01` | `#172b4d` | :root, [data-tema="mavi"] | [app/tema.css:2050](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2050) |
| `--tema-yerel-eclub-yardimci-metin-01` | `#6b7f9b` | :root, [data-tema="mavi"] | [app/tema.css:2051](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2051) |
| `--tema-yerel-eclub-cizgi-02` | `#bfdbfe` | :root, [data-tema="mavi"] | [app/tema.css:2052](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2052) |
| `--tema-yerel-eclub-secim-zemin-01` | `#eaf4ff` | :root, [data-tema="mavi"] | [app/tema.css:2053](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2053) |
| `--tema-yerel-eclub-eylem-metin-02` | `#1d4ed8` | :root, [data-tema="mavi"] | [app/tema.css:2054](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2054) |
| `--tema-yerel-eclub-secim-zemin-02` | `#dbeafe` | :root, [data-tema="mavi"] | [app/tema.css:2055](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2055) |
| `--tema-yerel-eclub-eylem-metin-03` | `#2563eb` | :root, [data-tema="mavi"] | [app/tema.css:2056](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2056) |
| `--tema-yerel-eclub-cizgi-03` | `#dfe7f1` | :root, [data-tema="mavi"] | [app/tema.css:2057](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2057) |
| `--tema-yerel-eclub-yardimci-metin-02` | `#60758d` | :root, [data-tema="mavi"] | [app/tema.css:2058](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2058) |
| `--tema-yerel-eclub-cizgi-04` | `var(--color-gray-200)` | :root, [data-tema="mavi"] | [app/tema.css:2059](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2059) |
| `--tema-yerel-eclub-yardimci-metin-03` | `var(--color-gray-400)` | :root, [data-tema="mavi"] | [app/tema.css:2060](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2060) |
| `--tema-yerel-eclub-cizgi-05` | `#dfe8f1` | :root, [data-tema="mavi"] | [app/tema.css:2061](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2061) |
| `--tema-yerel-eclub-sayfa-zemini-03` | `#f7f9fc` | :root, [data-tema="mavi"] | [app/tema.css:2062](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2062) |
| `--tema-yerel-eclub-yardimci-metin-04` | `#7d8ea2` | :root, [data-tema="mavi"] | [app/tema.css:2063](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2063) |
| `--tema-yerel-eclub-cizgi-06` | `#edf1f5` | :root, [data-tema="mavi"] | [app/tema.css:2064](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2064) |
| `--tema-yerel-eclub-ana-metin-02` | `#40556d` | :root, [data-tema="mavi"] | [app/tema.css:2065](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2065) |
| `--tema-yerel-eclub-secim-zemin-03` | `#f0f7fe` | :root, [data-tema="mavi"] | [app/tema.css:2066](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2066) |
| `--tema-yerel-eclub-yardimci-metin-05` | `#6f91ad` | :root, [data-tema="mavi"] | [app/tema.css:2067](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2067) |
| `--tema-yerel-eclub-yardimci-metin-06` | `#7b8da5` | :root, [data-tema="mavi"] | [app/tema.css:2068](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2068) |
| `--tema-yerel-eclub-ana-metin-03` | `#1e293b` | :root, [data-tema="mavi"] | [app/tema.css:2069](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2069) |
| `--tema-yerel-eclub-yardimci-metin-07` | `#8a99aa` | :root, [data-tema="mavi"] | [app/tema.css:2070](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2070) |
| `--tema-yerel-eclub-cizgi-07` | `#d9e5f0` | :root, [data-tema="mavi"] | [app/tema.css:2071](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2071) |
| `--tema-yerel-eclub-sayfa-zemini-04` | `#f7fafe` | :root, [data-tema="mavi"] | [app/tema.css:2072](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2072) |
| `--tema-yerel-eclub-yardimci-metin-08` | `var(--color-gray-500)` | :root, [data-tema="mavi"] | [app/tema.css:2073](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2073) |
| `--tema-yerel-eclub-cizgi-08` | `#3b82f6` | :root, [data-tema="mavi"] | [app/tema.css:2074](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2074) |
| `--tema-yerel-eclub-ana-metin-04` | `#1e3a8a` | :root, [data-tema="mavi"] | [app/tema.css:2075](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2075) |
| `--tema-yerel-eclub-odak-01` | `var(--color-blue-100)` | :root, [data-tema="mavi"] | [app/tema.css:2076](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2076) |
| `--tema-yerel-eclub-eylem-zemin-01` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:2077](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2077) |
| `--tema-yerel-eclub-eylem-zemin-02` | `#1d69ad` | :root, [data-tema="mavi"] | [app/tema.css:2078](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2078) |
| `--tema-yerel-eclub-ana-metin-05` | `#4b5563` | :root, [data-tema="mavi"] | [app/tema.css:2079](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2079) |
| `--tema-yerel-eclub-yardimci-metin-09` | `#9ca3af` | :root, [data-tema="mavi"] | [app/tema.css:2080](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2080) |
| `--tema-yerel-eclub-yardimci-metin-10` | `#6b7280` | :root, [data-tema="mavi"] | [app/tema.css:2081](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2081) |
| `--tema-yerel-eclub-secim-zemin-04` | `#eef6ff` | :root, [data-tema="mavi"] | [app/tema.css:2082](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2082) |
| `--tema-yerel-eclub-cizgi-09` | `#b9d7ee` | :root, [data-tema="mavi"] | [app/tema.css:2083](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2083) |
| `--tema-yerel-eclub-golge-01` | `rgba(31,55,90,0.04)` | :root, [data-tema="mavi"] | [app/tema.css:2084](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2084) |
| `--tema-yerel-eclub-cizgi-10` | `#e8eef4` | :root, [data-tema="mavi"] | [app/tema.css:2085](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2085) |
| `--tema-yerel-eclub-sayfa-zemini-05` | `#f8fafc` | :root, [data-tema="mavi"] | [app/tema.css:2086](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2086) |
| `--tema-yerel-eclub-secim-zemin-05` | `#eaf4fd` | :root, [data-tema="mavi"] | [app/tema.css:2087](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2087) |
| `--tema-yerel-eclub-ana-metin-06` | `#203653` | :root, [data-tema="mavi"] | [app/tema.css:2088](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2088) |
| `--tema-yerel-eclub-yardimci-metin-11` | `#71859d` | :root, [data-tema="mavi"] | [app/tema.css:2089](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2089) |
| `--tema-yerel-eclub-yardimci-metin-12` | `#8ea0b4` | :root, [data-tema="mavi"] | [app/tema.css:2090](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2090) |
| `--tema-yerel-eclub-cizgi-11` | `#d8e2ed` | :root, [data-tema="mavi"] | [app/tema.css:2091](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2091) |
| `--tema-yerel-eclub-ana-metin-07` | `#324b68` | :root, [data-tema="mavi"] | [app/tema.css:2092](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2092) |
| `--tema-yerel-eclub-cizgi-12` | `#79add8` | :root, [data-tema="mavi"] | [app/tema.css:2093](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2093) |
| `--tema-yerel-eclub-odak-02` | `#d9ebfa` | :root, [data-tema="mavi"] | [app/tema.css:2094](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2094) |
| `--tema-yerel-eclub-vurgu-metin-01` | `#bc2d0d` | :root, [data-tema="mavi"] | [app/tema.css:2095](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2095) |
| `--tema-yerel-eclub-sayfa-zemini-06` | `#f8fbfe` | :root, [data-tema="mavi"] | [app/tema.css:2096](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2096) |
| `--tema-yerel-eclub-eylem-zemin-03` | `#2f7fc7` | :root, [data-tema="mavi"] | [app/tema.css:2097](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2097) |
| `--tema-yerel-eclub-eylem-zemin-04` | `#256daf` | :root, [data-tema="mavi"] | [app/tema.css:2098](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2098) |
| `--tema-yerel-eclub-cizgi-13` | `#e0e8f3` | :root, [data-tema="mavi"] | [app/tema.css:2099](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2099) |
| `--tema-yerel-eclub-golge-02` | `rgba(31,55,90,0.08)` | :root, [data-tema="mavi"] | [app/tema.css:2100](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2100) |
| `--tema-yerel-eclub-cizgi-14` | `#a9c6ee` | :root, [data-tema="mavi"] | [app/tema.css:2101](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2101) |
| `--tema-yerel-eclub-golge-03` | `rgba(31,55,90,0.13)` | :root, [data-tema="mavi"] | [app/tema.css:2102](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2102) |
| `--tema-yerel-eclub-odak-03` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:2103](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2103) |
| `--tema-yerel-eclub-secim-zemin-06` | `#edf4ff` | :root, [data-tema="mavi"] | [app/tema.css:2104](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2104) |
| `--tema-yerel-eclub-yardimci-metin-13` | `#8da8c1` | :root, [data-tema="mavi"] | [app/tema.css:2105](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2105) |
| `--tema-yerel-eclub-ana-metin-08` | `#102a60` | :root, [data-tema="mavi"] | [app/tema.css:2106](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2106) |
| `--tema-yerel-eclub-cizgi-15` | `#dce6f3` | :root, [data-tema="mavi"] | [app/tema.css:2107](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2107) |
| `--tema-yerel-eclub-cizgi-16` | `#dfebfd` | :root, [data-tema="mavi"] | [app/tema.css:2108](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2108) |
| `--tema-yerel-eclub-sayfa-zemini-07` | `#f7faff` | :root, [data-tema="mavi"] | [app/tema.css:2109](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2109) |
| `--tema-yerel-eclub-secim-zemin-07` | `#e0eaff` | :root, [data-tema="mavi"] | [app/tema.css:2110](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2110) |
| `--tema-yerel-eclub-ana-metin-09` | `#123883` | :root, [data-tema="mavi"] | [app/tema.css:2111](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2111) |
| `--tema-yerel-eclub-yardimci-metin-14` | `#71829f` | :root, [data-tema="mavi"] | [app/tema.css:2112](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2112) |
| `--tema-yerel-eclub-golge-04` | `rgba(31,55,90,0.035)` | :root, [data-tema="mavi"] | [app/tema.css:2113](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2113) |
| `--tema-yerel-eclub-yardimci-metin-15` | `#7d8fa5` | :root, [data-tema="mavi"] | [app/tema.css:2114](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2114) |
| `--tema-yerel-eclub-sayfa-zemini-08` | `#f1f5f9` | :root, [data-tema="mavi"] | [app/tema.css:2115](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2115) |
| `--tema-yerel-eclub-yardimci-metin-16` | `#9aa8b8` | :root, [data-tema="mavi"] | [app/tema.css:2116](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2116) |
| `--tema-yerel-eclub-cizgi-17` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:2117](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2117) |
| `--tema-yerel-eclub-yardimci-metin-17` | `#8a98aa` | :root, [data-tema="mavi"] | [app/tema.css:2118](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2118) |
| `--tema-yerel-eclub-cizgi-18` | `#e7edf4` | :root, [data-tema="mavi"] | [app/tema.css:2119](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2119) |
| `--tema-yerel-eclub-secim-zemin-08` | `var(--color-blue-50)` | :root, [data-tema="mavi"] | [app/tema.css:2120](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2120) |
| `--tema-yerel-eclub-sayfa-zemini-09` | `#fbfcfe` | :root, [data-tema="mavi"] | [app/tema.css:2121](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2121) |
| `--tema-yerel-eclub-cizgi-19` | `#d7e1ec` | :root, [data-tema="mavi"] | [app/tema.css:2122](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2122) |
| `--tema-yerel-eclub-ana-metin-10` | `#45627f` | :root, [data-tema="mavi"] | [app/tema.css:2123](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2123) |
| `--tema-yerel-eclub-sayfa-zemini-10` | `#f6f9fc` | :root, [data-tema="mavi"] | [app/tema.css:2124](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2124) |
| `--tema-yerel-eclub-cizgi-20` | `#e8eef5` | :root, [data-tema="mavi"] | [app/tema.css:2125](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2125) |
| `--tema-yerel-eclub-cizgi-21` | `#bfd7ec` | :root, [data-tema="mavi"] | [app/tema.css:2126](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2126) |
| `--tema-yerel-eclub-ana-metin-11` | `#1e3450` | :root, [data-tema="mavi"] | [app/tema.css:2127](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2127) |
| `--tema-yerel-eclub-yardimci-metin-18` | `#8292a7` | :root, [data-tema="mavi"] | [app/tema.css:2128](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2128) |
| `--tema-yerel-eclub-dekoratif-zemin-01` | `rgba(86, 174, 255, 0.12)` | :root, [data-tema="mavi"] | [app/tema.css:2129](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2129) |
| `--tema-yerel-eclub-sayfa-zemini-11` | `#f8fbff` | :root, [data-tema="mavi"] | [app/tema.css:2130](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2130) |
| `--tema-yerel-eclub-sayfa-zemini-12` | `#f5f7fa` | :root, [data-tema="mavi"] | [app/tema.css:2131](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2131) |
| `--tema-yerel-eclub-ana-metin-12` | `#10213d` | :root, [data-tema="mavi"] | [app/tema.css:2132](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2132) |
| `--tema-yerel-eclub-yardimci-metin-19` | `#78889d` | :root, [data-tema="mavi"] | [app/tema.css:2133](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2133) |
| `--tema-yerel-eclub-cizgi-22` | `#dce5ee` | :root, [data-tema="mavi"] | [app/tema.css:2134](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2134) |
| `--tema-yerel-eclub-yardimci-metin-20` | `#5d7897` | :root, [data-tema="mavi"] | [app/tema.css:2135](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2135) |
| `--tema-yerel-eclub-cizgi-23` | `#d9e4ef` | :root, [data-tema="mavi"] | [app/tema.css:2136](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2136) |
| `--tema-yerel-eclub-ana-metin-13` | `#30475f` | :root, [data-tema="mavi"] | [app/tema.css:2137](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2137) |
| `--tema-yerel-eclub-cizgi-24` | `#56aeff` | :root, [data-tema="mavi"] | [app/tema.css:2138](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2138) |
| `--tema-yerel-eclub-golge-05` | `rgba(86, 174, 255, 0.12)` | :root, [data-tema="mavi"] | [app/tema.css:2139](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2139) |
| `--tema-yerel-eclub-cizgi-25` | `rgba(148, 163, 184, 0.2)` | :root, [data-tema="mavi"] | [app/tema.css:2140](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2140) |
| `--tema-yerel-eclub-golge-06` | `rgba(36, 64, 98, 0.055)` | :root, [data-tema="mavi"] | [app/tema.css:2141](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2141) |
| `--tema-yerel-eclub-secim-zemin-09` | `#edf6ff` | :root, [data-tema="mavi"] | [app/tema.css:2142](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2142) |
| `--tema-yerel-eclub-ana-metin-14` | `#20324c` | :root, [data-tema="mavi"] | [app/tema.css:2143](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2143) |
| `--tema-yerel-eclub-yardimci-metin-21` | `#91a0b1` | :root, [data-tema="mavi"] | [app/tema.css:2144](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2144) |
| `--tema-yerel-eclub-yardimci-metin-22` | `#66809f` | :root, [data-tema="mavi"] | [app/tema.css:2145](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2145) |
| `--tema-yerel-eclub-yardimci-metin-23` | `#8190a3` | :root, [data-tema="mavi"] | [app/tema.css:2146](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2146) |
| `--tema-yerel-eclub-yardimci-metin-24` | `#f8fafc` | :root, [data-tema="mavi"] | [app/tema.css:2147](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2147) |
| `--tema-yerel-eclub-eylem-metin-04` | `#4881b0` | :root, [data-tema="mavi"] | [app/tema.css:2148](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2148) |
| `--tema-yerel-eclub-secim-zemin-10` | `#edf6fd` | :root, [data-tema="mavi"] | [app/tema.css:2149](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2149) |
| `--tema-yerel-eclub-eylem-metin-05` | `#217bc3` | :root, [data-tema="mavi"] | [app/tema.css:2150](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2150) |
| `--tema-yerel-eclub-sayfa-zemini-13` | `#f4f8fc` | :root, [data-tema="mavi"] | [app/tema.css:2151](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2151) |
| `--tema-yerel-eclub-yardimci-metin-25` | `#8a9aab` | :root, [data-tema="mavi"] | [app/tema.css:2152](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2152) |
| `--tema-yerel-eclub-eylem-zemin-06` | `#2f9ae9` | :root, [data-tema="mavi"] | [app/tema.css:2153](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2153) |
| `--tema-yerel-eclub-odak-04` | `#93c5fd` | :root, [data-tema="mavi"] | [app/tema.css:2154](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2154) |
| `--tema-yerel-eclub-eylem-zemin-07` | `#2563eb` | :root, [data-tema="mavi"] | [app/tema.css:2155](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2155) |
| `--tema-yerel-eclub-ana-metin-15` | `#334155` | :root, [data-tema="mavi"] | [app/tema.css:2156](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2156) |
| `--tema-yerel-eclub-yardimci-metin-26` | `#64748b` | :root, [data-tema="mavi"] | [app/tema.css:2157](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2157) |
| `--tema-yerel-eclub-ana-metin-16` | `#475569` | :root, [data-tema="mavi"] | [app/tema.css:2158](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2158) |
| `--tema-yerel-eclub-yardimci-metin-27` | `#7c8fa4` | :root, [data-tema="mavi"] | [app/tema.css:2159](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2159) |
| `--tema-yerel-eclub-yardimci-metin-28` | `#60758c` | :root, [data-tema="mavi"] | [app/tema.css:2160](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2160) |
| `--tema-yerel-eclub-yardimci-metin-29` | `#8796a8` | :root, [data-tema="mavi"] | [app/tema.css:2161](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2161) |
| `--tema-yerel-eclub-ana-metin-17` | `var(--color-gray-800)` | :root, [data-tema="mavi"] | [app/tema.css:2162](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2162) |
| `--tema-yerel-eclub-ana-metin-18` | `#243957` | :root, [data-tema="mavi"] | [app/tema.css:2163](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2163) |
| `--tema-yerel-eclub-cizgi-26` | `#d8e2ec` | :root, [data-tema="mavi"] | [app/tema.css:2164](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2164) |
| `--tema-yerel-eclub-secim-zemin-11` | `#eff6ff` | :root, [data-tema="mavi"] | [app/tema.css:2165](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2165) |
| `--tema-yerel-eclub-sayfa-zemini-14` | `#f5f8fb` | :root, [data-tema="mavi"] | [app/tema.css:2166](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2166) |
| `--tema-yerel-eclub-yardimci-metin-30` | `var(--color-slate-500)` | :root, [data-tema="mavi"] | [app/tema.css:2167](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2167) |
| `--tema-yerel-eclub-cizgi-27` | `var(--color-slate-200)` | :root, [data-tema="mavi"] | [app/tema.css:2168](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2168) |
| `--tema-yerel-eclub-cizgi-28` | `var(--color-blue-200)` | :root, [data-tema="mavi"] | [app/tema.css:2169](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2169) |
| `--tema-yerel-eclub-eylem-metin-06` | `var(--color-blue-800)` | :root, [data-tema="mavi"] | [app/tema.css:2170](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2170) |
| `--tema-yerel-eclub-ana-metin-19` | `var(--color-slate-900)` | :root, [data-tema="mavi"] | [app/tema.css:2171](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2171) |
| `--tema-yerel-eclub-sayfa-zemini-15` | `var(--color-slate-50)` | :root, [data-tema="mavi"] | [app/tema.css:2172](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2172) |
| `--tema-yerel-eclub-ana-metin-20` | `var(--color-slate-600)` | :root, [data-tema="mavi"] | [app/tema.css:2173](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2173) |
| `--tema-yerel-eclub-yardimci-metin-31` | `var(--color-slate-400)` | :root, [data-tema="mavi"] | [app/tema.css:2174](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2174) |
| `--tema-yerel-eclub-ana-metin-21` | `var(--color-slate-800)` | :root, [data-tema="mavi"] | [app/tema.css:2175](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2175) |
| `--tema-yerel-eclub-sayfa-zemini-16` | `var(--color-slate-100)` | :root, [data-tema="mavi"] | [app/tema.css:2176](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2176) |
| `--tema-yerel-eclub-ana-metin-22` | `var(--color-slate-700)` | :root, [data-tema="mavi"] | [app/tema.css:2177](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2177) |
| `--tema-yerel-eclub-eylem-zemin-08` | `var(--color-blue-600)` | :root, [data-tema="mavi"] | [app/tema.css:2178](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2178) |
| `--tema-yerel-eclub-eylem-zemin-09` | `var(--color-blue-700)` | :root, [data-tema="mavi"] | [app/tema.css:2179](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2179) |
| `--tema-yerel-eclub-sayfa-zemini-17` | `var(--color-slate-300)` | :root, [data-tema="mavi"] | [app/tema.css:2180](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2180) |
| `--tema-yerel-eclub-eylem-zemin-10` | `var(--color-indigo-600)` | :root, [data-tema="mavi"] | [app/tema.css:2181](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2181) |
| `--tema-yerel-eclub-eylem-zemin-11` | `var(--color-indigo-700)` | :root, [data-tema="mavi"] | [app/tema.css:2182](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2182) |
| `--tema-yerel-eclub-cizgi-29` | `var(--color-slate-300)` | :root, [data-tema="mavi"] | [app/tema.css:2183](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2183) |
| `--tema-yerel-eclub-eylem-metin-07` | `#5367c7` | :root, [data-tema="mavi"] | [app/tema.css:2184](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2184) |
| `--tema-yerel-eclub-ana-metin-23` | `var(--color-gray-900)` | :root, [data-tema="mavi"] | [app/tema.css:2185](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2185) |
| `--tema-yerel-eclub-yardimci-metin-32` | `#8090a4` | :root, [data-tema="mavi"] | [app/tema.css:2186](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2186) |
| `--tema-yerel-eclub-eylem-zemin-12` | `#172b4d` | :root, [data-tema="mavi"] | [app/tema.css:2187](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2187) |
| `--tema-yerel-eclub-golge-10` | `rgba(23,43,77,0.3)` | :root, [data-tema="mavi"] | [app/tema.css:2188](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2188) |
| `--tema-yerel-eclub-yardimci-metin-33` | `#d5e2f0` | :root, [data-tema="mavi"] | [app/tema.css:2189](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2189) |
| `--tema-yerel-eclub-secim-zemin-12` | `#edf5fc` | :root, [data-tema="mavi"] | [app/tema.css:2190](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2190) |
| `--tema-yerel-eclub-eylem-zemin-13` | `#0f2746` | :root, [data-tema="mavi"] | [app/tema.css:2191](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2191) |
| `--tema-yerel-eclub-golge-11` | `rgba(13,40,70,0.2)` | :root, [data-tema="mavi"] | [app/tema.css:2192](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2192) |
| `--tema-yerel-eclub-cizgi-30` | `#e6edf4` | :root, [data-tema="mavi"] | [app/tema.css:2193](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2193) |
| `--tema-yerel-eclub-yardimci-metin-34` | `#74869a` | :root, [data-tema="mavi"] | [app/tema.css:2194](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2194) |
| `--tema-yerel-eclub-ana-metin-24` | `#49627e` | :root, [data-tema="mavi"] | [app/tema.css:2195](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2195) |
| `--tema-yerel-eclub-yardimci-metin-35` | `#8a9aae` | :root, [data-tema="mavi"] | [app/tema.css:2196](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2196) |
| `--tema-yerel-eclub-cizgi-31` | `#dce5ef` | :root, [data-tema="mavi"] | [app/tema.css:2197](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2197) |
| `--tema-yerel-eclub-cizgi-32` | `#b7c7d8` | :root, [data-tema="mavi"] | [app/tema.css:2198](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2198) |
| `--tema-yerel-eclub-yardimci-metin-36` | `#768aa1` | :root, [data-tema="mavi"] | [app/tema.css:2199](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2199) |
| `--tema-yerel-eclub-ana-metin-25` | `#405976` | :root, [data-tema="mavi"] | [app/tema.css:2200](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2200) |
| `--tema-yerel-eclub-cizgi-33` | `#cfdae7` | :root, [data-tema="mavi"] | [app/tema.css:2201](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2201) |
| `--tema-yerel-eclub-cizgi-34` | `#e1e9f2` | :root, [data-tema="mavi"] | [app/tema.css:2202](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2202) |
| `--tema-yerel-eclub-yardimci-metin-37` | `#778ba2` | :root, [data-tema="mavi"] | [app/tema.css:2203](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2203) |
| `--tema-yerel-eclub-yardimci-metin-38` | `#8798aa` | :root, [data-tema="mavi"] | [app/tema.css:2204](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2204) |
| `--tema-yerel-eclub-cizgi-35` | `#edf2f7` | :root, [data-tema="mavi"] | [app/tema.css:2205](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2205) |
| `--tema-yerel-eclub-yardimci-metin-39` | `#516982` | :root, [data-tema="mavi"] | [app/tema.css:2206](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2206) |
| `--tema-yerel-eclub-sayfa-zemini-18` | `#f5f8fc` | :root, [data-tema="mavi"] | [app/tema.css:2207](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2207) |
| `--tema-yerel-eclub-yardimci-metin-40` | `#687f98` | :root, [data-tema="mavi"] | [app/tema.css:2208](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2208) |
| `--tema-yerel-eclub-cizgi-36` | `#d9e3ed` | :root, [data-tema="mavi"] | [app/tema.css:2209](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2209) |
| `--tema-yerel-eclub-yardimci-metin-41` | `#55708d` | :root, [data-tema="mavi"] | [app/tema.css:2210](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2210) |
| `--tema-yerel-eclub-cizgi-37` | `#dce8f2` | :root, [data-tema="mavi"] | [app/tema.css:2211](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2211) |
| `--tema-yerel-eclub-sayfa-zemini-19` | `#f2f6fa` | :root, [data-tema="mavi"] | [app/tema.css:2212](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2212) |
| `--tema-yerel-eclub-yardimci-metin-42` | `#71839a` | :root, [data-tema="mavi"] | [app/tema.css:2213](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2213) |
| `--tema-yerel-eclub-cizgi-38` | `#e8edf3` | :root, [data-tema="mavi"] | [app/tema.css:2214](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2214) |
| `--tema-yerel-eclub-yardimci-metin-43` | `#536982` | :root, [data-tema="mavi"] | [app/tema.css:2215](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2215) |
| `--tema-yerel-eclub-cizgi-39` | `#edf1f6` | :root, [data-tema="mavi"] | [app/tema.css:2216](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2216) |
| `--tema-yerel-eclub-ana-metin-26` | `var(--color-gray-700)` | :root, [data-tema="mavi"] | [app/tema.css:2217](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2217) |
| `--tema-yerel-eczanem-cizgi-01` | `#a9c9e5` | :root, [data-tema="mavi"] | [app/tema.css:2218](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2218) |
| `--tema-yerel-eczanem-eylem-metin-01` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:2219](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2219) |
| `--tema-yerel-eczanem-cizgi-02` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:2220](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2220) |
| `--tema-yerel-eczanem-secim-zemin-01` | `#edf6fd` | :root, [data-tema="mavi"] | [app/tema.css:2221](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2221) |
| `--tema-yerel-eczanem-eylem-metin-02` | `#1d69ad` | :root, [data-tema="mavi"] | [app/tema.css:2222](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2222) |
| `--tema-yerel-eczanem-cizgi-03` | `#edf2f7` | :root, [data-tema="mavi"] | [app/tema.css:2223](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2223) |
| `--tema-yerel-eczanem-yardimci-metin-01` | `#7b8da5` | :root, [data-tema="mavi"] | [app/tema.css:2224](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2224) |
| `--tema-yerel-eczanem-cizgi-04` | `#e8eef5` | :root, [data-tema="mavi"] | [app/tema.css:2225](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2225) |
| `--tema-yerel-eczanem-ana-metin-01` | `#405976` | :root, [data-tema="mavi"] | [app/tema.css:2226](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2226) |
| `--tema-yerel-eczanem-eylem-zemin-01` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:2227](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2227) |
| `--tema-yerel-eczanem-eylem-zemin-02` | `#1d69ad` | :root, [data-tema="mavi"] | [app/tema.css:2228](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2228) |
| `--tema-yerel-eczanem-sayfa-zemini-01` | `#f3f6f9` | :root, [data-tema="mavi"] | [app/tema.css:2229](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2229) |
| `--tema-yerel-eczanem-yardimci-metin-02` | `#718198` | :root, [data-tema="mavi"] | [app/tema.css:2230](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2230) |
| `--tema-yerel-eczanem-cizgi-05` | `#dfe7f1` | :root, [data-tema="mavi"] | [app/tema.css:2231](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2231) |
| `--tema-yerel-eczanem-sayfa-zemini-02` | `#f2f7fc` | :root, [data-tema="mavi"] | [app/tema.css:2232](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2232) |
| `--tema-yerel-eczanem-cizgi-06` | `var(--color-gray-200)` | :root, [data-tema="mavi"] | [app/tema.css:2233](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2233) |
| `--tema-yerel-eczanem-yardimci-metin-03` | `var(--color-gray-400)` | :root, [data-tema="mavi"] | [app/tema.css:2234](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2234) |
| `--tema-yerel-eczanem-ana-metin-02` | `var(--color-gray-900)` | :root, [data-tema="mavi"] | [app/tema.css:2235](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2235) |
| `--tema-yerel-eczanem-yardimci-metin-04` | `var(--color-gray-500)` | :root, [data-tema="mavi"] | [app/tema.css:2236](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2236) |
| `--tema-yerel-eczanem-odak-01` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:2237](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2237) |
| `--tema-yerel-eczanem-secim-zemin-02` | `#e8f3fc` | :root, [data-tema="mavi"] | [app/tema.css:2238](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2238) |
| `--tema-yerel-eczanem-sayfa-zemini-03` | `#f8fbff` | :root, [data-tema="mavi"] | [app/tema.css:2239](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2239) |
| `--tema-yerel-eczanem-ana-metin-03` | `#203653` | :root, [data-tema="mavi"] | [app/tema.css:2240](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2240) |
| `--tema-yerel-eczanem-sayfa-zemini-04` | `#f5f8fc` | :root, [data-tema="mavi"] | [app/tema.css:2241](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2241) |
| `--tema-yerel-eczanem-yardimci-metin-05` | `#8090a4` | :root, [data-tema="mavi"] | [app/tema.css:2242](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2242) |
| `--tema-yerel-eczanem-yardimci-metin-06` | `#526780` | :root, [data-tema="mavi"] | [app/tema.css:2243](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2243) |
| `--tema-yerel-eczanem-secim-zemin-03` | `#d9eaf9` | :root, [data-tema="mavi"] | [app/tema.css:2244](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2244) |
| `--tema-yerel-eczanem-sayfa-zemini-05` | `var(--color-gray-50)` | :root, [data-tema="mavi"] | [app/tema.css:2245](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2245) |
| `--tema-yerel-eczanem-ana-metin-04` | `#172b4d` | :root, [data-tema="mavi"] | [app/tema.css:2246](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2246) |
| `--tema-yerel-eczanem-yardimci-metin-07` | `#6b7f9b` | :root, [data-tema="mavi"] | [app/tema.css:2247](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2247) |
| `--tema-yerel-eczanem-sayfa-zemini-06` | `#f7f9fc` | :root, [data-tema="mavi"] | [app/tema.css:2248](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2248) |
| `--tema-yerel-eczanem-eylem-metin-03` | `#4f7fb7` | :root, [data-tema="mavi"] | [app/tema.css:2249](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2249) |
| `--tema-yerel-eczanem-yardimci-metin-08` | `#7b8da3` | :root, [data-tema="mavi"] | [app/tema.css:2250](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2250) |
| `--tema-yerel-eczanem-yardimci-metin-09` | `#8392a5` | :root, [data-tema="mavi"] | [app/tema.css:2251](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2251) |
| `--tema-yerel-eczanem-yardimci-metin-10` | `#8796a8` | :root, [data-tema="mavi"] | [app/tema.css:2252](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2252) |
| `--tema-yerel-eczanem-cizgi-07` | `#e7edf4` | :root, [data-tema="mavi"] | [app/tema.css:2253](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2253) |
| `--tema-yerel-eczanem-ana-metin-05` | `#263e5b` | :root, [data-tema="mavi"] | [app/tema.css:2254](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2254) |
| `--tema-yerel-eczanem-yardimci-metin-11` | `#8090a3` | :root, [data-tema="mavi"] | [app/tema.css:2255](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2255) |
| `--tema-yerel-eczanem-yardimci-metin-12` | `#71859d` | :root, [data-tema="mavi"] | [app/tema.css:2256](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2256) |
| `--tema-yerel-eczanem-cizgi-08` | `#d7e4ef` | :root, [data-tema="mavi"] | [app/tema.css:2257](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2257) |
| `--tema-yerel-eczanem-cizgi-09` | `#3589d8` | :root, [data-tema="mavi"] | [app/tema.css:2258](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2258) |
| `--tema-yerel-eczanem-secim-zemin-04` | `#eef5fb` | :root, [data-tema="mavi"] | [app/tema.css:2259](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2259) |
| `--tema-yerel-eczanem-yardimci-metin-13` | `#6f97ba` | :root, [data-tema="mavi"] | [app/tema.css:2260](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2260) |
| `--tema-yerel-eczanem-ana-metin-06` | `#40556d` | :root, [data-tema="mavi"] | [app/tema.css:2261](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2261) |
| `--tema-yerel-eczanem-yardimci-metin-14` | `#8a99aa` | :root, [data-tema="mavi"] | [app/tema.css:2262](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2262) |
| `--tema-yerel-eczanem-cizgi-10` | `#d7e1eb` | :root, [data-tema="mavi"] | [app/tema.css:2263](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2263) |
| `--tema-yerel-eczanem-sayfa-zemini-07` | `#fbfcfe` | :root, [data-tema="mavi"] | [app/tema.css:2264](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2264) |
| `--tema-yerel-eczanem-sayfa-zemini-08` | `#f6f9fc` | :root, [data-tema="mavi"] | [app/tema.css:2265](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2265) |
| `--tema-yerel-eczanem-eylem-zemin-03` | `#172b4d` | :root, [data-tema="mavi"] | [app/tema.css:2266](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2266) |
| `--tema-yerel-eczanem-golge-01` | `rgba(23,43,77,0.3)` | :root, [data-tema="mavi"] | [app/tema.css:2267](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2267) |
| `--tema-yerel-eczanem-yardimci-metin-15` | `#b8cade` | :root, [data-tema="mavi"] | [app/tema.css:2268](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2268) |
| `--tema-yerel-eczanem-yardimci-metin-16` | `#d5e2f0` | :root, [data-tema="mavi"] | [app/tema.css:2269](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2269) |
| `--tema-yerel-eczanem-secim-zemin-05` | `#edf5fc` | :root, [data-tema="mavi"] | [app/tema.css:2270](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2270) |
| `--tema-yerel-eczanem-eylem-zemin-04` | `#0f2746` | :root, [data-tema="mavi"] | [app/tema.css:2271](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2271) |
| `--tema-yerel-eczanem-golge-02` | `rgba(13,40,70,0.2)` | :root, [data-tema="mavi"] | [app/tema.css:2272](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2272) |
| `--tema-yerel-eczanem-cizgi-11` | `#e6edf4` | :root, [data-tema="mavi"] | [app/tema.css:2273](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2273) |
| `--tema-yerel-eczanem-yardimci-metin-17` | `#74869a` | :root, [data-tema="mavi"] | [app/tema.css:2274](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2274) |
| `--tema-yerel-eczanem-sayfa-zemini-09` | `#f1f5f9` | :root, [data-tema="mavi"] | [app/tema.css:2275](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2275) |
| `--tema-yerel-eczanem-ana-metin-07` | `#49627e` | :root, [data-tema="mavi"] | [app/tema.css:2276](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2276) |
| `--tema-yerel-eczanem-cizgi-12` | `#9fc7e8` | :root, [data-tema="mavi"] | [app/tema.css:2277](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2277) |
| `--tema-yerel-eczanem-golge-03` | `#cfe5f744` | :root, [data-tema="mavi"] | [app/tema.css:2278](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2278) |
| `--tema-yerel-eczanem-cizgi-13` | `#e0e8f0` | :root, [data-tema="mavi"] | [app/tema.css:2279](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2279) |
| `--tema-yerel-eczanem-sayfa-zemini-10` | `#fbfdff` | :root, [data-tema="mavi"] | [app/tema.css:2280](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2280) |
| `--tema-yerel-eczanem-ana-metin-08` | `#314b67` | :root, [data-tema="mavi"] | [app/tema.css:2281](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2281) |
| `--tema-yerel-eczanem-yardimci-metin-18` | `#879aaf` | :root, [data-tema="mavi"] | [app/tema.css:2282](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2282) |
| `--tema-yerel-eczanem-yardimci-metin-19` | `#8da0b2` | :root, [data-tema="mavi"] | [app/tema.css:2283](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2283) |
| `--tema-yerel-eczanem-yardimci-metin-20` | `#657b93` | :root, [data-tema="mavi"] | [app/tema.css:2284](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2284) |
| `--tema-yerel-eczanem-cizgi-14` | `#e1e9f2` | :root, [data-tema="mavi"] | [app/tema.css:2285](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2285) |
| `--tema-yerel-eczanem-cizgi-15` | `#d8e4ef` | :root, [data-tema="mavi"] | [app/tema.css:2286](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2286) |
| `--tema-yerel-eczanem-ana-metin-09` | `#334d67` | :root, [data-tema="mavi"] | [app/tema.css:2287](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2287) |
| `--tema-yerel-eczanem-cizgi-16` | `#e3e9ef` | :root, [data-tema="mavi"] | [app/tema.css:2288](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2288) |
| `--tema-yerel-eczanem-sayfa-zemini-11` | `#f8fafc` | :root, [data-tema="mavi"] | [app/tema.css:2289](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2289) |
| `--tema-yerel-eczanem-secim-zemin-06` | `#f0f8ff` | :root, [data-tema="mavi"] | [app/tema.css:2290](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2290) |
| `--tema-yerel-eczanem-cizgi-17` | `#dce6ef` | :root, [data-tema="mavi"] | [app/tema.css:2291](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2291) |
| `--tema-yerel-eczanem-sayfa-zemini-12` | `#f7fbff` | :root, [data-tema="mavi"] | [app/tema.css:2292](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2292) |
| `--tema-yerel-eczanem-ana-metin-10` | `#2d4660` | :root, [data-tema="mavi"] | [app/tema.css:2293](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2293) |
| `--tema-yerel-eczanem-yardimci-metin-21` | `#8294a7` | :root, [data-tema="mavi"] | [app/tema.css:2294](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2294) |
| `--tema-yerel-eczanem-cizgi-18` | `#e2ecf5` | :root, [data-tema="mavi"] | [app/tema.css:2295](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2295) |
| `--tema-yerel-eczanem-sayfa-zemini-13` | `#f4f8fc` | :root, [data-tema="mavi"] | [app/tema.css:2296](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2296) |
| `--tema-yerel-eczanem-yardimci-metin-22` | `#607b96` | :root, [data-tema="mavi"] | [app/tema.css:2297](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2297) |
| `--tema-yerel-eczanem-secim-zemin-07` | `#edf3f8` | :root, [data-tema="mavi"] | [app/tema.css:2298](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2298) |
| `--tema-yerel-eczanem-yardimci-metin-23` | `#71869d` | :root, [data-tema="mavi"] | [app/tema.css:2299](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2299) |
| `--tema-yerel-eczanem-cizgi-19` | `#e0e9f1` | :root, [data-tema="mavi"] | [app/tema.css:2300](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2300) |
| `--tema-yerel-eczanem-yardimci-metin-24` | `#71849b` | :root, [data-tema="mavi"] | [app/tema.css:2301](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2301) |
| `--tema-yerel-eczanem-ana-metin-11` | `#263e56` | :root, [data-tema="mavi"] | [app/tema.css:2302](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2302) |
| `--tema-yerel-eczanem-ana-metin-12` | `#4d6680` | :root, [data-tema="mavi"] | [app/tema.css:2303](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2303) |
| `--tema-yerel-eczanem-yardimci-metin-25` | `#7990a6` | :root, [data-tema="mavi"] | [app/tema.css:2304](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2304) |
| `--tema-yerel-eczanem-ana-metin-13` | `var(--color-gray-700)` | :root, [data-tema="mavi"] | [app/tema.css:2305](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2305) |
| `--tema-yerel-eczanem-cizgi-20` | `var(--color-gray-100)` | :root, [data-tema="mavi"] | [app/tema.css:2306](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2306) |
| `--tema-yerel-eczanem-yardimci-metin-26` | `#60758c` | :root, [data-tema="mavi"] | [app/tema.css:2307](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2307) |
| `--tema-yerel-eczanem-cizgi-21` | `#edf1f5` | :root, [data-tema="mavi"] | [app/tema.css:2308](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2308) |
| `--tema-yerel-eczanem-ana-metin-14` | `#30475f` | :root, [data-tema="mavi"] | [app/tema.css:2309](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2309) |
| `--tema-yerel-eczanem-cizgi-22` | `#cfe1ef` | :root, [data-tema="mavi"] | [app/tema.css:2310](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2310) |
| `--tema-yerel-eczanem-secim-zemin-08` | `#f2f8fd` | :root, [data-tema="mavi"] | [app/tema.css:2311](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2311) |
| `--tema-yerel-eczanem-yardimci-metin-27` | `#54728e` | :root, [data-tema="mavi"] | [app/tema.css:2312](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2312) |
| `--tema-yerel-eczanem-yardimci-metin-28` | `#6f879c` | :root, [data-tema="mavi"] | [app/tema.css:2313](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2313) |
| `--tema-yerel-eczanem-cizgi-23` | `#bcd8ee` | :root, [data-tema="mavi"] | [app/tema.css:2314](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2314) |
| `--tema-yerel-eczanem-sayfa-zemini-14` | `#f5f9fc` | :root, [data-tema="mavi"] | [app/tema.css:2315](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2315) |
| `--tema-yerel-eczanem-eylem-metin-04` | `#286d9f` | :root, [data-tema="mavi"] | [app/tema.css:2316](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2316) |
| `--tema-yerel-eczanem-cizgi-24` | `#dce8f2` | :root, [data-tema="mavi"] | [app/tema.css:2317](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2317) |
| `--tema-yerel-eczanem-eylem-metin-05` | `#2b668f` | :root, [data-tema="mavi"] | [app/tema.css:2318](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2318) |
| `--tema-yerel-hesap-sayfa-zemini-01` | `var(--color-gray-50)` | :root, [data-tema="mavi"] | [app/tema.css:2319](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2319) |
| `--tema-yerel-hesap-yardimci-metin-01` | `var(--color-gray-400)` | :root, [data-tema="mavi"] | [app/tema.css:2320](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2320) |
| `--tema-yerel-hesap-ana-metin-01` | `var(--color-gray-900)` | :root, [data-tema="mavi"] | [app/tema.css:2321](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2321) |
| `--tema-yerel-hesap-cizgi-01` | `var(--color-gray-200)` | :root, [data-tema="mavi"] | [app/tema.css:2322](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2322) |
| `--tema-yerel-hesap-ana-metin-02` | `var(--color-gray-600)` | :root, [data-tema="mavi"] | [app/tema.css:2323](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2323) |
| `--tema-yerel-hesap-yardimci-metin-02` | `var(--color-gray-500)` | :root, [data-tema="mavi"] | [app/tema.css:2324](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2324) |
| `--tema-yerel-hesap-cizgi-02` | `var(--color-blue-300)` | :root, [data-tema="mavi"] | [app/tema.css:2325](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2325) |
| `--tema-yerel-hesap-eylem-zemin-01` | `var(--color-blue-400)` | :root, [data-tema="mavi"] | [app/tema.css:2326](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2326) |
| `--tema-yerel-hesap-eylem-zemin-02` | `#56aeff` | :root, [data-tema="mavi"] | [app/tema.css:2327](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2327) |
| `--tema-yerel-hesap-cizgi-03` | `var(--color-gray-100)` | :root, [data-tema="mavi"] | [app/tema.css:2328](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2328) |
| `--tema-yerel-hesap-cizgi-04` | `var(--color-gray-50)` | :root, [data-tema="mavi"] | [app/tema.css:2329](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2329) |
| `--tema-yerel-hesap-secim-zemin-01` | `var(--color-blue-50)` | :root, [data-tema="mavi"] | [app/tema.css:2330](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2330) |
| `--tema-yerel-hesap-eylem-metin-01` | `var(--color-blue-700)` | :root, [data-tema="mavi"] | [app/tema.css:2331](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2331) |
| `--tema-yerel-hesap-cizgi-05` | `var(--color-blue-100)` | :root, [data-tema="mavi"] | [app/tema.css:2332](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2332) |
| `--tema-yerel-hesap-yardimci-metin-03` | `var(--color-gray-300)` | :root, [data-tema="mavi"] | [app/tema.css:2333](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2333) |
| `--tema-yerel-hesap-vurgu-metin-01` | `#bc2d0d` | :root, [data-tema="mavi"] | [app/tema.css:2334](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2334) |
| `--tema-yerel-uretim-sayfa-zemini-01` | `var(--color-gray-50)` | :root, [data-tema="mavi"] | [app/tema.css:2335](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2335) |
| `--tema-yerel-uretim-yardimci-metin-01` | `var(--color-gray-500)` | :root, [data-tema="mavi"] | [app/tema.css:2336](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2336) |
| `--tema-yerel-uretim-ana-metin-01` | `var(--color-gray-900)` | :root, [data-tema="mavi"] | [app/tema.css:2337](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2337) |
| `--tema-yerel-uretim-cizgi-01` | `var(--color-gray-200)` | :root, [data-tema="mavi"] | [app/tema.css:2338](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2338) |
| `--tema-yerel-uretim-ana-metin-02` | `var(--color-gray-600)` | :root, [data-tema="mavi"] | [app/tema.css:2339](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2339) |
| `--tema-yerel-uretim-ana-metin-03` | `var(--color-gray-700)` | :root, [data-tema="mavi"] | [app/tema.css:2340](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2340) |
| `--tema-yerel-uretim-yardimci-metin-02` | `var(--color-gray-400)` | :root, [data-tema="mavi"] | [app/tema.css:2341](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2341) |
| `--tema-yerel-uretim-cizgi-02` | `var(--color-gray-50)` | :root, [data-tema="mavi"] | [app/tema.css:2342](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2342) |
| `--tema-yerel-uretim-yardimci-metin-03` | `#9ca3af` | :root, [data-tema="mavi"] | [app/tema.css:2343](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2343) |
| `--tema-yerel-uretim-cizgi-03` | `var(--color-gray-100)` | :root, [data-tema="mavi"] | [app/tema.css:2344](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2344) |
| `--tema-yerel-ortak-sayfa-ana-metin-01` | `#172b4d` | :root, [data-tema="mavi"] | [app/tema.css:2345](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2345) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-01` | `#6b7f9b` | :root, [data-tema="mavi"] | [app/tema.css:2346](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2346) |
| `--tema-yerel-ortak-sayfa-golge-01` | `rgba(31,55,90,0.035)` | :root, [data-tema="mavi"] | [app/tema.css:2347](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2347) |
| `--tema-yerel-ortak-sayfa-odak-01` | `#b7d7f2` | :root, [data-tema="mavi"] | [app/tema.css:2348](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2348) |
| `--tema-yerel-ortak-sayfa-cizgi-01` | `#dfe7f1` | :root, [data-tema="mavi"] | [app/tema.css:2349](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2349) |
| `--tema-yerel-ortak-sayfa-ana-metin-02` | `#243957` | :root, [data-tema="mavi"] | [app/tema.css:2350](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2350) |
| `--tema-yerel-ortak-sayfa-eylem-zemin-01` | `#2f7fc7` | :root, [data-tema="mavi"] | [app/tema.css:2351](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2351) |
| `--tema-yerel-ortak-sayfa-eylem-zemin-02` | `#256daf` | :root, [data-tema="mavi"] | [app/tema.css:2352](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2352) |
| `--tema-yerel-ortak-sayfa-ana-metin-03` | `#203653` | :root, [data-tema="mavi"] | [app/tema.css:2353](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2353) |
| `--tema-yerel-ortak-sayfa-cizgi-02` | `#dce8f4` | :root, [data-tema="mavi"] | [app/tema.css:2354](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2354) |
| `--tema-yerel-ortak-sayfa-sayfa-zemini-01` | `#f3f7fb` | :root, [data-tema="mavi"] | [app/tema.css:2355](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2355) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-02` | `#55708d` | :root, [data-tema="mavi"] | [app/tema.css:2356](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2356) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-03` | `#8090a4` | :root, [data-tema="mavi"] | [app/tema.css:2357](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2357) |
| `--tema-yerel-ortak-sayfa-cizgi-03` | `#edf1f6` | :root, [data-tema="mavi"] | [app/tema.css:2358](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2358) |
| `--tema-yerel-ortak-sayfa-sayfa-zemini-02` | `#f2f5f9` | :root, [data-tema="mavi"] | [app/tema.css:2359](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2359) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-04` | `#718198` | :root, [data-tema="mavi"] | [app/tema.css:2360](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2360) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-05` | `#7b8ca5` | :root, [data-tema="mavi"] | [app/tema.css:2361](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2361) |
| `--tema-yerel-ortak-sayfa-cizgi-04` | `#e5ecf4` | :root, [data-tema="mavi"] | [app/tema.css:2362](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2362) |
| `--tema-yerel-ortak-sayfa-cizgi-05` | `#e0e8f1` | :root, [data-tema="mavi"] | [app/tema.css:2363](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2363) |
| `--tema-yerel-ortak-sayfa-sayfa-zemini-03` | `#fbfcfe` | :root, [data-tema="mavi"] | [app/tema.css:2364](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2364) |
| `--tema-yerel-ortak-sayfa-secim-zemin-01` | `#d9e8f7` | :root, [data-tema="mavi"] | [app/tema.css:2365](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2365) |
| `--tema-yerel-ortak-sayfa-eylem-metin-01` | `#2f7fc7` | :root, [data-tema="mavi"] | [app/tema.css:2366](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2366) |
| `--tema-yerel-ortak-sayfa-ana-metin-04` | `#263e5b` | :root, [data-tema="mavi"] | [app/tema.css:2367](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2367) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-06` | `#7a8da5` | :root, [data-tema="mavi"] | [app/tema.css:2368](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2368) |
| `--tema-yerel-ortak-sayfa-secim-zemin-02` | `#eef6ff` | :root, [data-tema="mavi"] | [app/tema.css:2369](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2369) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-07` | `#7d8fa5` | :root, [data-tema="mavi"] | [app/tema.css:2370](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2370) |
| `--tema-yerel-ortak-sayfa-sayfa-zemini-04` | `#f7f9fc` | :root, [data-tema="mavi"] | [app/tema.css:2371](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2371) |
| `--tema-yerel-ortak-sayfa-eylem-zemin-03` | `#10233a` | :root, [data-tema="mavi"] | [app/tema.css:2372](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2372) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-08` | `#71859d` | :root, [data-tema="mavi"] | [app/tema.css:2373](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2373) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-09` | `#8a9bb0` | :root, [data-tema="mavi"] | [app/tema.css:2374](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2374) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-10` | `#536a84` | :root, [data-tema="mavi"] | [app/tema.css:2375](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2375) |
| `--tema-yerel-ortak-sayfa-ana-metin-05` | `#2d4562` | :root, [data-tema="mavi"] | [app/tema.css:2376](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2376) |
| `--tema-yerel-ortak-sayfa-ana-metin-06` | `#405873` | :root, [data-tema="mavi"] | [app/tema.css:2377](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2377) |
| `--tema-yerel-ortak-sayfa-ana-metin-07` | `var(--color-gray-900)` | :root, [data-tema="mavi"] | [app/tema.css:2378](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2378) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-11` | `var(--color-gray-500)` | :root, [data-tema="mavi"] | [app/tema.css:2379](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2379) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-12` | `var(--color-gray-400)` | :root, [data-tema="mavi"] | [app/tema.css:2380](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2380) |
| `--tema-yerel-ortak-sayfa-sayfa-zemini-05` | `var(--color-gray-200)` | :root, [data-tema="mavi"] | [app/tema.css:2381](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2381) |
| `--tema-yerel-ortak-sayfa-sayfa-zemini-06` | `var(--color-gray-50)` | :root, [data-tema="mavi"] | [app/tema.css:2382](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2382) |
| `--tema-yerel-ortak-sayfa-cizgi-06` | `var(--color-gray-200)` | :root, [data-tema="mavi"] | [app/tema.css:2383](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2383) |
| `--tema-yerel-ortak-sayfa-ana-metin-08` | `var(--color-gray-600)` | :root, [data-tema="mavi"] | [app/tema.css:2384](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2384) |
| `--tema-yerel-hesap-cizgi-06` | `#56aeff` | :root, [data-tema="mavi"] | [app/tema.css:2385](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2385) |
| `--tema-yerel-hesap-secim-zemin-02` | `#b5d4f4` | :root, [data-tema="mavi"] | [app/tema.css:2386](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2386) |
| `--tema-yerel-hesap-eylem-metin-02` | `#1d4ed8` | :root, [data-tema="mavi"] | [app/tema.css:2387](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2387) |
| `--tema-yerel-hesap-sayfa-zemini-02` | `#9ca3af` | :root, [data-tema="mavi"] | [app/tema.css:2388](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2388) |
| `--tema-yerel-hesap-secim-zemin-03` | `#eff6ff` | :root, [data-tema="mavi"] | [app/tema.css:2389](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2389) |
| `--tema-yerel-hesap-eylem-metin-03` | `#56aeff` | :root, [data-tema="mavi"] | [app/tema.css:2390](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2390) |
| `--tema-yerel-hesap-sayfa-zemini-03` | `var(--color-gray-100)` | :root, [data-tema="mavi"] | [app/tema.css:2391](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2391) |
| `--tema-yerel-rapor-cizgi-01` | `#e6ecf3` | :root, [data-tema="mavi"] | [app/tema.css:2392](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2392) |
| `--tema-yerel-rapor-eylem-metin-01` | `#4881b0` | :root, [data-tema="mavi"] | [app/tema.css:2393](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2393) |
| `--tema-yerel-rapor-secim-zemin-01` | `#edf6fd` | :root, [data-tema="mavi"] | [app/tema.css:2394](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2394) |
| `--tema-yerel-rapor-eylem-metin-02` | `#217bc3` | :root, [data-tema="mavi"] | [app/tema.css:2395](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2395) |
| `--tema-yerel-rapor-ana-metin-01` | `#40556d` | :root, [data-tema="mavi"] | [app/tema.css:2396](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2396) |
| `--tema-yerel-rapor-yardimci-metin-01` | `#91a0b1` | :root, [data-tema="mavi"] | [app/tema.css:2397](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2397) |
| `--tema-yerel-rapor-yardimci-metin-02` | `#6f91ad` | :root, [data-tema="mavi"] | [app/tema.css:2398](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2398) |
| `--tema-yerel-rapor-sayfa-zemini-01` | `#f8fbfe` | :root, [data-tema="mavi"] | [app/tema.css:2399](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2399) |
| `--tema-yerel-rapor-cizgi-02` | `#dfebf5` | :root, [data-tema="mavi"] | [app/tema.css:2400](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2400) |
| `--tema-yerel-rapor-secim-zemin-02` | `#eef7ff` | :root, [data-tema="mavi"] | [app/tema.css:2401](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2401) |
| `--tema-yerel-rapor-yardimci-metin-03` | `#8293a7` | :root, [data-tema="mavi"] | [app/tema.css:2402](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2402) |
| `--tema-yerel-rapor-ana-metin-02` | `#2b4059` | :root, [data-tema="mavi"] | [app/tema.css:2403](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2403) |
| `--tema-yerel-rapor-eylem-metin-03` | `#4385b8` | :root, [data-tema="mavi"] | [app/tema.css:2404](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2404) |
| `--tema-yerel-rapor-yardimci-metin-04` | `#7c8fa4` | :root, [data-tema="mavi"] | [app/tema.css:2405](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2405) |
| `--tema-yerel-rapor-cizgi-03` | `#dfe8f1` | :root, [data-tema="mavi"] | [app/tema.css:2406](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2406) |
| `--tema-yerel-rapor-yardimci-metin-05` | `#7d8ea2` | :root, [data-tema="mavi"] | [app/tema.css:2407](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2407) |
| `--tema-yerel-rapor-sayfa-zemini-02` | `#f4f8fc` | :root, [data-tema="mavi"] | [app/tema.css:2408](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2408) |
| `--tema-yerel-rapor-cizgi-04` | `#edf1f5` | :root, [data-tema="mavi"] | [app/tema.css:2409](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2409) |
| `--tema-yerel-rapor-ana-metin-03` | `#30475f` | :root, [data-tema="mavi"] | [app/tema.css:2410](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2410) |
| `--tema-yerel-rapor-cizgi-05` | `#e5edf5` | :root, [data-tema="mavi"] | [app/tema.css:2411](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2411) |
| `--tema-yerel-rapor-cizgi-06` | `#dce5ef` | :root, [data-tema="mavi"] | [app/tema.css:2412](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2412) |
| `--tema-yerel-rapor-cizgi-07` | `#e5ebf2` | :root, [data-tema="mavi"] | [app/tema.css:2413](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2413) |
| `--tema-yerel-rapor-ana-metin-04` | `#466078` | :root, [data-tema="mavi"] | [app/tema.css:2414](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2414) |
| `--tema-yerel-rapor-sayfa-zemini-03` | `#f8fafc` | :root, [data-tema="mavi"] | [app/tema.css:2415](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2415) |
| `--tema-yerel-rapor-cizgi-08` | `#cfdde9` | :root, [data-tema="mavi"] | [app/tema.css:2416](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2416) |
| `--tema-yerel-rapor-golge-01` | `rgba(38, 70, 105, 0.07)` | :root, [data-tema="mavi"] | [app/tema.css:2417](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2417) |
| `--tema-yerel-rapor-yardimci-metin-06` | `#74869b` | :root, [data-tema="mavi"] | [app/tema.css:2418](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2418) |
| `--tema-yerel-rapor-eylem-metin-04` | `#247dc5` | :root, [data-tema="mavi"] | [app/tema.css:2419](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2419) |
| `--tema-yerel-rapor-cizgi-09` | `#e2eaf2` | :root, [data-tema="mavi"] | [app/tema.css:2420](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2420) |
| `--tema-yerel-rapor-sayfa-zemini-04` | `#f7fafd` | :root, [data-tema="mavi"] | [app/tema.css:2421](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2421) |
| `--tema-yerel-rapor-ana-metin-05` | `#294159` | :root, [data-tema="mavi"] | [app/tema.css:2422](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2422) |
| `--tema-yerel-rapor-cizgi-10` | `#dce7f1` | :root, [data-tema="mavi"] | [app/tema.css:2423](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2423) |
| `--tema-yerel-rapor-secim-zemin-03` | `#f2f8fd` | :root, [data-tema="mavi"] | [app/tema.css:2424](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2424) |
| `--tema-yerel-rapor-dekoratif-zemin-01` | `#2d86cc` | :root, [data-tema="mavi"] | [app/tema.css:2425](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2425) |
| `--tema-yerel-rapor-dekoratif-zemin-02` | `#58a6df` | :root, [data-tema="mavi"] | [app/tema.css:2426](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2426) |
| `--tema-yerel-rapor-eylem-metin-05` | `#277fc5` | :root, [data-tema="mavi"] | [app/tema.css:2427](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2427) |
| `--tema-yerel-rapor-secim-zemin-04` | `#eaf5ff` | :root, [data-tema="mavi"] | [app/tema.css:2428](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2428) |
| `--tema-yerel-rapor-cizgi-11` | `#e4edf5` | :root, [data-tema="mavi"] | [app/tema.css:2429](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2429) |
| `--tema-yerel-rapor-cizgi-12` | `#e6edf4` | :root, [data-tema="mavi"] | [app/tema.css:2430](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2430) |
| `--tema-yerel-rapor-yardimci-metin-07` | `var(--color-gray-500)` | :root, [data-tema="mavi"] | [app/tema.css:2431](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2431) |
| `--tema-yerel-rapor-ana-metin-06` | `#20324c` | :root, [data-tema="mavi"] | [app/tema.css:2432](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2432) |
| `--tema-yerel-rapor-yardimci-metin-08` | `#8190a3` | :root, [data-tema="mavi"] | [app/tema.css:2433](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2433) |
| `--tema-yerel-rapor-eylem-metin-06` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:2434](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2434) |
| `--tema-yerel-rapor-cizgi-13` | `#e7edf4` | :root, [data-tema="mavi"] | [app/tema.css:2435](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2435) |
| `--tema-yerel-rapor-yardimci-metin-09` | `#7c8da2` | :root, [data-tema="mavi"] | [app/tema.css:2436](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2436) |
| `--tema-yerel-rapor-eylem-zemin-01` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:2437](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2437) |
| `--tema-yerel-rapor-yardimci-metin-10` | `#7890aa` | :root, [data-tema="mavi"] | [app/tema.css:2438](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2438) |
| `--tema-yerel-rapor-ana-metin-07` | `#10213d` | :root, [data-tema="mavi"] | [app/tema.css:2439](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2439) |
| `--tema-yerel-rapor-yardimci-metin-11` | `#78889d` | :root, [data-tema="mavi"] | [app/tema.css:2440](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2440) |
| `--tema-yerel-rapor-cizgi-14` | `#e3eaf2` | :root, [data-tema="mavi"] | [app/tema.css:2441](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2441) |
| `--tema-yerel-rapor-ana-metin-08` | `#344a65` | :root, [data-tema="mavi"] | [app/tema.css:2442](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2442) |
| `--tema-yerel-rapor-yardimci-metin-12` | `#8795a8` | :root, [data-tema="mavi"] | [app/tema.css:2443](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2443) |
| `--tema-yerel-rapor-cizgi-15` | `#d8e2ec` | :root, [data-tema="mavi"] | [app/tema.css:2444](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2444) |
| `--tema-yerel-rapor-yardimci-metin-13` | `#7b8ca5` | :root, [data-tema="mavi"] | [app/tema.css:2445](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2445) |
| `--tema-yerel-rapor-cizgi-16` | `#e8edf3` | :root, [data-tema="mavi"] | [app/tema.css:2446](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2446) |
| `--tema-yerel-rapor-sayfa-zemini-05` | `#f6f8fb` | :root, [data-tema="mavi"] | [app/tema.css:2447](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2447) |
| `--tema-yerel-rapor-sayfa-zemini-06` | `#edf1f5` | :root, [data-tema="mavi"] | [app/tema.css:2448](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2448) |
| `--tema-yerel-rapor-dekoratif-zemin-03` | `#56aeff` | :root, [data-tema="mavi"] | [app/tema.css:2449](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2449) |
| `--tema-yerel-rapor-dekoratif-zemin-04` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:2450](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2450) |
| `--tema-yerel-rapor-ana-metin-09` | `#52647c` | :root, [data-tema="mavi"] | [app/tema.css:2451](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2451) |
| `--tema-yerel-rapor-yardimci-metin-14` | `#71859d` | :root, [data-tema="mavi"] | [app/tema.css:2452](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2452) |
| `--tema-yerel-rapor-yardimci-metin-15` | `#9bc5ea` | :root, [data-tema="mavi"] | [app/tema.css:2453](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2453) |
| `--tema-yerel-rapor-eylem-metin-07` | `#185f9e` | :root, [data-tema="mavi"] | [app/tema.css:2454](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2454) |
| `--tema-yerel-rapor-cizgi-17` | `#d7e4f1` | :root, [data-tema="mavi"] | [app/tema.css:2455](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2455) |
| `--tema-yerel-rapor-cizgi-18` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:2456](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2456) |
| `--tema-yerel-rapor-sayfa-zemini-07` | `#f3f8fd` | :root, [data-tema="mavi"] | [app/tema.css:2457](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2457) |
| `--tema-yerel-rapor-eylem-zemin-02` | `#10213d` | :root, [data-tema="mavi"] | [app/tema.css:2458](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2458) |
| `--tema-yerel-rapor-cizgi-19` | `#dfe8f2` | :root, [data-tema="mavi"] | [app/tema.css:2459](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2459) |
| `--tema-yerel-rapor-secim-zemin-05` | `#eef4fa` | :root, [data-tema="mavi"] | [app/tema.css:2460](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2460) |
| `--tema-yerel-rapor-ana-metin-10` | `#172943` | :root, [data-tema="mavi"] | [app/tema.css:2461](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2461) |
| `--tema-yerel-rapor-dekoratif-zemin-05` | `rgba(73, 160, 231, .11)` | :root, [data-tema="mavi"] | [app/tema.css:2462](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2462) |
| `--tema-yerel-rapor-sayfa-zemini-08` | `#f7faff` | :root, [data-tema="mavi"] | [app/tema.css:2463](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2463) |
| `--tema-yerel-rapor-sayfa-zemini-09` | `#f4f7fb` | :root, [data-tema="mavi"] | [app/tema.css:2464](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2464) |
| `--tema-yerel-rapor-eylem-metin-08` | `#3589d8` | :root, [data-tema="mavi"] | [app/tema.css:2465](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2465) |
| `--tema-yerel-rapor-cizgi-20` | `#dfe7f0` | :root, [data-tema="mavi"] | [app/tema.css:2466](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2466) |
| `--tema-yerel-rapor-golge-02` | `rgba(42, 73, 108, .05)` | :root, [data-tema="mavi"] | [app/tema.css:2467](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2467) |
| `--tema-yerel-rapor-yardimci-metin-16` | `#71839a` | :root, [data-tema="mavi"] | [app/tema.css:2468](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2468) |
| `--tema-yerel-rapor-secim-zemin-06` | `#eef6fd` | :root, [data-tema="mavi"] | [app/tema.css:2469](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2469) |
| `--tema-yerel-rapor-dekoratif-zemin-06` | `#328fdc` | :root, [data-tema="mavi"] | [app/tema.css:2470](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2470) |
| `--tema-yerel-rapor-golge-03` | `rgba(35, 122, 200, .22)` | :root, [data-tema="mavi"] | [app/tema.css:2471](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2471) |
| `--tema-yerel-rapor-cizgi-21` | `#e0e8f1` | :root, [data-tema="mavi"] | [app/tema.css:2472](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2472) |
| `--tema-yerel-rapor-golge-04` | `rgba(35, 68, 105, .055)` | :root, [data-tema="mavi"] | [app/tema.css:2473](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2473) |
| `--tema-yerel-rapor-secim-zemin-07` | `#edf7ff` | :root, [data-tema="mavi"] | [app/tema.css:2474](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2474) |
| `--tema-yerel-rapor-vurgu-metin-01` | `#bc2d0d` | :root, [data-tema="mavi"] | [app/tema.css:2475](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2475) |
| `--tema-yerel-rapor-cizgi-22` | `#e6edf5` | :root, [data-tema="mavi"] | [app/tema.css:2476](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2476) |
| `--tema-yerel-rapor-sayfa-zemini-10` | `#f9fcff` | :root, [data-tema="mavi"] | [app/tema.css:2477](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2477) |
| `--tema-yerel-rapor-cizgi-23` | `#dbeeff` | :root, [data-tema="mavi"] | [app/tema.css:2478](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2478) |
| `--tema-yerel-rapor-sayfa-zemini-11` | `#f9fcfa` | :root, [data-tema="mavi"] | [app/tema.css:2479](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2479) |
| `--tema-yerel-rapor-sayfa-zemini-12` | `#fbfaff` | :root, [data-tema="mavi"] | [app/tema.css:2480](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2480) |
| `--tema-yerel-rapor-sayfa-zemini-13` | `#fffdf8` | :root, [data-tema="mavi"] | [app/tema.css:2481](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2481) |
| `--tema-yerel-rapor-yardimci-metin-17` | `#5c7895` | :root, [data-tema="mavi"] | [app/tema.css:2482](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2482) |
| `--tema-yerel-rapor-ana-metin-11` | `#20344f` | :root, [data-tema="mavi"] | [app/tema.css:2483](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2483) |
| `--tema-yerel-rapor-yardimci-metin-18` | `#8a98aa` | :root, [data-tema="mavi"] | [app/tema.css:2484](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2484) |
| `--tema-yerel-rapor-cizgi-24` | `#dbe4ee` | :root, [data-tema="mavi"] | [app/tema.css:2485](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2485) |
| `--tema-yerel-rapor-yardimci-metin-19` | `#8494a8` | :root, [data-tema="mavi"] | [app/tema.css:2486](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2486) |
| `--tema-yerel-rapor-sayfa-zemini-14` | `#fafcff` | :root, [data-tema="mavi"] | [app/tema.css:2487](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2487) |
| `--tema-yerel-rapor-dekoratif-zemin-07` | `rgba(86, 174, 255, 0.1)` | :root, [data-tema="mavi"] | [app/tema.css:2488](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2488) |
| `--tema-yerel-rapor-sayfa-zemini-15` | `#f8fbff` | :root, [data-tema="mavi"] | [app/tema.css:2489](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2489) |
| `--tema-yerel-rapor-sayfa-zemini-16` | `#f5f7fa` | :root, [data-tema="mavi"] | [app/tema.css:2490](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2490) |
| `--tema-yerel-rapor-sayfa-zemini-17` | `#fbfcfe` | :root, [data-tema="mavi"] | [app/tema.css:2491](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2491) |
| `--tema-yerel-rapor-cizgi-25` | `rgba(148, 163, 184, 0.18)` | :root, [data-tema="mavi"] | [app/tema.css:2492](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2492) |
| `--tema-yerel-rapor-golge-05` | `rgba(36, 64, 98, 0.05)` | :root, [data-tema="mavi"] | [app/tema.css:2493](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2493) |
| `--tema-yerel-rapor-yardimci-metin-20` | `#718198` | :root, [data-tema="mavi"] | [app/tema.css:2494](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2494) |
| `--tema-yerel-rapor-sayfa-zemini-18` | `#f2f7fc` | :root, [data-tema="mavi"] | [app/tema.css:2495](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2495) |
| `--tema-yerel-rapor-golge-06` | `rgba(35, 122, 200, 0.22)` | :root, [data-tema="mavi"] | [app/tema.css:2496](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2496) |
| `--tema-yerel-rapor-dekoratif-zemin-08` | `rgba(86, 174, 255, 0.13)` | :root, [data-tema="mavi"] | [app/tema.css:2497](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2497) |
| `--tema-yerel-rapor-dekoratif-zemin-09` | `rgba(86, 174, 255, 0)` | :root, [data-tema="mavi"] | [app/tema.css:2498](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2498) |
| `--tema-yerel-rapor-sayfa-zemini-19` | `#f6f9fc` | :root, [data-tema="mavi"] | [app/tema.css:2499](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2499) |
| `--tema-yerel-rapor-sayfa-zemini-20` | `#f7f9fc` | :root, [data-tema="mavi"] | [app/tema.css:2500](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2500) |
| `--tema-yerel-rapor-yardimci-metin-21` | `#60738c` | :root, [data-tema="mavi"] | [app/tema.css:2501](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2501) |
| `--tema-yerel-rapor-secim-zemin-08` | `#edf6ff` | :root, [data-tema="mavi"] | [app/tema.css:2502](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2502) |
| `--tema-yerel-rapor-cizgi-26` | `#dbe5ef` | :root, [data-tema="mavi"] | [app/tema.css:2503](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2503) |
| `--tema-yerel-rapor-yardimci-metin-22` | `#7b8da3` | :root, [data-tema="mavi"] | [app/tema.css:2504](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2504) |
| `--tema-yerel-rapor-cizgi-27` | `#edf2f7` | :root, [data-tema="mavi"] | [app/tema.css:2505](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2505) |
| `--tema-yerel-rapor-yardimci-metin-23` | `#667e98` | :root, [data-tema="mavi"] | [app/tema.css:2506](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2506) |
| `--tema-yerel-rapor-ana-metin-12` | `#203653` | :root, [data-tema="mavi"] | [app/tema.css:2507](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2507) |
| `--tema-yerel-rapor-yardimci-metin-24` | `#8798ad` | :root, [data-tema="mavi"] | [app/tema.css:2508](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2508) |
| `--tema-yerel-rapor-cizgi-28` | `#dfe7f1` | :root, [data-tema="mavi"] | [app/tema.css:2509](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2509) |
| `--tema-yerel-rapor-cizgi-29` | `#e2ebf4` | :root, [data-tema="mavi"] | [app/tema.css:2510](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2510) |
| `--tema-yerel-rapor-yardimci-metin-25` | `#8a9bb0` | :root, [data-tema="mavi"] | [app/tema.css:2511](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2511) |
| `--tema-yerel-rapor-eylem-metin-09` | `var(--color-blue-600)` | :root, [data-tema="mavi"] | [app/tema.css:2512](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2512) |
| `--tema-yerel-rapor-eylem-metin-10` | `var(--color-blue-800)` | :root, [data-tema="mavi"] | [app/tema.css:2513](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2513) |
| `--tema-yerel-rapor-cizgi-30` | `#edf3f8` | :root, [data-tema="mavi"] | [app/tema.css:2514](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2514) |
| `--tema-yerel-rapor-yardimci-metin-26` | `#9aa7b7` | :root, [data-tema="mavi"] | [app/tema.css:2515](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2515) |
| `--tema-yerel-rapor-secim-zemin-09` | `#eef6ff` | :root, [data-tema="mavi"] | [app/tema.css:2516](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2516) |
| `--tema-yerel-rapor-eylem-metin-11` | `#2f8ed8` | :root, [data-tema="mavi"] | [app/tema.css:2517](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2517) |
| `--tema-yerel-rapor-golge-07` | `rgba(35,122,200,0.12)` | :root, [data-tema="mavi"] | [app/tema.css:2518](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2518) |
| `--tema-yerel-rapor-odak-01` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:2519](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2519) |
| `--tema-yerel-rapor-sayfa-zemini-21` | `#f1f5f9` | :root, [data-tema="mavi"] | [app/tema.css:2520](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2520) |
| `--tema-yerel-rapor-eylem-zemin-03` | `#2f8ed8` | :root, [data-tema="mavi"] | [app/tema.css:2521](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2521) |
| `--tema-yerel-rapor-ana-metin-13` | `#334155` | :root, [data-tema="mavi"] | [app/tema.css:2522](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2522) |
| `--tema-yerel-rapor-cizgi-31` | `#d0e3f5` | :root, [data-tema="mavi"] | [app/tema.css:2523](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2523) |
| `--tema-yerel-rapor-cizgi-32` | `#e2e8f0` | :root, [data-tema="mavi"] | [app/tema.css:2524](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2524) |
| `--tema-yerel-rapor-yardimci-metin-27` | `#64748b` | :root, [data-tema="mavi"] | [app/tema.css:2525](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2525) |
| `--tema-yerel-rapor-cizgi-33` | `#e2edf7` | :root, [data-tema="mavi"] | [app/tema.css:2526](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2526) |
| `--tema-yerel-rapor-sayfa-zemini-22` | `#edf2f7` | :root, [data-tema="mavi"] | [app/tema.css:2527](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2527) |
| `--tema-yerel-rapor-cizgi-34` | `#e8eff6` | :root, [data-tema="mavi"] | [app/tema.css:2528](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2528) |
| `--tema-yerel-rapor-yardimci-metin-28` | `#62768d` | :root, [data-tema="mavi"] | [app/tema.css:2529](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2529) |
| `--tema-yerel-rapor-yardimci-metin-29` | `#61748d` | :root, [data-tema="mavi"] | [app/tema.css:2530](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2530) |
| `--tema-yerel-rapor-sayfa-zemini-23` | `#fafcfe` | :root, [data-tema="mavi"] | [app/tema.css:2531](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2531) |
| `--tema-yerel-rapor-yardimci-metin-30` | `#73839a` | :root, [data-tema="mavi"] | [app/tema.css:2532](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2532) |
| `--tema-yerel-rapor-ana-metin-14` | `#172b49` | :root, [data-tema="mavi"] | [app/tema.css:2533](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2533) |
| `--tema-yerel-rapor-yardimci-metin-31` | `#72839c` | :root, [data-tema="mavi"] | [app/tema.css:2534](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2534) |
| `--tema-yerel-rapor-cizgi-35` | `#e0e8f2` | :root, [data-tema="mavi"] | [app/tema.css:2535](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2535) |
| `--tema-yerel-rapor-golge-08` | `rgba(31,64,104,.05)` | :root, [data-tema="mavi"] | [app/tema.css:2536](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2536) |
| `--tema-yerel-rapor-yardimci-metin-32` | `#74849a` | :root, [data-tema="mavi"] | [app/tema.css:2537](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2537) |
| `--tema-yerel-rapor-eylem-metin-12` | `#287fc2` | :root, [data-tema="mavi"] | [app/tema.css:2538](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2538) |
| `--tema-yerel-rapor-secim-zemin-10` | `#f2f7fd` | :root, [data-tema="mavi"] | [app/tema.css:2539](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2539) |
| `--tema-yerel-rapor-dekoratif-zemin-10` | `#2f8ed8` | :root, [data-tema="mavi"] | [app/tema.css:2540](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2540) |
| `--tema-yerel-rapor-dekoratif-zemin-11` | `#2376bd` | :root, [data-tema="mavi"] | [app/tema.css:2541](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2541) |
| `--tema-yerel-rapor-golge-09` | `rgba(47,142,216,.22)` | :root, [data-tema="mavi"] | [app/tema.css:2542](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2542) |
| `--tema-yerel-rapor-cizgi-36` | `#e2e9f2` | :root, [data-tema="mavi"] | [app/tema.css:2543](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2543) |
| `--tema-yerel-rapor-golge-10` | `rgba(27,54,92,.055)` | :root, [data-tema="mavi"] | [app/tema.css:2544](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2544) |
| `--tema-yerel-rapor-yardimci-metin-33` | `#7190b5` | :root, [data-tema="mavi"] | [app/tema.css:2545](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2545) |
| `--tema-yerel-rapor-sayfa-zemini-24` | `#f7fbff` | :root, [data-tema="mavi"] | [app/tema.css:2546](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2546) |
| `--tema-yerel-rapor-yardimci-metin-34` | `#6f91b8` | :root, [data-tema="mavi"] | [app/tema.css:2547](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2547) |
| `--tema-yerel-rapor-yardimci-metin-35` | `#73849b` | :root, [data-tema="mavi"] | [app/tema.css:2548](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2548) |
| `--tema-yerel-rapor-yardimci-metin-36` | `#55708f` | :root, [data-tema="mavi"] | [app/tema.css:2549](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2549) |
| `--tema-yerel-rapor-yardimci-metin-37` | `#6c89aa` | :root, [data-tema="mavi"] | [app/tema.css:2550](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2550) |
| `--tema-yerel-rapor-yardimci-metin-38` | `#8492a7` | :root, [data-tema="mavi"] | [app/tema.css:2551](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2551) |
| `--tema-yerel-rapor-ana-metin-15` | `#263a57` | :root, [data-tema="mavi"] | [app/tema.css:2552](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2552) |
| `--tema-yerel-rapor-secim-zemin-11` | `#e6edf5` | :root, [data-tema="mavi"] | [app/tema.css:2553](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2553) |
| `--tema-yerel-rapor-yardimci-metin-39` | `#8290a5` | :root, [data-tema="mavi"] | [app/tema.css:2554](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2554) |
| `--tema-yerel-rapor-yardimci-metin-40` | `#7b8ba1` | :root, [data-tema="mavi"] | [app/tema.css:2555](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2555) |
| `--tema-yerel-rapor-yardimci-metin-41` | `#667d99` | :root, [data-tema="mavi"] | [app/tema.css:2556](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2556) |
| `--tema-yerel-rapor-golge-11` | `rgba(35,63,101,.04)` | :root, [data-tema="mavi"] | [app/tema.css:2557](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2557) |
| `--tema-yerel-rapor-yardimci-metin-42` | `#7c8ca1` | :root, [data-tema="mavi"] | [app/tema.css:2558](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2558) |
| `--tema-yerel-rapor-yardimci-metin-43` | `#8a97a9` | :root, [data-tema="mavi"] | [app/tema.css:2559](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2559) |
| `--tema-yerel-rapor-yardimci-metin-44` | `#6d8cb1` | :root, [data-tema="mavi"] | [app/tema.css:2560](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2560) |
| `--tema-yerel-rapor-golge-12` | `rgba(31,60,96,.035)` | :root, [data-tema="mavi"] | [app/tema.css:2561](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2561) |
| `--tema-yerel-rapor-golge-13` | `rgba(31,60,96,.08)` | :root, [data-tema="mavi"] | [app/tema.css:2562](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2562) |
| `--tema-yerel-rapor-yardimci-metin-45` | `#667991` | :root, [data-tema="mavi"] | [app/tema.css:2563](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2563) |
| `--tema-yerel-rapor-yardimci-metin-46` | `#8190a4` | :root, [data-tema="mavi"] | [app/tema.css:2564](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2564) |
| `--tema-yerel-rapor-yardimci-metin-47` | `#8492a5` | :root, [data-tema="mavi"] | [app/tema.css:2565](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2565) |
| `--tema-yerel-rapor-secim-zemin-12` | `#f0f6fc` | :root, [data-tema="mavi"] | [app/tema.css:2566](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2566) |
| `--tema-yerel-rapor-ana-metin-16` | `#46627f` | :root, [data-tema="mavi"] | [app/tema.css:2567](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2567) |
| `--tema-yerel-rapor-cizgi-37` | `rgba(213,225,238,.9)` | :root, [data-tema="mavi"] | [app/tema.css:2568](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2568) |
| `--tema-yerel-rapor-yardimci-metin-48` | `#75869d` | :root, [data-tema="mavi"] | [app/tema.css:2569](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2569) |
| `--tema-yerel-rapor-yardimci-metin-49` | `#7a8ca2` | :root, [data-tema="mavi"] | [app/tema.css:2570](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2570) |
| `--tema-yerel-rapor-yardimci-metin-50` | `#8391a5` | :root, [data-tema="mavi"] | [app/tema.css:2571](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2571) |
| `--tema-yerel-rapor-sayfa-zemini-25` | `#f5f8fb` | :root, [data-tema="mavi"] | [app/tema.css:2572](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2572) |
| `--tema-yerel-rapor-cizgi-38` | `#bedbf3` | :root, [data-tema="mavi"] | [app/tema.css:2573](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2573) |
| `--tema-yerel-rapor-yardimci-metin-51` | `#7090b5` | :root, [data-tema="mavi"] | [app/tema.css:2574](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2574) |
| `--tema-yerel-rapor-yardimci-metin-52` | `#8290a4` | :root, [data-tema="mavi"] | [app/tema.css:2575](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2575) |
| `--tema-yerel-rapor-yardimci-metin-53` | `#7291b4` | :root, [data-tema="mavi"] | [app/tema.css:2576](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2576) |
| `--tema-yerel-rapor-yardimci-metin-54` | `#7d8da3` | :root, [data-tema="mavi"] | [app/tema.css:2577](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2577) |
| `--tema-yerel-rapor-cizgi-39` | `rgba(216,227,238,.9)` | :root, [data-tema="mavi"] | [app/tema.css:2578](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2578) |
| `--tema-yerel-rapor-ana-metin-17` | `#31445f` | :root, [data-tema="mavi"] | [app/tema.css:2579](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2579) |
| `--tema-yerel-rapor-yardimci-metin-55` | `#8291a5` | :root, [data-tema="mavi"] | [app/tema.css:2580](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2580) |
| `--tema-yerel-rapor-cizgi-40` | `rgba(209,222,235,.95)` | :root, [data-tema="mavi"] | [app/tema.css:2581](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2581) |
| `--tema-yerel-rapor-ana-metin-18` | `#40536d` | :root, [data-tema="mavi"] | [app/tema.css:2582](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2582) |
| `--tema-yerel-rapor-secim-zemin-13` | `#e9f4fe` | :root, [data-tema="mavi"] | [app/tema.css:2583](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2583) |
| `--tema-yerel-rapor-yardimci-metin-56` | `#8593a6` | :root, [data-tema="mavi"] | [app/tema.css:2584](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2584) |
| `--tema-yerel-rapor-yardimci-metin-57` | `#7d8ca1` | :root, [data-tema="mavi"] | [app/tema.css:2585](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2585) |
| `--tema-yerel-rapor-cizgi-41` | `#e1e8f0` | :root, [data-tema="mavi"] | [app/tema.css:2586](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2586) |
| `--tema-yerel-rapor-yardimci-metin-58` | `#8b98aa` | :root, [data-tema="mavi"] | [app/tema.css:2587](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2587) |
| `--tema-yerel-rapor-yardimci-metin-59` | `#6f8daf` | :root, [data-tema="mavi"] | [app/tema.css:2588](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2588) |
| `--tema-yerel-rapor-sayfa-zemini-26` | `#8fa5be` | :root, [data-tema="mavi"] | [app/tema.css:2589](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2589) |
| `--tema-yerel-rapor-sayfa-zemini-27` | `#f9fbfd` | :root, [data-tema="mavi"] | [app/tema.css:2590](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2590) |
| `--tema-yerel-rapor-yardimci-metin-60` | `#6e7180` | :root, [data-tema="mavi"] | [app/tema.css:2591](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2591) |
| `--tema-yerel-magaza-sayfa-zemini-01` | `#f7f9fc` | :root, [data-tema="mavi"] | [app/tema.css:2592](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2592) |
| `--tema-yerel-magaza-yardimci-metin-01` | `#7a8da5` | :root, [data-tema="mavi"] | [app/tema.css:2593](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2593) |
| `--tema-yerel-magaza-yardimci-metin-02` | `#71859d` | :root, [data-tema="mavi"] | [app/tema.css:2594](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2594) |
| `--tema-yerel-magaza-eylem-metin-01` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:2595](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2595) |
| `--tema-yerel-magaza-cizgi-01` | `#dfe7f1` | :root, [data-tema="mavi"] | [app/tema.css:2596](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2596) |
| `--tema-yerel-magaza-golge-01` | `rgba(31,55,90,0.035)` | :root, [data-tema="mavi"] | [app/tema.css:2597](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2597) |
| `--tema-yerel-magaza-yardimci-metin-03` | `#627791` | :root, [data-tema="mavi"] | [app/tema.css:2598](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2598) |
| `--tema-yerel-magaza-ana-metin-01` | `#203653` | :root, [data-tema="mavi"] | [app/tema.css:2599](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2599) |
| `--tema-yerel-magaza-yardimci-metin-04` | `#8090a4` | :root, [data-tema="mavi"] | [app/tema.css:2600](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2600) |
| `--tema-yerel-magaza-eylem-zemin-01` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:2601](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2601) |
| `--tema-yerel-magaza-eylem-zemin-02` | `#1d69aa` | :root, [data-tema="mavi"] | [app/tema.css:2602](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2602) |
| `--tema-yerel-magaza-yardimci-metin-05` | `#9aa9b9` | :root, [data-tema="mavi"] | [app/tema.css:2603](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2603) |
| `--tema-yerel-magaza-secim-zemin-01` | `#eef6fd` | :root, [data-tema="mavi"] | [app/tema.css:2604](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2604) |
| `--tema-yerel-magaza-ana-metin-02` | `#1a2d42` | :root, [data-tema="mavi"] | [app/tema.css:2605](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2605) |
| `--tema-yerel-magaza-cizgi-02` | `#f0f4f8` | :root, [data-tema="mavi"] | [app/tema.css:2606](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2606) |
| `--tema-yerel-magaza-yardimci-metin-06` | `#6c7f96` | :root, [data-tema="mavi"] | [app/tema.css:2607](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2607) |
| `--tema-yerel-magaza-cizgi-03` | `#dce5ee` | :root, [data-tema="mavi"] | [app/tema.css:2608](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2608) |
| `--tema-yerel-magaza-sayfa-zemini-02` | `#f8fafc` | :root, [data-tema="mavi"] | [app/tema.css:2609](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2609) |
| `--tema-yerel-magaza-ana-metin-03` | `#475b75` | :root, [data-tema="mavi"] | [app/tema.css:2610](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2610) |
| `--tema-yerel-magaza-secim-zemin-02` | `#edf3f8` | :root, [data-tema="mavi"] | [app/tema.css:2611](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2611) |
| `--tema-yerel-magaza-ana-metin-04` | `#1f334d` | :root, [data-tema="mavi"] | [app/tema.css:2612](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2612) |
| `--tema-yerel-magaza-cizgi-04` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:2613](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2613) |
| `--tema-yerel-magaza-yardimci-metin-07` | `#8a9bb0` | :root, [data-tema="mavi"] | [app/tema.css:2614](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2614) |
| `--tema-yerel-magaza-sayfa-zemini-03` | `#fefce8` | :root, [data-tema="mavi"] | [app/tema.css:2615](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2615) |
| `--tema-yerel-magaza-yardimci-metin-08` | `#7b8da5` | :root, [data-tema="mavi"] | [app/tema.css:2616](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2616) |
| `--tema-yerel-magaza-cizgi-05` | `#e2e8f0` | :root, [data-tema="mavi"] | [app/tema.css:2617](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2617) |
| `--tema-yerel-magaza-sayfa-zemini-04` | `#f1f5f9` | :root, [data-tema="mavi"] | [app/tema.css:2618](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2618) |
| `--tema-yerel-magaza-yardimci-metin-09` | `#94a3b8` | :root, [data-tema="mavi"] | [app/tema.css:2619](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2619) |
| `--tema-yerel-magaza-secim-zemin-03` | `#e2e8f0` | :root, [data-tema="mavi"] | [app/tema.css:2620](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2620) |
| `--tema-yerel-magaza-eylem-metin-02` | `#3589d8` | :root, [data-tema="mavi"] | [app/tema.css:2621](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2621) |
| `--tema-yerel-magaza-cizgi-06` | `#e4ecf3` | :root, [data-tema="mavi"] | [app/tema.css:2622](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2622) |
| `--tema-yerel-magaza-yardimci-metin-10` | `#5f738c` | :root, [data-tema="mavi"] | [app/tema.css:2623](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2623) |
| `--tema-yerel-magaza-ana-metin-05` | `#1e3450` | :root, [data-tema="mavi"] | [app/tema.css:2624](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2624) |
| `--tema-yerel-magaza-yardimci-metin-11` | `#7b8ca5` | :root, [data-tema="mavi"] | [app/tema.css:2625](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2625) |
| `--tema-yerel-magaza-ana-metin-06` | `#172b4d` | :root, [data-tema="mavi"] | [app/tema.css:2626](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2626) |
| `--tema-yerel-magaza-yardimci-metin-12` | `#7b8da3` | :root, [data-tema="mavi"] | [app/tema.css:2627](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2627) |
| `--tema-yerel-magaza-cizgi-07` | `#d7e1ec` | :root, [data-tema="mavi"] | [app/tema.css:2628](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2628) |
| `--tema-yerel-magaza-ana-metin-07` | `#45627f` | :root, [data-tema="mavi"] | [app/tema.css:2629](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2629) |
| `--tema-yerel-magaza-sayfa-zemini-05` | `#f6f9fc` | :root, [data-tema="mavi"] | [app/tema.css:2630](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2630) |
| `--tema-yerel-magaza-sayfa-zemini-06` | `#f0f4f9` | :root, [data-tema="mavi"] | [app/tema.css:2631](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2631) |
| `--tema-yerel-magaza-cizgi-08` | `#cbd8e6` | :root, [data-tema="mavi"] | [app/tema.css:2632](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2632) |
| `--tema-yerel-magaza-ana-metin-08` | `#243a53` | :root, [data-tema="mavi"] | [app/tema.css:2633](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2633) |
| `--tema-yerel-magaza-ana-metin-09` | `#50637a` | :root, [data-tema="mavi"] | [app/tema.css:2634](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2634) |
| `--tema-yerel-magaza-cizgi-09` | `#edf1f5` | :root, [data-tema="mavi"] | [app/tema.css:2635](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2635) |
| `--tema-yerel-magaza-yardimci-metin-13` | `#556987` | :root, [data-tema="mavi"] | [app/tema.css:2636](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2636) |
| `--tema-yerel-magaza-secim-zemin-04` | `#edf6fd` | :root, [data-tema="mavi"] | [app/tema.css:2637](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2637) |
| `--tema-yerel-magaza-yardimci-metin-14` | `#7d8fa5` | :root, [data-tema="mavi"] | [app/tema.css:2638](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2638) |
| `--tema-yerel-magaza-yardimci-metin-15` | `#8292a7` | :root, [data-tema="mavi"] | [app/tema.css:2639](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2639) |
| `--tema-yerel-magaza-cizgi-10` | `#b7d3f2` | :root, [data-tema="mavi"] | [app/tema.css:2640](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2640) |
| `--tema-yerel-magaza-golge-02` | `rgba(31,55,90,0.08)` | :root, [data-tema="mavi"] | [app/tema.css:2641](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2641) |
| `--tema-yerel-magaza-yardimci-metin-16` | `#7c8ea5` | :root, [data-tema="mavi"] | [app/tema.css:2642](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2642) |
| `--tema-yerel-magaza-secim-zemin-05` | `#edf4fc` | :root, [data-tema="mavi"] | [app/tema.css:2643](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2643) |
| `--tema-yerel-magaza-secim-zemin-06` | `#dfeefb` | :root, [data-tema="mavi"] | [app/tema.css:2644](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2644) |
| `--tema-yerel-magaza-yardimci-metin-17` | `#8fa0b5` | :root, [data-tema="mavi"] | [app/tema.css:2645](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2645) |
| `--tema-yerel-magaza-yardimci-metin-18` | `#8190a3` | :root, [data-tema="mavi"] | [app/tema.css:2646](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2646) |
| `--tema-yerel-magaza-yardimci-metin-19` | `#61748b` | :root, [data-tema="mavi"] | [app/tema.css:2647](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2647) |
| `--tema-yerel-magaza-cizgi-11` | `#e8edf3` | :root, [data-tema="mavi"] | [app/tema.css:2648](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2648) |
| `--tema-yerel-magaza-cizgi-12` | `#eef2f6` | :root, [data-tema="mavi"] | [app/tema.css:2649](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2649) |
| `--tema-yerel-magaza-sayfa-zemini-07` | `#f3f6fa` | :root, [data-tema="mavi"] | [app/tema.css:2650](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2650) |
| `--tema-yerel-magaza-yardimci-metin-20` | `#9aa8b8` | :root, [data-tema="mavi"] | [app/tema.css:2651](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2651) |
| `--tema-yerel-magaza-eylem-metin-03` | `#185fa5` | :root, [data-tema="mavi"] | [app/tema.css:2652](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2652) |
| `--tema-yerel-magaza-sayfa-zemini-08` | `#f3f7fb` | :root, [data-tema="mavi"] | [app/tema.css:2653](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2653) |
| `--tema-yerel-magaza-yardimci-metin-21` | `#b8c4d1` | :root, [data-tema="mavi"] | [app/tema.css:2654](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2654) |
| `--tema-yerel-magaza-sayfa-zemini-09` | `#fbfcfe` | :root, [data-tema="mavi"] | [app/tema.css:2655](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2655) |
| `--tema-yerel-magaza-vurgu-metin-01` | `#bc2d0d` | :root, [data-tema="mavi"] | [app/tema.css:2656](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2656) |
| `--tema-yerel-magaza-sayfa-zemini-10` | `#f7faff` | :root, [data-tema="mavi"] | [app/tema.css:2657](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2657) |
| `--tema-yerel-magaza-yardimci-metin-22` | `#737373` | :root, [data-tema="mavi"] | [app/tema.css:2658](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2658) |
| `--tema-yerel-magaza-sayfa-zemini-11` | `#f9fafb` | :root, [data-tema="mavi"] | [app/tema.css:2659](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2659) |
| `--tema-yerel-magaza-cizgi-13` | `#e8eff6` | :root, [data-tema="mavi"] | [app/tema.css:2660](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2660) |
| `--tema-yerel-magaza-sayfa-zemini-12` | `#fdfaf5` | :root, [data-tema="mavi"] | [app/tema.css:2661](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2661) |
| `--tema-yerel-magaza-yardimci-metin-23` | `#647891` | :root, [data-tema="mavi"] | [app/tema.css:2662](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2662) |
| `--tema-yerel-magaza-yardimci-metin-24` | `#8ba0b7` | :root, [data-tema="mavi"] | [app/tema.css:2663](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2663) |
| `--tema-yerel-lig-sayfa-zemini-04` | `#f6f8fb` | :root, [data-tema="mavi"] | [app/tema.css:2664](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2664) |
| `--tema-yerel-lig-yardimci-metin-08` | `#7d8ba0` | :root, [data-tema="mavi"] | [app/tema.css:2665](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2665) |
| `--tema-yerel-lig-eylem-zemin-01` | `#2f9ae9` | :root, [data-tema="mavi"] | [app/tema.css:2666](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2666) |
| `--tema-yerel-lig-sayfa-zemini-05` | `#f8fbff` | :root, [data-tema="mavi"] | [app/tema.css:2667](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2667) |
| `--tema-yerel-lig-sayfa-zemini-06` | `#fbfcfe` | :root, [data-tema="mavi"] | [app/tema.css:2668](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2668) |
| `--tema-yerel-lig-sayfa-zemini-07` | `#f5f8fc` | :root, [data-tema="mavi"] | [app/tema.css:2669](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2669) |
| `--tema-yerel-uretim-secim-zemin-01` | `#e6f1fb` | :root, [data-tema="mavi"] | [app/tema.css:2670](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2670) |
| `--tema-yerel-uretim-eylem-metin-01` | `#56aeff` | :root, [data-tema="mavi"] | [app/tema.css:2671](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2671) |
| `--tema-yerel-uretim-cizgi-04` | `#56aeff` | :root, [data-tema="mavi"] | [app/tema.css:2672](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2672) |
| `--tema-yerel-uretim-yardimci-metin-04` | `#737373` | :root, [data-tema="mavi"] | [app/tema.css:2673](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2673) |
| `--tema-yerel-uretim-cizgi-05` | `#e5e7eb` | :root, [data-tema="mavi"] | [app/tema.css:2674](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2674) |
| `--tema-yerel-uretim-secim-zemin-02` | `#eff6ff` | :root, [data-tema="mavi"] | [app/tema.css:2675](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2675) |
| `--tema-yerel-uretim-eylem-metin-02` | `#1d4ed8` | :root, [data-tema="mavi"] | [app/tema.css:2676](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2676) |
| `--tema-yerel-uretim-cizgi-06` | `#bfdbfe` | :root, [data-tema="mavi"] | [app/tema.css:2677](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2677) |
| `--tema-yerel-uretim-cizgi-07` | `var(--color-blue-200)` | :root, [data-tema="mavi"] | [app/tema.css:2678](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2678) |
| `--tema-yerel-uretim-secim-zemin-03` | `var(--color-blue-50)` | :root, [data-tema="mavi"] | [app/tema.css:2679](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2679) |
| `--tema-yerel-uretim-eylem-metin-03` | `var(--color-blue-800)` | :root, [data-tema="mavi"] | [app/tema.css:2680](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2680) |
| `--tema-yerel-uretim-vurgu-metin-01` | `#bc2d0d` | :root, [data-tema="mavi"] | [app/tema.css:2681](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2681) |
| `--tema-yerel-uretim-ana-metin-04` | `#263b58` | :root, [data-tema="mavi"] | [app/tema.css:2682](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2682) |
| `--tema-yerel-uretim-yardimci-metin-05` | `#7a8ca5` | :root, [data-tema="mavi"] | [app/tema.css:2683](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2683) |
| `--tema-yerel-uretim-eylem-metin-04` | `#287fce` | :root, [data-tema="mavi"] | [app/tema.css:2684](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2684) |
| `--tema-yerel-uretim-cizgi-08` | `#dfe8f3` | :root, [data-tema="mavi"] | [app/tema.css:2685](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2685) |
| `--tema-yerel-uretim-eylem-zemin-01` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:2686](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2686) |
| `--tema-yerel-uretim-yardimci-metin-06` | `#6b7280` | :root, [data-tema="mavi"] | [app/tema.css:2687](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2687) |
| `--tema-yerel-uretim-yardimci-metin-07` | `var(--color-gray-300)` | :root, [data-tema="mavi"] | [app/tema.css:2688](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2688) |
| `--tema-yerel-uretim-cizgi-09` | `#dfe7f2` | :root, [data-tema="mavi"] | [app/tema.css:2689](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2689) |
| `--tema-yerel-uretim-golge-01` | `rgba(31,55,90,0.045)` | :root, [data-tema="mavi"] | [app/tema.css:2690](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2690) |
| `--tema-yerel-uretim-cizgi-10` | `#e8eef5` | :root, [data-tema="mavi"] | [app/tema.css:2691](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2691) |
| `--tema-yerel-uretim-ana-metin-05` | `#203653` | :root, [data-tema="mavi"] | [app/tema.css:2692](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2692) |
| `--tema-yerel-uretim-secim-zemin-04` | `#eef5fd` | :root, [data-tema="mavi"] | [app/tema.css:2693](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2693) |
| `--tema-yerel-uretim-eylem-metin-05` | `#4479b7` | :root, [data-tema="mavi"] | [app/tema.css:2694](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2694) |
| `--tema-yerel-uretim-secim-zemin-05` | `#f0f5fb` | :root, [data-tema="mavi"] | [app/tema.css:2695](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2695) |
| `--tema-yerel-uretim-yardimci-metin-08` | `#7f96b3` | :root, [data-tema="mavi"] | [app/tema.css:2696](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2696) |
| `--tema-yerel-uretim-yardimci-metin-09` | `#566b87` | :root, [data-tema="mavi"] | [app/tema.css:2697](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2697) |
| `--tema-yerel-uretim-sayfa-zemini-02` | `#f8fafd` | :root, [data-tema="mavi"] | [app/tema.css:2698](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2698) |
| `--tema-yerel-uretim-odak-01` | `#56aeff` | :root, [data-tema="mavi"] | [app/tema.css:2699](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2699) |
| `--tema-yerel-uretim-cizgi-11` | `#86bfff` | :root, [data-tema="mavi"] | [app/tema.css:2700](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2700) |
| `--tema-yerel-uretim-cizgi-12` | `#e1e8f1` | :root, [data-tema="mavi"] | [app/tema.css:2701](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2701) |
| `--tema-yerel-uretim-golge-02` | `rgba(37,131,226,0.12)` | :root, [data-tema="mavi"] | [app/tema.css:2702](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2702) |
| `--tema-yerel-uretim-ana-metin-06` | `#223955` | :root, [data-tema="mavi"] | [app/tema.css:2703](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2703) |
| `--tema-yerel-uretim-yardimci-metin-10` | `#8494aa` | :root, [data-tema="mavi"] | [app/tema.css:2704](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2704) |
| `--tema-yerel-uretim-yardimci-metin-11` | `#83a1c1` | :root, [data-tema="mavi"] | [app/tema.css:2705](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2705) |
| `--tema-yerel-uretim-yardimci-metin-12` | `#647994` | :root, [data-tema="mavi"] | [app/tema.css:2706](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2706) |
| `--tema-yerel-uretim-yardimci-metin-13` | `#8595aa` | :root, [data-tema="mavi"] | [app/tema.css:2707](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2707) |
| `--tema-yerel-uretim-cizgi-13` | `#edf1f6` | :root, [data-tema="mavi"] | [app/tema.css:2708](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2708) |
| `--tema-yerel-uretim-sayfa-zemini-03` | `#f8fbff` | :root, [data-tema="mavi"] | [app/tema.css:2709](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2709) |
| `--tema-yerel-uretim-secim-zemin-06` | `#eef6ff` | :root, [data-tema="mavi"] | [app/tema.css:2710](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2710) |
| `--tema-yerel-uretim-ana-metin-07` | `#425672` | :root, [data-tema="mavi"] | [app/tema.css:2711](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2711) |
| `--tema-yerel-uretim-eylem-metin-06` | `#2483e2` | :root, [data-tema="mavi"] | [app/tema.css:2712](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2712) |
| `--tema-yerel-uretim-secim-zemin-07` | `#f0f7ff` | :root, [data-tema="mavi"] | [app/tema.css:2713](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2713) |
| `--tema-yerel-uretim-sayfa-zemini-04` | `#f8fafc` | :root, [data-tema="mavi"] | [app/tema.css:2714](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2714) |
| `--tema-yerel-uretim-cizgi-14` | `#cce5ff` | :root, [data-tema="mavi"] | [app/tema.css:2715](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2715) |
| `--tema-yerel-uretim-ana-metin-08` | `#004085` | :root, [data-tema="mavi"] | [app/tema.css:2716](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2716) |
| `--tema-yerel-uretim-cizgi-15` | `#e2e8f0` | :root, [data-tema="mavi"] | [app/tema.css:2717](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2717) |
| `--tema-yerel-uretim-sayfa-zemini-05` | `#edf2f7` | :root, [data-tema="mavi"] | [app/tema.css:2718](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2718) |
| `--tema-yerel-uretim-ana-metin-09` | `#4a5568` | :root, [data-tema="mavi"] | [app/tema.css:2719](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2719) |
| `--tema-yerel-uretim-cizgi-16` | `#2483e2` | :root, [data-tema="mavi"] | [app/tema.css:2720](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2720) |
| `--tema-yerel-uretim-eylem-zemin-02` | `#2483e2` | :root, [data-tema="mavi"] | [app/tema.css:2721](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2721) |
| `--tema-yerel-uretim-eylem-zemin-03` | `#1a6ec7` | :root, [data-tema="mavi"] | [app/tema.css:2722](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2722) |
| `--tema-yerel-uretim-cizgi-17` | `#d6e3f2` | :root, [data-tema="mavi"] | [app/tema.css:2723](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2723) |
| `--tema-yerel-uretim-eylem-metin-07` | `var(--color-blue-700)` | :root, [data-tema="mavi"] | [app/tema.css:2724](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2724) |
| `--tema-yerel-uretim-eylem-zemin-04` | `var(--color-blue-600)` | :root, [data-tema="mavi"] | [app/tema.css:2725](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2725) |
| `--tema-yerel-uretim-sayfa-zemini-06` | `var(--color-slate-100)` | :root, [data-tema="mavi"] | [app/tema.css:2726](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2726) |
| `--tema-yerel-uretim-ana-metin-10` | `var(--color-slate-600)` | :root, [data-tema="mavi"] | [app/tema.css:2727](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2727) |
| `--tema-yerel-uretim-cizgi-18` | `var(--color-slate-200)` | :root, [data-tema="mavi"] | [app/tema.css:2728](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2728) |
| `--tema-yerel-uretim-sayfa-zemini-07` | `var(--color-gray-100)` | :root, [data-tema="mavi"] | [app/tema.css:2729](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2729) |
| `--tema-yerel-uretim-sayfa-zemini-08` | `var(--color-gray-200)` | :root, [data-tema="mavi"] | [app/tema.css:2730](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2730) |
| `--tema-yerel-uretim-sayfa-zemini-09` | `#f4f8fe` | :root, [data-tema="mavi"] | [app/tema.css:2731](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2731) |
| `--tema-yerel-uretim-cizgi-19` | `var(--color-blue-600)` | :root, [data-tema="mavi"] | [app/tema.css:2732](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2732) |
| `--tema-yerel-uretim-ana-metin-11` | `var(--color-blue-900)` | :root, [data-tema="mavi"] | [app/tema.css:2733](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2733) |
| `--tema-yerel-uretim-secim-zemin-08` | `var(--color-blue-100)` | :root, [data-tema="mavi"] | [app/tema.css:2734](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2734) |
| `--tema-yerel-uretim-eylem-zemin-05` | `var(--color-blue-700)` | :root, [data-tema="mavi"] | [app/tema.css:2735](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2735) |
| `--tema-yerel-uretim-ana-metin-12` | `#203b5b` | :root, [data-tema="mavi"] | [app/tema.css:2736](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2736) |
| `--tema-yerel-uretim-cizgi-20` | `var(--color-blue-100)` | :root, [data-tema="mavi"] | [app/tema.css:2737](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2737) |
| `--tema-yerel-uretim-cizgi-21` | `var(--color-gray-300)` | :root, [data-tema="mavi"] | [app/tema.css:2738](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2738) |
| `--tema-yerel-uretim-ana-metin-13` | `var(--color-gray-800)` | :root, [data-tema="mavi"] | [app/tema.css:2739](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2739) |
| `--tema-yerel-uretim-odak-02` | `#2483e2` | :root, [data-tema="mavi"] | [app/tema.css:2740](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2740) |
| `--tema-yerel-uretim-eylem-metin-08` | `#4b91d8` | :root, [data-tema="mavi"] | [app/tema.css:2741](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2741) |
| `--tema-yerel-uretim-yardimci-metin-14` | `#8292a8` | :root, [data-tema="mavi"] | [app/tema.css:2742](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2742) |
| `--tema-yerel-uretim-ana-metin-14` | `#1f3552` | :root, [data-tema="mavi"] | [app/tema.css:2743](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2743) |
| `--tema-yerel-uretim-cizgi-22` | `#dce8f5` | :root, [data-tema="mavi"] | [app/tema.css:2744](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2744) |
| `--tema-yerel-uretim-sayfa-zemini-10` | `#f6faff` | :root, [data-tema="mavi"] | [app/tema.css:2745](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2745) |
| `--tema-yerel-uretim-yardimci-metin-15` | `#6f8daf` | :root, [data-tema="mavi"] | [app/tema.css:2746](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2746) |
| `--tema-yerel-uretim-yardimci-metin-16` | `#8a99ad` | :root, [data-tema="mavi"] | [app/tema.css:2747](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2747) |
| `--tema-yerel-uretim-ana-metin-15` | `#29415f` | :root, [data-tema="mavi"] | [app/tema.css:2748](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2748) |
| `--tema-yerel-uretim-cizgi-23` | `#dfebf7` | :root, [data-tema="mavi"] | [app/tema.css:2749](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2749) |
| `--tema-yerel-uretim-yardimci-metin-17` | `#507094` | :root, [data-tema="mavi"] | [app/tema.css:2750](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2750) |
| `--tema-yerel-uretim-yardimci-metin-18` | `#7390b3` | :root, [data-tema="mavi"] | [app/tema.css:2751](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2751) |
| `--tema-yerel-uretim-ana-metin-16` | `#2b405c` | :root, [data-tema="mavi"] | [app/tema.css:2752](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2752) |
| `--tema-yerel-uretim-yardimci-metin-19` | `#526780` | :root, [data-tema="mavi"] | [app/tema.css:2753](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2753) |
| `--tema-yerel-uretim-sayfa-zemini-11` | `#f5f8fc` | :root, [data-tema="mavi"] | [app/tema.css:2754](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2754) |
| `--tema-yerel-uretim-ana-metin-17` | `#172b4d` | :root, [data-tema="mavi"] | [app/tema.css:2755](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2755) |
| `--tema-yerel-uretim-yardimci-metin-20` | `#7b8ca5` | :root, [data-tema="mavi"] | [app/tema.css:2756](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2756) |
| `--tema-yerel-uretim-cizgi-24` | `#e2e9f2` | :root, [data-tema="mavi"] | [app/tema.css:2757](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2757) |
| `--tema-yerel-uretim-ana-metin-18` | `#243957` | :root, [data-tema="mavi"] | [app/tema.css:2758](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2758) |
| `--tema-yerel-uretim-eylem-zemin-06` | `#2583e2` | :root, [data-tema="mavi"] | [app/tema.css:2759](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2759) |
| `--tema-yerel-uretim-cizgi-25` | `#2583e2` | :root, [data-tema="mavi"] | [app/tema.css:2760](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2760) |
| `--tema-yerel-uretim-golge-03` | `rgba(37,131,226,0.13)` | :root, [data-tema="mavi"] | [app/tema.css:2761](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2761) |
| `--tema-yerel-uretim-sayfa-zemini-12` | `#f7f9fc` | :root, [data-tema="mavi"] | [app/tema.css:2762](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2762) |
| `--tema-yerel-uretim-cizgi-26` | `#dce4ee` | :root, [data-tema="mavi"] | [app/tema.css:2763](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2763) |
| `--tema-yerel-uretim-cizgi-27` | `#8fc5fb` | :root, [data-tema="mavi"] | [app/tema.css:2764](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2764) |
| `--tema-yerel-uretim-golge-04` | `rgba(37,131,226,0.08)` | :root, [data-tema="mavi"] | [app/tema.css:2765](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2765) |
| `--tema-yerel-uretim-sayfa-zemini-13` | `#fafbfd` | :root, [data-tema="mavi"] | [app/tema.css:2766](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2766) |
| `--tema-yerel-uretim-cizgi-28` | `#e7ecf2` | :root, [data-tema="mavi"] | [app/tema.css:2767](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2767) |
| `--tema-yerel-uretim-sayfa-zemini-14` | `#e5e7eb` | :root, [data-tema="mavi"] | [app/tema.css:2768](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2768) |
| `--tema-yerel-uretim-yardimci-metin-21` | `#8e9caf` | :root, [data-tema="mavi"] | [app/tema.css:2769](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2769) |
| `--tema-yerel-uretim-ana-metin-19` | `#273d59` | :root, [data-tema="mavi"] | [app/tema.css:2770](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2770) |
| `--tema-yerel-uretim-yardimci-metin-22` | `#94a1b2` | :root, [data-tema="mavi"] | [app/tema.css:2771](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2771) |
| `--tema-yerel-uretim-yardimci-metin-23` | `#87a0bd` | :root, [data-tema="mavi"] | [app/tema.css:2772](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2772) |
| `--tema-yerel-uretim-cizgi-29` | `#dfe8f2` | :root, [data-tema="mavi"] | [app/tema.css:2773](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2773) |
| `--tema-yerel-uretim-eylem-zemin-07` | `#56aeff` | :root, [data-tema="mavi"] | [app/tema.css:2774](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2774) |
| `--tema-yerel-uretim-cizgi-30` | `#dce7f4` | :root, [data-tema="mavi"] | [app/tema.css:2775](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2775) |
| `--tema-yerel-uretim-golge-05` | `rgba(31,55,90,0.05)` | :root, [data-tema="mavi"] | [app/tema.css:2776](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2776) |
| `--tema-yerel-uretim-secim-zemin-09` | `#eaf4ff` | :root, [data-tema="mavi"] | [app/tema.css:2777](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2777) |
| `--tema-yerel-uretim-secim-zemin-10` | `#ddecff` | :root, [data-tema="mavi"] | [app/tema.css:2778](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2778) |
| `--tema-yerel-uretim-eylem-metin-09` | `#3989d7` | :root, [data-tema="mavi"] | [app/tema.css:2779](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2779) |
| `--tema-yerel-uretim-cizgi-31` | `#e8eef6` | :root, [data-tema="mavi"] | [app/tema.css:2780](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2780) |
| `--tema-yerel-uretim-sayfa-zemini-15` | `#fbfdff` | :root, [data-tema="mavi"] | [app/tema.css:2781](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2781) |
| `--tema-yerel-uretim-yardimci-metin-24` | `#7a8da8` | :root, [data-tema="mavi"] | [app/tema.css:2782](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2782) |
| `--tema-yerel-uretim-cizgi-32` | `#dce5f0` | :root, [data-tema="mavi"] | [app/tema.css:2783](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2783) |
| `--tema-yerel-uretim-cizgi-33` | `#dbe5ef` | :root, [data-tema="mavi"] | [app/tema.css:2784](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2784) |
| `--tema-yerel-uretim-cizgi-34` | `#dcecff` | :root, [data-tema="mavi"] | [app/tema.css:2785](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2785) |
| `--tema-yerel-uretim-yardimci-metin-25` | `#687b90` | :root, [data-tema="mavi"] | [app/tema.css:2786](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2786) |
| `--tema-yerel-uretim-secim-zemin-11` | `#dcecff` | :root, [data-tema="mavi"] | [app/tema.css:2787](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2787) |
| `--tema-yerel-uretim-eylem-metin-10` | `var(--color-blue-600)` | :root, [data-tema="mavi"] | [app/tema.css:2788](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2788) |
| `--tema-yerel-uretim-cizgi-35` | `var(--color-blue-400)` | :root, [data-tema="mavi"] | [app/tema.css:2789](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2789) |
| `--tema-yerel-uretim-eylem-zemin-08` | `#4096e8` | :root, [data-tema="mavi"] | [app/tema.css:2790](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2790) |
| `--tema-yerel-uretim-cizgi-36` | `#dfe7f1` | :root, [data-tema="mavi"] | [app/tema.css:2791](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2791) |
| `--tema-yerel-uretim-yardimci-metin-26` | `#7189a7` | :root, [data-tema="mavi"] | [app/tema.css:2792](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2792) |
| `--tema-yerel-uretim-sayfa-zemini-16` | `#fafcfe` | :root, [data-tema="mavi"] | [app/tema.css:2793](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2793) |
| `--tema-yerel-uretim-cizgi-37` | `#93c5fd` | :root, [data-tema="mavi"] | [app/tema.css:2794](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2794) |
| `--tema-yerel-uretim-ana-metin-20` | `#1e3a8a` | :root, [data-tema="mavi"] | [app/tema.css:2795](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2795) |
| `--tema-yerel-uretim-yardimci-metin-27` | `#9aa7b7` | :root, [data-tema="mavi"] | [app/tema.css:2796](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2796) |
| `--tema-yerel-uretim-eylem-metin-11` | `#2563eb` | :root, [data-tema="mavi"] | [app/tema.css:2797](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2797) |
| `--tema-yerel-uretim-yardimci-metin-28` | `#64748b` | :root, [data-tema="mavi"] | [app/tema.css:2798](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2798) |
| `--tema-yerel-uretim-yardimci-metin-29` | `#7e8fa5` | :root, [data-tema="mavi"] | [app/tema.css:2799](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2799) |
| `--tema-yerel-uretim-golge-06` | `rgba(37,131,226,0.22)` | :root, [data-tema="mavi"] | [app/tema.css:2800](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2800) |
| `--tema-yerel-uretim-eylem-zemin-09` | `#1d6fc2` | :root, [data-tema="mavi"] | [app/tema.css:2801](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2801) |
| `--tema-yerel-uretim-sayfa-zemini-17` | `#eef1f5` | :root, [data-tema="mavi"] | [app/tema.css:2802](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2802) |
| `--tema-yerel-uretim-cizgi-38` | `var(--color-indigo-100)` | :root, [data-tema="mavi"] | [app/tema.css:2803](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2803) |
| `--tema-yerel-uretim-sayfa-zemini-18` | `#fbfbfe` | :root, [data-tema="mavi"] | [app/tema.css:2804](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2804) |
| `--tema-yerel-uretim-ana-metin-21` | `var(--color-slate-800)` | :root, [data-tema="mavi"] | [app/tema.css:2805](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2805) |
| `--tema-yerel-uretim-yardimci-metin-30` | `var(--color-slate-500)` | :root, [data-tema="mavi"] | [app/tema.css:2806](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2806) |
| `--tema-yerel-uretim-cizgi-39` | `var(--color-indigo-400)` | :root, [data-tema="mavi"] | [app/tema.css:2807](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2807) |
| `--tema-yerel-uretim-secim-zemin-12` | `var(--color-indigo-50)` | :root, [data-tema="mavi"] | [app/tema.css:2808](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2808) |
| `--tema-yerel-uretim-eylem-metin-12` | `var(--color-indigo-600)` | :root, [data-tema="mavi"] | [app/tema.css:2809](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2809) |
| `--tema-yerel-uretim-cizgi-40` | `var(--color-indigo-50)` | :root, [data-tema="mavi"] | [app/tema.css:2810](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2810) |
| `--tema-yerel-uretim-eylem-zemin-10` | `var(--color-indigo-600)` | :root, [data-tema="mavi"] | [app/tema.css:2811](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2811) |
| `--tema-yerel-uretim-yardimci-metin-31` | `var(--color-slate-400)` | :root, [data-tema="mavi"] | [app/tema.css:2812](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2812) |
| `--tema-yerel-uretim-sayfa-zemini-19` | `var(--color-slate-50)` | :root, [data-tema="mavi"] | [app/tema.css:2813](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2813) |
| `--tema-yerel-uretim-ana-metin-22` | `var(--color-slate-700)` | :root, [data-tema="mavi"] | [app/tema.css:2814](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2814) |
| `--tema-yerel-uretim-cizgi-41` | `var(--color-indigo-500)` | :root, [data-tema="mavi"] | [app/tema.css:2815](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2815) |
| `--tema-yerel-uretim-cizgi-42` | `var(--color-indigo-200)` | :root, [data-tema="mavi"] | [app/tema.css:2816](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2816) |
| `--tema-yerel-uretim-eylem-metin-13` | `var(--color-indigo-700)` | :root, [data-tema="mavi"] | [app/tema.css:2817](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2817) |
| `--tema-yerel-uretim-sayfa-zemini-20` | `var(--color-slate-200)` | :root, [data-tema="mavi"] | [app/tema.css:2818](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2818) |
| `--tema-yerel-uretim-yardimci-metin-32` | `#617590` | :root, [data-tema="mavi"] | [app/tema.css:2819](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2819) |
| `--tema-yerel-uretim-sayfa-zemini-21` | `#f2f5f9` | :root, [data-tema="mavi"] | [app/tema.css:2820](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2820) |
| `--tema-yerel-uretim-secim-zemin-13` | `#e4eaf2` | :root, [data-tema="mavi"] | [app/tema.css:2821](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2821) |
| `--tema-yerel-uretim-cizgi-43` | `#e3eaf2` | :root, [data-tema="mavi"] | [app/tema.css:2822](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2822) |
| `--tema-yerel-uretim-ana-metin-23` | `#344a67` | :root, [data-tema="mavi"] | [app/tema.css:2823](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2823) |
| `--tema-yerel-uretim-yardimci-metin-33` | `#8796aa` | :root, [data-tema="mavi"] | [app/tema.css:2824](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2824) |
| `--tema-yerel-uretim-sayfa-zemini-22` | `#f8fbfe` | :root, [data-tema="mavi"] | [app/tema.css:2825](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2825) |
| `--tema-yerel-uretim-cizgi-44` | `#e0e7f0` | :root, [data-tema="mavi"] | [app/tema.css:2826](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2826) |
| `--tema-yerel-uretim-eylem-metin-14` | `#4c7fb8` | :root, [data-tema="mavi"] | [app/tema.css:2827](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2827) |
| `--tema-yerel-uretim-ana-metin-24` | `#3f526c` | :root, [data-tema="mavi"] | [app/tema.css:2828](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2828) |
| `--tema-yerel-uretim-yardimci-metin-34` | `#8292a7` | :root, [data-tema="mavi"] | [app/tema.css:2829](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2829) |
| `--tema-yerel-uretim-yardimci-metin-35` | `#7c98b8` | :root, [data-tema="mavi"] | [app/tema.css:2830](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2830) |
| `--tema-yerel-uretim-eylem-metin-15` | `#2583e2` | :root, [data-tema="mavi"] | [app/tema.css:2831](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2831) |
| `--tema-yerel-uretim-cizgi-45` | `#dbe5f0` | :root, [data-tema="mavi"] | [app/tema.css:2832](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2832) |
| `--tema-yerel-uretim-secim-zemin-14` | `#e8eef5` | :root, [data-tema="mavi"] | [app/tema.css:2833](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2833) |
| `--tema-yerel-uretim-eylem-metin-16` | `#5367c7` | :root, [data-tema="mavi"] | [app/tema.css:2834](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2834) |
| `--tema-yerel-uretim-secim-zemin-15` | `#f0f1ff` | :root, [data-tema="mavi"] | [app/tema.css:2835](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2835) |
| `--tema-yerel-uretim-vurgu-zemin-01` | `#bc2d0d` | :root, [data-tema="mavi"] | [app/tema.css:2836](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2836) |
| `--tema-yerel-uretim-golge-07` | `rgba(31,55,90,0.035)` | :root, [data-tema="mavi"] | [app/tema.css:2837](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2837) |
| `--tema-yerel-uretim-cizgi-46` | `#e1e9f3` | :root, [data-tema="mavi"] | [app/tema.css:2838](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2838) |
| `--tema-yerel-uretim-ana-metin-25` | `#405976` | :root, [data-tema="mavi"] | [app/tema.css:2839](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2839) |
| `--tema-yerel-uretim-cizgi-47` | `#b9d5f0` | :root, [data-tema="mavi"] | [app/tema.css:2840](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2840) |
| `--tema-yerel-uretim-golge-08` | `rgba(31,55,90,0.10)` | :root, [data-tema="mavi"] | [app/tema.css:2841](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2841) |
| `--tema-yerel-uretim-dekoratif-zemin-01` | `#10233a` | :root, [data-tema="mavi"] | [app/tema.css:2842](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2842) |
| `--tema-yerel-uretim-eylem-zemin-11` | `#10233a` | :root, [data-tema="mavi"] | [app/tema.css:2843](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2843) |
| `--tema-yerel-uretim-eylem-metin-17` | `#4d79aa` | :root, [data-tema="mavi"] | [app/tema.css:2844](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2844) |
| `--tema-yerel-uretim-yardimci-metin-36` | `#8190a3` | :root, [data-tema="mavi"] | [app/tema.css:2845](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2845) |
| `--tema-yerel-uretim-yardimci-metin-37` | `#70849d` | :root, [data-tema="mavi"] | [app/tema.css:2846](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2846) |
| `--tema-yerel-uretim-ana-metin-26` | `#314a68` | :root, [data-tema="mavi"] | [app/tema.css:2847](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2847) |
| `--tema-yerel-uretim-cizgi-49` | `#e2e9f1` | :root, [data-tema="mavi"] | [app/tema.css:2848](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2848) |
| `--tema-yerel-uretim-cizgi-50` | `#cfe2fa` | :root, [data-tema="mavi"] | [app/tema.css:2849](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2849) |
| `--tema-yerel-uretim-secim-zemin-16` | `#f2f8ff` | :root, [data-tema="mavi"] | [app/tema.css:2850](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2850) |
| `--tema-yerel-uretim-eylem-metin-18` | `#3974b5` | :root, [data-tema="mavi"] | [app/tema.css:2851](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2851) |
| `--tema-yerel-uretim-ana-metin-27` | `#40556d` | :root, [data-tema="mavi"] | [app/tema.css:2852](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2852) |
| `--tema-yerel-uretim-yardimci-metin-38` | `#536984` | :root, [data-tema="mavi"] | [app/tema.css:2853](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2853) |
| `--tema-yerel-uretim-ana-metin-28` | `#213754` | :root, [data-tema="mavi"] | [app/tema.css:2854](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2854) |
| `--tema-yerel-uretim-yardimci-metin-39` | `#c4cfdb` | :root, [data-tema="mavi"] | [app/tema.css:2855](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2855) |
| `--tema-yerel-uretim-sayfa-zemini-23` | `#f6f9fc` | :root, [data-tema="mavi"] | [app/tema.css:2856](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2856) |
| `--tema-yerel-uretim-yardimci-metin-40` | `#8797ac` | :root, [data-tema="mavi"] | [app/tema.css:2857](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2857) |
| `--tema-yerel-uretim-secim-zemin-17` | `#dde5ee` | :root, [data-tema="mavi"] | [app/tema.css:2858](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2858) |
| `--tema-yerel-uretim-sayfa-zemini-24` | `#f3f4f6` | :root, [data-tema="mavi"] | [app/tema.css:2859](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2859) |
| `--tema-yerel-uretim-yardimci-metin-41` | `#7b8da5` | :root, [data-tema="mavi"] | [app/tema.css:2860](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2860) |
| `--tema-yerel-uretim-golge-09` | `rgba(31,55,90,0.03)` | :root, [data-tema="mavi"] | [app/tema.css:2861](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2861) |
| `--tema-yerel-yonetim-sayfa-zemini-01` | `#d1d5db` | :root, [data-tema="mavi"] | [app/tema.css:2862](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2862) |
| `--tema-yerel-yonetim-cizgi-01` | `#e5e7eb` | :root, [data-tema="mavi"] | [app/tema.css:2863](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2863) |
| `--tema-yerel-yonetim-ana-metin-01` | `#111` | :root, [data-tema="mavi"] | [app/tema.css:2864](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2864) |
| `--tema-yerel-yonetim-yardimci-metin-01` | `#737373` | :root, [data-tema="mavi"] | [app/tema.css:2865](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2865) |
| `--tema-yerel-yonetim-vurgu-metin-01` | `#bc2d0d` | :root, [data-tema="mavi"] | [app/tema.css:2866](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2866) |
| `--tema-yerel-yonetim-eylem-metin-01` | `#0891b2` | :root, [data-tema="mavi"] | [app/tema.css:2867](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2867) |
| `--tema-yerel-yonetim-cizgi-02` | `#d1d5db` | :root, [data-tema="mavi"] | [app/tema.css:2868](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2868) |
| `--tema-yerel-yonetim-ana-metin-02` | `#525252` | :root, [data-tema="mavi"] | [app/tema.css:2869](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2869) |
| `--tema-yerel-yonetim-cizgi-03` | `#d4d4d4` | :root, [data-tema="mavi"] | [app/tema.css:2870](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2870) |
| `--tema-yerel-yonetim-cizgi-04` | `#eee` | :root, [data-tema="mavi"] | [app/tema.css:2871](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2871) |
| `--tema-yerel-yonetim-ana-metin-03` | `#374151` | :root, [data-tema="mavi"] | [app/tema.css:2872](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2872) |
| `--tema-yerel-yonetim-sayfa-zemini-02` | `#f9fafb` | :root, [data-tema="mavi"] | [app/tema.css:2873](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2873) |
| `--tema-yerel-yonetim-cizgi-05` | `#f3f4f6` | :root, [data-tema="mavi"] | [app/tema.css:2874](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2874) |
| `--tema-yerel-yonetim-eylem-zemin-01` | `#737373` | :root, [data-tema="mavi"] | [app/tema.css:2875](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2875) |
| `--tema-yerel-yonetim-ana-metin-04` | `#111827` | :root, [data-tema="mavi"] | [app/tema.css:2876](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2876) |
| `--tema-yerel-yonetim-yardimci-metin-02` | `#6b7280` | :root, [data-tema="mavi"] | [app/tema.css:2877](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2877) |
| `--tema-yerel-yonetim-sayfa-zemini-03` | `#fefce8` | :root, [data-tema="mavi"] | [app/tema.css:2878](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2878) |
| `--tema-yerel-yonetim-sayfa-zemini-04` | `#f3f4f6` | :root, [data-tema="mavi"] | [app/tema.css:2879](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2879) |
| `--tema-yerel-yonetim-secim-zemin-01` | `#e2e8f0` | :root, [data-tema="mavi"] | [app/tema.css:2880](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2880) |
| `--tema-yerel-yonetim-yardimci-metin-03` | `#64748b` | :root, [data-tema="mavi"] | [app/tema.css:2881](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2881) |
| `--tema-yerel-yonetim-yardimci-metin-04` | `#9ca3af` | :root, [data-tema="mavi"] | [app/tema.css:2882](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2882) |
| `--tema-yerel-yonetim-yardimci-metin-05` | `#b3b3b3` | :root, [data-tema="mavi"] | [app/tema.css:2883](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2883) |
| `--tema-yerel-yonetim-sayfa-zemini-05` | `#e5e7eb` | :root, [data-tema="mavi"] | [app/tema.css:2884](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2884) |
| `--tema-yerel-yonetim-sayfa-zemini-06` | `#9ca3af` | :root, [data-tema="mavi"] | [app/tema.css:2885](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2885) |
| `--tema-yerel-yonetim-sayfa-zemini-07` | `#fafafa` | :root, [data-tema="mavi"] | [app/tema.css:2886](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2886) |
| `--tema-yerel-yonetim-cizgi-06` | `#e5e5e5` | :root, [data-tema="mavi"] | [app/tema.css:2887](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2887) |
| `--tema-yerel-yonetim-cizgi-07` | `#93c5fd` | :root, [data-tema="mavi"] | [app/tema.css:2888](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2888) |
| `--tema-yerel-yonetim-yardimci-metin-06` | `var(--color-gray-500)` | :root, [data-tema="mavi"] | [app/tema.css:2889](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2889) |
| `--tema-yerel-yonetim-ana-metin-05` | `var(--color-gray-900)` | :root, [data-tema="mavi"] | [app/tema.css:2890](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2890) |
| `--tema-yerel-yonetim-cizgi-08` | `var(--color-gray-200)` | :root, [data-tema="mavi"] | [app/tema.css:2891](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2891) |
| `--tema-yerel-yonetim-ana-metin-06` | `var(--color-gray-600)` | :root, [data-tema="mavi"] | [app/tema.css:2892](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2892) |
| `--tema-yerel-yonetim-cizgi-09` | `var(--color-gray-100)` | :root, [data-tema="mavi"] | [app/tema.css:2893](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2893) |
| `--tema-yerel-yonetim-ana-metin-07` | `var(--color-gray-800)` | :root, [data-tema="mavi"] | [app/tema.css:2894](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2894) |
| `--tema-yerel-yonetim-cizgi-10` | `var(--color-gray-50)` | :root, [data-tema="mavi"] | [app/tema.css:2895](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2895) |
| `--tema-yerel-yonetim-yardimci-metin-07` | `var(--color-gray-400)` | :root, [data-tema="mavi"] | [app/tema.css:2896](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2896) |
| `--tema-yerel-yonetim-ana-metin-08` | `var(--color-gray-700)` | :root, [data-tema="mavi"] | [app/tema.css:2897](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2897) |
| `--tema-yerel-yonetim-sayfa-zemini-08` | `var(--color-gray-50)` | :root, [data-tema="mavi"] | [app/tema.css:2898](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2898) |
| `--tema-yerel-yonetim-vurgu-zemin-01` | `#bc2d0d` | :root, [data-tema="mavi"] | [app/tema.css:2899](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2899) |
| `--tema-yerel-yonetim-vurgu-odak-01` | `#bc2d0d` | :root, [data-tema="mavi"] | [app/tema.css:2900](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2900) |
| `--tema-yerel-yonetim-eylem-zemin-02` | `rgba(17,24,39,.45)` | :root, [data-tema="mavi"] | [app/tema.css:2901](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2901) |
| `--tema-yerel-yonetim-vurgu-cizgi-01` | `#bc2d0d` | :root, [data-tema="mavi"] | [app/tema.css:2902](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2902) |
| `--tema-yerel-yonetim-secim-zemin-02` | `#f0f9ff` | :root, [data-tema="mavi"] | [app/tema.css:2903](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2903) |
| `--tema-yerel-giris-ana-metin-01` | `var(--color-gray-600)` | :root, [data-tema="mavi"] | [app/tema.css:2904](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2904) |
| `--tema-yerel-giris-vurgu-metin-01` | `#bc2d0d` | :root, [data-tema="mavi"] | [app/tema.css:2905](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2905) |
| `--tema-yerel-eczanem-cizgi-25` | `var(--color-blue-200)` | :root, [data-tema="mavi"] | [app/tema.css:2906](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2906) |
| `--tema-yerel-eczanem-cizgi-26` | `var(--color-blue-100)` | :root, [data-tema="mavi"] | [app/tema.css:2907](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2907) |
| `--tema-yerel-eczanem-secim-zemin-09` | `var(--color-blue-50)` | :root, [data-tema="mavi"] | [app/tema.css:2908](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2908) |
| `--tema-yerel-eczanem-eylem-zemin-05` | `var(--color-blue-600)` | :root, [data-tema="mavi"] | [app/tema.css:2909](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2909) |
| `--tema-yerel-eczanem-ana-metin-15` | `var(--color-blue-950)` | :root, [data-tema="mavi"] | [app/tema.css:2910](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2910) |
| `--tema-yerel-eczanem-eylem-metin-06` | `var(--color-blue-800)` | :root, [data-tema="mavi"] | [app/tema.css:2911](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2911) |
| `--tema-yerel-eczanem-eylem-metin-07` | `var(--color-blue-700)` | :root, [data-tema="mavi"] | [app/tema.css:2912](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2912) |
| `--tema-yerel-eczanem-eylem-zemin-06` | `var(--color-blue-700)` | :root, [data-tema="mavi"] | [app/tema.css:2913](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2913) |
| `--tema-yerel-eczanem-sayfa-zemini-15` | `var(--color-gray-100)` | :root, [data-tema="mavi"] | [app/tema.css:2914](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2914) |
| `--tema-yerel-eczanem-ana-metin-16` | `var(--color-gray-600)` | :root, [data-tema="mavi"] | [app/tema.css:2915](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2915) |
| `--tema-yerel-eczanem-cizgi-27` | `var(--color-gray-300)` | :root, [data-tema="mavi"] | [app/tema.css:2916](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2916) |
| `--tema-yerel-eczanem-cizgi-28` | `var(--color-blue-500)` | :root, [data-tema="mavi"] | [app/tema.css:2917](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2917) |
| `--tema-yerel-eczanem-eylem-zemin-07` | `var(--color-blue-700)` | :root, [data-tema="mavi"] | [app/tema.css:2918](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2918) |
| `--tema-yerel-eczanem-eylem-zemin-08` | `var(--color-blue-800)` | :root, [data-tema="mavi"] | [app/tema.css:2919](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2919) |
| `--tema-yerel-eczanem-cizgi-29` | `#e2e8f0` | :root, [data-tema="mavi"] | [app/tema.css:2920](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2920) |
| `--tema-yerel-eczanem-vurgu-metin-01` | `#bc2d0d` | :root, [data-tema="mavi"] | [app/tema.css:2921](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2921) |
| `--tema-yerel-eczanem-yardimci-metin-29` | `#9ca3af` | :root, [data-tema="mavi"] | [app/tema.css:2922](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2922) |
| `--tema-yerel-eczanem-ana-metin-17` | `#4b5563` | :root, [data-tema="mavi"] | [app/tema.css:2923](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2923) |
| `--tema-yerel-eczanem-ana-metin-18` | `#111827` | :root, [data-tema="mavi"] | [app/tema.css:2924](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2924) |
| `--tema-yerel-eczanem-ana-metin-19` | `#374151` | :root, [data-tema="mavi"] | [app/tema.css:2925](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2925) |
| `--tema-yerel-eczanem-cizgi-30` | `#e5e7eb` | :root, [data-tema="mavi"] | [app/tema.css:2926](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2926) |
| `--tema-yerel-eczanem-odak-02` | `var(--color-gray-300)` | :root, [data-tema="mavi"] | [app/tema.css:2927](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2927) |
| `--tema-yerel-eczanem-sayfa-zemini-16` | `#d4d4d4` | :root, [data-tema="mavi"] | [app/tema.css:2928](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2928) |
| `--tema-yerel-eczanem-cizgi-31` | `#c9c9c9` | :root, [data-tema="mavi"] | [app/tema.css:2929](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2929) |
| `--tema-yerel-eczanem-yardimci-metin-30` | `#d1d5db` | :root, [data-tema="mavi"] | [app/tema.css:2930](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2930) |
| `--tema-yerel-eczanem-eylem-zemin-09` | `var(--color-gray-700)` | :root, [data-tema="mavi"] | [app/tema.css:2931](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2931) |
| `--tema-yerel-eczanem-yardimci-metin-31` | `#737373` | :root, [data-tema="mavi"] | [app/tema.css:2932](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2932) |
| `--tema-yerel-eczanem-eylem-metin-08` | `#185fa5` | :root, [data-tema="mavi"] | [app/tema.css:2933](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2933) |
| `--tema-yerel-eczanem-eylem-zemin-10` | `rgba(86,174,255,0.12)` | :root, [data-tema="mavi"] | [app/tema.css:2934](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2934) |
| `--tema-yerel-eczanem-sayfa-zemini-17` | `#f0f0f0` | :root, [data-tema="mavi"] | [app/tema.css:2935](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2935) |
| `--tema-yerel-eczanem-yardimci-metin-32` | `#656d76` | :root, [data-tema="mavi"] | [app/tema.css:2936](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2936) |
| `--tema-yerel-eczanem-sayfa-zemini-18` | `#fafafa` | :root, [data-tema="mavi"] | [app/tema.css:2937](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2937) |
| `--tema-yerel-eczanem-vurgu-zemin-01` | `#bc2d0d` | :root, [data-tema="mavi"] | [app/tema.css:2938](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2938) |
| `--tema-yerel-eczanem-ana-metin-20` | `#1e344a` | :root, [data-tema="mavi"] | [app/tema.css:2939](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2939) |
| `--tema-yerel-eczanem-cizgi-32` | `#dfe4e9` | :root, [data-tema="mavi"] | [app/tema.css:2940](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2940) |
| `--tema-yerel-eczanem-sayfa-zemini-19` | `#f6f7f8` | :root, [data-tema="mavi"] | [app/tema.css:2941](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2941) |
| `--tema-yerel-eczanem-yardimci-metin-33` | `#747f8a` | :root, [data-tema="mavi"] | [app/tema.css:2942](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2942) |
| `--tema-yerel-eczanem-cizgi-33` | `#dfe7ef` | :root, [data-tema="mavi"] | [app/tema.css:2943](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2943) |
| `--tema-yerel-eczanem-cizgi-34` | `#e7edf3` | :root, [data-tema="mavi"] | [app/tema.css:2944](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2944) |
| `--tema-yerel-eczanem-yardimci-metin-34` | `#7f90a4` | :root, [data-tema="mavi"] | [app/tema.css:2945](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2945) |
| `--tema-yerel-eczanem-yardimci-metin-35` | `#8190a3` | :root, [data-tema="mavi"] | [app/tema.css:2946](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2946) |
| `--tema-yerel-eczanem-yardimci-metin-36` | `#9aadd0` | :root, [data-tema="mavi"] | [app/tema.css:2947](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2947) |
| `--tema-yerel-eczanem-sayfa-zemini-20` | `#f7fafc` | :root, [data-tema="mavi"] | [app/tema.css:2948](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2948) |
| `--tema-yerel-eczanem-eylem-metin-09` | `#397fbf` | :root, [data-tema="mavi"] | [app/tema.css:2949](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2949) |
| `--tema-yerel-eczanem-yardimci-metin-37` | `#71849a` | :root, [data-tema="mavi"] | [app/tema.css:2950](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2950) |
| `--tema-yerel-eczanem-eylem-metin-10` | `#286fae` | :root, [data-tema="mavi"] | [app/tema.css:2951](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2951) |
| `--tema-yerel-eczanem-sayfa-zemini-21` | `#f6f8fb` | :root, [data-tema="mavi"] | [app/tema.css:2952](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2952) |
| `--tema-yerel-eczanem-yardimci-metin-38` | `#8b99aa` | :root, [data-tema="mavi"] | [app/tema.css:2953](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2953) |
| `--tema-yerel-eczanem-yardimci-metin-39` | `#9aa6b4` | :root, [data-tema="mavi"] | [app/tema.css:2954](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2954) |
| `--tema-yerel-eczanem-cizgi-36` | `#cbe4f9` | :root, [data-tema="mavi"] | [app/tema.css:2955](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2955) |
| `--tema-yerel-eczanem-ana-metin-21` | `var(--color-gray-800)` | :root, [data-tema="mavi"] | [app/tema.css:2956](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2956) |
| `--tema-yerel-eczanem-cizgi-37` | `#d6e1eb` | :root, [data-tema="mavi"] | [app/tema.css:2957](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2957) |
| `--tema-yerel-eczanem-cizgi-38` | `#e5e5e5` | :root, [data-tema="mavi"] | [app/tema.css:2958](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2958) |
| `--tema-yerel-eczanem-vurgu-cizgi-01` | `#bc2d0d` | :root, [data-tema="mavi"] | [app/tema.css:2959](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2959) |
| `--tema-yerel-eczanem-sayfa-zemini-22` | `#f4f5f6` | :root, [data-tema="mavi"] | [app/tema.css:2960](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2960) |
| `--tema-yerel-eczanem-ana-metin-22` | `#343434` | :root, [data-tema="mavi"] | [app/tema.css:2961](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2961) |
| `--tema-yerel-eczanem-yardimci-metin-40` | `#717478` | :root, [data-tema="mavi"] | [app/tema.css:2962](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2962) |
| `--tema-yerel-eczanem-sayfa-zemini-23` | `#f5f8fb` | :root, [data-tema="mavi"] | [app/tema.css:2963](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2963) |
| `--tema-yerel-eczanem-cizgi-39` | `#d8e5f0` | :root, [data-tema="mavi"] | [app/tema.css:2964](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2964) |
| `--tema-yerel-eczanem-ana-metin-23` | `#2e475d` | :root, [data-tema="mavi"] | [app/tema.css:2965](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2965) |
| `--tema-yerel-eczanem-sayfa-zemini-24` | `#f6f9fb` | :root, [data-tema="mavi"] | [app/tema.css:2966](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2966) |
| `--tema-yerel-eczanem-sayfa-zemini-25` | `#edf2f7` | :root, [data-tema="mavi"] | [app/tema.css:2967](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2967) |
| `--tema-yerel-eczanem-eylem-zemin-11` | `#173b63` | :root, [data-tema="mavi"] | [app/tema.css:2968](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2968) |
| `--tema-yerel-eczanem-eylem-zemin-12` | `#43a5d7` | :root, [data-tema="mavi"] | [app/tema.css:2969](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2969) |
| `--tema-yerel-eczanem-golge-06` | `rgba(35,122,200,0.18)` | :root, [data-tema="mavi"] | [app/tema.css:2970](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2970) |
| `--tema-yerel-eczanem-yardimci-metin-41` | `#cae8ff` | :root, [data-tema="mavi"] | [app/tema.css:2971](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2971) |
| `--tema-yerel-eczanem-cizgi-40` | `#d8e3ed` | :root, [data-tema="mavi"] | [app/tema.css:2972](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2972) |
| `--tema-yerel-eczanem-ana-metin-24` | `#475569` | :root, [data-tema="mavi"] | [app/tema.css:2973](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2973) |
| `--tema-yerel-eczanem-yardimci-metin-42` | `#536981` | :root, [data-tema="mavi"] | [app/tema.css:2974](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2974) |
| `--tema-yerel-giris-yardimci-metin-01` | `var(--color-gray-500)` | :root, [data-tema="mavi"] | [app/tema.css:2975](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2975) |
| `--tema-yerel-giris-odak-01` | `var(--color-gray-400)` | :root, [data-tema="mavi"] | [app/tema.css:2976](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2976) |
| `--tema-yerel-giris-yardimci-metin-02` | `var(--color-gray-400)` | :root, [data-tema="mavi"] | [app/tema.css:2977](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2977) |
| `--tema-yerel-giris-cizgi-01` | `var(--color-gray-100)` | :root, [data-tema="mavi"] | [app/tema.css:2978](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2978) |
| `--tema-yerel-giris-sayfa-zemini-01` | `var(--color-gray-100)` | :root, [data-tema="mavi"] | [app/tema.css:2979](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2979) |
| `--tema-yerel-giris-ana-metin-02` | `var(--color-gray-800)` | :root, [data-tema="mavi"] | [app/tema.css:2980](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2980) |
| `--tema-yerel-giris-yardimci-metin-03` | `#737373` | :root, [data-tema="mavi"] | [app/tema.css:2981](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2981) |
| `--tema-yerel-giris-sayfa-zemini-02` | `#f3f4f7` | :root, [data-tema="mavi"] | [app/tema.css:2982](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2982) |
| `--tema-yerel-giris-eylem-zemin-01` | `rgba(115,115,115,0.08)` | :root, [data-tema="mavi"] | [app/tema.css:2983](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2983) |
| `--tema-yerel-giris-cizgi-02` | `rgba(115,115,115,0.22)` | :root, [data-tema="mavi"] | [app/tema.css:2984](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2984) |
| `--tema-yerel-giris-ana-metin-03` | `var(--color-gray-900)` | :root, [data-tema="mavi"] | [app/tema.css:2985](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2985) |
| `--tema-yerel-giris-cizgi-03` | `var(--color-gray-300)` | :root, [data-tema="mavi"] | [app/tema.css:2986](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2986) |
| `--tema-yerel-giris-vurgu-cizgi-01` | `#bc2d0d` | :root, [data-tema="mavi"] | [app/tema.css:2987](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2987) |
| `--tema-yerel-giris-vurgu-odak-01` | `#bc2d0d` | :root, [data-tema="mavi"] | [app/tema.css:2988](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2988) |
| `--tema-yerel-giris-sayfa-zemini-03` | `var(--color-gray-50)` | :root, [data-tema="mavi"] | [app/tema.css:2989](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2989) |
| `--tema-yerel-giris-cizgi-04` | `var(--color-gray-200)` | :root, [data-tema="mavi"] | [app/tema.css:2990](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2990) |
| `--tema-yerel-giris-ana-metin-04` | `var(--color-gray-700)` | :root, [data-tema="mavi"] | [app/tema.css:2991](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2991) |
| `--tema-yerel-ortak-sayfa-cizgi-07` | `var(--color-neutral-200)` | :root, [data-tema="mavi"] | [app/tema.css:2992](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2992) |
| `--tema-yerel-ortak-sayfa-ana-metin-09` | `var(--color-neutral-800)` | :root, [data-tema="mavi"] | [app/tema.css:2993](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2993) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-13` | `var(--color-neutral-500)` | :root, [data-tema="mavi"] | [app/tema.css:2994](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2994) |
| `--tema-yerel-ortak-sayfa-sayfa-zemini-07` | `var(--color-neutral-100)` | :root, [data-tema="mavi"] | [app/tema.css:2995](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2995) |
| `--tema-yerel-ortak-sayfa-vurgu-zemin-01` | `#bc2d0d` | :root, [data-tema="mavi"] | [app/tema.css:2996](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2996) |
| `--tema-yerel-ortak-sayfa-vurgu-metin-01` | `#bc2d0d` | :root, [data-tema="mavi"] | [app/tema.css:2997](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2997) |
| `--tema-yerel-ortak-sayfa-secim-zemin-03` | `#eff6ff` | :root, [data-tema="mavi"] | [app/tema.css:2998](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2998) |
| `--tema-yerel-ortak-sayfa-eylem-metin-02` | `#1d4ed8` | :root, [data-tema="mavi"] | [app/tema.css:2999](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:2999) |
| `--tema-yerel-ortak-sayfa-sayfa-zemini-08` | `#f9fafb` | :root, [data-tema="mavi"] | [app/tema.css:3000](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3000) |
| `--tema-yerel-ortak-sayfa-ana-metin-10` | `#374151` | :root, [data-tema="mavi"] | [app/tema.css:3001](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3001) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-14` | `#737373` | :root, [data-tema="mavi"] | [app/tema.css:3002](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3002) |
| `--tema-yerel-ortak-sayfa-ana-metin-11` | `var(--color-gray-700)` | :root, [data-tema="mavi"] | [app/tema.css:3003](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3003) |
| `--tema-yerel-ortak-sayfa-eylem-metin-03` | `#56aeff` | :root, [data-tema="mavi"] | [app/tema.css:3004](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3004) |
| `--tema-yerel-ortak-sayfa-cizgi-08` | `var(--color-gray-100)` | :root, [data-tema="mavi"] | [app/tema.css:3005](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3005) |
| `--tema-yerel-ana-sayfa-ana-metin-01` | `var(--color-gray-900)` | :root, [data-tema="mavi"] | [app/tema.css:3006](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3006) |
| `--tema-yerel-ana-sayfa-yardimci-metin-03` | `var(--color-gray-500)` | :root, [data-tema="mavi"] | [app/tema.css:3007](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3007) |
| `--tema-yerel-ana-sayfa-eylem-zemin-01` | `#1e3a8a` | :root, [data-tema="mavi"] | [app/tema.css:3008](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3008) |
| `--tema-yerel-ana-sayfa-cizgi-03` | `#1e3a8a` | :root, [data-tema="mavi"] | [app/tema.css:3009](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3009) |
| `--tema-yerel-ana-sayfa-cizgi-04` | `var(--color-gray-200)` | :root, [data-tema="mavi"] | [app/tema.css:3010](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3010) |
| `--tema-yerel-ana-sayfa-eylem-zemin-02` | `#2f7fc7` | :root, [data-tema="mavi"] | [app/tema.css:3011](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3011) |
| `--tema-yerel-ana-sayfa-eylem-zemin-03` | `#256daf` | :root, [data-tema="mavi"] | [app/tema.css:3012](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3012) |
| `--tema-yerel-ana-sayfa-secim-zemin-02` | `#eff6ff` | :root, [data-tema="mavi"] | [app/tema.css:3013](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3013) |
| `--tema-yerel-ana-sayfa-eylem-metin-02` | `#1d4ed8` | :root, [data-tema="mavi"] | [app/tema.css:3014](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3014) |
| `--tema-yerel-ana-sayfa-sayfa-zemini-01` | `#f3f4f6` | :root, [data-tema="mavi"] | [app/tema.css:3015](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3015) |
| `--tema-yerel-ana-sayfa-yardimci-metin-04` | `#6b7280` | :root, [data-tema="mavi"] | [app/tema.css:3016](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3016) |
| `--tema-yerel-ana-sayfa-eylem-metin-03` | `#56aeff` | :root, [data-tema="mavi"] | [app/tema.css:3017](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3017) |
| `--tema-yerel-ana-sayfa-vurgu-metin-01` | `#bc2d0d` | :root, [data-tema="mavi"] | [app/tema.css:3018](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3018) |
| `--tema-yerel-ana-sayfa-cizgi-05` | `#f3f4f6` | :root, [data-tema="mavi"] | [app/tema.css:3019](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3019) |
| `--tema-yerel-ana-sayfa-sayfa-zemini-02` | `var(--color-gray-50)` | :root, [data-tema="mavi"] | [app/tema.css:3020](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3020) |
| `--tema-yerel-ana-sayfa-yardimci-metin-05` | `var(--color-gray-300)` | :root, [data-tema="mavi"] | [app/tema.css:3021](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3021) |
| `--tema-yerel-ana-sayfa-ana-metin-02` | `var(--color-gray-800)` | :root, [data-tema="mavi"] | [app/tema.css:3022](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3022) |
| `--tema-yerel-ana-sayfa-cizgi-06` | `var(--color-blue-200)` | :root, [data-tema="mavi"] | [app/tema.css:3023](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3023) |
| `--tema-yerel-ana-sayfa-secim-zemin-03` | `var(--color-blue-50)` | :root, [data-tema="mavi"] | [app/tema.css:3024](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3024) |
| `--tema-yerel-ana-sayfa-ana-metin-03` | `var(--color-blue-900)` | :root, [data-tema="mavi"] | [app/tema.css:3025](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3025) |
| `--tema-yerel-ana-sayfa-eylem-zemin-04` | `var(--color-blue-600)` | :root, [data-tema="mavi"] | [app/tema.css:3026](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3026) |
| `--tema-yerel-ana-sayfa-eylem-metin-04` | `var(--color-blue-600)` | :root, [data-tema="mavi"] | [app/tema.css:3027](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3027) |
| `--tema-yerel-ana-sayfa-secim-zemin-04` | `var(--color-blue-100)` | :root, [data-tema="mavi"] | [app/tema.css:3028](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3028) |
| `--tema-yerel-ana-sayfa-cizgi-07` | `var(--color-blue-100)` | :root, [data-tema="mavi"] | [app/tema.css:3029](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3029) |
| `--tema-yerel-ana-sayfa-eylem-metin-05` | `var(--color-blue-700)` | :root, [data-tema="mavi"] | [app/tema.css:3030](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3030) |
| `--tema-yerel-ana-sayfa-cizgi-08` | `#dfe7f1` | :root, [data-tema="mavi"] | [app/tema.css:3031](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3031) |
| `--tema-yerel-ana-sayfa-yardimci-metin-06` | `#9ca3af` | :root, [data-tema="mavi"] | [app/tema.css:3032](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3032) |
| `--tema-yerel-ana-sayfa-cizgi-09` | `#e5e7eb` | :root, [data-tema="mavi"] | [app/tema.css:3033](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3033) |
| `--tema-yerel-ana-sayfa-sayfa-zemini-03` | `var(--color-gray-200)` | :root, [data-tema="mavi"] | [app/tema.css:3034](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3034) |
| `--tema-yerel-ana-sayfa-ana-metin-04` | `var(--color-gray-600)` | :root, [data-tema="mavi"] | [app/tema.css:3035](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3035) |
| `--tema-yerel-ana-sayfa-cizgi-11` | `var(--color-gray-300)` | :root, [data-tema="mavi"] | [app/tema.css:3036](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3036) |
| `--tema-yerel-ana-sayfa-cizgi-12` | `#bfdbfe` | :root, [data-tema="mavi"] | [app/tema.css:3037](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3037) |
| `--tema-yerel-ana-sayfa-eylem-metin-06` | `#0ea5e9` | :root, [data-tema="mavi"] | [app/tema.css:3038](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3038) |
| `--tema-yerel-ana-sayfa-secim-zemin-05` | `#b5d4f4` | :root, [data-tema="mavi"] | [app/tema.css:3039](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3039) |
| `--tema-yerel-ana-sayfa-sayfa-zemini-04` | `#e5e7eb` | :root, [data-tema="mavi"] | [app/tema.css:3040](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3040) |
| `--tema-yerel-ana-sayfa-ana-metin-05` | `#374151` | :root, [data-tema="mavi"] | [app/tema.css:3041](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3041) |
| `--tema-yerel-giris-vurgu-zemin-01` | `#bc2d0d` | :root, [data-tema="mavi"] | [app/tema.css:3042](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3042) |
| `--tema-yerel-lig-cizgi-06` | `#f3f4f6` | :root, [data-tema="mavi"] | [app/tema.css:3043](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3043) |
| `--tema-yerel-lig-sayfa-zemini-08` | `#fafafa` | :root, [data-tema="mavi"] | [app/tema.css:3044](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3044) |
| `--tema-yerel-lig-yardimci-metin-09` | `#8a99aa` | :root, [data-tema="mavi"] | [app/tema.css:3045](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3045) |
| `--tema-yerel-lig-cizgi-07` | `#e5ecf4` | :root, [data-tema="mavi"] | [app/tema.css:3046](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3046) |
| `--tema-yerel-lig-yardimci-metin-10` | `#7b8da5` | :root, [data-tema="mavi"] | [app/tema.css:3047](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3047) |
| `--tema-yerel-lig-cizgi-08` | `#e7edf4` | :root, [data-tema="mavi"] | [app/tema.css:3048](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3048) |
| `--tema-yerel-lig-ana-metin-07` | `#405976` | :root, [data-tema="mavi"] | [app/tema.css:3049](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3049) |
| `--tema-yerel-lig-eylem-zemin-02` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:3050](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3050) |
| `--tema-yerel-lig-eylem-zemin-03` | `#1d69aa` | :root, [data-tema="mavi"] | [app/tema.css:3051](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3051) |
| `--tema-yerel-lig-yardimci-metin-11` | `#617894` | :root, [data-tema="mavi"] | [app/tema.css:3052](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3052) |
| `--tema-yerel-eclub-eylem-metin-08` | `var(--color-blue-700)` | :root, [data-tema="mavi"] | [app/tema.css:3053](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3053) |
| `--tema-yerel-eclub-yardimci-metin-44` | `#8494ad` | :root, [data-tema="mavi"] | [app/tema.css:3054](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3054) |
| `--tema-yerel-eclub-ana-metin-27` | `#111d35` | :root, [data-tema="mavi"] | [app/tema.css:3055](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3055) |
| `--tema-yerel-eclub-cizgi-40` | `#e3eaf2` | :root, [data-tema="mavi"] | [app/tema.css:3056](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3056) |
| `--tema-yerel-eclub-yardimci-metin-45` | `#526a86` | :root, [data-tema="mavi"] | [app/tema.css:3057](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3057) |
| `--tema-yerel-eclub-secim-zemin-13` | `#eaf2fb` | :root, [data-tema="mavi"] | [app/tema.css:3058](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3058) |
| `--tema-yerel-eclub-eylem-metin-09` | `#3978ae` | :root, [data-tema="mavi"] | [app/tema.css:3059](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3059) |
| `--tema-yerel-eclub-yardimci-metin-46` | `#a3b2c8` | :root, [data-tema="mavi"] | [app/tema.css:3060](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3060) |
| `--tema-yerel-eclub-eylem-metin-10` | `#24618f` | :root, [data-tema="mavi"] | [app/tema.css:3061](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3061) |
| `--tema-yerel-eclub-secim-zemin-14` | `rgba(235,247,255,0.72)` | :root, [data-tema="mavi"] | [app/tema.css:3062](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3062) |
| `--tema-yerel-eclub-sayfa-zemini-20` | `#fcfdff` | :root, [data-tema="mavi"] | [app/tema.css:3063](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3063) |
| `--tema-yerel-eclub-golge-12` | `rgba(31,54,89,0.09)` | :root, [data-tema="mavi"] | [app/tema.css:3064](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3064) |
| `--tema-yerel-eclub-cizgi-41` | `#cbd7e7` | :root, [data-tema="mavi"] | [app/tema.css:3065](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3065) |
| `--tema-yerel-eclub-ana-metin-28` | `#344966` | :root, [data-tema="mavi"] | [app/tema.css:3066](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3066) |
| `--tema-yerel-eclub-eylem-zemin-14` | `#2a80d7` | :root, [data-tema="mavi"] | [app/tema.css:3067](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3067) |
| `--tema-yerel-eclub-eylem-zemin-15` | `#216fbf` | :root, [data-tema="mavi"] | [app/tema.css:3068](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3068) |
| `--tema-yerel-eclub-cizgi-42` | `#edf2f8` | :root, [data-tema="mavi"] | [app/tema.css:3069](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3069) |
| `--tema-yerel-eclub-sayfa-zemini-21` | `#f6fbfb` | :root, [data-tema="mavi"] | [app/tema.css:3070](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3070) |
| `--tema-yerel-eclub-secim-zemin-15` | `#f1f6ff` | :root, [data-tema="mavi"] | [app/tema.css:3071](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3071) |
| `--tema-yerel-eclub-eylem-metin-11` | `#2864e8` | :root, [data-tema="mavi"] | [app/tema.css:3072](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3072) |
| `--tema-yerel-eclub-secim-zemin-16` | `#e7efff` | :root, [data-tema="mavi"] | [app/tema.css:3073](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3073) |
| `--tema-yerel-eclub-eylem-metin-12` | `#2462e8` | :root, [data-tema="mavi"] | [app/tema.css:3074](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3074) |
| `--tema-yerel-eclub-secim-zemin-17` | `#cbd5e1` | :root, [data-tema="mavi"] | [app/tema.css:3075](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3075) |
| `--tema-yerel-eclub-dekoratif-zemin-12` | `#3477f2` | :root, [data-tema="mavi"] | [app/tema.css:3076](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3076) |
| `--tema-yerel-eclub-dekoratif-zemin-13` | `#205de9` | :root, [data-tema="mavi"] | [app/tema.css:3077](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3077) |
| `--tema-yerel-eclub-golge-13` | `rgba(37,96,226,0.2)` | :root, [data-tema="mavi"] | [app/tema.css:3078](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3078) |
| `--tema-yerel-eclub-secim-zemin-18` | `#e8eef5` | :root, [data-tema="mavi"] | [app/tema.css:3079](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3079) |
| `--tema-yerel-eclub-cizgi-44` | `var(--color-indigo-100)` | :root, [data-tema="mavi"] | [app/tema.css:3080](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3080) |
| `--tema-yerel-eclub-secim-zemin-19` | `var(--color-indigo-50)` | :root, [data-tema="mavi"] | [app/tema.css:3081](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3081) |
| `--tema-yerel-eclub-eylem-metin-13` | `#3589d8` | :root, [data-tema="mavi"] | [app/tema.css:3082](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3082) |
| `--tema-yerel-eclub-cizgi-45` | `#87bde8` | :root, [data-tema="mavi"] | [app/tema.css:3083](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3083) |
| `--tema-yerel-eclub-sayfa-zemini-22` | `#f1f6fa` | :root, [data-tema="mavi"] | [app/tema.css:3084](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3084) |
| `--tema-yerel-eclub-yardimci-metin-47` | `#8ba0b5` | :root, [data-tema="mavi"] | [app/tema.css:3085](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3085) |
| `--tema-yerel-eclub-cizgi-46` | `#d7e4ef` | :root, [data-tema="mavi"] | [app/tema.css:3086](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3086) |
| `--tema-yerel-eclub-cizgi-47` | `#3589d8` | :root, [data-tema="mavi"] | [app/tema.css:3087](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3087) |
| `--tema-yerel-eclub-sayfa-zemini-23` | `#f1f6fb` | :root, [data-tema="mavi"] | [app/tema.css:3088](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3088) |
| `--tema-yerel-eclub-ana-metin-29` | `#476078` | :root, [data-tema="mavi"] | [app/tema.css:3089](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3089) |
| `--tema-yerel-eclub-golge-14` | `rgb(31 55 90 / 12%)` | :root, [data-tema="mavi"] | [app/tema.css:3090](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3090) |
| `--tema-yerel-eclub-golge-15` | `rgb(31 55 90 / 8%)` | :root, [data-tema="mavi"] | [app/tema.css:3091](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3091) |
| `--tema-yerel-eclub-secim-zemin-20` | `#dfeffc` | :root, [data-tema="mavi"] | [app/tema.css:3092](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3092) |
| `--tema-yerel-eclub-golge-16` | `rgba(36, 64, 98, 0.06)` | :root, [data-tema="mavi"] | [app/tema.css:3093](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3093) |
| `--tema-yerel-eclub-secim-zemin-21` | `#87bde8` | :root, [data-tema="mavi"] | [app/tema.css:3094](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3094) |
| `--tema-yerel-eclub-yardimci-metin-48` | `#7c8da4` | :root, [data-tema="mavi"] | [app/tema.css:3095](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3095) |
| `--tema-yerel-eclub-yardimci-metin-49` | `#8c9aad` | :root, [data-tema="mavi"] | [app/tema.css:3096](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3096) |
| `--tema-yerel-eclub-yardimci-metin-50` | `#8493a8` | :root, [data-tema="mavi"] | [app/tema.css:3097](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3097) |
| `--tema-yerel-eclub-yardimci-metin-51` | `#8292a8` | :root, [data-tema="mavi"] | [app/tema.css:3098](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3098) |
| `--tema-yerel-eclub-yardimci-metin-52` | `#8b99ad` | :root, [data-tema="mavi"] | [app/tema.css:3099](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3099) |
| `--tema-yerel-eclub-cizgi-48` | `#f0f3f7` | :root, [data-tema="mavi"] | [app/tema.css:3100](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3100) |
| `--tema-yerel-eclub-secim-zemin-22` | `#edf3fa` | :root, [data-tema="mavi"] | [app/tema.css:3101](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3101) |
| `--tema-yerel-eclub-yardimci-metin-53` | `#6b829e` | :root, [data-tema="mavi"] | [app/tema.css:3102](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3102) |
| `--tema-yerel-eclub-yardimci-metin-54` | `#6d7f98` | :root, [data-tema="mavi"] | [app/tema.css:3103](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3103) |
| `--tema-yerel-eclub-sayfa-zemini-24` | `#edf1f7` | :root, [data-tema="mavi"] | [app/tema.css:3104](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3104) |
| `--tema-yerel-eclub-secim-zemin-23` | `#edf5ff` | :root, [data-tema="mavi"] | [app/tema.css:3105](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3105) |
| `--tema-yerel-ortak-sayfa-eylem-metin-04` | `#185fa5` | :root, [data-tema="mavi"] | [app/tema.css:3106](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3106) |
| `--tema-yerel-ortak-sayfa-ana-metin-12` | `#0c447c` | :root, [data-tema="mavi"] | [app/tema.css:3107](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3107) |
| `--tema-yerel-ortak-sayfa-eylem-zemin-04` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:3108](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3108) |
| `--tema-yerel-ortak-sayfa-ana-metin-13` | `var(--color-gray-800)` | :root, [data-tema="mavi"] | [app/tema.css:3109](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3109) |
| `--tema-yerel-ortak-sayfa-secim-zemin-04` | `var(--color-blue-50)` | :root, [data-tema="mavi"] | [app/tema.css:3110](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3110) |
| `--tema-yerel-ortak-sayfa-secim-zemin-05` | `var(--color-blue-100)` | :root, [data-tema="mavi"] | [app/tema.css:3111](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3111) |
| `--tema-yerel-ortak-sayfa-secim-zemin-06` | `var(--color-blue-200)` | :root, [data-tema="mavi"] | [app/tema.css:3112](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3112) |
| `--tema-yerel-ortak-sayfa-cizgi-10` | `var(--color-blue-200)` | :root, [data-tema="mavi"] | [app/tema.css:3113](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3113) |
| `--tema-yerel-ortak-sayfa-eylem-metin-05` | `var(--color-blue-400)` | :root, [data-tema="mavi"] | [app/tema.css:3114](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3114) |
| `--tema-yerel-lig-ana-metin-08` | `#3b516e` | :root, [data-tema="mavi"] | [app/tema.css:3115](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3115) |
| `--tema-yerel-lig-eylem-metin-03` | `#4d8ed8` | :root, [data-tema="mavi"] | [app/tema.css:3116](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3116) |
| `--tema-yerel-lig-cizgi-09` | `rgba(148, 163, 184, .18)` | :root, [data-tema="mavi"] | [app/tema.css:3117](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3117) |
| `--tema-yerel-lig-golge-02` | `rgba(36, 64, 98, .055)` | :root, [data-tema="mavi"] | [app/tema.css:3118](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3118) |
| `--tema-yerel-lig-secim-zemin-03` | `#eaf5ff` | :root, [data-tema="mavi"] | [app/tema.css:3119](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3119) |
| `--tema-yerel-lig-eylem-metin-04` | `#2f9ae9` | :root, [data-tema="mavi"] | [app/tema.css:3120](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3120) |
| `--tema-yerel-lig-ana-metin-09` | `#13253f` | :root, [data-tema="mavi"] | [app/tema.css:3121](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3121) |
| `--tema-yerel-lig-yardimci-metin-12` | `#8190a4` | :root, [data-tema="mavi"] | [app/tema.css:3122](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3122) |
| `--tema-yerel-lig-secim-zemin-04` | `#edf6ff` | :root, [data-tema="mavi"] | [app/tema.css:3123](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3123) |
| `--tema-yerel-lig-eylem-metin-05` | `#3599ee` | :root, [data-tema="mavi"] | [app/tema.css:3124](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3124) |
| `--tema-yerel-lig-secim-zemin-05` | `#eff6fd` | :root, [data-tema="mavi"] | [app/tema.css:3125](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3125) |
| `--tema-yerel-lig-eylem-metin-06` | `#398dd7` | :root, [data-tema="mavi"] | [app/tema.css:3126](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3126) |
| `--tema-yerel-lig-sayfa-zemini-09` | `#f8fafc` | :root, [data-tema="mavi"] | [app/tema.css:3127](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3127) |
| `--tema-yerel-lig-cizgi-10` | `#d7e7f6` | :root, [data-tema="mavi"] | [app/tema.css:3128](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3128) |
| `--tema-yerel-lig-cizgi-11` | `#8fc7f5` | :root, [data-tema="mavi"] | [app/tema.css:3129](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3129) |
| `--tema-yerel-lig-secim-zemin-06` | `#eef7ff` | :root, [data-tema="mavi"] | [app/tema.css:3130](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3130) |
| `--tema-yerel-lig-sayfa-zemini-10` | `#eef2f6` | :root, [data-tema="mavi"] | [app/tema.css:3131](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3131) |
| `--tema-yerel-lig-yardimci-metin-13` | `#8795a8` | :root, [data-tema="mavi"] | [app/tema.css:3132](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3132) |
| `--tema-yerel-lig-secim-zemin-07` | `#e8edf3` | :root, [data-tema="mavi"] | [app/tema.css:3133](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3133) |
| `--tema-yerel-lig-dekoratif-zemin-01` | `#4a9fe8` | :root, [data-tema="mavi"] | [app/tema.css:3134](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3134) |
| `--tema-yerel-lig-dekoratif-zemin-02` | `#69b6f2` | :root, [data-tema="mavi"] | [app/tema.css:3135](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3135) |
| `--tema-yerel-lig-eylem-metin-07` | `#268fdf` | :root, [data-tema="mavi"] | [app/tema.css:3136](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3136) |
| `--tema-yerel-lig-ana-metin-10` | `#263a55` | :root, [data-tema="mavi"] | [app/tema.css:3137](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3137) |
| `--tema-yerel-lig-sayfa-zemini-11` | `#f4f7fb` | :root, [data-tema="mavi"] | [app/tema.css:3138](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3138) |
| `--tema-yerel-lig-yardimci-metin-14` | `#667991` | :root, [data-tema="mavi"] | [app/tema.css:3139](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3139) |
| `--tema-yerel-lig-cizgi-12` | `#edf1f5` | :root, [data-tema="mavi"] | [app/tema.css:3140](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3140) |
| `--tema-yerel-lig-yardimci-metin-15` | `#8a98aa` | :root, [data-tema="mavi"] | [app/tema.css:3141](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3141) |
| `--tema-yerel-lig-sayfa-zemini-12` | `#f8fbfe` | :root, [data-tema="mavi"] | [app/tema.css:3142](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3142) |
| `--tema-yerel-lig-eylem-metin-08` | `#258edc` | :root, [data-tema="mavi"] | [app/tema.css:3143](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3143) |
| `--tema-yerel-lig-yardimci-metin-16` | `#6f91ad` | :root, [data-tema="mavi"] | [app/tema.css:3144](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3144) |
| `--tema-yerel-lig-cizgi-13` | `#dfebf5` | :root, [data-tema="mavi"] | [app/tema.css:3145](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3145) |
| `--tema-yerel-lig-yardimci-metin-17` | `#8293a7` | :root, [data-tema="mavi"] | [app/tema.css:3146](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3146) |
| `--tema-yerel-lig-ana-metin-11` | `#344a65` | :root, [data-tema="mavi"] | [app/tema.css:3147](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3147) |
| `--tema-yerel-lig-eylem-metin-09` | `#4385b8` | :root, [data-tema="mavi"] | [app/tema.css:3148](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3148) |
| `--tema-yerel-lig-yardimci-metin-18` | `#7c8fa4` | :root, [data-tema="mavi"] | [app/tema.css:3149](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3149) |
| `--tema-yerel-lig-ana-metin-12` | `#253a55` | :root, [data-tema="mavi"] | [app/tema.css:3150](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3150) |
| `--tema-yerel-lig-yardimci-metin-19` | `#6f8299` | :root, [data-tema="mavi"] | [app/tema.css:3151](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3151) |
| `--tema-yerel-lig-yardimci-metin-20` | `#7b8ca5` | :root, [data-tema="mavi"] | [app/tema.css:3152](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3152) |
| `--tema-yerel-lig-ana-metin-13` | `#52647c` | :root, [data-tema="mavi"] | [app/tema.css:3153](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3153) |
| `--tema-yerel-lig-cizgi-14` | `#e2eaf3` | :root, [data-tema="mavi"] | [app/tema.css:3154](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3154) |
| `--tema-yerel-lig-cizgi-15` | `#8fc7f4` | :root, [data-tema="mavi"] | [app/tema.css:3155](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3155) |
| `--tema-yerel-lig-secim-zemin-08` | `#f4f9ff` | :root, [data-tema="mavi"] | [app/tema.css:3156](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3156) |
| `--tema-yerel-lig-cizgi-16` | `#e3eaf2` | :root, [data-tema="mavi"] | [app/tema.css:3157](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3157) |
| `--tema-yerel-lig-odak-01` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:3158](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3158) |
| `--tema-yerel-lig-ana-metin-14` | `#253750` | :root, [data-tema="mavi"] | [app/tema.css:3159](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3159) |
| `--tema-yerel-lig-yardimci-metin-21` | `#8493a7` | :root, [data-tema="mavi"] | [app/tema.css:3160](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3160) |
| `--tema-yerel-lig-yardimci-metin-22` | `#60728f` | :root, [data-tema="mavi"] | [app/tema.css:3161](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3161) |
| `--tema-yerel-lig-golge-03` | `rgba(35,122,200,.1)` | :root, [data-tema="mavi"] | [app/tema.css:3162](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3162) |
| `--tema-yerel-lig-yardimci-metin-23` | `#94a0b1` | :root, [data-tema="mavi"] | [app/tema.css:3163](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3163) |
| `--tema-yerel-lig-cizgi-17` | `#dfe8f2` | :root, [data-tema="mavi"] | [app/tema.css:3164](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3164) |
| `--tema-yerel-lig-cizgi-18` | `var(--color-blue-500)` | :root, [data-tema="mavi"] | [app/tema.css:3165](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3165) |
| `--tema-yerel-lig-cizgi-19` | `#edf0f4` | :root, [data-tema="mavi"] | [app/tema.css:3166](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3166) |
| `--tema-yerel-lig-eylem-metin-10` | `#2f80ed` | :root, [data-tema="mavi"] | [app/tema.css:3167](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3167) |
| `--tema-yerel-lig-secim-zemin-09` | `#edf3f9` | :root, [data-tema="mavi"] | [app/tema.css:3168](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3168) |
| `--tema-yerel-lig-yardimci-metin-24` | `#a7b3c2` | :root, [data-tema="mavi"] | [app/tema.css:3169](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3169) |
| `--tema-yerel-lig-yardimci-metin-25` | `#687991` | :root, [data-tema="mavi"] | [app/tema.css:3170](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3170) |
| `--tema-yerel-lig-ana-metin-15` | `#3b4d66` | :root, [data-tema="mavi"] | [app/tema.css:3171](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3171) |
| `--tema-yerel-lig-yardimci-metin-26` | `#5b7fa2` | :root, [data-tema="mavi"] | [app/tema.css:3172](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3172) |
| `--tema-yerel-lig-ana-metin-16` | `#243650` | :root, [data-tema="mavi"] | [app/tema.css:3173](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3173) |
| `--tema-yerel-lig-yardimci-metin-27` | `#8290a3` | :root, [data-tema="mavi"] | [app/tema.css:3174](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3174) |
| `--tema-yerel-lig-eylem-metin-11` | `#3589d8` | :root, [data-tema="mavi"] | [app/tema.css:3175](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3175) |
| `--tema-yerel-lig-ana-metin-17` | `#172033` | :root, [data-tema="mavi"] | [app/tema.css:3176](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3176) |
| `--tema-yerel-lig-ana-metin-18` | `#555e6b` | :root, [data-tema="mavi"] | [app/tema.css:3177](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3177) |
| `--tema-yerel-lig-secim-zemin-10` | `#eef6ff` | :root, [data-tema="mavi"] | [app/tema.css:3178](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3178) |
| `--tema-yerel-lig-eylem-metin-12` | `#1761cf` | :root, [data-tema="mavi"] | [app/tema.css:3179](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3179) |
| `--tema-yerel-lig-eylem-metin-13` | `#174fc2` | :root, [data-tema="mavi"] | [app/tema.css:3180](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3180) |
| `--tema-yerel-lig-cizgi-20` | `#e8edf4` | :root, [data-tema="mavi"] | [app/tema.css:3181](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3181) |
| `--tema-yerel-lig-golge-04` | `rgba(36,64,98,0.04)` | :root, [data-tema="mavi"] | [app/tema.css:3182](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3182) |
| `--tema-yerel-lig-ana-metin-19` | `#20324c` | :root, [data-tema="mavi"] | [app/tema.css:3183](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3183) |
| `--tema-yerel-lig-sayfa-zemini-13` | `#f2f5f9` | :root, [data-tema="mavi"] | [app/tema.css:3184](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3184) |
| `--tema-yerel-lig-cizgi-21` | `rgba(148, 163, 184, 0.2)` | :root, [data-tema="mavi"] | [app/tema.css:3185](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3185) |
| `--tema-yerel-lig-golge-05` | `rgba(36, 64, 98, 0.06)` | :root, [data-tema="mavi"] | [app/tema.css:3186](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3186) |
| `--tema-yerel-lig-golge-07` | `rgba(15, 23, 42, 0.18)` | :root, [data-tema="mavi"] | [app/tema.css:3187](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3187) |
| `--tema-yerel-lig-eylem-zemin-04` | `rgba(20, 23, 27, 0.5)` | :root, [data-tema="mavi"] | [app/tema.css:3188](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3188) |
| `--tema-yerel-lig-yardimci-metin-28` | `#f8fafc` | :root, [data-tema="mavi"] | [app/tema.css:3189](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3189) |
| `--tema-yerel-lig-yardimci-metin-29` | `#66809f` | :root, [data-tema="mavi"] | [app/tema.css:3190](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3190) |
| `--tema-yerel-ortak-sayfa-cizgi-11` | `var(--color-gray-300)` | :root, [data-tema="mavi"] | [app/tema.css:3191](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3191) |
| `--tema-yerel-ortak-sayfa-eylem-zemin-05` | `var(--color-slate-900)` | :root, [data-tema="mavi"] | [app/tema.css:3192](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3192) |
| `--tema-yerel-ortak-sayfa-eylem-zemin-06` | `var(--color-slate-900)` | :root, [data-tema="mavi"] | [app/tema.css:3193](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3193) |
| `--tema-yerel-ortak-sayfa-eylem-zemin-07` | `var(--color-slate-800)` | :root, [data-tema="mavi"] | [app/tema.css:3194](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3194) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-15` | `var(--color-slate-400)` | :root, [data-tema="mavi"] | [app/tema.css:3195](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3195) |
| `--tema-yerel-ortak-sayfa-ana-metin-14` | `var(--color-slate-950)` | :root, [data-tema="mavi"] | [app/tema.css:3196](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3196) |
| `--tema-yerel-ortak-sayfa-ana-metin-15` | `var(--color-slate-800)` | :root, [data-tema="mavi"] | [app/tema.css:3197](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3197) |
| `--tema-yerel-ortak-sayfa-eylem-metin-06` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:3198](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3198) |
| `--tema-yerel-ortak-sayfa-odak-02` | `#78b4e7` | :root, [data-tema="mavi"] | [app/tema.css:3199](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3199) |
| `--tema-yerel-ortak-sayfa-odak-03` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:3200](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3200) |
| `--tema-yerel-ortak-sayfa-eylem-zemin-08` | `#10233a` | :root, [data-tema="mavi"] | [app/tema.css:3201](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3201) |
| `--tema-yerel-ortak-sayfa-eylem-metin-07` | `#287fce` | :root, [data-tema="mavi"] | [app/tema.css:3202](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3202) |
| `--tema-yerel-ortak-sayfa-eylem-zemin-09` | `#56aeff` | :root, [data-tema="mavi"] | [app/tema.css:3203](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3203) |
| `--tema-yerel-ortak-sayfa-ana-metin-16` | `#111` | :root, [data-tema="mavi"] | [app/tema.css:3204](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3204) |
| `--tema-yerel-ortak-sayfa-golge-04` | `#25252508` | :root, [data-tema="mavi"] | [app/tema.css:3205](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3205) |
| `--tema-yerel-ortak-sayfa-golge-05` | `#282c3309` | :root, [data-tema="mavi"] | [app/tema.css:3206](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3206) |
| `--tema-yerel-rapor-golge-14` | `rgba(36,64,98,0.05)` | :root, [data-tema="mavi"] | [app/tema.css:3207](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3207) |
| `--tema-yerel-rapor-yardimci-metin-61` | `#66809f` | :root, [data-tema="mavi"] | [app/tema.css:3208](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3208) |
| `--tema-yerel-rapor-cizgi-42` | `#e5e7eb` | :root, [data-tema="mavi"] | [app/tema.css:3209](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3209) |
| `--tema-yerel-rapor-cizgi-43` | `var(--color-gray-200)` | :root, [data-tema="mavi"] | [app/tema.css:3210](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3210) |
| `--tema-yerel-rapor-yardimci-metin-62` | `var(--color-gray-400)` | :root, [data-tema="mavi"] | [app/tema.css:3211](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3211) |
| `--tema-yerel-rapor-ana-metin-19` | `var(--color-gray-900)` | :root, [data-tema="mavi"] | [app/tema.css:3212](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3212) |
| `--tema-yerel-rapor-sayfa-zemini-28` | `var(--color-slate-50)` | :root, [data-tema="mavi"] | [app/tema.css:3213](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3213) |
| `--tema-yerel-rapor-yardimci-metin-63` | `#8a9aaf` | :root, [data-tema="mavi"] | [app/tema.css:3214](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3214) |
| `--tema-yerel-rapor-golge-15` | `rgba(31,55,84,0.06)` | :root, [data-tema="mavi"] | [app/tema.css:3215](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3215) |
| `--tema-yerel-rapor-ana-metin-20` | `#18304f` | :root, [data-tema="mavi"] | [app/tema.css:3216](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3216) |
| `--tema-yerel-rapor-cizgi-44` | `#cbd9e7` | :root, [data-tema="mavi"] | [app/tema.css:3217](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3217) |
| `--tema-yerel-rapor-yardimci-metin-64` | `#788ca2` | :root, [data-tema="mavi"] | [app/tema.css:3218](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3218) |
| `--tema-yerel-rapor-yardimci-metin-65` | `#8da0b3` | :root, [data-tema="mavi"] | [app/tema.css:3219](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3219) |
| `--tema-yerel-rapor-cizgi-45` | `#f0f4f8` | :root, [data-tema="mavi"] | [app/tema.css:3220](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3220) |
| `--tema-yerel-rapor-secim-zemin-14` | `#edf3f9` | :root, [data-tema="mavi"] | [app/tema.css:3221](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3221) |
| `--tema-yerel-rapor-ana-metin-21` | `#475e7a` | :root, [data-tema="mavi"] | [app/tema.css:3222](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3222) |
| `--tema-yerel-rapor-yardimci-metin-66` | `#94a3b8` | :root, [data-tema="mavi"] | [app/tema.css:3223](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3223) |
| `--tema-yerel-rapor-ana-metin-22` | `#243c5a` | :root, [data-tema="mavi"] | [app/tema.css:3224](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3224) |
| `--tema-yerel-rapor-secim-zemin-15` | `#edf4fb` | :root, [data-tema="mavi"] | [app/tema.css:3225](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3225) |
| `--tema-yerel-rapor-cizgi-46` | `#f1f5f9` | :root, [data-tema="mavi"] | [app/tema.css:3226](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3226) |
| `--tema-yerel-rapor-cizgi-47` | `#dbe9f6` | :root, [data-tema="mavi"] | [app/tema.css:3227](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3227) |
| `--tema-yerel-rapor-yardimci-metin-67` | `#496985` | :root, [data-tema="mavi"] | [app/tema.css:3228](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3228) |
| `--tema-yerel-rapor-eylem-metin-13` | `#285b86` | :root, [data-tema="mavi"] | [app/tema.css:3229](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3229) |
| `--tema-yerel-rapor-secim-zemin-16` | `#e7f3ff` | :root, [data-tema="mavi"] | [app/tema.css:3230](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3230) |
| `--tema-yerel-rapor-eylem-zemin-04` | `rgba(86,174,255,0.12)` | :root, [data-tema="mavi"] | [app/tema.css:3231](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3231) |
| `--tema-yerel-rapor-eylem-metin-14` | `#185fa5` | :root, [data-tema="mavi"] | [app/tema.css:3232](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3232) |
| `--tema-yerel-rapor-ana-metin-23` | `#374151` | :root, [data-tema="mavi"] | [app/tema.css:3233](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3233) |
| `--tema-yerel-rapor-yardimci-metin-68` | `#9ca3af` | :root, [data-tema="mavi"] | [app/tema.css:3234](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3234) |
| `--tema-yerel-uretim-ana-metin-29` | `#263e5b` | :root, [data-tema="mavi"] | [app/tema.css:3235](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3235) |
| `--tema-yerel-uretim-yardimci-metin-42` | `#8191a4` | :root, [data-tema="mavi"] | [app/tema.css:3236](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3236) |
| `--tema-yerel-uretim-cizgi-51` | `#e0e7ee` | :root, [data-tema="mavi"] | [app/tema.css:3237](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3237) |
| `--tema-yerel-uretim-cizgi-52` | `#6eaae0` | :root, [data-tema="mavi"] | [app/tema.css:3238](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3238) |
| `--tema-yerel-uretim-secim-zemin-18` | `#edf6fd` | :root, [data-tema="mavi"] | [app/tema.css:3239](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3239) |
| `--tema-yerel-uretim-eylem-metin-19` | `#236fac` | :root, [data-tema="mavi"] | [app/tema.css:3240](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3240) |
| `--tema-yerel-uretim-odak-03` | `#6eaae0` | :root, [data-tema="mavi"] | [app/tema.css:3241](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3241) |
| `--tema-yerel-uretim-cizgi-53` | `#dfe6ed` | :root, [data-tema="mavi"] | [app/tema.css:3242](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3242) |
| `--tema-yerel-uretim-yardimci-metin-43` | `#5e7186` | :root, [data-tema="mavi"] | [app/tema.css:3243](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3243) |
| `--tema-yerel-uretim-cizgi-54` | `#b8cddd` | :root, [data-tema="mavi"] | [app/tema.css:3244](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3244) |
| `--tema-yerel-uretim-eylem-zemin-12` | `#1d69aa` | :root, [data-tema="mavi"] | [app/tema.css:3245](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3245) |
| `--tema-yerel-magaza-yardimci-metin-25` | `#95a6bb` | :root, [data-tema="mavi"] | [app/tema.css:3246](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3246) |
| `--tema-yerel-magaza-sayfa-zemini-13` | `#edf2f7` | :root, [data-tema="mavi"] | [app/tema.css:3247](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3247) |
| `--tema-yerel-magaza-ana-metin-10` | `#4a5568` | :root, [data-tema="mavi"] | [app/tema.css:3248](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3248) |
| `--tema-yerel-magaza-odak-01` | `#237ac8` | :root, [data-tema="mavi"] | [app/tema.css:3249](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3249) |
| `--tema-yerel-magaza-ana-metin-11` | `#3a516b` | :root, [data-tema="mavi"] | [app/tema.css:3250](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3250) |
| `--tema-yerel-uretim-vurgu-golge-01` | `#bc2d0d` | :root, [data-tema="mavi"] | [app/tema.css:3251](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3251) |
| `--tema-yerel-ortak-sayfa-eylem-metin-08` | `#347eb9` | :root, [data-tema="mavi"] | [app/tema.css:3252](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3252) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-16` | `#8395aa` | :root, [data-tema="mavi"] | [app/tema.css:3253](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3253) |
| `--tema-yerel-ortak-sayfa-eylem-metin-09` | `#39749f` | :root, [data-tema="mavi"] | [app/tema.css:3254](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3254) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-17` | `#7c8da1` | :root, [data-tema="mavi"] | [app/tema.css:3255](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3255) |
| `--tema-yerel-ortak-sayfa-eylem-zemin-10` | `#172b4d` | :root, [data-tema="mavi"] | [app/tema.css:3256](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3256) |
| `--tema-yerel-ortak-sayfa-golge-06` | `rgba(23,43,77,0.3)` | :root, [data-tema="mavi"] | [app/tema.css:3257](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3257) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-18` | `#b8cade` | :root, [data-tema="mavi"] | [app/tema.css:3258](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3258) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-19` | `#d9e6f3` | :root, [data-tema="mavi"] | [app/tema.css:3259](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3259) |
| `--tema-yerel-ortak-sayfa-secim-zemin-07` | `#edf6ff` | :root, [data-tema="mavi"] | [app/tema.css:3260](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3260) |
| `--tema-yerel-ortak-sayfa-eylem-zemin-11` | `#0f2746` | :root, [data-tema="mavi"] | [app/tema.css:3261](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3261) |
| `--tema-yerel-ortak-sayfa-golge-07` | `rgba(13,40,70,0.22)` | :root, [data-tema="mavi"] | [app/tema.css:3262](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3262) |
| `--tema-yerel-ortak-sayfa-cizgi-12` | `#e6edf4` | :root, [data-tema="mavi"] | [app/tema.css:3263](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3263) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-20` | `#788ba2` | :root, [data-tema="mavi"] | [app/tema.css:3264](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3264) |
| `--tema-yerel-ortak-sayfa-sayfa-zemini-09` | `var(--color-slate-100)` | :root, [data-tema="mavi"] | [app/tema.css:3265](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3265) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-21` | `#526984` | :root, [data-tema="mavi"] | [app/tema.css:3266](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3266) |
| `--tema-yerel-ortak-sayfa-sayfa-zemini-10` | `var(--color-slate-200)` | :root, [data-tema="mavi"] | [app/tema.css:3267](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3267) |
| `--tema-yerel-ortak-sayfa-cizgi-13` | `#95c5ec` | :root, [data-tema="mavi"] | [app/tema.css:3268](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3268) |
| `--tema-yerel-ortak-sayfa-odak-04` | `#e1f0fb` | :root, [data-tema="mavi"] | [app/tema.css:3269](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3269) |
| `--tema-yerel-ortak-sayfa-cizgi-14` | `#dfe7f0` | :root, [data-tema="mavi"] | [app/tema.css:3270](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3270) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-22` | `#8293a8` | :root, [data-tema="mavi"] | [app/tema.css:3271](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3271) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-23` | `#8da0b5` | :root, [data-tema="mavi"] | [app/tema.css:3272](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3272) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-24` | `#70849d` | :root, [data-tema="mavi"] | [app/tema.css:3273](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3273) |
| `--tema-yerel-ortak-sayfa-cizgi-15` | `#d5e0ea` | :root, [data-tema="mavi"] | [app/tema.css:3274](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3274) |
| `--tema-yerel-ortak-sayfa-cizgi-16` | `#2f7fc7` | :root, [data-tema="mavi"] | [app/tema.css:3275](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3275) |
| `--tema-yerel-ortak-sayfa-secim-zemin-08` | `#f1f8ff` | :root, [data-tema="mavi"] | [app/tema.css:3276](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3276) |
| `--tema-yerel-ortak-sayfa-cizgi-17` | `#e0e8f0` | :root, [data-tema="mavi"] | [app/tema.css:3277](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3277) |
| `--tema-yerel-ortak-sayfa-sayfa-zemini-11` | `var(--color-slate-50)` | :root, [data-tema="mavi"] | [app/tema.css:3278](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3278) |
| `--tema-yerel-ortak-sayfa-cizgi-18` | `#9eb0c2` | :root, [data-tema="mavi"] | [app/tema.css:3279](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3279) |
| `--tema-yerel-ortak-sayfa-ana-metin-17` | `#283d57` | :root, [data-tema="mavi"] | [app/tema.css:3280](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3280) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-25` | `#71849b` | :root, [data-tema="mavi"] | [app/tema.css:3281](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3281) |
| `--tema-yerel-ortak-sayfa-cizgi-19` | `#e2eaf2` | :root, [data-tema="mavi"] | [app/tema.css:3282](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3282) |
| `--tema-yerel-ortak-sayfa-sayfa-zemini-12` | `#f5f8fc` | :root, [data-tema="mavi"] | [app/tema.css:3283](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3283) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-26` | `#6c829b` | :root, [data-tema="mavi"] | [app/tema.css:3284](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3284) |
| `--tema-yerel-ortak-sayfa-sayfa-zemini-13` | `#eef3f7` | :root, [data-tema="mavi"] | [app/tema.css:3285](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3285) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-27` | `#73849a` | :root, [data-tema="mavi"] | [app/tema.css:3286](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3286) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-28` | `#4f6884` | :root, [data-tema="mavi"] | [app/tema.css:3287](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3287) |
| `--tema-yerel-ortak-sayfa-cizgi-20` | `#edf1f5` | :root, [data-tema="mavi"] | [app/tema.css:3288](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3288) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-29` | `#7c8fa6` | :root, [data-tema="mavi"] | [app/tema.css:3289](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3289) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-30` | `#556c86` | :root, [data-tema="mavi"] | [app/tema.css:3290](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3290) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-31` | `#7e90a5` | :root, [data-tema="mavi"] | [app/tema.css:3291](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3291) |
| `--tema-yerel-ortak-sayfa-sayfa-zemini-14` | `var(--color-gray-100)` | :root, [data-tema="mavi"] | [app/tema.css:3292](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3292) |
| `--tema-yerel-ortak-sayfa-odak-05` | `#56aeff` | :root, [data-tema="mavi"] | [app/tema.css:3293](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3293) |
| `--tema-yerel-ortak-sayfa-eylem-metin-10` | `#4f7fb7` | :root, [data-tema="mavi"] | [app/tema.css:3294](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3294) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-32` | `#7b8da5` | :root, [data-tema="mavi"] | [app/tema.css:3295](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3295) |
| `--tema-yerel-uretim-sayfa-zemini-25` | `#f9fafb` | :root, [data-tema="mavi"] | [app/tema.css:3296](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3296) |
| `--tema-yerel-uretim-ana-metin-30` | `#374151` | :root, [data-tema="mavi"] | [app/tema.css:3297](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3297) |
| `--tema-yerel-yonetim-yardimci-metin-08` | `#e5e7eb` | :root, [data-tema="mavi"] | [app/tema.css:3298](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3298) |
| `--tema-yerel-yonetim-vurgu-zemin-02` | `#fef2f2` | :root, [data-tema="mavi"] | [app/tema.css:3299](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3299) |
| `--tema-yerel-yonetim-vurgu-cizgi-02` | `#fecaca` | :root, [data-tema="mavi"] | [app/tema.css:3300](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3300) |
| `--tema-yerel-rapor-yardimci-metin-69` | `#737373` | :root, [data-tema="mavi"] | [app/tema.css:3301](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3301) |
| `--tema-yerel-rapor-ana-metin-24` | `#111827` | :root, [data-tema="mavi"] | [app/tema.css:3302](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3302) |
| `--tema-yerel-rapor-sayfa-zemini-29` | `#f9fafb` | :root, [data-tema="mavi"] | [app/tema.css:3303](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3303) |
| `--tema-yerel-ana-sayfa-yardimci-metin-01` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3306](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3306) |
| `--tema-yerel-ana-sayfa-yardimci-metin-02` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3307](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3307) |
| `--tema-yerel-lig-yardimci-metin-01` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3308](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3308) |
| `--tema-yerel-lig-ana-metin-01` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3309](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3309) |
| `--tema-yerel-lig-sayfa-zemini-01` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3310](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3310) |
| `--tema-yerel-lig-cizgi-01` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3311](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3311) |
| `--tema-yerel-lig-secim-zemin-01` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3312](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3312) |
| `--tema-yerel-lig-eylem-metin-01` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3313](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3313) |
| `--tema-yerel-lig-ana-metin-02` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3314](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3314) |
| `--tema-yerel-lig-yardimci-metin-02` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3315](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3315) |
| `--tema-yerel-lig-yardimci-metin-03` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3316](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3316) |
| `--tema-yerel-lig-cizgi-02` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3317](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3317) |
| `--tema-yerel-lig-ana-metin-03` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3318](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3318) |
| `--tema-yerel-lig-eylem-metin-02` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3319](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3319) |
| `--tema-yerel-lig-ana-metin-04` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3320](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3320) |
| `--tema-yerel-lig-yardimci-metin-04` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3321](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3321) |
| `--tema-yerel-lig-secim-zemin-02` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3322](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3322) |
| `--tema-yerel-lig-cizgi-03` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3323](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3323) |
| `--tema-yerel-lig-golge-01` | `rgba(53,85,69,0.035)` | [data-tema="yesil"] | [app/tema.css:3324](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3324) |
| `--tema-yerel-lig-yardimci-metin-05` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3325](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3325) |
| `--tema-yerel-lig-cizgi-04` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3326](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3326) |
| `--tema-yerel-lig-sayfa-zemini-02` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3327](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3327) |
| `--tema-yerel-lig-yardimci-metin-06` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3328](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3328) |
| `--tema-yerel-lig-ana-metin-05` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3329](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3329) |
| `--tema-yerel-lig-ana-metin-06` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3330](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3330) |
| `--tema-yerel-lig-sayfa-zemini-03` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3331](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3331) |
| `--tema-yerel-lig-yardimci-metin-07` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3332](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3332) |
| `--tema-yerel-lig-cizgi-05` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3333](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3333) |
| `--tema-yerel-ana-sayfa-cizgi-01` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3334](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3334) |
| `--tema-yerel-ana-sayfa-eylem-metin-01` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3335](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3335) |
| `--tema-yerel-ana-sayfa-cizgi-02` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3336](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3336) |
| `--tema-yerel-ana-sayfa-secim-zemin-01` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3337](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3337) |
| `--tema-yerel-ana-sayfa-odak-01` | `var(--tema-odak)` | [data-tema="yesil"] | [app/tema.css:3338](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3338) |
| `--tema-yerel-eclub-cizgi-01` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3339](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3339) |
| `--tema-yerel-eclub-eylem-metin-01` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3340](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3340) |
| `--tema-yerel-eclub-sayfa-zemini-01` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3341](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3341) |
| `--tema-yerel-eclub-sayfa-zemini-02` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3342](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3342) |
| `--tema-yerel-eclub-ana-metin-01` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3343](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3343) |
| `--tema-yerel-eclub-yardimci-metin-01` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3344](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3344) |
| `--tema-yerel-eclub-cizgi-02` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3345](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3345) |
| `--tema-yerel-eclub-secim-zemin-01` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3346](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3346) |
| `--tema-yerel-eclub-eylem-metin-02` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3347](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3347) |
| `--tema-yerel-eclub-secim-zemin-02` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3348](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3348) |
| `--tema-yerel-eclub-eylem-metin-03` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3349](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3349) |
| `--tema-yerel-eclub-cizgi-03` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3350](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3350) |
| `--tema-yerel-eclub-yardimci-metin-02` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3351](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3351) |
| `--tema-yerel-eclub-cizgi-04` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3352](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3352) |
| `--tema-yerel-eclub-yardimci-metin-03` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3353](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3353) |
| `--tema-yerel-eclub-cizgi-05` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3354](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3354) |
| `--tema-yerel-eclub-sayfa-zemini-03` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3355](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3355) |
| `--tema-yerel-eclub-yardimci-metin-04` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3356](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3356) |
| `--tema-yerel-eclub-cizgi-06` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3357](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3357) |
| `--tema-yerel-eclub-ana-metin-02` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3358](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3358) |
| `--tema-yerel-eclub-secim-zemin-03` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3359](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3359) |
| `--tema-yerel-eclub-yardimci-metin-05` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3360](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3360) |
| `--tema-yerel-eclub-yardimci-metin-06` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3361](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3361) |
| `--tema-yerel-eclub-ana-metin-03` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3362](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3362) |
| `--tema-yerel-eclub-yardimci-metin-07` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3363](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3363) |
| `--tema-yerel-eclub-cizgi-07` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3364](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3364) |
| `--tema-yerel-eclub-sayfa-zemini-04` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3365](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3365) |
| `--tema-yerel-eclub-yardimci-metin-08` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3366](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3366) |
| `--tema-yerel-eclub-cizgi-08` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3367](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3367) |
| `--tema-yerel-eclub-ana-metin-04` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3368](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3368) |
| `--tema-yerel-eclub-odak-01` | `var(--tema-odak)` | [data-tema="yesil"] | [app/tema.css:3369](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3369) |
| `--tema-yerel-eclub-eylem-zemin-01` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3370](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3370) |
| `--tema-yerel-eclub-eylem-zemin-02` | `var(--tema-eylem-hover)` | [data-tema="yesil"] | [app/tema.css:3371](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3371) |
| `--tema-yerel-eclub-ana-metin-05` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3372](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3372) |
| `--tema-yerel-eclub-yardimci-metin-09` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3373](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3373) |
| `--tema-yerel-eclub-yardimci-metin-10` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3374](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3374) |
| `--tema-yerel-eclub-secim-zemin-04` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3375](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3375) |
| `--tema-yerel-eclub-cizgi-09` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3376](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3376) |
| `--tema-yerel-eclub-golge-01` | `rgba(53,85,69,0.04)` | [data-tema="yesil"] | [app/tema.css:3377](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3377) |
| `--tema-yerel-eclub-cizgi-10` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3378](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3378) |
| `--tema-yerel-eclub-sayfa-zemini-05` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3379](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3379) |
| `--tema-yerel-eclub-secim-zemin-05` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3380](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3380) |
| `--tema-yerel-eclub-ana-metin-06` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3381](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3381) |
| `--tema-yerel-eclub-yardimci-metin-11` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3382](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3382) |
| `--tema-yerel-eclub-yardimci-metin-12` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3383](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3383) |
| `--tema-yerel-eclub-cizgi-11` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3384](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3384) |
| `--tema-yerel-eclub-ana-metin-07` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3385](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3385) |
| `--tema-yerel-eclub-cizgi-12` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3386](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3386) |
| `--tema-yerel-eclub-odak-02` | `var(--tema-odak)` | [data-tema="yesil"] | [app/tema.css:3387](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3387) |
| `--tema-yerel-eclub-vurgu-metin-01` | `var(--tema-vurgu)` | [data-tema="yesil"] | [app/tema.css:3388](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3388) |
| `--tema-yerel-eclub-sayfa-zemini-06` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3389](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3389) |
| `--tema-yerel-eclub-eylem-zemin-03` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3390](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3390) |
| `--tema-yerel-eclub-eylem-zemin-04` | `var(--tema-eylem-hover)` | [data-tema="yesil"] | [app/tema.css:3391](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3391) |
| `--tema-yerel-eclub-cizgi-13` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3392](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3392) |
| `--tema-yerel-eclub-golge-02` | `rgba(53,85,69,0.08)` | [data-tema="yesil"] | [app/tema.css:3393](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3393) |
| `--tema-yerel-eclub-cizgi-14` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3394](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3394) |
| `--tema-yerel-eclub-golge-03` | `rgba(53,85,69,0.13)` | [data-tema="yesil"] | [app/tema.css:3395](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3395) |
| `--tema-yerel-eclub-odak-03` | `var(--tema-odak)` | [data-tema="yesil"] | [app/tema.css:3396](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3396) |
| `--tema-yerel-eclub-secim-zemin-06` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3397](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3397) |
| `--tema-yerel-eclub-yardimci-metin-13` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3398](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3398) |
| `--tema-yerel-eclub-ana-metin-08` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3399](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3399) |
| `--tema-yerel-eclub-cizgi-15` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3400](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3400) |
| `--tema-yerel-eclub-cizgi-16` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3401](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3401) |
| `--tema-yerel-eclub-sayfa-zemini-07` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3402](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3402) |
| `--tema-yerel-eclub-secim-zemin-07` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3403](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3403) |
| `--tema-yerel-eclub-ana-metin-09` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3404](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3404) |
| `--tema-yerel-eclub-yardimci-metin-14` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3405](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3405) |
| `--tema-yerel-eclub-golge-04` | `rgba(53,85,69,0.035)` | [data-tema="yesil"] | [app/tema.css:3406](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3406) |
| `--tema-yerel-eclub-yardimci-metin-15` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3407](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3407) |
| `--tema-yerel-eclub-sayfa-zemini-08` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:3408](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3408) |
| `--tema-yerel-eclub-yardimci-metin-16` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3409](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3409) |
| `--tema-yerel-eclub-cizgi-17` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3410](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3410) |
| `--tema-yerel-eclub-yardimci-metin-17` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3411](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3411) |
| `--tema-yerel-eclub-cizgi-18` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3412](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3412) |
| `--tema-yerel-eclub-secim-zemin-08` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3413](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3413) |
| `--tema-yerel-eclub-sayfa-zemini-09` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3414](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3414) |
| `--tema-yerel-eclub-cizgi-19` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3415](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3415) |
| `--tema-yerel-eclub-ana-metin-10` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3416](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3416) |
| `--tema-yerel-eclub-sayfa-zemini-10` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3417](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3417) |
| `--tema-yerel-eclub-cizgi-20` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3418](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3418) |
| `--tema-yerel-eclub-cizgi-21` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3419](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3419) |
| `--tema-yerel-eclub-ana-metin-11` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3420](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3420) |
| `--tema-yerel-eclub-yardimci-metin-18` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3421](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3421) |
| `--tema-yerel-eclub-dekoratif-zemin-01` | `color-mix(in srgb, var(--tema-secili-metin) 12%, transparent)` | [data-tema="yesil"] | [app/tema.css:3422](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3422) |
| `--tema-yerel-eclub-sayfa-zemini-11` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3423](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3423) |
| `--tema-yerel-eclub-sayfa-zemini-12` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3424](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3424) |
| `--tema-yerel-eclub-ana-metin-12` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3425](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3425) |
| `--tema-yerel-eclub-yardimci-metin-19` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3426](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3426) |
| `--tema-yerel-eclub-cizgi-22` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3427](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3427) |
| `--tema-yerel-eclub-yardimci-metin-20` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3428](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3428) |
| `--tema-yerel-eclub-cizgi-23` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3429](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3429) |
| `--tema-yerel-eclub-ana-metin-13` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3430](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3430) |
| `--tema-yerel-eclub-cizgi-24` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3431](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3431) |
| `--tema-yerel-eclub-golge-05` | `rgba(53,85,69,0.12)` | [data-tema="yesil"] | [app/tema.css:3432](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3432) |
| `--tema-yerel-eclub-cizgi-25` | `color-mix(in srgb, var(--tema-cizgi) 20%, transparent)` | [data-tema="yesil"] | [app/tema.css:3433](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3433) |
| `--tema-yerel-eclub-golge-06` | `rgba(53,85,69,0.055)` | [data-tema="yesil"] | [app/tema.css:3434](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3434) |
| `--tema-yerel-eclub-secim-zemin-09` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3435](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3435) |
| `--tema-yerel-eclub-ana-metin-14` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3436](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3436) |
| `--tema-yerel-eclub-yardimci-metin-21` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3437](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3437) |
| `--tema-yerel-eclub-yardimci-metin-22` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3438](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3438) |
| `--tema-yerel-eclub-yardimci-metin-23` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3439](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3439) |
| `--tema-yerel-eclub-yardimci-metin-24` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3440](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3440) |
| `--tema-yerel-eclub-eylem-metin-04` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3441](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3441) |
| `--tema-yerel-eclub-secim-zemin-10` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3442](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3442) |
| `--tema-yerel-eclub-eylem-metin-05` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3443](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3443) |
| `--tema-yerel-eclub-sayfa-zemini-13` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3444](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3444) |
| `--tema-yerel-eclub-yardimci-metin-25` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3445](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3445) |
| `--tema-yerel-eclub-eylem-zemin-06` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3446](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3446) |
| `--tema-yerel-eclub-odak-04` | `var(--tema-odak)` | [data-tema="yesil"] | [app/tema.css:3447](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3447) |
| `--tema-yerel-eclub-eylem-zemin-07` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3448](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3448) |
| `--tema-yerel-eclub-ana-metin-15` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3449](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3449) |
| `--tema-yerel-eclub-yardimci-metin-26` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3450](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3450) |
| `--tema-yerel-eclub-ana-metin-16` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3451](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3451) |
| `--tema-yerel-eclub-yardimci-metin-27` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3452](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3452) |
| `--tema-yerel-eclub-yardimci-metin-28` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3453](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3453) |
| `--tema-yerel-eclub-yardimci-metin-29` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3454](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3454) |
| `--tema-yerel-eclub-ana-metin-17` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3455](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3455) |
| `--tema-yerel-eclub-ana-metin-18` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3456](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3456) |
| `--tema-yerel-eclub-cizgi-26` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3457](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3457) |
| `--tema-yerel-eclub-secim-zemin-11` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3458](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3458) |
| `--tema-yerel-eclub-sayfa-zemini-14` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3459](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3459) |
| `--tema-yerel-eclub-yardimci-metin-30` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3460](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3460) |
| `--tema-yerel-eclub-cizgi-27` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3461](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3461) |
| `--tema-yerel-eclub-cizgi-28` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3462](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3462) |
| `--tema-yerel-eclub-eylem-metin-06` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3463](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3463) |
| `--tema-yerel-eclub-ana-metin-19` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3464](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3464) |
| `--tema-yerel-eclub-sayfa-zemini-15` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3465](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3465) |
| `--tema-yerel-eclub-ana-metin-20` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3466](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3466) |
| `--tema-yerel-eclub-yardimci-metin-31` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3467](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3467) |
| `--tema-yerel-eclub-ana-metin-21` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3468](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3468) |
| `--tema-yerel-eclub-sayfa-zemini-16` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:3469](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3469) |
| `--tema-yerel-eclub-ana-metin-22` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3470](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3470) |
| `--tema-yerel-eclub-eylem-zemin-08` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3471](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3471) |
| `--tema-yerel-eclub-eylem-zemin-09` | `var(--tema-eylem-hover)` | [data-tema="yesil"] | [app/tema.css:3472](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3472) |
| `--tema-yerel-eclub-sayfa-zemini-17` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:3473](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3473) |
| `--tema-yerel-eclub-eylem-zemin-10` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3474](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3474) |
| `--tema-yerel-eclub-eylem-zemin-11` | `var(--tema-eylem-hover)` | [data-tema="yesil"] | [app/tema.css:3475](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3475) |
| `--tema-yerel-eclub-cizgi-29` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3476](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3476) |
| `--tema-yerel-eclub-eylem-metin-07` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3477](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3477) |
| `--tema-yerel-eclub-ana-metin-23` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3478](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3478) |
| `--tema-yerel-eclub-yardimci-metin-32` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3479](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3479) |
| `--tema-yerel-eclub-eylem-zemin-12` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3480](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3480) |
| `--tema-yerel-eclub-golge-10` | `rgba(53,85,69,0.3)` | [data-tema="yesil"] | [app/tema.css:3481](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3481) |
| `--tema-yerel-eclub-yardimci-metin-33` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3482](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3482) |
| `--tema-yerel-eclub-secim-zemin-12` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3483](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3483) |
| `--tema-yerel-eclub-eylem-zemin-13` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3484](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3484) |
| `--tema-yerel-eclub-golge-11` | `rgba(53,85,69,0.2)` | [data-tema="yesil"] | [app/tema.css:3485](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3485) |
| `--tema-yerel-eclub-cizgi-30` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3486](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3486) |
| `--tema-yerel-eclub-yardimci-metin-34` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3487](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3487) |
| `--tema-yerel-eclub-ana-metin-24` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3488](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3488) |
| `--tema-yerel-eclub-yardimci-metin-35` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3489](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3489) |
| `--tema-yerel-eclub-cizgi-31` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3490](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3490) |
| `--tema-yerel-eclub-cizgi-32` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3491](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3491) |
| `--tema-yerel-eclub-yardimci-metin-36` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3492](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3492) |
| `--tema-yerel-eclub-ana-metin-25` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3493](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3493) |
| `--tema-yerel-eclub-cizgi-33` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3494](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3494) |
| `--tema-yerel-eclub-cizgi-34` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3495](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3495) |
| `--tema-yerel-eclub-yardimci-metin-37` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3496](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3496) |
| `--tema-yerel-eclub-yardimci-metin-38` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3497](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3497) |
| `--tema-yerel-eclub-cizgi-35` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3498](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3498) |
| `--tema-yerel-eclub-yardimci-metin-39` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3499](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3499) |
| `--tema-yerel-eclub-sayfa-zemini-18` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3500](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3500) |
| `--tema-yerel-eclub-yardimci-metin-40` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3501](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3501) |
| `--tema-yerel-eclub-cizgi-36` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3502](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3502) |
| `--tema-yerel-eclub-yardimci-metin-41` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3503](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3503) |
| `--tema-yerel-eclub-cizgi-37` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3504](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3504) |
| `--tema-yerel-eclub-sayfa-zemini-19` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3505](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3505) |
| `--tema-yerel-eclub-yardimci-metin-42` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3506](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3506) |
| `--tema-yerel-eclub-cizgi-38` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3507](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3507) |
| `--tema-yerel-eclub-yardimci-metin-43` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3508](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3508) |
| `--tema-yerel-eclub-cizgi-39` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3509](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3509) |
| `--tema-yerel-eclub-ana-metin-26` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3510](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3510) |
| `--tema-yerel-eczanem-cizgi-01` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3511](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3511) |
| `--tema-yerel-eczanem-eylem-metin-01` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3512](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3512) |
| `--tema-yerel-eczanem-cizgi-02` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3513](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3513) |
| `--tema-yerel-eczanem-secim-zemin-01` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3514](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3514) |
| `--tema-yerel-eczanem-eylem-metin-02` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3515](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3515) |
| `--tema-yerel-eczanem-cizgi-03` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3516](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3516) |
| `--tema-yerel-eczanem-yardimci-metin-01` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3517](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3517) |
| `--tema-yerel-eczanem-cizgi-04` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3518](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3518) |
| `--tema-yerel-eczanem-ana-metin-01` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3519](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3519) |
| `--tema-yerel-eczanem-eylem-zemin-01` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3520](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3520) |
| `--tema-yerel-eczanem-eylem-zemin-02` | `var(--tema-eylem-hover)` | [data-tema="yesil"] | [app/tema.css:3521](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3521) |
| `--tema-yerel-eczanem-sayfa-zemini-01` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3522](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3522) |
| `--tema-yerel-eczanem-yardimci-metin-02` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3523](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3523) |
| `--tema-yerel-eczanem-cizgi-05` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3524](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3524) |
| `--tema-yerel-eczanem-sayfa-zemini-02` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3525](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3525) |
| `--tema-yerel-eczanem-cizgi-06` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3526](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3526) |
| `--tema-yerel-eczanem-yardimci-metin-03` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3527](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3527) |
| `--tema-yerel-eczanem-ana-metin-02` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3528](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3528) |
| `--tema-yerel-eczanem-yardimci-metin-04` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3529](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3529) |
| `--tema-yerel-eczanem-odak-01` | `var(--tema-odak)` | [data-tema="yesil"] | [app/tema.css:3530](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3530) |
| `--tema-yerel-eczanem-secim-zemin-02` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3531](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3531) |
| `--tema-yerel-eczanem-sayfa-zemini-03` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3532](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3532) |
| `--tema-yerel-eczanem-ana-metin-03` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3533](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3533) |
| `--tema-yerel-eczanem-sayfa-zemini-04` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3534](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3534) |
| `--tema-yerel-eczanem-yardimci-metin-05` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3535](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3535) |
| `--tema-yerel-eczanem-yardimci-metin-06` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3536](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3536) |
| `--tema-yerel-eczanem-secim-zemin-03` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3537](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3537) |
| `--tema-yerel-eczanem-sayfa-zemini-05` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3538](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3538) |
| `--tema-yerel-eczanem-ana-metin-04` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3539](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3539) |
| `--tema-yerel-eczanem-yardimci-metin-07` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3540](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3540) |
| `--tema-yerel-eczanem-sayfa-zemini-06` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3541](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3541) |
| `--tema-yerel-eczanem-eylem-metin-03` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3542](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3542) |
| `--tema-yerel-eczanem-yardimci-metin-08` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3543](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3543) |
| `--tema-yerel-eczanem-yardimci-metin-09` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3544](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3544) |
| `--tema-yerel-eczanem-yardimci-metin-10` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3545](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3545) |
| `--tema-yerel-eczanem-cizgi-07` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3546](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3546) |
| `--tema-yerel-eczanem-ana-metin-05` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3547](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3547) |
| `--tema-yerel-eczanem-yardimci-metin-11` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3548](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3548) |
| `--tema-yerel-eczanem-yardimci-metin-12` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3549](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3549) |
| `--tema-yerel-eczanem-cizgi-08` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3550](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3550) |
| `--tema-yerel-eczanem-cizgi-09` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3551](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3551) |
| `--tema-yerel-eczanem-secim-zemin-04` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3552](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3552) |
| `--tema-yerel-eczanem-yardimci-metin-13` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3553](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3553) |
| `--tema-yerel-eczanem-ana-metin-06` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3554](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3554) |
| `--tema-yerel-eczanem-yardimci-metin-14` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3555](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3555) |
| `--tema-yerel-eczanem-cizgi-10` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3556](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3556) |
| `--tema-yerel-eczanem-sayfa-zemini-07` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3557](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3557) |
| `--tema-yerel-eczanem-sayfa-zemini-08` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3558](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3558) |
| `--tema-yerel-eczanem-eylem-zemin-03` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3559](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3559) |
| `--tema-yerel-eczanem-golge-01` | `rgba(53,85,69,0.3)` | [data-tema="yesil"] | [app/tema.css:3560](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3560) |
| `--tema-yerel-eczanem-yardimci-metin-15` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3561](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3561) |
| `--tema-yerel-eczanem-yardimci-metin-16` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3562](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3562) |
| `--tema-yerel-eczanem-secim-zemin-05` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3563](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3563) |
| `--tema-yerel-eczanem-eylem-zemin-04` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3564](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3564) |
| `--tema-yerel-eczanem-golge-02` | `rgba(53,85,69,0.2)` | [data-tema="yesil"] | [app/tema.css:3565](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3565) |
| `--tema-yerel-eczanem-cizgi-11` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3566](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3566) |
| `--tema-yerel-eczanem-yardimci-metin-17` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3567](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3567) |
| `--tema-yerel-eczanem-sayfa-zemini-09` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:3568](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3568) |
| `--tema-yerel-eczanem-ana-metin-07` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3569](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3569) |
| `--tema-yerel-eczanem-cizgi-12` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3570](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3570) |
| `--tema-yerel-eczanem-golge-03` | `rgba(53,85,69,0.26666666666666666)` | [data-tema="yesil"] | [app/tema.css:3571](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3571) |
| `--tema-yerel-eczanem-cizgi-13` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3572](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3572) |
| `--tema-yerel-eczanem-sayfa-zemini-10` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3573](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3573) |
| `--tema-yerel-eczanem-ana-metin-08` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3574](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3574) |
| `--tema-yerel-eczanem-yardimci-metin-18` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3575](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3575) |
| `--tema-yerel-eczanem-yardimci-metin-19` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3576](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3576) |
| `--tema-yerel-eczanem-yardimci-metin-20` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3577](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3577) |
| `--tema-yerel-eczanem-cizgi-14` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3578](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3578) |
| `--tema-yerel-eczanem-cizgi-15` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3579](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3579) |
| `--tema-yerel-eczanem-ana-metin-09` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3580](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3580) |
| `--tema-yerel-eczanem-cizgi-16` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3581](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3581) |
| `--tema-yerel-eczanem-sayfa-zemini-11` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3582](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3582) |
| `--tema-yerel-eczanem-secim-zemin-06` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3583](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3583) |
| `--tema-yerel-eczanem-cizgi-17` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3584](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3584) |
| `--tema-yerel-eczanem-sayfa-zemini-12` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3585](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3585) |
| `--tema-yerel-eczanem-ana-metin-10` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3586](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3586) |
| `--tema-yerel-eczanem-yardimci-metin-21` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3587](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3587) |
| `--tema-yerel-eczanem-cizgi-18` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3588](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3588) |
| `--tema-yerel-eczanem-sayfa-zemini-13` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3589](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3589) |
| `--tema-yerel-eczanem-yardimci-metin-22` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3590](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3590) |
| `--tema-yerel-eczanem-secim-zemin-07` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3591](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3591) |
| `--tema-yerel-eczanem-yardimci-metin-23` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3592](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3592) |
| `--tema-yerel-eczanem-cizgi-19` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3593](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3593) |
| `--tema-yerel-eczanem-yardimci-metin-24` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3594](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3594) |
| `--tema-yerel-eczanem-ana-metin-11` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3595](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3595) |
| `--tema-yerel-eczanem-ana-metin-12` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3596](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3596) |
| `--tema-yerel-eczanem-yardimci-metin-25` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3597](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3597) |
| `--tema-yerel-eczanem-ana-metin-13` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3598](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3598) |
| `--tema-yerel-eczanem-cizgi-20` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3599](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3599) |
| `--tema-yerel-eczanem-yardimci-metin-26` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3600](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3600) |
| `--tema-yerel-eczanem-cizgi-21` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3601](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3601) |
| `--tema-yerel-eczanem-ana-metin-14` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3602](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3602) |
| `--tema-yerel-eczanem-cizgi-22` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3603](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3603) |
| `--tema-yerel-eczanem-secim-zemin-08` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3604](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3604) |
| `--tema-yerel-eczanem-yardimci-metin-27` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3605](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3605) |
| `--tema-yerel-eczanem-yardimci-metin-28` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3606](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3606) |
| `--tema-yerel-eczanem-cizgi-23` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3607](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3607) |
| `--tema-yerel-eczanem-sayfa-zemini-14` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3608](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3608) |
| `--tema-yerel-eczanem-eylem-metin-04` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3609](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3609) |
| `--tema-yerel-eczanem-cizgi-24` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3610](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3610) |
| `--tema-yerel-eczanem-eylem-metin-05` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3611](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3611) |
| `--tema-yerel-hesap-sayfa-zemini-01` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3612](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3612) |
| `--tema-yerel-hesap-yardimci-metin-01` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3613](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3613) |
| `--tema-yerel-hesap-ana-metin-01` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3614](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3614) |
| `--tema-yerel-hesap-cizgi-01` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3615](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3615) |
| `--tema-yerel-hesap-ana-metin-02` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3616](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3616) |
| `--tema-yerel-hesap-yardimci-metin-02` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3617](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3617) |
| `--tema-yerel-hesap-cizgi-02` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3618](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3618) |
| `--tema-yerel-hesap-eylem-zemin-01` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3619](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3619) |
| `--tema-yerel-hesap-eylem-zemin-02` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3620](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3620) |
| `--tema-yerel-hesap-cizgi-03` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3621](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3621) |
| `--tema-yerel-hesap-cizgi-04` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3622](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3622) |
| `--tema-yerel-hesap-secim-zemin-01` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3623](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3623) |
| `--tema-yerel-hesap-eylem-metin-01` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3624](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3624) |
| `--tema-yerel-hesap-cizgi-05` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3625](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3625) |
| `--tema-yerel-hesap-yardimci-metin-03` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3626](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3626) |
| `--tema-yerel-hesap-vurgu-metin-01` | `var(--tema-vurgu)` | [data-tema="yesil"] | [app/tema.css:3627](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3627) |
| `--tema-yerel-uretim-sayfa-zemini-01` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3628](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3628) |
| `--tema-yerel-uretim-yardimci-metin-01` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3629](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3629) |
| `--tema-yerel-uretim-ana-metin-01` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3630](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3630) |
| `--tema-yerel-uretim-cizgi-01` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3631](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3631) |
| `--tema-yerel-uretim-ana-metin-02` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3632](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3632) |
| `--tema-yerel-uretim-ana-metin-03` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3633](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3633) |
| `--tema-yerel-uretim-yardimci-metin-02` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3634](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3634) |
| `--tema-yerel-uretim-cizgi-02` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3635](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3635) |
| `--tema-yerel-uretim-yardimci-metin-03` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3636](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3636) |
| `--tema-yerel-uretim-cizgi-03` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3637](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3637) |
| `--tema-yerel-ortak-sayfa-ana-metin-01` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3638](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3638) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-01` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3639](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3639) |
| `--tema-yerel-ortak-sayfa-golge-01` | `rgba(53,85,69,0.035)` | [data-tema="yesil"] | [app/tema.css:3640](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3640) |
| `--tema-yerel-ortak-sayfa-odak-01` | `var(--tema-odak)` | [data-tema="yesil"] | [app/tema.css:3641](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3641) |
| `--tema-yerel-ortak-sayfa-cizgi-01` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3642](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3642) |
| `--tema-yerel-ortak-sayfa-ana-metin-02` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3643](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3643) |
| `--tema-yerel-ortak-sayfa-eylem-zemin-01` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3644](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3644) |
| `--tema-yerel-ortak-sayfa-eylem-zemin-02` | `var(--tema-eylem-hover)` | [data-tema="yesil"] | [app/tema.css:3645](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3645) |
| `--tema-yerel-ortak-sayfa-ana-metin-03` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3646](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3646) |
| `--tema-yerel-ortak-sayfa-cizgi-02` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3647](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3647) |
| `--tema-yerel-ortak-sayfa-sayfa-zemini-01` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3648](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3648) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-02` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3649](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3649) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-03` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3650](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3650) |
| `--tema-yerel-ortak-sayfa-cizgi-03` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3651](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3651) |
| `--tema-yerel-ortak-sayfa-sayfa-zemini-02` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:3652](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3652) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-04` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3653](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3653) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-05` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3654](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3654) |
| `--tema-yerel-ortak-sayfa-cizgi-04` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3655](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3655) |
| `--tema-yerel-ortak-sayfa-cizgi-05` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3656](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3656) |
| `--tema-yerel-ortak-sayfa-sayfa-zemini-03` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3657](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3657) |
| `--tema-yerel-ortak-sayfa-secim-zemin-01` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3658](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3658) |
| `--tema-yerel-ortak-sayfa-eylem-metin-01` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3659](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3659) |
| `--tema-yerel-ortak-sayfa-ana-metin-04` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3660](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3660) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-06` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3661](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3661) |
| `--tema-yerel-ortak-sayfa-secim-zemin-02` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3662](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3662) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-07` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3663](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3663) |
| `--tema-yerel-ortak-sayfa-sayfa-zemini-04` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3664](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3664) |
| `--tema-yerel-ortak-sayfa-eylem-zemin-03` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3665](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3665) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-08` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3666](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3666) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-09` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3667](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3667) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-10` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3668](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3668) |
| `--tema-yerel-ortak-sayfa-ana-metin-05` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3669](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3669) |
| `--tema-yerel-ortak-sayfa-ana-metin-06` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3670](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3670) |
| `--tema-yerel-ortak-sayfa-ana-metin-07` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3671](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3671) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-11` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3672](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3672) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-12` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3673](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3673) |
| `--tema-yerel-ortak-sayfa-sayfa-zemini-05` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:3674](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3674) |
| `--tema-yerel-ortak-sayfa-sayfa-zemini-06` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3675](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3675) |
| `--tema-yerel-ortak-sayfa-cizgi-06` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3676](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3676) |
| `--tema-yerel-ortak-sayfa-ana-metin-08` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3677](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3677) |
| `--tema-yerel-hesap-cizgi-06` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3678](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3678) |
| `--tema-yerel-hesap-secim-zemin-02` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3679](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3679) |
| `--tema-yerel-hesap-eylem-metin-02` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3680](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3680) |
| `--tema-yerel-hesap-sayfa-zemini-02` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:3681](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3681) |
| `--tema-yerel-hesap-secim-zemin-03` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3682](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3682) |
| `--tema-yerel-hesap-eylem-metin-03` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3683](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3683) |
| `--tema-yerel-hesap-sayfa-zemini-03` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:3684](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3684) |
| `--tema-yerel-rapor-cizgi-01` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3685](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3685) |
| `--tema-yerel-rapor-eylem-metin-01` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3686](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3686) |
| `--tema-yerel-rapor-secim-zemin-01` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3687](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3687) |
| `--tema-yerel-rapor-eylem-metin-02` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3688](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3688) |
| `--tema-yerel-rapor-ana-metin-01` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3689](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3689) |
| `--tema-yerel-rapor-yardimci-metin-01` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3690](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3690) |
| `--tema-yerel-rapor-yardimci-metin-02` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3691](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3691) |
| `--tema-yerel-rapor-sayfa-zemini-01` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3692](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3692) |
| `--tema-yerel-rapor-cizgi-02` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3693](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3693) |
| `--tema-yerel-rapor-secim-zemin-02` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3694](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3694) |
| `--tema-yerel-rapor-yardimci-metin-03` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3695](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3695) |
| `--tema-yerel-rapor-ana-metin-02` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3696](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3696) |
| `--tema-yerel-rapor-eylem-metin-03` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3697](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3697) |
| `--tema-yerel-rapor-yardimci-metin-04` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3698](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3698) |
| `--tema-yerel-rapor-cizgi-03` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3699](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3699) |
| `--tema-yerel-rapor-yardimci-metin-05` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3700](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3700) |
| `--tema-yerel-rapor-sayfa-zemini-02` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3701](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3701) |
| `--tema-yerel-rapor-cizgi-04` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3702](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3702) |
| `--tema-yerel-rapor-ana-metin-03` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3703](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3703) |
| `--tema-yerel-rapor-cizgi-05` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3704](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3704) |
| `--tema-yerel-rapor-cizgi-06` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3705](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3705) |
| `--tema-yerel-rapor-cizgi-07` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3706](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3706) |
| `--tema-yerel-rapor-ana-metin-04` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3707](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3707) |
| `--tema-yerel-rapor-sayfa-zemini-03` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3708](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3708) |
| `--tema-yerel-rapor-cizgi-08` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3709](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3709) |
| `--tema-yerel-rapor-golge-01` | `rgba(53,85,69,0.07)` | [data-tema="yesil"] | [app/tema.css:3710](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3710) |
| `--tema-yerel-rapor-yardimci-metin-06` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3711](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3711) |
| `--tema-yerel-rapor-eylem-metin-04` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3712](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3712) |
| `--tema-yerel-rapor-cizgi-09` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3713](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3713) |
| `--tema-yerel-rapor-sayfa-zemini-04` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3714](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3714) |
| `--tema-yerel-rapor-ana-metin-05` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3715](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3715) |
| `--tema-yerel-rapor-cizgi-10` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3716](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3716) |
| `--tema-yerel-rapor-secim-zemin-03` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3717](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3717) |
| `--tema-yerel-rapor-dekoratif-zemin-01` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3718](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3718) |
| `--tema-yerel-rapor-dekoratif-zemin-02` | `var(--tema-secili-metin)` | [data-tema="yesil"] | [app/tema.css:3719](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3719) |
| `--tema-yerel-rapor-eylem-metin-05` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3720](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3720) |
| `--tema-yerel-rapor-secim-zemin-04` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3721](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3721) |
| `--tema-yerel-rapor-cizgi-11` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3722](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3722) |
| `--tema-yerel-rapor-cizgi-12` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3723](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3723) |
| `--tema-yerel-rapor-yardimci-metin-07` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3724](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3724) |
| `--tema-yerel-rapor-ana-metin-06` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3725](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3725) |
| `--tema-yerel-rapor-yardimci-metin-08` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3726](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3726) |
| `--tema-yerel-rapor-eylem-metin-06` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3727](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3727) |
| `--tema-yerel-rapor-cizgi-13` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3728](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3728) |
| `--tema-yerel-rapor-yardimci-metin-09` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3729](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3729) |
| `--tema-yerel-rapor-eylem-zemin-01` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3730](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3730) |
| `--tema-yerel-rapor-yardimci-metin-10` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3731](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3731) |
| `--tema-yerel-rapor-ana-metin-07` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3732](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3732) |
| `--tema-yerel-rapor-yardimci-metin-11` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3733](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3733) |
| `--tema-yerel-rapor-cizgi-14` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3734](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3734) |
| `--tema-yerel-rapor-ana-metin-08` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3735](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3735) |
| `--tema-yerel-rapor-yardimci-metin-12` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3736](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3736) |
| `--tema-yerel-rapor-cizgi-15` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3737](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3737) |
| `--tema-yerel-rapor-yardimci-metin-13` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3738](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3738) |
| `--tema-yerel-rapor-cizgi-16` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3739](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3739) |
| `--tema-yerel-rapor-sayfa-zemini-05` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3740](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3740) |
| `--tema-yerel-rapor-sayfa-zemini-06` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:3741](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3741) |
| `--tema-yerel-rapor-dekoratif-zemin-03` | `var(--tema-secili-metin)` | [data-tema="yesil"] | [app/tema.css:3742](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3742) |
| `--tema-yerel-rapor-dekoratif-zemin-04` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3743](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3743) |
| `--tema-yerel-rapor-ana-metin-09` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3744](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3744) |
| `--tema-yerel-rapor-yardimci-metin-14` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3745](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3745) |
| `--tema-yerel-rapor-yardimci-metin-15` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3746](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3746) |
| `--tema-yerel-rapor-eylem-metin-07` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3747](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3747) |
| `--tema-yerel-rapor-cizgi-17` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3748](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3748) |
| `--tema-yerel-rapor-cizgi-18` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3749](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3749) |
| `--tema-yerel-rapor-sayfa-zemini-07` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3750](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3750) |
| `--tema-yerel-rapor-eylem-zemin-02` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3751](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3751) |
| `--tema-yerel-rapor-cizgi-19` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3752](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3752) |
| `--tema-yerel-rapor-secim-zemin-05` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3753](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3753) |
| `--tema-yerel-rapor-ana-metin-10` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3754](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3754) |
| `--tema-yerel-rapor-dekoratif-zemin-05` | `color-mix(in srgb, var(--tema-secili-metin) 11%, transparent)` | [data-tema="yesil"] | [app/tema.css:3755](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3755) |
| `--tema-yerel-rapor-sayfa-zemini-08` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3756](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3756) |
| `--tema-yerel-rapor-sayfa-zemini-09` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3757](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3757) |
| `--tema-yerel-rapor-eylem-metin-08` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3758](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3758) |
| `--tema-yerel-rapor-cizgi-20` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3759](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3759) |
| `--tema-yerel-rapor-golge-02` | `rgba(53,85,69,0.05)` | [data-tema="yesil"] | [app/tema.css:3760](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3760) |
| `--tema-yerel-rapor-yardimci-metin-16` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3761](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3761) |
| `--tema-yerel-rapor-secim-zemin-06` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3762](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3762) |
| `--tema-yerel-rapor-dekoratif-zemin-06` | `var(--tema-secili-metin)` | [data-tema="yesil"] | [app/tema.css:3763](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3763) |
| `--tema-yerel-rapor-golge-03` | `rgba(53,85,69,0.22)` | [data-tema="yesil"] | [app/tema.css:3764](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3764) |
| `--tema-yerel-rapor-cizgi-21` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3765](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3765) |
| `--tema-yerel-rapor-golge-04` | `rgba(53,85,69,0.055)` | [data-tema="yesil"] | [app/tema.css:3766](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3766) |
| `--tema-yerel-rapor-secim-zemin-07` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3767](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3767) |
| `--tema-yerel-rapor-vurgu-metin-01` | `var(--tema-vurgu)` | [data-tema="yesil"] | [app/tema.css:3768](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3768) |
| `--tema-yerel-rapor-cizgi-22` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3769](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3769) |
| `--tema-yerel-rapor-sayfa-zemini-10` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3770](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3770) |
| `--tema-yerel-rapor-cizgi-23` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3771](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3771) |
| `--tema-yerel-rapor-sayfa-zemini-11` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3772](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3772) |
| `--tema-yerel-rapor-sayfa-zemini-12` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3773](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3773) |
| `--tema-yerel-rapor-sayfa-zemini-13` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3774](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3774) |
| `--tema-yerel-rapor-yardimci-metin-17` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3775](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3775) |
| `--tema-yerel-rapor-ana-metin-11` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3776](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3776) |
| `--tema-yerel-rapor-yardimci-metin-18` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3777](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3777) |
| `--tema-yerel-rapor-cizgi-24` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3778](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3778) |
| `--tema-yerel-rapor-yardimci-metin-19` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3779](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3779) |
| `--tema-yerel-rapor-sayfa-zemini-14` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3780](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3780) |
| `--tema-yerel-rapor-dekoratif-zemin-07` | `color-mix(in srgb, var(--tema-secili-metin) 10%, transparent)` | [data-tema="yesil"] | [app/tema.css:3781](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3781) |
| `--tema-yerel-rapor-sayfa-zemini-15` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3782](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3782) |
| `--tema-yerel-rapor-sayfa-zemini-16` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3783](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3783) |
| `--tema-yerel-rapor-sayfa-zemini-17` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3784](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3784) |
| `--tema-yerel-rapor-cizgi-25` | `color-mix(in srgb, var(--tema-cizgi) 18%, transparent)` | [data-tema="yesil"] | [app/tema.css:3785](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3785) |
| `--tema-yerel-rapor-golge-05` | `rgba(53,85,69,0.05)` | [data-tema="yesil"] | [app/tema.css:3786](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3786) |
| `--tema-yerel-rapor-yardimci-metin-20` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3787](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3787) |
| `--tema-yerel-rapor-sayfa-zemini-18` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3788](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3788) |
| `--tema-yerel-rapor-golge-06` | `rgba(53,85,69,0.22)` | [data-tema="yesil"] | [app/tema.css:3789](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3789) |
| `--tema-yerel-rapor-dekoratif-zemin-08` | `color-mix(in srgb, var(--tema-secili-metin) 13%, transparent)` | [data-tema="yesil"] | [app/tema.css:3790](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3790) |
| `--tema-yerel-rapor-dekoratif-zemin-09` | `color-mix(in srgb, var(--tema-secili-metin) 0%, transparent)` | [data-tema="yesil"] | [app/tema.css:3791](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3791) |
| `--tema-yerel-rapor-sayfa-zemini-19` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3792](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3792) |
| `--tema-yerel-rapor-sayfa-zemini-20` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3793](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3793) |
| `--tema-yerel-rapor-yardimci-metin-21` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3794](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3794) |
| `--tema-yerel-rapor-secim-zemin-08` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3795](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3795) |
| `--tema-yerel-rapor-cizgi-26` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3796](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3796) |
| `--tema-yerel-rapor-yardimci-metin-22` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3797](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3797) |
| `--tema-yerel-rapor-cizgi-27` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3798](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3798) |
| `--tema-yerel-rapor-yardimci-metin-23` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3799](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3799) |
| `--tema-yerel-rapor-ana-metin-12` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3800](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3800) |
| `--tema-yerel-rapor-yardimci-metin-24` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3801](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3801) |
| `--tema-yerel-rapor-cizgi-28` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3802](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3802) |
| `--tema-yerel-rapor-cizgi-29` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3803](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3803) |
| `--tema-yerel-rapor-yardimci-metin-25` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3804](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3804) |
| `--tema-yerel-rapor-eylem-metin-09` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3805](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3805) |
| `--tema-yerel-rapor-eylem-metin-10` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3806](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3806) |
| `--tema-yerel-rapor-cizgi-30` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3807](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3807) |
| `--tema-yerel-rapor-yardimci-metin-26` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3808](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3808) |
| `--tema-yerel-rapor-secim-zemin-09` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3809](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3809) |
| `--tema-yerel-rapor-eylem-metin-11` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3810](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3810) |
| `--tema-yerel-rapor-golge-07` | `rgba(53,85,69,0.12)` | [data-tema="yesil"] | [app/tema.css:3811](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3811) |
| `--tema-yerel-rapor-odak-01` | `var(--tema-odak)` | [data-tema="yesil"] | [app/tema.css:3812](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3812) |
| `--tema-yerel-rapor-sayfa-zemini-21` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:3813](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3813) |
| `--tema-yerel-rapor-eylem-zemin-03` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3814](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3814) |
| `--tema-yerel-rapor-ana-metin-13` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3815](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3815) |
| `--tema-yerel-rapor-cizgi-31` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3816](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3816) |
| `--tema-yerel-rapor-cizgi-32` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3817](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3817) |
| `--tema-yerel-rapor-yardimci-metin-27` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3818](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3818) |
| `--tema-yerel-rapor-cizgi-33` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3819](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3819) |
| `--tema-yerel-rapor-sayfa-zemini-22` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:3820](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3820) |
| `--tema-yerel-rapor-cizgi-34` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3821](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3821) |
| `--tema-yerel-rapor-yardimci-metin-28` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3822](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3822) |
| `--tema-yerel-rapor-yardimci-metin-29` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3823](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3823) |
| `--tema-yerel-rapor-sayfa-zemini-23` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3824](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3824) |
| `--tema-yerel-rapor-yardimci-metin-30` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3825](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3825) |
| `--tema-yerel-rapor-ana-metin-14` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3826](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3826) |
| `--tema-yerel-rapor-yardimci-metin-31` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3827](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3827) |
| `--tema-yerel-rapor-cizgi-35` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3828](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3828) |
| `--tema-yerel-rapor-golge-08` | `rgba(53,85,69,0.05)` | [data-tema="yesil"] | [app/tema.css:3829](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3829) |
| `--tema-yerel-rapor-yardimci-metin-32` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3830](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3830) |
| `--tema-yerel-rapor-eylem-metin-12` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3831](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3831) |
| `--tema-yerel-rapor-secim-zemin-10` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3832](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3832) |
| `--tema-yerel-rapor-dekoratif-zemin-10` | `var(--tema-secili-metin)` | [data-tema="yesil"] | [app/tema.css:3833](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3833) |
| `--tema-yerel-rapor-dekoratif-zemin-11` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3834](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3834) |
| `--tema-yerel-rapor-golge-09` | `rgba(53,85,69,0.22)` | [data-tema="yesil"] | [app/tema.css:3835](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3835) |
| `--tema-yerel-rapor-cizgi-36` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3836](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3836) |
| `--tema-yerel-rapor-golge-10` | `rgba(53,85,69,0.055)` | [data-tema="yesil"] | [app/tema.css:3837](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3837) |
| `--tema-yerel-rapor-yardimci-metin-33` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3838](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3838) |
| `--tema-yerel-rapor-sayfa-zemini-24` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3839](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3839) |
| `--tema-yerel-rapor-yardimci-metin-34` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3840](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3840) |
| `--tema-yerel-rapor-yardimci-metin-35` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3841](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3841) |
| `--tema-yerel-rapor-yardimci-metin-36` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3842](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3842) |
| `--tema-yerel-rapor-yardimci-metin-37` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3843](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3843) |
| `--tema-yerel-rapor-yardimci-metin-38` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3844](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3844) |
| `--tema-yerel-rapor-ana-metin-15` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3845](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3845) |
| `--tema-yerel-rapor-secim-zemin-11` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3846](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3846) |
| `--tema-yerel-rapor-yardimci-metin-39` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3847](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3847) |
| `--tema-yerel-rapor-yardimci-metin-40` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3848](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3848) |
| `--tema-yerel-rapor-yardimci-metin-41` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3849](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3849) |
| `--tema-yerel-rapor-golge-11` | `rgba(53,85,69,0.04)` | [data-tema="yesil"] | [app/tema.css:3850](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3850) |
| `--tema-yerel-rapor-yardimci-metin-42` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3851](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3851) |
| `--tema-yerel-rapor-yardimci-metin-43` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3852](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3852) |
| `--tema-yerel-rapor-yardimci-metin-44` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3853](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3853) |
| `--tema-yerel-rapor-golge-12` | `rgba(53,85,69,0.035)` | [data-tema="yesil"] | [app/tema.css:3854](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3854) |
| `--tema-yerel-rapor-golge-13` | `rgba(53,85,69,0.08)` | [data-tema="yesil"] | [app/tema.css:3855](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3855) |
| `--tema-yerel-rapor-yardimci-metin-45` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3856](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3856) |
| `--tema-yerel-rapor-yardimci-metin-46` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3857](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3857) |
| `--tema-yerel-rapor-yardimci-metin-47` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3858](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3858) |
| `--tema-yerel-rapor-secim-zemin-12` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3859](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3859) |
| `--tema-yerel-rapor-ana-metin-16` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3860](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3860) |
| `--tema-yerel-rapor-cizgi-37` | `color-mix(in srgb, var(--tema-cizgi) 90%, transparent)` | [data-tema="yesil"] | [app/tema.css:3861](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3861) |
| `--tema-yerel-rapor-yardimci-metin-48` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3862](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3862) |
| `--tema-yerel-rapor-yardimci-metin-49` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3863](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3863) |
| `--tema-yerel-rapor-yardimci-metin-50` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3864](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3864) |
| `--tema-yerel-rapor-sayfa-zemini-25` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3865](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3865) |
| `--tema-yerel-rapor-cizgi-38` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3866](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3866) |
| `--tema-yerel-rapor-yardimci-metin-51` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3867](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3867) |
| `--tema-yerel-rapor-yardimci-metin-52` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3868](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3868) |
| `--tema-yerel-rapor-yardimci-metin-53` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3869](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3869) |
| `--tema-yerel-rapor-yardimci-metin-54` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3870](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3870) |
| `--tema-yerel-rapor-cizgi-39` | `color-mix(in srgb, var(--tema-cizgi) 90%, transparent)` | [data-tema="yesil"] | [app/tema.css:3871](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3871) |
| `--tema-yerel-rapor-ana-metin-17` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3872](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3872) |
| `--tema-yerel-rapor-yardimci-metin-55` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3873](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3873) |
| `--tema-yerel-rapor-cizgi-40` | `color-mix(in srgb, var(--tema-cizgi) 95%, transparent)` | [data-tema="yesil"] | [app/tema.css:3874](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3874) |
| `--tema-yerel-rapor-ana-metin-18` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3875](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3875) |
| `--tema-yerel-rapor-secim-zemin-13` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3876](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3876) |
| `--tema-yerel-rapor-yardimci-metin-56` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3877](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3877) |
| `--tema-yerel-rapor-yardimci-metin-57` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3878](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3878) |
| `--tema-yerel-rapor-cizgi-41` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3879](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3879) |
| `--tema-yerel-rapor-yardimci-metin-58` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3880](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3880) |
| `--tema-yerel-rapor-yardimci-metin-59` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3881](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3881) |
| `--tema-yerel-rapor-sayfa-zemini-26` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:3882](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3882) |
| `--tema-yerel-rapor-sayfa-zemini-27` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3883](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3883) |
| `--tema-yerel-rapor-yardimci-metin-60` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3884](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3884) |
| `--tema-yerel-magaza-sayfa-zemini-01` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3885](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3885) |
| `--tema-yerel-magaza-yardimci-metin-01` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3886](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3886) |
| `--tema-yerel-magaza-yardimci-metin-02` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3887](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3887) |
| `--tema-yerel-magaza-eylem-metin-01` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3888](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3888) |
| `--tema-yerel-magaza-cizgi-01` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3889](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3889) |
| `--tema-yerel-magaza-golge-01` | `rgba(53,85,69,0.035)` | [data-tema="yesil"] | [app/tema.css:3890](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3890) |
| `--tema-yerel-magaza-yardimci-metin-03` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3891](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3891) |
| `--tema-yerel-magaza-ana-metin-01` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3892](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3892) |
| `--tema-yerel-magaza-yardimci-metin-04` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3893](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3893) |
| `--tema-yerel-magaza-eylem-zemin-01` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3894](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3894) |
| `--tema-yerel-magaza-eylem-zemin-02` | `var(--tema-eylem-hover)` | [data-tema="yesil"] | [app/tema.css:3895](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3895) |
| `--tema-yerel-magaza-yardimci-metin-05` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3896](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3896) |
| `--tema-yerel-magaza-secim-zemin-01` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3897](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3897) |
| `--tema-yerel-magaza-ana-metin-02` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3898](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3898) |
| `--tema-yerel-magaza-cizgi-02` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3899](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3899) |
| `--tema-yerel-magaza-yardimci-metin-06` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3900](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3900) |
| `--tema-yerel-magaza-cizgi-03` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3901](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3901) |
| `--tema-yerel-magaza-sayfa-zemini-02` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3902](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3902) |
| `--tema-yerel-magaza-ana-metin-03` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3903](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3903) |
| `--tema-yerel-magaza-secim-zemin-02` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3904](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3904) |
| `--tema-yerel-magaza-ana-metin-04` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3905](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3905) |
| `--tema-yerel-magaza-cizgi-04` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3906](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3906) |
| `--tema-yerel-magaza-yardimci-metin-07` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3907](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3907) |
| `--tema-yerel-magaza-sayfa-zemini-03` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3908](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3908) |
| `--tema-yerel-magaza-yardimci-metin-08` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3909](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3909) |
| `--tema-yerel-magaza-cizgi-05` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3910](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3910) |
| `--tema-yerel-magaza-sayfa-zemini-04` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:3911](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3911) |
| `--tema-yerel-magaza-yardimci-metin-09` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3912](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3912) |
| `--tema-yerel-magaza-secim-zemin-03` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3913](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3913) |
| `--tema-yerel-magaza-eylem-metin-02` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3914](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3914) |
| `--tema-yerel-magaza-cizgi-06` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3915](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3915) |
| `--tema-yerel-magaza-yardimci-metin-10` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3916](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3916) |
| `--tema-yerel-magaza-ana-metin-05` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3917](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3917) |
| `--tema-yerel-magaza-yardimci-metin-11` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3918](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3918) |
| `--tema-yerel-magaza-ana-metin-06` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3919](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3919) |
| `--tema-yerel-magaza-yardimci-metin-12` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3920](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3920) |
| `--tema-yerel-magaza-cizgi-07` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3921](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3921) |
| `--tema-yerel-magaza-ana-metin-07` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3922](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3922) |
| `--tema-yerel-magaza-sayfa-zemini-05` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3923](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3923) |
| `--tema-yerel-magaza-sayfa-zemini-06` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:3924](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3924) |
| `--tema-yerel-magaza-cizgi-08` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3925](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3925) |
| `--tema-yerel-magaza-ana-metin-08` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3926](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3926) |
| `--tema-yerel-magaza-ana-metin-09` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3927](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3927) |
| `--tema-yerel-magaza-cizgi-09` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3928](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3928) |
| `--tema-yerel-magaza-yardimci-metin-13` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3929](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3929) |
| `--tema-yerel-magaza-secim-zemin-04` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3930](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3930) |
| `--tema-yerel-magaza-yardimci-metin-14` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3931](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3931) |
| `--tema-yerel-magaza-yardimci-metin-15` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3932](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3932) |
| `--tema-yerel-magaza-cizgi-10` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3933](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3933) |
| `--tema-yerel-magaza-golge-02` | `rgba(53,85,69,0.08)` | [data-tema="yesil"] | [app/tema.css:3934](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3934) |
| `--tema-yerel-magaza-yardimci-metin-16` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3935](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3935) |
| `--tema-yerel-magaza-secim-zemin-05` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3936](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3936) |
| `--tema-yerel-magaza-secim-zemin-06` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3937](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3937) |
| `--tema-yerel-magaza-yardimci-metin-17` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3938](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3938) |
| `--tema-yerel-magaza-yardimci-metin-18` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3939](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3939) |
| `--tema-yerel-magaza-yardimci-metin-19` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3940](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3940) |
| `--tema-yerel-magaza-cizgi-11` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3941](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3941) |
| `--tema-yerel-magaza-cizgi-12` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3942](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3942) |
| `--tema-yerel-magaza-sayfa-zemini-07` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3943](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3943) |
| `--tema-yerel-magaza-yardimci-metin-20` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3944](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3944) |
| `--tema-yerel-magaza-eylem-metin-03` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3945](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3945) |
| `--tema-yerel-magaza-sayfa-zemini-08` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3946](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3946) |
| `--tema-yerel-magaza-yardimci-metin-21` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3947](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3947) |
| `--tema-yerel-magaza-sayfa-zemini-09` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3948](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3948) |
| `--tema-yerel-magaza-vurgu-metin-01` | `var(--tema-vurgu)` | [data-tema="yesil"] | [app/tema.css:3949](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3949) |
| `--tema-yerel-magaza-sayfa-zemini-10` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3950](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3950) |
| `--tema-yerel-magaza-yardimci-metin-22` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3951](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3951) |
| `--tema-yerel-magaza-sayfa-zemini-11` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3952](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3952) |
| `--tema-yerel-magaza-cizgi-13` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3953](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3953) |
| `--tema-yerel-magaza-sayfa-zemini-12` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3954](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3954) |
| `--tema-yerel-magaza-yardimci-metin-23` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3955](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3955) |
| `--tema-yerel-magaza-yardimci-metin-24` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3956](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3956) |
| `--tema-yerel-lig-sayfa-zemini-04` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3957](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3957) |
| `--tema-yerel-lig-yardimci-metin-08` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3958](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3958) |
| `--tema-yerel-lig-eylem-zemin-01` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3959](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3959) |
| `--tema-yerel-lig-sayfa-zemini-05` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3960](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3960) |
| `--tema-yerel-lig-sayfa-zemini-06` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3961](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3961) |
| `--tema-yerel-lig-sayfa-zemini-07` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3962](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3962) |
| `--tema-yerel-uretim-secim-zemin-01` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3963](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3963) |
| `--tema-yerel-uretim-eylem-metin-01` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3964](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3964) |
| `--tema-yerel-uretim-cizgi-04` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3965](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3965) |
| `--tema-yerel-uretim-yardimci-metin-04` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3966](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3966) |
| `--tema-yerel-uretim-cizgi-05` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3967](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3967) |
| `--tema-yerel-uretim-secim-zemin-02` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3968](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3968) |
| `--tema-yerel-uretim-eylem-metin-02` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3969](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3969) |
| `--tema-yerel-uretim-cizgi-06` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3970](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3970) |
| `--tema-yerel-uretim-cizgi-07` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3971](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3971) |
| `--tema-yerel-uretim-secim-zemin-03` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3972](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3972) |
| `--tema-yerel-uretim-eylem-metin-03` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3973](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3973) |
| `--tema-yerel-uretim-vurgu-metin-01` | `var(--tema-vurgu)` | [data-tema="yesil"] | [app/tema.css:3974](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3974) |
| `--tema-yerel-uretim-ana-metin-04` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3975](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3975) |
| `--tema-yerel-uretim-yardimci-metin-05` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3976](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3976) |
| `--tema-yerel-uretim-eylem-metin-04` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3977](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3977) |
| `--tema-yerel-uretim-cizgi-08` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3978](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3978) |
| `--tema-yerel-uretim-eylem-zemin-01` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3979](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3979) |
| `--tema-yerel-uretim-yardimci-metin-06` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3980](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3980) |
| `--tema-yerel-uretim-yardimci-metin-07` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3981](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3981) |
| `--tema-yerel-uretim-cizgi-09` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3982](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3982) |
| `--tema-yerel-uretim-golge-01` | `rgba(53,85,69,0.045)` | [data-tema="yesil"] | [app/tema.css:3983](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3983) |
| `--tema-yerel-uretim-cizgi-10` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3984](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3984) |
| `--tema-yerel-uretim-ana-metin-05` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3985](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3985) |
| `--tema-yerel-uretim-secim-zemin-04` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3986](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3986) |
| `--tema-yerel-uretim-eylem-metin-05` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:3987](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3987) |
| `--tema-yerel-uretim-secim-zemin-05` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:3988](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3988) |
| `--tema-yerel-uretim-yardimci-metin-08` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3989](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3989) |
| `--tema-yerel-uretim-yardimci-metin-09` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3990](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3990) |
| `--tema-yerel-uretim-sayfa-zemini-02` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:3991](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3991) |
| `--tema-yerel-uretim-odak-01` | `var(--tema-odak)` | [data-tema="yesil"] | [app/tema.css:3992](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3992) |
| `--tema-yerel-uretim-cizgi-11` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3993](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3993) |
| `--tema-yerel-uretim-cizgi-12` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:3994](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3994) |
| `--tema-yerel-uretim-golge-02` | `rgba(53,85,69,0.12)` | [data-tema="yesil"] | [app/tema.css:3995](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3995) |
| `--tema-yerel-uretim-ana-metin-06` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:3996](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3996) |
| `--tema-yerel-uretim-yardimci-metin-10` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3997](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3997) |
| `--tema-yerel-uretim-yardimci-metin-11` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3998](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3998) |
| `--tema-yerel-uretim-yardimci-metin-12` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:3999](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:3999) |
| `--tema-yerel-uretim-yardimci-metin-13` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4000](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4000) |
| `--tema-yerel-uretim-cizgi-13` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4001](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4001) |
| `--tema-yerel-uretim-sayfa-zemini-03` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4002](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4002) |
| `--tema-yerel-uretim-secim-zemin-06` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4003](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4003) |
| `--tema-yerel-uretim-ana-metin-07` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4004](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4004) |
| `--tema-yerel-uretim-eylem-metin-06` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4005](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4005) |
| `--tema-yerel-uretim-secim-zemin-07` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4006](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4006) |
| `--tema-yerel-uretim-sayfa-zemini-04` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4007](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4007) |
| `--tema-yerel-uretim-cizgi-14` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4008](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4008) |
| `--tema-yerel-uretim-ana-metin-08` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4009](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4009) |
| `--tema-yerel-uretim-cizgi-15` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4010](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4010) |
| `--tema-yerel-uretim-sayfa-zemini-05` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4011](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4011) |
| `--tema-yerel-uretim-ana-metin-09` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4012](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4012) |
| `--tema-yerel-uretim-cizgi-16` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4013](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4013) |
| `--tema-yerel-uretim-eylem-zemin-02` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4014](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4014) |
| `--tema-yerel-uretim-eylem-zemin-03` | `var(--tema-eylem-hover)` | [data-tema="yesil"] | [app/tema.css:4015](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4015) |
| `--tema-yerel-uretim-cizgi-17` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4016](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4016) |
| `--tema-yerel-uretim-eylem-metin-07` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4017](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4017) |
| `--tema-yerel-uretim-eylem-zemin-04` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4018](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4018) |
| `--tema-yerel-uretim-sayfa-zemini-06` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4019](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4019) |
| `--tema-yerel-uretim-ana-metin-10` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4020](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4020) |
| `--tema-yerel-uretim-cizgi-18` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4021](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4021) |
| `--tema-yerel-uretim-sayfa-zemini-07` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4022](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4022) |
| `--tema-yerel-uretim-sayfa-zemini-08` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4023](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4023) |
| `--tema-yerel-uretim-sayfa-zemini-09` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4024](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4024) |
| `--tema-yerel-uretim-cizgi-19` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4025](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4025) |
| `--tema-yerel-uretim-ana-metin-11` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4026](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4026) |
| `--tema-yerel-uretim-secim-zemin-08` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4027](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4027) |
| `--tema-yerel-uretim-eylem-zemin-05` | `var(--tema-eylem-hover)` | [data-tema="yesil"] | [app/tema.css:4028](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4028) |
| `--tema-yerel-uretim-ana-metin-12` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4029](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4029) |
| `--tema-yerel-uretim-cizgi-20` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4030](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4030) |
| `--tema-yerel-uretim-cizgi-21` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4031](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4031) |
| `--tema-yerel-uretim-ana-metin-13` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4032](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4032) |
| `--tema-yerel-uretim-odak-02` | `var(--tema-odak)` | [data-tema="yesil"] | [app/tema.css:4033](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4033) |
| `--tema-yerel-uretim-eylem-metin-08` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4034](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4034) |
| `--tema-yerel-uretim-yardimci-metin-14` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4035](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4035) |
| `--tema-yerel-uretim-ana-metin-14` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4036](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4036) |
| `--tema-yerel-uretim-cizgi-22` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4037](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4037) |
| `--tema-yerel-uretim-sayfa-zemini-10` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4038](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4038) |
| `--tema-yerel-uretim-yardimci-metin-15` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4039](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4039) |
| `--tema-yerel-uretim-yardimci-metin-16` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4040](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4040) |
| `--tema-yerel-uretim-ana-metin-15` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4041](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4041) |
| `--tema-yerel-uretim-cizgi-23` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4042](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4042) |
| `--tema-yerel-uretim-yardimci-metin-17` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4043](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4043) |
| `--tema-yerel-uretim-yardimci-metin-18` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4044](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4044) |
| `--tema-yerel-uretim-ana-metin-16` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4045](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4045) |
| `--tema-yerel-uretim-yardimci-metin-19` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4046](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4046) |
| `--tema-yerel-uretim-sayfa-zemini-11` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4047](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4047) |
| `--tema-yerel-uretim-ana-metin-17` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4048](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4048) |
| `--tema-yerel-uretim-yardimci-metin-20` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4049](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4049) |
| `--tema-yerel-uretim-cizgi-24` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4050](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4050) |
| `--tema-yerel-uretim-ana-metin-18` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4051](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4051) |
| `--tema-yerel-uretim-eylem-zemin-06` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4052](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4052) |
| `--tema-yerel-uretim-cizgi-25` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4053](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4053) |
| `--tema-yerel-uretim-golge-03` | `rgba(53,85,69,0.13)` | [data-tema="yesil"] | [app/tema.css:4054](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4054) |
| `--tema-yerel-uretim-sayfa-zemini-12` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4055](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4055) |
| `--tema-yerel-uretim-cizgi-26` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4056](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4056) |
| `--tema-yerel-uretim-cizgi-27` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4057](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4057) |
| `--tema-yerel-uretim-golge-04` | `rgba(53,85,69,0.08)` | [data-tema="yesil"] | [app/tema.css:4058](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4058) |
| `--tema-yerel-uretim-sayfa-zemini-13` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4059](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4059) |
| `--tema-yerel-uretim-cizgi-28` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4060](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4060) |
| `--tema-yerel-uretim-sayfa-zemini-14` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4061](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4061) |
| `--tema-yerel-uretim-yardimci-metin-21` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4062](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4062) |
| `--tema-yerel-uretim-ana-metin-19` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4063](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4063) |
| `--tema-yerel-uretim-yardimci-metin-22` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4064](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4064) |
| `--tema-yerel-uretim-yardimci-metin-23` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4065](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4065) |
| `--tema-yerel-uretim-cizgi-29` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4066](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4066) |
| `--tema-yerel-uretim-eylem-zemin-07` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4067](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4067) |
| `--tema-yerel-uretim-cizgi-30` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4068](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4068) |
| `--tema-yerel-uretim-golge-05` | `rgba(53,85,69,0.05)` | [data-tema="yesil"] | [app/tema.css:4069](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4069) |
| `--tema-yerel-uretim-secim-zemin-09` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4070](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4070) |
| `--tema-yerel-uretim-secim-zemin-10` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4071](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4071) |
| `--tema-yerel-uretim-eylem-metin-09` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4072](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4072) |
| `--tema-yerel-uretim-cizgi-31` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4073](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4073) |
| `--tema-yerel-uretim-sayfa-zemini-15` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4074](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4074) |
| `--tema-yerel-uretim-yardimci-metin-24` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4075](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4075) |
| `--tema-yerel-uretim-cizgi-32` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4076](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4076) |
| `--tema-yerel-uretim-cizgi-33` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4077](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4077) |
| `--tema-yerel-uretim-cizgi-34` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4078](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4078) |
| `--tema-yerel-uretim-yardimci-metin-25` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4079](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4079) |
| `--tema-yerel-uretim-secim-zemin-11` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4080](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4080) |
| `--tema-yerel-uretim-eylem-metin-10` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4081](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4081) |
| `--tema-yerel-uretim-cizgi-35` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4082](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4082) |
| `--tema-yerel-uretim-eylem-zemin-08` | `var(--tema-eylem-hover)` | [data-tema="yesil"] | [app/tema.css:4083](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4083) |
| `--tema-yerel-uretim-cizgi-36` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4084](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4084) |
| `--tema-yerel-uretim-yardimci-metin-26` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4085](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4085) |
| `--tema-yerel-uretim-sayfa-zemini-16` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4086](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4086) |
| `--tema-yerel-uretim-cizgi-37` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4087](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4087) |
| `--tema-yerel-uretim-ana-metin-20` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4088](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4088) |
| `--tema-yerel-uretim-yardimci-metin-27` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4089](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4089) |
| `--tema-yerel-uretim-eylem-metin-11` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4090](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4090) |
| `--tema-yerel-uretim-yardimci-metin-28` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4091](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4091) |
| `--tema-yerel-uretim-yardimci-metin-29` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4092](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4092) |
| `--tema-yerel-uretim-golge-06` | `rgba(53,85,69,0.22)` | [data-tema="yesil"] | [app/tema.css:4093](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4093) |
| `--tema-yerel-uretim-eylem-zemin-09` | `var(--tema-eylem-hover)` | [data-tema="yesil"] | [app/tema.css:4094](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4094) |
| `--tema-yerel-uretim-sayfa-zemini-17` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4095](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4095) |
| `--tema-yerel-uretim-cizgi-38` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4096](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4096) |
| `--tema-yerel-uretim-sayfa-zemini-18` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4097](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4097) |
| `--tema-yerel-uretim-ana-metin-21` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4098](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4098) |
| `--tema-yerel-uretim-yardimci-metin-30` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4099](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4099) |
| `--tema-yerel-uretim-cizgi-39` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4100](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4100) |
| `--tema-yerel-uretim-secim-zemin-12` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4101](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4101) |
| `--tema-yerel-uretim-eylem-metin-12` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4102](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4102) |
| `--tema-yerel-uretim-cizgi-40` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4103](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4103) |
| `--tema-yerel-uretim-eylem-zemin-10` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4104](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4104) |
| `--tema-yerel-uretim-yardimci-metin-31` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4105](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4105) |
| `--tema-yerel-uretim-sayfa-zemini-19` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4106](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4106) |
| `--tema-yerel-uretim-ana-metin-22` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4107](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4107) |
| `--tema-yerel-uretim-cizgi-41` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4108](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4108) |
| `--tema-yerel-uretim-cizgi-42` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4109](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4109) |
| `--tema-yerel-uretim-eylem-metin-13` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4110](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4110) |
| `--tema-yerel-uretim-sayfa-zemini-20` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4111](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4111) |
| `--tema-yerel-uretim-yardimci-metin-32` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4112](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4112) |
| `--tema-yerel-uretim-sayfa-zemini-21` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4113](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4113) |
| `--tema-yerel-uretim-secim-zemin-13` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4114](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4114) |
| `--tema-yerel-uretim-cizgi-43` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4115](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4115) |
| `--tema-yerel-uretim-ana-metin-23` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4116](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4116) |
| `--tema-yerel-uretim-yardimci-metin-33` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4117](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4117) |
| `--tema-yerel-uretim-sayfa-zemini-22` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4118](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4118) |
| `--tema-yerel-uretim-cizgi-44` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4119](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4119) |
| `--tema-yerel-uretim-eylem-metin-14` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4120](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4120) |
| `--tema-yerel-uretim-ana-metin-24` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4121](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4121) |
| `--tema-yerel-uretim-yardimci-metin-34` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4122](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4122) |
| `--tema-yerel-uretim-yardimci-metin-35` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4123](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4123) |
| `--tema-yerel-uretim-eylem-metin-15` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4124](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4124) |
| `--tema-yerel-uretim-cizgi-45` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4125](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4125) |
| `--tema-yerel-uretim-secim-zemin-14` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4126](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4126) |
| `--tema-yerel-uretim-eylem-metin-16` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4127](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4127) |
| `--tema-yerel-uretim-secim-zemin-15` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4128](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4128) |
| `--tema-yerel-uretim-vurgu-zemin-01` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4129](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4129) |
| `--tema-yerel-uretim-golge-07` | `rgba(53,85,69,0.035)` | [data-tema="yesil"] | [app/tema.css:4130](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4130) |
| `--tema-yerel-uretim-cizgi-46` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4131](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4131) |
| `--tema-yerel-uretim-ana-metin-25` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4132](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4132) |
| `--tema-yerel-uretim-cizgi-47` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4133](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4133) |
| `--tema-yerel-uretim-golge-08` | `rgba(53,85,69,0.1)` | [data-tema="yesil"] | [app/tema.css:4134](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4134) |
| `--tema-yerel-uretim-dekoratif-zemin-01` | `var(--tema-baslik)` | [data-tema="yesil"] | [app/tema.css:4135](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4135) |
| `--tema-yerel-uretim-eylem-zemin-11` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4136](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4136) |
| `--tema-yerel-uretim-eylem-metin-17` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4137](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4137) |
| `--tema-yerel-uretim-yardimci-metin-36` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4138](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4138) |
| `--tema-yerel-uretim-yardimci-metin-37` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4139](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4139) |
| `--tema-yerel-uretim-ana-metin-26` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4140](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4140) |
| `--tema-yerel-uretim-cizgi-49` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4141](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4141) |
| `--tema-yerel-uretim-cizgi-50` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4142](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4142) |
| `--tema-yerel-uretim-secim-zemin-16` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4143](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4143) |
| `--tema-yerel-uretim-eylem-metin-18` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4144](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4144) |
| `--tema-yerel-uretim-ana-metin-27` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4145](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4145) |
| `--tema-yerel-uretim-yardimci-metin-38` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4146](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4146) |
| `--tema-yerel-uretim-ana-metin-28` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4147](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4147) |
| `--tema-yerel-uretim-yardimci-metin-39` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4148](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4148) |
| `--tema-yerel-uretim-sayfa-zemini-23` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4149](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4149) |
| `--tema-yerel-uretim-yardimci-metin-40` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4150](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4150) |
| `--tema-yerel-uretim-secim-zemin-17` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4151](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4151) |
| `--tema-yerel-uretim-sayfa-zemini-24` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4152](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4152) |
| `--tema-yerel-uretim-yardimci-metin-41` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4153](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4153) |
| `--tema-yerel-uretim-golge-09` | `rgba(53,85,69,0.03)` | [data-tema="yesil"] | [app/tema.css:4154](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4154) |
| `--tema-yerel-yonetim-sayfa-zemini-01` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4155](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4155) |
| `--tema-yerel-yonetim-cizgi-01` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4156](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4156) |
| `--tema-yerel-yonetim-ana-metin-01` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4157](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4157) |
| `--tema-yerel-yonetim-yardimci-metin-01` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4158](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4158) |
| `--tema-yerel-yonetim-vurgu-metin-01` | `var(--tema-vurgu)` | [data-tema="yesil"] | [app/tema.css:4159](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4159) |
| `--tema-yerel-yonetim-eylem-metin-01` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4160](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4160) |
| `--tema-yerel-yonetim-cizgi-02` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4161](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4161) |
| `--tema-yerel-yonetim-ana-metin-02` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4162](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4162) |
| `--tema-yerel-yonetim-cizgi-03` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4163](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4163) |
| `--tema-yerel-yonetim-cizgi-04` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4164](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4164) |
| `--tema-yerel-yonetim-ana-metin-03` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4165](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4165) |
| `--tema-yerel-yonetim-sayfa-zemini-02` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4166](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4166) |
| `--tema-yerel-yonetim-cizgi-05` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4167](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4167) |
| `--tema-yerel-yonetim-eylem-zemin-01` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4168](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4168) |
| `--tema-yerel-yonetim-ana-metin-04` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4169](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4169) |
| `--tema-yerel-yonetim-yardimci-metin-02` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4170](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4170) |
| `--tema-yerel-yonetim-sayfa-zemini-03` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4171](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4171) |
| `--tema-yerel-yonetim-sayfa-zemini-04` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4172](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4172) |
| `--tema-yerel-yonetim-secim-zemin-01` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4173](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4173) |
| `--tema-yerel-yonetim-yardimci-metin-03` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4174](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4174) |
| `--tema-yerel-yonetim-yardimci-metin-04` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4175](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4175) |
| `--tema-yerel-yonetim-yardimci-metin-05` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4176](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4176) |
| `--tema-yerel-yonetim-sayfa-zemini-05` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4177](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4177) |
| `--tema-yerel-yonetim-sayfa-zemini-06` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4178](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4178) |
| `--tema-yerel-yonetim-sayfa-zemini-07` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4179](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4179) |
| `--tema-yerel-yonetim-cizgi-06` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4180](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4180) |
| `--tema-yerel-yonetim-cizgi-07` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4181](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4181) |
| `--tema-yerel-yonetim-yardimci-metin-06` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4182](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4182) |
| `--tema-yerel-yonetim-ana-metin-05` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4183](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4183) |
| `--tema-yerel-yonetim-cizgi-08` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4184](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4184) |
| `--tema-yerel-yonetim-ana-metin-06` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4185](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4185) |
| `--tema-yerel-yonetim-cizgi-09` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4186](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4186) |
| `--tema-yerel-yonetim-ana-metin-07` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4187](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4187) |
| `--tema-yerel-yonetim-cizgi-10` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4188](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4188) |
| `--tema-yerel-yonetim-yardimci-metin-07` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4189](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4189) |
| `--tema-yerel-yonetim-ana-metin-08` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4190](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4190) |
| `--tema-yerel-yonetim-sayfa-zemini-08` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4191](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4191) |
| `--tema-yerel-yonetim-vurgu-zemin-01` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4192](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4192) |
| `--tema-yerel-yonetim-vurgu-odak-01` | `var(--tema-odak)` | [data-tema="yesil"] | [app/tema.css:4193](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4193) |
| `--tema-yerel-yonetim-eylem-zemin-02` | `color-mix(in srgb, var(--tema-eylem) 45%, transparent)` | [data-tema="yesil"] | [app/tema.css:4194](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4194) |
| `--tema-yerel-yonetim-vurgu-cizgi-01` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4195](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4195) |
| `--tema-yerel-yonetim-secim-zemin-02` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4196](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4196) |
| `--tema-yerel-giris-ana-metin-01` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4197](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4197) |
| `--tema-yerel-giris-vurgu-metin-01` | `var(--tema-vurgu)` | [data-tema="yesil"] | [app/tema.css:4198](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4198) |
| `--tema-yerel-eczanem-cizgi-25` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4199](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4199) |
| `--tema-yerel-eczanem-cizgi-26` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4200](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4200) |
| `--tema-yerel-eczanem-secim-zemin-09` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4201](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4201) |
| `--tema-yerel-eczanem-eylem-zemin-05` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4202](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4202) |
| `--tema-yerel-eczanem-ana-metin-15` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4203](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4203) |
| `--tema-yerel-eczanem-eylem-metin-06` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4204](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4204) |
| `--tema-yerel-eczanem-eylem-metin-07` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4205](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4205) |
| `--tema-yerel-eczanem-eylem-zemin-06` | `var(--tema-eylem-hover)` | [data-tema="yesil"] | [app/tema.css:4206](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4206) |
| `--tema-yerel-eczanem-sayfa-zemini-15` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4207](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4207) |
| `--tema-yerel-eczanem-ana-metin-16` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4208](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4208) |
| `--tema-yerel-eczanem-cizgi-27` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4209](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4209) |
| `--tema-yerel-eczanem-cizgi-28` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4210](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4210) |
| `--tema-yerel-eczanem-eylem-zemin-07` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4211](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4211) |
| `--tema-yerel-eczanem-eylem-zemin-08` | `var(--tema-eylem-hover)` | [data-tema="yesil"] | [app/tema.css:4212](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4212) |
| `--tema-yerel-eczanem-cizgi-29` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4213](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4213) |
| `--tema-yerel-eczanem-vurgu-metin-01` | `var(--tema-vurgu)` | [data-tema="yesil"] | [app/tema.css:4214](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4214) |
| `--tema-yerel-eczanem-yardimci-metin-29` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4215](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4215) |
| `--tema-yerel-eczanem-ana-metin-17` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4216](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4216) |
| `--tema-yerel-eczanem-ana-metin-18` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4217](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4217) |
| `--tema-yerel-eczanem-ana-metin-19` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4218](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4218) |
| `--tema-yerel-eczanem-cizgi-30` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4219](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4219) |
| `--tema-yerel-eczanem-odak-02` | `var(--tema-odak)` | [data-tema="yesil"] | [app/tema.css:4220](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4220) |
| `--tema-yerel-eczanem-sayfa-zemini-16` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4221](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4221) |
| `--tema-yerel-eczanem-cizgi-31` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4222](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4222) |
| `--tema-yerel-eczanem-yardimci-metin-30` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4223](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4223) |
| `--tema-yerel-eczanem-eylem-zemin-09` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4224](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4224) |
| `--tema-yerel-eczanem-yardimci-metin-31` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4225](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4225) |
| `--tema-yerel-eczanem-eylem-metin-08` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4226](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4226) |
| `--tema-yerel-eczanem-eylem-zemin-10` | `color-mix(in srgb, var(--tema-eylem) 12%, transparent)` | [data-tema="yesil"] | [app/tema.css:4227](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4227) |
| `--tema-yerel-eczanem-sayfa-zemini-17` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4228](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4228) |
| `--tema-yerel-eczanem-yardimci-metin-32` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4229](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4229) |
| `--tema-yerel-eczanem-sayfa-zemini-18` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4230](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4230) |
| `--tema-yerel-eczanem-vurgu-zemin-01` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4231](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4231) |
| `--tema-yerel-eczanem-ana-metin-20` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4232](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4232) |
| `--tema-yerel-eczanem-cizgi-32` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4233](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4233) |
| `--tema-yerel-eczanem-sayfa-zemini-19` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4234](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4234) |
| `--tema-yerel-eczanem-yardimci-metin-33` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4235](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4235) |
| `--tema-yerel-eczanem-cizgi-33` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4236](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4236) |
| `--tema-yerel-eczanem-cizgi-34` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4237](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4237) |
| `--tema-yerel-eczanem-yardimci-metin-34` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4238](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4238) |
| `--tema-yerel-eczanem-yardimci-metin-35` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4239](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4239) |
| `--tema-yerel-eczanem-yardimci-metin-36` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4240](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4240) |
| `--tema-yerel-eczanem-sayfa-zemini-20` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4241](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4241) |
| `--tema-yerel-eczanem-eylem-metin-09` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4242](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4242) |
| `--tema-yerel-eczanem-yardimci-metin-37` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4243](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4243) |
| `--tema-yerel-eczanem-eylem-metin-10` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4244](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4244) |
| `--tema-yerel-eczanem-sayfa-zemini-21` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4245](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4245) |
| `--tema-yerel-eczanem-yardimci-metin-38` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4246](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4246) |
| `--tema-yerel-eczanem-yardimci-metin-39` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4247](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4247) |
| `--tema-yerel-eczanem-cizgi-36` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4248](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4248) |
| `--tema-yerel-eczanem-ana-metin-21` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4249](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4249) |
| `--tema-yerel-eczanem-cizgi-37` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4250](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4250) |
| `--tema-yerel-eczanem-cizgi-38` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4251](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4251) |
| `--tema-yerel-eczanem-vurgu-cizgi-01` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4252](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4252) |
| `--tema-yerel-eczanem-sayfa-zemini-22` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4253](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4253) |
| `--tema-yerel-eczanem-ana-metin-22` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4254](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4254) |
| `--tema-yerel-eczanem-yardimci-metin-40` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4255](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4255) |
| `--tema-yerel-eczanem-sayfa-zemini-23` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4256](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4256) |
| `--tema-yerel-eczanem-cizgi-39` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4257](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4257) |
| `--tema-yerel-eczanem-ana-metin-23` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4258](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4258) |
| `--tema-yerel-eczanem-sayfa-zemini-24` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4259](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4259) |
| `--tema-yerel-eczanem-sayfa-zemini-25` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4260](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4260) |
| `--tema-yerel-eczanem-eylem-zemin-11` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4261](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4261) |
| `--tema-yerel-eczanem-eylem-zemin-12` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4262](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4262) |
| `--tema-yerel-eczanem-golge-06` | `rgba(53,85,69,0.18)` | [data-tema="yesil"] | [app/tema.css:4263](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4263) |
| `--tema-yerel-eczanem-yardimci-metin-41` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4264](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4264) |
| `--tema-yerel-eczanem-cizgi-40` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4265](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4265) |
| `--tema-yerel-eczanem-ana-metin-24` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4266](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4266) |
| `--tema-yerel-eczanem-yardimci-metin-42` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4267](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4267) |
| `--tema-yerel-giris-yardimci-metin-01` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4268](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4268) |
| `--tema-yerel-giris-odak-01` | `var(--tema-odak)` | [data-tema="yesil"] | [app/tema.css:4269](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4269) |
| `--tema-yerel-giris-yardimci-metin-02` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4270](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4270) |
| `--tema-yerel-giris-cizgi-01` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4271](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4271) |
| `--tema-yerel-giris-sayfa-zemini-01` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4272](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4272) |
| `--tema-yerel-giris-ana-metin-02` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4273](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4273) |
| `--tema-yerel-giris-yardimci-metin-03` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4274](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4274) |
| `--tema-yerel-giris-sayfa-zemini-02` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4275](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4275) |
| `--tema-yerel-giris-eylem-zemin-01` | `color-mix(in srgb, var(--tema-eylem) 8%, transparent)` | [data-tema="yesil"] | [app/tema.css:4276](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4276) |
| `--tema-yerel-giris-cizgi-02` | `color-mix(in srgb, var(--tema-cizgi) 22%, transparent)` | [data-tema="yesil"] | [app/tema.css:4277](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4277) |
| `--tema-yerel-giris-ana-metin-03` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4278](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4278) |
| `--tema-yerel-giris-cizgi-03` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4279](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4279) |
| `--tema-yerel-giris-vurgu-cizgi-01` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4280](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4280) |
| `--tema-yerel-giris-vurgu-odak-01` | `var(--tema-odak)` | [data-tema="yesil"] | [app/tema.css:4281](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4281) |
| `--tema-yerel-giris-sayfa-zemini-03` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4282](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4282) |
| `--tema-yerel-giris-cizgi-04` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4283](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4283) |
| `--tema-yerel-giris-ana-metin-04` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4284](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4284) |
| `--tema-yerel-ortak-sayfa-cizgi-07` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4285](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4285) |
| `--tema-yerel-ortak-sayfa-ana-metin-09` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4286](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4286) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-13` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4287](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4287) |
| `--tema-yerel-ortak-sayfa-sayfa-zemini-07` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4288](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4288) |
| `--tema-yerel-ortak-sayfa-vurgu-zemin-01` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4289](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4289) |
| `--tema-yerel-ortak-sayfa-vurgu-metin-01` | `var(--tema-vurgu)` | [data-tema="yesil"] | [app/tema.css:4290](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4290) |
| `--tema-yerel-ortak-sayfa-secim-zemin-03` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4291](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4291) |
| `--tema-yerel-ortak-sayfa-eylem-metin-02` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4292](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4292) |
| `--tema-yerel-ortak-sayfa-sayfa-zemini-08` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4293](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4293) |
| `--tema-yerel-ortak-sayfa-ana-metin-10` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4294](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4294) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-14` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4295](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4295) |
| `--tema-yerel-ortak-sayfa-ana-metin-11` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4296](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4296) |
| `--tema-yerel-ortak-sayfa-eylem-metin-03` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4297](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4297) |
| `--tema-yerel-ortak-sayfa-cizgi-08` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4298](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4298) |
| `--tema-yerel-ana-sayfa-ana-metin-01` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4299](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4299) |
| `--tema-yerel-ana-sayfa-yardimci-metin-03` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4300](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4300) |
| `--tema-yerel-ana-sayfa-eylem-zemin-01` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4301](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4301) |
| `--tema-yerel-ana-sayfa-cizgi-03` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4302](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4302) |
| `--tema-yerel-ana-sayfa-cizgi-04` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4303](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4303) |
| `--tema-yerel-ana-sayfa-eylem-zemin-02` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4304](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4304) |
| `--tema-yerel-ana-sayfa-eylem-zemin-03` | `var(--tema-eylem-hover)` | [data-tema="yesil"] | [app/tema.css:4305](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4305) |
| `--tema-yerel-ana-sayfa-secim-zemin-02` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4306](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4306) |
| `--tema-yerel-ana-sayfa-eylem-metin-02` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4307](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4307) |
| `--tema-yerel-ana-sayfa-sayfa-zemini-01` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4308](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4308) |
| `--tema-yerel-ana-sayfa-yardimci-metin-04` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4309](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4309) |
| `--tema-yerel-ana-sayfa-eylem-metin-03` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4310](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4310) |
| `--tema-yerel-ana-sayfa-vurgu-metin-01` | `var(--tema-vurgu)` | [data-tema="yesil"] | [app/tema.css:4311](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4311) |
| `--tema-yerel-ana-sayfa-cizgi-05` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4312](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4312) |
| `--tema-yerel-ana-sayfa-sayfa-zemini-02` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4313](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4313) |
| `--tema-yerel-ana-sayfa-yardimci-metin-05` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4314](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4314) |
| `--tema-yerel-ana-sayfa-ana-metin-02` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4315](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4315) |
| `--tema-yerel-ana-sayfa-cizgi-06` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4316](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4316) |
| `--tema-yerel-ana-sayfa-secim-zemin-03` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4317](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4317) |
| `--tema-yerel-ana-sayfa-ana-metin-03` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4318](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4318) |
| `--tema-yerel-ana-sayfa-eylem-zemin-04` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4319](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4319) |
| `--tema-yerel-ana-sayfa-eylem-metin-04` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4320](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4320) |
| `--tema-yerel-ana-sayfa-secim-zemin-04` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4321](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4321) |
| `--tema-yerel-ana-sayfa-cizgi-07` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4322](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4322) |
| `--tema-yerel-ana-sayfa-eylem-metin-05` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4323](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4323) |
| `--tema-yerel-ana-sayfa-cizgi-08` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4324](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4324) |
| `--tema-yerel-ana-sayfa-yardimci-metin-06` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4325](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4325) |
| `--tema-yerel-ana-sayfa-cizgi-09` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4326](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4326) |
| `--tema-yerel-ana-sayfa-sayfa-zemini-03` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4327](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4327) |
| `--tema-yerel-ana-sayfa-ana-metin-04` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4328](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4328) |
| `--tema-yerel-ana-sayfa-cizgi-11` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4329](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4329) |
| `--tema-yerel-ana-sayfa-cizgi-12` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4330](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4330) |
| `--tema-yerel-ana-sayfa-eylem-metin-06` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4331](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4331) |
| `--tema-yerel-ana-sayfa-secim-zemin-05` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4332](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4332) |
| `--tema-yerel-ana-sayfa-sayfa-zemini-04` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4333](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4333) |
| `--tema-yerel-ana-sayfa-ana-metin-05` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4334](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4334) |
| `--tema-yerel-giris-vurgu-zemin-01` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4335](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4335) |
| `--tema-yerel-lig-cizgi-06` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4336](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4336) |
| `--tema-yerel-lig-sayfa-zemini-08` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4337](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4337) |
| `--tema-yerel-lig-yardimci-metin-09` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4338](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4338) |
| `--tema-yerel-lig-cizgi-07` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4339](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4339) |
| `--tema-yerel-lig-yardimci-metin-10` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4340](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4340) |
| `--tema-yerel-lig-cizgi-08` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4341](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4341) |
| `--tema-yerel-lig-ana-metin-07` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4342](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4342) |
| `--tema-yerel-lig-eylem-zemin-02` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4343](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4343) |
| `--tema-yerel-lig-eylem-zemin-03` | `var(--tema-eylem-hover)` | [data-tema="yesil"] | [app/tema.css:4344](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4344) |
| `--tema-yerel-lig-yardimci-metin-11` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4345](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4345) |
| `--tema-yerel-eclub-eylem-metin-08` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4346](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4346) |
| `--tema-yerel-eclub-yardimci-metin-44` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4347](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4347) |
| `--tema-yerel-eclub-ana-metin-27` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4348](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4348) |
| `--tema-yerel-eclub-cizgi-40` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4349](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4349) |
| `--tema-yerel-eclub-yardimci-metin-45` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4350](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4350) |
| `--tema-yerel-eclub-secim-zemin-13` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4351](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4351) |
| `--tema-yerel-eclub-eylem-metin-09` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4352](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4352) |
| `--tema-yerel-eclub-yardimci-metin-46` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4353](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4353) |
| `--tema-yerel-eclub-eylem-metin-10` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4354](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4354) |
| `--tema-yerel-eclub-secim-zemin-14` | `color-mix(in srgb, var(--tema-secili) 72%, transparent)` | [data-tema="yesil"] | [app/tema.css:4355](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4355) |
| `--tema-yerel-eclub-sayfa-zemini-20` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4356](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4356) |
| `--tema-yerel-eclub-golge-12` | `rgba(53,85,69,0.09)` | [data-tema="yesil"] | [app/tema.css:4357](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4357) |
| `--tema-yerel-eclub-cizgi-41` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4358](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4358) |
| `--tema-yerel-eclub-ana-metin-28` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4359](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4359) |
| `--tema-yerel-eclub-eylem-zemin-14` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4360](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4360) |
| `--tema-yerel-eclub-eylem-zemin-15` | `var(--tema-eylem-hover)` | [data-tema="yesil"] | [app/tema.css:4361](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4361) |
| `--tema-yerel-eclub-cizgi-42` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4362](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4362) |
| `--tema-yerel-eclub-sayfa-zemini-21` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4363](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4363) |
| `--tema-yerel-eclub-secim-zemin-15` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4364](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4364) |
| `--tema-yerel-eclub-eylem-metin-11` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4365](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4365) |
| `--tema-yerel-eclub-secim-zemin-16` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4366](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4366) |
| `--tema-yerel-eclub-eylem-metin-12` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4367](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4367) |
| `--tema-yerel-eclub-secim-zemin-17` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4368](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4368) |
| `--tema-yerel-eclub-dekoratif-zemin-12` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4369](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4369) |
| `--tema-yerel-eclub-dekoratif-zemin-13` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4370](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4370) |
| `--tema-yerel-eclub-golge-13` | `rgba(53,85,69,0.2)` | [data-tema="yesil"] | [app/tema.css:4371](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4371) |
| `--tema-yerel-eclub-secim-zemin-18` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4372](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4372) |
| `--tema-yerel-eclub-cizgi-44` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4373](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4373) |
| `--tema-yerel-eclub-secim-zemin-19` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4374](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4374) |
| `--tema-yerel-eclub-eylem-metin-13` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4375](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4375) |
| `--tema-yerel-eclub-cizgi-45` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4376](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4376) |
| `--tema-yerel-eclub-sayfa-zemini-22` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4377](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4377) |
| `--tema-yerel-eclub-yardimci-metin-47` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4378](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4378) |
| `--tema-yerel-eclub-cizgi-46` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4379](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4379) |
| `--tema-yerel-eclub-cizgi-47` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4380](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4380) |
| `--tema-yerel-eclub-sayfa-zemini-23` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4381](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4381) |
| `--tema-yerel-eclub-ana-metin-29` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4382](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4382) |
| `--tema-yerel-eclub-golge-14` | `rgba(53,85,69,0.12)` | [data-tema="yesil"] | [app/tema.css:4383](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4383) |
| `--tema-yerel-eclub-golge-15` | `rgba(53,85,69,0.08)` | [data-tema="yesil"] | [app/tema.css:4384](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4384) |
| `--tema-yerel-eclub-secim-zemin-20` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4385](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4385) |
| `--tema-yerel-eclub-golge-16` | `rgba(53,85,69,0.06)` | [data-tema="yesil"] | [app/tema.css:4386](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4386) |
| `--tema-yerel-eclub-secim-zemin-21` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4387](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4387) |
| `--tema-yerel-eclub-yardimci-metin-48` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4388](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4388) |
| `--tema-yerel-eclub-yardimci-metin-49` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4389](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4389) |
| `--tema-yerel-eclub-yardimci-metin-50` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4390](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4390) |
| `--tema-yerel-eclub-yardimci-metin-51` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4391](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4391) |
| `--tema-yerel-eclub-yardimci-metin-52` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4392](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4392) |
| `--tema-yerel-eclub-cizgi-48` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4393](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4393) |
| `--tema-yerel-eclub-secim-zemin-22` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4394](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4394) |
| `--tema-yerel-eclub-yardimci-metin-53` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4395](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4395) |
| `--tema-yerel-eclub-yardimci-metin-54` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4396](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4396) |
| `--tema-yerel-eclub-sayfa-zemini-24` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4397](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4397) |
| `--tema-yerel-eclub-secim-zemin-23` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4398](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4398) |
| `--tema-yerel-ortak-sayfa-eylem-metin-04` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4399](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4399) |
| `--tema-yerel-ortak-sayfa-ana-metin-12` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4400](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4400) |
| `--tema-yerel-ortak-sayfa-eylem-zemin-04` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4401](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4401) |
| `--tema-yerel-ortak-sayfa-ana-metin-13` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4402](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4402) |
| `--tema-yerel-ortak-sayfa-secim-zemin-04` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4403](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4403) |
| `--tema-yerel-ortak-sayfa-secim-zemin-05` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4404](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4404) |
| `--tema-yerel-ortak-sayfa-secim-zemin-06` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4405](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4405) |
| `--tema-yerel-ortak-sayfa-cizgi-10` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4406](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4406) |
| `--tema-yerel-ortak-sayfa-eylem-metin-05` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4407](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4407) |
| `--tema-yerel-lig-ana-metin-08` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4408](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4408) |
| `--tema-yerel-lig-eylem-metin-03` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4409](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4409) |
| `--tema-yerel-lig-cizgi-09` | `color-mix(in srgb, var(--tema-cizgi) 18%, transparent)` | [data-tema="yesil"] | [app/tema.css:4410](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4410) |
| `--tema-yerel-lig-golge-02` | `rgba(53,85,69,0.055)` | [data-tema="yesil"] | [app/tema.css:4411](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4411) |
| `--tema-yerel-lig-secim-zemin-03` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4412](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4412) |
| `--tema-yerel-lig-eylem-metin-04` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4413](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4413) |
| `--tema-yerel-lig-ana-metin-09` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4414](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4414) |
| `--tema-yerel-lig-yardimci-metin-12` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4415](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4415) |
| `--tema-yerel-lig-secim-zemin-04` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4416](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4416) |
| `--tema-yerel-lig-eylem-metin-05` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4417](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4417) |
| `--tema-yerel-lig-secim-zemin-05` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4418](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4418) |
| `--tema-yerel-lig-eylem-metin-06` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4419](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4419) |
| `--tema-yerel-lig-sayfa-zemini-09` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4420](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4420) |
| `--tema-yerel-lig-cizgi-10` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4421](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4421) |
| `--tema-yerel-lig-cizgi-11` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4422](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4422) |
| `--tema-yerel-lig-secim-zemin-06` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4423](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4423) |
| `--tema-yerel-lig-sayfa-zemini-10` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4424](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4424) |
| `--tema-yerel-lig-yardimci-metin-13` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4425](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4425) |
| `--tema-yerel-lig-secim-zemin-07` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4426](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4426) |
| `--tema-yerel-lig-dekoratif-zemin-01` | `var(--tema-secili-metin)` | [data-tema="yesil"] | [app/tema.css:4427](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4427) |
| `--tema-yerel-lig-dekoratif-zemin-02` | `var(--tema-secili-metin)` | [data-tema="yesil"] | [app/tema.css:4428](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4428) |
| `--tema-yerel-lig-eylem-metin-07` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4429](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4429) |
| `--tema-yerel-lig-ana-metin-10` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4430](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4430) |
| `--tema-yerel-lig-sayfa-zemini-11` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4431](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4431) |
| `--tema-yerel-lig-yardimci-metin-14` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4432](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4432) |
| `--tema-yerel-lig-cizgi-12` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4433](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4433) |
| `--tema-yerel-lig-yardimci-metin-15` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4434](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4434) |
| `--tema-yerel-lig-sayfa-zemini-12` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4435](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4435) |
| `--tema-yerel-lig-eylem-metin-08` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4436](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4436) |
| `--tema-yerel-lig-yardimci-metin-16` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4437](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4437) |
| `--tema-yerel-lig-cizgi-13` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4438](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4438) |
| `--tema-yerel-lig-yardimci-metin-17` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4439](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4439) |
| `--tema-yerel-lig-ana-metin-11` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4440](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4440) |
| `--tema-yerel-lig-eylem-metin-09` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4441](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4441) |
| `--tema-yerel-lig-yardimci-metin-18` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4442](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4442) |
| `--tema-yerel-lig-ana-metin-12` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4443](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4443) |
| `--tema-yerel-lig-yardimci-metin-19` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4444](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4444) |
| `--tema-yerel-lig-yardimci-metin-20` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4445](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4445) |
| `--tema-yerel-lig-ana-metin-13` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4446](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4446) |
| `--tema-yerel-lig-cizgi-14` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4447](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4447) |
| `--tema-yerel-lig-cizgi-15` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4448](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4448) |
| `--tema-yerel-lig-secim-zemin-08` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4449](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4449) |
| `--tema-yerel-lig-cizgi-16` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4450](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4450) |
| `--tema-yerel-lig-odak-01` | `var(--tema-odak)` | [data-tema="yesil"] | [app/tema.css:4451](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4451) |
| `--tema-yerel-lig-ana-metin-14` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4452](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4452) |
| `--tema-yerel-lig-yardimci-metin-21` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4453](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4453) |
| `--tema-yerel-lig-yardimci-metin-22` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4454](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4454) |
| `--tema-yerel-lig-golge-03` | `rgba(53,85,69,0.1)` | [data-tema="yesil"] | [app/tema.css:4455](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4455) |
| `--tema-yerel-lig-yardimci-metin-23` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4456](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4456) |
| `--tema-yerel-lig-cizgi-17` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4457](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4457) |
| `--tema-yerel-lig-cizgi-18` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4458](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4458) |
| `--tema-yerel-lig-cizgi-19` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4459](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4459) |
| `--tema-yerel-lig-eylem-metin-10` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4460](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4460) |
| `--tema-yerel-lig-secim-zemin-09` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4461](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4461) |
| `--tema-yerel-lig-yardimci-metin-24` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4462](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4462) |
| `--tema-yerel-lig-yardimci-metin-25` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4463](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4463) |
| `--tema-yerel-lig-ana-metin-15` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4464](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4464) |
| `--tema-yerel-lig-yardimci-metin-26` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4465](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4465) |
| `--tema-yerel-lig-ana-metin-16` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4466](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4466) |
| `--tema-yerel-lig-yardimci-metin-27` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4467](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4467) |
| `--tema-yerel-lig-eylem-metin-11` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4468](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4468) |
| `--tema-yerel-lig-ana-metin-17` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4469](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4469) |
| `--tema-yerel-lig-ana-metin-18` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4470](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4470) |
| `--tema-yerel-lig-secim-zemin-10` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4471](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4471) |
| `--tema-yerel-lig-eylem-metin-12` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4472](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4472) |
| `--tema-yerel-lig-eylem-metin-13` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4473](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4473) |
| `--tema-yerel-lig-cizgi-20` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4474](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4474) |
| `--tema-yerel-lig-golge-04` | `rgba(53,85,69,0.04)` | [data-tema="yesil"] | [app/tema.css:4475](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4475) |
| `--tema-yerel-lig-ana-metin-19` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4476](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4476) |
| `--tema-yerel-lig-sayfa-zemini-13` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4477](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4477) |
| `--tema-yerel-lig-cizgi-21` | `color-mix(in srgb, var(--tema-cizgi) 20%, transparent)` | [data-tema="yesil"] | [app/tema.css:4478](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4478) |
| `--tema-yerel-lig-golge-05` | `rgba(53,85,69,0.06)` | [data-tema="yesil"] | [app/tema.css:4479](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4479) |
| `--tema-yerel-lig-golge-07` | `rgba(53,85,69,0.18)` | [data-tema="yesil"] | [app/tema.css:4480](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4480) |
| `--tema-yerel-lig-eylem-zemin-04` | `color-mix(in srgb, var(--tema-eylem) 50%, transparent)` | [data-tema="yesil"] | [app/tema.css:4481](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4481) |
| `--tema-yerel-lig-yardimci-metin-28` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4482](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4482) |
| `--tema-yerel-lig-yardimci-metin-29` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4483](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4483) |
| `--tema-yerel-ortak-sayfa-cizgi-11` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4484](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4484) |
| `--tema-yerel-ortak-sayfa-eylem-zemin-05` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4485](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4485) |
| `--tema-yerel-ortak-sayfa-eylem-zemin-06` | `var(--tema-eylem-hover)` | [data-tema="yesil"] | [app/tema.css:4486](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4486) |
| `--tema-yerel-ortak-sayfa-eylem-zemin-07` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4487](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4487) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-15` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4488](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4488) |
| `--tema-yerel-ortak-sayfa-ana-metin-14` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4489](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4489) |
| `--tema-yerel-ortak-sayfa-ana-metin-15` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4490](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4490) |
| `--tema-yerel-ortak-sayfa-eylem-metin-06` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4491](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4491) |
| `--tema-yerel-ortak-sayfa-odak-02` | `var(--tema-odak)` | [data-tema="yesil"] | [app/tema.css:4492](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4492) |
| `--tema-yerel-ortak-sayfa-odak-03` | `var(--tema-odak)` | [data-tema="yesil"] | [app/tema.css:4493](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4493) |
| `--tema-yerel-ortak-sayfa-eylem-zemin-08` | `var(--tema-eylem-hover)` | [data-tema="yesil"] | [app/tema.css:4494](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4494) |
| `--tema-yerel-ortak-sayfa-eylem-metin-07` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4495](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4495) |
| `--tema-yerel-ortak-sayfa-eylem-zemin-09` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4496](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4496) |
| `--tema-yerel-ortak-sayfa-ana-metin-16` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4497](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4497) |
| `--tema-yerel-ortak-sayfa-golge-04` | `rgba(53,85,69,0.03137254901960784)` | [data-tema="yesil"] | [app/tema.css:4498](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4498) |
| `--tema-yerel-ortak-sayfa-golge-05` | `rgba(53,85,69,0.03529411764705882)` | [data-tema="yesil"] | [app/tema.css:4499](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4499) |
| `--tema-yerel-rapor-golge-14` | `rgba(53,85,69,0.05)` | [data-tema="yesil"] | [app/tema.css:4500](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4500) |
| `--tema-yerel-rapor-yardimci-metin-61` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4501](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4501) |
| `--tema-yerel-rapor-cizgi-42` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4502](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4502) |
| `--tema-yerel-rapor-cizgi-43` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4503](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4503) |
| `--tema-yerel-rapor-yardimci-metin-62` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4504](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4504) |
| `--tema-yerel-rapor-ana-metin-19` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4505](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4505) |
| `--tema-yerel-rapor-sayfa-zemini-28` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4506](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4506) |
| `--tema-yerel-rapor-yardimci-metin-63` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4507](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4507) |
| `--tema-yerel-rapor-golge-15` | `rgba(53,85,69,0.06)` | [data-tema="yesil"] | [app/tema.css:4508](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4508) |
| `--tema-yerel-rapor-ana-metin-20` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4509](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4509) |
| `--tema-yerel-rapor-cizgi-44` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4510](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4510) |
| `--tema-yerel-rapor-yardimci-metin-64` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4511](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4511) |
| `--tema-yerel-rapor-yardimci-metin-65` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4512](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4512) |
| `--tema-yerel-rapor-cizgi-45` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4513](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4513) |
| `--tema-yerel-rapor-secim-zemin-14` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4514](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4514) |
| `--tema-yerel-rapor-ana-metin-21` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4515](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4515) |
| `--tema-yerel-rapor-yardimci-metin-66` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4516](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4516) |
| `--tema-yerel-rapor-ana-metin-22` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4517](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4517) |
| `--tema-yerel-rapor-secim-zemin-15` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4518](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4518) |
| `--tema-yerel-rapor-cizgi-46` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4519](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4519) |
| `--tema-yerel-rapor-cizgi-47` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4520](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4520) |
| `--tema-yerel-rapor-yardimci-metin-67` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4521](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4521) |
| `--tema-yerel-rapor-eylem-metin-13` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4522](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4522) |
| `--tema-yerel-rapor-secim-zemin-16` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4523](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4523) |
| `--tema-yerel-rapor-eylem-zemin-04` | `color-mix(in srgb, var(--tema-eylem) 12%, transparent)` | [data-tema="yesil"] | [app/tema.css:4524](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4524) |
| `--tema-yerel-rapor-eylem-metin-14` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4525](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4525) |
| `--tema-yerel-rapor-ana-metin-23` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4526](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4526) |
| `--tema-yerel-rapor-yardimci-metin-68` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4527](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4527) |
| `--tema-yerel-uretim-ana-metin-29` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4528](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4528) |
| `--tema-yerel-uretim-yardimci-metin-42` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4529](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4529) |
| `--tema-yerel-uretim-cizgi-51` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4530](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4530) |
| `--tema-yerel-uretim-cizgi-52` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4531](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4531) |
| `--tema-yerel-uretim-secim-zemin-18` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4532](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4532) |
| `--tema-yerel-uretim-eylem-metin-19` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4533](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4533) |
| `--tema-yerel-uretim-odak-03` | `var(--tema-odak)` | [data-tema="yesil"] | [app/tema.css:4534](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4534) |
| `--tema-yerel-uretim-cizgi-53` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4535](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4535) |
| `--tema-yerel-uretim-yardimci-metin-43` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4536](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4536) |
| `--tema-yerel-uretim-cizgi-54` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4537](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4537) |
| `--tema-yerel-uretim-eylem-zemin-12` | `var(--tema-eylem-hover)` | [data-tema="yesil"] | [app/tema.css:4538](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4538) |
| `--tema-yerel-magaza-yardimci-metin-25` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4539](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4539) |
| `--tema-yerel-magaza-sayfa-zemini-13` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4540](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4540) |
| `--tema-yerel-magaza-ana-metin-10` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4541](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4541) |
| `--tema-yerel-magaza-odak-01` | `var(--tema-odak)` | [data-tema="yesil"] | [app/tema.css:4542](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4542) |
| `--tema-yerel-magaza-ana-metin-11` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4543](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4543) |
| `--tema-yerel-uretim-vurgu-golge-01` | `var(--tema-vurgu)` | [data-tema="yesil"] | [app/tema.css:4544](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4544) |
| `--tema-yerel-ortak-sayfa-eylem-metin-08` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4545](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4545) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-16` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4546](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4546) |
| `--tema-yerel-ortak-sayfa-eylem-metin-09` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4547](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4547) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-17` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4548](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4548) |
| `--tema-yerel-ortak-sayfa-eylem-zemin-10` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4549](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4549) |
| `--tema-yerel-ortak-sayfa-golge-06` | `rgba(53,85,69,0.3)` | [data-tema="yesil"] | [app/tema.css:4550](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4550) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-18` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4551](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4551) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-19` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4552](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4552) |
| `--tema-yerel-ortak-sayfa-secim-zemin-07` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4553](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4553) |
| `--tema-yerel-ortak-sayfa-eylem-zemin-11` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4554](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4554) |
| `--tema-yerel-ortak-sayfa-golge-07` | `rgba(53,85,69,0.22)` | [data-tema="yesil"] | [app/tema.css:4555](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4555) |
| `--tema-yerel-ortak-sayfa-cizgi-12` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4556](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4556) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-20` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4557](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4557) |
| `--tema-yerel-ortak-sayfa-sayfa-zemini-09` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4558](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4558) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-21` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4559](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4559) |
| `--tema-yerel-ortak-sayfa-sayfa-zemini-10` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4560](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4560) |
| `--tema-yerel-ortak-sayfa-cizgi-13` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4561](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4561) |
| `--tema-yerel-ortak-sayfa-odak-04` | `var(--tema-odak)` | [data-tema="yesil"] | [app/tema.css:4562](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4562) |
| `--tema-yerel-ortak-sayfa-cizgi-14` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4563](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4563) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-22` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4564](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4564) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-23` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4565](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4565) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-24` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4566](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4566) |
| `--tema-yerel-ortak-sayfa-cizgi-15` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4567](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4567) |
| `--tema-yerel-ortak-sayfa-cizgi-16` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4568](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4568) |
| `--tema-yerel-ortak-sayfa-secim-zemin-08` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4569](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4569) |
| `--tema-yerel-ortak-sayfa-cizgi-17` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4570](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4570) |
| `--tema-yerel-ortak-sayfa-sayfa-zemini-11` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4571](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4571) |
| `--tema-yerel-ortak-sayfa-cizgi-18` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4572](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4572) |
| `--tema-yerel-ortak-sayfa-ana-metin-17` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4573](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4573) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-25` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4574](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4574) |
| `--tema-yerel-ortak-sayfa-cizgi-19` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4575](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4575) |
| `--tema-yerel-ortak-sayfa-sayfa-zemini-12` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4576](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4576) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-26` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4577](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4577) |
| `--tema-yerel-ortak-sayfa-sayfa-zemini-13` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4578](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4578) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-27` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4579](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4579) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-28` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4580](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4580) |
| `--tema-yerel-ortak-sayfa-cizgi-20` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4581](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4581) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-29` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4582](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4582) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-30` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4583](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4583) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-31` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4584](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4584) |
| `--tema-yerel-ortak-sayfa-sayfa-zemini-14` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4585](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4585) |
| `--tema-yerel-ortak-sayfa-odak-05` | `var(--tema-odak)` | [data-tema="yesil"] | [app/tema.css:4586](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4586) |
| `--tema-yerel-ortak-sayfa-eylem-metin-10` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4587](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4587) |
| `--tema-yerel-ortak-sayfa-yardimci-metin-32` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4588](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4588) |
| `--tema-yerel-uretim-sayfa-zemini-25` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4589](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4589) |
| `--tema-yerel-uretim-ana-metin-30` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4590](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4590) |
| `--tema-yerel-yonetim-yardimci-metin-08` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4591](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4591) |
| `--tema-yerel-yonetim-vurgu-zemin-02` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4592](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4592) |
| `--tema-yerel-yonetim-vurgu-cizgi-02` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4593](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4593) |
| `--tema-yerel-rapor-yardimci-metin-69` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4594](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4594) |
| `--tema-yerel-rapor-ana-metin-24` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4595](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4595) |
| `--tema-yerel-rapor-sayfa-zemini-29` | `var(--tema-zemin)` | [data-tema="yesil"] | [app/tema.css:4596](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4596) |
| `--tema-yerel-giris-hata-metni` | `#bc2d0d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4602](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4602) |
| `--tema-yerel-yonetim-hata-vurgu` | `#bc2d0d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4609](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4609) |
| `--tema-yerel-lig-sira-altin` | `#f59e0b` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4610](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4610) |
| `--tema-yerel-lig-sira-gumus` | `#9ca3af` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4611](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4611) |
| `--tema-yerel-lig-sira-bronz` | `#b45309` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4612](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4612) |
| `--tema-yerel-lig-sira-diger` | `#e5e7eb` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4613](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4613) |
| `--tema-yerel-rapor-puan-ortalama-alti` | `#bc2d0d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4620](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4620) |
| `--tema-yerel-rapor-puan-ortalama-ustu` | `#56aeff` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4621](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4621) |
| `--tema-rehber-eylem` | `var(--color-blue-600)` | :root, [data-tema="mavi"] | [app/tema.css:4627](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4627) |
| `--tema-rehber-eylem-hover` | `var(--color-blue-800)` | :root, [data-tema="mavi"] | [app/tema.css:4628](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4628) |
| `--tema-rehber-vurgu-zemin` | `var(--color-blue-50)` | :root, [data-tema="mavi"] | [app/tema.css:4629](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4629) |
| `--tema-rehber-hover-zemin` | `var(--color-blue-100)` | :root, [data-tema="mavi"] | [app/tema.css:4630](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4630) |
| `--tema-rehber-vurgu-cizgi` | `var(--color-blue-200)` | :root, [data-tema="mavi"] | [app/tema.css:4631](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4631) |
| `--tema-rehber-ters-metin` | `var(--color-white)` | :root, [data-tema="mavi"] | [app/tema.css:4632](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4632) |
| `--tema-rehber-vurgu` | `#bc2d0d` | :root, [data-tema="mavi"] | [app/tema.css:4633](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4633) |
| `--tema-rehber-vurgu-hover` | `#991b1b` | :root, [data-tema="mavi"] | [app/tema.css:4634](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4634) |
| `--tema-rehber-yuzey` | `var(--color-white)` | :root, [data-tema="mavi"] | [app/tema.css:4635](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4635) |
| `--tema-rehber-cizgi` | `var(--color-gray-200)` | :root, [data-tema="mavi"] | [app/tema.css:4636](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4636) |
| `--tema-rehber-ic-cizgi` | `var(--color-gray-100)` | :root, [data-tema="mavi"] | [app/tema.css:4637](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4637) |
| `--tema-rehber-soluk-metin` | `var(--color-gray-400)` | :root, [data-tema="mavi"] | [app/tema.css:4638](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4638) |
| `--tema-rehber-kontrol-metin` | `var(--color-gray-700)` | :root, [data-tema="mavi"] | [app/tema.css:4639](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4639) |
| `--tema-rehber-notr-hover` | `var(--color-gray-100)` | :root, [data-tema="mavi"] | [app/tema.css:4640](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4640) |
| `--tema-rehber-baslik` | `var(--color-gray-900)` | :root, [data-tema="mavi"] | [app/tema.css:4641](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4641) |
| `--tema-rehber-ikincil-metin` | `var(--color-gray-500)` | :root, [data-tema="mavi"] | [app/tema.css:4642](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4642) |
| `--tema-rehber-notr-zemin` | `var(--color-gray-50)` | :root, [data-tema="mavi"] | [app/tema.css:4643](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4643) |
| `--tema-rehber-metin` | `var(--color-gray-600)` | :root, [data-tema="mavi"] | [app/tema.css:4644](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4644) |
| `--tema-rehber-eylem` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4647](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4647) |
| `--tema-rehber-eylem-hover` | `var(--tema-eylem-hover)` | [data-tema="yesil"] | [app/tema.css:4648](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4648) |
| `--tema-rehber-vurgu-zemin` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4649](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4649) |
| `--tema-rehber-hover-zemin` | `var(--tema-secili)` | [data-tema="yesil"] | [app/tema.css:4650](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4650) |
| `--tema-rehber-vurgu-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4651](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4651) |
| `--tema-rehber-ters-metin` | `var(--tema-eylem-metin)` | [data-tema="yesil"] | [app/tema.css:4652](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4652) |
| `--tema-rehber-vurgu` | `var(--tema-vurgu)` | [data-tema="yesil"] | [app/tema.css:4653](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4653) |
| `--tema-rehber-vurgu-hover` | `var(--tema-eylem-hover)` | [data-tema="yesil"] | [app/tema.css:4654](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4654) |
| `--tema-rehber-yuzey` | `var(--tema-modal-zemini)` | [data-tema="yesil"] | [app/tema.css:4655](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4655) |
| `--tema-rehber-cizgi` | `var(--tema-modal-cizgisi)` | [data-tema="yesil"] | [app/tema.css:4656](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4656) |
| `--tema-rehber-ic-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4657](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4657) |
| `--tema-rehber-soluk-metin` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4658](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4658) |
| `--tema-rehber-kontrol-metin` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4659](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4659) |
| `--tema-rehber-notr-hover` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4660](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4660) |
| `--tema-rehber-baslik` | `var(--tema-baslik)` | [data-tema="yesil"] | [app/tema.css:4661](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4661) |
| `--tema-rehber-ikincil-metin` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4662](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4662) |
| `--tema-rehber-notr-zemin` | `var(--tema-yuzey)` | [data-tema="yesil"] | [app/tema.css:4663](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4663) |
| `--tema-rehber-metin` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4664](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4664) |
| `--tema-rehber-ipucu-zemin` | `var(--color-amber-50)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4669](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4669) |
| `--tema-rehber-ipucu-cizgi` | `var(--color-amber-200)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4670](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4670) |
| `--tema-rehber-ipucu-metin` | `var(--color-amber-900)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4671](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4671) |
| `--tema-rehber-ipucu-ikon` | `var(--color-amber-600)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4672](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4672) |
| `--tema-rehber-ipucu-baslik` | `var(--color-amber-950)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4673](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4673) |
| `--tema-rehber-golge` | `0 20px 35px -10px rgba(0, 0, 0, 0.22), 0 2px 8px rgba(0, 0, 0, 0.08)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4679](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4679) |
| `--tema-uretim-ozet-devam-vurgu` | `#2563eb` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4686](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4686) |
| `--tema-uretim-ozet-bekleyen-vurgu` | `#c2410c` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4687](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4687) |
| `--tema-uretim-ozet-ureticide-vurgu` | `#7c3aed` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4688](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4688) |
| `--tema-uretim-ozet-planlanan-vurgu` | `#047857` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4689](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4689) |
| `--tema-tanbur-yazi-golge-secili` | `0 0 2px #ffffff, 0 0 5px #ffffff, 0 0 12px rgba(255,255,255,0.95), 0 0 22px rgba(255,255,255,0.85)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4703](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4703) |
| `--tema-tanbur-yazi-golge-yakin` | `0 0 3px #ffffff, 0 0 8px rgba(255,255,255,0.85)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4704](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4704) |
| `--tema-tanbur-yazi-golge-uzak` | `0 0 2px rgba(255,255,255,0.7)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4705](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4705) |
| `--tema-yerel-lig-dekoratif-zemin-03` | `#171b22` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4712](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4712) |
| `--tema-yerel-lig-dekoratif-zemin-04` | `#10151c` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4713](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4713) |
| `--tema-yerel-eclub-eylem-zemin-05` | `#082c69` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4714](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4714) |
| `--tema-yerel-eclub-dekoratif-zemin-02` | `#02112d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4715](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4715) |
| `--tema-yerel-eclub-dekoratif-zemin-03` | `#05285c` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4716](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4716) |
| `--tema-yerel-eclub-dekoratif-zemin-04` | `#2c66ad` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4717](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4717) |
| `--tema-yerel-eclub-dekoratif-zemin-05` | `#08377c` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4718](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4718) |
| `--tema-yerel-eclub-dekoratif-zemin-06` | `#031434` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4719](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4719) |
| `--tema-yerel-eclub-dekoratif-zemin-07` | `#062253` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4720](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4720) |
| `--tema-yerel-eclub-dekoratif-zemin-08` | `#4776b8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4721](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4721) |
| `--tema-yerel-eclub-dekoratif-zemin-09` | `#083272` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4722](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4722) |
| `--tema-yerel-eclub-dekoratif-zemin-10` | `rgba(0, 10, 42, 0.46)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4723](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4723) |
| `--tema-yerel-eclub-dekoratif-zemin-11` | `rgba(0, 12, 47, 0.42)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4724](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4724) |
| `--tema-yerel-eclub-golge-08` | `rgba(0, 9, 38, 0.36)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4725](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4725) |
| `--tema-cizim-madalya-donem-zemin` | `linear-gradient(140deg, #03142f 0%, #07549c 30%, #163f78 50%, #0862b0 70%, #020d21 100%)` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4726](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4726) |
| `--tema-yayin-kart` | `#fff` | :root, [data-tema="mavi"] | [app/tema.css:4733](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4733) |
| `--tema-yayin-metin` | `#263b55` | :root, [data-tema="mavi"] | [app/tema.css:4734](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4734) |
| `--tema-yayin-varyant-yardimci` | `#74859c` | :root, [data-tema="mavi"] | [app/tema.css:4735](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4735) |
| `--tema-yayin-varyant-cizgi` | `#e3eaf2` | :root, [data-tema="mavi"] | [app/tema.css:4736](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4736) |
| `--tema-yayin-varyant-iz` | `#eef2f7` | :root, [data-tema="mavi"] | [app/tema.css:4737](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4737) |
| `--tema-yayin-konu-yardimci` | `#72849a` | :root, [data-tema="mavi"] | [app/tema.css:4738](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4738) |
| `--tema-yayin-konu-cizgi` | `#e5ebf3` | :root, [data-tema="mavi"] | [app/tema.css:4739](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4739) |
| `--tema-yayin-konu-zemin` | `#f5f8fc` | :root, [data-tema="mavi"] | [app/tema.css:4740](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4740) |
| `--tema-yayin-konu-vurgu` | `#438fc2` | :root, [data-tema="mavi"] | [app/tema.css:4741](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4741) |
| `--tema-yayin-arac-metin` | `#1c3049` | :root, [data-tema="mavi"] | [app/tema.css:4742](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4742) |
| `--tema-yayin-arac-yardimci` | `#708199` | :root, [data-tema="mavi"] | [app/tema.css:4743](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4743) |
| `--tema-yayin-arac-cizgi` | `#e6ebf1` | :root, [data-tema="mavi"] | [app/tema.css:4744](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4744) |
| `--tema-yayin-arac-zemin` | `#f3f6fa` | :root, [data-tema="mavi"] | [app/tema.css:4745](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4745) |
| `--tema-yayin-kart` | `var(--tema-yuzey)` | [data-tema="yesil"] | [app/tema.css:4748](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4748) |
| `--tema-yayin-metin` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4749](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4749) |
| `--tema-yayin-varyant-yardimci` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4750](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4750) |
| `--tema-yayin-varyant-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4751](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4751) |
| `--tema-yayin-varyant-iz` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4752](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4752) |
| `--tema-yayin-konu-yardimci` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4753](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4753) |
| `--tema-yayin-konu-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4754](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4754) |
| `--tema-yayin-konu-zemin` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4755](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4755) |
| `--tema-yayin-konu-vurgu` | `var(--tema-eylem)` | [data-tema="yesil"] | [app/tema.css:4756](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4756) |
| `--tema-yayin-arac-metin` | `var(--tema-metin)` | [data-tema="yesil"] | [app/tema.css:4757](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4757) |
| `--tema-yayin-arac-yardimci` | `var(--tema-ikincil-metin)` | [data-tema="yesil"] | [app/tema.css:4758](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4758) |
| `--tema-yayin-arac-cizgi` | `var(--tema-cizgi)` | [data-tema="yesil"] | [app/tema.css:4759](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4759) |
| `--tema-yayin-arac-zemin` | `var(--tema-bilgi-zemini)` | [data-tema="yesil"] | [app/tema.css:4760](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4760) |
| `--tema-yayin-varyant-v1` | `#348bc9` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4766](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4766) |
| `--tema-yayin-varyant-v2` | `#8c72d5` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4767](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4767) |
| `--tema-yayin-varyant-v3` | `#389b7d` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4768](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4768) |
| `--tema-yayin-varyant-v4` | `#cf9440` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4769](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4769) |
| `--tema-yayin-kazanim` | `#29896c` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4770](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4770) |
| `--tema-yayin-konu-kayip` | `#cd6661` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4771](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4771) |
| `--tema-yayin-video-vurgu` | `#dd6566` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4772](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4772) |
| `--tema-yayin-podcast-vurgu` | `#8d74c8` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4773](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4773) |
| `--tema-yayin-brosur-vurgu` | `#498faf` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4774](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4774) |
| `--tema-yayin-literatur-vurgu` | `#bc9453` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4775](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4775) |
| `--tema-yayin-arac-kayip` | `#c15b57` | :root, [data-tema="mavi"], [data-tema="yesil"] | [app/tema.css:4776](/Users/iskendereser/Desktop/cogniti-dev/app/tema.css:4776) |
| `--eclub-cetvel-yuksekligi` | `365px` | .chartWrap | [components/eclub/eclub-performans.module.css:49](/Users/iskendereser/Desktop/cogniti-dev/components/eclub/eclub-performans.module.css:49) |
| `--eclub-cetvel-yuksekligi` | `355px` | .chartWrap | [components/eclub/eclub-performans.module.css:74](/Users/iskendereser/Desktop/cogniti-dev/components/eclub/eclub-performans.module.css:74) |
| `--surface` | `var(--tema-kontrol-yuzey)` | .trigger, .menu, .capsule, .tabs, .field, .date | [components/kontrol/sade-kontroller.module.css:2](/Users/iskendereser/Desktop/cogniti-dev/components/kontrol/sade-kontroller.module.css:2) |
| `--text` | `var(--tema-kontrol-metin)` | .trigger, .menu, .capsule, .tabs, .field, .date | [components/kontrol/sade-kontroller.module.css:3](/Users/iskendereser/Desktop/cogniti-dev/components/kontrol/sade-kontroller.module.css:3) |
| `--muted` | `var(--tema-kontrol-ikincil-metin)` | .trigger, .menu, .capsule, .tabs, .field, .date | [components/kontrol/sade-kontroller.module.css:4](/Users/iskendereser/Desktop/cogniti-dev/components/kontrol/sade-kontroller.module.css:4) |
| `--line` | `var(--tema-kontrol-cizgi)` | .trigger, .menu, .capsule, .tabs, .field, .date | [components/kontrol/sade-kontroller.module.css:5](/Users/iskendereser/Desktop/cogniti-dev/components/kontrol/sade-kontroller.module.css:5) |
| `--blue` | `var(--tema-kontrol-eylem)` | .trigger, .menu, .capsule, .tabs, .field, .date | [components/kontrol/sade-kontroller.module.css:6](/Users/iskendereser/Desktop/cogniti-dev/components/kontrol/sade-kontroller.module.css:6) |
| `--hover` | `var(--tema-kontrol-hover)` | .trigger, .menu, .capsule, .tabs, .field, .date | [components/kontrol/sade-kontroller.module.css:7](/Users/iskendereser/Desktop/cogniti-dev/components/kontrol/sade-kontroller.module.css:7) |
| `--selection-height` | `40px` | .trigger, .menu, .capsule, .tabs, .field, .date | [components/kontrol/sade-kontroller.module.css:8](/Users/iskendereser/Desktop/cogniti-dev/components/kontrol/sade-kontroller.module.css:8) |
| `--yapka-paper` | `var(--tema-yayin-kart)` | .grid | [components/raporlar/OgrenmeAraciPerformansi.module.css:2](/Users/iskendereser/Desktop/cogniti-dev/components/raporlar/OgrenmeAraciPerformansi.module.css:2) |
| `--yapka-ink` | `var(--tema-yayin-arac-metin)` | .grid | [components/raporlar/OgrenmeAraciPerformansi.module.css:3](/Users/iskendereser/Desktop/cogniti-dev/components/raporlar/OgrenmeAraciPerformansi.module.css:3) |
| `--yapka-muted` | `var(--tema-yayin-arac-yardimci)` | .grid | [components/raporlar/OgrenmeAraciPerformansi.module.css:4](/Users/iskendereser/Desktop/cogniti-dev/components/raporlar/OgrenmeAraciPerformansi.module.css:4) |
| `--yapka-line` | `var(--tema-yayin-arac-cizgi)` | .grid | [components/raporlar/OgrenmeAraciPerformansi.module.css:5](/Users/iskendereser/Desktop/cogniti-dev/components/raporlar/OgrenmeAraciPerformansi.module.css:5) |
| `--yapka-soft` | `var(--tema-yayin-arac-zemin)` | .grid | [components/raporlar/OgrenmeAraciPerformansi.module.css:6](/Users/iskendereser/Desktop/cogniti-dev/components/raporlar/OgrenmeAraciPerformansi.module.css:6) |
| `--yapka-accent` | `var(--tema-yayin-video-vurgu)` | .video | [components/raporlar/OgrenmeAraciPerformansi.module.css:17](/Users/iskendereser/Desktop/cogniti-dev/components/raporlar/OgrenmeAraciPerformansi.module.css:17) |
| `--yapka-accent` | `var(--tema-yayin-podcast-vurgu)` | .podcast | [components/raporlar/OgrenmeAraciPerformansi.module.css:18](/Users/iskendereser/Desktop/cogniti-dev/components/raporlar/OgrenmeAraciPerformansi.module.css:18) |
| `--yapka-accent` | `var(--tema-yayin-brosur-vurgu)` | .gorsel | [components/raporlar/OgrenmeAraciPerformansi.module.css:19](/Users/iskendereser/Desktop/cogniti-dev/components/raporlar/OgrenmeAraciPerformansi.module.css:19) |
| `--yapka-accent` | `var(--tema-yayin-literatur-vurgu)` | .flip_pdf | [components/raporlar/OgrenmeAraciPerformansi.module.css:20](/Users/iskendereser/Desktop/cogniti-dev/components/raporlar/OgrenmeAraciPerformansi.module.css:20) |
| `--konu-paper` | `var(--tema-yayin-kart)` | .card | [components/raporlar/YayinKonuPerformansi.module.css:2](/Users/iskendereser/Desktop/cogniti-dev/components/raporlar/YayinKonuPerformansi.module.css:2) |
| `--konu-ink` | `var(--tema-yayin-metin)` | .card | [components/raporlar/YayinKonuPerformansi.module.css:3](/Users/iskendereser/Desktop/cogniti-dev/components/raporlar/YayinKonuPerformansi.module.css:3) |
| `--konu-muted` | `var(--tema-yayin-konu-yardimci)` | .card | [components/raporlar/YayinKonuPerformansi.module.css:4](/Users/iskendereser/Desktop/cogniti-dev/components/raporlar/YayinKonuPerformansi.module.css:4) |
| `--konu-line` | `var(--tema-yayin-konu-cizgi)` | .card | [components/raporlar/YayinKonuPerformansi.module.css:5](/Users/iskendereser/Desktop/cogniti-dev/components/raporlar/YayinKonuPerformansi.module.css:5) |
| `--konu-soft` | `var(--tema-yayin-konu-zemin)` | .card | [components/raporlar/YayinKonuPerformansi.module.css:6](/Users/iskendereser/Desktop/cogniti-dev/components/raporlar/YayinKonuPerformansi.module.css:6) |
| `--konu-blue` | `var(--tema-yayin-konu-vurgu)` | .card | [components/raporlar/YayinKonuPerformansi.module.css:7](/Users/iskendereser/Desktop/cogniti-dev/components/raporlar/YayinKonuPerformansi.module.css:7) |
| `--konu-green` | `var(--tema-yayin-kazanim)` | .card | [components/raporlar/YayinKonuPerformansi.module.css:8](/Users/iskendereser/Desktop/cogniti-dev/components/raporlar/YayinKonuPerformansi.module.css:8) |
| `--konu-red` | `var(--tema-yayin-konu-kayip)` | .card | [components/raporlar/YayinKonuPerformansi.module.css:9](/Users/iskendereser/Desktop/cogniti-dev/components/raporlar/YayinKonuPerformansi.module.css:9) |
| `--anahtar-renk` | `var(--tema-secici-dolgu)` | .mavi, .yesil | [components/tema/tema-secici.module.css:47](/Users/iskendereser/Desktop/cogniti-dev/components/tema/tema-secici.module.css:47) |
