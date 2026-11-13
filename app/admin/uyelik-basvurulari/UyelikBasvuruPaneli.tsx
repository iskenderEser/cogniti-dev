"use client";

import { useEffect, useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import styles from "../admin.module.css";
import DavetDugmesi from "./DavetDugmesi";

type Basvuru = {
  id: string;
  firma_adi: string;
  web_sitesi: string | null;
  ad_soyad: string;
  eposta: string;
  cep_tel: string;
  olusturuldu_at: string;
  davet_bitis_at: string | null;
  kabul_at: string | null;
};

const tarih = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul",
});

export default function UyelikBasvuruPaneli() {
  const [basvurular, setBasvurular] = useState<Basvuru[] | null>(null);
  const [hata, setHata] = useState("");
  const [surum, setSurum] = useState(0);
  const [kontrolZamani, setKontrolZamani] = useState(0);
  const [silinecekId, setSilinecekId] = useState<string | null>(null);
  const [siliniyor, setSiliniyor] = useState(false);
  const [silmeHatasi, setSilmeHatasi] = useState("");
  const [bildirim, setBildirim] = useState("");

  useEffect(() => {
    const istek = new AbortController();
    async function yukle() {
      try {
        const yanit = await fetch("/admin/api/uyelik-basvurulari", { signal: istek.signal, cache: "no-store" });
        if (!yanit.ok) throw new Error();
        const kayitlar: Basvuru[] = await yanit.json();
        if (istek.signal.aborted) return;
        setKontrolZamani(Date.now());
        setBasvurular(kayitlar);
        setHata("");
      } catch {
        if (!istek.signal.aborted) setHata("Başvurular alınamadı.");
      }
    }
    void yukle();
    return () => istek.abort();
  }, [surum]);

  const yenile = () => setSurum(onceki => onceki + 1);

  async function basvuruyuSil(id: string) {
    if (siliniyor) return;
    setSiliniyor(true);
    setSilmeHatasi("");
    try {
      const yanit = await fetch("/admin/api/uyelik-basvurulari", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!yanit.ok) {
        const veri = await yanit.json().catch(() => null);
        setSilmeHatasi(veri?.hata || "Başvuru silinemedi. Tekrar deneyin.");
        return;
      }
      setBasvurular(kayitlar => kayitlar?.filter(kayit => kayit.id !== id) ?? null);
      setSilinecekId(null);
      setBildirim("Başvuru silindi.");
      yenile();
    } catch {
      setSilmeHatasi("Başvuru silinemedi. Tekrar deneyin.");
    } finally {
      setSiliniyor(false);
    }
  }

  if (hata) return <div className={styles.cardBody}>
    <p role="alert">{hata}</p>
    <button type="button" className={styles.button} onClick={yenile}>Tekrar dene</button>
  </div>;
  if (!basvurular) return <p role="status">Başvurular yükleniyor…</p>;
  const kartlar = basvurular.length ? basvurular : [null];

  return <div className={styles.stack}>
    <div role="status" hidden={!bildirim}>{bildirim}</div>
    {kartlar.map(aday => {
      const davetGecerli = Boolean(aday?.davet_bitis_at && Date.parse(aday.davet_bitis_at) > kontrolZamani);
      const durum = aday?.kabul_at ? "Davet kabul edildi" : davetGecerli ? "Davet gönderildi"
        : aday?.davet_bitis_at ? "Davetin süresi doldu" : "Ön incelemede";
      const davetEngeli = aday?.kabul_at ? "Bu başvurunun daveti zaten kabul edildi."
        : davetGecerli ? "Bu başvuru için geçerli bir davet var." : undefined;
      return <div key={aday?.id ?? "bos"}>
        <article className={styles.card}>
          {aday && <div className={styles.cardHeader}>
            <h2>{aday.firma_adi}</h2>
            <span className={styles.status}>{durum}</span>
          </div>}
          <div className={styles.cardBody}>
            <dl className={`${styles.partnerUyelikDetay} ${styles.uyelikBasvuruDetay}`}>
              <div><dt>Firmanın tam adı</dt><dd>{aday?.firma_adi ?? "—"}</dd></div>
              <div><dt>Firma web sitesi</dt><dd>{aday?.web_sitesi ?? "—"}</dd></div>
              <div><dt>Ad soyad</dt><dd>{aday?.ad_soyad ?? "—"}</dd></div>
              <div><dt>Kurumsal e-posta adresi</dt><dd>{aday?.eposta ?? "—"}</dd></div>
              <div><dt>Cep telefonu</dt><dd>{aday?.cep_tel ?? "—"}</dd></div>
              <div><dt>Başvuru tarihi</dt><dd>{aday ? tarih.format(new Date(aday.olusturuldu_at)) : "—"}</dd></div>
              {(!aday || (aday.davet_bitis_at && !aday.kabul_at)) && <div>
                <dt>Davetin son geçerlilik zamanı</dt>
                <dd>{aday?.davet_bitis_at ? tarih.format(new Date(aday.davet_bitis_at)) : "—"}</dd>
              </div>}
            </dl>
          </div>
        </article>
        <div className={`${styles.formActions} ${styles.uyelikBasvuruActions}`}>
          <DavetDugmesi id={aday?.id} engel={davetEngeli} onGonderildi={yenile} />
          {aday && <AlertDialog
            open={silinecekId === aday.id}
            onOpenChange={acik => {
              if (siliniyor) return;
              setSilinecekId(acik ? aday.id : null);
              setSilmeHatasi("");
              if (acik) setBildirim("");
            }}
          >
            <AlertDialogTrigger asChild>
              <button type="button" className={`${styles.button} ${styles.danger}`}>Sil</button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Başvuruyu sil</AlertDialogTitle>
                <AlertDialogDescription>
                  {aday.firma_adi} firmasının başvurusu kalıcı olarak silinecek.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {silmeHatasi && <p role="alert">{silmeHatasi}</p>}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={siliniyor}>Vazgeç</AlertDialogCancel>
                <AlertDialogAction disabled={siliniyor} onClick={olay => {
                  olay.preventDefault();
                  void basvuruyuSil(aday.id);
                }}>
                  {siliniyor ? "Siliniyor…" : "Sil"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>}
          {!aday && <AlertDialog>
            <AlertDialogTrigger asChild>
              <button type="button" className={`${styles.button} ${styles.danger}`}>Sil</button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Başvuruyu sil</AlertDialogTitle>
                <AlertDialogDescription>Silinecek başvuru yok.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Kapat</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>}
        </div>
      </div>;
    })}
  </div>;
}
