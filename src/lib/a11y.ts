import type { KeyboardEvent } from 'react'

/**
 * onKeyDown handler that activates a control on Enter/Space — so an icon button
 * rendered as a <div role="button" tabIndex={0}> works for keyboard users.
 */
export function onActivate(fn: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      fn()
    }
  }
}
