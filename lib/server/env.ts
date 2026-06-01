/**
 * Accès centralisé aux variables d'environnement serveur (auth Kobo).
 * Ne JAMAIS importer ce fichier depuis un composant client.
 */
function opt(name: string, fallback = ""): string {
  return (process.env[name] ?? fallback).trim();
}

export const ENV = {
  KOBO_BASE_URL: opt("KOBO_BASE_URL", "https://eu.kobotoolbox.org"),
  KOBO_TOKEN: opt("KOBO_TOKEN") || opt("KOBO_API_TOKEN"),
  KOBO_USERNAME: opt("KOBO_USERNAME"),
  KOBO_PASSWORD: opt("KOBO_PASSWORD"),
  CACHE_TTL_SECONDS: Number(opt("CACHE_TTL_SECONDS", "300")) || 300,
};

/** En-tête d'authentification Kobo (Token prioritaire, sinon Basic). */
export function koboAuthHeader(): Record<string, string> {
  if (ENV.KOBO_TOKEN) return { Authorization: `Token ${ENV.KOBO_TOKEN}` };
  if (ENV.KOBO_USERNAME && ENV.KOBO_PASSWORD) {
    const creds = `${ENV.KOBO_USERNAME}:${ENV.KOBO_PASSWORD}`;
    const b64 = typeof btoa !== "undefined" ? btoa(creds) : Buffer.from(creds).toString("base64");
    return { Authorization: `Basic ${b64}` };
  }
  // Pas d'auth → le dashboard fonctionnera sur les données seed (activité terminée).
  return {};
}

export function hasKoboAuth(): boolean {
  return !!(ENV.KOBO_TOKEN || (ENV.KOBO_USERNAME && ENV.KOBO_PASSWORD));
}
