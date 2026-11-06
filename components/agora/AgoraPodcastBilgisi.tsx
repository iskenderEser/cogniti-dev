import type { AgoraYayini } from "@/lib/agora/vitrin";
export function AgoraPodcastBilgisi({yayin}:{yayin:AgoraYayini}){
 if(yayin.yayin_araci!=="podcast")return null;
 return <span className="my-2 flex flex-wrap gap-1 text-[11px] font-semibold" aria-label="Podcast özellikleri">
  <span className="rounded-md border px-1.5 py-1">{yayin.transkript_var===true?"Transkriptli":yayin.transkript_var===false?"Transkriptsiz":"Transkript Bilgisi Alınamadı"}</span>
  <span className="rounded-md border px-1.5 py-1">{yayin.kapak_var===true?"Özel Kapak":yayin.kapak_var===false?"Standart Kapak":"Kapak Bilgisi Alınamadı"}</span>
 </span>;
}
