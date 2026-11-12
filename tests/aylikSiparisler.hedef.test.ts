import test from 'node:test';import assert from 'node:assert/strict';
import {aylikSiparisleriOku,satinAlimAyi} from '@/lib/satinAlma/aylikSiparisler';
test('ay filtresi ikinci sayfadaki kayıtları da bulur; Türkiye gece yarısı doğru aya girer',async t=>{
 assert.equal(satinAlimAyi('2026-10-31T21:00:00Z'),'2026-11');
 const calls:string[]=[];
 type Liste={firma_id:string;siparisler:{siparis_tarihi:string;id:number}[];toplam:number;sayfa:number;sayfa_boyutu:number;admin_onayi:boolean};
 t.mock.method(globalThis,'fetch',async(url:string)=>{
 calls.push(url);const page=Number(new URL(url,'http://localhost').searchParams.get('sayfa'));
 return Response.json({firma_id:'firma',sayfa:page,sayfa_boyutu:20,toplam:22,admin_onayi:true,
 siparisler:page===0?Array.from({length:20},(_,i)=>({id:i,siparis_tarihi:'2026-11-10T00:00:00Z'})):[{id:20,siparis_tarihi:'2026-10-15T00:00:00Z'},{id:21,siparis_tarihi:'2026-10-01T00:00:00Z'}]});
 });
 const r=await aylikSiparisleriOku({yol:'/kayit',firmaId:'firma',ay:'2026-10',sayfa:0,arama:'',signal:new AbortController().signal,dogrula:(v:unknown):v is Liste=>!!v&&typeof v==='object'&&Array.isArray((v as Liste).siparisler)});
 assert.equal(calls.length,2);assert.deepEqual(r.siparisler.map(s=>s.id),[20,21]);assert.equal(r.toplam,2);assert.equal(r.admin_onayi,true);
});
