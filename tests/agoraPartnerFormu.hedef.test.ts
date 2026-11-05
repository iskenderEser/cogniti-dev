import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import React, { act } from "react";
import * as jsx from "react/jsx-runtime";
import ts from "typescript";
import { Window } from "happy-dom";
import * as kontrol from "@/lib/agora/partnerKaydi";

test("Üyelik formu doğrulama, çift gönderim, hata sonrası tekrar ve başarılı kayıt kilidini korur", async () => {
  const dom = new Window({ url: "http://localhost/partner" });
  for (const key of ["window","document","navigator","HTMLElement","Element","Node","Event","MouseEvent","HTMLInputElement"] as const) {
    Object.defineProperty(globalThis,key,{configurable:true,value:dom[key]});
  }
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  const { createRoot } = await import("react-dom/client");
  let cagri=0;
  let tamamla: (response: Response) => void = () => {};
  const bodies: unknown[]=[];
  const passthrough = ({children,...props}:React.PropsWithChildren<Record<string,unknown>>) => React.createElement("div",props,children);
  const modules:Record<string,unknown>={
    react:React,"react/jsx-runtime":jsx,
    "next/link":{default:passthrough},
    "lucide-react":{Eye:()=>null,EyeOff:()=>null},
    "@/components/marka/CognitiLogo":{default:()=>null},
    "@/components/kontrol/SadeKontroller":{SadeSekmeler:({secenekler}:{secenekler:{deger:string;icerik:React.ReactNode}[]})=>React.createElement("div",null,secenekler.map(s=>React.createElement("div",{key:s.deger},s.icerik)))},
    "@/components/ui/input":{Input:(props:React.ComponentProps<"input">)=>React.createElement("input",props)},
    "@/components/ui/button":{Button:(props:React.ComponentProps<"button">)=>React.createElement("button",props)},
    "@/lib/agora/partnerKaydi":kontrol,
    "./partner.module.css":{default:new Proxy({},{get:(_,key)=>String(key)})},
  };
  const exports:{default?:React.ComponentType}={};
  const compiled=ts.transpileModule(readFileSync("app/partner/PartnerGiris.tsx","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  vm.runInNewContext(compiled,{exports,AbortSignal,fetch:(url:string,init:RequestInit)=>{
    assert.equal(url,"/partner/api/kayit");cagri++;bodies.push(JSON.parse(String(init.body)));
    return new Promise<Response>(resolve=>{tamamla=resolve;});
  },require:(id:string)=>{assert.ok(id in modules,id);return modules[id];}});
  assert.ok(exports.default);
  const root=createRoot(dom.document.body);
  const input=(id:string)=>dom.document.getElementById(id) as HTMLInputElement;
  const yaz=async(id:string,value:string)=>act(async()=>{
    Object.getOwnPropertyDescriptor(dom.HTMLInputElement.prototype,"value")!.set!.call(input(id),value);
    input(id).dispatchEvent(new dom.Event("input",{bubbles:true}));
  });
  const submit=()=>{
    const form=dom.document.querySelector('form[aria-label="İş partneri üyelik formu"]')!;
    form.dispatchEvent(new dom.Event("submit",{bubbles:true,cancelable:true}));
  };
  try {
    await act(async()=>root.render(React.createElement(exports.default!)));
    await act(async()=>submit());
    assert.equal(cagri,0);assert.ok(dom.document.querySelector('[role="alert"]'));
    await yaz("partner-kayit-ad","Ayşe Öztürk");
    await yaz("partner-kayit-eposta","AYSE@example.invalid");
    await yaz("partner-kayit-telefon","0532 123 45 67");
    await act(async()=>{submit();submit();});
    assert.equal(cagri,1);assert.equal(input("partner-kayit-ad").disabled,true);
    assert.deepEqual(bodies,[{ad_soyad:"Ayşe Öztürk",eposta:"ayse@example.invalid",cep_telefonu:"5321234567"}]);
    await act(async()=>tamamla(Response.json({hata:"Şu anda kayıt yapılamıyor."},{status:503})));
    assert.equal(input("partner-kayit-ad").disabled,false);
    assert.equal(input("partner-kayit-ad").value,"Ayşe Öztürk");
    assert.match(dom.document.querySelector('[role="alert"]')!.textContent!,/Şu anda/);
    await act(async()=>submit());assert.equal(cagri,2);
    await act(async()=>tamamla(Response.json({mesaj:"Üyelik bilgileriniz alındı."},{status:202})));
    assert.match(dom.document.querySelector('[role="status"]')!.textContent!,/alındı/);
    assert.equal(input("partner-kayit-ad").disabled,true);
    await act(async()=>submit());assert.equal(cagri,2);
    assert.equal(dom.document.querySelector('form[aria-label="İş partneri giriş formu"] button[type="submit"]')?.hasAttribute("disabled"),false);
  } finally {await act(async()=>root.unmount());await dom.happyDOM.close();}
});
