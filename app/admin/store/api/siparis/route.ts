import { NextRequest,NextResponse } from "next/server";
import {createAdminClient} from "@/lib/supabase/server";
import {adminGirisKontrol} from "@/lib/utils/adminGirisKontrol";
import {uuidGecerliMi} from "@/lib/uretim/rpcTemel";
import {talepFiltreleriniOku,httpsBaglantiGecerli,type FirmaTalepKesiti} from "@/lib/tclub/store/adminTalepler";
import {firmaStoreEpostalariniIsle,firmaStoreGonderici} from "@/lib/tclub/store/cekEposta";
import * as XLSX from "xlsx";

export const maxDuration=60;
function dbHatasi(error:{code?:string}) {
 const status=["PGRST202","42883","42703","42P01"].includes(error.code||"")?503:error.code==="P0002"?404:error.code==="42501"?403:["22023","23514","23505"].includes(error.code||"")?422:500;
 return NextResponse.json({hata:status===503?"Firma bazlı çek yönetimi SQL kurulumu bekleniyor.":error.code==="23505"?"Bu çek kodu daha önce kullanılmış.":status===404?"Talep seçili firmada bulunamadı.":"İşlem tamamlanamadı. Talebin durumunu ve girdiğiniz bilgileri kontrol edin."},{status});
}
const tarih=(s:string)=>new Date(s).toLocaleString("tr-TR",{timeZone:"Europe/Istanbul"});
export async function GET(request:NextRequest) {
 const auth=await adminGirisKontrol();if(!auth.gecerli)return auth.yanit;
 try {
  const db=createAdminClient(),q=request.nextUrl.searchParams;
  if(!q.has("firma")) {
   const r=await db.rpc("store_admin_firma_ozetleri");if(r.error)return dbHatasi(r.error);
   return NextResponse.json({...r.data,eposta_ayar_hazir:!!process.env.RESEND_API_KEY&&!!firmaStoreGonderici()},{headers:{"Cache-Control":"no-store"}});
  }
  const filtre=talepFiltreleriniOku(q);if(!filtre)return NextResponse.json({hata:"Firma, tarih, durum veya sayfa bilgisi geçersiz."},{status:422});
  const r=await db.rpc("store_admin_firma_talepleri",filtre);if(r.error)return dbHatasi(r.error);
  const data=r.data as FirmaTalepKesiti;
  if(data?.firma?.firma_id!==filtre.p_firma)throw new Error("KAPSAM");
  if(filtre.p_export) {
   const rows=data.talepler.map(t=>({Firma:data.firma.firma_adi,"Talep No":t.siparis_id,Grup:t.toplu_talep_anahtari||"",Kişi:`${t.kullanicilar?.ad||""} ${t.kullanicilar?.soyad||""}`,Rol:t.kullanicilar?.rol||"",Çek:t.store_urunler?.ad||"",Adet:t.adet,Puan:t.toplam_puan,"Çek Tutarı (TL)":t.toplam_tl??"",Durum:t.durum,"Talep Tarihi":tarih(t.created_at),"Teslim Tarihi":t.teslim_alma_at?tarih(t.teslim_alma_at):"","E-posta":t.eposta?.durum||""}));
   const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),"Talepler");XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(data.cek_ozeti),"Çek Özeti");
   const bytes=XLSX.write(wb,{type:"buffer",bookType:"xlsx"});
   return new NextResponse(new Uint8Array(bytes),{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","Content-Disposition":`attachment; filename="firmastore_${filtre.p_firma}.xlsx"`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
  }
  return NextResponse.json(data,{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({hata:"Firma talepleri alınamadı."},{status:500});}
}
export async function PATCH(request:NextRequest) {
 const auth=await adminGirisKontrol();if(!auth.gecerli)return auth.yanit;
 try {
  const b=await request.json();
  if(!b||!uuidGecerliMi(b.firma_id)||!uuidGecerliMi(b.siparis_id)||!["hazirla","iptal","teslim","eposta_yeniden"].includes(b.action)||typeof(b.not??"")!=="string"||(b.not?.length??0)>2000)return NextResponse.json({hata:"Firma, talep veya işlem bilgisi geçersiz."},{status:422});
  if(b.action==="iptal"&&!b.not?.trim())return NextResponse.json({hata:"İptal nedeni girin."},{status:422});
  if(b.action==="teslim"&&(!Array.isArray(b.kodlar)||!b.kodlar.length||b.kodlar.some((c:Record<string,unknown>)=>!c||typeof c.cek_kodu!=="string"||!/^[A-Za-z0-9][A-Za-z0-9 _./-]{0,511}$/.test(c.cek_kodu)||typeof(c.kullanim_linki??"")!=="string"||!httpsBaglantiGecerli(String(c.kullanim_linki??"")))))return NextResponse.json({hata:"Geçerli çek kodları ve varsa HTTPS bağlantısı girin."},{status:422});
  const db=createAdminClient();
  const r=await db.rpc("store_admin_firma_talep_islem",{p_firma:b.firma_id,p_siparis:b.siparis_id,p_admin:auth.kullaniciId,p_islem:b.action,p_not:b.not||null,p_kodlar:b.kodlar||null,p_from:firmaStoreGonderici()});
  if(r.error)return dbHatasi(r.error);
  // Teslim kaydı e-posta hatasından bağımsızdır. Kuyruk sonraki cron'da tekrar alınır.
  if(["teslim","eposta_yeniden"].includes(b.action))try{await firmaStoreEpostalariniIsle(db,b.siparis_id,1);}catch{ /* İş lease süresi dolunca yeniden alınabilir; kodlar loglanmaz. */ }
  return NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({hata:"Talep işlemi tamamlanamadı."},{status:500});}
}
