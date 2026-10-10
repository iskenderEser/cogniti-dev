// SQL görünüm verisi ve temizliğiyle aynı sabit kayıt kimlikleri.
export const ECLUB_CEK_KARTI_TEST_PUAN_IDLERI = [
  "e1200000-0000-4000-8000-000000000101",
  "e1200000-0000-4000-8000-000000000102",
  "e1200000-0000-4000-8000-000000000103",
] as const;

// Çek Talepleri görünüm SQL'i ve temizlik paketiyle aynı kimlikler.
export const ECLUB_CEK_TALEBI_TEST_IDLERI = [
  "e1300000-0000-4000-8000-000000000001",
  "e1300000-0000-4000-8000-000000000002",
  "e1300000-0000-4000-8000-000000000003",
  "e1300000-0000-4000-8000-000000000004",
  "e1300000-0000-4000-8000-000000000005",
  "e1300000-0000-4000-8000-000000000006",
  "e1300000-0000-4000-8000-000000000007",
] as const;

export function eclubCekTalebiGorunumTestiMi(talepId: string): boolean {
  return (ECLUB_CEK_TALEBI_TEST_IDLERI as readonly string[]).includes(talepId);
}
