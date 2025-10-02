export function sanitizeHtml(input: string): string {
    if (typeof input !== 'string') {
        return '';
    }

    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

export function sanitizeUsername(username: string): string | null {
    if (typeof username !== 'string') {
        return null;
    }
    const trimmed = username.trim();
    if (trimmed.length > 15) {
        return null;
    }
    if (trimmed.length === 0) {
        return null;
    }
    const validChars = /^[a-zA-Z0-9_-]+$/;
    if (!validChars.test(trimmed)) {
        return null;
    }
    return trimmed;
}

export function sanitizeAlias(alias: string): string | null {
    if (typeof alias !== 'string') {
        return null;
    }

    const htmlSafe = sanitizeHtml(alias);
    const trimmed = htmlSafe.trim();

    if (trimmed.length > 15) {
        return null;
    }
    if (trimmed.length === 0) {
        return null;
    }
    const validChars = /^[a-zA-Z0-9 _-]+$/;
    if (!validChars.test(trimmed)) {
        return null;
    }
    return trimmed;
}

export function sanitizeBio(bio: string): string | null {
    if (typeof bio !== 'string') {
        return null;
    }
    
    const htmlSafe = sanitizeHtml(bio);
    const trimmed = htmlSafe.trim();
    
    if (trimmed.length > 50) {
        return null;
    }
    
    const validChars = /^[a-zA-Z0-9 _\-.,!?'"():;]*$/;
    if (!validChars.test(trimmed)) {
        return null;
    }
    
    return trimmed;
}