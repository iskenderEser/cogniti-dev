import { notFound, redirect } from "next/navigation";
import { onayliPartnerBaglami } from "@/lib/agora/partnerProfilSunucu";
import PartnerEgitimSayfasi from "../PartnerEgitimSayfasi";
import type { PartnerEgitimFormKaydi } from "../PartnerEgitimFormu";

export default async function PartnerYeniEgitimPage({searchParams}:{searchParams:Promise<{egitim?:string|string[]}>}) {
  const b=await onayliPartnerBaglami();
  if(!b)redirect("/partner/profil");
  const {egitim:id}=await searchParams;
  let egitim:PartnerEgitimFormKaydi|null=null;
  if(id!==undefined){
    if(typeof id!=="string"||!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(id))notFound();
    const {data,error}=await b.db.rpc("agora_partner_egitim_detay_oku",{p_token_ozeti:b.tokenOzeti,p_egitim_id:id});
    if(error)throw new Error("Eğitim bilgileri okunamadı.");
    if(!data||data.egitim_id!==id)notFound();
    if(data.durum!=="taslak")redirect("/partner/egitimler");
    if(typeof data.egitim_adi!=="string"||!Number.isSafeInteger(data.surum)||data.surum<1)throw new Error("Eğitim bilgileri doğrulanamadı.");
    egitim={egitim_id:id,egitim_adi:data.egitim_adi,surum:data.surum,durum:"taslak",yayin_araci:data.yayin_araci==="podcast"?"podcast":"video"};
  }
  return <PartnerEgitimSayfasi key={id??"yeni"} sirketAdi={b.profil!.sirket_adi} logoSurumu={b.profil!.surum} egitim={egitim} istekId={crypto.randomUUID()}/>;
}
