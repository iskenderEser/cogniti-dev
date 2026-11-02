import * as XLSX from "xlsx";
import JSZip from "jszip";
import konum from "./referans/il-ilce.json";
import { DISA_AKTAR_KAPSAM } from "./disaAktarKapsam";
import { ROL_ADLARI, TUKETICI_ROLLER } from "@/lib/utils/roller";
import { yayin_kodu } from "@/lib/utils/yayinKodu";
import { cekTutariHesapla, type BaremSatiri } from "@/lib/eclub/store/eclubStoreTipler";

type Deger = string | number | boolean | null | Deger[] | { [k: string]: Deger };
export type Satir = Record<string, Deger>;
export type ExportKesiti = { surum: number; firma_id: string; an: string; veri: Record<string, Satir[]> };
const metin = (r: Satir, k: string) => String(r[k] ?? "");
const sayi = (r: Satir, k: string) => { const n = Number(r[k] ?? 0); if (!Number.isFinite(n)) throw new Error(`${k} sayısal değil.`); return n; };
const para = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const zaman = (r: Satir, k = "created_at") => new Date(metin(r,k)).getTime();
const donemKodu = (i: number) => `${Math.floor(i/6)}-P${i%6+1}`;
const donemBas = (i: number) => Date.UTC(Math.floor(i/6),(i%6)*2,1)-3*3600000;
const donemBul = (t: number) => { const d=new Date(t+3*3600000); return d.getUTCFullYear()*6+Math.floor(d.getUTCMonth()/2); };
const toplam = (r: Satir[], k: string) => r.reduce((a,s)=>a+sayi(s,k),0);
const kimlik = (r: Satir) => [r.musteri_id,r.eczane_id,r.urun_id].join(":");
const uyeAdiMaskele = (v: Deger) => String(v??"").trim().split(/\s+/u).filter(Boolean).map(ad=>`${Array.from(ad)[0]}***`).join(" ");
const uyeTelefonuMaskele = (v: Deger) => {
  const rakamlar=String(v??"").replace(/\D/g,"");
  return rakamlar.length>4?"*".repeat(rakamlar.length-4)+rakamlar.slice(-4):rakamlar?"****":"";
};
const uyeEpostasiMaskele = (v: Deger) => {
  const eposta=String(v??"").trim();if(!eposta)return "";
  const at=eposta.lastIndexOf("@");
  return `${Array.from(at>0?eposta.slice(0,at):eposta)[0]}***${at>0?eposta.slice(at):""}`;
};

/** Hesaplar tek MVCC kesitinden yapılır; puan, devir ve sipariş tablolarına yazılmaz. */
export function haklariHesapla(k: ExportKesiti) {
  const d=k.veri, an=Date.parse(k.an);
  if (!Number.isFinite(an)) throw new Error("Dışa aktarma zamanı geçersiz.");
  const eclub: Satir[]=[], uye: Satir[]=[], saha: Satir[]=[], bekleyen: Satir[]=[];
  const kosullar=new Map(d.kosullar.map(r=>[metin(r,"yayin_id"),r]));
  const gruplar=new Map<string,Satir[]>();
  for (const p of d.eczane_puan) {
    if (!p.cek_karsiligi_var_mi || zaman(p)>an) continue;
    if (!p.eczane_id) throw new Error("E-Club kazanımında eczane aidiyeti eksik.");
    const key=[p.eczane_id,p.yayin_id].join(":"); const mevcut=gruplar.get(key);if(mevcut)mevcut.push(p);else gruplar.set(key,[p]);
  }
  for (const puanlar of gruplar.values()) {
    const p=puanlar[0], yayin=metin(p,"yayin_id"), eczane=metin(p,"eczane_id"), y=kosullar.get(yayin);
    if (!y) throw new Error("E-Club hakkının yayın koşulları bulunamadı.");
    const talepler=d.cekler.filter(t=>t.eczane_id===eczane&&t.yayin_id===yayin&&t.durum!=="iptal"&&zaman(t)<=an);
    const ilk=puanlar.reduce((m,t)=>Math.min(m,donemBul(zaman(t))),Infinity); let gelen=0;
    for(let i=ilk;i<=donemBul(an);i++) {
      const kod=donemKodu(i), bas=donemBas(i), bit=donemBas(i+1), talep=talepler.filter(t=>t.donem_kodu===kod);
      const kazanc=toplam(puanlar.filter(t=>zaman(t)>=bas&&zaman(t)<bit),"puan"), ayrilan=toplam(talep,"toplanan_puan");
      const kalan=kazanc+gelen-ayrilan;
      if(kalan<0) throw new Error(`E-Club bakiye tutarsız: ${eczane}, ${yayin}, ${kod}`);
      const sabit=d.silinmeler.find(s=>s.eczane_id===eczane&&s.yayin_id===yayin&&s.donem_kodu===kod);
      const tip=metin(sabit??talep[0]??y,"satis_sarti_tipi") || metin(talep[0]??{},"siparis_tipi") || metin(y,"satis_sarti_tipi");
      const siparisVar=talep.some(t=>t.siparis_verildi_mi===true);
      const kapanis=bit+7*86400000;
      const silinir=an>=kapanis&&(i%6===5||(tip==="satis_sartli"&&!siparisVar));
      const silinen=silinir?kalan:0;
      if(an>=kapanis) { gelen=kalan-silinen; continue; }
      let tutar: number | null=null;
      if(kalan>0) {
        if(!Array.isArray(y.barem_tablosu)||sayi(y,"karsilik_puan")<=0||sayi(y,"karsilik_tl")<=0) throw new Error("Çek hakkının barem veya dönüşüm oranı eksik.");
        tutar=cekTutariHesapla({puan:kalan,satis_sarti_tipi:tip as "satis_sartli"|"serbest_siparis"|"siparissiz_cek",siparis_verildi:tip==="satis_sartli",katlama_orani:sayi(y,"gizli_sart_katlama_orani"),karsilik_puan:sayi(y,"karsilik_puan"),karsilik_tl:sayi(y,"karsilik_tl"),baremler:y.barem_tablosu as unknown as BaremSatiri[]}).cek_tutari_tl;
      }
      eclub.push({eczane_id:eczane,yayin_id: yayin,donem_kodu:kod,kazanilan: kazanc,devreden:gelen,talebe_ayrilan:ayrilan,kalan_puan:kalan,cek_tl:tutar,satis_sarti_tipi:tip,hak_durumu:tip==="satis_sartli"?"Sipariş koşuluyla değerlendirilecek":"Yayın koşullarına göre",talep_penceresi_bitis:new Date(kapanis).toISOString()});
      gelen=0; // Önceki dönemin talep penceresi sürerken yeni döneme devir yapılmaz.
    }
  }
  const omur=Number(d.ayarlar.find(r=>r.anahtar==="eczanem_puan_omru_gun")?.deger??180);
  if(!Number.isFinite(omur)||omur<=0) throw new Error("Eczanem puan ömrü geçersiz.");
  const uyeler=new Map(d.uye_kisiler.map(r=>[metin(r,"musteri_id"),r]));
  const uyelikler=new Map(d.uyelikler.map(r=>[[r.musteri_id,r.eczane_id].join(":"),r]));
  const bakiyeGruplari=new Map<string,Satir[]>();
  for(const p of d.uye_puan) { if(zaman(p)>an)continue; const key=kimlik(p); const mevcut=bakiyeGruplari.get(key);if(mevcut)mevcut.push(p);else bakiyeGruplari.set(key,[p]); }
  for(const puanlar of bakiyeGruplari.values()) {
    const p=puanlar[0], bag=uyelikler.get([p.musteri_id,p.eczane_id].join(":")), kisi=uyeler.get(metin(p,"musteri_id"));
    const pasifBitis=bag&&bag.aktif_mi!==true?zaman(bag,"son_islem_tarihi")+30*86400000:Infinity;
    const gecerli=puanlar.filter(t=>sayi(t,"kalan_puan")>0&&zaman(t)>=an-omur*86400000);
    const kayitli=toplam(gecerli,"kalan_puan");
    const acik=Boolean(bag&&kisi?.aktif_mi===true&&(bag.aktif_mi===true||an<=pasifBitis));
    const tarife=(d.eczanem_merkezi_tarifeler??[]).filter(t=>t.urun_id===p.urun_id&&zaman(t,"gecerlilik_baslangic")<=an).sort((a,b)=>zaman(b,"gecerlilik_baslangic")-zaman(a,"gecerlilik_baslangic"))[0];
    if(kayitli>0&&(!tarife||sayi(tarife,"puan")<=0)) throw new Error("Eczanem bakiyesinin geçerli tarifesi eksik.");
    const kullanilabilir=acik?kayitli:0;
    uye.push({musteri_id:p.musteri_id,eczane_id:p.eczane_id,urun_id:p.urun_id,kayitli_gecerli_puan:kayitli,kullanilabilir_puan:kullanilabilir,indirim_tl:tarife?para(kullanilabilir*sayi(tarife,"tl")/sayi(tarife,"puan")):0,tarife_puan:tarife?.puan??null,tarife_tl:tarife?.tl??null,ilk_son_kullanim:gecerli.length?new Date(gecerli.reduce((m,t)=>Math.min(m,zaman(t)+omur*86400000),pasifBitis)).toISOString():null,hak_durumu:acik?"Üyelik kapsamında kullanılabilir":"Üyelik kapsamında kullanım kapalı"});
  }
  for(const b of d.saha_bakiye) {
    const id=metin(b,"kullanici_id"), u=d.kullanicilar.find(r=>r.kullanici_id===id);
    if(!u) throw new Error("Saha bakiyesinin sahibi bulunamadı.");
    saha.push({kullanici_id:id,rol:u.rol,magaza_bakiyesi:b.bakiye,bakiye_kaynagi:"Mevcut FirmaStore dönem hesabı",hak_durumu:"Puan; doğrudan TL alacağı değildir"});
  }
  type Sorumlu = { sorumlu_id: Deger; sorumlu_rol?: string; sorumluluk_aciklamasi?: string };
  const kisi=(r:Satir,key:string,rol:string):Sorumlu=>({sorumlu_id:r[key]??null,sorumlu_rol:rol,...(!r[key]?{sorumluluk_aciklamasi:"Bu aşamanın sorumlu kişi ataması bulunamadı."}:{})});
  const mutabakatSorumlusu=(r:Satir):Sorumlu=>{
    if(r.onay_durumu==="bm_onayinda")return kisi(r,"bm_id","Bölge Müdürü");
    if(r.onay_durumu==="tm_onayinda")return kisi(r,"tm_id","Tanıtım Müdürü");
    if(r.onay_durumu!=="utt_hazirliginda")return {sorumlu_id:null,sorumluluk_aciklamasi:"İşlem aşamasının sorumlu rolü belirlenemedi."};
    const onay=d.onaylar.find(o=>o.eczanem_indirim_onay_id===r.mutabakat_id);
    // UTT hazırlığında henüz karar veren kişi olmayabilir. Yetki RPC'sindeki
    // aktif eczane-firma bağı ve takım kapsamı kullanılır; ilk aday rastgele seçilmez.
    const baglar=d.firma_eczaneler.filter(b=>b.aktif_mi===true&&b.firma_id===k.firma_id&&b.eczane_id===onay?.eczane_id);
    const adaylar=d.kullanicilar.filter(u=>u.aktif_mi===true&&u.firma_id===k.firma_id&&TUKETICI_ROLLER.includes(metin(u,"rol").toLowerCase())&&(!onay?.takim_id||u.takim_id===onay.takim_id)&&d.eczane_utt.some(b=>b.aktif_mi===true&&b.utt_id===u.kullanici_id&&baglar.some(f=>f.id===b.eczane_firma_id)));
    return {sorumlu_id:adaylar.length===1?adaylar[0].kullanici_id:null,sorumlu_rol:"Ürün Tanıtım Temsilcisi",...(adaylar.length!==1?{sorumluluk_aciklamasi:adaylar.length?"Birden fazla yetkili temsilci: "+adaylar.map(u=>[u.ad,u.soyad].filter(Boolean).join(" ")||metin(u,"kullanici_id")).join(", "):"Aktif eczane ve takım bağına sahip yetkili temsilci bulunamadı."}:{})};
  };
  const cekSorumlusu=(r:Satir):Sorumlu=>{
    if(r.durum==="bm_onayinda")return kisi(r,"bm_id","Bölge Müdürü");
    if(r.durum==="tm_onayinda")return kisi(r,"tm_id","Tanıtım Müdürü");
    if(r.durum==="onaylandi"||r.durum==="teslimat_bekliyor")return {sorumlu_id:null,sorumlu_rol:"Çek Temini ve Teslimatı",sorumluluk_aciklamasi:"Onay tamamlandı; çek temini veya teslimat işlemi bekleniyor."};
    return kisi(r,"utt_id","Ürün Tanıtım Temsilcisi");
  };
  const ekle=(kaynak:string, liste:Satir[],durumKey:string,son:string[],sorumlu:string|((r:Satir)=>Sorumlu),idKey:string)=>{
    for(const r of liste) if(!son.includes(metin(r,durumKey))) bekleyen.push({kaynak,kayit_id:r[idKey]??null,durum:r[durumKey]??null,...(typeof sorumlu==="function"?sorumlu(r):{sorumlu_id:r[sorumlu]??null}),created_at:r.created_at??null});
  };
  ekle("FirmaStore",d.store_siparis,"durum",["iptal","teslim_edildi"],"kullanici_id","siparis_id");
  ekle("E-Club Çek",d.cekler,"durum",["iptal","cek_kodlari_gonderildi"],cekSorumlusu,"talep_id");
  ekle("Eczanem İndirim",d.uye_siparis,"durum",["onaylandi","dustu"],"islem_yapan_kisi_id","siparis_id");
  ekle("Eczanem Mutabakat",d.mutabakat,"onay_durumu",["onaylandi","tm_reddetti"],mutabakatSorumlusu,"mutabakat_id");
  ekle("Planlı Gönderi",d.planlar,"durum",["gerceklesti","gerceklesmedi"],"utt_id","plan_id");
  ekle("Viva",d.viva,"durum",["sona_erdi","iptal"],"sahip_id","etkinlik_id");
  ekle("Viva Tüketim Hesabı",d.viva_kullanim,"durum",["tamam"],"sahip_id","etkinlik_id");
  for(const t of d.talepler) if(!d.yayinlar.some(y=>y.talep_no===t.talep_no)) bekleyen.push({kaynak:"Üretim Talebi",kayit_id:t.talep_id,durum:t.taslak_mi?"Taslak":"Yayın kaydı bulunmuyor",sorumlu_id:t.uretici_id,created_at:t.created_at});
  return {eclub,uye,saha,bekleyen};
}

const BASLIKLAR:Record<string,string>={
 minimum_siparis_tl:"Minimum Sipariş Tutarı (TL)",baz_puan:"Firma Baz Puanı",cek_birim_tl:"Siparişteki Birim Çek Tutarı (TL)",toplam_tl:"Siparişteki Toplam Çek Tutarı (TL)",puan_birim_fiyat:"Siparişteki Birim Puan",
 kullanici_id:"Kullanıcı Referansı",kisi_id:"E-Club Üye Referansı",musteri_id:"Eczanem Üye Referansı",eczane_id:"Eczane Referansı",firma_id:"Firma Referansı",yayin_id:"Yayın Referansı",urun_id:"Ürün Referansı",rol:"Rol",ad:"Ad",soyad:"Soyad",eposta:"E-posta",telefon:"Cep Telefonu",aktif_mi:"Aktif",aktif:"Firma Aktif",created_at:"Kayıt Zamanı",updated_at:"Güncelleme Zamanı",guncellenme_at:"Güncelleme Zamanı",an:"Döküm Zamanı",toplam_saniye:"Toplam Kişi-Saniye",katilim_sayisi:"Katılım Sayısı",oturum_sayisi:"Oturum Sayısı",kalan_puan:"Kalan Puan",puan:"Puan",karsilik_puan:"Dönüşüm Puanı",karsilik_tl:"Dönüşüm TL",token:"Tüketilen Token",asim_miktari:"Paket Aşımı",kko_asim:"Paket Aşımı",gonderen_id:"Gönderen Referansı",alici_kimligi:"Alıcı Referansı",islem_turu:"Eylem",arac_turu:"Yayın Aracı",talep_no:"Yayın Numarası",magaza_bakiyesi:"FirmaStore Kullanılabilir Puanı",cek_tl:"Koşullara Bağlı Çek Tutarı (TL)",indirim_tl:"İndirim Tutarı (TL)",toplam_puan:"Kullanılan Toplam Puan",satis_fiyati:"Satış Fiyatı (TL)",talep_edilen_cek_tl:"Talep Edilen Çek Tutarı (TL)",saha_puan_modeli:"Saha Puan Modeli",cek_karsiligi_var_mi:"Çek Karşılığı Var",bilgi:"Bilgi",deger:"Değer",ad_soyad:"Ad Soyad",sorumlu_ad_soyad:"Sorumlu Kişi Ad Soyad",sorumlu_eposta:"Sorumlu Kişi E-posta",sorumlu_telefon:"Sorumlu Kişi Cep Telefonu",talebe_ayrilan:"Talebe Ayrılan Puan",kayitli_gecerli_puan:"Süresi Dolmamış Kayıtlı Puan",kullanilabilir_puan:"Kullanılabilir Puan",ilk_son_kullanim:"En Yakın Son Kullanım",tarife_tl:"Tarife TL",tarife_puan:"Tarife Puanı",miktar:"Token Miktarı",kalan:"Kalan Token",son_kullanim_at:"Token Son Kullanım",adres:"Adres",vergi_numarasi:"Vergi Numarası",vergi_dairesi:"Vergi Dairesi",not:"Açıklama"
};
const DURUMLAR:Record<string,string>={beklemede:"Beklemede",bm_onayinda:"BM Onayında",tm_onayinda:"TM Onayında",onaylandi:"Onaylandı",teslimat_bekliyor:"Teslimat Bekliyor",cek_kodlari_gonderildi:"Çek Kodları Gönderildi",iptal:"İptal",bekliyor:"Bekliyor",isleniyor:"İşleniyor",gerceklesti:"Gerçekleşti",gerceklesmedi:"Gerçekleşmedi",utt_hazirliginda:"UTT Hazırlığında",tm_reddetti:"TM Reddetti",tamam:"Tamamlandı",hata:"Hata",dustu:"Sonlandırıldı",taslak:"Taslak",yayinda:"Yayında",planlandi:"Planlandı",canli:"Canlı",sona_erdi:"Sona Erdi",video:"Video",podcast:"Podcast",gorsel:"Dijital Broşür",flip_pdf:"Literatür",tl_karsilikli:"TL Karşılıklı",tlsiz:"TL’siz",satis_sartli:"Satış Şartlı",siparissiz_cek:"Siparişsiz Çek",serbest_siparis:"İsteğe Bağlı Sipariş",yayin:"Yayın Gönderimi",tclub_oneri:"BM Önerisi",eclub_oneri:"E-Club Gönderimi",eczanem_musteri:"Eczanem Üye Gönderimi",cclub_challenge:"Challenge Gönderimi",viva_sure:"Viva Süre Tüketimi",viva_davet:"Eski Viva Davet Tüketimi"};
function baslik(k:string):string {
 if(k==="sorumlu_id_ad_soyad")return "Sorumlu Kişi";
 if(k==="sorumlu_id")return "Sorumlu Kişi Referansı";
 if(k==="sorumlu_rol")return "Sorumlu Rol / Süreç";
 if(k==="sorumluluk_aciklamasi")return "Sorumluluk Açıklaması";
 if(k.endsWith("_tarih"))return baslik(k.slice(0,-6)).replace(/ Zamanı$| Tarihi$/,"")+" Tarihi";
 if(k.endsWith("_saat"))return baslik(k.slice(0,-5)).replace(/ Zamanı$| Tarihi$/,"")+" Saati";
 if(k.endsWith("_ad_soyad"))return baslik(k.slice(0,-9)).replace("Referansı","").trim()+" Ad Soyad";
 return BASLIKLAR[k]??k.replace(/_/g," ").replace(/\b\w/g,c=>c.toLocaleUpperCase("tr-TR")); }
function cell(v:Deger|undefined): string|number {
 if(v==null)return ""; if(typeof v==="boolean")return v?"Evet":"Hayır"; if(typeof v==="number")return v;
 if(typeof v==="object")return JSON.stringify(v);
 return v;
}
export async function firmaExceliOlustur(k:ExportKesiti) {
 if(k.surum!==2||!k.veri?.firma?.[0]||k.veri.firma[0].firma_id!==k.firma_id)throw new Error("Dışa aktarma kesiti geçersiz.");
 for(const p of DISA_AKTAR_KAPSAM)if(!Array.isArray(k.veri[p.key]))throw new Error(`${p.ad} verisi eksik.`);
 for(const key of ["saha_bakiye","token_bakiye","ayarlar","lig_utt","lig_bm"])if(!Array.isArray(k.veri[key]))throw new Error(`${key} verisi eksik.`);
 const hesap=haklariHesapla(k), wb=XLSX.utils.book_new(), envanter:Satir[]=[];
 const adlar=new Map<string,string>(), eczaneAdlari=new Map<string,string>(), urunAdlari=new Map<string,string>(), yayinAdlari=new Map<string,string>();
 for(const r of [...k.veri.kullanicilar,...k.veri.eczane_kisiler,...k.veri.uye_kisiler]) { const id=metin(r,"kullanici_id")||metin(r,"kisi_id")||metin(r,"musteri_id"), ad=metin(r,"ad_soyad")||[r.ad,r.soyad].filter(Boolean).join(" ");adlar.set(id,r.musteri_id?uyeAdiMaskele(ad):ad); }
 for(const r of k.veri.master)eczaneAdlari.set(metin(r,"gln"),metin(r,"eczane_adi"));
 for(const r of k.veri.eczaneler)eczaneAdlari.set(metin(r,"eczane_id"),eczaneAdlari.get(metin(r,"gln"))??metin(r,"gln"));
 for(const r of [...k.veri.urunler,...k.veri.hediye_urun])urunAdlari.set(metin(r,"urun_id"),metin(r,"urun_adi")||metin(r,"ad"));
 const takimAdlari=new Map(k.veri.takimlar.map(r=>[metin(r,"takim_id"),metin(r,"takim_adi")]));
 const bolgeAdlari=new Map(k.veri.bolgeler.map(r=>[metin(r,"bolge_id"),metin(r,"bolge_adi")]));
 for(const r of k.veri.yayinlar)yayinAdlari.set(metin(r,"yayin_id"),yayin_kodu(metin(r,"firma_adi"),sayi(r,"talep_no")));
 // Yalnız şemada tarih/zaman olan alanlar ayrılır. atlama_baslangic ve
 // atlama_bitis gibi saniye alanları ad benzerliğiyle tarih kabul edilmez.
 const tarihAlanlari=new Set([
  "created_at","updated_at","guncellenme_at","baslangic","bitis",
  "baslangic_tarihi","bitis_tarihi","bm_karar_tarihi","bm_onay_tarihi",
  "cek_gonderim_tarihi","durdurma_tarihi","gecerlilik_baslangic","gerceklesti_at",
  "hedef_gonderim_at","izleme_baslangic","izleme_bitis","kapanis","kapanis_at",
  "karar_tarihi","kaynak_ceyrek_baslangici","onay_tarihi","oneri_baslangic",
  "oneri_bitis","son_islem_tarihi","son_kullanim_at","son_tarih","tamamlandi",
  "teslim_alma_at","tm_karar_tarihi","tm_onay_tarihi","token_pasif_at",
  "utt_gonderim_tarihi","utt_karar_tarihi","yayin_oncesi_silme_tarihi",
  "yayin_tarihi","ilk_son_kullanim","talep_penceresi_bitis",
 ]);
 const tarihDegeri=(v:Deger)=>typeof v==="string"&&/^\d{4}-\d\d-\d\d(?:T|$)/.test(v)&&Number.isFinite(Date.parse(v));
 const tarihBicimi=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Istanbul",year:"numeric",month:"numeric",day:"numeric",hour:"numeric",minute:"numeric",second:"numeric",hourCycle:"h23"});
 const zengin=(r:Satir,tarihler:Set<string>):Satir=>{
  const a:Satir={};for(const [key,hamDeger]of Object.entries(r)) {
   // Ham üye sayfası ve diğer sayfalardaki üye alanları aynı biçimde maskelenir.
   // Kimlikten türetilen adlar da yukarıdaki maskeli ad haritasından gelir.
   const v=hamDeger==null||!r.musteri_id?hamDeger:
    ["ad","soyad","ad_soyad","musteri_etiket"].includes(key)?uyeAdiMaskele(hamDeger):
    key==="telefon"?uyeTelefonuMaskele(hamDeger):key==="eposta"?uyeEpostasiMaskele(hamDeger):hamDeger;
   if(key==="il_id")a.il_adi=konum.iller.find(i=>i.il_id===Number(v))?.il_adi??"";
   if(key==="ilce_id")a.ilce_adi=konum.ilceler.find(i=>i.ilce_id===Number(v))?.ilce_adi??"";
   if(tarihler.has(key)) {
    a[`${key}_tarih`]=null;a[`${key}_saat`]=null;
    if(v!=null&&v!=="") {
     if(!tarihDegeri(v))throw new Error(`${key}: dışa aktarılan tarih geçersiz.`);
     const parcalar=tarihBicimi.formatToParts(new Date(String(v))), bolum=(tur:string)=>Number(parcalar.find(p=>p.type===tur)?.value??0);
     a[`${key}_tarih`]=Date.UTC(bolum("year"),bolum("month")-1,bolum("day"))/86400000+25569;
     a[`${key}_saat`]=/^\d{4}-\d\d-\d\d$/.test(String(v))?null:(bolum("hour")*3600+bolum("minute")*60+bolum("second"))/86400;
    }
    continue;
   }
   if(typeof v==="string"&&adlar.has(v))a[`${key}_ad_soyad`]=adlar.get(v)!;
   if(key==="takim_id")a.takim_adi=takimAdlari.get(String(v))??"";
   if(key==="bolge_id")a.bolge_adi=bolgeAdlari.get(String(v))??"";
   if(key==="eczane_id")a.eczane_adi=eczaneAdlari.get(String(v))??"";
   if(key==="urun_id")a.urun_adi=urunAdlari.get(String(v))??"";
   if(key==="yayin_id")a.yayin_kodu=yayinAdlari.get(String(v))??"";
   a[key]=key==="rol"&&typeof v==="string"?(ROL_ADLARI[v]??v):typeof v==="string"&&["durum","onay_durumu","satis_sarti_tipi","siparis_tipi","arac_turu","islem_turu","saha_puan_modeli"].includes(key)?DURUMLAR[v]??v:v;
  }return a;
 };
 function sayfa(ad:string,ham:Satir[],varsayilan:string[]=["bilgi"]) {
  const hamKeys=[...new Set([...varsayilan.filter(key=>key!=="bilgi"),...ham.flatMap(Object.keys)])];
  const tarihler=new Set(hamKeys.filter(key=>tarihAlanlari.has(key)));
  const rows=ham.map(r=>zengin(Object.fromEntries(hamKeys.map(key=>[key,r[key]??null])),tarihler));
  const keys=rows.length?[...new Set(rows.flatMap(Object.keys))]:Object.keys(zengin(Object.fromEntries(hamKeys.map(key=>[key,null])),tarihler));
  if(!keys.length)keys.push(...varsayilan);
  // Excel hücre/satır sınırları aşılınca bilgi kesilmez: ek sütun/sayfa açılır.
  const genislik=new Map(keys.map(key=>[key,rows.reduce((m,r)=>Math.max(m,Math.ceil(String(cell(r[key])).length/32000)),1)]));
  const kolonlar=keys.flatMap(key=>Array.from({length:genislik.get(key)!},(_,i)=>({key,parca:i})));
  if(kolonlar.length>16384)throw new Error(`${ad}: Excel sütun sınırı aşıldı.`);
  const boyut=1000000;
  for(let start=0;start<Math.max(rows.length,1);start+=boyut) {
   let isim=ad.slice(0,27)+(start?` ${start/boyut+1}`:"");let suffix=1;while(wb.SheetNames.includes(isim))isim=ad.slice(0,25)+` ${++suffix}`;
   const data:(string|number)[][]=[kolonlar.map(c=>baslik(c.key)+(c.parca?` (${c.parca+1})`:""))];
   for(const r of rows.slice(start,start+boyut))data.push(kolonlar.map(c=>{const v=cell(r[c.key]);return typeof v==="number"?v:String(v).slice(c.parca*32000,(c.parca+1)*32000)}));
   const ws=XLSX.utils.aoa_to_sheet(data);ws['!autofilter']={ref:XLSX.utils.encode_range({r:0,c:0},{r:Math.max(data.length-1,0),c:kolonlar.length-1})};
   ws['!cols']=kolonlar.map(c=>({wch:Math.min(45,Math.max(14,baslik(c.key).length+2))}));
   // XLSX tüketicileri destekliyorsa ilk satır sabitlenir; dosya verisi buna bağlı değildir.
   ws['!views']=[{state:'frozen',ySplit:1}];
   for(const [adres,hucre]of Object.entries(ws))if(!adres.startsWith('!')&&typeof hucre==='object'&&hucre&&'t'in hucre&&hucre.t==='n'){const key=kolonlar[XLSX.utils.decode_cell(adres).c].key;hucre.z=key.endsWith('_tarih')?'dd"."mm"."yyyy':key.endsWith('_saat')?'hh:mm:ss':key.includes('tl')||!Number.isInteger(hucre.v)?'#,##0.00':'#,##0';}
   XLSX.utils.book_append_sheet(wb,ws,isim);envanter.push({sayfa:isim,kayit_sayisi:data.length-1});
  }
 }
 const ozet:Satir[]=[{bilgi:"Firma",deger:k.veri.firma[0].firma_adi},{bilgi:"Döküm zamanı (Türkiye)",deger:new Date(k.an).toLocaleString("tr-TR",{timeZone:"Europe/Istanbul"})},{bilgi:"Firma durumu",deger:k.veri.firma[0].aktif?"Aktif":"Pasif"},{bilgi:"FirmaStore kullanılabilir puan toplamı",deger:toplam(hesap.saha,"magaza_bakiyesi")},{bilgi:"E-Club talebe ayrılmamış geçerli puan",deger:toplam(hesap.eclub,"kalan_puan")},{bilgi:"Eczanem kullanılabilir puan",deger:toplam(hesap.uye,"kullanilabilir_puan")},{bilgi:"Eczanem indirim karşılığı (TL)",deger:toplam(hesap.uye,"indirim_tl")},{bilgi:"Bekleyen iş sayısı",deger:hesap.bekleyen.length},{bilgi:"Hakların yorumu",deger:"Lig puanı, mağaza puanı, koşullu çek hakkı ve indirim hakkı ayrı değerlerdir. Birbirine eklenmez; toplam puan doğrudan TL borcu değildir."},{bilgi:"Veri kesiti",deger:"Bütün kaynaklar aynı veritabanı kesitinden okunmuştur. Döküm geçmişe dönük bir bakiye tahmini değildir."}];
 // Özetin bölümleri aynı sütunları paylaşır; farklı hak türleri tek tabloya birleştirilmez.
 const ozetWs=XLSX.utils.aoa_to_sheet([]), ozetStilleri=new Map<string,"baslik"|"bolum"|"sutun"|"metin"|"toplam">();
 let ozetSatiri=0;
 const ozetBirlesimleri:XLSX.Range[]=[], ozetYukseklikleri:XLSX.RowInfo[]=[];
 const ozetSatir=(degerler:(string|number|null)[],stil:"baslik"|"bolum"|"sutun"|"metin"|"toplam"="metin",yukseklik=32)=>{
  const row=ozetSatiri++;
  XLSX.utils.sheet_add_aoa(ozetWs,[degerler.map(v=>v??"")],{origin:{r:row,c:0}});
  for(let c=0;c<8;c++) {
   const adres=XLSX.utils.encode_cell({r:row,c});
   if(!ozetWs[adres])ozetWs[adres]={t:"s",v:""};
   if(ozetWs[adres].t==="n")ozetWs[adres].z=Number.isInteger(ozetWs[adres].v)?"#,##0":"#,##0.00";
   ozetStilleri.set(adres,stil);
  }
  ozetYukseklikleri[row]={hpt:yukseklik};return row;
 };
 const birlestir=(r:number,ilk:number,son:number)=>ozetBirlesimleri.push({s:{r,c:ilk},e:{r,c:son}});
 const bolum=(ad:string)=>{ozetSatiri++;const r=ozetSatir([ad],"bolum",27);birlestir(r,0,7);};
 let r=ozetSatir([`${k.veri.firma[0].firma_adi} — Kapanış Özeti`],"baslik",34);birlestir(r,0,7);
 for(const s of ozet.slice(0,8)){r=ozetSatir([String(s.bilgi),null,null,null,s.deger as string|number],"metin",26);birlestir(r,0,3);birlestir(r,4,7);}
 for(const s of ozet.slice(8)){r=ozetSatir([String(s.deger)],"metin",34);birlestir(r,0,7);}
 bolum("UTT ve BM — FirmaStore Hak Edişleri");
 r=ozetSatir(["Ad Soyad",null,"Rol",null,"Kullanılabilir Puan",null,"Hak Durumu"],"sutun");for(const c of [0,2,4,6])birlestir(r,c,c+1);
 for(const s of hesap.saha){const z=zengin(s,new Set());r=ozetSatir([String(z.kullanici_id_ad_soyad??s.kullanici_id),null,String(z.rol),null,sayi(s,"magaza_bakiyesi"),null,String(s.hak_durumu)],"metin",34);for(const c of [0,2,4,6])birlestir(r,c,c+1);}
 r=ozetSatir(["Toplam FirmaStore Puanı",null,null,null,toplam(hesap.saha,"magaza_bakiyesi")],"toplam");birlestir(r,0,3);birlestir(r,4,5);birlestir(r,6,7);
 bolum("E-Club — Eczanelerin Kalan Hakları");
 ozetSatir(["Eczane","Yayın Kodu","Dönem","Kazanılan Puan","Devreden Puan","Talebe Ayrılan Puan","Kalan Puan","Koşullara Bağlı Çek Tutarı (TL)"],"sutun",42);
 for(const s of hesap.eclub){const z=zengin(s,new Set());r=ozetSatir([String(z.eczane_adi),String(z.yayin_kodu),String(s.donem_kodu),sayi(s,"kazanilan"),sayi(s,"devreden"),sayi(s,"talebe_ayrilan"),sayi(s,"kalan_puan"),s.cek_tl as number|null]);if(ozetWs[`H${r+1}`].t==="n")ozetWs[`H${r+1}`].z="#,##0.00";}
 r=ozetSatir(["Toplam E-Club Puanı",null,null,null,null,null,toplam(hesap.eclub,"kalan_puan")],"toplam");birlestir(r,0,5);
 r=ozetSatir(["Çek tutarları yayın koşullarına bağlıdır; kesinleşmiş çek borcu olarak toplanmaz. Yayın koşulları ve hak durumları E-Club Kalan Haklar sayfasındadır."],"metin",34);birlestir(r,0,7);
 bolum("Eczanem — Üyelerin Kalan Hakları");
 ozetSatir(["Üye","Eczane","Ürün","Kullanılabilir Puan","İndirim Tutarı (TL)","En Yakın Son Kullanım Tarihi","En Yakın Son Kullanım Saati","Hak Durumu"],"sutun",42);
 for(const s of hesap.uye){const z=zengin(s,new Set(["ilk_son_kullanim"]));r=ozetSatir([String(z.musteri_id_ad_soyad??s.musteri_id),String(z.eczane_adi),String(z.urun_adi),sayi(s,"kullanilabilir_puan"),sayi(s,"indirim_tl"),z.ilk_son_kullanim_tarih as number|null,z.ilk_son_kullanim_saat as number|null,String(s.hak_durumu)],"metin",42);ozetWs[`E${r+1}`].z="#,##0.00";ozetWs[`F${r+1}`].z='dd"."mm"."yyyy';ozetWs[`G${r+1}`].z="hh:mm:ss";}
 r=ozetSatir(["Toplam Eczanem Hakkı",null,null,toplam(hesap.uye,"kullanilabilir_puan"),toplam(hesap.uye,"indirim_tl")],"toplam");birlestir(r,0,2);ozetWs[`E${r+1}`].z="#,##0.00";
 ozetWs['!cols']=[27,26,24,18,19,20,20,34].map(wch=>({wch}));ozetWs['!rows']=ozetYukseklikleri;ozetWs['!merges']=ozetBirlesimleri;ozetWs['!ref']=`A1:H${ozetSatiri}`;
 XLSX.utils.book_append_sheet(wb,ozetWs,"Kapanış Özeti");envanter.push({sayfa:"Kapanış Özeti",kayit_sayisi:ozet.length+hesap.saha.length+hesap.eclub.length+hesap.uye.length});
 const puanDetay:Satir[]=[];
 for(const [key,kisiKey,netKey,isaret] of [["kazanc","kullanici_id","puan",1],["cc_kazanc","bm_id","puan",1],["eclub_utt","utt_id","puan",1],["ileri","kullanici_id","kaybedilen_puan",-1],["yanlis","kullanici_id","kaybedilen_puan",-1],["oneri_kayip","kullanici_id","kaybedilen_puan",-1],["cc_ileri","bm_id","kaybedilen_puan",-1],["cc_yanlis","bm_id","kaybedilen_puan",-1],["cc_kayip","kullanici_id","kaybedilen_puan",-1]] as const) {
   for(const r of k.veri[key]) puanDetay.push({kullanici_id:r[kisiKey],yayin_id:r.yayin_id,urun_id:r.urun_id??null,kaynak:DISA_AKTAR_KAPSAM.find(p=>p.key===key)?.ad??key,puan_turu:r.puan_turu??key,net_puan:sayi(r,netKey)*isaret,created_at:r.created_at});
 }
 sayfa("Puan Detay",puanDetay);
 sayfa("UTT Dönemlik Lig Puanı",k.veri.lig_utt);
 sayfa("BM Dönemlik Lig Puanı",k.veri.lig_bm);
 sayfa("UTT ve BM Hak Edişleri",hesap.saha,["kullanici_id","magaza_bakiyesi"]);
 sayfa("E-Club Kalan Haklar",hesap.eclub,["eczane_id","yayin_id","kalan_puan","cek_tl"]);
 sayfa("Eczanem Kalan Haklar",hesap.uye,["musteri_id","eczane_id","urun_id","kullanilabilir_puan","indirim_tl"]);
 sayfa("Bekleyen İşler",hesap.bekleyen,["kaynak","kayit_id","durum","sorumlu_id"]);
 const sorumluluklar=k.veri.talepler.filter(t=>t.urun_id&&t.uretici_id).map(t=>({urun_id:t.urun_id,kullanici_id:t.uretici_id,bilgi:"Firma içindeki üretim taleplerinden ilişkilendirilmiştir"}));
 sayfa("Ürün Sorumlulukları",[...new Map(sorumluluklar.map(r=>[[r.urun_id,r.kullanici_id].join(":"),r])).values()]);
 for(const p of DISA_AKTAR_KAPSAM)sayfa(p.ad,k.veri[p.key].map(r=>Object.fromEntries(p.alanlar.map(alan=>[alan,r[alan]??null]))),p.alanlar as unknown as string[]);
 sayfa("Token Bakiye Özeti",k.veri.token_bakiye);
 sayfa("Dosya İçeriği",envanter.slice(),["sayfa","kayit_sayisi"]);
 const zip=await JSZip.loadAsync(XLSX.write(wb,{type:"buffer",bookType:"xlsx"}) as Buffer);
 // SheetJS CE sayısal biçimleri yazar; özetin yazı, zemin ve kaydırma stilleri
 // aynı dosyanın OpenXML stillerine eklenir. Ayrıntı sayfalarının stilleri korunur.
 let stilXml=await zip.file('xl/styles.xml')!.async('string');
 // Özel tarih biçimleri OpenXML'in özel biçim aralığında tutulur.
 const ozelBicimler=[...stilXml.matchAll(/<numFmt\b[^>]*numFmtId="(\d+)"/g)].map(m=>Number(m[1]));
 let sonrakiBicim=Math.max(163,...ozelBicimler)+1;
 const bicimIdleri=new Map(ozelBicimler.filter(id=>id<164).map(id=>[id,sonrakiBicim++]));
 stilXml=stilXml.replace(/numFmtId="(\d+)"/g,(tum,id:string)=>bicimIdleri.has(Number(id))?`numFmtId="${bicimIdleri.get(Number(id))}"`:tum);
 const ekleStilGrubu=(ad:string,ek:string)=>{
  let ilk=0;stilXml=stilXml.replace(new RegExp(`<${ad} count="(\\d+)"[^>]*>([\\s\\S]*?)</${ad}>`),(_,n,govde)=>{ilk=Number(n);const adet=(ek.match(new RegExp(`<${ad==="fonts"?"font":ad==="fills"?"fill":"xf"}(?:\\s|>)`,"g"))??[]).length;return `<${ad} count="${ilk+adet}">${govde}${ek}</${ad}>`;});return ilk;
 };
 const fontIlk=ekleStilGrubu("fonts",'<font><sz val="11"/><color rgb="FF203653"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FF203653"/><name val="Calibri"/></font><font><b/><sz val="14"/><color rgb="FF203653"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>');
 const fillIlk=ekleStilGrubu("fills",'<fill><patternFill patternType="solid"><fgColor rgb="FFEAF3FC"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF247AC5"/><bgColor indexed="64"/></patternFill></fill>');
 const xfs=stilXml.match(/<cellXfs count="\d+"[^>]*>([\s\S]*?)<\/cellXfs>/)![1].match(/<xf\b[^>]*(?:\/>|>[\s\S]*?<\/xf>)/g)!;
 const yeniXfs:string[]=[], stiller=new Map<string,number>();
 let ozetXml=await zip.file('xl/worksheets/sheet1.xml')!.async('string');
 ozetXml=ozetXml.replace(/<c\b([^>]*)>/g,(tum,attrs:string)=>{
  const adres=attrs.match(/\br="([^"]+)"/)?.[1], tur=adres?ozetStilleri.get(adres):undefined;if(!tur)return tum;
  const onceki=Number(attrs.match(/\bs="(\d+)"/)?.[1]??0), numFmt=Number(xfs[onceki].match(/numFmtId="(\d+)"/)?.[1]??0), anahtar=`${tur}:${numFmt}`;
  if(!stiller.has(anahtar)) {
   const font=fontIlk+(tur==="baslik"?2:tur==="bolum"?3:tur==="metin"?0:1), fill=tur==="bolum"?fillIlk+1:tur==="sutun"||tur==="toplam"?fillIlk:0;
   stiller.set(anahtar,xfs.length+yeniXfs.length);yeniXfs.push(`<xf numFmtId="${numFmt}" fontId="${font}" fillId="${fill}" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1" applyNumberFormat="1"><alignment vertical="center" wrapText="1"/></xf>`);
  }
  return `<c${attrs.replace(/\s+s="\d+"/,"")} s="${stiller.get(anahtar)}">`;
 });
 ekleStilGrubu("cellXfs",yeniXfs.join(""));zip.file('xl/styles.xml',stilXml);zip.file('xl/worksheets/sheet1.xml',ozetXml);
 for(const name of Object.keys(zip.files).filter(n=>/^xl\/worksheets\/sheet\d+\.xml$/.test(n))) {
   let xml=await zip.file(name)!.async("string");
   const views='<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>';
   xml=/<sheetViews[\s>]/.test(xml)?xml.replace(/<sheetViews[\s\S]*?<\/sheetViews>/,views):(/<dimension[^>]*\/>/.test(xml)?xml.replace(/<dimension[^>]*\/>/,'$&'+views):xml.replace(/(<worksheet[^>]*>)/,'$1'+views));
   zip.file(name,xml);
 }
 return {buffer:await zip.generateAsync({type:"nodebuffer",compression:"DEFLATE"}),sayfaSayisi:wb.SheetNames.length};
}
