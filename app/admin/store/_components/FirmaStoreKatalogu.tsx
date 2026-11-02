"use client";

/* eslint-disable @next/next/no-img-element -- Merkezî katalogdaki yönetim görselleri. */
import { useState } from "react";
import { Tabs } from "radix-ui";
import { Ticket, Plus, RefreshCw, Pencil, Trash2, Search } from "lucide-react";
import { minimumSiparisTlGecerliMi } from "@/lib/tclub/store/katalog";
import type { UrunGosterim } from "../_types";
import { useFirmaStoreKatalogu } from "../_hooks/useFirmaStoreKatalogu";
import FirmaCekTalepleri from "./FirmaCekTalepleri";
import { CekFormu, KatalogPenceresi } from "./KatalogFormlari";
import s from "./katalog.module.css";

interface Props { hata: (message: string, step?: string, detail?: string) => void; basari: (message: string) => void }
type Editor = { type: "urun"; value: UrunGosterim | null };
type Silinecek = { id: string; name: string };

export function cekDurumu(urun: Pick<UrunGosterim, "aktif_mi" | "minimum_siparis_tl">) {
  if (!minimumSiparisTlGecerliMi(urun.minimum_siparis_tl)) return "eksik";
  return urun.aktif_mi ? "hazir" : "pasif";
}
const durumlar = { hazir: "Firma seçimine uygun", eksik: "Minimum TL eksik", pasif: "Pasif" };
const tl = (value: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 }).format(value);

export default function FirmaStoreKatalogu(_props: Props) {
  void _props;
  const api = useFirmaStoreKatalogu();
  const [tab, setTab] = useState("urunler");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [removal, setRemoval] = useState<Silinecek | null>(null);
  const query = search.trim().toLocaleLowerCase("tr-TR");
  const filtered = api.urunler.filter(u => (!query || `${u.ad} ${u.aciklama ?? ""}`.toLocaleLowerCase("tr-TR").includes(query)) && (!status || (status === "stoksuz" ? u.stok === 0 : status === "aktif" ? u.aktif_mi : status === "pasif" ? !u.aktif_mi : cekDurumu(u) === status)));
  const askDelete = (target: Silinecek) => { api.setIslemHatasi(""); setRemoval(target); };
  const openEditor = (value: Editor) => { api.setIslemHatasi(""); setEditor(value); };

  return <div className={s.panel}>
    <div className={s.intro}><div className={s.introIcon}><Ticket /></div><div><h2>Merkezî çek kataloğu</h2><p>Hediye çeklerini burada tanımlayın. Her firma kullanacağı çekleri ve Baz Puanını kendi FirmaStore ekranından belirler. Bu katalog tüm firmalar için ortaktır.</p></div></div>
    {api.mesaj && <p className={s.feedback} role="status">{api.mesaj}</p>}
    <Tabs.Root value={tab} onValueChange={setTab}>
      <Tabs.List className={s.tabs} aria-label="FirmaStore yönetimi"><Tabs.Trigger className={s.tab} value="urunler">Çek kataloğu</Tabs.Trigger><Tabs.Trigger className={s.tab} value="siparisler">Çek Talepleri</Tabs.Trigger></Tabs.List>
      <Tabs.Content value="urunler" className={s.tabContent}>
        <div className={s.stats} aria-label="Katalog özeti"><div className={s.stat}><strong>{api.yukleniyor || api.yuklemeHatasi ? "—" : api.urunler.length}</strong><span>Toplam çek</span></div><div className={s.stat}><strong>{api.yukleniyor || api.yuklemeHatasi ? "—" : api.urunler.filter(u => cekDurumu(u) === "hazir").length}</strong><span>Firma seçimine uygun</span></div><div className={s.stat}><strong>{api.yukleniyor || api.yuklemeHatasi ? "—" : api.urunler.filter(u => cekDurumu(u) === "eksik").length}</strong><span>Eksik tanım</span></div></div>
        <section className={s.card} aria-labelledby="cek-katalog-baslik">
          <div className={s.header}><div><h2 id="cek-katalog-baslik">Hediye çekleri</h2><p>Minimum TL tutarı, stok ve kullanılabilirlik.</p></div><div className={s.actions}><button type="button" className={s.button} disabled={api.yukleniyor || api.islem} aria-label="Kataloğu yenile" onClick={() => void api.yenile()}><RefreshCw />Yenile</button><button type="button" className={`${s.button} ${s.primary}`} disabled={api.yukleniyor || !!api.yuklemeHatasi || api.islem} onClick={() => openEditor({ type: "urun", value: null })}><Plus />Yeni çek</button></div></div>
          <div className={s.toolbar}>
            <label className={s.field}>Çek ara<input className={s.input} type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Çek adı veya açıklama" /></label>
            <label className={s.field}>Durum<select className={s.select} value={status} onChange={e => setStatus(e.target.value)}><option value="">Tüm durumlar</option><option value="hazir">Firma seçimine uygun</option><option value="eksik">Eksik tanım</option><option value="aktif">Aktif</option><option value="pasif">Pasif</option><option value="stoksuz">Stok tükendi</option></select></label>
          </div>
          {api.yuklemeHatasi ? <YuklemeHatasi message={api.yuklemeHatasi} retry={api.yenile} /> : api.yukleniyor ? <div className={s.empty} role="status">Katalog yükleniyor…</div> : !filtered.length ? <div className={s.empty}><Search /><strong>{api.urunler.length ? "Aramanıza uygun çek yok" : "Kataloğunuz hazır, ilk çeki ekleyin"}</strong><p>{api.urunler.length ? "Aramanızı veya filtrelerinizi değiştirin." : "Bir hediye çeki tanımlayarak firmaların seçimine sunabilirsiniz."}</p>{api.urunler.length > 0 && <button type="button" className={s.button} onClick={() => { setSearch(""); setStatus(""); }}>Filtreleri temizle</button>}</div> :
            <div className={s.tableWrap}><table className={s.table}><caption className={s.hidden}>Merkezî FirmaStore çekleri</caption><thead><tr><th scope="col">Hediye çeki</th><th scope="col">Minimum tutar</th><th scope="col">Stok</th><th scope="col">Durum</th><th scope="col">İşlemler</th></tr></thead><tbody>{filtered.map(u => <tr key={u.urun_id}>
              <td><div className={s.product}><div className={s.thumbnail}>{u.gorsel_url ? <img src={u.gorsel_url} alt="" /> : <Ticket aria-label="Görsel yok" />}</div><div><strong>{u.ad}</strong>{!u.gorsel_url && <small>Görsel yok</small>}</div></div></td>
              <td className={s.amount}>{minimumSiparisTlGecerliMi(u.minimum_siparis_tl) ? tl(u.minimum_siparis_tl) : "Tanımlanmadı"}</td>
              <td>{u.stok.toLocaleString("tr-TR")} adet{u.stok === 0 && <span className={s.stock}>Stok tükendi</span>}</td>
              <td><span className={s.badge} data-status={cekDurumu(u)}>{durumlar[cekDurumu(u)]}</span>{cekDurumu(u) === "eksik" && <span className={s.stock}>{u.aktif_mi ? "Aktif" : "Pasif"}</span>}</td>
              <td><div className={s.actions}><button type="button" className={s.button} disabled={api.islem} onClick={() => openEditor({ type: "urun", value: u })} aria-label={`${u.ad} çekini düzenle`}><Pencil />Düzenle</button><button type="button" className={`${s.button} ${s.danger}`} disabled={api.islem} aria-label={`${u.ad} çekini sil`} onClick={() => askDelete({ id: u.urun_id, name: u.ad })}><Trash2 />Sil</button></div></td>
            </tr>)}</tbody></table></div>}
          <div className={s.footer}><span role="status">{!api.yukleniyor && !api.yuklemeHatasi ? `${filtered.length} / ${api.urunler.length} çek gösteriliyor` : "Katalog bilgileri"}</span><span>Baz Puan, firma → Modüller → FirmaStore bölümünde tanımlanır.</span></div>
        </section>
      </Tabs.Content>
      <Tabs.Content value="siparisler" className={s.tabContent}><FirmaCekTalepleri /></Tabs.Content>
    </Tabs.Root>
    {editor?.type === "urun" && <CekFormu key={editor.value?.urun_id ?? "yeni"} urun={editor.value} onClose={() => setEditor(null)} onSaved={api.kaydedildi} />}
    {removal && <KatalogPenceresi title="Çeki sil" description={`“${removal.name}” kalıcı olarak silinecek. Firmanın bu çeke ait seçim ve Baz Puan tanımı da kaldırılır. Sipariş bağlantısı varsa işlem engellenir. Geçici olarak kapatmak için Düzenle ekranından pasifleştirebilirsiniz.`} busy={api.islem} onClose={() => setRemoval(null)}><div className={s.form}>{api.islemHatasi && <p role="alert" className={`${s.feedback} ${s.error}`}>{api.islemHatasi}</p>}<div className={s.formFooter}><button type="button" className={s.button} disabled={api.islem} onClick={() => setRemoval(null)}>Vazgeç</button><button type="button" className={`${s.button} ${s.danger}`} disabled={api.islem} onClick={async () => { if (await api.sil(removal.id)) setRemoval(null); }}>{api.islem ? "Siliniyor…" : "Kalıcı olarak sil"}</button></div></div></KatalogPenceresi>}
  </div>;
}
function YuklemeHatasi({ message, retry }: { message: string; retry: () => Promise<void> }) { return <div className={s.empty}><p role="alert" className={s.error}>{message}</p><button type="button" className={s.button} onClick={() => void retry()}><RefreshCw />Tekrar dene</button></div>; }
