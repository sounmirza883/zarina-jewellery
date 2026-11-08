/** Only same-site paths are allowed as a post-login redirect target (blocks open redirects). */
export function safeNext(value: string | null | undefined, fallback = '/account'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  // Browsers strip tabs/newlines inside URLs, so "/\t/evil.com" would become "//evil.com".
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;
  return value;
}
