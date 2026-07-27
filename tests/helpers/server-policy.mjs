import { posix } from 'node:path';

const PUBLIC_FILES = new Set(['/', '/index.html', '/404.html', '/favicon.svg']);
/* '/case/' serves the generated case studies (Package B). Adding a root here
   grants read access to that subtree only — the dot-path, traversal, backslash
   and NUL rejections in normalizeSitePath, and the final realpath containment
   check in serve.mjs, all still apply unchanged. */
const PUBLIC_ROOTS = ['/case/', '/css/', '/fonts/', '/images/', '/js/', '/tests/device/'];

export function normalizeSitePath(rawPathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(rawPathname);
  } catch {
    return null;
  }
  if (!decoded.startsWith('/') || decoded.includes('\0') || decoded.includes('\\')) return null;
  if (decoded.split('/').some(segment => segment === '.' || segment === '..' || segment.startsWith('.'))) {
    return null;
  }
  return posix.normalize(decoded);
}

export function isAllowedSitePath(rawPathname) {
  const pathname = normalizeSitePath(rawPathname);
  if (!pathname) return false;
  if (PUBLIC_FILES.has(pathname)) return true;
  return PUBLIC_ROOTS.some(publicRoot => pathname.startsWith(publicRoot) && pathname.length > publicRoot.length);
}

export function acceptsGzip(header) {
  if (typeof header !== 'string' || !header.trim()) return false;
  const weights = new Map();
  for (const item of header.split(',')) {
    const [rawToken, ...parameters] = item.trim().split(';');
    const token = rawToken.toLowerCase();
    if (!token) continue;
    let quality = 1;
    for (const parameter of parameters) {
      const match = parameter.trim().match(/^q\s*=\s*(0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/i);
      if (match) {
        quality = Number(match[1]);
      } else if (/^q\s*=/i.test(parameter.trim())) {
        quality = 0;
      }
    }
    weights.set(token, quality);
  }
  if (weights.has('gzip')) return weights.get('gzip') > 0;
  return (weights.get('*') ?? 0) > 0;
}
