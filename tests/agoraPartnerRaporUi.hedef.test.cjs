const {createRequire}=require('node:module'),fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const repo=process.env.COGNITI_RAPOR_TEST_ROOT_PATH??path.resolve(__dirname,'..'),req=createRequire(repo+'/package.json');
const {Window}=req('happy-dom'),win=new Window({url:'http://localhost/partner/raporlar'});
for(const k of ['window','document','navigator'])Object.defineProperty(globalThis,k,{configurable:true,value:win[k]});globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const React=req('react'),{createRoot}=req('react-dom/client'),ts=req('typescript'),cache=new Map();
function load(rel){if(!fs.existsSync(repo+'/'+rel))rel+='.ts';if(cache.has(rel))return cache.get(rel).exports;const m={exports:{}};cache.set(rel,m);
 const code=ts.transpileModule(fs.readFileSync(repo+'/'+rel,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 vm.runInThisContext('(function(require,module,exports){'+code+'})')(name=>name.endsWith('.css')?{__esModule:true,default:new Proxy({},{get:(_,p)=>p})}:name==='@/components/ui/yenile-butonu'?{YenileButonu:p=>React.createElement('button',{'aria-label':'Yenile',disabled:p.yenileniyor,onClick:p.onYenile},'Yenile')}:name.startsWith('@/')?load(name.slice(2)):req(name),m,m.exports);return m.exports;}
const Table=load('components/agora/PartnerRaporTablosu.tsx').default,id=n=>'10000000-0000-4000-8000-'+String(n).padStart(12,'0'),partner=id(11);
const row={egitim_id:id(21),partner_egitim_id:'PE-10001',egitim_adi:'Örnek eğitim',satis_fiyati:3000,satilan_adet:5,toplam_satis:12000,begeni_sayisi:5,favori_sayisi:2};
let mode='rows',urls=[],passed=0;
globalThis.fetch=async(url,opts)=>{urls.push(url);assert.equal(opts.cache,'no-store');return Response.json(mode==='error'?{hata:'Partner raporları SQL kurulumu bekleniyor.'}:{partner_id:partner,toplam:mode==='empty'?0:21,sayfa:Number(new URL(url,'http://localhost').searchParams.get('sayfa')),sayfa_boyutu:20,kayitlar:mode==='empty'?[]:[row]},{status:mode==='error'?503:200});};
const el=document.createElement('div');document.body.append(el);const root=createRoot(el);const ok=v=>{assert.ok(v);passed++;};
(async()=>{
 await React.act(async()=>root.render(React.createElement(Table,{partnerId:partner,endpoint:'/partner/api/raporlar',anaBaslik:true})));
 ok(el.querySelectorAll('th').length===7);ok(el.querySelector('h1').textContent==='Raporlarım');ok(el.textContent.includes('3.000,00'));ok(el.textContent.includes('12.000,00'));ok(!el.textContent.includes('15.000,00'));ok(el.textContent.includes('Güncel'));ok(el.textContent.includes('Gerçekleşen'));ok(el.textContent.includes('PE-10001'));ok(el.querySelector('input')===null);
 if(process.env.COGNITI_RAPOR_HTML)fs.writeFileSync(process.env.COGNITI_RAPOR_HTML,'<!doctype html><meta charset="utf-8"><style>:root{--tema-cizgi:#dfe4ea;--tema-yuzey:#fff;--tema-zemin:#f7f8fa;--tema-metin:#374151;--tema-baslik:#172235;--tema-ikincil-metin:#6b7280}*{box-sizing:border-box}body{margin:0;background:#f7f8fa;font-family:Arial,sans-serif}.fixture{margin-left:240px;padding:32px}'+fs.readFileSync(repo+'/components/agora/partner-ozet.module.css','utf8')+'</style><main class="fixture">'+el.innerHTML+'</main>');
 await React.act(async()=>[...el.querySelectorAll('button')].find(b=>b.textContent==='Sonraki').click());ok(urls.at(-1).endsWith('sayfa=2'));
 await React.act(async()=>el.querySelector('[aria-label="Yenile"]').click());ok(urls.at(-1).endsWith('sayfa=2'));
 mode='empty';await React.act(async()=>root.render(React.createElement(Table,{key:'empty',partnerId:partner,endpoint:'/admin/api/partnerler/'+partner+'/raporlar'})));ok(el.textContent.includes('Henüz raporlanacak eğitim bulunmuyor.'));ok(el.querySelector('h2').textContent==='Eğitim Raporları');
 mode='error';await React.act(async()=>root.render(React.createElement(Table,{key:'error',partnerId:partner,endpoint:'/partner/api/raporlar'})));ok(el.querySelector('[role="alert"]').textContent.includes('SQL kurulumu'));ok(!el.textContent.includes('Henüz raporlanacak'));
 await React.act(async()=>root.unmount());await win.happyDOM.close();console.log(JSON.stringify({passed,scope:'Yalnız Raporlar tablosu; React/HappyDOM, sahte fetch.'}));
})().catch(e=>{console.error(e);process.exitCode=1;});
