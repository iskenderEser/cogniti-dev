"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Eye,
  EyeOff,
  ImagePlus,
  Link2,
  Pencil,
  Plus,
  Save,
  Share2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  SOSYAL_IKON_MAX_BOYUT,
  sosyalIkonDosyaKontrol,
  sosyalLinkAdNormalizeEt,
  sosyalLinkUrlNormalizeEt,
  type SosyalLinkItem,
} from "@/lib/sosyalLinkler";
import styles from "../admin.module.css";
import local from "./sosyal-link-yonetimi.module.css";

interface Props {
  hata: (mesaj: string, adim?: string, detay?: string) => void;
  basari: (mesaj: string) => void;
}

export default function SosyalLinkYonetimi({ hata, basari }: Props) {
  const [linkler, setLinkler] = useState<SosyalLinkItem[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kurulumHazir, setKurulumHazir] = useState(true);

  // Yeni ekleme formu — İkon yükleme ve Link (URL) alanları ayrıdır.
  const [yeniAd, setYeniAd] = useState("");
  const [yeniUrl, setYeniUrl] = useState("");
  const [yeniIkon, setYeniIkon] = useState<File | null>(null);
  const [yeniIkonOnizleme, setYeniIkonOnizleme] = useState<string | null>(null);
  const [ekleniyor, setEkleniyor] = useState(false);
  const yeniIkonInputRef = useRef<HTMLInputElement>(null);

  // Satır düzenleme durumu
  const [duzenlenenId, setDuzenlenenId] = useState<string | null>(null);
  const [duzenAd, setDuzenAd] = useState("");
  const [duzenUrl, setDuzenUrl] = useState("");
  const [duzenIkon, setDuzenIkon] = useState<File | null>(null);
  const [duzenIkonOnizleme, setDuzenIkonOnizleme] = useState<string | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const duzenIkonInputRef = useRef<HTMLInputElement>(null);

  // İşlem & silme onayı
  const [islemId, setIslemId] = useState<string | null>(null);
  const [silAdayi, setSilAdayi] = useState<SosyalLinkItem | null>(null);
  const [siliniyor, setSiliniyor] = useState(false);

  const yeniOnizlemeRef = useRef<string | null>(null);
  const duzenOnizlemeRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (yeniOnizlemeRef.current) URL.revokeObjectURL(yeniOnizlemeRef.current);
      if (duzenOnizlemeRef.current) URL.revokeObjectURL(duzenOnizlemeRef.current);
    };
  }, []);

  const verileriYukle = async () => {
    setYukleniyor(true);
    try {
      const res = await fetch("/admin/api/sosyal-linkler");
      const data = await res.json();
      if (!res.ok) {
        hata(data.hata ?? "Sosyal medya linkleri yüklenemedi.", data.adim, data.detay);
      } else {
        setLinkler(data.linkler ?? []);
        setKurulumHazir(data.kurulumHazir !== false);
      }
    } catch {
      hata("Sosyal medya linkleri yüklenemedi.");
    } finally {
      setYukleniyor(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void verileriYukle(); }, []);

  function yeniIkonSeciminiTemizle() {
    if (yeniOnizlemeRef.current) {
      URL.revokeObjectURL(yeniOnizlemeRef.current);
      yeniOnizlemeRef.current = null;
    }
    setYeniIkon(null);
    setYeniIkonOnizleme(null);
    if (yeniIkonInputRef.current) yeniIkonInputRef.current.value = "";
  }

  function duzenIkonSeciminiTemizle() {
    if (duzenOnizlemeRef.current) {
      URL.revokeObjectURL(duzenOnizlemeRef.current);
      duzenOnizlemeRef.current = null;
    }
    setDuzenIkon(null);
    setDuzenIkonOnizleme(null);
    if (duzenIkonInputRef.current) duzenIkonInputRef.current.value = "";
  }

  async function ikonSec(dosya: File | undefined, hedef: "yeni" | "duzen") {
    if (!dosya) return;
    if (dosya.size > SOSYAL_IKON_MAX_BOYUT) {
      hata("En fazla 5 MB boyutunda bir ikon dosyası yükleyebilirsiniz.");
      return;
    }
    const kontrol = await sosyalIkonDosyaKontrol(dosya);
    if (!kontrol.gecerli) {
      hata(kontrol.hata);
      return;
    }
    const onizleme = URL.createObjectURL(dosya);
    if (hedef === "yeni") {
      if (yeniOnizlemeRef.current) URL.revokeObjectURL(yeniOnizlemeRef.current);
      yeniOnizlemeRef.current = onizleme;
      setYeniIkon(dosya);
      setYeniIkonOnizleme(onizleme);
    } else {
      if (duzenOnizlemeRef.current) URL.revokeObjectURL(duzenOnizlemeRef.current);
      duzenOnizlemeRef.current = onizleme;
      setDuzenIkon(dosya);
      setDuzenIkonOnizleme(onizleme);
    }
  }

  async function handleEkle(e: React.FormEvent) {
    e.preventDefault();
    if (ekleniyor) return;

    const ad = sosyalLinkAdNormalizeEt(yeniAd);
    const url = sosyalLinkUrlNormalizeEt(yeniUrl);
    if (!yeniIkon) {
      hata("Lütfen önce ikon yükleme alanından bir ikon seçin.");
      return;
    }
    if (!ad) {
      hata("Başlık / platform adı 1 ile 80 karakter arasında olmalıdır.");
      return;
    }
    if (!url) {
      hata("Geçerli bir bağlantı adresi girin (örn. https://www.linkedin.com/...).");
      return;
    }

    setEkleniyor(true);
    try {
      const form = new FormData();
      form.append("ad", ad);
      form.append("url", url);
      form.append("ikon", yeniIkon);

      const res = await fetch("/admin/api/sosyal-linkler", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        if (data.kurulumGerekli) setKurulumHazir(false);
        hata(data.hata ?? "Sosyal medya linki eklenemedi.", data.adim, data.detay);
        return;
      }

      setLinkler((onceki) => [...onceki, data.link]);
      setYeniAd("");
      setYeniUrl("");
      yeniIkonSeciminiTemizle();
      basari(`“${ad}” ana sayfa bağlantısı eklendi.`);
    } catch {
      hata("Sosyal medya linki eklenemedi.");
    } finally {
      setEkleniyor(false);
    }
  }

  function duzenlemeyiAc(item: SosyalLinkItem) {
    duzenIkonSeciminiTemizle();
    setDuzenlenenId(item.id);
    setDuzenAd(item.ad);
    setDuzenUrl(item.url);
  }

  function duzenlemeyiKapat() {
    duzenIkonSeciminiTemizle();
    setDuzenlenenId(null);
    setDuzenAd("");
    setDuzenUrl("");
  }

  async function handleDuzenKaydet(item: SosyalLinkItem) {
    if (kaydediliyor) return;
    const ad = sosyalLinkAdNormalizeEt(duzenAd);
    const url = sosyalLinkUrlNormalizeEt(duzenUrl);
    if (!ad) {
      hata("Başlık / platform adı 1 ile 80 karakter arasında olmalıdır.");
      return;
    }
    if (!url) {
      hata("Geçerli bir bağlantı adresi girin (örn. https://www.linkedin.com/...).");
      return;
    }

    setKaydediliyor(true);
    try {
      let res: Response;
      if (duzenIkon) {
        const form = new FormData();
        form.append("id", item.id);
        form.append("ad", ad);
        form.append("url", url);
        form.append("ikon", duzenIkon);
        res = await fetch("/admin/api/sosyal-linkler", { method: "PATCH", body: form });
      } else {
        res = await fetch("/admin/api/sosyal-linkler", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id, ad, url }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        hata(data.hata ?? "Bağlantı güncellenemedi.", data.adim, data.detay);
        return;
      }

      setLinkler((onceki) => onceki.map((satir) => (satir.id === item.id ? data.link : satir)));
      duzenlemeyiKapat();
      basari(`“${ad}” bağlantısı güncellendi.`);
    } catch {
      hata("Bağlantı güncellenemedi.");
    } finally {
      setKaydediliyor(false);
    }
  }

  async function handleGorunurlukDegistir(item: SosyalLinkItem) {
    if (islemId) return;
    setIslemId(item.id);
    try {
      const yeniDurum = !item.gorunur;
      const res = await fetch("/admin/api/sosyal-linkler", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, gorunur: yeniDurum }),
      });
      const data = await res.json();
      if (!res.ok) {
        hata(data.hata ?? "Görünürlük değiştirilemedi.", data.adim, data.detay);
        return;
      }
      setLinkler((onceki) => onceki.map((satir) => (satir.id === item.id ? data.link : satir)));
      basari(yeniDurum ? `“${item.ad}” ana sayfada yayına alındı.` : `“${item.ad}” ana sayfadan gizlendi.`);
    } catch {
      hata("Görünürlük değiştirilemedi.");
    } finally {
      setIslemId(null);
    }
  }

  async function handleSirala(item: SosyalLinkItem, yon: "yukari" | "asagi") {
    if (islemId) return;
    setIslemId(item.id);
    try {
      const res = await fetch("/admin/api/sosyal-linkler", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, yon }),
      });
      const data = await res.json();
      if (!res.ok) {
        hata(data.hata ?? "Sıralama güncellenemedi.", data.adim, data.detay);
        return;
      }
      setLinkler(data.linkler ?? []);
      basari("Sıralama güncellendi.");
    } catch {
      hata("Sıralama güncellenemedi.");
    } finally {
      setIslemId(null);
    }
  }

  async function handleSilOnay() {
    if (!silAdayi || siliniyor) return;
    setSiliniyor(true);
    try {
      const res = await fetch(`/admin/api/sosyal-linkler?id=${encodeURIComponent(silAdayi.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        hata(data.hata ?? "Bağlantı silinemedi.", data.adim, data.detay);
        return;
      }
      setLinkler((onceki) => onceki.filter((satir) => satir.id !== silAdayi.id));
      if (duzenlenenId === silAdayi.id) duzenlemeyiKapat();
      basari(`“${silAdayi.ad}” bağlantısı silindi.`);
      setSilAdayi(null);
    } catch {
      hata("Bağlantı silinemedi.");
    } finally {
      setSiliniyor(false);
    }
  }

  const yayindakiLinkler = linkler.filter((link) => link.gorunur);

  return (
    <div className={styles.stack}>
      {!kurulumHazir && (
        <div role="alert" className={styles.notice}>
          Sosyal medya ve link ekleme tablosu henüz veritabanında kurulu değil. Supabase SQL Editor&apos;de{" "}
          <code>scripts/sql/cogniti_sosyal_linkler.sql</code> dosyasını çalıştırın.
        </div>
      )}

      <section className={styles.card} aria-labelledby="sosyal-link-ekle-baslik">
        <div className={styles.cardHeader}>
          <div>
            <h2 id="sosyal-link-ekle-baslik">
              <Share2 aria-hidden="true" />
              Yeni Sosyal Medya / Link Ekle
            </h2>
            <p>
              cogniti.net ana sayfasında üst menünün altında, &ldquo;COGNITI NEDİR?&rdquo; başlığının hemen üstündeki standart alanda gösterilir.
            </p>
          </div>
        </div>

        <form className={styles.cardBody} onSubmit={handleEkle}>
          <div className={local.ayriAlanlar}>
            <div className={local.ikonKutusu}>
              <span className={local.onizlemeEtiketi}>1. İkon Yükleme Alanı</span>
              <div className={local.ikonOnizlemeRow}>
                <div className={local.ikonKare} aria-hidden="true">
                  {yeniIkonOnizleme ? <img src={yeniIkonOnizleme} alt="" /> : <ImagePlus size={20} />}
                </div>
                <p className={local.ikonAciklama}>
                  SVG, PNG, WebP veya JPEG (maks. 5 MB). Şeffaf arka planlı SVG veya PNG ikon önerilir.
                </p>
              </div>
              <input
                ref={yeniIkonInputRef}
                type="file"
                accept=".svg,.png,.jpg,.jpeg,.webp,image/svg+xml,image/png,image/jpeg,image/webp"
                className={local.gizliDosyaInput}
                onChange={(e) => void ikonSec(e.target.files?.[0], "yeni")}
                aria-label="İkon dosyası seç"
              />
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => yeniIkonInputRef.current?.click()}
                  disabled={!kurulumHazir || ekleniyor}
                >
                  <Upload aria-hidden="true" />
                  {yeniIkon ? "İkonu Değiştir" : "İkon Yükle"}
                </button>
                {yeniIkon && (
                  <button
                    type="button"
                    className={styles.button}
                    onClick={yeniIkonSeciminiTemizle}
                    disabled={ekleniyor}
                  >
                    <X aria-hidden="true" />
                    Temizle
                  </button>
                )}
              </div>
            </div>

            <div className={local.bilgiAlanlari}>
              <label className={styles.field}>
                <span>2. Başlık / Platform Adı</span>
                <input
                  type="text"
                  className={styles.input}
                  value={yeniAd}
                  onChange={(e) => setYeniAd(e.target.value)}
                  placeholder="Örn: LinkedIn, Instagram, YouTube..."
                  maxLength={80}
                  disabled={!kurulumHazir || ekleniyor}
                />
              </label>

              <label className={styles.field}>
                <span>3. Link (URL) Alanı</span>
                <input
                  type="url"
                  className={styles.input}
                  value={yeniUrl}
                  onChange={(e) => setYeniUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/company/..."
                  disabled={!kurulumHazir || ekleniyor}
                />
              </label>

              <div className={styles.formActions}>
                <button
                  type="submit"
                  className={`${styles.button} ${styles.primary}`}
                  disabled={!kurulumHazir || ekleniyor}
                >
                  <Plus aria-hidden="true" />
                  {ekleniyor ? "Ekleniyor…" : "Sosyal Link Ekle"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </section>

      <section className={styles.card} aria-labelledby="sosyal-link-liste-baslik">
        <div className={styles.cardHeader}>
          <div>
            <h2 id="sosyal-link-liste-baslik">
              <Link2 aria-hidden="true" />
              Mevcut Sosyal Medya ve Bağlantılar
              <span className={styles.count}>{linkler.length}</span>
            </h2>
            <p>
              Yayındaki ikonlar soldan sağa sırayla gösterilir. İkonu, bağlantıyı veya görünürlüğü istediğiniz zaman güncelleyebilirsiniz.
            </p>
          </div>
        </div>

        <div className={styles.cardBody}>
          <div className={local.anaSayfaOnizleme}>
            <span className={local.onizlemeEtiketi}>cogniti.net Standart Alan Önizlemesi</span>
            {yayindakiLinkler.length > 0 ? (
              <div className={local.onizlemeSerit}>
                {yayindakiLinkler.map((link) => (
                  <span key={link.id} className={local.onizlemeIkon} title={link.ad}>
                    <img src={link.ikonUrl} alt={link.ad} />
                  </span>
                ))}
              </div>
            ) : (
              <p className={local.ikonAciklama}>
                Şu anda yayında bağlantı yok. Yeni bir bağlantı ekleyip yayına aldığınızda burada ve cogniti.net üzerinde görünür.
              </p>
            )}
          </div>

          {yukleniyor ? (
            <p className={styles.empty}>Bağlantılar yükleniyor…</p>
          ) : linkler.length === 0 ? (
            <p className={styles.empty}>Henüz eklenmiş bir sosyal medya veya dış bağlantı yok.</p>
          ) : (
            <div className={local.liste}>
              {linkler.map((item, indeks) => {
                const duzenleniyor = duzenlenenId === item.id;
                const mesgul = islemId === item.id || kaydediliyor;
                return (
                  <article key={item.id} className={local.satir}>
                    <div className={local.satirUst}>
                      <div className={local.satirSol}>
                        <div className={local.ikonKare}>
                          <img src={item.ikonUrl} alt={item.ad} />
                        </div>
                        <div className={local.satirBilgi}>
                          <div className={local.satirAd}>
                            <span>{item.ad}</span>
                            <span className={`${styles.status} ${item.gorunur ? styles.statusActive : ""}`}>
                              {item.gorunur ? "Yayında" : "Gizli"}
                            </span>
                          </div>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={local.satirUrl}
                          >
                            <span>{item.url}</span>
                            <ExternalLink size={12} aria-hidden="true" />
                          </a>
                        </div>
                      </div>

                      <div className={local.satirAksiyonlar}>
                        <button
                          type="button"
                          className={styles.button}
                          aria-label={`${item.ad} bağlantısını yukarı taşı`}
                          disabled={mesgul || indeks === 0}
                          onClick={() => void handleSirala(item, "yukari")}
                        >
                          <ArrowUp aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className={styles.button}
                          aria-label={`${item.ad} bağlantısını aşağı taşı`}
                          disabled={mesgul || indeks === linkler.length - 1}
                          onClick={() => void handleSirala(item, "asagi")}
                        >
                          <ArrowDown aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className={styles.button}
                          disabled={mesgul}
                          onClick={() => (duzenleniyor ? duzenlemeyiKapat() : duzenlemeyiAc(item))}
                        >
                          <Pencil aria-hidden="true" />
                          {duzenleniyor ? "Kapat" : "Düzenle"}
                        </button>
                        <button
                          type="button"
                          className={styles.button}
                          disabled={mesgul}
                          onClick={() => void handleGorunurlukDegistir(item)}
                        >
                          {item.gorunur ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                          {item.gorunur ? "Gizle" : "Göster"}
                        </button>
                        <button
                          type="button"
                          className={`${styles.button} ${styles.danger}`}
                          disabled={mesgul}
                          onClick={() => setSilAdayi(item)}
                        >
                          <Trash2 aria-hidden="true" />
                          Sil
                        </button>
                      </div>
                    </div>

                    {duzenleniyor && (
                      <div className={local.duzenleKutusu}>
                        <div className={local.ayriAlanlar}>
                          <div className={local.ikonKutusu}>
                            <span className={local.onizlemeEtiketi}>İkon Yükleme (İsteğe Bağlı Değiştir)</span>
                            <div className={local.ikonOnizlemeRow}>
                              <div className={local.ikonKare} aria-hidden="true">
                                <img src={duzenIkonOnizleme ?? item.ikonUrl} alt="" />
                              </div>
                              <p className={local.ikonAciklama}>
                                Değiştirmek istemiyorsanız mevcut ikon korunur.
                              </p>
                            </div>
                            <input
                              ref={duzenIkonInputRef}
                              type="file"
                              accept=".svg,.png,.jpg,.jpeg,.webp,image/svg+xml,image/png,image/jpeg,image/webp"
                              className={local.gizliDosyaInput}
                              onChange={(e) => void ikonSec(e.target.files?.[0], "duzen")}
                              aria-label={`${item.ad} için yeni ikon seç`}
                            />
                            <div className={styles.actions}>
                              <button
                                type="button"
                                className={styles.button}
                                onClick={() => duzenIkonInputRef.current?.click()}
                                disabled={kaydediliyor}
                              >
                                <Upload aria-hidden="true" />
                                Yeni İkon Seç
                              </button>
                              {duzenIkon && (
                                <button
                                  type="button"
                                  className={styles.button}
                                  onClick={duzenIkonSeciminiTemizle}
                                  disabled={kaydediliyor}
                                >
                                  <X aria-hidden="true" />
                                  İptal
                                </button>
                              )}
                            </div>
                          </div>

                          <div className={local.bilgiAlanlari}>
                            <label className={styles.field}>
                              <span>Başlık / Platform Adı</span>
                              <input
                                type="text"
                                className={styles.input}
                                value={duzenAd}
                                onChange={(e) => setDuzenAd(e.target.value)}
                                maxLength={80}
                                disabled={kaydediliyor}
                              />
                            </label>

                            <label className={styles.field}>
                              <span>Link (URL) Alanı</span>
                              <input
                                type="url"
                                className={styles.input}
                                value={duzenUrl}
                                onChange={(e) => setDuzenUrl(e.target.value)}
                                disabled={kaydediliyor}
                              />
                            </label>

                            <div className={styles.formActions}>
                              <button
                                type="button"
                                className={`${styles.button} ${styles.primary}`}
                                onClick={() => void handleDuzenKaydet(item)}
                                disabled={kaydediliyor}
                              >
                                <Save aria-hidden="true" />
                                {kaydediliyor ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}
                              </button>
                              <button
                                type="button"
                                className={styles.button}
                                onClick={duzenlemeyiKapat}
                                disabled={kaydediliyor}
                              >
                                Vazgeç
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <AlertDialog open={!!silAdayi} onOpenChange={(acik) => { if (!acik && !siliniyor) setSilAdayi(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bağlantıyı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{silAdayi?.ad}&rdquo; bağlantısı ve yüklenen ikonu kalıcı olarak silinecek, cogniti.net ana sayfasından kaldırılacaktır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={siliniyor}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              disabled={siliniyor}
              onClick={(ev) => {
                ev.preventDefault();
                void handleSilOnay();
              }}
            >
              {siliniyor ? "Siliniyor…" : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
