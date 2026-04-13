/**
 * North American 10-digit phone: formats while typing as xxx-xxx-xxxx.
 * Strips non-digits, keeps up to 10 digits; leading 1 (country code) is dropped if present.
 */

export function digitsFromPhoneInput(value) {
  if (value == null || value === '') return '';
  const d = String(value).replace(/\D/g, '');
  if (d.length >= 11 && d.startsWith('1')) {
    return d.slice(1, 11);
  }
  return d.slice(0, 10);
}

/**
 * @param {string} raw - user input or stored value
 * @returns {string} e.g. "" | "403" | "403-555" | "403-555-0100"
 */
export function formatNorthAmericanPhoneInput(raw) {
  const d = digitsFromPhoneInput(raw);
  if (d.length === 0) return '';
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6, 10)}`;
}
