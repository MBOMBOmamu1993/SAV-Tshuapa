"use client";

import { DataGate } from "@/components/ui/DataGate";
import { IdentificationView } from "@/components/sav/IdentificationView";
import { Card, SectionBar } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { fmtNum } from "@/lib/client/format";

export default function IdentificationRelaisPage() {
  return (
    <DataGate>
      {(d) => (
        <div className="space-y-4">
          <section>
            <SectionBar icon="people">Recherche active communautaire</SectionBar>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
              <KpiCard icon="hand" tone="teal" label="Relais actifs" value={fmtNum(d.relais.relaisActifs)} sub="Ayant soumis une fiche" />
              <KpiCard icon="child" tone="navy" label="Enfants identifiés (relais)" value={fmtNum(d.relais.byZone.reduce((a, r) => a + r.identifies, 0))} sub="Dans la communauté" />
              <KpiCard icon="map" tone="brand" label="Aires couvertes (relais)" value={fmtNum(d.relais.byAire.length)} sub="Au moins une fiche relais" />
            </div>
          </section>
          <IdentificationView data={d.relais} source="relais" geoNote="Formulaire relais — communauté" />
          <Card className="!p-3 border-oms-200 bg-oms-50/40">
            <div className="text-[12px] text-surface-800">
              <b>Message clé :</b> les relais permettent de retrouver les enfants invisibles dans les registres des centres
              de santé et d'améliorer la planification réelle des sessions. Toute discordance importante entre les chiffres
              des IT et des relais doit déclencher une validation conjointe IT–relais–superviseur.
            </div>
          </Card>
        </div>
      )}
    </DataGate>
  );
}
