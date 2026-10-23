import type { Metadata } from "next";
import { Kommer, PageHeader } from "@/components/Page";

export const metadata: Metadata = { title: "Vinprovning" };

export default function Provning() {
  return (
    <>
      <PageHeader eyebrow="Planera" title="Vinprovning">
        Ange deltagare, antal viner, budget och tema. Appen räknar flaskor och Claude föreslår viner i rätt ordning.
      </PageHeader>
      <Kommer fas={5} icon="glas" title="Provningsplanerare">Inköpslista, servertemperatur, matmatchning och ett utskrivbart protokoll.</Kommer>
    </>
  );
}
