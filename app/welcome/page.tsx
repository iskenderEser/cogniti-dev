import KarsilamaSayfasi from "../_components/KarsilamaSayfasi";
import { montserrat } from "../_components/montserrat";

export default function Welcome() {
  const bunnyLibraryId = process.env.BUNNY_LIBRARY_ID ?? "707975";
  const bunnyPullZone = process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE;
  return (
    <div className={montserrat.variable}>
      <KarsilamaSayfasi bunnyLibraryId={bunnyLibraryId} bunnyPullZone={bunnyPullZone} />
    </div>
  );
}
