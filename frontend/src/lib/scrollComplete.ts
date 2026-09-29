/** True only after the user scrolls a scrollable page all the way to the bottom. */
export function hasScrolledToPageBottom(threshold = 24): boolean {
  const pageHeight = document.documentElement.scrollHeight
  const viewHeight = window.innerHeight
  if (pageHeight <= viewHeight + threshold * 2) return false
  if (window.scrollY < threshold) return false
  return pageHeight - (window.scrollY + viewHeight) <= threshold
}
