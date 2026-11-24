"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import { SadeKapsulFiltre } from "@/components/kontrol/SadeKontroller";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import {
  PARTNER_DURUM_ETIKETLERI,
  partnerListesiGecerli,
  type PartnerBasvuruListesi,
  type PartnerBasvuruTuru,
  type PartnerBasvurusu,
  type PartnerIlkGirisDurumu,
} from "@/lib/agora/partnerOnayTipleri";
import { SUREC14_TOAST } from "@/lib/bildirimler/toastMesajlari";
import styles from "../admin.module.css";

function erisimDurumuMetni(k: PartnerBasvurusu): string {
  if (k.ilk_giris_durumu === "reddedildi") return "Giriş kapalı";
  if (k.ilk_giris_durumu === "bekliyor") return "Onay bekliyor";
  if (k.sifre_tanimli) return "Şifre oluşturuldu";
  if (k.davet_bitis_at && new Date(k.davet_bitis_at).getTime() > Date.now()) {
    return "Davet gönderildi (şifre bekleniyor)";
  }
  return "Davet süresi doldu";
}

export default function PartnerYonetimi() {
  const { mesajlar: bildirimler, basari } = useHataMesaji();
  const [durum, setDurum] = useState<PartnerIlkGirisDurumu | "tumu">("bekliyor");
  const [turFiltresi, setTurFiltresi] = useState<PartnerBasvuruTuru | "tumu">("tumu");
  const [arama, setArama] = useState("");
  const [sayfa, setSayfa] = useState(1);
  const [liste, setListe] = useState<PartnerBasvuruListesi | null>(null);
  const [secili, setSecili] = useState<PartnerBasvurusu | null>(null);
  const [retOnayiAcik, setRetOnayiAcik] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const kilit = useRef(false);
  const istekDurumu = useRef({ surum: 0, controller: null as AbortController | null });

  const yenile = useCallback(async () => {
    const kontrol = istekDurumu.current;
    kontrol.controller?.abort();
    const controller = new AbortController();
    kontrol.controller = controller;
    const surum = ++kontrol.surum;
    setYukleniyor(true);
    setHata("");
    try {
      const r = await fetch(`/admin/api/partnerler?${new URLSearchParams({ durum, sayfa: String(sayfa) })}`, {
        cache: "no-store",
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
      });
      const data: unknown = await r.json();
      if (!r.ok || !partnerListesiGecerli(data)) throw new Error("Başvurular okunamadı.");
      if (surum === kontrol.surum) setListe(data);
    } catch {
      if (surum === kontrol.surum && !controller.signal.aborted) {
        setListe(null);
        setSecili(null);
        setHata("Partner başvuruları okunamadı. Yenile ile tekrar deneyin.");
      }
    } finally {
      if (surum === kontrol.surum) setYukleniyor(false);
    }
  }, [durum, sayfa]);

  useEffect(() => {
    const kontrol = istekDurumu.current;
    void yenile();
    return () => {
      kontrol.surum++;
      kontrol.controller?.abort();
    };
  }, [yenile]);

  async function kararKaydet(karar: "onaylandi" | "reddedildi") {
    if (!secili || kilit.current || yukleniyor || !liste) return;
    kilit.current = true;
    setKaydediliyor(true);
    setHata("");
    try {
      const r = await fetch("/admin/api/partnerler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          partner_id: secili.partner_id,
          karar,
          giris_surum: secili.giris_surum,
        }),
      });
      const data: unknown = await r.json();
      if (!r.ok) {
        if (r.status === 409) {
          setSecili(null);
          await yenile();
        }
        setHata(
          data && typeof data === "object" && "hata" in data && typeof data.hata === "string"
            ? data.hata
            : "Karar kaydedilemedi. Listeyi yenileyip tekrar deneyin.",
        );
        return;
      }
      const bildirimMetni =
        karar === "onaylandi"
          ? SUREC14_TOAST.basvuruOnaylandiAdli(secili.ad_soyad)
          : SUREC14_TOAST.basvuruReddedildiAdli(secili.ad_soyad);
      basari(bildirimMetni);
      setRetOnayiAcik(false);
      setSecili(null);
      await yenile();
    } catch {
      setHata("İşlem sonucu doğrulanamadı. Yenile ile güncel durumu kontrol edin.");
    } finally {
      kilit.current = false;
      setKaydediliyor(false);
    }
  }

  const tarih = (d: string) => new Date(d).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
  const sayfaSec = (s: number) => {
    setSayfa(s);
    setListe(null);
    setSecili(null);
  };

  const aranan = arama.trim().toLocaleLowerCase("tr-TR");
  const suzulmusKayitlar = (liste?.kayitlar ?? []).filter(k => {
    if (turFiltresi !== "tumu" && k.basvuru_turu !== turFiltresi) return false;
    if (!aranan) return true;
    return [k.ad_soyad, k.firma_adi ?? "", k.eposta, k.cep_telefonu].some(v =>
      v.toLocaleLowerCase("tr-TR").includes(aranan),
    );
  });

  return (
    <section aria-label="Cogniti partner yönetimi" className={styles.stack}>
      <HataMesajiContainer mesajlar={bildirimler} />

      <section className={styles.card} aria-labelledby="partner-yonetim-baslik" aria-busy={yukleniyor || kaydediliyor}>
        <header className={styles.cardHeader}>
          <div>
            <h2 id="partner-yonetim-baslik">
              Partner Başvuruları
              {liste && <span className={styles.count}>{liste.toplam}</span>}
            </h2>
          </div>
          <YenileButonu
            yenileniyor={yukleniyor}
            disabled={kaydediliyor}
            onYenile={() => {
              setSecili(null);
              return yenile();
            }}
          />
        </header>

        <div className={`${styles.toolbar} ${styles.partnerToolbar}`}>
          <div className={styles.partnerToolbarFilters}>
            <SadeKapsulFiltre
              etiket="Başvuru durumu"
              deger={durum}
              onDegistir={v => {
                if (kaydediliyor) return;
                setDurum(v);
                sayfaSec(1);
              }}
              secenekler={[
                { deger: "bekliyor", etiket: "Bekleyenler", disabled: kaydediliyor },
                { deger: "onaylandi", etiket: "Onaylananlar", disabled: kaydediliyor },
                { deger: "reddedildi", etiket: "Reddedilenler", disabled: kaydediliyor },
                { deger: "tumu", etiket: "Tümü", disabled: kaydediliyor },
              ]}
            />
            <SadeKapsulFiltre
              etiket="Başvuru türü"
              deger={turFiltresi}
              onDegistir={v => setTurFiltresi(v)}
              secenekler={[
                { deger: "tumu", etiket: "Tüm Türler", disabled: kaydediliyor },
                { deger: "kisisel", etiket: "Kişisel", disabled: kaydediliyor },
                { deger: "kurumsal", etiket: "Kurumsal", disabled: kaydediliyor },
              ]}
            />
          </div>
          <input
            type="search"
            className={styles.search}
            aria-label="Partner başvurularında ara"
            placeholder="Ad, firma, e-posta veya telefon ara…"
            value={arama}
            onChange={e => setArama(e.target.value)}
          />
        </div>

        {hata && (
          <div className={styles.cardBody}>
            <p className={`${styles.notice} ${styles.partnerUyelikHata}`} role="alert">
              {hata}
            </p>
          </div>
        )}

        {yukleniyor && !liste && (
          <p className={styles.empty} role="status">
            Başvurular yükleniyor…
          </p>
        )}

        {liste && (
          <>
            <div className={styles.tableWrap}>
              <table className={`${styles.table} ${styles.mobileTable}`}>
                <thead>
                  <tr>
                    <th scope="col">Tür</th>
                    <th scope="col">Ad Soyad / Firma</th>
                    <th scope="col">E-Posta</th>
                    <th scope="col">Cep Telefonu</th>
                    <th scope="col">Başvuru Tarihi</th>
                    <th scope="col">Durum</th>
                    <th scope="col">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {suzulmusKayitlar.map(k => (
                    <tr key={k.partner_id} data-selected={secili?.partner_id === k.partner_id}>
                      <td data-label="Tür">
                        <span className={styles.status}>
                          {k.basvuru_turu === "kurumsal" ? "Kurumsal" : "Kişisel"}
                        </span>
                      </td>
                      <td data-label="Ad Soyad / Firma">
                        <span className={styles.name}>
                          {k.basvuru_turu === "kurumsal" && k.firma_adi ? k.firma_adi : k.ad_soyad}
                        </span>
                        {k.basvuru_turu === "kurumsal" && k.firma_adi && (
                          <span className={styles.subtext}>Yetkili: {k.ad_soyad}</span>
                        )}
                      </td>
                      <td data-label="E-Posta">{k.eposta}</td>
                      <td data-label="Cep Telefonu">{k.cep_telefonu}</td>
                      <td data-label="Başvuru Tarihi">{tarih(k.olusturuldu_at)}</td>
                      <td data-label="Durum">
                        <span
                          className={`${styles.status} ${
                            k.ilk_giris_durumu === "onaylandi" ? styles.statusActive : ""
                          }`}
                        >
                          {PARTNER_DURUM_ETIKETLERI[k.ilk_giris_durumu]}
                        </span>
                        {k.ilk_giris_durumu === "onaylandi" && (
                          <span className={styles.subtext}>{erisimDurumuMetni(k)}</span>
                        )}
                      </td>
                      <td data-label="İşlem">
                        <button
                          type="button"
                          className={styles.button}
                          disabled={kaydediliyor || yukleniyor}
                          aria-expanded={secili?.partner_id === k.partner_id}
                          aria-controls="partner-basvuru-detay"
                          onClick={() => {
                            setSecili(secili?.partner_id === k.partner_id ? null : k);
                            setHata("");
                          }}
                        >
                          {secili?.partner_id === k.partner_id ? "Kapat" : "İncele"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!suzulmusKayitlar.length && <p className={styles.empty}>Bu seçimde başvuru bulunamadı.</p>}
            <div className={styles.partnerPagination}>
              <span>
                Toplam {liste.toplam} başvuru · Sayfa {sayfa}
              </span>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.button}
                  disabled={sayfa === 1 || yukleniyor || kaydediliyor}
                  onClick={() => sayfaSec(sayfa - 1)}
                >
                  Önceki
                </button>
                <button
                  type="button"
                  className={styles.button}
                  disabled={sayfa * 20 >= liste.toplam || yukleniyor || kaydediliyor}
                  onClick={() => sayfaSec(sayfa + 1)}
                >
                  Sonraki
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {secili && (
        <article className={styles.card} id="partner-basvuru-detay" aria-label="Partner Başvuru Detayları">
          <header className={styles.cardHeader}>
            <div>
              <h2>
                {secili.basvuru_turu === "kurumsal" && secili.firma_adi
                  ? `${secili.firma_adi} · ${secili.ad_soyad}`
                  : secili.ad_soyad}
                <span className={styles.status}>
                  {secili.basvuru_turu === "kurumsal" ? "Kurumsal" : "Kişisel"}
                </span>
                <span
                  className={`${styles.status} ${
                    secili.ilk_giris_durumu === "onaylandi" ? styles.statusActive : ""
                  }`}
                >
                  {PARTNER_DURUM_ETIKETLERI[secili.ilk_giris_durumu]}
                </span>
              </h2>
              <p>
                {secili.eposta} · {secili.cep_telefonu}
              </p>
            </div>
            <button
              type="button"
              className={styles.button}
              disabled={kaydediliyor}
              onClick={() => setSecili(null)}
            >
              Kapat
            </button>
          </header>

          <div className={`${styles.cardBody} ${styles.partnerDetayGruplar}`}>
            <section aria-label="Başvuru ve kimlik bilgileri">
              <h3 className={styles.partnerDetayGrupBaslik}>
                {secili.basvuru_turu === "kurumsal" ? "Firma & Yetkili Bilgileri" : "Kimlik & İletişim Bilgileri"}
              </h3>
              <dl className={`${styles.partnerUyelikDetay} ${styles.uyelikBasvuruDetay}`}>
                {secili.basvuru_turu === "kurumsal" ? (
                  <>
                    <div>
                      <dt>Firma Adı</dt>
                      <dd>{secili.firma_adi ?? "—"}</dd>
                    </div>
                    <div>
                      <dt>Web Adresi</dt>
                      <dd>{secili.web_adresi ?? "—"}</dd>
                    </div>
                    <div>
                      <dt>Yetkili Ad Soyad</dt>
                      <dd>{secili.ad_soyad}</dd>
                    </div>
                    <div>
                      <dt>Vergi Dairesi</dt>
                      <dd>{secili.vergi_dairesi ?? "—"}</dd>
                    </div>
                    <div>
                      <dt>Vergi Numarası</dt>
                      <dd>{secili.vergi_no ?? "—"}</dd>
                    </div>
                    <div>
                      <dt>Fatura Adresi</dt>
                      <dd>{secili.adres ?? "—"}</dd>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <dt>Ad Soyad</dt>
                      <dd>{secili.ad_soyad}</dd>
                    </div>
                    <div>
                      <dt>TC Kimlik No</dt>
                      <dd>{secili.tc_no ?? "—"}</dd>
                    </div>
                  </>
                )}
                <div>
                  <dt>E-Posta</dt>
                  <dd>{secili.eposta}</dd>
                </div>
                <div>
                  <dt>Cep Telefonu</dt>
                  <dd>{secili.cep_telefonu}</dd>
                </div>
              </dl>
            </section>

            {secili.basvuru_turu === "kisisel" && (
              <section aria-label="Uzmanlık ve deneyim bilgileri">
                <h3 className={styles.partnerDetayGrupBaslik}>Uzmanlık & Deneyim</h3>
                <dl className={`${styles.partnerUyelikDetay} ${styles.uyelikBasvuruDetay}`}>
                  <div>
                    <dt>Uzmanlık Alanları</dt>
                    <dd>
                      {secili.uzmanliklar.length ? (
                        <div className={styles.partnerDetayEtiketler}>
                          {secili.uzmanliklar.map(u => (
                            <span key={u} className={styles.status}>
                              {u}
                            </span>
                          ))}
                        </div>
                      ) : (
                        "—"
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Sizi Tanımak İsteriz</dt>
                    <dd>{secili.kendini_tanitma ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>Özgeçmiş (CV)</dt>
                    <dd>
                      {secili.ozgecmis_var ? (
                        <a
                          href={`/admin/api/partnerler/${secili.partner_id}/cv`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.button}
                        >
                          <Download />
                          {secili.ozgecmis_adi ?? "Özgeçmişi İndir"}
                        </a>
                      ) : (
                        "Yüklenmemiş"
                      )}
                    </dd>
                  </div>
                </dl>
              </section>
            )}

            <section aria-label="Banka ve ödeme bilgileri">
              <h3 className={styles.partnerDetayGrupBaslik}>Banka & Ödeme Bilgileri</h3>
              <dl className={`${styles.partnerUyelikDetay} ${styles.uyelikBasvuruDetay}`}>
                <div>
                  <dt>Banka Adı</dt>
                  <dd>{secili.banka_adi ?? "—"}</dd>
                </div>
                <div>
                  <dt>Banka Hesap Adı</dt>
                  <dd>{secili.hesap_adi ?? "—"}</dd>
                </div>
                <div>
                  <dt>IBAN</dt>
                  <dd>{secili.iban ?? "—"}</dd>
                </div>
              </dl>
            </section>

            <section aria-label="Başvuru ve erişim durumu">
              <h3 className={styles.partnerDetayGrupBaslik}>Başvuru & Erişim Durumu</h3>
              <dl className={`${styles.partnerUyelikDetay} ${styles.uyelikBasvuruDetay}`}>
                <div>
                  <dt>Başvuru Tarihi</dt>
                  <dd>{tarih(secili.olusturuldu_at)}</dd>
                </div>
                <div>
                  <dt>Başvuru Durumu</dt>
                  <dd>{PARTNER_DURUM_ETIKETLERI[secili.ilk_giris_durumu]}</dd>
                </div>
                <div>
                  <dt>Hesap Erişimi</dt>
                  <dd>{erisimDurumuMetni(secili)}</dd>
                </div>
                {secili.karar_at && (
                  <div>
                    <dt>Son Karar Tarihi</dt>
                    <dd>{tarih(secili.karar_at)}</dd>
                  </div>
                )}
              </dl>
            </section>
          </div>

          <footer className={styles.partnerDetayFooter}>
            {secili.ilk_giris_durumu !== "onaylandi" && (
              <button
                type="button"
                className={`${styles.button} ${styles.primary}`}
                disabled={kaydediliyor || yukleniyor}
                onClick={() => void kararKaydet("onaylandi")}
              >
                {kaydediliyor ? "Kaydediliyor…" : "Onayla ve Davet Gönder"}
              </button>
            )}
            {secili.ilk_giris_durumu === "onaylandi" && !secili.sifre_tanimli && (
              <button
                type="button"
                className={`${styles.button} ${styles.primary}`}
                disabled={kaydediliyor || yukleniyor}
                onClick={() => void kararKaydet("onaylandi")}
              >
                {kaydediliyor ? "Gönderiliyor…" : "Daveti Yeniden Gönder"}
              </button>
            )}
            {secili.ilk_giris_durumu !== "reddedildi" && (
              <AlertDialog
                open={retOnayiAcik}
                onOpenChange={acik => {
                  if (!kaydediliyor) setRetOnayiAcik(acik);
                }}
              >
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    className={`${styles.button} ${styles.danger}`}
                    disabled={kaydediliyor || yukleniyor}
                  >
                    Başvuruyu Reddet
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Partner başvurusunu reddet</AlertDialogTitle>
                    <AlertDialogDescription>
                      {secili.ad_soyad} başvurusu reddedilecek ve varsa partner panel erişimi kapatılacak.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={kaydediliyor}>Vazgeç</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={kaydediliyor}
                      onClick={olay => {
                        olay.preventDefault();
                        void kararKaydet("reddedildi");
                      }}
                    >
                      {kaydediliyor ? "Kaydediliyor…" : "Başvuruyu Reddet"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </footer>
        </article>
      )}
    </section>
  );
}
