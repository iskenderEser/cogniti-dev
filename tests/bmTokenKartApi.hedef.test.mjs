import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const company=id(100),pub=id(300),a=id(4),b=id(5);
function setup({auth=true,rol='bm',ledger=true,many=false,fail=false}={}){
 const calls=[],scoped=[a,b].map((utt_id,i)=>({utt_id,utt_adi:`UTT ${i}`,rol:'utt'}));
 const oneri=(utt,n)=>({oneri_id:id(1000+n),oneren_id:utt,yayin_id:pub,arac_id:id(400),arac_turu:'video',kisi_id:id(2000+n),oneri_baslangic:'2026-10-27',oneri_bitis:'2099-01-01',created_at:'2026-10-27',izlendi_mi:false,eclub_kisiler:{ad:'Deneme',soyad:`Üye ${n}`,rol:'eczaci'}});
 const history=[oneri(a,0),oneri(b,1),oneri(id(9),2)];
 const tokens=ledger?[a,b,id(9)].map((sender,n)=>({tuketim_id:id(3000+n),firma_id:company,gonderen_turu:'firma_kullanicisi',gonderen_id:sender,islem_turu:'eclub_oneri',kaynak_id:pub,miktar:1})):[];
 if(many)for(let n=3;n<1005;n++){tokens.push({...tokens[0],tuketim_id:id(3000+n)});history.push(oneri(a,n));}
 const rows={kullanicilar:[{kullanici_id:id(3),rol,firma_id:company,takim_id:id(10),bolge_id:id(20),aktif_mi:true}],cogniti_token_tuketimleri:tokens,eclub_oneri_kayitlari:history,
  v_yayin_detay:[{yayin_id:pub,urun_adi:'Normavas',talep_no:30037,firma_adi:'Hepifarma',hedef_roller:['eczaci'],video_basi_soru_sayisi:1}],
  yayin_yonetimi:[],eclub_utt_yayin_incelemeleri:[],eclub_eczaneler:[],eclub_kisi_eczane:history.map(x=>({kisi_id:x.kisi_id,eczane_id:id(x.oneren_id===a?600:x.oneren_id===b?601:609),aktif_mi:true,bitis_tarihi:null,created_at:'2026-01-01',eclub_kisiler:{kisi_id:x.kisi_id,ad:'Deneme',soyad:'Üye',rol:'eczaci',auth_user_id:id(800)}}))};
 const db={rpc:async(name,args)=>{
  calls.push({rpc:name,args});
  if(name==='cogniti_token_yonetici_kapsami'){
   if(!['gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm'].includes(rol)||(args.p_tm&&![id(20),id(21)].includes(args.p_tm))||(!args.p_tm&&args.p_bm)||(!args.p_bm&&args.p_utt)||(args.p_bm&&args.p_bm!==(args.p_tm===id(20)?id(30):id(31)))||(args.p_utt&&args.p_utt!==(args.p_tm===id(20)?a:b)))return{data:null,error:{code:'42501'}};
   return{data:{ids:args.p_utt?[args.p_utt]:args.p_tm?[args.p_tm===id(20)?a:b]:[a,b]},error:null};
  }
  assert.equal(name,'cogniti_token_tm_kapsami');
  if(rol!=='tm'||(args.p_bm&&![id(30),id(31)].includes(args.p_bm))||(!args.p_bm&&args.p_utt)||(args.p_utt&&args.p_utt!==(args.p_bm===id(30)?a:b)))return{data:null,error:{code:'42501'}};
  return{data:{ids:args.p_utt?[args.p_utt]:args.p_bm?[args.p_bm===id(30)?a:b]:[a,b]},error:null};
 },from:table=>{
  const filters=[],q={select(){return q;},eq(k,v){filters.push(x=>x[k]===v);return q;},in(k,v){filters.push(x=>v.includes(x[k]));return q;},gt(k,v){filters.push(x=>x[k]>v);return q;},not(){return q;},order(){return q;},range(first,last){q.bounds=[first,last];return q;},single:async()=>({data:rows[table]?.[0],error:null}),
   then(resolve,reject){calls.push({table,bounds:q.bounds});let data=(rows[table]??[]).filter(x=>filters.every(f=>f(x)));if(q.bounds)data=data.slice(q.bounds[0],q.bounds[1]+1);return Promise.resolve({data,error:fail&&table==='cogniti_token_tuketimleri'?{code:'XX000'}:null}).then(resolve,reject);}};return q;
 }};
 const mods={'next/server':{NextResponse:{json:Response.json.bind(Response)}},'@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:auth?{id:id(3)}:null},error:null})}}),createAdminClient:()=>db},
  '@/lib/eclub/yonetimKapsami':{eclubYonetimKapsaminiGetir:async()=>({uttler:scoped})},'@/lib/eclub/uttEczane':{uttEczaneFirmaBaglari:async(_,utt)=>[{firmaId:company,eczaneId:utt===a?id(600):id(601)}]},
  '@/lib/video/yayindakiVideolar':{getYayindakiVideolar:async()=>[{yayin_id:pub,arac_id:id(400),arac_turu:'video',hedef_roller:['eczaci'],urun_adi:'Normavas',yayin_tarihi:'2026-10-01'}]},
  '@/lib/utils/roller':{ECLUB_HEDEF_ROLLER:['eczaci','eczane_teknisyeni'],YONLENDIRICI_ROLLER:['bm','tm'],YONETICI_ROLLER:['gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm'],hedefRolleriOku:y=>y.hedef_roller},
  '@/lib/tclub/tur/kayit':{gecerliTurBaslangiclari:async()=>({})},'@/lib/eclub/yayinEtkilesimleri':{eclubYayinEtkilesimSayilari:async()=>({begeniler:new Map(),favoriler:new Map()})},
  '@/lib/utils/hataIsle':{hataYaniti:()=>Response.json({hata:'Hata'},{status:500}),rolHatasi:msg=>Response.json({hata:msg},{status:403}),yetkiHatasi:()=>Response.json({hata:'Oturum'},{status:401}),validasyonHatasi:()=>Response.json({hata:'Geçersiz'},{status:400}),sunucuHatasi:()=>Response.json({hata:'Hata'},{status:500})}};
 const exports={};vm.runInNewContext(ts.transpileModule(readFileSync('app/(panel)/eclub/yayinlar/api/bm/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,console,require:name=>{assert(name in mods,name);return mods[name];}});
 return{calls,get:query=>exports.GET({nextUrl:{searchParams:new URLSearchParams(query)}})};
}
test('BM token kartı bölge gönderimlerini birleştirir; seçilen UTT yalnız kendi gönderimini görür',async()=>{
 for(const selected of ['',a,b]){
  const s=setup();const res=await s.get(`token_yayin_id=${pub}${selected?`&utt_id=${selected}`:''}`);assert.equal(res.status,200);
  const data=await res.json();assert.equal(data.yayinlar.length,1);assert.equal(data.yayinlar[0].yayin_id,pub);assert.equal(data.oneriler.length,selected?1:2);
  assert(data.oneriler.every(x=>x.oneri_id!==id(1002)));assert.equal(data.kisiler.length,selected?1:2);
  assert(s.calls.some(x=>x.table==='cogniti_token_tuketimleri'));
 }
});
test('BM token kartında dış UTT, gönderilmemiş yayın, hatalı UUID ve yetkisiz rol reddedilir',async()=>{
 for(const [options,query,status]of [[{},`token_yayin_id=${pub}&utt_id=${id(9)}`,403],[{ledger:false},`token_yayin_id=${pub}`,403],[{},'token_yayin_id=invalid',400],[{auth:false},`token_yayin_id=${pub}`,401],[{rol:'utt'},`token_yayin_id=${pub}`,403],[{fail:true},`token_yayin_id=${pub}`,500]])assert.equal((await setup(options).get(query)).status,status);
});
test('BM token kartı 1000 kayıt sınırında kesilmez; normal BM yayın sayfası eski seçim davranışını korur',async()=>{
 const s=setup({many:true});const res=await s.get(`token_yayin_id=${pub}`);assert.equal(res.status,200);assert.equal((await res.json()).oneriler.length,1004);assert(s.calls.filter(x=>x.table==='cogniti_token_tuketimleri').length>=3);
 const normal=setup();const r=await normal.get('');assert.equal(r.status,200);assert.equal((await r.json()).secili_utt_id,a);assert(!normal.calls.some(x=>x.table==='cogniti_token_tuketimleri'));
});
test('TM kart modalı takım, BM bölgesi ve UTT kapsamını sunucuda doğrular',async()=>{
 for(const [bm,utt,count]of [[null,null,2],[id(30),null,1],[id(30),a,1],[id(31),b,1]]){
  const s=setup({rol:'tm'});const response=await s.get(`token_gorunum=tm&token_yayin_id=${pub}${bm?`&bm_id=${bm}`:''}${utt?`&utt_id=${utt}`:''}`);assert.equal(response.status,200);
  const data=await response.json();assert.equal(data.oneriler.length,count);assert.equal(data.kisiler.length,count);
  assert.deepEqual(JSON.parse(JSON.stringify(s.calls.find(x=>x.rpc).args)),{p_kullanici:id(3),p_bm:bm,p_utt:utt});
 }
 for(const [opts,query,status]of [[{rol:'tm'},`&bm_id=${id(99)}`,403],[{rol:'tm'},`&bm_id=${id(30)}&utt_id=${b}`,403],[{rol:'tm'},`&utt_id=${a}`,400],[{rol:'tm'},'&bm_id=invalid',400],[{rol:'bm'},`&bm_id=${id(30)}`,403]]){
  assert.equal((await setup(opts).get(`token_gorunum=tm&token_yayin_id=${pub}${query}`)).status,status);
 }
});
test('Yönetici kartı yedi rolde firma/TM/BM/UTT kapsamını korur; normal BM sayfasını açmaz',async()=>{
 for(const rol of ['gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm'])for(const[tm,bm,utt,count]of [[null,null,null,2],[id(20),null,null,1],[id(20),id(30),null,1],[id(20),id(30),a,1],[id(21),id(31),b,1]]){
  const s=setup({rol});const response=await s.get(`token_gorunum=yonetici&token_yayin_id=${pub}${tm?`&tm_id=${tm}`:''}${bm?`&bm_id=${bm}`:''}${utt?`&utt_id=${utt}`:''}`);assert.equal(response.status,200);
  const data=await response.json();assert.equal(data.oneriler.length,count);assert.equal(data.kisiler.length,count);
  assert.deepEqual(JSON.parse(JSON.stringify(s.calls.find(x=>x.rpc).args)),{p_kullanici:id(3),p_tm:tm,p_bm:bm,p_utt:utt});
 }
 for(const[opts,query,status]of [[{rol:'gm'},`&tm_id=${id(99)}`,403],[{rol:'gm'},`&tm_id=${id(20)}&bm_id=${id(31)}`,403],[{rol:'gm'},`&tm_id=${id(20)}&bm_id=${id(30)}&utt_id=${b}`,403],[{rol:'gm'},`&bm_id=${id(30)}`,400],[{rol:'gm'},'&tm_id=invalid',400],[{rol:'tm'},'',403]])assert.equal((await setup(opts).get(`token_gorunum=yonetici&token_yayin_id=${pub}${query}`)).status,status);
 assert.equal((await setup({rol:'gm'}).get('')).status,403);
});
