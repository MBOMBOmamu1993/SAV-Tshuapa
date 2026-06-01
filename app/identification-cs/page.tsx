"use client";

import { DataGate } from "@/components/ui/DataGate";
import { IdentificationView } from "@/components/sav/IdentificationView";

export default function IdentificationCsPage() {
  return (
    <DataGate>
      {(d) => <IdentificationView data={d.cs} source="cs" geoNote="Formulaire IT — centres de santé" />}
    </DataGate>
  );
}
