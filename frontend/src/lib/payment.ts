export function formatThb(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'THB',
    currencyDisplay: 'code',
    minimumFractionDigits: 2,
  })
    .format(amount)
    .replace(/\u00a0/g, ' ')
}
