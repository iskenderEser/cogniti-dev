import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';import {readFileSync} from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const repo=fileURLToPath(new URL('../',import.meta.url)).replace(/\/$/,''),require=createRequire(repo+'/package.json'),ts=require('typescript');
let auth=true,fail=false,flag=false;const uid='10000000-0000-4000-8000-000000000001';
const mocks={
 '@/lib/agora/vitrinSunucu':{agoraVitrinBaglami:async()=>auth?{authId:uid,db:{rpc:async n=>n==='agora_vitrin_oku'?{data:{stat:{},partnerler:[],yayinlar:[{egitim_id:uid,yayin_araci:'podcast'}]},error:null}:n==='agora_vitrin_podcast_bilgileri'?{data:[{egitim_id:uid,transkript_var:flag,kapak_var:flag,kapak_yolu:flag?'agora/private-cover.png':null}],error:fail?{code:'x'}:null}:{data:{tur:'podcast',dosya_yolu:'agora/private-audio.mp3',mime_type:'audio/mpeg',kapak_yolu:'agora/private-cover.png',transkript_metni:'Onaylı transkript metni.'},error:null}}}:null},
 '@/lib/agora/partnerHttp':{partnerYanit:(d,status=200)=>Response.json(d,{status})},
 '@/lib/ogrenmeAraci/bunnyStorage':{bunnyCdnImzaliUrl:()=> 'https://test.invalid/signed-cover'},
 '@/lib/agora/partnerMedyaSunucu':{medyaUuid:()=>true},
 '@/lib/agora/korumaSunucu':{ayniSiteMedyaIstegi:()=>true,sesliUyariHazir:async()=>true,podcastAkisi:async()=>new Response('audio')},
 '@/lib/agora/koruma':{AGORA_KORUMA_SURUMU:1}
};
function load(file){const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(repo+'/'+file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:id=>mocks[id]??require(id),URL,process,Response});return exports;}
const list=load('app/(panel)/agora/api/vitrin/route.ts');const media=load('app/(panel)/agora/api/yayin/[egitimId]/route.ts');let passed=0;const eq=(a,b)=>{assert.deepEqual(a,b);passed++;};
let d=await (await list.GET()).json();eq(d.yayinlar[0].transkript_var,false);eq(d.yayinlar[0].kapak_url,null);
flag=true;d=await(await list.GET()).json();eq(d.yayinlar[0].kapak_url,'https://test.invalid/signed-cover');eq(d.yayinlar[0].transkript_var,true);eq(JSON.stringify(d).includes('private-cover'),false);
fail=true;eq((await list.GET()).status,503);fail=false;
d=await(await media.GET(new Request('http://localhost/agora/api/yayin/'+uid),{params:Promise.resolve({egitimId:uid})})).json();eq(d.korumaSurumu,1);eq(d.transkript_metni,'Onaylı transkript metni.');eq(d.kapak_url,'https://test.invalid/signed-cover');eq(d.url,'/agora/api/yayin/'+uid+'?akis=1');eq(JSON.stringify(d).includes('private-audio'),false);
auth=false;eq((await list.GET()).status,403);
console.log(JSON.stringify({passed,scope:'Gerçek vitrin/önizleme APIleri, sahte DB ve CDN: bilgilendirme, signed kapak, koruma sürümü ve ham dosya yolu izolasyonu.'}));
