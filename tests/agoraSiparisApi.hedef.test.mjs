import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';import {readFileSync} from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const repo=fileURLToPath(new URL('../',import.meta.url)).replace(/\/$/,''),require=createRequire(repo+'/package.json'),ts=require('typescript');
let role='pm',calls=[],rpcError=null,auth=true;const uid='10000000-0000-4000-8000-000000000001';
const producers=['pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz','ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per'];
const mocks={
 '@/lib/agora/vitrinSunucu':{agoraVitrinBaglami:async()=>auth?{authId:uid,rol:role,db:{rpc:async(name,args)=>{calls.push({name,args});return {data:{siparis_id:uid},error:rpcError};}}}:null},
 '@/lib/agora/partnerHttp':{partnerJsonOku:async r=>({ok:true,veri:await r.json()}),partnerYanit:(d,status=200)=>Response.json(d,{status})},
 '@/lib/agora/partnerMedyaSunucu':{medyaUuid:v=>typeof v==='string'&&/^[0-9a-f-]{36}$/.test(v)},
 '@/lib/utils/roller':{URETICI_ROLLER:producers},'@/lib/token/fiyatlandirma':{KKO_TOKEN_FIYATI:9.9}
};
const m={exports:{}};const code=ts.transpileModule(readFileSync(repo+'/app/(panel)/agora/api/siparis/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
vm.runInThisContext('(function(require,module,exports){'+code+'})')(id=>mocks[id]??require(id),m,m.exports);
let passed=0;const eq=(a,b)=>{assert.deepEqual(a,b);passed++;};
const post=body=>m.exports.POST(new Request('http://localhost/agora/api/siparis',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body??{egitim_id:uid,surum:1,fiyat_tl:99,kko_birim:0.01,alici_id:'sahte',firma_id:'sahte'})}));
for(role of producers){eq((await post()).status,200);eq(calls.at(-1).args.p_auth_id,uid);eq(calls.at(-1).args.p_kko_birim,9.9);}
for(role of ['tm','gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm','utt','firma_admin']){let n=calls.length;eq((await post()).status,403);eq(calls.length,n);}
role='pm';eq((await post({egitim_id:uid,surum:1,fiyat_tl:-1})).status,400);eq((await post({egitim_id:'x',surum:1,fiyat_tl:99})).status,400);
rpcError={code:'40001'};eq((await post()).status,409);rpcError={code:'42501'};eq((await post()).status,403);rpcError={code:'XX000'};eq((await post()).status,503);
auth=false;eq((await post()).status,403);
console.log(JSON.stringify({passed,scope:'Gerçek sipariş route; auth/DB bağımlılıkları sahte, 13 üretici ve 10 diğer rol, istemci fiyat/kimlik yetki sınırı.'}));
