import { describe, expect, it } from 'vitest'
import { isDevPanelRequested } from './devPanelAccess'

describe('isDevPanelRequested', () => {
  it.each(['?devpanel', '?devpanel=1', '?devpanel=true'])('enables the panel for %s', (search) => {
    expect(isDevPanelRequested(search)).toBe(true)
  })

  it.each(['', '?devpanel=0', '?devpanel=false'])('does not enable the panel for %s', (search) => {
    expect(isDevPanelRequested(search)).toBe(false)
  })
})
