"use client";
import {Button} from "@/components/ui/button";
import {useState} from "react";
import {useAuth} from "@/app/providers/AuthProvider";
import {useHataMesaji,HataMesajiContainer} from "@/components/HataMesaji";
import {useYayinYonetimi} from "@/app/(panel)/yayin-yonetimi/_hooks/useYayinYonetimi";
import {BekleyenSatir} from "@/app/(panel)/yayin-yonetimi/_components/BekleyenSatir";
import {YayinSatir} from "@/app/(panel)/yayin-yonetimi/_components/YayinSatir";
import {YayinOnayModal,OgrenmeAraciOnizlemeModal} from "@/app/(panel)/yayin-yonetimi/_components/Modallar";
import type {Bekleyen,OnizlemeHedefi} from "@/app/(panel)/yayin-yonetimi/_types";
import type {YayinHedefGrubu} from "@/lib/utils/roller";
export function AgoraYayinEditoru({hedef,talepId,onYayinlandi,onDuzenle}:{hedef:YayinHedefGrubu;talepId?:string;onYayinlandi:()=>void;onDuzenle?:(siparisId:string,talepId:string)=>void}) {
 const {kullanici}=useAuth();
 const {mesajlar,hata,basari}=useHataMesaji();
 const [acikAkordiyon,setAcikAkordiyon]=useState<string|null>(null);
 const [onizleme,setOnizlemeHedefi]=useState<OnizlemeHedefi|null>(null);
 const [onay,setOnayModal]=useState<Bekleyen|null>(null);
 const yy=useYayinYonetimi({kapsam:"agora",kullaniciId:kullanici?.id,aktifAnaSekme:hedef,hata,basari});
 const handleVideoAc=(url:string)=>setOnizlemeHedefi({arac_turu:"video",video_url:url});
 return <>
 {yy.loading&&<p role="status">Yayın ayarları yükleniyor…</p>}
 {yy.puanAralikHatasi&&<p role="alert">{yy.puanAralikHatasi}</p>}
 {yy.bekleyenler.filter(b=>b.agora_ayarlandi&&(!talepId||b.talep_id===talepId)).map(b=>(
              <BekleyenSatir key={b.soru_seti_durum_id} b={b}
                secimAlani={!talepId&&onDuzenle&&b.agora_siparis_id&&b.talep_id?<Button variant="outline" onClick={()=>onDuzenle(b.agora_siparis_id!,b.talep_id!)}>Hedef Rol ve Ürün</Button>:undefined}
                islemLoading={yy.islemLoading}
                puanAraliklari={yy.puanAraliklari}
                acikAkordiyon={acikAkordiyon} setAcikAkordiyon={setAcikAkordiyon}
                videoPuanlari={yy.videoPuanlari} setVideoPuanlari={yy.setVideoPuanlari}
                extraPuanlar={yy.extraPuanlar} setExtraPuanlar={yy.setExtraPuanlar}
                eczanemKazanimModelleri={yy.eczanemKazanimModelleri} setEczanemKazanimModelleri={yy.setEczanemKazanimModelleri}
                barkodlar={yy.barkodlar} setBarkodlar={yy.setBarkodlar}
                satisFiyatlar={yy.satisFiyatlar} setSatisFiyatlar={yy.setSatisFiyatlar}
                sahaPuanModelleri={yy.sahaPuanModelleri} setSahaPuanModelleri={yy.setSahaPuanModelleri}
                kazanimModelleri={yy.kazanimModelleri} setKazanimModelleri={yy.setKazanimModelleri}
                katlamaOranlari={yy.katlamaOranlari} setKatlamaOranlari={yy.setKatlamaOranlari}
                baremTablolari={yy.baremTablolari} setBaremTablolari={yy.setBaremTablolari}
                tekrarPeriyotlari={yy.tekrarPeriyotlari} setTekrarPeriyotlari={yy.setTekrarPeriyotlari}
                tekrarSecenekleri={yy.tekrarSecenekleri}
                yayinGunleri={yy.yayinGunleri} setYayinGunleri={yy.setYayinGunleri}
                tumPuanlarAtandiMi={yy.tumPuanlarAtandiMi}
                getSoruPuani={yy.getSoruPuani} setSoruPuani={yy.setSoruPuani} hepsineAyniPuanAta={yy.hepsineAyniPuanAta}
                onVideoAc={handleVideoAc}
                onOnizle={setOnizlemeHedefi}
                onYayinlaClick={setOnayModal}
                
              />
 ))}
 {!talepId&&yy.yayinlar.filter(y=>y.hedef_roller.join(",")===(hedef==="eczaci_ve_eczane_teknisyeni"?"eczaci,eczane_teknisyeni":hedef)).map(y=><YayinSatir key={y.yayin_id} y={y} islemLoading={yy.islemLoading} acikAkordiyon={acikAkordiyon} setAcikAkordiyon={setAcikAkordiyon} formatTarih={t=>new Date(t).toLocaleString("tr-TR")} tekrarBilgi={yy.tekrarBilgi[y.yayin_id]} getSoruPuani={yy.getSoruPuani} setSoruPuani={yy.setSoruPuani} hepsineAyniPuanAta={yy.hepsineAyniPuanAta} onVideoAc={handleVideoAc} onOnizle={setOnizlemeHedefi} onDurumDegistir={yy.handleDurumDegistir} onPlanIslem={yy.handlePlanIslem}/>)}
 {onizleme&&<OgrenmeAraciOnizlemeModal hedef={onizleme} onKapat={()=>setOnizlemeHedefi(null)}/>}
 {onay&&<YayinOnayModal bekleyen={onay} onIptal={()=>setOnayModal(null)} onYayinla={async()=>{const b=onay;setOnayModal(null);try{if(await yy.handleYayinla(b))onYayinlandi();}catch{hata("Yayın işlemi tamamlanamadı. Yayınlarınızı yenileyip kontrol edin.");}}}/>}
 <HataMesajiContainer mesajlar={mesajlar}/>
 </>;
}
