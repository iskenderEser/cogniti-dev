import { createAdminClient } from "@/lib/supabase/server";
import type { KamuSosyalLink } from "@/lib/sosyalLinkler";
import { kamuSosyalLinkleriniOku } from "@/lib/sosyalLinklerSunucu";
import KarsilamaSayfasi from "../_components/KarsilamaSayfasi";
import { montserrat } from "../_components/montserrat";

export const dynamic = "force-dynamic";

export default async function Welcome() {
  const bunnyLibraryId = process.env.BUNNY_LIBRARY_ID ?? "707975";
  const bunnyPullZone = process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE;

  let sosyalLinkler: KamuSosyalLink[] = [];
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      sosyalLinkler = await kamuSosyalLinkleriniOku(createAdminClient(AbortSignal.timeout(5000)));
    } catch {
      sosyalLinkler = [];
    }
  }

  return (
    <div className={montserrat.variable}>
      <KarsilamaSayfasi
        bunnyLibraryId={bunnyLibraryId}
        bunnyPullZone={bunnyPullZone}
        sosyalLinkler={sosyalLinkler}
      />
    </div>
  );
}
