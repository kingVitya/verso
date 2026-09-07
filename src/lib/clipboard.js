/**
 * Robust clipboard copy helper with fallbacks for non-secure contexts (HTTP / LAN IPs).
 */
export async function copyToClipboard(text) {
  // 1. Try modern Async Clipboard API (works on localhost and HTTPS)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.warn('navigator.clipboard.writeText failed, trying fallback:', err)
    }
  }

  // 2. Fallback using invisible textarea and execCommand (works on HTTP over LAN)
  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    textArea.style.top = '-9999px'
    textArea.style.opacity = '0'
    textArea.setAttribute('readonly', '')
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    return !!successful
  } catch (err) {
    console.warn('execCommand copy failed:', err)
  }

  return false
}
