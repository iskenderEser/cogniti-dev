import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';import {readFileSync} from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const repo=fileURLToPath(new URL('../',import.meta.url)).replace(/\/$/,''),require=createRequire(repo+'/package.json'),ts=require('typescript');
const uid='10000000-0000-4000-8000-000000000001';let calls=[],session=true,receipt=true,ready='yukleniyor';
const audio={yukleme_id:uid,dosya_yolu:'agora/a.mp3',dosya_adi:'a.mp3',dosya_boyutu:12,mime_type:'audio/mpeg',checksum_sha256:'a'.repeat(64),durum:ready};
const db={rpc:async(name,args)=>{calls.push({name,args});return {data:name==='agora_partner_medya_oku'?{videolar:[],podcastler:[{...audio,durum:ready}]}:true,error:null};}};
const mocks={
 'node:crypto':{randomUUID:()=>uid},'./partnerProfilSunucu':{onayliPartnerBaglami:async()=>session?{db,partnerId:uid,tokenOzeti:'test'}:null},
 './partnerHttp':{partnerJsonOku:async r=>({ok:true,veri:await r.json()}),partnerYanit:(d,status=200)=>Response.json(d,{status})},
 './partnerEgitimleri':{},'@/lib/video/bunnyYukleme':{},
 '@/lib/ogrenmeAraci/bunnyStorage':{yuklemeMakbuzuDogrula:()=>receipt,bunnyNesneBilgisi:async()=>({dosyaBoyutu:12,checksumSha256:'a'.repeat(64),ilkBaytlar:new Uint8Array()}),bunnyCdnImzaliUrl:()=>''},
 '@/lib/ogrenmeAraci/sozlesme':{dosyaImzasiDogrula:()=>true},
};
function load(file,mocks,extra={}){const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(repo+'/'+file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText.replaceAll("import.meta.url",JSON.stringify("file://"+repo+"/"+file)),{exports,require:id=>mocks[id]??require(id),Request,Response,AbortSignal,URL,process,...extra});return exports;}
const api=load('lib/agora/partnerMedyaSunucu.ts',mocks);
const call=d=>api.podcastTamamla(new Request('http://localhost/partner/api/medya/podcast',{method:'PATCH',body:JSON.stringify({egitim_id:uid,yukleme_id:uid,makbuz:'ok',...d})}));
let passed=0;const eq=(a,b)=>{assert.deepEqual(a,b);passed++;};
for(const n of [null,0,-1,1.5,'120'])eq((await call({sure_saniye:n})).status,400);
eq((await call({sure_saniye:120})).status,200);eq(calls.at(-1).args.p_sure,120);
receipt=false;eq((await call({sure_saniye:120})).status,400);receipt=true;
eq((await call({sure_saniye:120,islem:'sure_kaydet'})).status,409);
ready='hazir';eq((await call({sure_saniye:120,islem:'sure_kaydet',makbuz:undefined})).status,200);eq(calls.at(-1).name,'agora_partner_podcast_sure_kaydet');
session=false;eq((await call({sure_saniye:120})).status,401);
// Gerçek ortak metadata okuyucusu: dosya ve kayıtlı URL, geçersiz süre ve cleanup.
let duration=15.2,revoked=0,cleared=0;
class Audio{duration=duration;pause(){}removeAttribute(){cleared++;}load(){}set src(v){queueMicrotask(()=>this.onloadedmetadata?.());}}
const helpers=load('lib/ogrenmeAraci/bunnyYuklemeIstemci.ts',{'@/lib/ogrenmeAraci/sozlesme':{},'@/lib/ogrenmeAraci/sha256Istemci':{}},{Audio,queueMicrotask,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:()=>revoked++}});
eq(await helpers.sesSuresiniOku({}),16);eq(revoked,1);eq(await helpers.sesSuresiniOku('https://test.invalid/audio'),16);eq(revoked,1);
duration=Infinity;await assert.rejects(helpers.sesSuresiniOku({}));passed++;eq(cleared,3);
console.log(JSON.stringify({passed,scope:'Gerçek partner podcast PATCH helperı ve ortak ses süresi okuyucusu; oturum, DB, Bunny ve Audio metadata bağımlılıkları sahte.'}));
