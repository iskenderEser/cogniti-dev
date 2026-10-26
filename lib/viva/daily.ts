import "server-only";
import { vivaDailyDosyaLinki } from "./dosyaLinki";

export class VivaDailyHatasi extends Error {
  status: number;
  kod: string;
  constructor(mesaj: string, kod = "DAILY_HATA", status = 503) {
    super(mesaj); this.name = "VivaDailyHatasi"; this.kod = kod; this.status = status;
  }
}
export interface VivaDailyOdaIstek {
  domain: string; oda_adi: string; baslangic: string; bitis: string;
}
export interface VivaDailyOda {
  id: string; name: string; url: string; privacy: "private";
  config: Record<string, unknown>;
}
export interface VivaDailyApi {
  domain: string;
  odaHazirla: (istek: VivaDailyOdaIstek) => Promise<VivaDailyOda>;
}
export interface VivaDailyTokenAyarlari {
  room_name: string; user_id: string; user_name: string; is_owner: boolean;
  nbf: number; exp: number; eject_at_token_exp: true;
  enable_screenshare: boolean; enable_prejoin_ui: false; enable_recording_ui: boolean; enable_recording?: false | "cloud";
  start_video_off: true; start_audio_off: true; start_cloud_recording: false;
  auto_start_transcription: false; knocking: false; lang: "tr";
  permissions: { hasPresence: true; canSend: boolean; canReceive: { base: true }; canAdmin: boolean };
}
export interface VivaDailyKatilimApi extends VivaDailyApi {
  sunucuOdada: (oda: string, sunucu: string) => Promise<boolean>;
  tokenOlustur: (ayarlar: VivaDailyTokenAyarlari) => Promise<string>;
}
export interface VivaDailyYasamApi extends VivaDailyKatilimApi {
  sunucuOturumu: (oda: string, sunucu: string) => Promise<string | null>;
  erisimEngelle: (oda: string, ids: string[]) => Promise<void>;
  odaKapat: (oda: string) => Promise<void>;
  kayitDurdur?: (oda: string) => Promise<void>;
}
export interface VivaDailyKayit {
  id: string; oda_adi: string; oturum_id: string; baslangic: number;
  durum: "kaydediliyor" | "hazir"; sure: number | null;
}
export interface VivaDailyKayitApi extends VivaDailyYasamApi {
  kayitOku: (id: string) => Promise<VivaDailyKayit>;
  kayitListe: (oda: string, sonra?: string) => Promise<{ kayitlar: VivaDailyKayit[]; devam: string | null }>;
  kayitLinki: (id: string, tur?: "video" | "sohbet") => Promise<{ url: string; bitis: number }>;
}
export const vivaDailyOdaAdi = (id: string, nesil = 1) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) || !Number.isSafeInteger(nesil) || nesil < 1) {
    throw new VivaDailyHatasi("Geçersiz Viva oda kimliği.", "GECERSIZ_GIRDI", 400);
  }
  return `viva-${id.replaceAll("-", "").toLowerCase()}-n${nesil}`;
};
export function vivaDailyAyar(env: NodeJS.ProcessEnv = process.env) {
  const domain = env.DAILY_DOMAIN?.trim().toLowerCase();
  const anahtar = env.DAILY_API_KEY?.trim();
  if (!domain || !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.daily\.co$/.test(domain) || !anahtar || /\s/.test(anahtar) || anahtar === "buraya_kopyaladigin_anahtar") {
    throw new VivaDailyHatasi("Viva canlı bağlantı ayarları henüz hazır değil.", "AYAR_EKSIK");
  }
  return { domain, anahtar };
}
export function vivaDailyOdaAyarlari(istek: VivaDailyOdaIstek) {
  const bas = Date.parse(istek.baslangic), bit = Date.parse(istek.bitis);
  if (!Number.isFinite(bas) || !Number.isFinite(bit) || bit <= bas || bit <= Date.now()) {
    throw new VivaDailyHatasi("Etkinliğin tarihleri geçersiz veya süresi dolmuş.", "GECERSIZ_GIRDI", 400);
  }
  return {
    nbf: Math.floor(bas / 1000), exp: Math.ceil(bit / 1000), eject_at_room_exp: true,
    lang: "tr", enable_prejoin_ui: true, enable_chat: true, enable_hand_raising: true,
    enable_video_processing_ui: true, enable_breakout_rooms: true,
    enable_pip_ui: true, enable_emoji_reactions: true,
    enable_screenshare: true, start_video_off: true, start_audio_off: true,
    // Katılım sunucuda doğrulanmış tokenla; tokensiz kabul Viva kapsamını atlayamaz.
    enable_knocking: false,
  };
}
export function createVivaDailyApi(options: { env?: NodeJS.ProcessEnv; fetcher?: typeof fetch } = {}): VivaDailyKayitApi {
  const { domain, anahtar } = vivaDailyAyar(options.env);
  const fetcher = options.fetcher ?? fetch;
  async function istek(yol: string, method = "GET", body?: unknown): Promise<{ status: number; data: unknown }> {
    let response: Response;
    try {
      response = await fetcher(`https://api.daily.co/v1/${yol}`, {
        method, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10_000),
        headers: { Authorization: `Bearer ${anahtar}`, "Content-Type": "application/json" },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch { throw new VivaDailyHatasi("Daily bağlantısı tamamlanamadı. Yeniden deneyin.", "AG_HATASI"); }
    // Sağlayıcının ham hata gövdesi/anahtarı yanıt veya günlüklere taşınmaz.
    let data: unknown = null;
    if (response.ok) {
      try { data = await response.json(); }
      catch { throw new VivaDailyHatasi("Daily geçerli bir yanıt vermedi.", "TUTARSIZ_YANIT"); }
    }
    return { status: response.status, data };
  }
  function odaOku(data: unknown, ad: string): VivaDailyOda {
    if (!data || typeof data !== "object") throw new VivaDailyHatasi("Daily oda yanıtı doğrulanamadı.", "TUTARSIZ_YANIT");
    const d = data as Record<string, unknown>;
    if (typeof d.id !== "string" || !d.id || d.id.length > 128 || d.name !== ad || d.privacy !== "private" || d.url !== `https://${domain}/${ad}` || !d.config || typeof d.config !== "object" || Array.isArray(d.config)) {
      throw new VivaDailyHatasi("Daily oda kimliği, alanı veya gizliliği eşleşmiyor.", "TUTARSIZ_YANIT");
    }
    return d as unknown as VivaDailyOda;
  }
  function basarili(r: { status: number }) {
    if (r.status < 200 || r.status >= 300) throw new VivaDailyHatasi("Daily oda işlemi tamamlanamadı. Yeniden deneyin.", "DAILY_HATA");
  }
  const uuid = (id: unknown): id is string => typeof id === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id);
  const odaGecerli = (oda: string) => /^viva-[0-9a-f]{32}-n[1-9][0-9]*$/.test(oda);
  async function kayitCoz(data: unknown, beklenenOda?: string): Promise<VivaDailyKayit> {
    const d = data as Record<string, unknown>;
    if (!d || !uuid(d.id) || !uuid(d.mtgSessionId) || typeof d.start_ts !== "number" || !Number.isFinite(d.start_ts)
      || !["in-progress", "finished"].includes(String(d.status))) throw new VivaDailyHatasi("Kayıt bilgisi henüz hazır değil.", "KAYIT_BEKLIYOR");
    // Recording info oda adı döndürmez; oda/oturum ilişkisi sağlayıcıdan ayrıca doğrulanır.
    // room_name filtreli sağlayıcı listesi zaten oda kapsamındadır; her dosya için ek HTTP gerekmez.
    let oda = beklenenOda;
    if (!oda) {
      const m = await istek(`meetings/${d.mtgSessionId}`); basarili(m);
      const meeting = m.data as { id?: string; room?: string };
      if (meeting.id !== d.mtgSessionId || typeof meeting.room !== "string") throw new VivaDailyHatasi("Kayıt odası eşleşmedi.", "TUTARSIZ_YANIT");
      if (!odaGecerli(meeting.room)) throw new VivaDailyHatasi("Viva dışındaki kayıt.", "KAPSAM_DISI", 400);
      oda = meeting.room;
    }
    return { id: d.id, oda_adi: oda, oturum_id: d.mtgSessionId, baslangic: d.start_ts,
      durum: d.status === "finished" ? "hazir" : "kaydediliyor", sure: typeof d.duration === "number" && Number.isFinite(d.duration) && d.duration >= 0 ? d.duration : null };
  }
  return {
    domain,
    async kayitOku(id) {
      if (!uuid(id)) throw new VivaDailyHatasi("Geçersiz kayıt.", "GECERSIZ_GIRDI", 400);
      const r = await istek(`recordings/${id}`); basarili(r); return kayitCoz(r.data);
    },
    async kayitListe(oda, sonra) {
      if (!odaGecerli(oda) || (sonra && !uuid(sonra))) throw new VivaDailyHatasi("Geçersiz kayıt odası.", "GECERSIZ_GIRDI", 400);
      const r = await istek(`recordings?room_name=${oda}&limit=10${sonra ? `&starting_after=${sonra}` : ""}`); basarili(r);
      const d = r.data as { data?: unknown[] };
      if (!Array.isArray(d.data)) throw new VivaDailyHatasi("Kayıt listesi okunamadı.", "TUTARSIZ_YANIT");
      const kayitlar: VivaDailyKayit[] = [];
      for (const item of d.data) kayitlar.push(await kayitCoz(item, oda));
      return { kayitlar, devam: d.data.length === 10 ? kayitlar.at(-1)!.id : null };
    },
    async kayitDurdur(oda) {
      if (!odaGecerli(oda)) throw new VivaDailyHatasi("Geçersiz oda.", "GECERSIZ_GIRDI", 400);
      // Liste boşsa stop komutu gönderilmez. Yanlış/başarısız komut sessizce yutulmaz.
      const r = await istek(`recordings?room_name=${oda}&limit=100`); basarili(r);
      const d = r.data as { data?: { status?: string }[] };
      if (!Array.isArray(d.data)) throw new VivaDailyHatasi("Kayıt kapanışı doğrulanamadı.", "TUTARSIZ_YANIT");
      if (d.data.some(k => k.status === "in-progress")) {
        const stop = await istek(`rooms/${oda}/recordings/stop`, "POST"); basarili(stop);
      }
    },
    async kayitLinki(id, tur = "video") {
      if (!uuid(id)) throw new VivaDailyHatasi("Geçersiz kayıt.", "GECERSIZ_GIRDI", 400);
      const r = await istek(`recordings/${id}/access-link?valid_for_secs=900`); basarili(r);
      const link = vivaDailyDosyaLinki(r.data, tur);
      if (!link) throw new VivaDailyHatasi(tur === "sohbet"
        ? "Daily bu kayıt için ayrı bir sohbet dosyası bağlantısı döndürmedi. Eski kayıtlarda sohbet dosyası bulunmayabilir."
        : "Kayıt bağlantısı doğrulanamadı.", "DOSYA_YOK", tur === "sohbet" ? 404 : 503);
      return link;
    },
    async sunucuOturumu(oda, sunucu) {
      if (!/^viva-[0-9a-f]{32}-n[1-9][0-9]*$/.test(oda) || !/^vi_[a-f0-9]{32}$/.test(sunucu)) throw new VivaDailyHatasi("Geçersiz oda.", "GECERSIZ_GIRDI", 400);
      const r = await istek(`rooms/${oda}/presence?userId=${sunucu}&limit=1`); basarili(r);
      const d = r.data as { data?: { room: string; userId: string; mtgSessionId?: string }[] };
      if (!Array.isArray(d?.data)) throw new VivaDailyHatasi("Görüşme oturumu doğrulanamadı.", "TUTARSIZ_YANIT");
      const p = d.data.find(p => p.room === oda && p.userId === sunucu);
      return p && typeof p.mtgSessionId === "string" && /^[a-f0-9-]{36}$/i.test(p.mtgSessionId) ? p.mtgSessionId : null;
    },
    async erisimEngelle(oda, ids) {
      if (!/^viva-[0-9a-f]{32}-n[1-9][0-9]*$/.test(oda) || ids.length > 100 || ids.some(id => !/^vi_[a-f0-9]{32}$/.test(id))) throw new VivaDailyHatasi("Geçersiz çıkarma işlemi.", "GECERSIZ_GIRDI", 400);
      if (!ids.length) return;
      const r = await istek(`rooms/${oda}/eject`, "POST", { user_ids: ids, ban: true });
      if (r.status !== 404) basarili(r);
    },
    async odaKapat(oda) {
      if (!/^viva-[0-9a-f]{32}-n[1-9][0-9]*$/.test(oda)) throw new VivaDailyHatasi("Geçersiz oda.", "GECERSIZ_GIRDI", 400);
      const yol = `rooms/${oda}`;
      const oku = await istek(yol); if (oku.status === 404) return; basarili(oku);
      odaOku(oku.data, oda);
      const kapat = await istek(yol, "POST", { privacy: "private", properties: { exp: Math.floor(Date.now() / 1000) + 5, eject_at_room_exp: true, enable_knocking: false } });
      basarili(kapat);
      // Aktif kişiler çıkmadan oda silinmez. Kalanlar varsa kalıcı iş yeniden denenir.
      const kapanisBaslangici = Date.now();
      for (let tur = 0; tur < 5 && Date.now() - kapanisBaslangici < 25_000; tur++) {
        const r = await istek(`${yol}/presence?limit=100`); basarili(r);
        const d = r.data as { total_count?: number; data?: { id: string; userId?: string }[] };
        if (!Number.isSafeInteger(d?.total_count) || !Array.isArray(d.data)) throw new VivaDailyHatasi("Oda kapanışı doğrulanamadı.", "TUTARSIZ_YANIT");
        if (d.total_count === 0) {
          const sil = await istek(yol, "DELETE"); if (sil.status !== 404) basarili(sil);
          const son = await istek(yol); if (son.status !== 404) throw new VivaDailyHatasi("Oda henüz kapanmadı.", "DAILY_HATA");
          return;
        }
        if (!d.data.length || d.data.some(p => typeof p.id !== "string" || !p.id)) throw new VivaDailyHatasi("Oda kapanışı doğrulanamadı.", "TUTARSIZ_YANIT");
        const cikar = await istek(`${yol}/eject`, "POST", { ids: d.data.map(p => p.id), user_ids: d.data.flatMap(p => p.userId && /^vi_[a-f0-9]{32}$/.test(p.userId) ? [p.userId] : []), ban: true });
        basarili(cikar);
      }
      throw new VivaDailyHatasi("Kapanış sürüyor; sunucu yeniden deneyecek.", "DAILY_HATA");
    },
    async sunucuOdada(oda, sunucu) {
      if (!/^viva-[0-9a-f]{32}-n[1-9][0-9]*$/.test(oda) || !/^vi_[a-f0-9]{32}$/.test(sunucu)) {
        throw new VivaDailyHatasi("Geçersiz Viva katılım kimliği.", "GECERSIZ_GIRDI", 400);
      }
      const r = await istek(`rooms/${oda}/presence?userId=${sunucu}&limit=1`);
      basarili(r);
      const d = r.data as { total_count?: unknown; data?: unknown } | null;
      if (!d || !Number.isSafeInteger(d.total_count) || Number(d.total_count) < 0 || !Array.isArray(d.data)) {
        throw new VivaDailyHatasi("Sunucunun odada olduğu doğrulanamadı.", "TUTARSIZ_YANIT");
      }
      return d.data.some(p => p && typeof p === "object" && p.userId === sunucu && p.room === oda);
    },
    async tokenOlustur(ayarlar) {
      if (!/^viva-[0-9a-f]{32}-n[1-9][0-9]*$/.test(ayarlar.room_name)
        || !/^vi_[a-f0-9]{32}$/.test(ayarlar.user_id)
        || !Number.isSafeInteger(ayarlar.nbf) || !Number.isSafeInteger(ayarlar.exp)
        || ayarlar.exp <= ayarlar.nbf || ayarlar.exp <= Date.now() / 1000) {
        throw new VivaDailyHatasi("Geçersiz Viva katılım bilgisi.", "GECERSIZ_GIRDI", 400);
      }
      const r = await istek("meeting-tokens", "POST", { properties: ayarlar });
      basarili(r);
      const t = (r.data as { token?: unknown } | null)?.token;
      if (typeof t !== "string" || t.length > 16384 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(t)) {
        throw new VivaDailyHatasi("Daily katılım bilgisi doğrulanamadı.", "TUTARSIZ_YANIT");
      }
      return t;
    },
    async odaHazirla(v) {
      if (v.domain !== domain || !/^viva-[0-9a-f]{32}-n[1-9][0-9]*$/.test(v.oda_adi)) {
        throw new VivaDailyHatasi("Viva oda eşleştirmesi geçersiz.", "GECERSIZ_GIRDI", 400);
      }
      const properties = vivaDailyOdaAyarlari(v);
      const yol = `rooms/${encodeURIComponent(v.oda_adi)}`;
      // Daily API true olan varsayılan ekran paylaşımını config'te atlıyor,
      // false değerini açıkça dönüyor (özel test odasında doğrulandı).
      const ayarlarEslesiyor = (o: VivaDailyOda) => Object.entries(properties).every(([k, deger]) =>
        (k === "enable_screenshare" ? o.config[k] ?? true : o.config[k]) === deger);
      let r = await istek(yol);
      if (r.status === 404) {
        const olustur = await istek("rooms", "POST", { name: v.oda_adi, privacy: "private", properties });
        // Aynı adlı oda yarışta veya kaybolan bir yanıttan önce oluşmuş olabilir.
        if (olustur.status !== 400 && olustur.status !== 409) basarili(olustur);
        r = await istek(yol);
      }
      basarili(r);
      const oda = odaOku(r.data, v.oda_adi);
      if (ayarlarEslesiyor(oda)) return oda;
      const guncelle = await istek(yol, "POST", { privacy: "private", properties });
      basarili(guncelle);
      r = await istek(yol); basarili(r);
      const sonuc = odaOku(r.data, v.oda_adi);
      if (!ayarlarEslesiyor(sonuc)) {
        throw new VivaDailyHatasi("Daily oda ayarları henüz eşleşmedi. Yeniden deneyin.", "TUTARSIZ_YANIT");
      }
      return sonuc;
    },
  };
}
