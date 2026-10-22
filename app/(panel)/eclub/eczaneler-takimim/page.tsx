"use client";

import { panelBaslangici } from "@/lib/panel/baslangic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Edit3, Gift, LoaderCircle, Plus, Search, Trophy, Users, UserCheck } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import { ECLUB_GOREN_ROLLER, eclubKisiHedefRolu } from "@/lib/utils/roller";
import { EczaneBlogu } from "../listem/_components/EczaneBlogu";
import { useEclubListem } from "../listem/_hooks/useEclubListem";
import { glnGecerliMi, KISI_ROL_ETIKETLERI, type GlnSorguSonuc } from "../listem/_types";
import bmStyles from "@/app/(panel)/raporlar/bm/bm-report.module.css";
import { DepoTercihFormu } from "@/components/eclub/DepoTercihFormu";
import SayfaRehberi from "@/components/rehber/SayfaRehberi";
import BmEclubTakimim from "./_components/BmEclubTakimim";
import { SayfaYenileBasligi } from "@/components/ui/sayfa-yenile-basligi";

export default function EclubEczanelerimPage() {
  const { kullanici, yukleniyor } = useAuth();
  if (yukleniyor) return <div className="flex min-h-full items-center justify-center bg-[var(--tema-yerel-eclub-sayfa-zemini-02)]"><LoaderCircle className="size-6 animate-spin text-[var(--tema-yerel-eclub-yardimci-metin-08)]" /></div>;
  if ((kullanici?.rol ?? "").toLowerCase() === "bm") return <BmEclubTakimim />;
  if ((kullanici?.rol ?? "").toLowerCase() === "tm") return <BmEclubTakimim rol="tm" />;
  return <UttEclubEczanelerimPage />;
}

function UttEclubEczanelerimPage() {
  const router = useRouter();
  const { kullanici, yukleniyor: authYukleniyor } = useAuth();
  const { mesajlar, hata, basari } = useHataMesaji();
  const rolUygun = !!kullanici && ECLUB_GOREN_ROLLER.includes((kullanici.rol ?? "").toLowerCase());
  const hazir = !authYukleniyor && rolUygun;
  const {
    eczaneler, kisiler, gecisTalepleri, loading, yenileniyor, islemLoading, veriCek,
    glnSorgula, eczaneEkle, eczaneListedenCikar, kisiEkle, kisiGuncelle, kisiPasifeAl,
  } = useEclubListem({ hazir, hata, basari });

  const [eczaneFormAcik, setEczaneFormAcik] = useState(false);
  const [depoTercihleri, setDepoTercihleri] = useState<string[]>([]);
  const [depoHazir, setDepoHazir] = useState(false);
  const [yeniGln, setYeniGln] = useState("");
  const [sorguSonuc, setSorguSonuc] = useState<GlnSorguSonuc | null>(null);
  const [sorguLoading, setSorguLoading] = useState(false);
  const [elleAd, setElleAd] = useState("");
  const [elleIl, setElleIl] = useState("");
  const [elleIlce, setElleIlce] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Takım Adı Yönetimi
  const [takimAdi, setTakimAdi] = useState<string | null>(null);
  const [takimDuzenleniyor, setTakimDuzenleniyor] = useState(false);
  const [takimTaslak, setTakimTaslak] = useState("");
  const [takimKaydediliyor, setTakimKaydediliyor] = useState(false);

  const takimAdiCek = useCallback(async () => {
    if (!kullanici) return;
    try {
      const res = await fetch("/e-club-ligi/api/takim-adi");
      const d = await res.json();
      if (res.ok && d.takim_adi) {
        setTakimAdi(d.takim_adi);
        setTakimTaslak(d.takim_adi);
      }
    } catch {
      // sessiz
    }
  }, [kullanici]);

  const takimAdiKaydet = async () => {
    const yeniAd = takimTaslak.trim();
    if (!yeniAd || takimKaydediliyor) return;
    setTakimKaydediliyor(true);
    try {
      const res = await fetch("/e-club-ligi/api/takim-adi", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ takim_adi: yeniAd }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.hata ?? "Takım adı kaydedilemedi.");
      setTakimAdi(yeniAd);
      setTakimDuzenleniyor(false);
      basari("Takım adı kaydedildi.");
    } catch (err) {
      hata(err instanceof Error ? err.message : "Takım adı kaydedilemedi.");
    } finally {
      setTakimKaydediliyor(false);
    }
  };

  useEffect(() => {
    if (authYukleniyor) return;
    if (!kullanici) { router.push("/login"); return; }
    if (!rolUygun) router.push(panelBaslangici(kullanici.rol).yol);
    void takimAdiCek();
  }, [kullanici, authYukleniyor, rolUygun, router, takimAdiCek]);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const kisilerByEczane = useMemo(() => {
    const map = new Map<string, typeof kisiler>();
    for (const kisi of kisiler) {
      const grup = map.get(kisi.eczane_id) ?? [];
      grup.push(kisi);
      map.set(kisi.eczane_id, grup);
    }
    return map;
  }, [kisiler]);

  const toplamEczaci = useMemo(() => kisiler.filter(k => eclubKisiHedefRolu(k.rol) === "eczaci").length, [kisiler]);
  const toplamTeknisyen = useMemo(() => kisiler.filter(k => eclubKisiHedefRolu(k.rol) === "eczane_teknisyeni").length, [kisiler]);

  const gecislerByEczane = useMemo(() => {
    const map = new Map<string, typeof gecisTalepleri>();
    for (const talep of gecisTalepleri) {
      const grup = map.get(talep.eczane_id) ?? [];
      grup.push(talep);
      map.set(talep.eczane_id, grup);
    }
    return map;
  }, [gecisTalepleri]);

  const formTemizle = () => {
    setEczaneFormAcik(false);
    setYeniGln("");
    setDepoTercihleri([]);
    setDepoHazir(false);
    setSorguSonuc(null);
    setElleAd("");
    setElleIl("");
    setElleIlce("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  const glnDegisti = (deger: string) => {
    const temiz = deger.replace(/\D/g, "").slice(0, 13);
    setYeniGln(temiz);
    setSorguSonuc(null);
    setElleAd("");
    setElleIl("");
    setElleIlce("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!glnGecerliMi(temiz)) return;
    setSorguLoading(true);
    debounceRef.current = setTimeout(async () => {
      const sonuc = await glnSorgula(temiz);
      setSorguSonuc(sonuc);
      setSorguLoading(false);
    }, 500);
  };

  const listemeEkle = async () => {
    if (!depoHazir) return;
    const tamam = await eczaneEkle(yeniGln, { konumlar: depoTercihleri });
    if (tamam) formTemizle();
  };

  const onayaGonder = async () => {
    const tamam = await eczaneEkle(yeniGln, { eczane_adi: elleAd.trim(), il: elleIl.trim(), ilce: elleIlce.trim() });
    if (tamam) formTemizle();
  };

  const glnTamam = glnGecerliMi(yeniGln);
  const elleGecerli = elleAd.trim().length > 0 && elleIl.trim().length > 0;

  if (authYukleniyor || !kullanici || loading) {
    return <div className="flex min-h-full items-center justify-center bg-[var(--tema-yerel-eclub-sayfa-zemini-02)]"><LoaderCircle className="size-6 animate-spin text-[var(--tema-yerel-eclub-yardimci-metin-08)]" /></div>;
  }

  return (
    <div className="min-h-full bg-[var(--tema-yerel-eclub-sayfa-zemini-02)]" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <HataMesajiContainer mesajlar={mesajlar} />
      <div className="mx-auto flex max-w-[1480px] flex-col gap-4 px-3 py-4 md:px-6 md:py-5 lg:px-8 lg:py-7">
        <SayfaYenileBasligi className="flex flex-wrap items-end justify-between gap-4"
          baslik={<div className="inline-flex items-center">
            <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-[var(--tema-yerel-eclub-ana-metin-01)] md:text-[28px]">E-Club Takımım</h1>
            <SayfaRehberi anahtar="eclub-eczanelerim" className="ml-1.5 -translate-y-1.5" />
          </div>}

          aciklama={<>{takimDuzenleniyor ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                className="h-8 rounded-lg border border-[var(--tema-yerel-eclub-cizgi-08)] bg-[var(--tema-yerel-eclub-kart-01)] px-3 text-xs font-bold text-[var(--tema-yerel-eclub-ana-metin-04)] outline-none ring-2 ring-[var(--tema-yerel-eclub-odak-01)]"
                value={takimTaslak}
                onChange={(e) => setTakimTaslak(e.target.value)}
                maxLength={100}
                placeholder="Takım adı yazın (Örn: Ege Yıldızları)"
                autoFocus
              />
              <Button size="sm" onClick={() => void takimAdiKaydet()} disabled={takimKaydediliyor || !takimTaslak.trim()} className="h-8 bg-[var(--tema-yerel-eclub-eylem-zemin-01)] text-xs font-bold hover:bg-[var(--tema-yerel-eclub-eylem-zemin-02)]">Kaydet</Button>
              <Button size="sm" variant="ghost" onClick={() => { setTakimDuzenleniyor(false); setTakimTaslak(takimAdi ?? ""); }} className="h-8 text-xs font-bold text-[var(--tema-yerel-eclub-yardimci-metin-01)]">Vazgeç</Button>
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-2 text-sm text-[var(--tema-yerel-eclub-ana-metin-05)]">
              <span className="font-extrabold text-[var(--tema-yerel-eclub-ana-metin-04)]">{takimAdi || "Takımım"}</span>
              <span className="text-[var(--tema-yerel-eclub-yardimci-metin-09)]">·</span>
              <span className="font-semibold text-[var(--tema-yerel-eclub-yardimci-metin-10)]">{kullanici.ad} {kullanici.soyad}</span>
              <button
                type="button"
                onClick={() => setTakimDuzenleniyor(true)}
                className="ml-1 inline-flex items-center gap-1 rounded-md bg-[var(--tema-yerel-eclub-secim-zemin-04)] px-2 py-0.5 text-[10px] font-extrabold text-[var(--tema-yerel-eclub-eylem-metin-03)] hover:bg-[var(--tema-yerel-eclub-secim-zemin-02)]"
              >
                <Edit3 size={11} />
                {takimAdi ? "Takım adını düzenle" : "Takım adı ver"}
              </button>
            </div>
          )}
            <p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--tema-yerel-eclub-yardimci-metin-01)]">E‑Club takımınızı oluşturun; eczaneleri bağlayarak eczacı ve teknisyen kadronuzu yönetin.</p></>}
          aksiyon={<YenileButonu yenileniyor={yenileniyor} onYenile={() => veriCek()} disabled={eczaneFormAcik || islemLoading || takimDuzenleniyor} />}
          ekKontroller={<><div className="flex flex-col items-stretch gap-2">
            <Button
              type="button"
              onClick={() => router.push("/eclub/hediye-takip")}
              className="h-9 gap-2 border border-[var(--tema-yerel-eclub-cizgi-02)] bg-[var(--tema-yerel-eclub-secim-zemin-01)] px-3 text-xs font-extrabold text-[var(--tema-yerel-eclub-eylem-metin-02)] shadow-none hover:bg-[var(--tema-yerel-eclub-secim-zemin-02)]"
            >
              <Gift className="size-4" />
              Hediye Takip
            </Button>

          </div></>}
        />

        {/* Takım Özeti Kartları */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-[var(--tema-yerel-eclub-cizgi-03)] bg-[var(--tema-yerel-eclub-kart-01)] p-3.5 shadow-sm">
            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wide text-[var(--tema-yerel-eclub-yardimci-metin-06)]">
              <Building2 className="size-3.5 text-[var(--tema-yerel-eclub-eylem-metin-03)]" /> Bağlı Eczane
            </div>
            <strong className="mt-1 block text-2xl font-black text-[var(--tema-yerel-eclub-ana-metin-03)]">{eczaneler.length}</strong>
          </div>
          <div className="rounded-xl border border-[var(--tema-yerel-eclub-cizgi-03)] bg-[var(--tema-yerel-eclub-kart-01)] p-3.5 shadow-sm">
            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wide text-[var(--tema-yerel-eclub-yardimci-metin-06)]">
              <UserCheck className="size-3.5 text-[var(--tema-yerel-eclub-islevsel-metin-04)]" /> Eczacı
            </div>
            <strong className="mt-1 block text-2xl font-black text-[var(--tema-yerel-eclub-ana-metin-03)]">{toplamEczaci}</strong>
          </div>
          <div className="rounded-xl border border-[var(--tema-yerel-eclub-cizgi-03)] bg-[var(--tema-yerel-eclub-kart-01)] p-3.5 shadow-sm">
            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wide text-[var(--tema-yerel-eclub-yardimci-metin-06)]">
              <Users className="size-3.5 text-[var(--tema-yerel-eclub-islevsel-metin-05)]" /> Teknisyen
            </div>
            <strong className="mt-1 block text-2xl font-black text-[var(--tema-yerel-eclub-ana-metin-03)]">{toplamTeknisyen}</strong>
          </div>
          <div className="rounded-xl border border-[var(--tema-yerel-eclub-cizgi-09)] bg-[var(--tema-yerel-eclub-secim-zemin-03)] p-3.5 shadow-sm">
            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wide text-[var(--tema-yerel-eclub-eylem-metin-02)]">
              <Trophy className="size-3.5 text-[var(--tema-yerel-eclub-islevsel-metin-07)]" /> Takım Kadrosu
            </div>
            <strong className="mt-1 block text-2xl font-black text-[var(--tema-yerel-eclub-ana-metin-04)]">{kisiler.length} kişi</strong>
          </div>
        </section>

        <div className="flex w-full flex-col gap-4">
          {eczaneler.length === 0 && !eczaneFormAcik && <div className="rounded-xl border border-[var(--tema-yerel-eclub-cizgi-04)] bg-[var(--tema-yerel-eclub-kart-01)] px-5 py-8 text-center"><p className="m-0 text-sm text-[var(--tema-yerel-eclub-yardimci-metin-03)]">Henüz eczane eklenmedi. Aşağıdaki düğmeyle başlayın.</p></div>}

          {eczaneler.length > 0 && (
            <div className={bmStyles.tableWrap}>
              <table className={bmStyles.table}>
                <thead><tr><th>Eczane Adı</th><th>Eczacı Adı Soyadı</th><th aria-label="Yönetim" /></tr></thead>
                <tbody>
                  {eczaneler.map((eczane) => (
                    <EczaneBlogu key={eczane.eczane_id} eczane={eczane} kisiler={kisilerByEczane.get(eczane.eczane_id) ?? []} gecisTalepleri={gecislerByEczane.get(eczane.eczane_id) ?? []} islemLoading={islemLoading} onListedenCikar={eczaneListedenCikar} onKisiEkle={kisiEkle} onKisiGuncelle={kisiGuncelle} onKisiPasifeAl={kisiPasifeAl} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {eczaneFormAcik ? (
            <Card className="gap-0 overflow-hidden rounded-2xl border-[var(--tema-yerel-eclub-cizgi-03)] py-0 shadow-[0_7px_22px_var(--tema-yerel-eclub-golge-01)]">
              <CardHeader className="border-b border-[var(--tema-yerel-eclub-cizgi-10)] bg-[var(--tema-yerel-eclub-sayfa-zemini-05)] px-4 py-4 md:px-5">
                <div className="flex items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--tema-yerel-eclub-secim-zemin-05)] text-[var(--tema-yerel-eclub-eylem-metin-01)]"><Building2 className="size-5" /></span><div><CardTitle className="text-sm font-extrabold text-[var(--tema-yerel-eclub-ana-metin-06)]">Yeni Eczane</CardTitle><CardDescription className="mt-1 text-[11px] font-semibold text-[var(--tema-yerel-eclub-yardimci-metin-06)]">13 haneli GLN ile eczaneyi sorgulayın ve listenize ekleyin.</CardDescription></div></div>
              </CardHeader>

              <CardContent className="grid gap-4 px-4 py-4 md:px-5">
                <div className="grid max-w-md gap-1.5">
                  <Label htmlFor="yeni-eczane-gln" className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--tema-yerel-eclub-yardimci-metin-11)]">GLN</Label>
                  <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--tema-yerel-eclub-yardimci-metin-12)]" /><Input id="yeni-eczane-gln" value={yeniGln} onChange={(event) => glnDegisti(event.target.value)} placeholder="13 haneli GLN girin" maxLength={13} inputMode="numeric" autoFocus aria-invalid={!!yeniGln && !glnTamam} className="h-10 rounded-lg border-[var(--tema-yerel-eclub-cizgi-11)] bg-[var(--tema-yerel-eclub-kart-01)] pl-9 font-mono text-[var(--tema-yerel-eclub-ana-metin-07)] shadow-none focus-visible:border-[var(--tema-yerel-eclub-cizgi-12)] focus-visible:ring-[var(--tema-yerel-eclub-odak-02)]" /></div>
                  {yeniGln && !glnTamam && <p className="text-[11px] font-semibold text-[var(--tema-yerel-eclub-vurgu-metin-01)]">GLN 13 haneli sayı olmalıdır.</p>}
                </div>

                {glnTamam && sorguLoading && <div className="flex items-center gap-2 text-xs font-semibold text-[var(--tema-yerel-eclub-yardimci-metin-06)]"><LoaderCircle className="size-4 animate-spin" /> GLN sorgulanıyor…</div>}

                {glnTamam && !sorguLoading && sorguSonuc?.var && sorguSonuc.eczane && (
                  <div className="flex flex-col gap-3 rounded-xl border border-[var(--tema-yerel-eclub-cizgi-05)] bg-[var(--tema-yerel-eclub-sayfa-zemini-06)] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2"><div><span className="text-sm font-extrabold text-[var(--tema-yerel-eclub-ana-metin-06)]">{sorguSonuc.eczane.eczane_adi}</span><p className="mt-1 text-[11px] font-semibold text-[var(--tema-yerel-eclub-yardimci-metin-11)]">{sorguSonuc.eczane.il}{sorguSonuc.eczane.ilce ? ` / ${sorguSonuc.eczane.ilce}` : ""}</p></div><Badge variant="outline" className="border-[var(--tema-yerel-eclub-cizgi-07)] bg-[var(--tema-yerel-eclub-kart-01)] font-mono text-[var(--tema-yerel-eclub-yardimci-metin-02)]">GLN {sorguSonuc.eczane.gln}</Badge></div>
                    {(sorguSonuc.eczaci || (sorguSonuc.diger_kisiler?.length ?? 0) > 0) ? <div className="flex flex-wrap gap-2">{sorguSonuc.eczaci && <Badge variant="outline" className="border-[var(--tema-yerel-eclub-islevsel-cizgi-01)] bg-[var(--tema-yerel-eclub-islevsel-zemin-04)] text-[var(--tema-yerel-eclub-islevsel-metin-06)]">{KISI_ROL_ETIKETLERI.eczaci}: {sorguSonuc.eczaci.ad} {sorguSonuc.eczaci.soyad}</Badge>}{(sorguSonuc.diger_kisiler ?? []).map((kisi) => <Badge key={kisi.kisi_id} variant="outline" className={eclubKisiHedefRolu(kisi.rol) === "eczaci" ? "border-[var(--tema-yerel-eclub-islevsel-cizgi-01)] bg-[var(--tema-yerel-eclub-islevsel-zemin-04)] text-[var(--tema-yerel-eclub-islevsel-metin-06)]" : "border-[var(--tema-yerel-eclub-islevsel-cizgi-03)] bg-[var(--tema-yerel-eclub-islevsel-zemin-06)] text-[var(--tema-yerel-eclub-islevsel-metin-08)]"}>{KISI_ROL_ETIKETLERI[kisi.rol]}: {kisi.ad} {kisi.soyad}</Badge>)}</div> : <span className="text-[11px] font-semibold text-[var(--tema-yerel-eclub-yardimci-metin-07)]">Bu eczanede kayıtlı kişi yok.</span>}
                    {!sorguSonuc.listede && <DepoTercihFormu secili={depoTercihleri} onChange={setDepoTercihleri} onHazir={setDepoHazir} />}
                    {sorguSonuc.listede ? <span className="text-xs font-semibold text-[var(--tema-yerel-eclub-yardimci-metin-06)]">Bu eczane zaten listenizde.</span> : <div className="flex flex-wrap gap-2"><Button onClick={listemeEkle} disabled={islemLoading || !depoHazir} className="bg-[var(--tema-yerel-eclub-eylem-zemin-03)] font-extrabold hover:bg-[var(--tema-yerel-eclub-eylem-zemin-04)]">Listeme ekle</Button><Button variant="outline" onClick={formTemizle} className="border-[var(--tema-yerel-eclub-cizgi-11)] text-[var(--tema-yerel-eclub-yardimci-metin-02)]">Vazgeç</Button></div>}
                  </div>
                )}

                {glnTamam && !sorguLoading && sorguSonuc && !sorguSonuc.var && sorguSonuc.onay_bekliyor && <div className="flex flex-col gap-1.5 rounded-xl border border-[var(--tema-yerel-eclub-islevsel-cizgi-04)] bg-[var(--tema-yerel-eclub-islevsel-zemin-07)] p-4"><span className="text-sm font-extrabold text-[var(--tema-yerel-eclub-islevsel-metin-09)]">Bu eczane admin onayı bekliyor.</span><span className="text-xs font-semibold text-[var(--tema-yerel-eclub-islevsel-metin-10)]">Onaylandığında listenize ekleyebilirsiniz.</span><Button variant="outline" size="sm" onClick={formTemizle} className="mt-1 w-fit border-[var(--tema-yerel-eclub-islevsel-cizgi-04)] bg-[var(--tema-yerel-eclub-kart-01)] text-[var(--tema-yerel-eclub-islevsel-metin-09)]">Kapat</Button></div>}

                {glnTamam && !sorguLoading && sorguSonuc && !sorguSonuc.var && sorguSonuc.master_yok && (
                  <div className="grid gap-3 rounded-xl border border-[var(--tema-yerel-eclub-cizgi-05)] bg-[var(--tema-yerel-eclub-sayfa-zemini-06)] p-4">
                    <div><p className="text-sm font-extrabold text-[var(--tema-yerel-eclub-ana-metin-06)]">Eczane bilgilerini tamamlayın</p><p className="mt-1 text-[11px] font-semibold text-[var(--tema-yerel-eclub-yardimci-metin-06)]">Bu GLN resmi listede bulunamadı; kayıt admin onayına gönderilecektir.</p></div>
                    <div className="grid gap-3 md:grid-cols-2"><div className="grid gap-1.5 md:col-span-2"><Label className="text-[10px] text-[var(--tema-yerel-eclub-yardimci-metin-11)]">Eczane adı</Label><Input value={elleAd} onChange={(event) => setElleAd(event.target.value)} maxLength={200} className="border-[var(--tema-yerel-eclub-cizgi-11)] bg-[var(--tema-yerel-eclub-kart-01)] shadow-none" /></div><div className="grid gap-1.5"><Label className="text-[10px] text-[var(--tema-yerel-eclub-yardimci-metin-11)]">İl</Label><Input value={elleIl} onChange={(event) => setElleIl(event.target.value)} maxLength={100} className="border-[var(--tema-yerel-eclub-cizgi-11)] bg-[var(--tema-yerel-eclub-kart-01)] shadow-none" /></div><div className="grid gap-1.5"><Label className="text-[10px] text-[var(--tema-yerel-eclub-yardimci-metin-11)]">İlçe</Label><Input value={elleIlce} onChange={(event) => setElleIlce(event.target.value)} maxLength={100} className="border-[var(--tema-yerel-eclub-cizgi-11)] bg-[var(--tema-yerel-eclub-kart-01)] shadow-none" /></div></div>
                    <div className="flex flex-wrap gap-2"><Button onClick={onayaGonder} disabled={islemLoading || !elleGecerli} className="bg-[var(--tema-yerel-eclub-eylem-zemin-03)] font-extrabold hover:bg-[var(--tema-yerel-eclub-eylem-zemin-04)]">Onaya gönder</Button><Button variant="outline" onClick={formTemizle} className="border-[var(--tema-yerel-eclub-cizgi-11)] text-[var(--tema-yerel-eclub-yardimci-metin-02)]">Vazgeç</Button></div>
                  </div>
                )}

                {!glnTamam && <div className="flex justify-start"><Button variant="outline" onClick={formTemizle} className="border-[var(--tema-yerel-eclub-cizgi-11)] text-[var(--tema-yerel-eclub-yardimci-metin-02)]">Vazgeç</Button></div>}
              </CardContent>
            </Card>
          ) : <div className="flex justify-center"><Button onClick={() => setEczaneFormAcik(true)} className="rounded-xl bg-[var(--tema-yerel-eclub-eylem-zemin-03)] px-5 font-extrabold shadow-sm hover:bg-[var(--tema-yerel-eclub-eylem-zemin-04)]"><Plus />Yeni Eczane Ekle</Button></div>}
        </div>
      </div>
      <HataMesajiContainer mesajlar={mesajlar} />
    </div>
  );
}
