// runtime config loader
export async function loadConfig(): Promise<void> {
  try {
    const res = await fetch('/config.json', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      (window as any).__ENV = json;
    }
  } catch (err) {
    // ignore - fallback to build-time env
  }
}

export function getApiBase(): string {
  const runtime = (window as any).__ENV && (window as any).__ENV.VITE_API_BASE;
  const build = (import.meta as any).env && (import.meta as any).env.VITE_API_BASE;
  const chosen = runtime || build || 'http://localhost:3001';
  return chosen;
}

export default getApiBase;

// Also expose as a global for legacy bundles that expect `getApiBase` on window.
try {
  (window as any).getApiBase = getApiBase;
} catch (e) {
  // ignore
}
