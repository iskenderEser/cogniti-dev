import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import * as girdi from '@/lib/eclub/gonderimApi';
import { eclubYayinKapsamindaMi } from '@/lib/eclub/oneriKapsam';
import { eclubPlanIsleriniTuket } from '@/lib/eclub/gonderimPlanIsleyici';

// Yalnız enjekte edilmiş modüller kullanılabilir: ağ/DB istemcisi yüklenmez.
function yukle(path: string, modules: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  const exports: Record<string, (...args: never[]) => unknown> = {};
  const source = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(source, { exports, require: (id: string) => {
    if (!(id in modules)) throw new Error(`Testte izin verilmeyen bağımlılık: ${id}`);
    return modules[id];
  }, console: {error:()=>{},warn:()=>{},log:()=>{}}, ...extra });
  return exports;
}
const yayin = '11111111-1111-4111-8111-111111111111';
const uye = '22222222-2222-4222-8222-222222222222';
const anahtar = '33333333-3333-4333-8333-333333333333';
function route(islem: 'gonder'|'planla'|'kontrol', sonuc: unknown[], rpcHata = false) {
  const olaylar: string[] = []; const bildirimler: Record<string, unknown>[] = []; let rpcAdet = 0;
  const db = {
    from: (tablo: string) => {
      assert.ok(['kullanicilar', 'v_yayin_detay'].includes(tablo));
      const query = { select:()=>query, eq:()=>query,
        maybeSingle:async()=>({data:{firma_id:'firma',takim_id:null},error:null}),
        in:async()=>({data:[{yayin_id:yayin,firma_id:'firma',takim_id:null,arac_turu:'video',urun_adi:'Ürün'}],error:null}) };
      return query;
    },
    rpc:async(ad: string, p: Record<string, unknown>)=>{
      assert.equal(ad,'eclub_yayin_toplu_islem');rpcAdet++;olaylar.push('sql-sonucu');
      assert.equal(p.p_onizleme,islem==='kontrol');
      return {data:rpcHata ? null : {sonuclar:sonuc},error:rpcHata ? {code:'TEST'} : null};
    },
  };
  const api=yukle('app/(panel)/eclub/oneriler/api/route.ts',{
    'next/server':{NextResponse:Response},
    '@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'utt'}},error:null})}}),createAdminClient:()=>db},
    '@/lib/utils/rolCozucu':{rolCozucu:async()=> 'utt'},
    '@/lib/utils/roller':{TUKETICI_ROLLER:['utt']},
    '@/lib/eclub/gonderimApi':girdi,
    '@/lib/eclub/oneriKapsam':{eclubYayinKapsamindaMi},
    '@/lib/ogrenmeAraci/bayraklar':{yayinAraciKullanimaAcikMi:()=>true},
    '@/lib/utils/eclubBildirim':{eclubBildirimOlustur:async(p:Record<string,unknown>)=>{olaylar.push('bildirim');bildirimler.push(p);}},
    '@/lib/utils/hataIsle':{hataYaniti:()=>Response.json({hata:'hata'},{status:500}),sunucuHatasi:()=>Response.json({hata:'hata'},{status:500})},
  });
  return {bildirimler,olaylar,rpcAdet:()=>rpcAdet,calistir:()=>api.POST({json:async()=>({islem,yayin_idler:[yayin],kisi_idler:[uye],tarihleri_hesapla:false,
    ...(islem==='planla'?{hedef_gonderim_tarihi:'2026-10-20',islem_anahtari:anahtar}:{})})})};
}
const kayit={yayin_id:yayin,kisi_id:uye,kaydedildi:true,oneri_id:'oneri-1',uygun:true,sebep:null};
test('anlık gönderimde yalnız kaydedilen önerinin kimliğiyle SQL sonucundan sonra bildirilir',async()=>{
 const api=route('gonder',[kayit,{...kayit,kisi_id:'diger',kaydedildi:false,oneri_id:null,sebep:'on_bes_gun_araligi'}]);
 assert.equal((await api.calistir()).status,201);
 assert.equal(api.bildirimler.length,1);assert.equal(api.bildirimler[0].kayit_id,'oneri-1');
 assert.equal(api.bildirimler[0].alici_kisi_id,uye);assert.equal(api.bildirimler[0].kayit_turu,'oneri');
 assert.deepEqual(api.olaylar,['sql-sonucu','bildirim']);assert.equal(api.rpcAdet(),1);
});
test('plan kaydında ve uygunluk önizlemesinde bildirim çağrılmaz',async()=>{
 for(const islem of ['planla','kontrol'] as const){const api=route(islem,[{...kayit,oneri_id:null,plan_id:'plan-1'}]);
  assert.equal((await api.calistir()).status,islem==='kontrol'?200:201);assert.equal(api.bildirimler.length,0);assert.equal(api.rpcAdet(),1);}
});
test('SQL hatası veya hiç kaydedilmeyen seçim bildirim oluşturmaz',async()=>{
 const hatali=route('gonder',[],true);assert.equal((await hatali.calistir()).status,500);assert.equal(hatali.bildirimler.length,0);
 const bos=route('gonder',[{...kayit,kaydedildi:false,oneri_id:null,sebep:'haftalik_urun_kotasi'}]);assert.equal((await bos.calistir()).status,201);assert.equal(bos.bildirimler.length,0);
});
function bildirimYardimcisi(hata: boolean){
 const yazilan:Record<string,unknown>[]=[];const push:unknown[][]=[];
 const db={from:(ad:string)=>{assert.equal(ad,'eclub_bildirimler');return {insert:async(p:Record<string,unknown>)=>{yazilan.push(p);return {error:hata?{message:'TEST'}:null};}};}};
 const modul=yukle('lib/utils/eclubBildirim.ts',{'@/lib/push/orkestrasyon':{pushYayinlaEclubKisilereArkada:(...args:unknown[])=>push.push(args)}});
 return {db,push,yazilan,bildir:()=>modul.eclubBildirimOlustur({adminSupabase:db,alici_kisi_id:uye,gonderen_id:'utt',firma_id:'firma',kayit_turu:'oneri',kayit_id:'oneri-1',mesaj:'Yeni yayın'})};
}
test('uygulama içi bildirim kaydedilince push aynı öneri kimliğini kullanır',async()=>{
 const h=bildirimYardimcisi(false);await h.bildir();assert.equal(h.yazilan.length,1);assert.equal(h.push.length,1);
 assert.equal(h.yazilan[0].kayit_id,'oneri-1');assert.equal(h.push[0][1],'eclub_oneri');assert.equal((h.push[0][3] as {bagId:string}).bagId,'oneri-1');
});
test('bildirim insert hatasında otomatik yeniden deneme ve push yoktur; gönderim çağrılmaz',async()=>{
 const h=bildirimYardimcisi(true);await h.bildir();assert.equal(h.yazilan.length,1);assert.equal(h.push.length,0);
});
test('gerçek plan sarmalayıcısı başarılı öneriyi bildirir, gerçekleşmeyeni bildirmez',async()=>{
 const isler=[{plan_id:'p1',kisi_id:uye,utt_id:'utt',yayin_id:yayin,durum:'gerceklesti',oneri_id:'oneri-1',sebep:null},
 {plan_id:'p2',kisi_id:uye,utt_id:'utt',yayin_id:yayin,durum:'gerceklesmedi',oneri_id:null,sebep:'yayin_aktif_degil'},null];
 const bildirimler:Record<string,unknown>[]=[];let rpcAdet=0;
 const db={rpc:async(ad:string)=>{assert.equal(ad,'eclub_planlanan_gonderimi_isle');rpcAdet++;return {data:isler.shift(),error:null};},
 from:(ad:string)=>{assert.equal(ad,'v_yayin_detay');const q={select:()=>q,eq:()=>q,single:async()=>({data:{firma_id:'firma',urun_adi:'Ürün'},error:null})};return q;}};
 const modul=yukle('lib/eclub/gonderimPlanKuyrugu.ts',{'server-only':{},'@/lib/supabase/server':{createAdminClient:()=>db},
 '@/lib/ogrenmeAraci/bayraklar':{ogrenmeAraciBayraklari:()=>({video:true})},'@/lib/eclub/gonderimPlanIsleyici':{eclubPlanIsleriniTuket},
 '@/lib/utils/eclubBildirim':{eclubBildirimOlustur:async(p:Record<string,unknown>)=>{bildirimler.push(p);}}});
 const sonuc=await modul.eclubPlanlananGonderimleriTuket();assert.equal(sonuc.gerceklesen_adet,1);assert.equal(sonuc.gerceklesmeyen_adet,1);
 assert.equal(rpcAdet,3);assert.equal(bildirimler.length,1);assert.equal(bildirimler[0].kayit_id,'oneri-1');assert.equal(bildirimler[0].alici_kisi_id,uye);
});
function pushGonderici(kodlar:number[]){
 const giden:string[]=[];const beklemeler:number[]=[];let pasif=0;
 const transport={setVapidDetails:()=>{},sendNotification:async(_:unknown,govde:string)=>{giden.push(govde);const kod=kodlar.shift();if(kod)throw {statusCode:kod};}};
 const modul=yukle('lib/push/gonderici.ts',{'web-push':{default:transport},'@/lib/utils/ortam':{canliOrtamMi:()=>true},'./abonelik':{abonelikPasifle:async()=>{pasif++;}}},
 {process:{env:{NEXT_PUBLIC_VAPID_PUBLIC_KEY:'SAHTE',VAPID_PRIVATE_KEY:'SAHTE',VAPID_SUBJECT:'SAHTE'}},setTimeout:(fn:()=>void,ms:number)=>{beklemeler.push(ms);fn();}});
 const db={from:()=>{throw new Error('Push testinde DB yazımı yasak');},rpc:()=>{throw new Error('Push testinde gönderim RPC çağrısı yasak');}};
 return {giden,beklemeler,pasif:()=>pasif,gonder:()=>modul.pushGonder(db,{endpoint:'https://test.invalid/push',p256dh:'test',auth:'test'},{baslik:'Yayın',mesaj:'Yeni yayın',url:'/eclub/panel',tag:'oneri-1'},3600)};
}
test('push 503 sonrası aynı bildirim gövdesini tekrar dener; DB/gönderim RPC çağrısı yapmaz',async()=>{
 const p=pushGonderici([503,0]);assert.equal(await p.gonder(),'gonderildi');assert.equal(p.giden.length,2);
 assert.equal(p.giden[0],p.giden[1]);assert.deepEqual(p.beklemeler,[500]);assert.equal(p.pasif(),0);
});
test('push geçici hata üç denemeyle sınırlıdır; yeniden yayın gönderilmez',async()=>{
 const p=pushGonderici([503,503,503]);assert.equal(await p.gonder(),'basarisiz');assert.equal(p.giden.length,3);
 assert.deepEqual(p.beklemeler,[500,1000]);assert.equal(new Set(p.giden).size,1);
});
test('push kalıcı abonelik hatasını yeniden denemez',async()=>{
 const p=pushGonderici([410]);assert.equal(await p.gonder(),'abonelik_olu');assert.equal(p.giden.length,1);assert.equal(p.pasif(),1);assert.deepEqual(p.beklemeler,[]);
});
test('gerçek bildirim yardımcısının insert hatası tamamlanmış planı tekrar işletmez',async()=>{
 const h=bildirimYardimcisi(true);let alinan=0;
 const sonuc=await eclubPlanIsleriniTuket({isAl:async()=>++alinan===1?{plan_id:'p1',kisi_id:uye,utt_id:'utt',yayin_id:yayin,durum:'gerceklesti',oneri_id:'oneri-1',sebep:null}:null,bildir:h.bildir});
 assert.equal(sonuc.gerceklesen_adet,1);assert.equal(alinan,2);assert.equal(h.yazilan.length,1);assert.equal(h.push.length,0);
 // Yardımcı hatayı loglayıp yuttuğu için işleyicinin hata sayacı bu insert hatasını görmez.
 assert.equal(sonuc.bildirim_hatasi,0);
});
