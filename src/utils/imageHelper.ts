/**
 * Helper to safely extract, parse, normalize, and validate image URLs
 * Supports local relative URLs (/uploads/...), remote URLs (Supabase/HTTPS),
 * base64 data URLs, and JSON stringified arrays.
 * Strips dead/expired blob: URLs and empty JSON string representations ("[]").
 */

export function parseImageUrls(raw: any): string[] {
  if (!raw) return [];

  // If already an array
  if (Array.isArray(raw)) {
    const list: string[] = [];
    for (const item of raw) {
      if (!item) continue;
      if (typeof item === 'string') {
        const trimmed = item.trim();
        // If string contains nested JSON array like '["/uploads/..."]'
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          try {
            const parsed = JSON.parse(trimmed);
            list.push(...parseImageUrls(parsed));
            continue;
          } catch (_) {}
        }
        if (isValidImageUrl(trimmed)) {
          list.push(trimmed);
        }
      } else if (typeof item === 'object') {
        const candidate = item.url || item.file_url || item.path || item.src || '';
        if (typeof candidate === 'string' && isValidImageUrl(candidate)) {
          list.push(candidate.trim());
        }
      }
    }
    return Array.from(new Set(list));
  }

  // If string
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === '[]' || trimmed === '""' || trimmed === "''") {
      return [];
    }
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        return parseImageUrls(parsed);
      } catch (_) {
        // Fallback for malformed array string e.g. ["/uploads/..."] without valid quotes
        const cleaned = trimmed.replace(/[\[\]"]/g, '').split(',').map(s => s.trim());
        return cleaned.filter(isValidImageUrl);
      }
    }
    if (isValidImageUrl(trimmed)) {
      return [trimmed];
    }
  }

  // If object with url/path
  if (typeof raw === 'object') {
    const candidate = raw.url || raw.file_url || raw.path || raw.src || '';
    if (typeof candidate === 'string' && isValidImageUrl(candidate)) {
      return [candidate.trim()];
    }
  }

  return [];
}

/**
 * Checks if a string is a valid non-blob, non-empty image URL or path
 */
export function isValidImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === '[]' || trimmed === 'null' || trimmed === 'undefined') return false;
  // Ignore expired blob URLs from previous browser sessions
  if (trimmed.startsWith('blob:')) return false;
  // Valid if relative uploads path, http/https URL, or inline base64 image
  return (
    trimmed.startsWith('/uploads/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('/')
  );
}

/**
 * Normalizes an image source:
 * Ensures correct path formatting for local uploads
 */
export function normalizeImageUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  // Ensure leading slash for local relative paths
  if (!trimmed.startsWith('/')) {
    return `/${trimmed}`;
  }
  return trimmed;
}
