/** Prefix an absolute site path with Astro's `base` (`/` locally, `/forever-meta/` on GitHub Pages). */
export function href(path = '/'): string {
  const base = import.meta.env.BASE_URL || '/';
  if (path === '/' || path === '') return base.endsWith('/') ? base : `${base}/`;
  const root = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${root}${path.startsWith('/') ? path : `/${path}`}`;
}
