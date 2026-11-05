import { createHash } from "node:crypto";
import { onayliPartnerBaglami } from "@/lib/agora/partnerProfilSunucu";
import { partnerYanit } from "@/lib/agora/partnerHttp";
import { bunnyStorageNesneYukle, yuklemeYetkisiDogrula, yuklemeMakbuzuOlustur } from "@/lib/ogrenmeAraci/bunnyStorage";
export { podcastBaslat as POST, podcastOku as GET, podcastTamamla as PATCH } from "@/lib/agora/partnerMedyaSunucu";

/** Mevcut yerel Bunny Storage aktarımının ayrı partner oturumuna uyarlanması. */
export async function PUT(request:Request) {
  if(process.env.NODE_ENV!=="development")return partnerYanit({hata:"Bulunamadı."},404);
  if(request.headers.get("origin")!==new URL(request.url).origin)return partnerYanit({hata:"İstek doğrulanamadı."},403);
  try{
    const b=await onayliPartnerBaglami();if(!b)return partnerYanit({hata:"Partner oturumu doğrulanamadı."},401);
    const g={aracId:request.headers.get("x-arac-id")??"",kullaniciId:request.headers.get("x-kullanici-id")??"",dosyaYolu:request.headers.get("x-dosya-yolu")??"",dosyaBoyutu:Number(request.headers.get("x-dosya-boyutu")),mimeType:request.headers.get("content-type")??"",checksumSha256:request.headers.get("x-checksum-sha256")??""};
    const token=request.headers.get("x-yukleme-token")??"";
    if(g.kullaniciId!==b.partnerId||!g.dosyaYolu.startsWith(`agora/${b.partnerId}/`)||!Number.isSafeInteger(g.dosyaBoyutu)||g.dosyaBoyutu<=0||g.dosyaBoyutu>250*1024**2||!yuklemeYetkisiDogrula({...g,token}))return partnerYanit({hata:"Podcast yükleme izni geçersiz."},403);
    const reader=request.body?.getReader();if(!reader)return partnerYanit({hata:"Dosya okunamadı."},400);
    const chunks:Uint8Array[]=[];let boyut=0;
    try{while(true){const c=await reader.read();if(c.done)break;boyut+=c.value.byteLength;if(boyut>g.dosyaBoyutu){await reader.cancel();return partnerYanit({hata:"Dosya çok büyük."},413);}chunks.push(c.value);}}finally{reader.releaseLock();}
    const bytes=Buffer.concat(chunks);
    if(bytes.length!==g.dosyaBoyutu||createHash("sha256").update(bytes).digest("hex")!==g.checksumSha256)return partnerYanit({hata:"Dosya özeti eşleşmiyor."},400);
    if(!await bunnyStorageNesneYukle({...g,govde:bytes}))return partnerYanit({hata:"Podcast aktarılamadı."},502);
    const makbuz=yuklemeMakbuzuOlustur({...g,yuklemeToken:token});
    return partnerYanit({tamamlandi:true,yukleme_makbuzu:makbuz},201);
  }catch{return partnerYanit({hata:"Podcast aktarılamadı."},503);}
}
