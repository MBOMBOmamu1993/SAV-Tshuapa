# SAV Tshuapa — Récupération des enfants ZD &amp; SV

Tableau de bord web (Next.js 14) de la **Semaine Africaine de la Vaccination** dans la
province de la **Tshuapa** (RDC) — identification, planification et récupération des
enfants **zéro dose** et **sous-vaccinés**, sur la base des 5 formulaires KoboToolbox du
projet PEV-Central / OMS.

Même design, même charte (logos OMS &amp; PEV, bandeaux marine, graphiques épurés) et même
architecture que le tableau de bord *Supervision conjointe*, mais avec les analyses (KPI,
graphiques, tableaux) et le **rapport automatique PPTX** propres au SAV.

## Composantes (formulaires Kobo)

| # | Composante | Asset Kobo |
|---|------------|-----------|
| 1 | Identification EZD &amp; ESV par Centre de santé (IT) | `auKr7bzjsRNoohpveySTVA` |
| 2 | Identification EZD &amp; ESV par les Relais | `asJpNSD7cpyqDyrkrUp7kL` |
| 3 | Résultats vaccination par équipe | `akKgEGx4H4ngXpf6jecCnG` |
| 4 | Supervision des équipes | `aNbqyLNEssNK8SJjP5C52Z` |
| 5 | Planification session de vaccination | `aTULFAgubcP55V7VsSbcer` |

## Pages

- **Synthèse &amp; vue d'ensemble** — KPI clés, alertes automatiques, narration.
- **Identification au centre de santé (IT)** — enfants manqués par ZS/AS, tranche d'âge, antigène, Top 5.
- **Identification communautaire (relais)** — recherche active, Top 5, message clé.
- **Planification de la récupération** — AS avec/sans programme, sessions par type, ratios.
- **Résultats de la récupération** — doses récupérées, taux par zone/aire/antigène, Top 5 faibles.
- **Supervision des équipes** — score qualité, conformité par question, difficultés.
- **Télécharger Rapport** — génération PowerPoint automatique (11 diapositives).

## Données

L'activité étant terminée, la source de référence est un **seed figé**
(`data/sav-seed.json`, extrait des exports Kobo). Le tableau de bord fonctionne donc
immédiatement, sans authentification. Si un `KOBO_TOKEN` est configuré, l'application
tente une **resynchronisation live** des exports XLSX (bouton « Actualiser »).

## Démarrage local

```bash
npm install
cp .env.example .env        # facultatif (le seed suffit)
npm run dev                 # http://localhost:3000
npm run build && npm start  # build de production
```

## Variables d'environnement (Vercel)

| Variable | Valeur | Obligatoire |
|----------|--------|-------------|
| `KOBO_TOKEN` | `55b9dd0d686f98b78888d04cc1f2fe270b7e347f` | non (live) |
| `KOBO_USERNAME` | `rcm_oms_pev` | non |
| `KOBO_PASSWORD` | `rcm_oms_pev` | non |
| `KOBO_BASE_URL` | `https://eu.kobotoolbox.org` | non |
| `CACHE_TTL_SECONDS` | `300` | non |

## Stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · ECharts · SheetJS (xlsx) ·
pptxgenjs · SWR · Zustand.
