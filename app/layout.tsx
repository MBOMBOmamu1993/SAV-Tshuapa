import "./globals.css";
import type { Metadata } from "next";
import { Sidebar } from "@/components/shell/Sidebar";
import Header from "@/components/shell/Header";
import { FilterBar } from "@/components/shell/FilterBar";

export const metadata: Metadata = {
  title: "SAV Tshuapa — Récupération des enfants ZD & SV",
  description: "Tableau de bord de la Semaine Africaine de la Vaccination (Tshuapa, RDC) : identification, planification et récupération des enfants zéro dose et sous-vaccinés. Synchronisé avec KoboToolbox.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <FilterBar />
            <main className="flex-1 overflow-y-auto overflow-x-hidden bg-surface-50">
              <div className="p-3 md:p-5">{children}</div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
