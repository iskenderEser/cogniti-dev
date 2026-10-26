import VivaMisafir from "@/components/viva/VivaMisafir";
export const metadata = { title: "Viva · Özel davet", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <VivaMisafir key={token} token={token} />;
}
