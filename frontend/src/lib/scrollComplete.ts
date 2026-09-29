/** True after the user scrolls far enough that the page bottom is in view. */
export function hasScrolledToPageBottom(threshold = 120): boolean {
  const root = document.documentElement
  const pageHeight = Math.max(root.scrollHeight, document.body?.scrollHeight ?? 0)
  const viewHeight = window.innerHeight
  // Prefer scrollY; do not use `||` because 0 at the top is a valid position.
  const scrollTop = Number.isFinite(window.scrollY) ? window.scrollY : root.scrollTop || 0
  const maxScroll = pageHeight - viewHeight
  // Short pages: never auto-complete on first paint (scrollTop stays 0).
  if (maxScroll <= threshold) return false
  if (scrollTop < threshold) return false
  return scrollTop >= maxScroll - threshold
}
