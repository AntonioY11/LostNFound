// runtime config loader
export async function loadConfig(): Promise<void> {
  try {
    const res = await fetch('/config.json', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      (window as any).__ENV = json;
      console.log('runtime config loaded', json);
    }
  } catch (err) {
    // ignore - fallback to build-time env
    console.warn('runtime config not loaded, falling back to build-time env', err);
  }
}

export function getApiBase(): string {
  const runtime = (window as any).__ENV && (window as any).__ENV.VITE_API_BASE;
  const build = (import.meta as any).env && (import.meta as any).env.VITE_API_BASE;
  const chosen = runtime || build || 'http://localhost:3001';
  // log chosen base so we can see what's being used at runtime
  try { console.log('API base resolved to', chosen); } catch (e) {}
  return chosen;
}

export default getApiBase;

// Also expose as a global for legacy bundles that expect `getApiBase` on window.
try {
  (window as any).getApiBase = getApiBase;
} catch (e) {
  // ignore
}
