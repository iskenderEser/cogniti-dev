"use client";

import { useRef, useState, type ReactNode } from "react";
import { Dialog } from "radix-ui";
import { CheckCircle2, Film, HelpCircle, X } from "lucide-react";
import { SadeKontrolButonu, SadeKontrolGrubu } from "@/components/kontrol/SadeKontroller";
import { HedefRolPilleri } from "@/components/pill/HedefRolPill";
import { YayinTuruPill } from "@/components/ogrenme-araci/YayinTuruPill";
import VideoOnizleme from "@/components/video/VideoOnizleme";
import type { PartnerEgitimi } from "@/lib/agora/partnerEgitimleri";
import type { PartnerEgitimFormVerisi } from "@/lib/agora/partnerEgitimFormu";
import { TUR_RAPOR_ADI, isIcerikTuru } from "@/lib/video/icerikTuru";

export interface PartnerYayinIncelemeDetayi {
  egitim: PartnerEgitimi & {bilgiler:Partial<PartnerEgitimFormVerisi>;yayinlandi_at?:string|null};
  medya: {egitimVideo:Medya|null;podcast:Medya|null};
}
interface Medya {dosya_adi:string;durum:string;izleme_url?:string|null;dinleme_url?:string|null}
const durumAdi={taslak:"Taslak",yayinda:"Yayında",pasif:"Pasif"};
function Bilgi({etiket,children}:{etiket:string;children:ReactNode}) {
  return <div className="min-w-0 rounded-xl border border-[var(--tema-yayin-detay-cizgi)] bg-[var(--tema-yayin-detay-yuzey)] p-3 shadow-sm">
    <dt className="text-xs font-bold text-[var(--tema-yayin-detay-alan-etiket)]">{etiket}</dt>
    <dd className="mt-1 break-words text-sm font-normal text-[var(--tema-yayin-detay-koyu-metin)]">{children}</dd>
  </div>;
}

/** Firma raporlarındaki YayinDetayModal'ın aynı tema, başlık, özet, sekme ve soru kartı düzeni. */
export default function PartnerYayinInceleme({detay,hata,baslik,onKapat}:{detay:PartnerYayinIncelemeDetayi|null;hata:string;baslik:string;onKapat:()=>void}) {
  const [sekme,setSekme]=useState<"arac"|"sorular">("arac");
  const [aciklamaAcik,setAciklamaAcik]=useState(false);
  const oncekiOdak=useRef<Element|null>(typeof document==="undefined"?null:document.activeElement);
  const e=detay?.egitim,b=e?.bilgiler,sorular=b?.soru_taslaklari??[];
  const medya=e?.yayin_araci==="podcast"?detay?.medya.podcast:detay?.medya.egitimVideo;
  const tarih=e?.yayinlandi_at??e?.olusturuldu_at;
  return <Dialog.Root open onOpenChange={open=>{if(!open)onKapat();}}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--tema-yayin-detay-ortu)] backdrop-blur-sm"/>
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[92dvh] w-[calc(100%_-_24px)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[var(--tema-yayin-detay-dis-cizgi)] bg-[var(--tema-yayin-detay-yuzey)] shadow-2xl"
        onCloseAutoFocus={event=>{event.preventDefault();if(oncekiOdak.current instanceof HTMLElement&&oncekiOdak.current.isConnected)oncekiOdak.current.focus();}}>
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--tema-yayin-detay-ust-cizgi)] bg-[var(--tema-yayin-detay-ust-zemin)] px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--tema-yayin-detay-simge-zemini)] text-[var(--tema-yayin-detay-eylem)]"><Film className="size-5" aria-hidden="true"/></span>
            <div className="min-w-0">
              {e&&<div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                {e.partner_egitim_id&&<span className="font-mono font-bold text-[var(--tema-yayin-detay-ust-etiket)]">{e.partner_egitim_id}</span>}
                {e.yayin_araci&&<YayinTuruPill tur={e.yayin_araci}/>}
                <span className="rounded-full border border-[var(--tema-yayin-detay-durum-cizgi)] bg-[var(--tema-yayin-detay-durum-zemin)] px-2 py-0.5 font-semibold text-[var(--tema-yayin-detay-durum-metin)]">{durumAdi[e.durum]}</span>
              </div>}
              <Dialog.Title className="truncate text-base font-bold text-[var(--tema-yayin-detay-baslik)]">{e?.egitim_adi??baslik}</Dialog.Title>
            </div>
          </div>
          <Dialog.Close aria-label="İncelemeyi Kapat" className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[var(--tema-yayin-detay-cizgi)] text-[var(--tema-yayin-detay-aciklama)] hover:bg-[var(--tema-yayin-detay-kapat-hover)]"><X className="size-4" aria-hidden="true"/></Dialog.Close>
          <Dialog.Description className="sr-only">Partner yayınının bilgilerini, öğrenme aracını ve soru setini inceleyin.</Dialog.Description>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--tema-yayin-detay-govde-zemin)] p-4 sm:p-6">
          {hata?<p role="alert" className="py-10 text-center text-sm text-[var(--tema-yayin-detay-hata-metin)]">{hata}</p>:!e?<p role="status" className="py-12 text-center text-sm text-[var(--tema-yayin-detay-aciklama)]">Yayın bilgileri yükleniyor…</p>:<div className="space-y-5">
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Bilgi etiket="Kategori">{isIcerikTuru(e.kategori)?TUR_RAPOR_ADI[e.kategori]:"Belirlenmedi"}</Bilgi>
              <Bilgi etiket="Fiyat">{e.fiyat_tl===null?"Fiyat Belirlenmedi":new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY"}).format(e.fiyat_tl)}</Bilgi>
              <Bilgi etiket="Yayın Tarihi">{tarih?new Date(tarih).toLocaleDateString("tr-TR"):"Belirlenmedi"}</Bilgi>
              <Bilgi etiket="Hedef Kitle">{b?.hedef_roller?.length?<HedefRolPilleri hedefRoller={b.hedef_roller}/>:"Belirlenmedi"}</Bilgi>
            </dl>
            <button type="button" aria-expanded={aciklamaAcik} onClick={()=>setAciklamaAcik(acik=>!acik)} className="block w-full cursor-pointer rounded-xl border border-[var(--tema-yayin-detay-cizgi)] bg-[var(--tema-yayin-detay-yuzey)] p-3.5 text-left">
              <span className="block text-xs font-bold text-[var(--tema-yayin-detay-alan-etiket)]">Eğitim Hakkında</span>
              <span className={`mt-2 whitespace-pre-wrap break-words text-sm font-normal leading-relaxed text-[var(--tema-yayin-detay-koyu-metin)] ${aciklamaAcik?"block":"line-clamp-5"}`}>{b?.aciklama||"Bilgi Girilmedi"}</span>
            </button>
            <SadeKontrolGrubu tur="sekme" aria-label="Yayın İnceleme Bölümleri">
              <SadeKontrolButonu type="button" onClick={()=>setSekme("arac")} aria-pressed={sekme==="arac"}><Film className="size-4" aria-hidden="true"/>Öğrenme Aracı Önizleme</SadeKontrolButonu>
              <SadeKontrolButonu type="button" onClick={()=>setSekme("sorular")} aria-pressed={sekme==="sorular"}><HelpCircle className="size-4" aria-hidden="true"/>Sorular ve Cevaplar ({sorular.length})</SadeKontrolButonu>
            </SadeKontrolGrubu>
            {sekme==="arac"?<section aria-label="Öğrenme Aracı Önizleme" className="rounded-2xl border border-[var(--tema-yayin-detay-cizgi)] bg-[var(--tema-yayin-detay-yuzey)] p-3.5 sm:p-5">
              {!medya?<p className="text-sm">Dosya Yüklenmedi</p>:<>
                <p className="mb-3 break-words text-xs text-[var(--tema-yayin-detay-aciklama)]">{medya.dosya_adi} · {medya.durum==="hazir"?"Hazır":medya.durum==="hata"?"İşlenemedi":medya.durum==="isleniyor"?"İşleniyor":"Aktarım Bekleniyor"}</p>
                {medya.izleme_url&&<VideoOnizleme videoUrl={medya.izleme_url+(medya.izleme_url.includes("?")?"&":"?")+"autoplay=false"}/>}
                {medya.dinleme_url&&<audio aria-label="Podcast Önizleme" className="w-full" controls controlsList="nodownload" preload="metadata" src={medya.dinleme_url}/>}
              </>}
            </section>:<section aria-label="Sorular ve Cevaplar" className="space-y-3">
              <dl className="grid grid-cols-3 gap-2">
                <Bilgi etiket="Soru Sayısı">{b?.soru_seti_buyuklugu??sorular.length}</Bilgi>
                <Bilgi etiket="Seçenek / Soru">{b?.secenek_sayisi??"Belirtilmedi"}</Bilgi>
                <Bilgi etiket="Soru / Yayın">{b?.yayin_basi_soru??"Belirtilmedi"}</Bilgi>
              </dl>
              {!sorular.length?<p className="p-6 text-center text-sm text-[var(--tema-yayin-detay-aciklama)]">Soru Seti Girilmedi</p>:sorular.map((s,i)=><article key={i} className="rounded-2xl border border-[var(--tema-yayin-detay-cizgi)] bg-[var(--tema-yayin-detay-yuzey)] p-4 sm:p-5">
                <h3 className="flex items-start gap-2 text-sm font-bold leading-relaxed text-[var(--tema-yayin-detay-koyu-metin)]"><span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--tema-yayin-detay-soru-numara-zemin)] text-xs text-[var(--tema-yayin-detay-soru-numara-metin)]">{i+1}</span>{s.soru_metni}</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">{s.secenekler.map((metin,j)=>{
                  const dogru=s.dogru===j;
                  return <div key={j} className={`flex items-start gap-2 rounded-xl border p-2.5 text-sm ${dogru?"border-[var(--tema-yayin-detay-dogru-cizgi)] bg-[var(--tema-yayin-detay-dogru-zemin)] text-[var(--tema-yayin-detay-dogru-metin)]":"border-[var(--tema-yayin-detay-secenek-cizgi)] bg-[var(--tema-yayin-detay-govde-zemin)] text-[var(--tema-yayin-detay-secenek-metni)]"}`}>
                    <span className="font-bold">{String.fromCharCode(65+j)}</span><span className="min-w-0 flex-1 break-words">{metin}</span>{dogru&&<span className="flex shrink-0 items-center gap-1 text-xs font-bold"><CheckCircle2 className="size-3.5" aria-hidden="true"/>Doğru</span>}
                  </div>;
                })}</div>
              </article>)}
            </section>}
          </div>}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
