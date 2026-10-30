"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog } from "radix-ui";
import { ChevronLeft, X } from "lucide-react";
import { useEclubOneriler } from "@/app/(panel)/eclub/oneriler/_hooks/useEclubOneriler";
import { EclubYayinGonderimKarti } from "@/app/(panel)/eclub/yayinlar/_components/EclubYayinGonderimKarti";
import { yayinAlicisiUygun } from "@/lib/eclub/yayinGonderimFiltreleri";
import { Button } from "@/components/ui/button";
import OgrenmeAraciOnizleme from "@/components/ogrenme-araci/OgrenmeAraciOnizleme";
import styles from "../token.module.css";
import type { OneriGecmisKaydi, OneriKisi, OneriYayin } from "@/app/(panel)/eclub/oneriler/_types";

const islemYok = () => {};

export default function TokenHoykModal({ yayinId, yayinKodu, onKapat, onKapanisOdagi, bm = false, tm = false, yonetici = false, tmId = "", bmId = "", uttId = "" }: {
  yayinId: string; yayinKodu: string; onKapat: () => void; onKapanisOdagi: () => void;
  bm?: boolean; tm?: boolean; yonetici?: boolean; tmId?: string; bmId?: string; uttId?: string;
}) {
  const yonetim = bm || tm || yonetici;
  const [hata, setHata] = useState("");
  const [detayAcik, setDetayAcik] = useState(false);
  const [onizlemeAcik, setOnizlemeAcik] = useState(false);
  const [onizlemeHatasi, setOnizlemeHatasi] = useState("");
  const onizlemeHatasiBildir = useCallback((mesaj: string) => setOnizlemeHatasi(mesaj), []);
  const [simdi] = useState(() => Date.now());
  const hataBildir = useCallback((mesaj: string) => setHata(mesaj), []);
  const uttVerisi = useEclubOneriler({ hazir: !yonetim, hata: hataBildir, basari: islemYok });
  const [bmVerisi, setBmVerisi] = useState<{ yayinlar: OneriYayin[]; kisiler: OneriKisi[]; oneriler: OneriGecmisKaydi[] } | null>(null);
  const [bmYukleniyor, setBmYukleniyor] = useState(yonetim);
  const [bmYenileme, setBmYenileme] = useState(0);
  useEffect(() => {
    if (!yonetim) return;
    const controller = new AbortController();setBmYukleniyor(true);setHata("");setBmVerisi(null);
    const params = new URLSearchParams({ token_yayin_id: yayinId });if (uttId) params.set("utt_id",uttId);if(tm||yonetici){params.set("token_gorunum",yonetici?"yonetici":"tm");if(yonetici&&tmId)params.set("tm_id",tmId);if(bmId)params.set("bm_id",bmId);}
    void (async () => {
      try {
        const res=await fetch(`/eclub/yayinlar/api/bm?${params}`,{cache:"no-store",signal:controller.signal});const json=await res.json();
        if(!res.ok)throw new Error(json.hata||"Yayın kartı alınamadı.");
        if(!controller.signal.aborted)setBmVerisi(json);
      } catch(err){if(!controller.signal.aborted)setHata(err instanceof Error?err.message:"Yayın kartı alınamadı.");}
      finally{if(!controller.signal.aborted)setBmYukleniyor(false);}
    })();
    return()=>controller.abort();
  },[yonetim,tm,yonetici,tmId,bmId,uttId,yayinId,bmYenileme]);
  const yayinlar = yonetim ? bmVerisi?.yayinlar ?? [] : uttVerisi.yayinlar;
  const kisiler = yonetim ? bmVerisi?.kisiler ?? [] : uttVerisi.kisiler;
  const gonderimGecmisi = yonetim ? bmVerisi?.oneriler ?? [] : uttVerisi.gonderimGecmisi;
  const loading = yonetim ? bmYukleniyor : uttVerisi.loading;
  const yenileniyor = !yonetim && uttVerisi.yenileniyor;
  const veriCek = () => yonetim ? setBmYenileme(n=>n+1) : void uttVerisi.veriCek();
  const gonderimKayitlari = gonderimGecmisi.filter(kayit => kayit.yayin_id === yayinId);
  // Yalnız oturumdaki UTT'nin gerçekten gönderdiği ve erişebildiği yayını göster.
  const yayin = gonderimKayitlari.length ? yayinlar.find(kayit => kayit.yayin_id === yayinId) : null;
  const hedefKisiler = yayin ? kisiler.filter(kisi => yayinAlicisiUygun(kisi, yayin)) : [];
  const gonderilenler = new Set(yonetim ? gonderimKayitlari.map(k=>k.kisi_id) : uttVerisi.gonderilenKisiler[yayinId] ?? []);

  return <Dialog.Root open onOpenChange={acik => { if (!acik) onKapat(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className={styles.hoykOrtusu} />
      <Dialog.Content className={`${styles.hoykModal} ${onizlemeAcik ? styles.hoykOnizlemeModal : ""}`} onCloseAutoFocus={event => { event.preventDefault(); onKapanisOdagi(); }}>
        <div className={styles.hoykModalBasligi}>
          <Dialog.Title>Gönderilen</Dialog.Title>
          <Dialog.Close asChild><button type="button" aria-label="Kapat" className={styles.hoykKapat}><X size={18} aria-hidden="true" /></button></Dialog.Close>
        </div>
        <Dialog.Description className="sr-only">{yayinKodu} yayın koduna ait kart ve gönderim bilgileri.</Dialog.Description>
        <div className={styles.hoykModalGovdesi}>
          {loading || yenileniyor ? <p role="status" className={styles.detayDurumu}>Yayın kartı yükleniyor…</p> : hata ? <div className={styles.detayHatasi}>
            <p role="alert">{hata}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => { setHata(""); void veriCek(); }}>Yeniden dene</Button>
          </div> : yayin ? onizlemeAcik ? <>
            <Button type="button" variant="outline" size="sm" onClick={() => { setOnizlemeAcik(false); setOnizlemeHatasi(""); }}><ChevronLeft aria-hidden="true" size={16} /> Karta dön</Button>
            <div className={styles.hoykOnizlemeIcerigi}>
              {onizlemeHatasi && <p role="alert" className={styles.detayHatasi}>{onizlemeHatasi}</p>}
              <OgrenmeAraciOnizleme yayinId={yayin.yayin_id} aracId={yayin.arac_id} aracTuru={yayin.arac_turu} videoUrl={yayin.video_url} urunAdi={yayin.urun_adi} hata={onizlemeHatasiBildir} onBitti={islemYok} />
            </div>
          </> : <EclubYayinGonderimKarti
            yayin={yayin} yeni={false} secili={false} secilebilir={false} secimGoster={false}
            gonderilenSayisi={hedefKisiler.filter(kisi => gonderilenler.has(kisi.kisi_id)).length}
            hedefKisiSayisi={hedefKisiler.length} gonderilecekGoster={false}
            gonderimDetayiGoster gonderimDetayiAcik={detayAcik} gonderimKayitlari={gonderimKayitlari} simdi={simdi}
            onSecim={islemYok} onOnizle={() => setOnizlemeAcik(true)} onGonderimDetayiAc={() => setDetayAcik(true)} onGonderimDetayiKapat={() => setDetayAcik(false)}
          /> : <p role="status" className={styles.detayDurumu}>Bu gönderilmiş yayın kartı artık görüntülenemiyor.</p>}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
