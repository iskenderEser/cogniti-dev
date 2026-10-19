import { createAdminClient } from '@/lib/supabase/server';
import { kityPuanIsleyicileri } from '@/lib/kity/botpressPuan';

export const runtime = 'nodejs';
export async function GET(request: Request) {
  return kityPuanIsleyicileri({
    anahtar: () => process.env.KITY_BOTPRESS_TOKEN_SECRET,
    db: () => createAdminClient(AbortSignal.any([request.signal, AbortSignal.timeout(20_000)])),
    oturum: async () => null,
  }).puan(request);
}
