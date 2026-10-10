"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Check, CheckCircle2, Clock3, Copy, Gift, Store, XCircle } from "lucide-react";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import { useAuth } from "@/app/providers/AuthProvider";
import EclubHediyeCekiBilgiPaneli from "@/components/eclub/EclubHediyeCekiBilgiPaneli";
import { useEclubFirmaSecimi } from "@/components/eclub/EclubFirmaSecimi";
import { eclubUrunIcerigi } from "@/lib/eclub/firmaGezinme";
import { eclubFirmaYolu, type EclubGezinmeFirmasi } from "@/lib/eclub/firmaGezinme";
import { bildirimRozetleriniYenile } from "@/lib/bildirimler/rozet";
import {
  EclubKisiBaslik,
  EclubKisiBosDurum,
  EclubKisiSayfa,
  EclubKisiStat,
  EclubKisiYukleniyor,
} from "@/components/eclub/EclubKisiSayfa";
import {
  CEK_KODU_GORUNUR_DURUMLARI,
  CEK_TALEP_DURUM_META,
  CEK_TALEP_ISLEMDE_DURUMLARI,
  type CekTalepDurumu,
} from "@/lib/eclub/store/eclubStoreTipler";

interface CekTalebi {
  gorunum_testi_mi?: boolean;
  firma_id: string;
  talep_id: string;
  firma_adi: string;
  urun_id: string | null;
  urun_adi: string;
  talep_eden_kisi_id: string;
  toplanan_puan: number;
  talep_edilen_cek_tl: number;
  siparis_verildi_mi: boolean;
  siparis_adet: number;
  siparis_mal_fazlasi: number;
  durum: CekTalepDurumu;
  cek_kodu: string | null;
  created_at: string;
}

export default function EclubCekTaleplerimPage() {
  const router = useRouter();
  const secim = useEclubFirmaSecimi();
  const firmaId = useParams<{ firma_id?: string }>().firma_id ?? null;
  const searchParams = useSearchParams();
  const istekSirasi = useRef(0);
  const [firma, setFirma] = useState<EclubGezinmeFirmasi | null>(null);
  const [yuklenenKapsam, setYuklenenKapsam] = useState<string | null | undefined>(undefined);
  const { kullanici, yukleniyor: authYukleniyor } = useAuth();
  const { mesajlar, hata, basari } = useHataMesaji();
  const eclubKisi = !!kullanici && kullanici.kimlik_turu === "eclub_kisi";
  const [talepler, setTalepler] = useState<CekTalebi[]>([]);
  const gorunenTalepler = useMemo(() => secim.gomulu ? eclubUrunIcerigi(talepler, secim.urunId) : talepler, [talepler, secim.gomulu, secim.urunId]);
  const [loading, setLoading] = useState(true);
  const [islemId, setIslemId] = useState<string | null>(null);
  const [kopyalandiKod, setKopyalandiKod] = useState<string | null>(null);

  const kodKopyala = async (kod: string) => {
    await navigator.clipboard.writeText(kod);
    setKopyalandiKod(kod);
    setTimeout(() => setKopyalandiKod(null), 2000);
  };

  const talepleriCek = useCallback(async () => {
    const istek = ++istekSirasi.current;
    setLoading(true);
    try {
      const res = await fetch(`/eclub/api/cek-talepleri${firmaId ? `?firma_id=${encodeURIComponent(firmaId)}` : ""}`);
      const data = await res.json();
      if (istek !== istekSirasi.current) return;
      if (!res.ok) { setTalepler([]); setFirma(null); hata(data.hata ?? "Çek talepleri yüklenemedi.", data.adim, data.detay); return; }
      setFirma(data.firma ?? null);
      setTalepler(data.talepler ?? []);
    } catch (err) {
      if (istek !== istekSirasi.current) return;
      setTalepler([]); setFirma(null);
      hata("Çek talepleri yüklenirken hata oluştu.", "talepleriCek", err instanceof Error ? err.message : undefined);
    } finally {
      if (istek === istekSirasi.current) { setYuklenenKapsam(firmaId); setLoading(false); }
    }
  }, [hata, firmaId]);

  useEffect(() => {
    if (authYukleniyor) return;
    if (!kullanici) { router.replace("/login"); return; }
    if (!eclubKisi) { router.replace("/ana-sayfa"); return; }
    void talepleriCek();
    return () => { istekSirasi.current += 1; };
  }, [kullanici, authYukleniyor, eclubKisi, router, talepleriCek]);

  useEffect(() => {
    if (authYukleniyor || !eclubKisi || loading || yuklenenKapsam !== firmaId || (firmaId && !firma)) return;
    const hedef = talepler.find((talep) => talep.talep_id === searchParams.get("talep_id"));
    if (!firmaId && hedef) {
      router.replace(`${eclubFirmaYolu(hedef.firma_id, "cek-talepleri")}?talep_id=${encodeURIComponent(hedef.talep_id)}`);
      return;
    }
    if (secim.gomulu && hedef?.urun_id && hedef.urun_id !== secim.urunId) {
      router.replace(`${eclubFirmaYolu(hedef.firma_id, "cek-talepleri")}?urun_id=${encodeURIComponent(hedef.urun_id)}&talep_id=${encodeURIComponent(hedef.talep_id)}`, { scroll: false });
      return;
    }
    const okunacak = secim.gomulu ? gorunenTalepler.map((talep) => talep.talep_id) : [null];
    void Promise.all(okunacak.map((talepId) => fetch("/bildirimler/api", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kayit_turu: "cek", ...(firmaId ? { firma_id: firmaId } : {}), ...(talepId ? { talep_id: talepId } : {}) }),
    }))).then((yanitlar) => {
      if (yanitlar.some((yanit) => yanit.ok)) bildirimRozetleriniYenile();
    }).catch(() => {});
  }, [authYukleniyor, eclubKisi, firmaId, loading, yuklenenKapsam, firma, talepler, gorunenTalepler, secim.gomulu, secim.urunId, searchParams, router]);

  const ozet = useMemo(() => ({
    toplam: talepler.length,
    onayda: talepler.filter((talep) => CEK_TALEP_ISLEMDE_DURUMLARI.includes(talep.durum)).length,
    teslim: talepler.filter((talep) => talep.durum === "cek_kodlari_gonderildi").length,
    iptal: talepler.filter((talep) => talep.durum === "iptal").length,
  }), [talepler]);

  const talepIptal = async (talepId: string) => {
    setIslemId(talepId);
    try {
      const res = await fetch("/eclub/api/cek-talepleri", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ talep_id: talepId, action: "iptal", ...(firmaId ? { firma_id: firmaId } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) { hata(data.hata ?? "Talep iptal edilemedi.", data.adim, data.detay); return; }
      basari(data.mesaj ?? "Çek talebi iptal edildi.");
      await talepleriCek();
    } catch (err) {
      hata("İptal işlemi sırasında hata oluştu.", "talepIptal", err instanceof Error ? err.message : undefined);
    } finally {
      setIslemId(null);
    }
  };

  if (authYukleniyor || !kullanici || loading || yuklenenKapsam !== firmaId) return <EclubKisiYukleniyor />;

  return (
    <EclubKisiSayfa>
      <EclubHediyeCekiBilgiPaneli />
      {!secim.gomulu && <>
      <EclubKisiBaslik
        ikon={Gift}
        ustEtiket={firma?.firma_adi ?? ""}
        baslik="Çek Talepleri"
        aciklama="Hediye çeki taleplerinizi, onay durumlarını ve teslim edilen dijital çek kodlarını takip edin."
        aksiyon={<Link href={firmaId ? eclubFirmaYolu(firmaId, "hediye-cekleri") : "/eclub/store"} className="inline-flex items-center gap-2 rounded-xl border border-[#cfe3f4] bg-white px-4 py-2.5 text-xs font-extrabold text-[#237ac8] shadow-sm hover:bg-[#f4f9fd]"><Store size={15} /> Hediye Çeki Ekranına Dön</Link>}
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <EclubKisiStat ikon={Gift} etiket="Toplam Talep" deger={ozet.toplam} detay="Tüm çek talepleriniz" />
        <EclubKisiStat ikon={Clock3} etiket="Onay Sürecinde" deger={ozet.onayda} detay="UTT, BM, TM veya kod bekleyen" renk="#a66215" zemin="#fff6e8" />
        <EclubKisiStat ikon={CheckCircle2} etiket="Teslim Edilen" deger={ozet.teslim} detay="Kodu gönderilen çekler" renk="#16865f" zemin="#ebf8f2" />
        <EclubKisiStat ikon={XCircle} etiket="İptal" deger={ozet.iptal} detay="İptal edilen talepler" renk="#bc4b4b" zemin="#fff0f0" />
      </section>
      </>}

      {gorunenTalepler.length === 0 ? (
        <EclubKisiBosDurum ikon={Gift} baslik="Henüz çek talebiniz yok" aciklama="Uygun dönemde oluşturduğunuz hediye çeki talepleri burada görüntülenir." />
      ) : (
        <section className="grid gap-3">
          {gorunenTalepler.map((talep) => {
            const durum = CEK_TALEP_DURUM_META[talep.durum];
            const DurumIcon = talep.durum === "iptal" ? XCircle : talep.durum === "onaylandi" || talep.durum === "cek_kodlari_gonderildi" ? CheckCircle2 : Clock3;
            const islemSuruyor = islemId === talep.talep_id;
            return (
              <article key={talep.talep_id} className="rounded-2xl border border-[#dfe7f1] bg-white p-4 shadow-[0_6px_18px_rgba(31,55,90,0.035)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Gift size={26} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        {talep.gorunum_testi_mi && <span className="mb-1 inline-block rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-800">Test verisi · Salt okunur</span>}
                        <h2 className="text-sm font-extrabold text-[#203653]">{talep.urun_adi}</h2>
                        <p className="mt-0.5 text-[10px] font-semibold text-[#8a99aa]">{talep.firma_adi} · {new Date(talep.created_at).toLocaleDateString("tr-TR")}</p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold" style={{ color: durum.metin, background: durum.arka }}><DurumIcon size={12} /> {durum.etiket}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      <div className="rounded-xl bg-[#f5f8fb] px-3 py-2"><small className="block text-[9px] font-bold text-[#8190a3]">Kullanılan Puan</small><strong className="text-xs text-[#40556d]">{talep.toplanan_puan.toLocaleString("tr-TR")}</strong></div>
                      <div className="rounded-xl bg-[#f5f8fb] px-3 py-2"><small className="block text-[9px] font-bold text-[#8190a3]">Çek Tutarı</small><strong className="text-xs text-emerald-700">{talep.talep_edilen_cek_tl.toLocaleString("tr-TR")} TL</strong></div>
                      <div className="col-span-2 rounded-xl bg-[#f5f8fb] px-3 py-2 sm:col-span-1"><small className="block text-[9px] font-bold text-[#8190a3]">Satış Şartı</small><strong className="text-xs text-[#40556d]">{(talep.siparis_verildi_mi || (talep.gorunum_testi_mi && talep.siparis_adet > 0)) ? `${talep.siparis_adet} adet + ${talep.siparis_mal_fazlasi} MF` : "Siparişsiz"}</strong></div>
                    </div>
                    {CEK_KODU_GORUNUR_DURUMLARI.includes(talep.durum) && talep.cek_kodu && (
                      <div className="mt-2.5 rounded-xl border border-emerald-300 bg-emerald-50 p-3">
                        <span className="text-[11px] font-extrabold text-emerald-800">Migros Hediye Çeki Kodunuz</span>
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <span className="font-mono text-base font-black tracking-wider text-emerald-950">{talep.cek_kodu}</span>
                          <button type="button" onClick={() => void kodKopyala(talep.cek_kodu!)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-emerald-700">
                            {kopyalandiKod === talep.cek_kodu ? <Check size={13} /> : <Copy size={13} />}
                            {kopyalandiKod === talep.cek_kodu ? "Kopyalandı" : "Kopyala"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {talep.durum === "beklemede" && (
                    <button type="button" onClick={() => void talepIptal(talep.talep_id)} disabled={islemSuruyor || talep.gorunum_testi_mi} className="rounded-xl border border-[#f1cccc] bg-white px-4 py-2 text-xs font-extrabold text-[#bc4b4b] hover:bg-[#fff7f7] disabled:cursor-not-allowed disabled:opacity-60">{islemSuruyor ? "İşleniyor..." : "Talebi İptal Et"}</button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}
      <HataMesajiContainer mesajlar={mesajlar} />
    </EclubKisiSayfa>
  );
}
