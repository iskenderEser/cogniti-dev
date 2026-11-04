import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import TemsilciIsAkisiKarti from "@/components/rehber/TemsilciIsAkisiKarti";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { rolCozucu } from "@/lib/utils/rolCozucu";
import { panelBaslangici } from "@/lib/panel/baslangic";

export default async function BmRehberiSayfasi() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  const rol = await rolCozucu(createAdminClient(), user.id);
  if (rol !== "bm") redirect(panelBaslangici(rol).yol);

  return <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
    <Link href="/ana-sayfa" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--tema-eylem)]"><ArrowLeft size={16} aria-hidden="true" /> Ana sayfa</Link>
    <h1 className="mt-5 text-2xl font-extrabold text-[var(--tema-baslik)]">Tüm Haritalar</h1>
    <p className="mt-2 mb-6 text-sm text-[var(--tema-metin)]">Bölge Müdürü iş akışlarını açarak işlem adımlarını inceleyebilirsin.</p>
    <div className="grid gap-5 md:grid-cols-2">
      <TemsilciIsAkisiKarti harita="bmOneri" />
      <TemsilciIsAkisiKarti harita="bmGenel" />
      <TemsilciIsAkisiKarti harita="bmExtra" />
      <TemsilciIsAkisiKarti harita="bmChallengeGonder" />
      <TemsilciIsAkisiKarti harita="bmChallengeTamamla" />
      <TemsilciIsAkisiKarti harita="bmCekOnay" />
      <TemsilciIsAkisiKarti harita="bmMutabakat" />
    </div>
  </div>;
}
