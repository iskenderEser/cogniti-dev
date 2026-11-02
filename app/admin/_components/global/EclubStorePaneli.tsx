"use client";
import EclubStoreSiparislerSekmesi from "../../eclub-cek-teslimat/_components/EclubStoreSiparislerSekmesi";
interface Props {
 hata: (mesaj: string, adim?: string, detay?: string) => void;
 basari: (mesaj: string) => void;
}
export default function EclubStorePaneli(_props: Props) {
 void _props;
 return <EclubStoreSiparislerSekmesi />;
}
