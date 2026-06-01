#!/usr/bin/env bash
# =====================================================================
#  SAV Tshuapa — Script de mise en ligne (GitHub) + préparation Vercel
#  À exécuter EN LOCAL, à la racine du projet décompressé.
#
#  Prérequis : git, Node.js >= 18.18, un compte GitHub (repo déjà créé)
#  et, en option, le CLI Vercel (npm i -g vercel).
# =====================================================================
set -euo pipefail

REPO_URL="https://github.com/MBOMBOmamu1993/SAV-Tshuapa.git"
BRANCH="main"

echo "==> 1/5 · Vérification de Node et installation des dépendances"
node -v
npm install

echo "==> 2/5 · Build de production (validation)"
npm run build

echo "==> 3/5 · Initialisation du dépôt git"
if [ ! -d .git ]; then
  git init
  git branch -M "$BRANCH"
fi
git add -A
git commit -m "SAV Tshuapa — tableau de bord + rapport automatique PPTX" || echo "(rien à committer)"

echo "==> 4/5 · Liaison au dépôt GitHub et push"
if git remote | grep -q origin; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi
# Push (avec 4 tentatives en cas d'erreur réseau)
n=0
until git push -u origin "$BRANCH"; do
  n=$((n+1)); [ $n -ge 4 ] && { echo "Échec du push après 4 tentatives"; exit 1; }
  echo "Nouvelle tentative dans $((2**n))s..."; sleep $((2**n))
done

echo "==> 5/5 · Déploiement Vercel (facultatif)"
echo "Le code est sur GitHub. Pour déployer :"
echo "  Option A (recommandée) : importez le repo sur https://vercel.com/new"
echo "  Option B (CLI)         : npx vercel --prod"
echo ""
echo "N'oubliez pas d'ajouter les variables d'environnement Kobo (voir README) — facultatif."
echo "Terminé."
