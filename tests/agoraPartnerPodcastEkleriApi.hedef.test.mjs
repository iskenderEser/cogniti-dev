import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';import {readFileSync} from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const repo=fileURLToPath(new URL('../',import.meta.url)).replace(/\/$/,''),require=createRequire(repo+'/package.json'),ts=require('typescript');
let auth=true,rpcError=null,uploads=0,calls=[],bytesValid=true;
const uid='10000000-0000-4000-8000-000000000001';
const db={rpc:async(n,a)=>{calls.push({n,a});return {data:{surum:2,kapak_yolu:null,transkript:{durum:'yok'}},error:rpcError};}};
const mocks={
 'node:crypto':require('node:crypto'),
 '@/lib/agora/partnerProfilSunucu':{onayliPartnerBaglami:async()=>auth?{db,partnerId:uid,tokenOzeti:'session'}:null},
 '@/lib/agora/partnerHttp':{partnerJsonOku:async r=>({ok:true,veri:await r.json()}),partnerYanit:(d,status=200)=>Response.json(d,{status})},
 '@/lib/agora/partnerMedyaSunucu':{medyaUuid:v=>typeof v==='string'&&/^[a-f0-9-]{36}$/.test(v)},
 '@/lib/ogrenmeAraci/bunnyStorage':{bunnyCdnImzaliUrl:()=> 'https://test.invalid/signed',bunnyStorageNesneYukle:async()=>{uploads++;return true;},bunnyStorageNesneSil:async()=>true},
 '@/lib/ogrenmeAraci/sozlesme':{podcastDestekDosyasiDogrula:()=>({ok:true,uzanti:'png'}),podcastDestekDosyasiImzasiDogrula:()=>bytesValid},
 '@/lib/ogrenmeAraci/transkriptMetinCikarici':{transkriptDosyasindanMetinCikar:async()=>({ok:true,metin:'Dosyadan çıkarılmış transkript.'})}
};
const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(repo+'/app/partner/api/medya/podcast-ekleri/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:id=>mocks[id]??require(id),Response,Request,File,Buffer,URL,process:{env:{NODE_ENV:'test'}}});
let passed=0;const eq=(a,b)=>{assert.deepEqual(a,b);passed++;};
const post=d=>exports.POST(new Request('http://localhost/partner/api/medya/podcast-ekleri',{method:'POST',body:JSON.stringify({egitim_id:uid,yukleme_id:uid,surum:1,islem:'onayla',metin:'Manuel transkript metnidir.',...d})}));
eq((await post({metin:''})).status,400);eq((await post({surum:'1'})).status,400);eq((await post({islem:'yabanci'})).status,400);
auth=false;eq((await post()).status,401);auth=true;
eq((await post()).status,200);eq(calls.at(-1).a.p_token_ozeti,'session');
rpcError={code:'40001'};eq((await post()).status,409);rpcError={code:'42501'};eq((await post()).status,403);rpcError=null;
eq((await exports.GET(new Request('http://localhost/partner/api/medya/podcast-ekleri?egitim_id=x&yukleme_id='+uid))).status,400);
const upload=async(origin='http://localhost',rol='kapak')=>{const f=new FormData();for(const [k,v]of Object.entries({egitim_id:uid,yukleme_id:uid,surum:'1',rol}))f.set(k,v);f.set('dosya',new File([new Uint8Array([1,2,3])],'cover.png',{type:'image/png'}));return exports.PUT(new Request('http://localhost/partner/api/medya/podcast-ekleri',{method:'PUT',headers:{origin},body:f}));};
eq((await upload('https://evil.invalid')).status,403);eq(uploads,0);
bytesValid=false;eq((await upload()).status,400);eq(uploads,0);bytesValid=true;
eq((await upload()).status,200);eq(uploads,1);eq(calls.at(-1).a.p_veri.yol.startsWith(`agora/${uid}/${uid}/${uid}/kapak/`),true);
eq((await upload('http://localhost','transkript')).status,200);eq(uploads,1);eq(calls.at(-1).a.p_veri.metin,'Dosyadan çıkarılmış transkript.');
console.log(JSON.stringify({passed,scope:'Gerçek ekler route, sahte oturum/DB/Bunny/parser; istek yetkisi, sürüm çakışması, dosya doğrulama kapısı ve manuel metin aktarımı.'}));
