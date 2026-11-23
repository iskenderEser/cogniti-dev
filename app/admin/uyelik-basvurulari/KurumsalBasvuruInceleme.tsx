"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import { SadeKapsulFiltre } from "@/components/kontrol/SadeKontroller";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ilSecenekleri, ilinIlceleri } from "@/lib/firma/konumReferansi";
import styles from "../admin.module.css";

type BasvuruDurumu = "incelemede" | "onaylandi" | "reddedildi";
type FiltreDurumu = BasvuruDurumu | "tumu";

type KurumsalBasvuruKaydi = {
  on_basvuru_id: string;
  durum: BasvuruDurumu;
  on_basvuru: {
    id: string;
    firma_adi: string;
    web_sitesi: string | null;
    ad_soyad: string;
    eposta: string;
    cep_tel: string;
  } | null;
  firma_bilgileri: {
    firma_adi?: string;
    il_id?: number | null;
    ilce_id?: number | null;
    adres?: string;
    vergi_dairesi?: string;
    vergi_numarasi?: string;
    sorumlu_ad_soyad?: string;
    sorumlu_telefon?: string;
    sorumlu_eposta?: string;
  };
  belgeler: {
    logo: { yuklu: boolean; dosya_adi: string | null; url: string | null };
    sozlesme: { yuklu: boolean; dosya_adi: string | null; url: string | null };
    ticaret_sicil: { yuklu: boolean; dosya_adi: string | null; url: string | null };
    vergi_levhasi: { yuklu: boolean; dosya_adi: string | null; url: string | null };
  };
  isim_listesi: string[][];
  urun_listesi: string[][];
  gonderildi_at: string | null;
  karar_at: string | null;
  karar_notu: string | null;
  olusturulan_firma_id: string | null;
};

const DURUM_ETIKETLERI: Record<BasvuruDurumu, string> = {
  incelemede: "İncelemede",
  onaylandi: "Onaylandı",
  reddedildi: "Reddedildi (Düzeltme bekliyor)",
};

const tarihBicim = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Istanbul",
});

function tarihYaz(deger: string | null) {
  return deger ? tarihBicim.format(new Date(deger)) : "—";
}

export default function KurumsalBasvuruInceleme({
  basari,
}: {
  basari?: (mesaj: string) => void;
}) {
  const [durum, setDurum] = useState<FiltreDurumu>("incelemede");
  const [kayitlar, setKayitlar] = useState<KurumsalBasvuruKaydi[] | null>(null);
  const [secili, setSecili] = useState<KurumsalBasvuruKaydi | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");
  const [islemMesaji, setIslemMesaji] = useState("");
  const [onayModalAcik, setOnayModalAcik] = useState(false);
  const [redModalAcik, setRedModalAcik] = useState(false);
  const [redAciklama, setRedAciklama] = useState("");
  const [kararSuruyor, setKararSuruyor] = useState(false);

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    setHata("");
    try {
      const yanit = await fetch(`/admin/api/kurumsal-basvurular?durum=${encodeURIComponent(durum)}`, {
        cache: "no-store",
      });
      if (!yanit.ok) throw new Error("Kurumsal üyelik başvuruları alınamadı.");
      const veri: KurumsalBasvuruKaydi[] = await yanit.json();
      setKayitlar(veri);
      setSecili((onceki) => (onceki ? veri.find((k) => k.on_basvuru_id === onceki.on_basvuru_id) ?? null : null));
    } catch {
      setHata("Kurumsal üyelik başvuruları alınamadı.");
    } finally {
      setYukleniyor(false);
    }
  }, [durum]);

  useEffect(() => {
    void yukle();
  }, [yukle]);

  async function kararVer(karar: "onayla" | "reddet") {
    if (!secili || kararSuruyor) return;
    if (karar === "reddet" && redAciklama.trim().length < 3) {
      setHata("Reddetmek için eksik veya hatalı alanları açıklayın.");
      return;
    }
    setKararSuruyor(true);
    setHata("");
    setIslemMesaji("");
    try {
      const yanit = await fetch("/admin/api/kurumsal-basvurular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          on_basvuru_id: secili.on_basvuru_id,
          karar,
          ...(karar === "reddet" ? { karar_notu: redAciklama.trim() } : {}),
        }),
      });
      const veri = await yanit.json().catch(() => null);
      if (!yanit.ok) {
        setHata(veri?.hata || "İşlem tamamlanamadı.");
        return;
      }
      if (karar === "onayla") {
        const mesaj = `${veri?.firma_adi || secili.firma_bilgileri.firma_adi || "Firma"} onaylandı; firma kaydı, listeleri ve Firma Admini hesabı oluşturuldu.`;
        setIslemMesaji(mesaj);
        basari?.(mesaj);
        setOnayModalAcik(false);
      } else {
        const mesaj = veri?.eposta_gonderildi
          ? "Başvuru reddedildi ve düzeltme e-postası başvurana gönderildi."
          : `Başvuru reddedildi ancak e-posta gönderilemedi: ${veri?.eposta_uyari || "bilinmeyen hata"}`;
        setIslemMesaji(mesaj);
        if (veri?.eposta_gonderildi) basari?.(mesaj);
        setRedModalAcik(false);
        setRedAciklama("");
      }
      setSecili(null);
      await yukle();
    } catch {
      setHata("İşlem sırasında bağlantı hatası oluştu.");
    } finally {
      setKararSuruyor(false);
    }
  }

  const fb = secili?.firma_bilgileri;
  const ilAdi = fb?.il_id ? ilSecenekleri.find((i) => i.deger === String(fb.il_id))?.etiket ?? String(fb.il_id) : "—";
  const ilceAdi = fb?.il_id && fb?.ilce_id
    ? ilinIlceleri(fb.il_id).find((i) => i.deger === String(fb.ilce_id))?.etiket ?? String(fb.ilce_id)
    : "—";

  return (
    <div className={styles.stack}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Kurumsal Üyelik İnceleme</h2>
          <YenileButonu yenileniyor={yukleniyor} disabled={kararSuruyor} onYenile={() => void yukle()} />
        </div>
        <div className={styles.toolbar}>
          <SadeKapsulFiltre
            etiket="Kurumsal başvuru durumu"
            deger={durum}
            onDegistir={(v) => {
              if (kararSuruyor) return;
              setDurum(v);
              setSecili(null);
              setIslemMesaji("");
            }}
            secenekler={[
              { deger: "incelemede", etiket: "İncelemede", disabled: kararSuruyor },
              { deger: "onaylandi", etiket: "Onaylananlar", disabled: kararSuruyor },
              { deger: "reddedildi", etiket: "Reddedilenler", disabled: kararSuruyor },
              { deger: "tumu", etiket: "Tümü", disabled: kararSuruyor },
            ]}
          />
        </div>
        {hata && <p role="alert" className={styles.notice}>{hata}</p>}
        {islemMesaji && <p role="status" className={styles.notice}>{islemMesaji}</p>}
        {yukleniyor && !kayitlar && <p className={styles.empty} role="status">Kurumsal başvurular yükleniyor…</p>}
        {kayitlar && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Firma Adı</th>
                  <th scope="col">Yetkili</th>
                  <th scope="col">E-posta</th>
                  <th scope="col">Gönderim Tarihi</th>
                  <th scope="col">Durum</th>
                  <th scope="col">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {kayitlar.map((k) => (
                  <tr key={k.on_basvuru_id} data-selected={secili?.on_basvuru_id === k.on_basvuru_id}>
                    <td>{k.firma_bilgileri.firma_adi || k.on_basvuru?.firma_adi || "—"}</td>
                    <td>{k.on_basvuru?.ad_soyad || k.firma_bilgileri.sorumlu_ad_soyad || "—"}</td>
                    <td>{k.on_basvuru?.eposta || k.firma_bilgileri.sorumlu_eposta || "—"}</td>
                    <td>{tarihYaz(k.gonderildi_at)}</td>
                    <td>{DURUM_ETIKETLERI[k.durum]}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.button}
                        disabled={kararSuruyor}
                        onClick={() => {
                          setSecili(k);
                          setHata("");
                          setIslemMesaji("");
                        }}
                      >
                        İncele
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {kayitlar.length === 0 && (
              <p className={styles.empty}>Bu filtrede kurumsal üyelik başvurusu bulunmuyor.</p>
            )}
          </div>
        )}
      </div>

      {secili && fb && (
        <article className={styles.card} aria-label="Kurumsal üyelik başvuru detayı">
          <div className={styles.cardHeader}>
            <h2>{fb.firma_adi || secili.on_basvuru?.firma_adi || "Kurumsal Başvuru"}</h2>
            <span className={styles.status}>{DURUM_ETIKETLERI[secili.durum]}</span>
          </div>
          <div className={`${styles.cardBody} ${styles.stack}`}>
            {secili.belgeler.logo.url && (
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={secili.belgeler.logo.url}
                  alt="Firma logosu"
                  className={styles.partnerUyelikLogo}
                />
              </div>
            )}

            <dl className={`${styles.partnerUyelikDetay} ${styles.uyelikBasvuruDetay}`}>
              <div><dt>Firma Adı</dt><dd>{fb.firma_adi || "—"}</dd></div>
              <div><dt>İl / İlçe</dt><dd>{ilAdi} / {ilceAdi}</dd></div>
              <div><dt>Vergi Dairesi</dt><dd>{fb.vergi_dairesi || "—"}</dd></div>
              <div><dt>Vergi Numarası</dt><dd>{fb.vergi_numarasi || "—"}</dd></div>
              <div><dt>Adres</dt><dd>{fb.adres || "—"}</dd></div>
              <div><dt>Sorumlu Kişi</dt><dd>{fb.sorumlu_ad_soyad || "—"}</dd></div>
              <div><dt>Sorumlu E-posta</dt><dd>{fb.sorumlu_eposta || "—"}</dd></div>
              <div><dt>Sorumlu Telefon</dt><dd>{fb.sorumlu_telefon || "—"}</dd></div>
              <div><dt>Başvuran Hesap</dt><dd>{secili.on_basvuru ? `${secili.on_basvuru.ad_soyad} (${secili.on_basvuru.eposta})` : "—"}</dd></div>
              <div><dt>Gönderim Tarihi</dt><dd>{tarihYaz(secili.gonderildi_at)}</dd></div>
              {secili.karar_at && <div><dt>Karar Tarihi</dt><dd>{tarihYaz(secili.karar_at)}</dd></div>}
            </dl>

            {secili.karar_notu && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                <strong>Son Düzeltme / Reddetme Notu:</strong>
                <p className="mt-1 whitespace-pre-line">{secili.karar_notu}</p>
              </div>
            )}

            <div>
              <h3 className="mb-2 text-sm font-semibold">Resmi Belgeler</h3>
              <div className="flex flex-wrap gap-2">
                {([
                  ["sozlesme", "İmzalı Üyelik Sözleşmesi"],
                  ["ticaret_sicil", "Ticaret Sicili Gazetesi"],
                  ["vergi_levhasi", "Vergi Levhası"],
                ] as const).map(([tur, etiket]) => {
                  const belge = secili.belgeler[tur];
                  if (!belge.yuklu || !belge.url) {
                    return <span key={tur} className={styles.status}>{etiket}: Eksik</span>;
                  }
                  return (
                    <span key={tur} className="inline-flex items-center gap-1.5 rounded-lg border border-(--tema-cizgi) px-3 py-1.5 text-xs">
                      <strong>{etiket}:</strong>
                      <a href={belge.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline">
                        <ExternalLink size={13} aria-hidden="true" /> Aç
                      </a>
                      <span>·</span>
                      <a href={`${belge.url}&indir=1`} className="inline-flex items-center gap-1 underline">
                        <Download size={13} aria-hidden="true" /> İndir
                      </a>
                    </span>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold">Kullanıcı Listesi ({secili.isim_listesi.length} kişi)</h3>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Takım/Bölüm</th>
                      <th scope="col">Bölge</th>
                      <th scope="col">Unvan</th>
                      <th scope="col">Ad Soyad</th>
                      <th scope="col">E-posta</th>
                      <th scope="col">Telefon</th>
                    </tr>
                  </thead>
                  <tbody>
                    {secili.isim_listesi.map((satir, idx) => (
                      <tr key={idx}>
                        {satir.map((hucre, hIdx) => <td key={hIdx}>{hucre}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold">Ürün Listesi ({secili.urun_listesi.length} ürün)</h3>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Takım Adı</th>
                      <th scope="col">Barkod</th>
                      <th scope="col">Ürün Adı</th>
                      <th scope="col">PM Adı Soyadı</th>
                    </tr>
                  </thead>
                  <tbody>
                    {secili.urun_listesi.map((satir, idx) => (
                      <tr key={idx}>
                        {satir.map((hucre, hIdx) => <td key={hIdx}>{hucre}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.formActions}>
              {secili.durum === "incelemede" && (
                <>
                  <button
                    type="button"
                    className={`${styles.button} ${styles.primary}`}
                    disabled={kararSuruyor}
                    onClick={() => setOnayModalAcik(true)}
                  >
                    Üyeliği Onayla
                  </button>
                  <button
                    type="button"
                    className={`${styles.button} ${styles.danger}`}
                    disabled={kararSuruyor}
                    onClick={() => {
                      setRedAciklama("");
                      setRedModalAcik(true);
                    }}
                  >
                    Reddet / Düzeltme İste
                  </button>
                </>
              )}
              <button type="button" className={styles.button} disabled={kararSuruyor} onClick={() => setSecili(null)}>
                Kapat
              </button>
            </div>
          </div>
        </article>
      )}

      <AlertDialog open={onayModalAcik} onOpenChange={(acik) => { if (!kararSuruyor) setOnayModalAcik(acik); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kurumsal üyeliği onayla</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{fb?.firma_adi || secili?.on_basvuru?.firma_adi}</strong> için firma kaydı, logosu, kullanıcı/ürün listeleri ve başvuran yetkilinin <strong>Firma Admini</strong> hesabı oluşturulacak (Firma Admini sonradan Kullanıcılar ekranından değiştirilebilir). Onaylıyor musunuz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={kararSuruyor}>Vazgeç</AlertDialogCancel>
            <button
              type="button"
              className={`${styles.button} ${styles.primary}`}
              disabled={kararSuruyor}
              onClick={() => void kararVer("onayla")}
            >
              {kararSuruyor ? "Onaylanıyor…" : "Evet, Onayla"}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={redModalAcik} onOpenChange={(acik) => { if (!kararSuruyor) setRedModalAcik(acik); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Başvuruyu reddet / düzeltme iste</AlertDialogTitle>
            <AlertDialogDescription>
              Aşağıya yazdığınız açıklama başvurana otomatik e-posta olarak gönderilecek ve başvuran kurumsal üyelik formunu düzeltip yeniden gönderebilecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-2">
            <label className={styles.field}>
              <span>Eksik veya düzeltilmesi gereken alanlar *</span>
              <textarea
                className={styles.input}
                rows={4}
                maxLength={2000}
                placeholder="Örn: Bölge Müdürü eksik, Vergi Levhası okunmuyor..."
                value={redAciklama}
                disabled={kararSuruyor}
                onChange={(e) => setRedAciklama(e.target.value)}
              />
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={kararSuruyor}>Vazgeç</AlertDialogCancel>
            <button
              type="button"
              className={`${styles.button} ${styles.danger}`}
              disabled={kararSuruyor || redAciklama.trim().length < 3}
              onClick={() => void kararVer("reddet")}
            >
              {kararSuruyor ? "Gönderiliyor…" : "Reddet ve E-posta Gönder"}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
