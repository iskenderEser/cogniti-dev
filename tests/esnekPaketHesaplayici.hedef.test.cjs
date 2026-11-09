/* eslint-disable @typescript-eslint/no-require-imports */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {Window}=require('happy-dom');const win=new Window({url:'http://localhost/fiyatlar'});
for(const k of ['window','document','navigator'])Object.defineProperty(globalThis,k,{configurable:true,value:win[k]});globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const React=require('react'),{createRoot}=require('react-dom/client'),ts=require('typescript');
let currentPath='/fiyatlar',bad=false,passed=0;const calls=[];
const rows=JSON.parse(fs.readFileSync('tests/fixtures/esnekPaket20261109.json','utf8')).map(h=>({...h,katsayi:h.birim_fiyat/9.9}));
const packages=[{ad:'Paket 1',token:5000,birim:5.9,aylik:29500},{ad:'Paket 2',token:10000,birim:4.85,aylik:48500},{ad:'Paket 3',token:15000,birim:3.9,aylik:58500},{ad:'Paket 4',token:25000,birim:2.9,aylik:72500}];
const mocks={'@/components/satinAlma/EsnekPaketSiparis':{default:()=>null},react:React,'react/jsx-runtime':require('react/jsx-runtime'),'next/navigation':{usePathname:()=>currentPath},'lucide-react':{ChevronDown:()=>null}};
const cache=new Map();function load(file){if(cache.has(file))return cache.get(file);const result={};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(code,{exports:result,Intl,AbortController,fetch:async url=>{calls.push(url);return Response.json({sm2:bad?rows.slice(1):rows,paketler:packages});},require:n=>mocks[n]??(n.endsWith('.css')?{default:{}}:n.startsWith('@/')?load(n.slice(2)+'.ts'):n.startsWith('.')?load(require('node:path').join(require('node:path').dirname(file),n)+'.tsx'):require(n))});cache.set(file,result);return result;}
const Calculator=load('app/_components/EsnekPaketHesaplayici.tsx').default;
const ok=v=>{assert.ok(v);passed++;};
(async()=>{
 for(currentPath of ['/fiyatlar','/partner/fiyatlar']){
 const el=document.createElement('div');document.body.append(el);const root=createRoot(el);
 await React.act(async()=>root.render(React.createElement(Calculator)));
 const selects=el.querySelectorAll('select');
 ok(selects[0].options.length===71);ok(selects[0].options[0].value==='2500');ok(selects[0].options[70].value==='50000');
 ok(selects.length===1);ok(!el.textContent.includes('Faturamı böl'));ok(!el.textContent.includes('1. fatura'));
 ok(el.querySelector('p').textContent==='KDV hariçtir.');
 const price=label=>[...el.querySelectorAll('span')].find(e=>e.textContent===label).parentElement.querySelector('strong').textContent;
 ok(price('Birim fiyat / token')==='8,50 TL');ok(price('Toplam fiyat')==='21.250,00 TL');ok(!el.textContent.includes('Infinity'));ok(!el.textContent.includes('₺'));
 const change=async value=>{await React.act(async()=>{const input=el.querySelector('select');input.value=value;input.dispatchEvent(new win.Event('change',{bubbles:true}));});};
 await change('50000');
 ok(price('Birim fiyat / token')==='3,50 TL');ok(price('Toplam fiyat')==='175.000,00 TL');
 await change('12500');ok(price('Toplam fiyat')==='72.625,00 TL');
 const top=el.firstElementChild.children[0];
 ok(top.querySelectorAll('select').length===1);ok(top.textContent.indexOf('Toplam fiyat')<top.textContent.indexOf('Birim fiyat / token'));
 ok(calls.at(-1)===(currentPath.startsWith('/partner')?'/partner/api/fiyatlar':'/fiyatlar/api'));
 await React.act(async()=>root.unmount());el.remove();
 }
 const Page=load('app/_components/FiyatlarIcerigi.tsx').default;
 for(currentPath of ['/fiyatlar','/partner/fiyatlar']){
  const host=document.createElement('div');document.body.append(host);const pageRoot=createRoot(host);
  await React.act(async()=>pageRoot.render(React.createElement(Page)));
  ok(host.textContent.includes('Abonelik Paketleri'));ok(!host.textContent.includes('Süper Paketler'));
  const table=host.querySelector('[aria-label="Abonelik paket fiyatları"]');
  ok(table.querySelectorAll('tbody tr').length===4);ok(table.textContent.includes('Token / ay'));
  ok([...table.querySelectorAll('tbody tr')].map(r=>r.querySelectorAll('td')[0].textContent).join('|')==='5.000|10.000|15.000|25.000');
  ok([...table.querySelectorAll('tbody tr')].map(r=>r.querySelector('td:last-child').textContent).join('|')==='29.500 TL|48.500 TL|58.500 TL|72.500 TL');
  ok(table.textContent.includes('4,85'));ok(host.textContent.includes('Tüketiminize uygun paketi seçin.'));
  const links=[...host.querySelectorAll('a')].filter(a=>a.textContent.includes('Planlama Aracı'));
  ok(links.length===2);ok(links.every(a=>a.getAttribute('href')===(currentPath.startsWith('/partner')?'/partner/planlama-araci':'/planlama-araci')));
  await React.act(async()=>pageRoot.unmount());host.remove();
 }
 bad=true;const el=document.createElement('div');document.body.append(el);const root=createRoot(el);await React.act(async()=>root.render(React.createElement(Calculator)));ok(el.textContent.includes('Fiyatlar okunamadı'));await React.act(async()=>root.unmount());await win.happyDOM.close();console.log(JSON.stringify({passed,scope:'Gerçek React hesaplayıcı; iç kullanıcı ve partner, sahte API. Tek seferde ödeme, fatura bölme kaldırılması, siparişte fatura açıklaması, peşin fiyatlar ve eksik liste.'}));
})().catch(e=>{console.error(e);process.exitCode=1});
