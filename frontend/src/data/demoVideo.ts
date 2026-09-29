export const DEMO_VIDEO_URL = '/api/catalog/demo-video'
export const DEMO_VIDEO_LABEL =
  'Sample clip for testing the video player. The same clip is reused for every practice lesson and is not the lesson recording.'

/** Use the backend-served sample only for recognized demo lessons without an actual video. */
export function getLessonVideo(source: string | undefined, hasDemoLesson: boolean) {
  const demo = { url: hasDemoLesson ? DEMO_VIDEO_URL : '', isDemo: hasDemoLesson }
  if (!source?.trim()) return demo
  try {
    const url = new URL(source, window.location.origin)
    if (!['http:', 'https:'].includes(url.protocol)) return { url: '', isDemo: false }
    if (url.hostname === 'example.com' || url.hostname.endsWith('.example.com')) return demo
    return { url: url.href, isDemo: false }
  } catch {
    return { url: '', isDemo: false }
  }
}
