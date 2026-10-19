import { createAdminClient, createClient } from '@/lib/supabase/server';
import { kityPuanIsleyicileri } from '@/lib/kity/botpressPuan';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  return kityPuanIsleyicileri({
    anahtar: () => process.env.KITY_BOTPRESS_TOKEN_SECRET,
    db: () => createAdminClient(AbortSignal.any([request.signal, AbortSignal.timeout(20_000)])),
    oturum: async () => {
      const db = await createClient();
      const { data: { user }, error } = await db.auth.getUser();
      return error ? null : user;
    },
  }).baglanti(request);
}
