import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';import {readFileSync,existsSync} from 'node:fs';import path from 'node:path';import vm from 'node:vm';import assert from 'node:assert/strict';
const repo=fileURLToPath(new URL('../',import.meta.url)).replace(/\/$/,''),require=createRequire(repo+'/package.json'),ts=require('typescript');
const uid=n=>'10000000-0000-4000-8000-'+String(n).padStart(12,'0');
let role='pm',auth=true,calls=[],owner=true,team=true,rpcError=null;
const profile={firma_id:uid(2),takim_id:uid(3)};
const db={rpc:async(name,args)=>{calls.push({name,args});return {data:name==='agora_yayinlarim_oku'?[{kapak_yolu:'private/cover.png',siparis_id:uid(4)}]:{talep_id:uid(5)},error:rpcError};},from:()=>({select(){return this},eq(){return this},single:async()=>({data:{...profile,takim_id:team?uid(3):null}})})};
const producers=['pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz','ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per'];
const mocks={
 '@/lib/agora/vitrinSunucu':{agoraVitrinBaglami:async()=>auth?{authId:uid(1),rol:role,db}:null},
 '@/lib/agora/partnerHttp':{partnerJsonOku:async r=>({ok:true,veri:await r.json()}),partnerYanit:(d,status=200)=>Response.json(d,{status})},
 '@/lib/agora/partnerMedyaSunucu':{medyaUuid:v=>typeof v==='string'&&/^[0-9a-f-]{36}$/.test(v)},
 '@/lib/ogrenmeAraci/bunnyStorage':{bunnyCdnImzaliUrl:p=>'signed:'+p},
 '@/lib/uretici/talepKaynakSahipligi':{urunFirmayaAitMi:async()=>owner,teknikFirmayaAitMi:async()=>owner},
};
const cache=new Map();function load(file){if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;vm.runInThisContext('(function(require,module,exports){'+code+'})')(id=>{if(mocks[id])return mocks[id];if(id.startsWith('@/')){let p=path.join(repo,id.slice(2));return load([p+'.ts',p+'.tsx'].find(existsSync));}return require(id)},m,m.exports);return m.exports;}
const route=load(repo+'/app/(panel)/agora-yayinlari/api/route.ts');let passed=0;const eq=(a,b)=>{assert.deepEqual(a,b);passed++;};
const post=(d={})=>route.POST(new Request('http://localhost/agora-yayinlari/api',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({siparis_id:uid(4),istek_id:uid(6),hedef:'utt',egitim_turu:'urun_egitimi',urun_id:uid(7),...d})}));
for(role of producers){const tur=role.startsWith('ik_')?'ik_egitimi':role.startsWith('egt_')?'satis_teknikleri':role==='med_md'?'medikal_egitim':'urun_egitimi';eq((await post({egitim_turu:tur,teknik_id:uid(8)})).status,200);eq(calls.at(-1).args.p_auth_id,uid(1));}
for(role of ['tm','gm','utt','bm','firma_admin','iu']){let n=calls.length;eq((await route.GET()).status,403);eq((await post()).status,403);eq(calls.length,n);}
role='pm';eq((await post({urun_id:null})).status,400);eq((await post({egitim_turu:'satis_teknikleri'})).status,403);eq((await post({hedef:'sahte'})).status,403);
team=false;eq((await post()).status,409);team=true;owner=false;eq((await post()).status,403);owner=true;
role='egt_md';eq((await post({egitim_turu:'satis_teknikleri',urun_id:null})).status,400);
eq((await post({egitim_turu:'satis_teknikleri',hedef:'eczaci',urun_id:null,teknik_id:uid(8)})).status,200);eq(calls.at(-1).args.p_ayarlar.teknik_id,null);
role='ik_md';eq((await post({egitim_turu:'ik_egitimi',hedef:'eczaci'})).status,403);
role='med_md';eq((await post({egitim_turu:'medikal_egitim',hedef:'eczanem',urun_id:null})).status,400);
role='pm';let res=await route.GET(),data=await res.json();eq(res.status,200);eq(data.yayinlar[0].kapak_yolu,undefined);eq(data.yayinlar[0].kapak_url,'signed:private/cover.png');
rpcError={code:'40001'};eq((await post()).status,409);rpcError=null;auth=false;eq((await route.GET()).status,403);
console.log(JSON.stringify({passed,scope:'Gerçek API ve ortak üretici kuralları; sahte auth/DB. 13 üretici, ürün/teknik/hedef zorunlulukları, sahiplik ve özel kapak alanları.'}));
