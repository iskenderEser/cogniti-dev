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
  const dom = new Window({ url: "http://localhost/partner/basvuru" });
  for (const key of ["window","document","navigator","HTMLElement","Element","Node","Event","MouseEvent","HTMLInputElement","HTMLTextAreaElement","KeyboardEvent"] as const) {
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
    "lucide-react":{FileText:()=>null,Upload:()=>null,X:()=>null},
    "@/components/marka/CognitiLogo":{default:()=>null},
    "@/components/ui/input":{Input:(props:React.ComponentProps<"input">)=>React.createElement("input",props)},
    "@/components/ui/button":{Button:(props:React.ComponentProps<"button">)=>React.createElement("button",props)},
    "@/lib/agora/partnerKaydi":kontrol,
    "@/lib/agora/partnerProfil":{ partnerIbanGecerli: (iban: string) => /^TR\d{24}$/.test(iban) },
    "../partner.module.css":{default:new Proxy({},{get:(_,key)=>String(key)})},
  };
  const exports:{default?:React.ComponentType}={};
  const compiled=ts.transpileModule(readFileSync("app/partner/basvuru/PartnerBasvuruFormu.tsx","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  vm.runInNewContext(compiled,{exports,AbortSignal,FormData,fetch:(url:string,init:RequestInit)=>{
    assert.equal(url,"/partner/api/kayit");cagri++;
    const fd = init.body as FormData;
    bodies.push(JSON.parse(String(fd.get("veri"))));
    return new Promise<Response>(resolve=>{tamamla=resolve;});
  },require:(id:string)=>{assert.ok(id in modules,id);return modules[id];}});
  assert.ok(exports.default);
  const root=createRoot(dom.document.body);
  const input=(id:string)=>dom.document.getElementById(id) as HTMLInputElement;
  const textarea=(id:string)=>dom.document.getElementById(id) as HTMLTextAreaElement;
  const yaz=async(id:string,value:string)=>act(async()=>{
    Object.getOwnPropertyDescriptor(dom.HTMLInputElement.prototype,"value")!.set!.call(input(id),value);
    input(id).dispatchEvent(new dom.Event("input",{bubbles:true}));
  });
  const yazAlan=async(id:string,value:string)=>act(async()=>{
    Object.getOwnPropertyDescriptor(dom.HTMLTextAreaElement.prototype,"value")!.set!.call(textarea(id),value);
    textarea(id).dispatchEvent(new dom.Event("input",{bubbles:true}));
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
    await yaz("partner-kayit-tc","12345678901");
    await yaz("partner-kayit-eposta","AYSE@example.invalid");
    await yaz("partner-kayit-telefon","0532 123 45 67");
    await yazAlan("partner-kayit-uzmanlik","Medikal Eğitim");
    await act(async()=>{
      const ekle=[...dom.document.querySelectorAll("button")].find(b=>b.textContent==="Ekle")!;
      ekle.click();
    });
    await yazAlan("partner-kayit-tanitim","İlaç ve eczacılık alanında 10 yıllık eğitim ve içerik deneyimine sahibim.");
    await act(async()=>{
      const cvInput=input("partner-kayit-cv");
      const sahteDosya=new dom.File(["%PDF-1.4"],"ozgecmis.pdf",{type:"application/pdf"});
      Object.defineProperty(cvInput,"files",{configurable:true,value:[sahteDosya]});
      cvInput.dispatchEvent(new dom.Event("change",{bubbles:true}));
    });
    await yaz("partner-kisisel-banka","Örnek Bankası");
    await yaz("partner-kisisel-hesap","Ayşe Öztürk");
    await yaz("partner-kisisel-iban","123456789012345678901234");
    await act(async()=>{submit();submit();});
    assert.equal(cagri,1);assert.equal(input("partner-kayit-ad").disabled,true);
    assert.deepEqual(bodies,[{
      tur:"kisisel",
      ad_soyad:"Ayşe Öztürk",
      eposta:"ayse@example.invalid",
      cep_telefonu:"5321234567",
      tc_no:"12345678901",
      uzmanliklar:["Medikal Eğitim"],
      kendini_tanitma:"İlaç ve eczacılık alanında 10 yıllık eğitim ve içerik deneyimine sahibim.",
      banka_adi:"Örnek Bankası",
      iban:"TR123456789012345678901234",
      hesap_adi:"Ayşe Öztürk",
    }]);
    await act(async()=>tamamla(Response.json({hata:"Şu anda kayıt yapılamıyor."},{status:503})));
    assert.equal(input("partner-kayit-ad").disabled,false);
    assert.equal(input("partner-kayit-ad").value,"Ayşe Öztürk");
    assert.match(dom.document.querySelector('[role="alert"]')!.textContent!,/Şu anda/);
    await act(async()=>submit());assert.equal(cagri,2);
    await act(async()=>tamamla(Response.json({mesaj:"Üyelik bilgileriniz alındı."},{status:202})));
    assert.match(dom.document.querySelector('[role="status"]')!.textContent!,/alındı/);
    assert.equal(input("partner-kayit-ad").disabled,true);
    await act(async()=>submit());assert.equal(cagri,2);
  } finally {await act(async()=>root.unmount());await dom.happyDOM.close();}
});
