import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { partnerJsonOku, partnerYanit } from "@/lib/agora/partnerHttp";
import { kkoSecimIstegiGecerli } from "@/lib/satinAlma/kkoSecimi";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
import { firmaAdminIstegiIzinliMi } from "@/lib/admin/firmaAdminErisimi";
const id = "00000000-0000-4000-8000-000000000001";
const body = { hesapTuru: "kisisel", birimFiyat: 9.9, islemAnahtari: id };
function setup() {
  const state = { yetki: { ok: true, kullaniciId: id } as Record<string, unknown>, error: null as {code:string;message?:string}|null,
    data: { bakiye_id: id, yeniden_deneme: false } as unknown };
  const calls: unknown[] = [];
  const exports = {} as { POST: (r: Request) => Promise<Response> };
  const deps: Record<string, unknown> = {
    "@/lib/agora/partnerHttp": { partnerJsonOku, partnerYanit },
    "@/lib/satinAlma/kkoSecimi": { kkoSecimIstegiGecerli },
    "@/lib/satinAlma/kkoYetkisiSunucu": { kkoYetkiliHesabiOku: async () => state.yetki },
    "@/lib/supabase/server": { createAdminClient: () => ({ rpc: async (name: string, args: unknown) => {
      calls.push({ name, args }); return { data: state.data, error: state.error };
    } }) },
    "@/lib/uretim/rpcTemel": { uuidGecerliMi },
  };
  vm.runInNewContext(ts.transpileModule(readFileSync("app/api/satin-alma/kko/route.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { exports, require: (n: string) => deps[n] ?? assert.fail(n), AbortSignal });
  return { state, calls, post: (data: unknown = body, origin = "http://localhost", type = "application/json") => exports.POST(new Request("http://localhost/api/satin-alma/kko", {
    method: "POST", headers: { origin, "content-type": type }, body: JSON.stringify(data),
  })) };
}
test("KKÖ API oturum kimliğiyle kendi RPCsine gider; firma/sahip beyanı kabul etmez", async () => {
  const s = setup(); const r = await s.post(); assert.equal(r.status, 200);
  assert.deepEqual(JSON.parse(JSON.stringify(s.calls)), [{name:"cogniti_kko_secimini_kaydet",args:{p_auth_id:id,p_hesap:"kisisel",p_birim_fiyat:9.9,p_anahtar:id}}]);
  assert.match(r.headers.get("cache-control") ?? "", /no-store/);
  for (const veri of [{...body,firmaId:id},{...body,sahipId:id},{...body,birimFiyat:0},{...body,hesapTuru:"diger"}]) assert.equal((await s.post(veri)).status, 400);
  assert.equal(s.calls.length, 1);
});
test("KKÖ API yetki, köken, içerik ve boyut kapılarını korur", async () => {
  const s = setup();
  assert.equal((await s.post(body,"https://foreign.example")).status,403);
  assert.equal((await s.post(body,"http://localhost","text/plain")).status,415);
  assert.equal((await s.post({...body,uzun:"x".repeat(5000)})).status,413);
  for (const status of [401,403,503]) { s.state.yetki={ok:false,status,hata:"test"}; assert.equal((await s.post()).status,status); }
  assert.equal(s.calls.length,0);
});
test("KKÖ SQL hataları ve bozuk sonuç başarı sayılmaz", async () => {
  const s=setup();
  for (const [code,status] of [["42501",403],["22023",400],["P0003",409],["PGRST202",503]]) {
    s.state.error={code:code as string,message:"KKO_SECIM:paket_veya_bloke_var"}; assert.equal((await s.post()).status,status);
  }
  s.state.error=null; s.state.data={bakiye_id:"yanlis"}; assert.equal((await s.post()).status,503);
});
test("Firma Admini KKÖ için yalnız POST yapabilir",()=>{
  for(const method of ["GET","HEAD","PUT","DELETE","POST"]) assert.equal(firmaAdminIstegiIzinliMi("/api/satin-alma/kko",method,new URLSearchParams(),id),method==="POST");
});
