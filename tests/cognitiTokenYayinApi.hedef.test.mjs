import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const compile=p=>ts.transpileModule(readFileSync(new URL(p,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const helper={};vm.runInNewContext(compile('../lib/token/yayinHatasi.ts'),{exports:helper});
const postCode=compile('../app/(panel)/yayin-yonetimi/api/yayinlar/route.ts');
const putCode=compile('../app/(panel)/yayin-yonetimi/api/yayinlar/[yayin_id]/route.ts');
function setup({insertError=null,rpcError=null,notificationError=false,put=false}={}){
  const writes=[],notifications=[],tours=[],rpcCalls=[];
  const db={from(table){let inserted;
    const q={select(){return q;},eq(){return q;},single(){return q;},maybeSingle(){return q;},
      insert(data){inserted=data;writes.push({table,data});return q;},
      then(resolve,reject){let value;
        const fixtures={soru_seti_durumu:{soru_seti_durum_id:'ssd',soru_seti_id:'ss',durum:'onaylandi'},
          soru_setleri:{soru_seti_id:'ss',arac_durum_id:'ad',sorular:[{}]},talepler:{taslak_mi:false},
          ogrenme_araci_puanlari:{arac_puani:5},soru_seti_puanlari:[{soru_index:0,soru_puani:5}],
          ogrenme_araci_durumu:{arac_id:'arac',durum:'onaylandi',ogrenme_araclari:{arac_turu:'video'}},v_yayin_detay:{urun_adi:'İçerik'}};
        if(table==='yayin_yonetimi')value=inserted?{data:insertError?null:{yayin_id:'pub',durum:inserted.durum},error:insertError}:
          put?{data:{yayin_id:'pub',uretici_id:'producer',durum:'planlandi'},error:null}:{data:null,error:{code:'PGRST116'}};
        else if(table in fixtures)value={data:fixtures[table],error:null};
        else throw new Error('Beklenmeyen tablo '+table);
        return Promise.resolve(value).then(resolve,reject);
      }};return q;},
    async rpc(name,params){rpcCalls.push({name,params});return {data:put?1:[{kullanici_id:'utt1'},{kullanici_id:'kd1'}],error:rpcError};}};
  const modules={
    'next/server':{NextResponse:{json:Response.json.bind(Response)}},
    '@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'producer'}},error:null})}}),createAdminClient:()=>db},
    '@/lib/utils/rolCozucu':{rolCozucu:async()=>'pm'},
    '@/lib/utils/roller':{URETICI_ROLLER:['pm'],yalnizEclubHedefliMi:()=>false},
    '@/lib/utils/talepZinciri':{talepBilgisiSoruSeti:async()=>({uretici_id:'producer',talep_id:'talep',hedef_roller:['utt']})},
    '@/lib/tclub/tur/kayit':{turKaydiAc:async(_db,p)=>{tours.push(p);return {ok:true};}},
    '@/lib/token/yayinHatasi':helper,
    '@/lib/utils/bildirimOlustur':{cokluBildirimOlustur:async p=>{if(notificationError)throw new Error('push unavailable');notifications.push(p);}},
    '@/lib/utils/hataIsle':{
      veriKontrol:data=>data?{gecerli:true}:{gecerli:false,yanit:Response.json({hata:'Bulunamadı'},{status:404})},
      isKuraluHatasi:msg=>Response.json({hata:msg},{status:422}),validasyonHatasi:msg=>Response.json({hata:msg},{status:422}),
      hataYaniti:msg=>Response.json({hata:msg},{status:500}),sunucuHatasi:err=>{throw err;},
      yetkiHatasi:()=>Response.json({hata:'Yetkisiz'},{status:401}),rolHatasi:()=>Response.json({hata:'Yetkisiz'},{status:403})
    }
  };
  const exports={};vm.runInNewContext(put?putCode:postCode,{exports,Response,console:{error(){}},require:name=>{
    if(name in modules)return modules[name];if(name.startsWith('@/lib/'))return {};throw new Error(name);
  }});
  return {writes,notifications,tours,rpcCalls,post:body=>exports.POST({json:async()=>({soru_seti_durum_id:'ssd',extra_puan:5,...body})}),
    put:()=>exports.PUT({json:async()=>({islem:'hemen_yayinla'})},{params:Promise.resolve({yayin_id:'pub'})})};
}
test('Anlık yayının bildirimi başarılı açılıştan sonra kayıtlı gönderim alıcılarına gider',async()=>{
 const s=setup();const response=await s.post();assert.equal(response.status,201);assert.equal(s.writes.length,1);
 assert.equal(s.tours.length,1);assert.equal(s.rpcCalls[0].name,'cogniti_token_yayin_gonderim_alicilari');
 assert.deepEqual(Array.from(s.notifications[0].alici_idler),['utt1','kd1']);assert.equal(s.writes[0].data.uretici_id,'producer');
});
for(const reason of ['bakiye_yetersiz','hesap_yok'])test(`Anlık açılış ${reason}: tur veya bildirim oluşturulmaz`,async()=>{
 const s=setup({insertError:{code:'P0001',message:`COGNITI_TOKEN:${reason}`}});const response=await s.post();
 assert.equal(response.status,422);assert.match((await response.json()).hata,/Yayın açılmadı/);
 assert.equal(s.tours.length,0);assert.equal(s.notifications.length,0);assert.equal(s.rpcCalls.length,0);
});
test('Plan kaydı aktivasyon veya tüketim alıcı okuması başlatmaz',async()=>{
 const date=new Date();date.setUTCDate(date.getUTCDate()+3);const s=setup();
 const response=await s.post({yayin_gunu:date.toISOString().slice(0,10)});
 assert.equal(response.status,201);assert.equal(s.writes[0].data.durum,'planlandi');
 assert.equal(s.tours.length,0);assert.equal(s.notifications.length,0);assert.equal(s.rpcCalls.length,0);
});
test('Bildirim hatası başarılı yayını başarısız göstermeyip iade işlemi başlatmaz',async()=>{
 const s=setup({notificationError:true});assert.equal((await s.post()).status,201);
 assert.equal(s.writes.length,1);assert.equal(s.rpcCalls.length,1);assert.equal(s.tours.length,1);
});
test('Hemen yayınla token hatasını 422 ve anlaşılır mesajla döndürür',async()=>{
 const s=setup({put:true,rpcError:{code:'P0001',message:'COGNITI_TOKEN:bakiye_yetersiz'}});
 const response=await s.put();assert.equal(response.status,422);assert.match((await response.json()).hata,/token bakiyesi/);
 assert.equal(s.writes.length,0);assert.equal(s.rpcCalls[0].name,'yayin_planlananlari_aktive');
});
test('Bilinmeyen veritabanı hatası token hatası diye gizlenmez',async()=>{
 assert.equal(helper.yayinTokenHatasi({code:'23514',message:'internal detail'}),null);
 const s=setup({insertError:{code:'23514',message:'internal detail'}});const response=await s.post();
 assert.equal(response.status,500);assert.doesNotMatch((await response.json()).hata,/internal detail/);
});
