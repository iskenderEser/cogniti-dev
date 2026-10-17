import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import postcss from "postcss";

// CSS tek kaynaktır. DOM bulunmayan hesaplar için yalnız çizim renkleri üretilir.
const kok = new URL("../../", import.meta.url);
const kaynak = postcss.parse(await readFile(new URL("app/tema.css", kok), "utf8"));
const tailwind = postcss.parse(await readFile(new URL("node_modules/tailwindcss/theme.css", kok), "utf8"));
const temalar = {};
for (const tema of ["mavi", "yesil"]) {
  const bildirimler = new Map();
  tailwind.walkDecls((n) => { if (n.prop.startsWith("--color-")) bildirimler.set(n.prop, n.value); });
  kaynak.walkRules((kural) => {
    const seciciler = kural.selector.split(",").map((s) => s.trim());
    if (!seciciler.includes(":root") && !seciciler.includes(`[data-tema="${tema}"]`)) return;
    kural.nodes.forEach((n) => {
      if (n.type === "decl" && n.prop.startsWith("--tema-")) bildirimler.set(n.prop, n.value);
    });
  });
  const coz = (ad, yol = []) => {
    if (yol.includes(ad) || !bildirimler.has(ad)) throw new Error(`Çözülemeyen renk: ${[...yol, ad].join(" → ")}`);
    return bildirimler.get(ad).replace(/var\((--[\w-]+)\)/g, (_, bag) => coz(bag, [...yol, ad]));
  };
  temalar[tema] = Object.fromEntries([...bildirimler.keys()].filter((ad) => ad.startsWith("--tema-cizim-")).sort().map((ad) => [ad, coz(ad)]));
}
const hedef = new URL("lib/tema/hesaplananRenkler.generated.ts", kok);
const sonuc = `// Otomatik üretildi: app/tema.css → node scripts/denetim/hesaplanan-renkleri-uret.mjs\n// Elle değiştirmeyin; sunucu/DOM dışı çizimler için CSS renklerinin çıktısıdır.\nexport const HESAPLANAN_RENKLER = ${JSON.stringify(temalar, null, 2)} as const;\n\nexport type HesaplananRenkAnahtari = keyof typeof HESAPLANAN_RENKLER.mavi;\n`;
if (process.argv.includes("--check")) {
  if (await readFile(hedef, "utf8").catch(() => "") !== sonuc) throw new Error(`Renk çıktısı güncel değil: node ${fileURLToPath(import.meta.url)}`);
} else {
  await writeFile(hedef, sonuc);
}
