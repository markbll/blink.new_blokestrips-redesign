// Shared form validation for BlokesTrips — email + Australian mobile numbers.

/** Standard email shape check. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
}

/**
 * Australian MOBILE numbers only:
 *   04XX XXX XXX, +61 4XX XXX XXX, 61 4XX XXX XXX
 * Spaces, dashes and parentheses are ignored.
 */
export function isValidAuMobile(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, '')
  return /^(?:\+?61|0)4\d{8}$/.test(cleaned)
}

export const AU_MOBILE_HINT = 'Australian mobile only, e.g. 0400 000 000'
