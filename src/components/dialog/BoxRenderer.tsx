import type { DialogBox } from "@/lib/dialog/types";
import WissensBox from "./boxes/WissensBox";
import ZuordnungsBox from "./boxes/ZuordnungsBox";
import KonfliktBox from "./boxes/KonfliktBox";
import GapBox from "./boxes/GapBox";
import AuswahlBox from "./boxes/AuswahlBox";
import EingabeBox from "./boxes/EingabeBox";
import KontextBox from "./boxes/KontextBox";
import AktionsBox from "./boxes/AktionsBox";

const BoxRenderer = ({ box }: { box: DialogBox }) => {
  switch (box.type) {
    case "wissen":
      return <WissensBox box={box} />;
    case "zuordnung":
      return <ZuordnungsBox box={box} />;
    case "konflikt":
      return <KonfliktBox box={box} />;
    case "gap":
      return <GapBox box={box} />;
    case "auswahl":
      return <AuswahlBox box={box} />;
    case "eingabe":
      return <EingabeBox box={box} />;
    case "kontext":
      return <KontextBox box={box} />;
    case "aktion":
      return <AktionsBox box={box} />;
    default:
      return null;
  }
};

export default BoxRenderer;
