export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  const datePart = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
  const hours24 = date.getHours()
  const period = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 || 12
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${datePart} ${hours12}:${minutes}${period}`
}
