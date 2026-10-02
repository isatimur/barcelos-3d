// Shared pure resolver; usable by Node regression checks.
const HOSTS = { 'barcelos-3d.com': 'barcelos', 'www.barcelos-3d.com': 'barcelos', 'barcelos-3d.vercel.app': 'barcelos' };
const ID_RE = /^[a-z][a-z0-9-]*$/;

export function resolveCityId(envId, search = '', hostname = '') {
  const q = new URLSearchParams(search).get('city');
  if (envId && ID_RE.test(envId)) return envId;
  if (q && ID_RE.test(q)) return q;
  if (HOSTS[hostname]) return HOSTS[hostname];
  const m = /^(?:www\.)?([a-z][a-z0-9-]*)-3d\.(?:com|pt|app)$/.exec(hostname || '');
  if (m) return m[1];
  return 'barcelos';
}

