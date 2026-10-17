import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import ts from "typescript";
import postcss from "postcss";

// Salt okunur kaynak taraması; yalnız docs/renk-envanteri çıktıları yazılır.
const kok = process.cwd();
const cikti = path.join(kok, "docs/renk-envanteri");
const dosyalar = execFileSync("rg", ["--files", "--hidden", "-g", "!node_modules", "-g", "!.git", "-g", "!.next", "-g", "!*.tsbuildinfo", "-g", "!package-lock.json"], { encoding: "utf8" }).trim().split("\n").sort();
const uzanti = /\.(?:[cm]?[jt]sx?|css|scss|sass|less|svg|html|json|sql)$/i;
const kendi = "scripts/denetim/renk-envanteri.mjs";
const kaynaklar = dosyalar.filter((p) => uzanti.test(p) && p !== kendi && !p.startsWith("docs/renk-envanteri/") && !p.startsWith("tests/") && (!p.startsWith("docs/") || p.endsWith(".html")));
const kapsam = (p) => /^(app\/(renk-demo|rehber-demo)\/|components\/rehber\/|lib\/tema\/|app\/tema\.css)/.test(p) ? "Tema ve rehber çalışması" : /^docs\//.test(p) ? "Tasarım prototipi" : /^(scripts|tools|infra)\//.test(p) || !/^(app|components|lib|hooks|public|types)\//.test(p) ? "Destek ve altyapı" : "Uygulama kaynağı";
const alan = (p) => /eclub|Eclub|EClub/.test(p) ? "E-Club" : /eczanem|Eczanem/.test(p) ? "Eczanem" : /cclub|cc-ligi|challenge|CcLigi|CcChallenge/.test(p) ? "C-Club" : /tclub|TClub/.test(p) ? "T-Club" : /hbstore|store|siparis/.test(p) ? "Mağaza ve sipariş" : /rapor|Rapor|Grafik|grafik/.test(p) ? "Rapor ve grafik" : /rehber|renk-demo|tema/.test(p) ? "Tema ve rehber" : /ogrenme|yayin|video|tuketim|uretim|talep/i.test(p) ? "Yayın ve öğrenme araçları" : /panel|Navbar|navigasyon|ana-sayfa/.test(p) ? "Ortak kabuk ve ana sayfa" : /admin/.test(p) ? "Yönetim" : "Diğer ortak ve sayfa";
const renkOzelligi = /^(?:color|background(?:Color|Image)?|border(?:Color|Top|Bottom|Left|Right|Block|Inline|TopColor|BottomColor|LeftColor|RightColor)?|outline(?:Color)?|boxShadow|textShadow|fill|stroke|stopColor|floodColor|lightingColor|strokeStyle|fillStyle|shadowColor|itemStyle|areaStyle|lineStyle|axisLine|axisLabel|accentColor|caretColor|textDecorationColor|renk|zemin|arka|kenar|bg|textColor|borderColor|background-color|background-image|border.*color|box-shadow|text-shadow|stop-color|flood-color|lighting-color|outline-color|accent-color|caret-color|text-decoration-color|filter)$/i;
const adlar = new Set(["white", "black", "red", "green", "blue", "gray", "grey", "yellow", "orange", "purple", "pink", "gold", "silver", "navy", "teal", "cyan", "magenta", "lime", "maroon", "olive", "aqua", "fuchsia", "rebeccapurple", "whitesmoke", "lightgray", "lightgrey", "darkgray", "darkgrey", "darkred", "darkgreen", "darkblue", "lightblue", "lightgreen", "transparent", "currentcolor", "inherit", "initial", "unset", "revert", "none"]);
const cssTipleri = fs.readFileSync("node_modules/csstype/index.d.ts", "utf8");
for (const m of (cssTipleri.match(/type NamedColor =([\s\S]*?);/)?.[1] ?? "").matchAll(/"([a-z]+)"/g)) adlar.add(m[1]);
const satirlar = [];
const dosyaOzetleri = [];
const hatalar = [];
const goruldu = new Set();
const metinler = new Map();
const degiskenler = [];
const pillAdaylari = [];
const twDegiskenleri = new Map();
const twDosya = "node_modules/tailwindcss/theme.css";
const twCss = fs.readFileSync(twDosya, "utf8");
postcss.parse(twCss).walkDecls((d) => twDegiskenleri.set(d.prop, { deger: d.value, dosya: twDosya, satir: d.source.start.line }));

function yer(metin, pos) {
  const once = metin.slice(0, pos);
  const satir = (once.match(/\n/g) || []).length + 1;
  const sutun = pos - once.lastIndexOf("\n");
  const bas = metin.lastIndexOf("\n", pos - 1) + 1;
  let son = metin.indexOf("\n", pos);
  if (son < 0) son = metin.length;
  const baslangic = Math.max(bas, pos - 90);
  return { satir, sutun, baglam: (baslangic > bas ? "…" : "") + metin.slice(baslangic, Math.min(son, pos + 210)).trim() + (son > pos + 210 ? "…" : "") };
}

function kategori(ozellik, ham) {
  const p = ozellik.toLowerCase();
  if (/shadow|golge/.test(p)) return "Gölge";
  if (/opacity/.test(p)) return "Saydamlık";
  if (/fill|stroke|stopcolor|stop-color|flood|lighting/.test(p)) return "SVG, ikon ve çizim";
  if (/outline|ring/.test(p)) return "Odak ve halka";
  if (/border|divide|kenar/.test(p)) return "Kenar ve ayırıcı çizgi";
  if (/background|zemin|arka|^bg$/.test(p)) return "Zemin ve yüzey";
  if (/color|text|renk/.test(p)) return "Metin ve renk";
  if (/gradient/.test(ham)) return "Gradyan";
  return "Renk tanımı veya referansı";
}

function ekle(dosya, pos, tur, ham, ozellik = "", ek = {}) {
  const anahtar = [dosya, pos, tur, ham, ozellik].join("\u0000");
  if (goruldu.has(anahtar)) return;
  goruldu.add(anahtar);
  const konum = yer(metinler.get(dosya), pos);
  let deger = ham;
  if (/^#[\da-f]{3,8}$/i.test(ham)) {
    deger = ham.toLowerCase();
    if (deger.length === 4 || deger.length === 5) deger = "#" + [...deger.slice(1)].map((c) => c + c).join("");
  }
  satirlar.push({ dosya, ...konum, ofset: pos, kapsam: kapsam(dosya), alan: alan(dosya), kategori: kategori(ozellik, ham), tur, ham, deger, ozellik, ...ek });
}

function dengeli(metin, baslangic) {
  let derinlik = 0;
  for (let i = baslangic; i < metin.length; i++) {
    if (metin[i] === "(") derinlik++;
    else if (metin[i] === ")" && --derinlik === 0) return i + 1;
  }
  return null;
}

function sinifCoz(sinif) {
  let sonIkiNokta = -1, derinlik = 0;
  for (let i = 0; i < sinif.length; i++) {
    if ("[(".includes(sinif[i])) derinlik++;
    else if ("])".includes(sinif[i])) derinlik--;
    else if (sinif[i] === ":" && derinlik === 0) sonIkiNokta = i;
  }
  const durum = sonIkiNokta >= 0 ? sinif.slice(0, sonIkiNokta + 1) : "normal";
  const taban = sinif.slice(sonIkiNokta + 1).replace(/^!|!$/g, "");
  if (taban === "animate-pulse") return { tur: "tailwind-gorunum-animasyonu", ozellik: "opacity", durum, css: "pulse: 50% karesinde opacity 0.5; Tailwind theme.css:457–461" };
  const ozel = taban.match(/^\[([a-z-]+):(.+)\]$/i);
  if (ozel && renkOzelligi.test(ozel[1])) return { tur: "tailwind-ozel-ozellik", ozellik: ozel[1], durum, css: ozel[2].replaceAll("_", " ") };
  if (/^(?:opacity|bg-opacity|text-opacity|border-opacity|ring-opacity|divide-opacity|placeholder-opacity)-/.test(taban)) return { tur: "tailwind-saydamlik", ozellik: "opacity", durum, css: taban.split("-").at(-1) + "%" };
  if (/^(?:grayscale|sepia|invert|saturate|brightness|contrast|hue-rotate|mix-blend|bg-blend)(?:-|$)/.test(taban)) return { tur: "goruntu-filtresi", ozellik: "filter", durum, css: taban };
  if (/^(?:bg-gradient-|bg-linear-|bg-radial|bg-conic)/.test(taban)) return { tur: "tailwind-gradyan", ozellik: "backgroundImage", durum, css: taban };
  if (/^(?:shadow|drop-shadow|inset-shadow|border|ring|outline)$/.test(taban)) {
    const tw = twDegiskenleri.get("--" + taban);
    return { tur: tw ? "tailwind-golge" : "tailwind-ortuk-renk", ozellik: /shadow/.test(taban) ? "boxShadow" : taban, durum, css: tw?.deger ?? "currentColor (başka sınıf/değer geçersiz kılabilir)", kaynak: tw };
  }
  const m = taban.match(/^(bg|text|border(?:-[trblxyse])?|divide(?:-[xy])?|ring(?:-offset)?|outline|fill|stroke|from|via|to|shadow|inset-shadow|drop-shadow|decoration|caret|accent|placeholder)-(.+)$/);
  if (!m) return null;
  let [, onek, renk] = m;
  let alpha = null;
  let b = 0;
  for (let i = 0; i < renk.length; i++) {
    if ("[(".includes(renk[i])) b++;
    else if ("])".includes(renk[i])) b--;
    else if (renk[i] === "/" && b === 0) { alpha = renk.slice(i + 1); renk = renk.slice(0, i); break; }
  }
  let css, kaynak;
  if (renk.startsWith("[") && renk.endsWith("]")) {
    const icerik = renk.slice(1, -1).replaceAll("_", " ");
    if (!/(?:#[a-f\d]{3}|(?:rgb|hsl|oklch|color-mix|var|gradient)\(|(?:^|:)transparent|(?:^|:)currentColor|(?:^|:)color:)/i.test(icerik) && !/shadow/.test(onek)) return null;
    css = icerik;
  } else if (renk.startsWith("(") && renk.endsWith(")")) css = "var" + renk;
  else if (adlar.has(renk.toLowerCase()) && !["initial", "unset", "revert"].includes(renk)) css = renk === "current" ? "currentColor" : renk;
  else if (renk === "current") css = "currentColor";
  else {
    kaynak = twDegiskenleri.get(`--${/shadow/.test(onek) ? onek : "color"}-${renk}`);
    if (kaynak) css = kaynak.deger;
    else if (degiskenler.some((d) => d.ad === `--color-${renk}`)) css = `var(--color-${renk})`;
    else return null;
  }
  return { tur: /shadow/.test(onek) ? "tailwind-golge" : "tailwind-renk", ozellik: onek, durum, css, alpha, kaynak };
}

function taraParca(dosya, metin, offset, ozellik = "", ek = {}, siniflar = true) {
  for (const m of metin.matchAll(/%23([a-f\d]{3,8})\b/gi)) {
    if ([3, 4, 6, 8].includes(m[1].length)) ekle(dosya, offset + m.index, "kodlanmis-svg-rengi", m[0], ozellik, { ...ek, cozum: "#" + m[1].toLowerCase() });
  }
  for (const m of metin.matchAll(/#[a-f\d]{3,8}\b/gi)) {
    if (![4, 5, 7, 9].includes(m[0].length)) continue;
    if (/url\([^)]*$/i.test(metin.slice(0, m.index)) || /^(?:href|id|clipPath|mask)$/i.test(ozellik)) continue;
    ekle(dosya, offset + m.index, "hex", m[0], ozellik, ek);
  }
  for (const m of metin.matchAll(/\b(rgb|rgba|hsl|hsla|hwb|oklch|oklab|lab|lch|color|color-mix|linear-gradient|radial-gradient|conic-gradient|repeating-linear-gradient|repeating-radial-gradient|var)\(/gi)) {
    const son = dengeli(metin, m.index + m[0].length - 1);
    if (son === null) continue;
    const ham = metin.slice(m.index, son);
    const fonksiyon = m[1].toLowerCase();
    if (fonksiyon === "var" && !renkOzelligi.test(ozellik) && !/renk|color|background|foreground|primary|secondary|border|ring|muted|accent|destructive|popover|shadow|zemin|metin|vurgu|cizgi|eylem|yuzey/.test(ham)) continue;
    ekle(dosya, offset + m.index, fonksiyon === "var" ? "css-degisken-kullanimi" : fonksiyon.includes("gradient") ? "gradyan" : ham.includes("${") ? "hesaplanan-renk" : "css-renk-fonksiyonu", ham, ozellik, ek);
  }
  if (renkOzelligi.test(ozellik) || ozellik.startsWith("--")) {
    for (const m of metin.matchAll(/\b[A-Za-z]+\b/g)) {
      if (adlar.has(m[0].toLowerCase()) && !/url\([^)]*$/i.test(metin.slice(0, m.index))) ekle(dosya, offset + m.index, "css-anahtar-sozcuk", m[0], ozellik, ek);
    }
  }
  if (siniflar) {
    for (const m of metin.matchAll(/[^\s"'`<>={}]+/g)) {
      const sinif = m[0].replace(/^[.,;]+|[;,]+$/g, "");
      const cozum = sinifCoz(sinif);
      if (cozum) ekle(dosya, offset + m.index, cozum.tur, sinif, cozum.ozellik, { ...ek, durum: cozum.durum, cozum: cozum.css, alpha: cozum.alpha, tailwindKaynak: cozum.kaynak ?? null });
    }
  }
}

function ustBaglam(n, sf) {
  for (let p = n.parent; p && !ts.isSourceFile(p); p = p.parent) {
    if (ts.isPropertyAssignment(p) || ts.isJsxAttribute(p)) return p.name.getText(sf).replace(/^['"]|['"]$/g, "");
    if (ts.isVariableDeclaration(p)) return p.name.getText(sf);
    if (ts.isBinaryExpression(p) && p.operatorToken.kind === ts.SyntaxKind.EqualsToken) return p.left.getText(sf).split(".").at(-1);
  }
  return "";
}

// Önce CSS renk değişkenlerini topla; sonra semantik Tailwind sınıflarını çöz.
for (const dosya of kaynaklar.filter((p) => p.endsWith(".css"))) {
  const metin = fs.readFileSync(dosya, "utf8");
  metinler.set(dosya, metin);
  try {
    postcss.parse(metin, { from: dosya }).walkDecls((d) => {
      if (d.prop.startsWith("--")) degiskenler.push({ ad: d.prop, deger: d.value, dosya, satir: d.source.start.line, secici: d.parent.selector ?? d.parent.name ?? "", kapsam: kapsam(dosya) });
    });
  } catch (e) { hatalar.push({ dosya, hata: e.message }); }
}

for (const dosya of kaynaklar) {
  const metin = metinler.get(dosya) ?? fs.readFileSync(dosya, "utf8");
  metinler.set(dosya, metin);
  const once = satirlar.length;
  if (dosya.endsWith(".css")) {
    try {
      postcss.parse(metin, { from: dosya }).walkDecls((d) => {
        const pos = d.source.start.offset + d.toString().indexOf(d.value);
        const ek = { secici: d.parent.selector ?? "", kosul: d.parent.parent?.type === "atrule" ? `@${d.parent.parent.name} ${d.parent.parent.params}` : "" };
        taraParca(dosya, d.value, pos, d.prop, ek, false);
        if (renkOzelligi.test(d.prop) || (/^--/.test(d.prop) && /#[\da-f]{3}|var\(|rgb|hsl|oklch|gradient|transparent|currentColor/i.test(d.value))) ekle(dosya, pos, d.prop.startsWith("--") ? "css-degisken-tanimi" : "css-bildirim", d.value, d.prop, ek);
        if (/opacity|blend-mode/.test(d.prop)) ekle(dosya, pos, "gorunum-islemi", d.value, d.prop, ek);
      });
      postcss.parse(metin).walkRules((r) => {
        taraParca(dosya, r.selector, r.source.start.offset, "CSS seçici", {}, true);
        if (/pill|capsule|kapsul|badge|rozet|etiket/i.test(r.selector)) pillAdaylari.push({ dosya, tur: "CSS seçici", ad: r.selector, ...yer(metin, r.source.start.offset), bas: r.source.start.offset, son: r.source.end.offset + 1 });
      });
    } catch (e) { hatalar.push({ dosya, hata: e.message }); }
  } else if (/\.[cm]?[jt]sx?$/.test(dosya)) {
    const sf = ts.createSourceFile(dosya, metin, ts.ScriptTarget.Latest, true, /x$/.test(dosya) ? ts.ScriptKind.TSX : /\.([cm]?js)$/.test(dosya) ? ts.ScriptKind.JS : ts.ScriptKind.TS);
    if (sf.parseDiagnostics.length) hatalar.push({ dosya, hata: sf.parseDiagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, " ")).join("; ") });
    const visit = (n) => {
      if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
        const ad = n.tagName.getText(sf);
        const attrs = n.attributes.getText(sf);
        if (/Pill|Badge|Rozet|Kapsul|Kapsül/.test(ad) || /rounded-full|borderRadius:\s*(?:999|["'](?:999|50%))/.test(attrs) || ad === "span" && /rounded-md/.test(attrs)) {
          const parent = ts.isJsxElement(n.parent) ? n.parent : n;
          pillAdaylari.push({ dosya, tur: /Pill|Badge|Rozet|Kapsul|Kapsül/.test(ad) ? "Adlandırılmış bileşen" : "Inline yuvarlak/etiket adayı", ad, ...yer(metin, n.getStart(sf)), bas: n.getStart(sf), son: parent.end });
        }
        if (/^(?:linearGradient|radialGradient)$/.test(ad)) {
          const parent = ts.isJsxElement(n.parent) ? n.parent : n;
          ekle(dosya, n.getStart(sf), "svg-gradyan", parent.getText(sf), ad);
        }
      }
      if (ts.isStringLiteralLike(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) {
        const bas = n.getStart(sf), ham = metin.slice(bas, n.end);
        const sonKes = ts.isTemplateHead(n) || ts.isTemplateMiddle(n) ? 2 : 1;
        taraParca(dosya, ham.slice(1, -sonKes), bas + 1, ustBaglam(n, sf));
      }
      if (ts.isTemplateExpression(n)) {
        const raw = n.getText(sf);
        if (/\b(?:rgb|rgba|hsl|hsla|oklch|color-mix|linear-gradient|radial-gradient|conic-gradient)\(/.test(raw)) {
          taraParca(dosya, raw.slice(1, -1), n.getStart(sf) + 1, ustBaglam(n, sf), { hesap: true }, false);
        }
        if (/(?:bg-|text-|border-|fill-|stroke-|from-|via-|to-)\$\{/.test(raw)) ekle(dosya, n.getStart(sf), "dinamik-tailwind-sinifi", raw, "className");
      }
      if ((ts.isPropertyAssignment(n) || ts.isJsxAttribute(n)) && n.initializer) {
        const prop = n.name.getText(sf).replace(/^['"]|['"]$/g, "");
        if (renkOzelligi.test(prop) || prop.startsWith("--")) {
          const value = n.initializer.getText(sf);
          if (prop.startsWith("--") && !/renk|color|tema|zemin|accent|shadow/.test(prop) && !/#[\da-f]|var\(/i.test(value)) { /* boyut değişkeni */ }
          else ekle(dosya, n.initializer.getStart(sf), "stil-ifadesi", value, prop);
        }
        if (/^(?:opacity|fillOpacity|strokeOpacity|stopOpacity|floodOpacity|mixBlendMode|backgroundBlendMode)$/.test(prop)) ekle(dosya, n.initializer.getStart(sf), "gorunum-islemi", n.initializer.getText(sf), prop);
        if (prop === "colorStops") ekle(dosya, n.initializer.getStart(sf), "grafik-gradyan-duraklari", n.initializer.getText(sf), prop);
      }
      if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
        const prop = n.left.getText(sf).split(".").at(-1);
        if (renkOzelligi.test(prop)) ekle(dosya, n.right.getStart(sf), "stil-atamasi", n.right.getText(sf), prop);
      }
      if (ts.isVariableDeclaration(n) && n.initializer && /RENK|COLOR|YESIL|SARI|KIRMIZI|RGB|MAVI|BORDO|GOLD|SILVER/.test(n.name.getText(sf))) {
        const text = n.initializer.getText(sf);
        const m = text.match(/^\[\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([\d.]+))?\s*\]/);
        if (m && m.slice(1, 4).every((v) => +v <= 255)) ekle(dosya, n.initializer.getStart(sf), "rgb-dizisi", text, n.name.getText(sf), { cozum: "#" + m.slice(1, 4).map((v) => (+v).toString(16).padStart(2, "0")).join("") });
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
  } else {
    taraParca(dosya, metin, 0, dosya.endsWith(".json") ? "JSON" : "İşaretleme veya veri", {}, true);
    if (/\.(html|svg)$/.test(dosya)) {
      for (const m of metin.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
        const bas = m.index + m[0].indexOf(m[1]);
        try { postcss.parse(m[1]).walkDecls((d) => {
          const pos = bas + d.source.start.offset + d.toString().indexOf(d.value);
          taraParca(dosya, d.value, pos, d.prop, { secici: d.parent.selector ?? "" }, false);
        }); } catch (e) { hatalar.push({ dosya, hata: e.message }); }
      }
      for (const m of metin.matchAll(/\b(fill|stroke|stop-color|flood-color|lighting-color|color|bgcolor)=["']([^"']+)["']/gi)) taraParca(dosya, m[2], m.index + m[0].indexOf(m[2]), m[1], {}, false);
    }
    if (dosya.endsWith(".json")) {
      for (const m of metin.matchAll(/"(theme_color|background_color)"\s*:\s*"([^"]+)"/g)) ekle(dosya, m.index, "manifest-rengi", m[2], m[1]);
    }
  }
  dosyaOzetleri.push({ dosya, kapsam: kapsam(dosya), alan: alan(dosya), satir: metin.split("\n").length, kayit: satirlar.length - once, sha256: crypto.createHash("sha256").update(metin).digest("hex") });
}

satirlar.sort((a, b) => a.dosya.localeCompare(b.dosya) || a.satir - b.satir || a.sutun - b.sutun || a.tur.localeCompare(b.tur));
satirlar.forEach((r, i) => { r.id = i + 1; });
const adetler = (key) => Object.fromEntries([...new Set(satirlar.map((r) => r[key]))].sort().map((v) => [v, satirlar.filter((r) => r[key] === v).length]));
const literalTurleri = new Set(["hex", "css-renk-fonksiyonu", "css-anahtar-sozcuk", "rgb-dizisi", "kodlanmis-svg-rengi", "gradyan"]);
const paletMap = new Map();
for (const r of satirlar.filter((r) => literalTurleri.has(r.tur) || r.tur === "tailwind-renk")) {
  const key = r.tur.startsWith("tailwind") || r.tur === "rgb-dizisi" || r.tur === "kodlanmis-svg-rengi" ? r.cozum : r.deger;
  if (!paletMap.has(key)) paletMap.set(key, { deger: key, tur: r.tur, kayitlar: [], kapsamlar: new Set() });
  const group = paletMap.get(key); group.kayitlar.push(r.id); group.kapsamlar.add(r.kapsam);
}
const palet = [...paletMap.values()].map((p) => ({ ...p, kapsamlar: [...p.kapsamlar] })).sort((a, b) => b.kayitlar.length - a.kayitlar.length || a.deger.localeCompare(b.deger));
const gorseller = dosyalar.filter((p) => /^(app|public)\//.test(p) && /\.(png|jpe?g|webp|gif|avif|ico|svg)$/i.test(p)).map((dosya) => ({ dosya, kapsam: kapsam(dosya), bayt: fs.statSync(dosya).size, not: /\.(png|jpe?g|webp|gif|avif|ico)$/i.test(dosya) ? "Piksel içeriği; CSS renk sabiti değildir. Varlık olarak kaydedildi." : "Vektör; metinsel renkler kaynak taramasında." }));
for (const p of pillAdaylari) p.kayitlar = satirlar.filter((r) => r.dosya === p.dosya && r.ofset >= p.bas && r.ofset < p.son).map((r) => r.id);
const veri = { olusturulma: new Date().toISOString(), surum: 1, yontem: "TypeScript AST + PostCSS + Tailwind yerel tema çözümlemesi; kaynak dosyaları değişmez.", ozet: { tarananDosya: kaynaklar.length, kayitliDosya: dosyaOzetleri.filter((d) => d.kayit).length, kayit: satirlar.length, paletIfadesi: palet.length, tekilHexIfadesi: new Set(satirlar.filter((r) => r.tur === "hex").map((r) => r.deger)).size, uygulamaTekilHexIfadesi: new Set(satirlar.filter((r) => r.tur === "hex" && r.kapsam === "Uygulama kaynağı").map((r) => r.deger)).size, pillVeYuvarlakBilesenAdayi: pillAdaylari.length, kapsamlar: adetler("kapsam"), turler: adetler("tur"), alanlar: adetler("alan") }, hatalar, dosyalar: dosyaOzetleri, degiskenler, palet, pillAdaylari, gorseller, kayitlar: satirlar };
fs.mkdirSync(cikti, { recursive: true });
fs.writeFileSync(path.join(cikti, "renk-envanteri.json"), JSON.stringify(veri, null, 2) + "\n");
const csv = (v) => '"' + String(v ?? "").replaceAll('"', '""') + '"';
const kolonlar = ["id", "kapsam", "alan", "kategori", "tur", "ham", "cozum", "alpha", "ozellik", "durum", "secici", "kosul", "dosya", "satir", "sutun", "baglam"];
fs.writeFileSync(path.join(cikti, "tum-kullanimlar.csv"), "\ufeff" + [kolonlar.join(","), ...satirlar.map((r) => kolonlar.map((k) => csv(r[k])).join(","))].join("\n") + "\n");
const md = (v) => String(v ?? "").replaceAll("|", "\\|").replaceAll("\n", " ").replaceAll("`", "ˋ");
const satirLinki = (r) => `[${r.dosya}:${r.satir}](${path.join(kok, r.dosya)}:${r.satir})`;
let renkMd = "# Kaynakta tanımlı renkler ve Tailwind renk karşılıkları\n\nBu liste renk ifadelerinin tamamını içerir. Her kullanımı görmek için tam CSV/JSON dosyalarına bakın. `currentColor`, `inherit`, saydamlık ve CSS değişkeni referansları bağlama bağlıdır. Tailwind değerleri kurulu sürümün `theme.css` dosyasından alınır.\n\n| Değer / ifade | Kullanım kaydı | Kapsam | İlk kaynak |\n| --- | ---: | --- | --- |\n";
for (const p of palet) renkMd += `| \`${md(p.deger)}\` | ${p.kayitlar.length} | ${md(p.kapsamlar.join(", "))} | ${satirLinki(satirlar[p.kayitlar[0] - 1])} |\n`;
fs.writeFileSync(path.join(cikti, "TUM_RENKLER.md"), renkMd);
let dosyaMd = "# Dosya bazında bütün renk ve görünüm kullanımları\n\nHer satır kaynak konumu, kullanım amacı, ifade ve varsa çözülmüş CSS değerini taşır. Aynı rengin farklı işlevleri ayrı kayıtlardır.\n";
for (const d of dosyaOzetleri.filter((d) => d.kayit)) {
  dosyaMd += `\n## ${d.dosya}\n\nKapsam: ${d.kapsam}. Alan: ${d.alan}. ${d.kayit} kayıt.\n\n| Satır | Tür | Özellik / sınıf | Değer / ifade | Çözüm / durum |\n| --- | --- | --- | --- | --- |\n`;
  for (const r of satirlar.filter((r) => r.dosya === d.dosya)) dosyaMd += `| ${satirLinki(r)} | ${r.tur} | ${md(r.ozellik)} | \`${md(r.ham)}\` | ${md(r.cozum ?? r.durum ?? r.secici ?? "")} |\n`;
}
fs.writeFileSync(path.join(cikti, "DOSYA_BAZINDA_TUM_KULLANIMLAR.md"), dosyaMd);
let degiskenMd = "# CSS değişkenlerinin bütün tanımları\n\nAynı değişken adı farklı kapsamlarda farklı değer alabilir. Buradaki liste tanım yerlerini korur; farklı kapsamlardaki değerleri tek bir kesin renk gibi birleştirmez. Renk dışındaki ölçü/yazı değişkenleri de bağımlılığın kaybolmaması için bu listede bulunur.\n\n| Değişken | Değer | Kapsam / seçici | Kaynak |\n| --- | --- | --- | --- |\n";
for (const d of degiskenler) degiskenMd += `| \`${md(d.ad)}\` | \`${md(d.deger)}\` | ${md(d.secici)} | [${d.dosya}:${d.satir}](${path.join(kok, d.dosya)}:${d.satir}) |\n`;
fs.writeFileSync(path.join(cikti, "CSS_DEGISKENLERI.md"), degiskenMd);
let pillMd = "# Pill, rozet ve yuvarlak kontrol kaynak indeksi\n\nAdında Pill/Badge/Rozet/Kapsul bulunan bileşenler, inline yuvarlak etiket adayları ve ilgili CSS seçicileri listelenir. Avatar veya yuvarlak ikon da bu taramaya aday olarak girebilir. Listedeki bütün kayıtlar pill kabul edilmez; böylece inline yazılmış bir etiketi sessizce elemek yerine kaynağı görünür kalır. Renklerini dış sözlükten alan bileşenin kendi satırında renk bulunmayabilir; sözlük bağlantıları ana rapordadır.\n\n| Kaynak | Tür | Bileşen / seçici | Kendi kaynak aralığındaki renk/görünüm kayıtları |\n| --- | --- | --- | --- |\n";
for (const p of pillAdaylari) {
  const ifadeler = [...new Set(p.kayitlar.map((id) => { const r = satirlar[id - 1]; return r.ham + (r.cozum ? ` → ${r.cozum}` : ""); }))];
  pillMd += `| ${satirLinki(p)} | ${p.tur} | ${md(p.ad)} | ${ifadeler.map((v) => "`" + md(v) + "`").join("; ") || "Dış bileşen / renk sözlüğüne bağlı"} |\n`;
}
fs.writeFileSync(path.join(cikti, "PILL_VE_YUVARLAK_KONTROLLER.md"), pillMd);
const esc = (s) => String(s ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const kartlar = palet.map((p, i) => {
  const kayitlar = p.kayitlar.map((id) => satirlar[id - 1]);
  const refs = kayitlar.map((r) => `<li><code>${esc(r.dosya)}:${r.satir}:${r.sutun}</code><b>${esc(r.ozellik || r.tur)}</b><span>${esc(r.durum || r.secici || "normal")}</span><pre>${esc(r.baglam)}</pre></li>`).join("");
  return `<article class="renk" data-arama="${esc([p.deger, ...kayitlar.map((r) => [r.dosya, r.ozellik, r.kategori, r.alan, r.kapsam, r.durum, r.secici].join(" "))].join(" ").toLocaleLowerCase("tr-TR"))}"><span class="ornek" data-renk="${esc(p.deger)}" aria-label="Renk örneği"></span><div><h3><code>${esc(p.deger)}</code></h3><p>${p.kayitlar.length} kayıt · ${esc(p.kapsamlar.join(" · "))}</p><details><summary>Kullanım yerlerinin tamamı (${p.kayitlar.length})</summary><ol>${refs}</ol></details></div><small>${i + 1}</small></article>`;
}).join("");
const html = `<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HapBilgi · Repodaki renk envanteri</title><style>
*{box-sizing:border-box}body{margin:0;background:#f6f7f9;color:#202b3a;font:14px/1.6 system-ui,sans-serif}main{max-width:1120px;margin:auto;padding:36px 24px}h1{font-size:30px;margin:0 0 12px}h2{margin-top:36px}p{margin:8px 0}a{color:#185fa5}header{background:#fff;padding:25px;border:1px solid #dbe3ec;border-radius:16px}.ozet{display:flex;gap:12px;flex-wrap:wrap;margin:20px 0}.ozet b{background:#fff;border:1px solid #dbe3ec;border-radius:10px;padding:12px 16px}.arama{position:sticky;top:0;background:#f6f7f9eF;backdrop-filter:blur(10px);padding:14px 0;z-index:2}.arama input{width:100%;padding:13px;border:1px solid #b8c7d8;border-radius:9px;font:inherit}.renk{display:grid;grid-template-columns:70px minmax(0,1fr) 40px;gap:18px;background:#fff;border:1px solid #dbe3ec;border-radius:12px;padding:18px;margin:10px 0}.renk[hidden]{display:none}.ornek{width:64px;height:64px;border:1px solid #aab9ca;border-radius:9px;background:repeating-conic-gradient(#e4e8ef 0% 25%,#fff 0% 50%) 0 0/16px 16px;position:relative}.ornek:after{content:"";position:absolute;inset:0;border-radius:8px;background:var(--ornek)}h3{margin:0;overflow-wrap:anywhere;font-size:14px}.renk p{font-size:12px;color:#62728a}.renk small{color:#73829a;text-align:right}summary{color:#185fa5;cursor:pointer;font-size:13px}li{margin:12px 0;border-top:1px solid #e5e9ee;padding-top:10px}li code,li b,li span{display:block;font-size:12px;overflow-wrap:anywhere}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:11px;padding:8px;background:#f6f8fb;border-radius:6px}nav{display:flex;gap:15px;flex-wrap:wrap;margin-top:14px}.not{font-size:12px;color:#62728a}@media(max-width:600px){main{padding:18px 10px}.renk{grid-template-columns:40px minmax(0,1fr);padding:12px;gap:12px}.renk small{display:none}.ornek{width:36px;height:36px}h1{font-size:24px}}
</style><main><header><h1>HapBilgi · Repodaki renk envanteri</h1><p>17 Ekim 2026 · Kaynak dosyalarındaki renk, değişken, gradyan, saydamlık ve etkileşim ifadelerinin incelemesi.</p><p>Mevcut uygulama, yeni tema/rehber çalışması ve tasarım prototipleri kayıtların üzerinde ayrı belirtilir.</p><nav><a href="RAPOR.md">Ayrıntılı inceleme raporu</a><a href="TUM_RENKLER.md">Bütün renk ifadeleri</a><a href="DOSYA_BAZINDA_TUM_KULLANIMLAR.md">Dosya bazında bütün kullanımlar</a><a href="tum-kullanimlar.csv">Tam CSV</a><a href="renk-envanteri.json">Tam JSON</a><a href="CSS_DEGISKENLERI.md">Değişken tanımları</a></nav></header><div class="ozet"><b>${veri.ozet.tarananDosya} kaynak dosyası</b><b>${veri.ozet.kayitliDosya} dosyada bulgu</b><b>${veri.ozet.kayit} inceleme kaydı</b><b>${palet.length} renk / ifade</b></div><p class="not">İfade sayısı algısal olarak farklı renk sayısı değildir: aynı renk HEX, RGB, Tailwind veya değişken olarak yazılabilir. Saydam renkler arka zemine göre görünür; değişkenli örneklerin nihai rengi kapsamına bağlıdır. Tam stil ifadeleri, durum koşulları ve saydamlık kayıtları CSV/JSON ve dosya listesindedir.</p><section class="arama"><label for="ara">Renk, dosya, E-Club, pill, hover, zemin, kenar veya kullanım özelliği ara</label><input id="ara" placeholder="Örneğin: #237ac8 · EclubHoyk · pill · hover"><output id="sonuc">${palet.length} ifade</output></section><section id="liste">${kartlar}</section></main><script>
const satirlar=Array.from(document.querySelectorAll('.renk'));document.querySelectorAll('[data-renk]').forEach(e=>{let c=e.dataset.renk;if(CSS.supports('color',c)||CSS.supports('background-image',c))e.style.setProperty('--ornek',c)});document.getElementById('ara').addEventListener('input',e=>{const q=e.target.value.toLocaleLowerCase('tr-TR');let n=0;satirlar.forEach(r=>{r.hidden=!r.dataset.arama.includes(q);if(!r.hidden)n++});document.getElementById('sonuc').textContent=n+' / '+satirlar.length+' ifade'});
</script></html>`;
fs.writeFileSync(path.join(cikti, "renk-katalogu.html"), html);
console.log(JSON.stringify({ ...veri.ozet, hatalar, cikti: path.relative(kok, cikti) }, null, 2));
