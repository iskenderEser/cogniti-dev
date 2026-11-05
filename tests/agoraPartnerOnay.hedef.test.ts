import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import React, { act } from "react";
import * as jsx from "react/jsx-runtime";
import ts from "typescript";
import { Window } from "happy-dom";
import * as tipler from "@/lib/agora/partnerOnayTipleri";
import { partnerSifreOzeti, partnerSifreDogrula } from "@/lib/agora/partnerSifre";
import { partnerJsonOku } from "@/lib/agora/partnerHttp";

test("Partner şifresi tuzlu özetlenir; yanlış veya eksik özetle giriş doğrulanmaz", async () => {
  const sifre = "123456";
  const a = await partnerSifreOzeti(sifre), b = await partnerSifreOzeti(sifre);
  assert.notEqual(a,b); assert.ok(!a.includes(sifre));
  assert.equal(await partnerSifreDogrula(sifre,a),true);
  assert.equal(await partnerSifreDogrula("YanlisTest!123",a),false);
  assert.equal(await partnerSifreDogrula(sifre,null),false);
  await assert.rejects(partnerSifreOzeti("12345"));
  await assert.rejects(partnerSifreOzeti("1".repeat(129)));
});

test("Partner yazma uçlarında yabancı origin ve büyük/parçalı gövde reddedilir", async () => {
  const req = (body:string,origin="http://localhost") => new Request("http://localhost/partner/api/giris",{method:"POST",headers:{origin,"content-type":"application/json"},body});
  const bad = await partnerJsonOku(req("{}","https://baska.invalid"));
  assert.equal(bad.ok,false); if(!bad.ok)assert.equal(bad.yanit.status,403);
  const large = await partnerJsonOku(req(JSON.stringify({sifre:"ü".repeat(4096)})));
  assert.equal(large.ok,false);if(!large.ok)assert.equal(large.yanit.status,413);
  assert.equal((await partnerJsonOku(req('{"eposta":"p@example.invalid"}'))).ok,true);
});

test("Admin listesi başvuruyu gösterir, çift karar göndermez ve başarıdan sonra günceller", async () => {
  const dom = new Window({ url: "http://localhost/admin?bolum=partnerler" });
  for(const key of ["window","document","navigator","HTMLElement","Element","Node","Event","MouseEvent","HTMLInputElement"] as const) Object.defineProperty(globalThis,key,{configurable:true,value:dom[key]});
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  const {createRoot}=await import("react-dom/client");
  const entry={partner_id:"10000000-0000-4000-8000-000000000001",ad_soyad:"Örnek Partner",eposta:"p@example.invalid",cep_telefonu:"5321234567",olusturuldu_at:"2026-11-04T12:00:00Z",ilk_giris_durumu:"bekliyor",karar_at:null,giris_surum:1};
  let kayitlar=[entry],okumaHatasi=false;
  const yazmalar:Record<string,unknown>[]=[];
  let karariTamamla:(r:Response)=>void=()=>{};
  const modules:Record<string,unknown>={
    react:React,"react/jsx-runtime":jsx,
    "@/lib/agora/partnerOnayTipleri":tipler,
    "@/components/kontrol/SadeKontroller":{
      SadeSekmeler:({secenekler}:{secenekler:{deger:string;icerik:React.ReactNode}[]})=>React.createElement("div",null,secenekler.map(s=>React.createElement("div",{key:s.deger},s.icerik))),
      SadeKapsulFiltre:()=>null,
    },
    "@/components/ui/yenile-butonu":{YenileButonu:({onYenile,disabled,yenileniyor}:{onYenile:()=>void;disabled:boolean;yenileniyor:boolean})=>React.createElement("button",{type:"button",disabled:disabled||yenileniyor,onClick:onYenile},"Yenile")},
    "@/components/ui/input":{Input:(props:React.ComponentProps<"input">)=>React.createElement("input",props)},
    "./PartnerUyelikOnayi":{default:()=>null},
    "../admin.module.css":{default:new Proxy({},{get:(_,key)=>String(key)})},
  };
  const exports:{default?:React.ComponentType}={};
  vm.runInNewContext(ts.transpileModule(readFileSync("app/admin/_components/PartnerYonetimi.tsx","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{
    exports,AbortController,AbortSignal,URLSearchParams,
    fetch:async(_url:string,init:RequestInit)=>{
      if(init?.method==="POST") {yazmalar.push(JSON.parse(String(init.body)));return new Promise<Response>(resolve=>{karariTamamla=resolve;});}
      return okumaHatasi?Response.json({hata:"Okunamadı"},{status:503}):Response.json({kayitlar,toplam:kayitlar.length});
    },require:(id:string)=>{assert.ok(id in modules,id);return modules[id];},
  });
  assert.ok(exports.default);
  const root=createRoot(dom.document.body);
  const button=(text:string)=>[...dom.document.querySelectorAll("button")].find(e=>e.textContent===text)!;
  try {
    await act(async()=>root.render(React.createElement(exports.default!)));
    assert.match(dom.document.body.textContent,/Örnek Partner/);
    assert.match(dom.document.body.textContent,/p@example.invalid/);
    await act(async()=>button("Onayla").click());
    const input=dom.document.querySelector<HTMLInputElement>('input[type="password"]')!;
    await act(async()=>{Object.getOwnPropertyDescriptor(dom.HTMLInputElement.prototype,"value")!.set!.call(input,"123456");input.dispatchEvent(new dom.Event("input",{bubbles:true}));});
    const form=dom.document.querySelector("form")!;
    await act(async()=>{form.dispatchEvent(new dom.Event("submit",{bubbles:true,cancelable:true}));form.dispatchEvent(new dom.Event("submit",{bubbles:true,cancelable:true}));});
    assert.equal(yazmalar.length,1);
    assert.equal(yazmalar[0].giris_surum,1);assert.equal(yazmalar[0].karar,"onaylandi");
    kayitlar=[];
    await act(async()=>karariTamamla(Response.json({mesaj:"İlk giriş onaylandı."})));
    assert.equal(dom.document.querySelector('input[type="password"]'),null);
    assert.match(dom.document.body.textContent,/İlk giriş onaylandı/);
    assert.equal(yazmalar.length,1);
    okumaHatasi=true;
    await act(async()=>button("Yenile").click());
    assert.match(dom.document.querySelector('[role="alert"]')!.textContent!,/okunamadı/);
    assert.ok(!dom.document.querySelector("table"));
  }finally{await act(async()=>root.unmount());await dom.happyDOM.close();}
});
