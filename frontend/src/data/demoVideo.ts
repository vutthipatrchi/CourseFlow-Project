export const DEMO_VIDEO_URL = `${import.meta.env.BASE_URL}videos/demo-flower.mp4`
export const DEMO_VIDEO_LABEL =
  'คลิปตัวอย่างสำหรับทดสอบตัวเล่นวิดีโอ ใช้คลิปเดียวกันทุกบทจำลอง ไม่ใช่วิดีโอสอนของบทนี้'

/** Use the bundled clip only for recognized demo lessons without an actual video. */
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
