"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Clock3, Gift, Store, XCircle } from "lucide-react";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import { useAuth } from "@/app/providers/AuthProvider";
import { cekTakipOnbellegi, type CekTalebi, type CekTakipVerisi } from "@/lib/eclub/store/cekTakipOnbellek";
import { vitrinOnbellegi } from "@/lib/eclub/store/vitrinOnbellek";
import EclubFirmaCekTakibiSkeleton from "@/components/eclub/EclubFirmaCekTakibiSkeleton";
import EclubCekTakipVitrinKarti from "@/components/eclub/EclubCekTakipVitrinKarti";
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
  CEK_TALEP_ISLEMDE_DURUMLARI,
} from "@/lib/eclub/store/eclubStoreTipler";


export default function EclubCekTaleplerimPage() {
  const router = useRouter();
  const secim = useEclubFirmaSecimi();
  const firmaId = secim.firmaId ?? null;
  const searchParams = useSearchParams();
  const istekSirasi = useRef(0);
  const [firma, setFirma] = useState<EclubGezinmeFirmasi | null>(null);
  const [yuklenenKapsam, setYuklenenKapsam] = useState<string | null | undefined>(undefined);
  const { kullanici, yukleniyor: authYukleniyor } = useAuth();
  const { mesajlar, hata, basari } = useHataMesaji();
  const [yuklenenOnbellek, setYuklenenOnbellek] = useState<string | null>(null);
  const [dogrulaniyor, setDogrulaniyor] = useState(false);
  const onbellekAnahtari = secim.gomulu && kullanici?.kimlik_turu === "eclub_kisi" ? `${kullanici.id}:${firmaId ?? "genel"}` : null;
  const eclubKisi = !!kullanici && kullanici.kimlik_turu === "eclub_kisi";
  const [talepler, setTalepler] = useState<CekTalebi[]>([]);
  const gorunenTalepler = useMemo(() => secim.gomulu ? eclubUrunIcerigi(talepler, secim.urunId) : talepler, [talepler, secim.gomulu, secim.urunId]);
  const [loading, setLoading] = useState(true);
  const [islemId, setIslemId] = useState<string | null>(null);

  const talepleriCek = useCallback(async (onbellekten = false) => {
    const istek = ++istekSirasi.current;
    setLoading(true);
    setDogrulaniyor(true);
    try {
      const kayit = onbellekten && onbellekAnahtari ? cekTakipOnbellegi.oku(onbellekAnahtari, 300_000) : null;
      if (kayit) {
        setFirma(kayit.firma ?? null); setTalepler(kayit.talepler ?? []);
        setYuklenenKapsam(firmaId); setYuklenenOnbellek(onbellekAnahtari); setLoading(false);
      }
      const yukle = async (): Promise<CekTakipVerisi> => {
        const res = await fetch(`/eclub/api/cek-talepleri${firmaId ? `?firma_id=${encodeURIComponent(firmaId)}` : ""}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw Object.assign(new Error(data.hata ?? "Çek talepleri yüklenemedi."), { api: true, adim: data.adim, detay: data.detay });
        return data;
      };
      const data = onbellekAnahtari ? await cekTakipOnbellegi.iste(onbellekAnahtari, yukle, !onbellekten) : await yukle();
      if (istek !== istekSirasi.current) return;
      setFirma(data.firma ?? null);
      setTalepler(data.talepler ?? []);
    } catch (err) {
      if (istek !== istekSirasi.current) return;
      setTalepler([]); setFirma(null);
      const apiHatasi = err as { api?: boolean; adim?: string; detay?: string };
      if (apiHatasi?.api && err instanceof Error) hata(err.message, apiHatasi.adim, apiHatasi.detay);
      else hata("Çek talepleri yüklenirken hata oluştu.", "talepleriCek", err instanceof Error ? err.message : undefined);
    } finally {
      if (istek === istekSirasi.current) { setYuklenenKapsam(firmaId); setYuklenenOnbellek(onbellekAnahtari); setLoading(false); setDogrulaniyor(false); }
    }
  }, [hata, firmaId, onbellekAnahtari]);

  useEffect(() => {
    if (authYukleniyor) return;
    if (!kullanici) { router.replace("/login"); return; }
    if (!eclubKisi) { router.replace("/ana-sayfa"); return; }
    void talepleriCek(true);
    return () => { istekSirasi.current += 1; };
  }, [kullanici, authYukleniyor, eclubKisi, router, talepleriCek]);

  useEffect(() => {
    if (authYukleniyor || !eclubKisi || dogrulaniyor || loading || yuklenenKapsam !== firmaId || yuklenenOnbellek !== onbellekAnahtari || (firmaId && !firma)) return;
    const hedef = talepler.find((talep) => talep.talep_id === searchParams.get("talep_id"));
    if (!firmaId && hedef) {
      router.replace(`${eclubFirmaYolu(hedef.firma_adi, "cek-talepleri")}?talep_id=${encodeURIComponent(hedef.talep_id)}`);
      return;
    }
    if (secim.gomulu && hedef?.urun_id && hedef.urun_id !== secim.urunId) {
      router.replace(`${eclubFirmaYolu(hedef.firma_adi, "cek-talepleri")}?urun_id=${encodeURIComponent(hedef.urun_id)}&talep_id=${encodeURIComponent(hedef.talep_id)}`, { scroll: false });
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
  }, [authYukleniyor, eclubKisi, firmaId, dogrulaniyor, loading, yuklenenKapsam, yuklenenOnbellek, onbellekAnahtari, firma, talepler, gorunenTalepler, secim.gomulu, secim.urunId, searchParams, router]);

  const ozet = useMemo(() => ({
    toplam: talepler.length,
    onayda: talepler.filter((talep) => CEK_TALEP_ISLEMDE_DURUMLARI.includes(talep.durum)).length,
    teslim: talepler.filter((talep) => talep.durum === "cek_kodlari_gonderildi").length,
    iptal: talepler.filter((talep) => talep.durum === "iptal").length,
  }), [talepler]);

  const talepIptal = async (talepId: string) => {
    if (dogrulaniyor) return;
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
      if (onbellekAnahtari) { cekTakipOnbellegi.sil(onbellekAnahtari); vitrinOnbellegi.sil(onbellekAnahtari); }
      await Promise.all([talepleriCek(), secim.panel?.veriCek(true)]);
    } catch (err) {
      hata("İptal işlemi sırasında hata oluştu.", "talepIptal", err instanceof Error ? err.message : undefined);
    } finally {
      setIslemId(null);
    }
  };

  if (authYukleniyor || !kullanici || loading || yuklenenKapsam !== firmaId || yuklenenOnbellek !== onbellekAnahtari) return secim.gomulu ? <EclubFirmaCekTakibiSkeleton /> : <EclubKisiYukleniyor />;

  return (
    <EclubKisiSayfa>
      <EclubHediyeCekiBilgiPaneli />
      {!secim.gomulu && <>
      <EclubKisiBaslik
        ikon={Gift}
        ustEtiket={firma?.firma_adi ?? ""}
        baslik="Çek Talepleri"
        aciklama="Hediye çeki taleplerinizi, onay durumlarını ve teslim edilen dijital çek kodlarını takip edin."
        aksiyon={<Link href={firmaId ? eclubFirmaYolu(firma?.firma_adi ?? firmaId, "hediye-cekleri") : "/eclub/store"} className="inline-flex items-center gap-2 rounded-xl border border-[#cfe3f4] bg-white px-4 py-2.5 text-xs font-extrabold text-[#237ac8] shadow-sm hover:bg-[#f4f9fd]"><Store size={15} /> Hediye Çeki Ekranına Dön</Link>}
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
          {gorunenTalepler.map((talep) => (
            <EclubCekTakipVitrinKarti
              key={talep.talep_id}
              talep={talep}
              iptalEdiliyor={islemId === talep.talep_id}
              dogrulaniyor={dogrulaniyor}
              onIptal={() => void talepIptal(talep.talep_id)}
            />
          ))}
        </section>
      )}
      <HataMesajiContainer mesajlar={mesajlar} />
    </EclubKisiSayfa>
  );
}
