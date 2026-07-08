// Google reCAPTCHA v3 — invisible, score-based anti-spam.
// The script loads lazily on first use so it never slows initial page load.
// Server-side verification lives in the PHP backend (Recaptcha.php); when the
// backend has recaptcha.enabled=false the token is simply ignored, so this is
// always safe to call.

const SITE_KEY = '6LdeXDYtAAAAAIIzTxTQCbj0_D3n-O29r8qmhcDT'

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void
      execute: (siteKey: string, opts: { action: string }) => Promise<string>
    }
  }
}

let loadPromise: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (window.grecaptcha) return Promise.resolve()
  if (loadPromise) return loadPromise
  loadPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => { loadPromise = null; reject(new Error('recaptcha script failed')) }
    document.head.appendChild(s)
  })
  return loadPromise
}

/**
 * Get a reCAPTCHA v3 token for the given action.
 * Never throws — returns '' on any failure so forms still submit
 * (the backend decides how strictly to enforce).
 */
export async function getRecaptchaToken(action: string): Promise<string> {
  try {
    await loadScript()
    if (!window.grecaptcha) return ''
    await new Promise<void>(resolve => window.grecaptcha!.ready(resolve))
    return await window.grecaptcha.execute(SITE_KEY, { action })
  } catch {
    return ''
  }
}
