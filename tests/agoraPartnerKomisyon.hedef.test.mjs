import { createRequire } from "node:module";
import { existsSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";

const repo = fileURLToPath(new URL("../", import.meta.url)).replace(/\/$/, "");
const require = createRequire(`${repo}/package.json`);
const { Window } = require("happy-dom");

const win = new Window({ url: "http://localhost/admin?sayfa=firmabilgileri&bolum=sistem" });
for (const key of [
  "window",
  "document",
  "navigator",
  "HTMLElement",
  "HTMLDivElement",
  "HTMLButtonElement",
  "HTMLInputElement",
  "HTMLTextAreaElement",
  "HTMLSelectElement",
  "Event",
  "MouseEvent",
  "Node",
  "NodeFilter",
  "MutationObserver",
  "CustomEvent",
]) {
  Object.defineProperty(globalThis, key, {
    value: key === "window" ? win : key === "document" ? win.document : win[key],
    configurable: true,
    writable: true,
  });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.getComputedStyle = win.getComputedStyle.bind(win);
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
globalThis.cancelAnimationFrame = clearTimeout;
if (!globalThis.matchMedia) {
  globalThis.matchMedia = () => ({
    matches: false,
    media: "",
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

const React = require("react");
const { act } = React;
const { createRoot } = require("react-dom/client");
const ts = require("typescript");

let dbAyarlar = [
  { anahtar: "z_diger_ayar", deger: 30, aciklama: "Diğer ayar" },
  {
    anahtar: "agora_partner_komisyon_orani",
    deger: 15,
    aciklama: "Agora partner yayınlarında uygulanan Cogniti komisyon oranı (%).",
  },
];
let sonRpc = null;
const partnerUuid = "10000000-0000-4000-8000-000000000011";

const fakeAdminDb = {
  from(tablo) {
    assert.equal(tablo, "sistem_ayarlari");
    let secilenAnahtar = null;
    const builder = {
      select() {
        return builder;
      },
      order() {
        const sirali = [...dbAyarlar].sort((a, b) => a.anahtar.localeCompare(b.anahtar));
        return Promise.resolve({ data: sirali, error: null });
      },
      eq(_kolon, deger) {
        secilenAnahtar = deger;
        return builder;
      },
      maybeSingle() {
        const satir = dbAyarlar.find((s) => s.anahtar === secilenAnahtar) ?? null;
        return Promise.resolve({ data: satir, error: null });
      },
      update(patch) {
        return {
          eq(_kolon, deger) {
            const hedef = dbAyarlar.find((s) => s.anahtar === deger);
            if (hedef) Object.assign(hedef, patch);
            return Promise.resolve({ error: null });
          },
        };
      },
    };
    return builder;
  },
  async rpc(ad, args) {
    sonRpc = { ad, args };
    if (ad === "agora_partner_canli_verileri_oku") {
      const oran = Number(dbAyarlar.find((s) => s.anahtar === "agora_partner_komisyon_orani")?.deger ?? 15);
      return { data: { komisyon_orani: oran, egitimler: [], oturumlar: [] }, error: null };
    }
    return { data: { canli_egitim_id: "e1", ...args }, error: null };
  },
};

const moduleCache = new Map();
function loadTs(file) {
  if (moduleCache.has(file)) return moduleCache.get(file).exports;
  const mod = { exports: {} };
  moduleCache.set(file, mod);

  const localRequire = (id) => {
    if (id === "next/navigation") {
      return {
        useRouter: () => ({ push: () => {}, replace: () => {}, prefetch: () => {} }),
        usePathname: () => "/partner/canli-yayinlar",
      };
    }
    if (id === "next/image") {
      return { __esModule: true, default: (props) => React.createElement("img", props) };
    }
    if (id === "@/lib/supabase/server") {
      return { createAdminClient: () => fakeAdminDb };
    }
    if (id === "@/lib/utils/adminGirisKontrol") {
      return {
        adminGirisKontrol: async () => ({
          gecerli: true,
          kullaniciId: "10000000-0000-4000-8000-000000000001",
        }),
      };
    }
    if (id === "@/lib/agora/partnerProfilSunucu") {
      return {
        onayliPartnerBaglami: async () => ({
          db: fakeAdminDb,
          partnerId: partnerUuid,
          tokenOzeti: "a".repeat(64),
        }),
      };
    }
    if (id === "@/components/agora/PartnerKabugu") {
      return {
        __esModule: true,
        default: ({ children }) => React.createElement("div", null, children),
      };
    }
    if (id === "@/components/HataMesaji") {
      return {
        HataMesajiContainer: () => null,
        useHataMesaji: () => ({ mesajlar: [], basari: () => {}, hata: () => {}, uyari: () => {}, bilgi: () => {} }),
      };
    }
    if (id.endsWith("/FiyatTarifesi") || id === "./FiyatTarifesi") {
      return { __esModule: true, default: () => null };
    }
    if (id.endsWith("/EclubTestEczaneleri")) {
      return { __esModule: true, default: () => null };
    }
    if (id.endsWith(".css")) {
      return { __esModule: true, default: new Proxy({}, { get: (_, k) => String(k) }) };
    }
    if (!id.startsWith("@/") && !id.startsWith(".")) return require(id);

    const base = id.startsWith("@/")
      ? path.join(repo, id.slice(2))
      : path.resolve(path.dirname(file), id);
    const full = [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      `${base}/index.ts`,
      `${base}/index.tsx`,
    ].find((candidate) => existsSync(candidate) && !statSync(candidate).isDirectory());
    if (!full) throw new Error(`Modül bulunamadı: ${id} (${file})`);
    return loadTs(full);
  };

  const js = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;

  vm.runInThisContext(
    `(function(require,module,exports){${js.replaceAll("import.meta.url", JSON.stringify(`file://${file}`))}\n})`,
    { filename: file },
  )(localRequire, mod, mod.exports);

  return mod.exports;
}

let passed = 0;
function check(name, condition) {
  assert.ok(condition, name);
  passed++;
}

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

// 1. Admin /admin/api/sistem-ayarlari doğrulamaları
const sistemApi = loadTs(`${repo}/app/admin/api/sistem-ayarlari/route.ts`);
{
  for (const gecersiz of [0, -1, 100, 120, 12.345, "20"]) {
    const r = await sistemApi.PUT(
      new Request("http://localhost/admin/api/sistem-ayarlari", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ anahtar: "agora_partner_komisyon_orani", deger: gecersiz }),
      }),
    );
    check(`PUT geçersiz oranı reddeder (${String(gecersiz)})`, r.status === 400);
  }

  const rOk = await sistemApi.PUT(
    new Request("http://localhost/admin/api/sistem-ayarlari", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ anahtar: "agora_partner_komisyon_orani", deger: 20 }),
    }),
  );
  const dOk = await rOk.json();
  check("PUT geçerli oranı (20) kaydeder", rOk.status === 200 && dOk.deger === 20);
  check("DB sahte kaydı 20 olarak güncellenir", dbAyarlar.find((s) => s.anahtar === "agora_partner_komisyon_orani")?.deger === 20);
}

// 2. Partner canlı yayınlar API güncellenmiş oranı döner
const canliApi = loadTs(`${repo}/app/partner/api/canli-yayinlar/route.ts`);
{
  const rGet = await canliApi.GET();
  const dGet = await rGet.json();
  check("GET /partner/api/canli-yayinlar güncel 20 oranını döner", rGet.status === 200 && dGet.komisyon_orani === 20);

  const rPost = await canliApi.POST(
    new Request("http://localhost/partner/api/canli-yayinlar", {
      method: "POST",
      headers: { origin: "http://localhost", "content-type": "application/json" },
      body: JSON.stringify({
        islem: "egitim_olustur",
        egitim_adi: "Canlı Komisyon Testi",
        kategori: "urun_egitimi",
        hedef_roller: ["eczaci"],
        aciklama: "Test açıklaması.",
        sure_dakika: 60,
        kapasite: 25,
        fiyat_tl: "1000",
      }),
    }),
  );
  check("POST egitim_olustur RPC çağrısını tamamlar", rPost.status === 200 && sonRpc?.ad === "agora_partner_canli_egitim_olustur");
}

// 3. Hak ediş doğrulayıcısı (lib/agora/hakedis.ts) komisyon_orani ve hizmet_orani alanlarını doğrular
const hakedisLib = loadTs(`${repo}/lib/agora/hakedis.ts`);
{
  const gecerliVeri = {
    komisyon_orani: 20,
    genel_toplam: { satin_alma_bedeli: 15000, hizmet_bedeli: 2500, hak_edis: 12500, kdv_tutari: 2500, kdvli_odenecek_tutar: 15000 },
    filtre_toplam: { satin_alma_bedeli: 15000, hizmet_bedeli: 2500, hak_edis: 12500, kdv_tutari: 2500, kdvli_odenecek_tutar: 15000 },
    partner_id: partnerUuid,
    toplam: 2,
    sayfa: 1,
    sayfa_boyutu: 20,
    kayitlar: [
      {
        siparis_id: "10000000-0000-4000-8000-000000000021",
        partner_egitim_id: "PC-1001",
        egitim_adi: "Yeni Sipariş",
        siparis_tarihi: "2026-11-21T10:00:00Z",
        satin_alma_bedeli: 5000,
        hizmet_orani: 20,
        hizmet_bedeli: 1000,
        hak_edis: 4000,
        kdv_tutari: 800,
        kdvli_odenecek_tutar: 4800,
        planlanan_odeme_gunu: null,
        odenen_gun: null,
      },
      {
        siparis_id: "10000000-0000-4000-8000-000000000022",
        partner_egitim_id: "PE-10001",
        egitim_adi: "Eski Sipariş",
        siparis_tarihi: "2026-11-06T10:00:00Z",
        satin_alma_bedeli: 10000,
        hizmet_orani: 15,
        hizmet_bedeli: 1500,
        hak_edis: 8500,
        kdv_tutari: 1700,
        kdvli_odenecek_tutar: 10200,
        planlanan_odeme_gunu: null,
        odenen_gun: null,
      },
    ],
  };
  check("Geçmiş %15 + yeni %20 oranlı hak ediş verisi doğrulanır", hakedisLib.partnerHakEdisListesiGecerli(gecerliVeri, partnerUuid, 1));
  check(
    "Geçersiz hizmet_orani (105) reddedilir",
    !hakedisLib.partnerHakEdisListesiGecerli(
      { ...gecerliVeri, kayitlar: [{ ...gecerliVeri.kayitlar[0], hizmet_orani: 105 }] },
      partnerUuid,
      1,
    ),
  );
  check(
    "Geçersiz komisyon_orani (0) reddedilir",
    !hakedisLib.partnerHakEdisListesiGecerli({ ...gecerliVeri, komisyon_orani: 0 }, partnerUuid, 1),
  );
}

// 4. Admin SistemAyarlari UI testi: satır tablo sonunda görünür ve Türkçe ondalıklı değer kaydeder
const SistemAyarlari = loadTs(`${repo}/app/admin/_components/SistemAyarlari.tsx`).default;
{
  const orijinalFetch = globalThis.fetch;
  const gonderilenler = [];
  globalThis.fetch = async (url, init) => {
    if (url === "/admin/api/sistem-ayarlari" && (!init || init.method === "GET")) {
      return Response.json({
        ayarlar: [...dbAyarlar].sort((a, b) => a.anahtar.localeCompare(b.anahtar)),
      });
    }
    if (url === "/admin/api/mesai-bypass") {
      return Response.json({ aktif: false });
    }
    if (url === "/admin/api/sistem-ayarlari" && init?.method === "PUT") {
      const body = JSON.parse(init.body);
      gonderilenler.push(body);
      const hedef = dbAyarlar.find((s) => s.anahtar === body.anahtar);
      if (hedef) hedef.deger = body.deger;
      return Response.json({ mesaj: "Güncellendi", ...body });
    }
    return Response.json({});
  };

  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const basarilar = [];
  const hatalar = [];

  try {
    await act(async () => {
      root.render(
        React.createElement(SistemAyarlari, {
          hata: (m) => hatalar.push(m),
          basari: (m) => basarilar.push(m),
        }),
      );
    });
    await flushMicrotasks();

    const input = host.querySelector('input[aria-label="Partner Komisyon Oranı (%)"]');
    check("Admin sistem ayarlarında Partner Komisyon Oranı (%) inputu görünür", Boolean(input) && input.value === "20");

    const tabloSatirlari = [...host.querySelectorAll("input")];
    check(
      "Partner Komisyon Oranı satırı alfabetik 'z_diger_ayar' altında en son satırda yer alır",
      tabloSatirlari.at(-1) === input,
    );

    const valueSetter = Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, "value").set;
    await act(async () => {
      valueSetter.call(input, "12,5");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const satirDiv = input.closest("div")?.parentElement;
    const kaydetBtn = satirDiv?.querySelector("button");
    await act(async () => {
      kaydetBtn?.click();
    });
    await flushMicrotasks();

    check("Türkçe '12,5' girişi PUT gövdesinde 12.5 olarak gönderilir", gonderilenler.length === 1 && gonderilenler[0].deger === 12.5 && hatalar.length === 0);
    check("Başarı bildirimi Partner Komisyon Oranı adını taşır", basarilar.some((b) => b.includes("Partner Komisyon Oranı")));
  } finally {
    await act(async () => {
      root.unmount();
    });
    host.remove();
    globalThis.fetch = orijinalFetch;
  }
}

// 5. PartnerCanliYayinAlani ve PartnerHakEdisTablosu UI'ları dinamik oranı gösterir
const PartnerCanliYayinAlani = loadTs(`${repo}/app/partner/canli-yayinlar/PartnerCanliYayinAlani.tsx`).default;
const PartnerHakEdisTablosu = loadTs(`${repo}/components/agora/PartnerHakEdisTablosu.tsx`).default;
{
  const orijinalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (url === "/partner/api/canli-yayinlar") {
      return Response.json({ komisyon_orani: 20, egitimler: [], oturumlar: [] });
    }
    if (String(url).startsWith("/partner/api/hak-edisleri")) {
      return Response.json({
        komisyon_orani: 20,
        genel_toplam: { satin_alma_bedeli: 15000, hizmet_bedeli: 2500, hak_edis: 12500, kdv_tutari: 2500, kdvli_odenecek_tutar: 15000 },
        filtre_toplam: { satin_alma_bedeli: 15000, hizmet_bedeli: 2500, hak_edis: 12500, kdv_tutari: 2500, kdvli_odenecek_tutar: 15000 },
        partner_id: partnerUuid,
        toplam: 2,
        sayfa: 1,
        sayfa_boyutu: 20,
        kayitlar: [
          {
            siparis_id: "10000000-0000-4000-8000-000000000021",
            partner_egitim_id: "PC-1001",
            egitim_adi: "Yeni Sipariş",
            siparis_tarihi: "2026-11-21T10:00:00Z",
            satin_alma_bedeli: 5000,
            hizmet_orani: 20,
            hizmet_bedeli: 1000,
            hak_edis: 4000,
            kdv_tutari: 800,
            kdvli_odenecek_tutar: 4800,
            planlanan_odeme_gunu: null,
            odenen_gun: null,
          },
          {
            siparis_id: "10000000-0000-4000-8000-000000000022",
            partner_egitim_id: "PE-10001",
            egitim_adi: "Eski Sipariş",
            siparis_tarihi: "2026-11-06T10:00:00Z",
            satin_alma_bedeli: 10000,
            hizmet_orani: 15,
            hizmet_bedeli: 1500,
            hak_edis: 8500,
            kdv_tutari: 1700,
            kdvli_odenecek_tutar: 10200,
            planlanan_odeme_gunu: null,
            odenen_gun: null,
          },
        ],
      });
    }
    return Response.json({});
  };

  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);

  try {
    await act(async () => {
      root.render(React.createElement(PartnerCanliYayinAlani, { sirketAdi: "Test Partner", gorunum: "planlama" }));
    });
    await flushMicrotasks();

    check("Canlı yayın formunda dinamik '%20 Hizmet Bedeli' etiketi görünür", host.textContent.includes("%20 Hizmet Bedeli"));
    check("Canlı yayın formunda artık sabit '%15 Hizmet Bedeli' kalmamıştır", !host.textContent.includes("%15 Hizmet Bedeli"));

    const fiyatInput = host.querySelector('input[placeholder="Örn. 5000"]');
    const valueSetter = Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, "value").set;
    await act(async () => {
      valueSetter.call(fiyatInput, "5000");
      fiyatInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
    check("5000 TL girildiğinde %20 kesinti sonrası net hak ediş 4.000,00 TL hesaplanır", host.textContent.includes("4.000") && host.textContent.includes("1.000"));

    await act(async () => {
      root.render(
        React.createElement(PartnerHakEdisTablosu, {
          partnerId: partnerUuid,
          endpoint: "/partner/api/hak-edisleri",
          anaBaslik: true,
        }),
      );
    });
    await flushMicrotasks();

    check("Hak Ediş tablosu Cogniti Payı altında güncel '%20' oranını gösterir", host.textContent.includes("Güncel %20"));
    check("Hak Ediş satırları kendi geçmiş (%15) ve yeni (%20) oranlarını ayrı ayrı gösterir", host.textContent.includes("%15") && host.textContent.includes("%20"));
  } finally {
    await act(async () => {
      root.unmount();
    });
    host.remove();
    globalThis.fetch = orijinalFetch;
  }
}

// 6. SQL migration script yapısı kontrolü
const sqlMetni = readFileSync(`${repo}/scripts/sql/agora_partner_komisyon_orani.sql`, "utf8");
check(
  "SQL üç tabloda da CHECK (hizmet_orani > 0 AND hizmet_orani < 100) tanımlar ve tek okuyucuyu kullanır",
  sqlMetni.includes("CHECK (hizmet_orani > 0 AND hizmet_orani < 100)") &&
    sqlMetni.includes("agora_partner_komisyon_orani_oku()") &&
    !sqlMetni.includes("* 0.15"),
);

console.log(JSON.stringify({ passed }));
