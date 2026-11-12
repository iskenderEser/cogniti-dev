import { SadeTabloSecimi } from "@/components/kontrol/SadeKontroller";

const yayinDonemiBicimi = new Intl.DateTimeFormat("en", {
  timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit",
});
const ayAdiBicimi = new Intl.DateTimeFormat("tr-TR", { timeZone: "UTC", month: "long" });
const aySecenekleri = Array.from({ length: 12 }, (_, index) => ({
  deger: String(index + 1).padStart(2, "0"),
  etiket: ayAdiBicimi.format(Date.UTC(2000, index, 1)),
}));

export function yayinDonemi(tarih: Date) {
  const parcalar = yayinDonemiBicimi.formatToParts(tarih);
  const yil = parcalar.find((parca) => parca.type === "year")!.value;
  const ay = parcalar.find((parca) => parca.type === "month")!.value;
  return { yil, ay };
}

export function EczanemYayinDonemiSecimi({ donem, yilSecenekleri, onDegistir, disabled }: {
  donem: { yil: string; ay: string };
  yilSecenekleri: readonly { deger: string; etiket: string }[];
  onDegistir: (degisiklik: Partial<{ yil: string; ay: string }>) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <SadeTabloSecimi
        etiket="Yayın ayı"
        aranabilir={false}
        disabled={disabled}
        className="min-w-[96px]! sm:min-w-[112px]!"
        secenekler={aySecenekleri}
        deger={donem.ay}
        onDegistir={(ay) => onDegistir({ ay })}
      />
      <SadeTabloSecimi
        etiket="Yayın yılı"
        aranabilir={false}
        disabled={disabled}
        className="min-w-[76px]! sm:min-w-[84px]!"
        secenekler={yilSecenekleri}
        deger={donem.yil}
        onDegistir={(yil) => onDegistir({ yil })}
      />
    </div>
  );
}
