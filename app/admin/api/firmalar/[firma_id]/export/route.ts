import { firmaYonetimIslemKontrol } from "@/lib/admin/firmaYonetimIslem";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { hataYaniti, sunucuHatasi, validasyonHatasi } from "@/lib/utils/hataIsle";
import { firmaExceliOlustur, type ExportKesiti } from "@/lib/firma/disaAktar";
import { trGunu } from "@/lib/zaman/kontrol";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ firma_id: string }> }) {
  try {
    const {firma_id}=await params;
    const auth=await firmaYonetimIslemKontrol(firma_id);if(!auth.gecerli)return auth.yanit;

    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(firma_id))return validasyonHatasi("Geçersiz firma.",["firma_id"]);
    const db=createAdminClient();
    const sonuc=await db.rpc("admin_firma_export_snapshot",{p_firma:firma_id});
    if(sonuc.error) {
      if(["PGRST202","42883"].includes(sonuc.error.code))return NextResponse.json({hata:"Kapsamlı dışa aktarma SQL kurulumu bekleniyor."},{status:503});
      return hataYaniti("Firma verileri alınamadı; eksik dosya üretilmedi.","firma export kesiti",sonuc.error);
    }
    const kesit=sonuc.data as ExportKesiti;
    if(kesit?.firma_id!==firma_id)throw new Error("Dışa aktarma firma kapsamı tutarsız.");
    const dosya=await firmaExceliOlustur(kesit);
    // Yeni bir kesit daha önce tamamlanmışsa eski istek dışa aktarma damgasını geriye almaz.
    const damga=await db.from("firmalar").update({son_export_at:kesit.an}).eq("firma_id",firma_id).or(`son_export_at.is.null,son_export_at.lt.${kesit.an}`);
    if(damga.error)return hataYaniti("Dosya hazırlandı ancak dışa aktarma kaydı tamamlanamadı. Tekrar deneyin.","firma export damgası",damga.error);
    const ad=String(kesit.veri.firma[0].firma_adi??"firma").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9_-]/g,"_");
    return new NextResponse(new Uint8Array(dosya.buffer),{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","Content-Disposition":`attachment; filename="${ad}_export_${trGunu()}.xlsx"`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
  } catch(error) {return sunucuHatasi(error,"Firma kapsamlı dışa aktarma");}
}
