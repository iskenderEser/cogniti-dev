"use client";
import { useEffect, useState } from "react";
import { Dialog } from "radix-ui";
import { ChartNoAxesColumn, Plus } from "lucide-react";
import styles from "./viva-oda.module.css";
import { Button } from "@/components/ui/button";
import { vivaAnketArsivIstek } from "@/lib/viva/anketArsiv";
import { vivaAnketDosyasi, vivaAnketTaslagi, type VivaAnketDurumu, type VivaAnketTaslagi } from "@/lib/viva/anket";
export default function VivaAnket({ etkinlikId, yonetebilir, bagli, izleyici, durum, ac, kapat, cevapla }: {
  etkinlikId?: string; yonetebilir: boolean; bagli: boolean; izleyici: boolean; durum: VivaAnketDurumu;
  ac: (s: VivaAnketTaslagi) => void | Promise<void>; kapat: () => void | Promise<void>; cevapla: (i: number) => void | Promise<void>;
}) {
  const [formAcik, setFormAcik] = useState(false);
  const [question, setQuestion] = useState(""), [options, setOptions] = useState(["", ""]);
  const [sorular, setSorular] = useState<VivaAnketTaslagi[]>([]), [hata, setHata] = useState("");
  const [busy, setBusy] = useState(false), [yukleniyor, setYukleniyor] = useState(Boolean(yonetebilir && etkinlikId));
  useEffect(() => {
    if (!yonetebilir || !etkinlikId) return;
    const kontrol = new AbortController();
    void vivaAnketArsivIstek(etkinlikId, "liste", {}, kontrol.signal).then(d => { if (!kontrol.signal.aborted) setSorular(d.sorular ?? []); })
      .catch(e => { if (!kontrol.signal.aborted) setHata(e instanceof Error ? e.message : "Sorular yüklenemedi."); })
      .finally(() => { if (!kontrol.signal.aborted) setYukleniyor(false); });
    return () => kontrol.abort();
  }, [etkinlikId, yonetebilir]);
  async function dene(is: () => void | Promise<void>) { if (busy) return; setBusy(true); try { await is(); setHata(""); } catch (e) { setHata(e instanceof Error ? e.message : "Soru işlemi tamamlanamadı."); } finally { setBusy(false); } }
  async function kaydet(islem: string, veri: Record<string, unknown>) {
    if (!etkinlikId) throw Error("Etkinlik bağlantısı bulunamadı.");
    const d = await vivaAnketArsivIstek(etkinlikId, islem, veri); setSorular(d.sorular ?? []);
  }
  if (!yonetebilir && !durum.soru) return null;
  const toplam = durum.sayilar.reduce((a, b) => a + b, 0);
  return <section aria-label="Viva soru ve anket" className={styles.poll}>
    <div className={styles.pollHeading}><h2>Soru / Anket</h2>{yonetebilir && <Dialog.Root open={formAcik} onOpenChange={setFormAcik}><Dialog.Trigger asChild><Button variant="outline" size="sm"><Plus aria-hidden="true" />Yeni soru</Button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.helpModal}><Dialog.Title>Yeni soru hazırla</Dialog.Title><Dialog.Description>Soru ve seçenekler bu etkinliğe bağlı kaydedilir.</Dialog.Description><form className={styles.questionForm} onSubmit={e => { e.preventDefault(); void dene(async () => {
      const s = vivaAnketTaslagi({ question, options });
      if (sorular.length >= 50) throw Error("En fazla 50 soru hazırlayabilirsiniz.");
      await kaydet("soru_ekle", { soru: { ...s, id: crypto.randomUUID() } }); setQuestion(""); setOptions(["", ""]); setFormAcik(false);
    }); }}><fieldset disabled={busy || yukleniyor}><label><span>Soru *</span><input maxLength={300} required value={question} onChange={e => setQuestion(e.target.value)} placeholder="Katılımcılara soracağınız soru" /></label><div className={styles.questionOptions}>{options.map((s, i) => <label key={i}><span>Seçenek {i + 1} *</span><input maxLength={150} required value={s} onChange={e => setOptions(l => l.map((v, j) => i === j ? e.target.value : v))} /></label>)}</div><div className={styles.formActions}><Button type="button" variant="outline" disabled={options.length >= 8} onClick={() => setOptions(l => [...l, ""])}>Seçenek ekle</Button>{options.length > 2 && <Button type="button" variant="outline" onClick={() => setOptions(l => l.slice(0, -1))}>Son seçeneği kaldır</Button>}</div></fieldset><p className={styles.help}>2–8 farklı seçenek. En fazla 50 soru hazırlayabilirsiniz.</p>{hata && <p role="alert" className={styles.errorText}>{hata}</p>}<div className={styles.formActions}><Dialog.Close asChild><Button type="button" variant="outline">Vazgeç</Button></Dialog.Close><Button type="submit" disabled={busy || yukleniyor}>{busy ? "Kaydediliyor…" : "Soruyu listeye ekle"}</Button></div></form></Dialog.Content></Dialog.Portal></Dialog.Root>}</div>
    {yonetebilir && yukleniyor && <p role="status" className={styles.help}>Kaydedilen sorular yükleniyor…</p>}
    {durum.soru && <article className={styles.questionCard} aria-live="polite"><span className={styles.pollStatus}>{durum.acik ? "Cevaplara açık" : "Cevaplama kapandı"}</span><h3>{durum.soru.question}</h3>
      {yonetebilir ? <><p className={styles.help}>{toplam} cevap</p><ul className={styles.resultList}>{durum.soru.options.map((s, i) => { const sayi = durum.sayilar[i] ?? 0, oran = toplam ? sayi / toplam * 100 : 0; return <li key={i}><div className={styles.barLabel}><span>{s}</span><strong>{sayi} · %{Math.round(oran)}</strong></div><div className={styles.barTrack} role="meter" aria-label={s} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(oran)}><div className={styles.barFill} style={{ width: `${oran}%` }} /></div></li>; })}</ul><Button variant="outline" disabled={busy || !bagli || !durum.acik} onClick={() => void dene(kapat)}>Soruyu kapat</Button></> : <div className={styles.answerList}>{durum.soru.options.map((s, i) => <Button key={i} variant="outline" disabled={busy || !bagli || izleyici || !durum.acik || durum.secim !== null || durum.gonderiliyor} onClick={() => void dene(() => cevapla(i))}>{s}{durum.secim === i && " ✓"}</Button>)}<p role="status" className={styles.help}>{!bagli ? "Cevaplamak için görüşmeye katılın." : izleyici ? "İzleyici olarak katıldığınız için cevap gönderemezsiniz." : !durum.acik ? "Cevaplama kapandı." : durum.secim !== null ? "Cevabınız alındı." : durum.gonderiliyor ? "Cevabınız gönderiliyor…" : "Bir seçenek seçin."}</p></div>}
    </article>}
    {yonetebilir && <><p className={styles.help}>{!bagli ? "Soruları yayına açmak için önce görüşmeye katılın." : "Bir seferde yalnızca bir soru açabilirsiniz."}</p>{!yukleniyor && !sorular.length && <div className={styles.emptyPoll}><ChartNoAxesColumn aria-hidden="true" /><p>Henüz soru hazırlamadınız. Yeni soru ekleyerek başlayın.</p></div>}
      <ol className={styles.questionList}>{sorular.map((s, i) => <li key={s.id ?? i} className={styles.questionCard}><span className={styles.help}>Soru {i + 1} · {s.options.length} seçenek</span><h3>{s.question}</h3><div className={styles.formActions}><Button variant="outline" disabled={busy || yukleniyor || !bagli || durum.acik} onClick={() => void dene(() => ac(s))}>Soruyu aç</Button><Button variant="ghost" aria-label={`Soru ${i + 1} sil`} disabled={busy || yukleniyor} onClick={() => void dene(() => kaydet("soru_sil", { soru_id: s.id }))}>Sil</Button></div></li>)}</ol>
      <div className={styles.importQuestions}><h3>Hazır sorular</h3><label><span>JSON dosyasından yükle</span><input type="file" disabled={busy || yukleniyor} accept=".json,application/json" onChange={async e => { const input = e.currentTarget, file = input.files?.[0]; if (!file) return; try { if (file.size > 200_000) throw Error("Soru dosyası en fazla 200 KB olabilir."); const liste = vivaAnketDosyasi(await file.text()); await dene(() => kaydet("sorular_yukle", { sorular: liste.map(s => ({ ...s, id: crypto.randomUUID() })) })); } catch (err) { setHata(err instanceof Error ? err.message : "Soru dosyası okunamadı."); } finally { input.value = ""; } }} /></label><a href="/viva-soru-ornek.json" download>Örnek soru dosyasını indir</a><p className={styles.help}>JSON · En fazla 200 KB, 50 soru. Sorular ve cevaplar bu etkinliğe bağlı kaydedilir.</p></div>
    </>}
    {hata && !formAcik && <p role="alert" className={styles.errorText}>{hata}</p>}
  </section>;
}
