/**
 * Email Validation Utility
 *
 * Provides robust email validation without sending verification emails.
 *
 * LIMITATIONS:
 * - Format validation checks syntax only, not if mailbox exists
 * - DNS/MX check verifies domain can receive email, NOT that the specific address exists
 * - Some valid but unusual email formats may be rejected (edge cases)
 * - MX check requires network; will pass validation if network fails (fail-open)
 */

// Common email domain typos and their corrections
const DOMAIN_TYPOS = {
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmali.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'outloo.com': 'outlook.com',
  'outlok.com': 'outlook.com',
  'outlook.co': 'outlook.com',
  'yahooo.com': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'iclod.com': 'icloud.com',
  'icloud.co': 'icloud.com',
  'protonmai.com': 'protonmail.com',
  'protonmal.com': 'protonmail.com',
};

// Valid TLDs - common ones (not exhaustive, but covers 99% of cases)
const COMMON_TLDS = [
  'com', 'org', 'net', 'edu', 'gov', 'mil', 'co', 'io', 'ai', 'app',
  'dev', 'me', 'info', 'biz', 'us', 'uk', 'ca', 'au', 'de', 'fr',
  'es', 'it', 'nl', 'br', 'mx', 'jp', 'cn', 'in', 'ru', 'pl',
  'se', 'no', 'fi', 'dk', 'be', 'ch', 'at', 'nz', 'ie', 'pt',
  'cz', 'gr', 'hu', 'ro', 'sk', 'bg', 'hr', 'si', 'lt', 'lv',
  'ee', 'is', 'lu', 'mt', 'cy', 'cloud', 'online', 'store', 'tech',
  'site', 'website', 'space', 'live', 'email', 'mail', 'pro',
];

/**
 * Validates email format using comprehensive rules
 * @param {string} email - Email address to validate
 * @returns {{ valid: boolean, error?: string, suggestion?: string }}
 */
export function validateEmailFormat(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Please enter an email address.' };
  }

  const trimmedEmail = email.trim().toLowerCase();

  // Check basic structure
  if (!trimmedEmail.includes('@')) {
    return { valid: false, error: 'Email must contain @.' };
  }

  const parts = trimmedEmail.split('@');
  if (parts.length !== 2) {
    return { valid: false, error: 'Email must contain exactly one @.' };
  }

  const [localPart, domain] = parts;

  // Validate local part (before @)
  if (!localPart || localPart.length === 0) {
    return { valid: false, error: 'Email is missing the part before @.' };
  }

  if (localPart.length > 64) {
    return { valid: false, error: 'Email local part is too long.' };
  }

  // Check for invalid local part patterns
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return { valid: false, error: 'Email cannot start or end with a dot.' };
  }

  if (localPart.includes('..')) {
    return { valid: false, error: 'Email cannot contain consecutive dots.' };
  }

  // Local part character validation (RFC 5321 compliant)
  const localPartRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
  if (!localPartRegex.test(localPart)) {
    return { valid: false, error: 'Email contains invalid characters.' };
  }

  // Validate domain (after @)
  if (!domain || domain.length === 0) {
    return { valid: false, error: 'Email is missing the domain.' };
  }

  if (domain.length > 255) {
    return { valid: false, error: 'Email domain is too long.' };
  }

  // Check for domain typos
  if (DOMAIN_TYPOS[domain]) {
    return {
      valid: false,
      error: `Did you mean ${DOMAIN_TYPOS[domain]}?`,
      suggestion: `${localPart}@${DOMAIN_TYPOS[domain]}`,
    };
  }

  // Domain must have at least one dot
  if (!domain.includes('.')) {
    return { valid: false, error: 'Email domain must include a dot (e.g., .com).' };
  }

  // Validate domain format
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];

  // TLD must be at least 2 characters
  if (tld.length < 2) {
    return { valid: false, error: 'Email has an invalid domain extension.' };
  }

  // Check each domain part
  for (const part of domainParts) {
    if (!part || part.length === 0) {
      return { valid: false, error: 'Email domain is malformed.' };
    }
    if (part.startsWith('-') || part.endsWith('-')) {
      return { valid: false, error: 'Email domain parts cannot start or end with a hyphen.' };
    }
    if (!/^[a-zA-Z0-9-]+$/.test(part)) {
      return { valid: false, error: 'Email domain contains invalid characters.' };
    }
  }

  // Final comprehensive regex check
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(trimmedEmail)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }

  return { valid: true };
}

/**
 * Validates that the email domain has valid DNS records
 * Uses a public DNS API to check if domain exists
 *
 * NOTE: This only verifies the DOMAIN can receive email, not the specific mailbox.
 * A domain like gmail.com will pass, but fakeemail123@gmail.com will also pass.
 *
 * @param {string} email - Email address to validate
 * @param {number} timeout - Timeout in ms (default 5000)
 * @returns {Promise<{ valid: boolean, error?: string }>}
 */
export async function validateEmailDomain(email, timeout = 5000) {
  try {
    const domain = email.split('@')[1];
    if (!domain) {
      return { valid: false, error: 'Invalid email format.' };
    }

    // Use DNS-over-HTTPS to check MX records
    // This is a lightweight check that works in React Native
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(
      `https://dns.google/resolve?name=${domain}&type=MX`,
      {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Network issue - fail open (allow the email)
      return { valid: true };
    }

    const data = await response.json();

    // Status 0 = NOERROR (domain exists)
    // Status 3 = NXDOMAIN (domain doesn't exist)
    if (data.Status === 3) {
      return { valid: false, error: 'This email domain does not exist.' };
    }

    // Check if domain has MX records (can receive email)
    if (data.Status === 0 && (!data.Answer || data.Answer.length === 0)) {
      // No MX records - check for A record as fallback
      const aRecordResponse = await fetch(
        `https://dns.google/resolve?name=${domain}&type=A`,
        { headers: { 'Accept': 'application/json' } }
      );
      const aData = await aRecordResponse.json();

      if (aData.Status === 0 && aData.Answer && aData.Answer.length > 0) {
        // Has A record but no MX - might still accept email
        return { valid: true };
      }

      return { valid: false, error: 'This email domain cannot receive emails.' };
    }

    return { valid: true };

  } catch (error) {
    // Fail open - if we can't check, allow the email
    return { valid: true };
  }
}

/**
 * Full email validation - format + optional domain check
 * @param {string} email - Email to validate
 * @param {boolean} checkDomain - Whether to perform DNS check (adds latency)
 * @returns {Promise<{ valid: boolean, error?: string, suggestion?: string }>}
 */
export async function validateEmail(email, checkDomain = true) {
  // First, validate format
  const formatResult = validateEmailFormat(email);
  if (!formatResult.valid) {
    return formatResult;
  }

  // Then, optionally validate domain
  if (checkDomain) {
    const domainResult = await validateEmailDomain(email);
    if (!domainResult.valid) {
      return domainResult;
    }
  }

  return { valid: true };
}
