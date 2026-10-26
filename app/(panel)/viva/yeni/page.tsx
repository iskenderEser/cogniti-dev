import { redirect } from "next/navigation";

export default async function Page({ searchParams }: { searchParams: Promise<{ tur?: string | string[] }> }) {
  const { tur } = await searchParams;
  redirect(tur === "anlik" ? "/viva?tur=anlik" : "/viva");
}
