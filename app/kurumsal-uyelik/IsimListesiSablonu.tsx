"use client";

import { Download, Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle } from "@/components/ui/alert-dialog";
import adminStyles from "@/app/admin/admin.module.css";
import styles from "@/app/login/login.module.css";
import { rolCoz, turkceKatla } from "@/lib/admin/kullaniciDogrulama";
import { SUREC1_TOAST } from "@/lib/bildirimler/toastMesajlari";
import { TUKETICI_ROLLER, URETICI_ROLLER, YONLENDIRICI_ROLLER, YONETICI_ROLLER } from "@/lib/utils/roller";

import { BARKOD_BICIMI, BARKOD_DESENI } from "./barkod";
import { taslakOku, taslakSil, taslakYaz } from "./kurumsalTaslak";

const CEP_TELEFONU_BICIMI = "5[0-9]{9}";
const CEP_TELEFONU_DESENI = new RegExp(`^${CEP_TELEFONU_BICIMI}$`);
const EPOSTA_DESENI = /^[^\s@]+@[^\s@]+$/;
const FIRMA_LISTESI_ROLLERI = new Set([...URETICI_ROLLER, ...YONETICI_ROLLER, ...YONLENDIRICI_ROLLER, ...TUKETICI_ROLLER]);

type ListeSatiri = { id: number; hucreler: string[] };

async function rolDonusumleriniAl() {
  const yanit = await fetch("/kurumsal-uyelik/api/rol-donusumleri", { cache: "no-store" });
  if (!yanit.ok) throw new Error("Unvan eşleştirmeleri alınamadı.");
  const kayitlar: { unvan_anahtari: string; rol_kodu: string }[] = await yanit.json();
  return new Map(kayitlar.map(kayit => [kayit.unvan_anahtari, kayit.rol_kodu]));
}

async function wordTablolari(dosya: File): Promise<string[][][]> {
  const mammoth = await import("mammoth");
  const { value } = await mammoth.convertToHtml({ arrayBuffer: await dosya.arrayBuffer() });
  const sablon = document.createElement("template");
  sablon.innerHTML = value;
  return Array.from(sablon.content.querySelectorAll("table"))
    .filter(tablo => !tablo.parentElement?.closest("table") && !tablo.querySelector("table"))
    .map(tablo => Array.from(tablo.rows, satir => Array.from(satir.cells)))
    .filter(satirlar => satirlar.length > 0 && satirlar.every(satir =>
      satir.length === satirlar[0].length && satir.every(hucre => hucre.colSpan === 1 && hucre.rowSpan === 1),
    ))
    .map(satirlar => satirlar.map(satir => satir.map(hucre => (hucre.textContent ?? "").trim())));
}

async function excelTablosu(dosya: File): Promise<string[][]> {
  const XLSX = await import("xlsx");
  const kitap = XLSX.read(await dosya.arrayBuffer(), { type: "array" });
  const sayfa = kitap.Sheets[kitap.SheetNames[0]];
  return sayfa ? XLSX.utils.sheet_to_json<string[]>(sayfa, { header: 1, defval: "", raw: false, blankrows: false }) : [];
}

export default function IsimListesiSablonu({
  sutunlar,
  urunListesi = false,
  kurumsalBasvuru = false,
  ilkSatirlar,
  kilitli = false,
  onSatirlarDegisti,
  onTaslakKaydet,
  onBasari,
  onHata,
}: {
  sutunlar: string[];
  urunListesi?: boolean;
  kurumsalBasvuru?: boolean;
  ilkSatirlar?: string[][];
  kilitli?: boolean;
  onSatirlarDegisti?: (satirlar: string[][]) => void;
  onTaslakKaydet?: (satirlar: string[][]) => Promise<{ ok: true } | { ok: false; hata: string }>;
  onBasari?: (mesaj: string) => void;
  onHata?: (mesaj: string) => void;
}) {
  const listeKodu = urunListesi ? "urun-listesi" : "isim-listesi";
  const taslakAnahtari = `cogniti_kurumsal_taslak_liste_${listeKodu}`;
  const listeApi = `/kurumsal-uyelik/api/${listeKodu}`;
  const baslik = urunListesi ? "Ürün Listesi" : "İsim Listesi";
  const dosyaAdi = urunListesi ? "Cogniti Ürün Listesi" : "Cogniti Firma Listesi";
  const [hazirlaniyor, setHazirlaniyor] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [satirlar, setSatirlar] = useState<ListeSatiri[]>(() =>
    kurumsalBasvuru && Array.isArray(ilkSatirlar)
      ? ilkSatirlar.map((hucreler, idx) => ({ id: idx, hucreler }))
      : []
  );
  const [silinecekSatirId, setSilinecekSatirId] = useState<number | null>(null);
  const [rolDonusumleri, setRolDonusumleri] = useState<Map<string, string> | null>(null);
  const [eslesmelerYukleniyor, setEslesmelerYukleniyor] = useState(false);
  const [modal, setModal] = useState<"vazgec" | "gonder" | null>(null);
  const [islemSuruyor, setIslemSuruyor] = useState(false);
  const [gonderildi, setGonderildi] = useState(kilitli);
  const dosyaAlani = useRef<HTMLInputElement>(null);
  const listeyeDokunuldu = useRef(false);
  const sonrakiSatirId = useRef(kurumsalBasvuru && Array.isArray(ilkSatirlar) ? ilkSatirlar.length : 0);
  const satirEkleDugmesi = useRef<HTMLButtonElement>(null);
  const satirSilDugmesi = useRef<HTMLButtonElement | null>(null);
  const hataBildir = (mesaj: string) => {
    if (mesaj) onHata?.(mesaj);
  };

  useEffect(() => {
    if (kurumsalBasvuru) {
      setGonderildi(kilitli);
    }
  }, [kurumsalBasvuru, kilitli]);

  useEffect(() => {
    if (kurumsalBasvuru) {
      onSatirlarDegisti?.(satirlar.map(satir => satir.hucreler));
    }
  }, [kurumsalBasvuru, satirlar, onSatirlarDegisti]);

  useEffect(() => {
    if (kurumsalBasvuru) {
      if (urunListesi) return;
      const kontrol = new AbortController();
      void (async () => {
        try {
          const donusumler = await rolDonusumleriniAl();
          if (!kontrol.signal.aborted) setRolDonusumleri(donusumler);
        } catch {
          if (!kontrol.signal.aborted) onHata?.("Unvan eşleştirmeleri alınamadı.");
        }
      })();
      return () => kontrol.abort();
    }
    const kayitliTaslak = taslakOku<string[][]>(taslakAnahtari);
    if (Array.isArray(kayitliTaslak) && kayitliTaslak.length > 0) {
      listeyeDokunuldu.current = true;
      setSatirlar(kayitliTaslak.map((hucreler: string[]) => ({
        id: sonrakiSatirId.current++, hucreler,
      })));
    }
    const kontrol = new AbortController();
    void (async () => {
      try {
        const yanit = await fetch(listeApi, { signal: kontrol.signal, cache: "no-store" });
        if (!yanit.ok) return;
        const liste = await yanit.json();
        if (kontrol.signal.aborted) return;
        setGonderildi(Boolean(liste?.gonderildi_at));
        if (!listeyeDokunuldu.current && Array.isArray(liste?.satirlar)) {
          setSatirlar(liste.satirlar.map((hucreler: string[]) => ({
            id: sonrakiSatirId.current++, hucreler,
          })));
        }
        if (urunListesi) return;
        const donusumler = await rolDonusumleriniAl();
        if (!kontrol.signal.aborted) setRolDonusumleri(donusumler);
      } catch {
        if (!kontrol.signal.aborted) onHata?.("Kayıtlı liste veya unvan eşleştirmeleri alınamadı.");
      }
    })();
    return () => kontrol.abort();
  }, [kurumsalBasvuru, listeApi, onHata, taslakAnahtari, urunListesi]);

  useEffect(() => {
    if (kurumsalBasvuru || !listeyeDokunuldu.current || gonderildi) return;
    if (satirlar.length === 0) {
      taslakSil(taslakAnahtari);
    } else {
      taslakYaz(taslakAnahtari, satirlar.map(satir => satir.hucreler));
    }
  }, [kurumsalBasvuru, satirlar, gonderildi, taslakAnahtari]);

  async function listeIsle(islem: "sil" | "kaydet" | "gonder") {
    if (islemSuruyor) return;
    if (islem !== "sil" && !satirlar.some(satir => satir.hucreler.some(hucre => hucre.trim()))) {
      setModal(null);
      hataBildir("Önce listeye en az bir kayıt ekleyin.");
      return;
    }
    listeyeDokunuldu.current = true;
    setIslemSuruyor(true);
    try {
      if (kurumsalBasvuru && onTaslakKaydet) {
        const gonderilecek = islem === "sil" ? [] : satirlar.map(satir => satir.hucreler);
        const sonuc = await onTaslakKaydet(gonderilecek);
        if (!sonuc.ok) throw new Error(sonuc.hata);
        if (islem === "sil") setSatirlar([]);
        taslakSil(taslakAnahtari);
        setModal(null);
        onBasari?.(
          islem === "sil"
            ? SUREC1_TOAST.listeSilindi(urunListesi)
            : SUREC1_TOAST.listeTaslakKaydedildi(urunListesi)
        );
        return;
      }
      const yanit = await fetch(listeApi, islem === "sil" ? { method: "DELETE" } : {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ satirlar: satirlar.map(satir => satir.hucreler), gonder: islem === "gonder" }),
      });
      if (!yanit.ok) {
        const veri = await yanit.json();
        throw new Error(yanit.status === 401 ? "Bu işlem için giriş yapın." : veri.hata ?? veri.error);
      }
      if (islem === "sil") setSatirlar([]);
      if (islem === "gonder") setGonderildi(true);
      taslakSil(taslakAnahtari);
      setModal(null);
      onBasari?.(
        islem === "sil"
          ? SUREC1_TOAST.listeSilindi(urunListesi)
          : SUREC1_TOAST.listeTaslakKaydedildi(urunListesi)
      );
    } catch (error) {
      setModal(null);
      hataBildir(error instanceof Error && error.message ? error.message : "Liste işlemi tamamlanamadı.");
    } finally {
      setIslemSuruyor(false);
    }
  }

  async function satirEkle() {
    listeyeDokunuldu.current = true;
    const satir = { id: sonrakiSatirId.current++, hucreler: sutunlar.map(() => "") };
    setSatirlar(onceki => [...onceki, satir]);
    if (urunListesi || rolDonusumleri || eslesmelerYukleniyor) return;

    setEslesmelerYukleniyor(true);
    try {
      setRolDonusumleri(await rolDonusumleriniAl());
    } catch {
      hataBildir("Unvan eşleştirmeleri alınamadı.");
    } finally {
      setEslesmelerYukleniyor(false);
    }
  }

  function satiriSil(id: number) {
    listeyeDokunuldu.current = true;
    setSatirlar(onceki => onceki.filter(satir => satir.id !== id));
    setSilinecekSatirId(null);
  }

  async function excelIndir() {
    setHazirlaniyor(true);
    try {
      const XLSX = await import("xlsx");
      const kitap = XLSX.utils.book_new();
      const sayfa = XLSX.utils.aoa_to_sheet([sutunlar, ...indirilecekSatirlar]);
      if (urunListesi) {
        for (let satir = 2; satir <= indirilecekSatirlar.length + 1; satir++) {
          sayfa[`B${satir}`].z = "@";
        }
      }
      XLSX.utils.book_append_sheet(kitap, sayfa, baslik);
      XLSX.writeFile(kitap, `${dosyaAdi}.xlsx`);
    } catch {
      hataBildir("Excel dosyası indirilemedi. Tekrar deneyin.");
    } finally {
      setHazirlaniyor(false);
    }
  }

  async function listeYukle(dosya: File) {
    listeyeDokunuldu.current = true;
    setYukleniyor(true);
    try {
      const word = /\.docx$/i.test(dosya.name);
      if (!word && !/\.xlsx?$/i.test(dosya.name)) {
        hataBildir("Bir Excel (.xlsx, .xls) veya Word (.docx) dosyası seçin.");
        return;
      }
      const tablolar = word ? await wordTablolari(dosya) : [await excelTablosu(dosya)];
      const eslesenler = tablolar.flatMap(tablo => {
        // Excel şablonundaki bilgi notu başlıklardan önce yer alabilir.
        const baslikAdaylari = word ? tablo.slice(0, 1) : tablo;
        return baslikAdaylari.flatMap((basliklar, satirIndeksi) => {
          const indeksler = sutunlar.map(sutun => {
            const eslesenler = basliklar.flatMap((baslik, indeks) => baslik.trim() === sutun ? [indeks] : []);
            return eslesenler.length === 1 ? eslesenler[0] : -1;
          });
          return indeksler.every((indeks, sutunIndeksi) => indeks >= 0
            || (urunListesi && sutunIndeksi === 1 && !basliklar.some(baslik => baslik.trim() === "Barkod"))) ? [{ tablo, satirIndeksi, indeksler }] : [];
        });
      });
      if (eslesenler.length !== 1) {
        hataBildir(word ? "Word dosyasında şablon başlıklarını içeren tek bir tablo olmalıdır." : "Excel sütun başlıkları şablonla eşleşmiyor.");
        return;
      }
      const { tablo, satirIndeksi, indeksler } = eslesenler[0];
      const liste = tablo.slice(satirIndeksi + 1).map(satir => indeksler.map(indeks => (satir[indeks] ?? "").trim()))
        .filter(satir => satir.some(Boolean));
      if (liste.length === 0) {
        hataBildir("Dosyada doldurulmuş satır bulunamadı.");
        return;
      }
      try {
        if (!urunListesi) setRolDonusumleri(await rolDonusumleriniAl());
      } catch {
        hataBildir("Unvan eşleştirmeleri alınamadı. Dosyayı tekrar yükleyin.");
        return;
      }
      setSatirlar(liste.map(hucreler => ({
        id: sonrakiSatirId.current++, hucreler,
      })));
    } catch {
      hataBildir("Dosya okunamadı. Tekrar deneyin.");
    } finally {
      setYukleniyor(false);
    }
  }

  const indirilecekSatirlar = satirlar.map(satir => satir.hucreler)
    .filter(hucreler => hucreler.some(hucre => hucre.trim()));
  const silmeSutunuVar = !gonderildi && satirlar.length > 0;

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 id={`${listeKodu}-baslik`}>{baslik}</h3>
        <div className="ml-auto flex gap-2">
          {indirilecekSatirlar.length > 0 ? (
            <button type="button" className={adminStyles.button} onClick={excelIndir} disabled={hazirlaniyor}>
              <Download aria-hidden="true" /> Listeyi İndir
            </button>
          ) : (
            <a className={adminStyles.button} href={`/kurumsal-${listeKodu}-sablonu.xlsx`} download={`${dosyaAdi} Şablonu.xlsx`}>
              <Download aria-hidden="true" /> Şablonu İndir
            </a>
          )}
          <button type="button" className={adminStyles.button} onClick={() => dosyaAlani.current?.click()} disabled={gonderildi || islemSuruyor || yukleniyor || eslesmelerYukleniyor}>
            <Upload aria-hidden="true" /> {yukleniyor ? "Yükleniyor…" : "Listeyi Yükle"}
          </button>
          <button ref={satirEkleDugmesi} type="button" className={adminStyles.button} onClick={satirEkle} disabled={gonderildi || islemSuruyor || yukleniyor}>
            <Plus aria-hidden="true" /> Satır Ekle
          </button>
          <input ref={dosyaAlani} type="file" accept=".xlsx,.xls,.docx" hidden onChange={olay => {
            const dosya = olay.currentTarget.files?.[0];
            olay.currentTarget.value = "";
            if (dosya) void listeYukle(dosya);
          }} />
        </div>
      </div>
      <div className={adminStyles.tableWrap}>
        <table className={`${adminStyles.table} ${styles.kurumsalUyelikListeTablosu}`} aria-labelledby={`${listeKodu}-baslik`}>
          <thead><tr>
            {sutunlar.map(sutun => <th key={sutun} scope="col">{sutun}</th>)}
            {silmeSutunuVar && <th scope="col"><span className="sr-only">Satır işlemleri</span></th>}
          </tr></thead>
          <tbody>{satirlar.map(({ id, hucreler: satir }, sira) => {
            const unvan = urunListesi ? "" : satir[2].trim();
            const telefon = urunListesi ? "" : satir[5].trim();
            const dogrudanRol = rolCoz(unvan);
            const adayRol = FIRMA_LISTESI_ROLLERI.has(dogrudanRol) ? dogrudanRol : rolDonusumleri?.get(turkceKatla(unvan)) ?? "";
            const rol = FIRMA_LISTESI_ROLLERI.has(adayRol) ? adayRol : "";
            return <tr key={id}>{satir.map((deger, indeks) => {
              const sutun = sutunlar[indeks];
              const barkodHucresi = urunListesi && indeks === 1;
              const barkodGecersiz = barkodHucresi && deger !== "" && !BARKOD_DESENI.test(deger);
              const eksik = !deger.trim();
              const eslesmedi = indeks === 2 && rolDonusumleri !== null && Boolean(unvan) && !rol;
              const epostaHucresi = !urunListesi && indeks === 4;
              const epostaGecersiz = epostaHucresi && !eksik && !EPOSTA_DESENI.test(deger.trim());
              const telefonHucresi = !urunListesi && indeks === 5;
              const telefonGecersiz = telefonHucresi && Boolean(telefon) && !CEP_TELEFONU_DESENI.test(telefon);
              const uyari = barkodGecersiz ? "Barkod 1–13 rakamdan oluşmalıdır."
                : eslesmedi ? "Eşleştirme gerekli"
                : epostaGecersiz ? "@ işaretini ve iki yanındaki bilgileri kontrol edin."
                : telefonGecersiz ? "5 ile başlayan 10 rakam girin." : null;
              const uyariId = `${listeKodu}-uyari-${sira}-${indeks}`;
              return <td key={sutun}>
                <input className={styles.kurumsalUyelikListeHucresi} value={deger}
                  readOnly={gonderildi || islemSuruyor}
                  inputMode={barkodHucresi || telefonHucresi ? "numeric" : epostaHucresi ? "email" : undefined}
                  pattern={barkodHucresi ? BARKOD_BICIMI : telefonHucresi ? CEP_TELEFONU_BICIMI : undefined}
                  required
                  aria-label={`${sira + 1}. satır, ${sutun}`} aria-invalid={eksik || Boolean(uyari) || undefined}
                  aria-describedby={uyari ? uyariId : undefined}
                  placeholder={eksik ? "Zorunlu" : undefined}
                  onChange={olay => {
                    const yeniDeger = olay.currentTarget.value;
                    setSatirlar(onceki => onceki.map(kayit => kayit.id === id
                      ? { ...kayit, hucreler: kayit.hucreler.map((hucre, hucreIndeksi) => hucreIndeksi === indeks ? yeniDeger : hucre) }
                      : kayit));
                  }} />
                {uyari && <small id={uyariId}>{uyari}</small>}
              </td>;
            })}
              {silmeSutunuVar && <td>
                <button type="button" className={adminStyles.button}
                  aria-label={`${sira + 1}. satırı sil`} title="Satırı sil"
                  disabled={islemSuruyor || yukleniyor}
                  onClick={olay => {
                    if (satir.some(hucre => hucre.trim())) {
                      satirSilDugmesi.current = olay.currentTarget;
                      setSilinecekSatirId(id);
                    } else {
                      satiriSil(id);
                      satirEkleDugmesi.current?.focus();
                    }
                  }}>
                  <Trash2 aria-hidden="true" />
                </button>
              </td>}
            </tr>;
          })}</tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" className={adminStyles.button} disabled={gonderildi || islemSuruyor || yukleniyor} onClick={() => setModal("vazgec")}>Vazgeç</button>
        <button type="button" className={adminStyles.button} disabled={gonderildi || islemSuruyor || yukleniyor} onClick={() => void listeIsle("kaydet")}>Kaydet</button>
        {!kurumsalBasvuru && (
          <button type="button" className={`${adminStyles.button} ${adminStyles.primary}`} disabled={gonderildi || islemSuruyor || yukleniyor} onClick={() => setModal("gonder")}>Gönder</button>
        )}
      </div>
      <AlertDialog open={silinecekSatirId !== null} onOpenChange={acik => { if (!acik) setSilinecekSatirId(null); }}>
        <AlertDialogContent onCloseAutoFocus={olay => {
          olay.preventDefault();
          const dugme = satirSilDugmesi.current;
          (dugme?.isConnected ? dugme : satirEkleDugmesi.current)?.focus();
          satirSilDugmesi.current = null;
        }}>
          <AlertDialogTitle>Satırı sil</AlertDialogTitle>
          <AlertDialogDescription>Bu satır ve girdiğiniz bilgiler listeden kaldırılacak.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <button type="button" className={adminStyles.button}
              onClick={() => { if (silinecekSatirId !== null) satiriSil(silinecekSatirId); }}>Sil</button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={modal !== null} onOpenChange={acik => { if (!acik && !islemSuruyor) setModal(null); }}>
        <AlertDialogContent>
          <AlertDialogTitle>
            {modal === "vazgec" ? "Listeden vazgeç" : "Listeyi gönder"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {modal === "vazgec"
              ? "Oluşturduğunuz liste tamamen silinecektir. Dilerseniz kaydedebilir ve daha sonra çalışmaya devam edebilirsiniz."
              : `Firmanızın ${urunListesi ? "ürün" : "kullanıcı"} listesi Cogniti’ye iletilecektir. Onaylıyor musunuz?`}
          </AlertDialogDescription>
          <AlertDialogFooter>
            {modal === "vazgec" && <AlertDialogCancel disabled={islemSuruyor}>Vazgeç</AlertDialogCancel>}
            <button type="button" className={adminStyles.button} disabled={islemSuruyor} onClick={() => void listeIsle(modal === "vazgec" ? "sil" : "kaydet")}>{modal === "vazgec" ? "Sil" : "Hayır"}</button>
            <button type="button" className={`${adminStyles.button} ${adminStyles.primary}`} disabled={islemSuruyor} onClick={() => void listeIsle(modal === "vazgec" ? "kaydet" : "gonder")}>{modal === "vazgec" ? "Kaydet" : "Evet"}</button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
