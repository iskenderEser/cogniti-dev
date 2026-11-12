import { firmaYonetimOkumaKontrol } from '@/lib/admin/firmaYonetimOkuma';
import { createAdminClient } from '@/lib/supabase/server';
import { partnerYanit } from '@/lib/agora/partnerHttp';
import { uuidGecerliMi } from '@/lib/uretim/rpcTemel';
import { vivaAlimDonemiGecerli,vivaAlimTutari,vivaAlimToplamlari,type VivaAlimListesi,type VivaAlimSatiri } from '@/lib/satinAlma/vivaAlimlari';
type Kayit={etkinlik_id:string;sahip_id:string;firma_id:string;donem:string;toplam_saniye:number;katilim_sayisi:number|null;usd_dakika:number;kur:number;katsayi:number;etkinlik:{baslik:string;baslangic:string;firma_id:string}|null};
export async function GET(request:Request,{params}:{params:Promise<{firma_id:string}>}) {
 try {
 const {firma_id}=await params;if(!uuidGecerliMi(firma_id))return partnerYanit({hata:'Geçersiz firma.'},400);
 const auth=await firmaYonetimOkumaKontrol(firma_id);if(!auth.gecerli)return auth.yanit;
 const q=new URL(request.url).searchParams,arama=q.get('q')?.trim()??'';
 if(arama.length>80||arama.includes('\0')||q.getAll('q').length>1)return partnerYanit({hata:'Geçersiz arama.'},400);
 const db=createAdminClient(AbortSignal.timeout(15000)),kayitlar:Kayit[]=[];
 // PostgREST satır sınırı, aylık belgenin devamını sessizce kesmesin.
 for(let offset=0;;offset+=500){
 const {data,error}=await db.from('cogniti_viva_tuketim_isleri')
 .select('etkinlik_id,sahip_id,firma_id,donem,toplam_saniye,katilim_sayisi,usd_dakika,kur,katsayi,etkinlik:viva_etkinlikler!inner(baslik,baslangic,firma_id)')
 .eq('firma_id',firma_id).eq('etkinlik.firma_id',firma_id).eq('durum','tamam').gt('toplam_saniye',0)
 .order('etkinlik_id').range(offset,offset+499);
 if(error||!Array.isArray(data))throw Error('Viva kullanımları alınamadı.');
 kayitlar.push(...data as unknown as Kayit[]);if(data.length<500)break;
 }
 const sahipler=[...new Set(kayitlar.map(k=>k.sahip_id))],adlar=new Map<string,string>();
 for(let i=0;i<sahipler.length;i+=100){
 const {data,error}=await db.from('kullanicilar').select('kullanici_id,ad,soyad').eq('firma_id',firma_id).in('kullanici_id',sahipler.slice(i,i+100));
 if(error||!Array.isArray(data))throw Error('Viva düzenleyen bilgileri alınamadı.');
 for(const k of data)adlar.set(k.kullanici_id,[k.ad,k.soyad].filter(Boolean).join(' '));
 }
 const gruplar=new Map<string,VivaAlimSatiri[]>();
 const aranan=arama.toLocaleLowerCase('tr-TR');
 for(const k of kayitlar){
 const donem=typeof k.donem==='string'?k.donem.slice(0,7):'';
 if(k.firma_id!==firma_id||!vivaAlimDonemiGecerli(donem)||k.donem!==`${donem}-01`||!k.etkinlik||k.etkinlik.firma_id!==firma_id
 ||!Number.isFinite(k.toplam_saniye)||k.toplam_saniye<=0)throw Error('Viva kaydı doğrulanamadı.');
 const duzenleyen=adlar.get(k.sahip_id)||'—';
 if(aranan&&!`${k.etkinlik.baslik} ${duzenleyen}`.toLocaleLowerCase('tr-TR').includes(aranan))continue;
 const satir:VivaAlimSatiri={etkinlik_id:k.etkinlik_id,yayin_tarihi:k.etkinlik.baslangic,yayin_adi:k.etkinlik.baslik,
 duzenleyen,katilimci_sayisi:k.katilim_sayisi??0,kisi_dakika:k.toplam_saniye/60,
 ...vivaAlimTutari(k.toplam_saniye,k.usd_dakika,k.kur,k.katsayi)};
 const grup=gruplar.get(donem)??[];grup.push(satir);gruplar.set(donem,grup);
 }
 const belgeler:VivaAlimListesi[]=[...gruplar].sort(([a],[b])=>b.localeCompare(a)).map(([donem,satirlar])=>({
 firma_id,donem,satirlar:satirlar.sort((a,b)=>a.yayin_tarihi.localeCompare(b.yayin_tarihi)||a.etkinlik_id.localeCompare(b.etkinlik_id)),...vivaAlimToplamlari(satirlar)}));
 return partnerYanit({firma_id,arama,belgeler});
 }catch{return partnerYanit({hata:'Viva satın alımları okunamadı. Yeniden deneyin.'},503);}
}
