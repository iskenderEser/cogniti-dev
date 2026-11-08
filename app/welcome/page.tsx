import { Montserrat } from "next/font/google";
import KarsilamaSayfasi from "../_components/KarsilamaSayfasi";

const montserrat = Montserrat({ subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600", "700", "800"], display: "swap", variable: "--font-montserrat" });

export default function Welcome() {
  return <div className={montserrat.variable}><KarsilamaSayfasi /></div>;
}
