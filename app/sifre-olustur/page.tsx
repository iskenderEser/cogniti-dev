import { DavetSifreKarti } from "@/components/auth/DavetSifreKarti";
import { eczanemDavetTokeniMi } from "@/lib/eczanem/uyelikDaveti";
import { createAdminClient } from "@/lib/supabase/server";

export default async function SifreOlusturPage({ searchParams }: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  const temizToken = typeof token === "string" ? token : null;
  let kvkkOnayiGerekli = false;
  if (temizToken) {
    try {
      kvkkOnayiGerekli = await eczanemDavetTokeniMi(createAdminClient(AbortSignal.timeout(5000)), temizToken);
    } catch {
      kvkkOnayiGerekli = false;
    }
  }
  return <DavetSifreKarti token={temizToken} kvkkOnayiGerekli={kvkkOnayiGerekli} />;
}
