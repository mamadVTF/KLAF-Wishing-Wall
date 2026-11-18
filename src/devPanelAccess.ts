export function isDevPanelRequested(search: string): boolean {
  const value = new URLSearchParams(search).get('devpanel')?.toLowerCase()
  return value === '' || value === '1' || value === 'true'
}
