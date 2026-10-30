"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Users, UserCheck, UserX } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import { SayfaYenileBasligi } from "@/components/ui/sayfa-yenile-basligi";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "radix-ui";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { AdminEczanemUye, AdminEczanemUyeVerisi } from "@/lib/admin/eczanemUyeleri";
import { PASIFE_PUAN_KULLANIM_GUN } from "@/lib/eczanem/erisim";

const tarihYaz = (tarih: string | null) => tarih ? new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Istanbul" }).format(new Date(tarih)) : "—";
const butonSinifi = "bg-[var(--tema-yerel-yonetim-vurgu-zemin-01)] text-[var(--tema-yerel-yonetim-ters-metin-02)] hover:bg-[var(--tema-yerel-yonetim-islevsel-zemin-18)]";
const secimSinifi = "h-9 rounded-md border border-[var(--tema-yerel-yonetim-cizgi-08)] bg-[var(--tema-yerel-yonetim-kart-04)] px-3 text-sm text-[var(--tema-yerel-yonetim-ana-metin-08)]";

export default function EczanemUyeYonetimi({ firmaId, firmaAdi }: { firmaId: string; firmaAdi: string }) {
  const [veri, setVeri] = useState<AdminEczanemUyeVerisi | null>(null);
  const [filtre, setFiltre] = useState({ q: "", eczane_id: "", durum: "tumu", sayfa: 1 });
  const [arama, setArama] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [secili, setSecili] = useState<AdminEczanemUye | null>(null);
  const [onayAcik, setOnayAcik] = useState(false);
  const [kaydediyor, setKaydediyor] = useState(false);
  const istek = useRef<AbortController | null>(null);
  const kayitKilidi = useRef(false);
  const canli = useRef(true);
  const api = `/admin/api/firmalar/${encodeURIComponent(firmaId)}/eczanem/uyeler`;

  const yenile = useCallback(async () => {
    istek.current?.abort();
    const controller = new AbortController();
    istek.current = controller;
    setYukleniyor(true);
    setHata(null);
    try {
      const params = new URLSearchParams({ ...filtre, sayfa: String(filtre.sayfa) });
      const res = await fetch(`${api}?${params}`, { cache: "no-store", signal: controller.signal });
      const sonuc = await res.json();
      if (!res.ok) throw new Error(sonuc.hata ?? "Üyeler yüklenemedi.");
      if (!controller.signal.aborted) setVeri(sonuc);
    } catch (err) {
      if (!controller.signal.aborted) setHata(err instanceof Error ? err.message : "Üyeler yüklenemedi.");
    } finally {
      if (!controller.signal.aborted) setYukleniyor(false);
    }
  }, [api, filtre]);

  useEffect(() => { canli.current = true; void yenile(); return () => { canli.current = false; istek.current?.abort(); }; }, [yenile]);

  async function durumDegistir() {
    if (!secili || kayitKilidi.current) return;
    kayitKilidi.current = true;
    setKaydediyor(true);
    setMesaj(null);
    setHata(null);
    try {
      const res = await fetch(api, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        musteri_id: secili.musteri_id, eczane_id: secili.eczane_id,
        aktif_mi: !secili.aktif_mi, mevcut_aktif_mi: secili.aktif_mi,
      }) });
      const sonuc = await res.json();
      if (!canli.current) return;
      if (!res.ok) {
        setOnayAcik(false);
        if (res.status === 409) { setSecili(null); await yenile(); }
        setHata(sonuc.hata ?? "Üyelik durumu güncellenemedi.");
        return;
      }
      setOnayAcik(false);
      setSecili(null);
      setMesaj(sonuc.mesaj);
      await yenile();
    } catch {
      if (canli.current) { setOnayAcik(false); setHata("İşlem sonucu alınamadı. Yenile ile güncel üyelik durumunu kontrol edin."); }
    } finally {
      kayitKilidi.current = false;
      if (canli.current) setKaydediyor(false);
    }
  }

  return <section className="min-w-0 space-y-4" aria-label={`${firmaAdi} Eczanem üyeleri`}>
    <SayfaYenileBasligi
      baslik={<h2 className="text-lg font-bold text-[var(--tema-yerel-yonetim-ana-metin-05)]">Üyeler</h2>}
      aciklama={<p className="mt-1 text-xs text-[var(--tema-yerel-yonetim-yardimci-metin-06)]">{firmaAdi} firmasına bağlı eczanelerin üyelikleri. Her satır bir üyenin bir eczanedeki üyeliğidir.</p>}
      aksiyon={<YenileButonu yenileniyor={yukleniyor} disabled={kaydediyor} onYenile={() => { setMesaj(null); return yenile(); }} />} />
    {veri && <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {[
        { ad: "Toplam Üye", deger: veri.ozet.toplam_uye, ikon: Users },
        { ad: "Aktif Üyelik", deger: veri.ozet.aktif_uyelik, ikon: UserCheck },
        { ad: "Pasif Üyelik", deger: veri.ozet.pasif_uyelik, ikon: UserX },
      ].map(({ ad, deger, ikon: Icon }) => <div key={ad} className="flex items-center justify-between rounded-xl border border-[var(--tema-yerel-yonetim-cizgi-08)] bg-[var(--tema-yerel-yonetim-kart-04)] p-4"><div><p className="text-xs font-semibold text-[var(--tema-yerel-yonetim-yardimci-metin-06)]">{ad}</p><p className="mt-2 text-2xl font-extrabold text-[var(--tema-yerel-yonetim-ana-metin-05)]">{deger.toLocaleString("tr-TR")}</p></div><Icon className="size-6 text-[var(--tema-yerel-yonetim-vurgu-metin-01)]" /></div>)}
    </div>}
    {mesaj && <p role="status" className="rounded-lg border border-[var(--tema-yerel-yonetim-islevsel-cizgi-07)] bg-[var(--tema-yerel-yonetim-islevsel-zemin-13)] p-3 text-sm text-[var(--tema-yerel-yonetim-islevsel-metin-22)]">{mesaj}</p>}
    {hata && <div role="alert" className="rounded-lg border border-[var(--tema-yerel-yonetim-islevsel-cizgi-09)] bg-[var(--tema-yerel-yonetim-islevsel-zemin-15)] p-3 text-sm text-[var(--tema-yerel-yonetim-islevsel-metin-23)]">{hata}<Button type="button" variant="outline" size="sm" className="ml-3" disabled={kaydediyor || yukleniyor} onClick={() => { setSecili(null); void yenile(); }}>Tekrar dene</Button></div>}
    <div className="overflow-hidden rounded-xl border border-[var(--tema-yerel-yonetim-cizgi-08)] bg-[var(--tema-yerel-yonetim-kart-04)]">
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--tema-yerel-yonetim-cizgi-09)] p-4">
        <form className="flex min-w-0 flex-1 items-center gap-2 sm:min-w-64" onSubmit={(event) => { event.preventDefault(); setMesaj(null); setFiltre((f) => ({ ...f, q: arama.trim(), sayfa: 1 })); }}>
          <Input aria-label="Üye adı veya cep telefonu ara" placeholder="Ad veya cep telefonu ara" maxLength={80} value={arama} onChange={(event) => setArama(event.target.value)} disabled={kaydediyor} />
          <Button type="submit" size="sm" className={butonSinifi} disabled={kaydediyor}><Search className="size-4" /> Ara</Button>
        </form>
        <select aria-label="Eczane filtresi" className={`${secimSinifi} max-w-full sm:max-w-80`} value={filtre.eczane_id} disabled={kaydediyor || yukleniyor} onChange={(event) => { setMesaj(null); setFiltre((f) => ({ ...f, eczane_id: event.target.value, sayfa: 1 })); }}>
          <option value="">Tüm eczaneler</option>
          {veri?.eczaneler.map((eczane) => <option key={eczane.eczane_id} value={eczane.eczane_id}>{eczane.eczane_adi} · {eczane.gln}</option>)}
        </select>
      </div>
      <Table className="[&_th]:px-4 [&_th]:text-xs [&_th]:font-bold [&_td]:px-4 [&_td]:py-4 [&_td]:text-xs" aria-label="Eczanem üye listesi" aria-busy={yukleniyor}>
        <TableHeader className="bg-[var(--tema-yerel-yonetim-sayfa-zemini-08)]"><TableRow>
          <TableHead>Üye</TableHead><TableHead>Cep telefonu</TableHead><TableHead>E-posta</TableHead><TableHead className="text-center">Üye Yapan<br />Eczane</TableHead><TableHead>GLN</TableHead><TableHead>İl</TableHead><TableHead>İlçe</TableHead>
          <TableHead><select aria-label="Üyelik durumu filtresi" className="cursor-pointer bg-transparent py-2 text-xs font-bold" value={filtre.durum} disabled={kaydediyor || yukleniyor} onChange={(event) => { setMesaj(null); setFiltre((f) => ({ ...f, durum: event.target.value, sayfa: 1 })); }}>
            <option value="tumu">Üyelik · Tümü</option><option value="aktif">Üyelik · Aktif</option><option value="pasif">Üyelik · Pasif</option>
          </select></TableHead>
          <TableHead>Kayıt tarihi</TableHead><TableHead className="text-center">İşlem</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {yukleniyor ? <TableRow><TableCell colSpan={10} className="h-28 text-center text-[var(--tema-yerel-yonetim-yardimci-metin-06)]">Üyeler yükleniyor…</TableCell></TableRow>
            : hata ? <TableRow><TableCell colSpan={10} className="h-28 text-center text-[var(--tema-yerel-yonetim-yardimci-metin-06)]">Güncel liste alınamadı.</TableCell></TableRow>
              : !veri?.uyeler.length ? <TableRow><TableCell colSpan={10} className="h-28 text-center text-[var(--tema-yerel-yonetim-yardimci-metin-06)]">Bu kapsamda üye bulunamadı.</TableCell></TableRow>
                : veri.uyeler.map((uye) => <TableRow key={`${uye.musteri_id}:${uye.eczane_id}`}>
                  <TableCell className="font-bold text-[var(--tema-yerel-yonetim-ana-metin-05)]">{uye.ad_soyad}</TableCell><TableCell>{uye.telefon}</TableCell><TableCell>{uye.eposta ?? "—"}</TableCell>
                  <TableCell>{uye.eczane_adi}</TableCell><TableCell className="font-mono">{uye.gln}</TableCell><TableCell>{uye.il ?? "—"}</TableCell><TableCell>{uye.ilce ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline" className={uye.aktif_mi ? "border-[var(--tema-yerel-yonetim-islevsel-cizgi-07)] bg-[var(--tema-yerel-yonetim-islevsel-zemin-13)] text-[var(--tema-yerel-yonetim-islevsel-metin-22)]" : "border-[var(--tema-yerel-yonetim-islevsel-cizgi-12)] bg-[var(--tema-yerel-yonetim-islevsel-zemin-19)] text-[var(--tema-yerel-yonetim-islevsel-metin-25)]"}>{uye.aktif_mi ? "Aktif" : "Pasif"}</Badge></TableCell>
                  <TableCell>{tarihYaz(uye.created_at)}</TableCell><TableCell className="text-center"><Button type="button" size="sm" variant="outline" disabled={kaydediyor} onClick={() => { setSecili(uye); setOnayAcik(false); }}>Detay<span className="sr-only"> · {uye.ad_soyad} · {uye.eczane_adi}</span></Button></TableCell>
                </TableRow>)}
        </TableBody>
      </Table>
      {veri && !hata && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--tema-yerel-yonetim-cizgi-09)] p-4 text-xs text-[var(--tema-yerel-yonetim-yardimci-metin-06)]">
        <span>{veri.sayfalama.toplam} üyelik · Sayfa {veri.sayfalama.sayfa} / {veri.sayfalama.toplam_sayfa}</span>
        <div className="flex gap-2"><Button type="button" size="sm" variant="outline" disabled={yukleniyor || kaydediyor || veri.sayfalama.sayfa <= 1} onClick={() => setFiltre((f) => ({ ...f, sayfa: veri.sayfalama.sayfa - 1 }))}>Önceki</Button><Button type="button" size="sm" variant="outline" disabled={yukleniyor || kaydediyor || veri.sayfalama.sayfa >= veri.sayfalama.toplam_sayfa} onClick={() => setFiltre((f) => ({ ...f, sayfa: veri.sayfalama.sayfa + 1 }))}>Sonraki</Button></div>
      </div>}
    </div>
    <Dialog.Root open={!!secili} onOpenChange={(acik) => { if (!acik && !kaydediyor) { setSecili(null); setOnayAcik(false); } }}>
      <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--tema-yerel-yonetim-ortu-03)]/50" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 grid max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-xl border bg-[var(--tema-yerel-yonetim-kart-04)] p-6 shadow-lg"><div><Dialog.Title className="text-lg font-semibold">Üyelik detayı</Dialog.Title><Dialog.Description className="mt-1 text-sm text-[var(--tema-yerel-yonetim-yardimci-metin-06)]">{firmaAdi} · {secili?.eczane_adi}</Dialog.Description></div>
        {hata && <p role="alert" className="text-sm text-[var(--tema-yerel-yonetim-islevsel-metin-23)]">{hata}</p>}
        {secili && <>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm [&_dt]:text-[var(--tema-yerel-yonetim-yardimci-metin-06)] [&_dd]:break-words">
            <dt>Üye</dt><dd className="font-semibold">{secili.ad_soyad}</dd><dt>Cep telefonu</dt><dd>{secili.telefon}</dd><dt>E-posta</dt><dd>{secili.eposta ?? "—"}</dd>
            <dt>Üye Yapan Eczane</dt><dd>{secili.eczane_adi}</dd><dt>GLN</dt><dd>{secili.gln}</dd><dt>İl</dt><dd>{secili.il ?? "—"}</dd><dt>İlçe</dt><dd>{secili.ilce ?? "—"}</dd><dt>Üyelik</dt><dd>{secili.aktif_mi ? "Aktif" : "Pasif"}</dd>
            <dt>Hesap</dt><dd>{secili.hesap_aktif_mi ? "Aktif" : "Kapalı"}</dd><dt>Kayıt tarihi</dt><dd>{tarihYaz(secili.created_at)}</dd><dt>Son işlem</dt><dd>{tarihYaz(secili.son_islem_tarihi)}</dd>
          </dl>
          {!secili.hesap_aktif_mi && !secili.aktif_mi && <p className="text-xs text-[var(--tema-yerel-yonetim-yardimci-metin-06)]">Hesabı kapalı üyenin üyeliği aktifleştirilemez.</p>}
          <Button type="button" className={butonSinifi} disabled={kaydediyor || (!secili.aktif_mi && !secili.hesap_aktif_mi)} onClick={() => setOnayAcik(true)}>{secili.aktif_mi ? "Üyeliği pasife al" : "Üyeliği aktifleştir"}</Button>
        </>}
      <Dialog.Close asChild><Button type="button" variant="outline" disabled={kaydediyor}>Kapat</Button></Dialog.Close></Dialog.Content></Dialog.Portal>
    </Dialog.Root>
    <AlertDialog open={onayAcik} onOpenChange={(acik) => { if (!kaydediyor) setOnayAcik(acik); }}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{secili?.aktif_mi ? "Üyelik pasife alınsın mı?" : "Üyelik aktifleştirilsin mi?"}</AlertDialogTitle><AlertDialogDescription>
        {secili?.ad_soyad} · {secili?.eczane_adi} · GLN: {secili?.gln}. Bu eczanedeki üyelik {secili?.aktif_mi ? "pasife alınacak" : "aktifleştirilecek"}.
        {secili?.aktif_mi && ` Yeni yayın kazanımı kapanır; mevcut puanların ${PASIFE_PUAN_KULLANIM_GUN} günlük kullanım kuralı korunur.`}
      </AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={kaydediyor}>Vazgeç</AlertDialogCancel><AlertDialogAction className={butonSinifi} disabled={kaydediyor} onClick={(event) => { event.preventDefault(); void durumDegistir(); }}>{kaydediyor ? "Kaydediliyor…" : "Onayla"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
  </section>;
}
