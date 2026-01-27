import { pool } from '../config';

/**
 * Generate username suggestions based on a name
 */
export function generateUsernameSuggestions(name: string): string[] {
    // Clean and normalize name
    const cleanName = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z\s]/g, '') // Remove special chars
        .trim();

    const parts = cleanName.split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts[parts.length - 1] || '';
    const initials = parts.map(p => p[0]).join('');

    const suggestions: string[] = [];

    // Strategy 1: firstname.lastname
    if (firstName && lastName && firstName !== lastName) {
        suggestions.push(`${firstName}.${lastName}`);
    }

    // Strategy 2: firstnamelastname
    if (firstName && lastName && firstName !== lastName) {
        suggestions.push(`${firstName}${lastName}`);
    }

    // Strategy 3: firstname + initials
    if (firstName && initials.length > 1) {
        suggestions.push(`${firstName}.${initials.slice(1)}`);
    }

    // Strategy 4: initials + lastname
    if (initials.length > 1 && lastName) {
        suggestions.push(`${initials.slice(0, -1)}.${lastName}`);
    }

    // Strategy 5: just firstname
    if (firstName) {
        suggestions.push(firstName);
    }

    // Remove duplicates and limit to 5
    return [...new Set(suggestions)].slice(0, 5);
}

/**
 * Check if username is available
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
    try {
        const result = await pool.query(
            'SELECT id FROM "user" WHERE LOWER(username) = LOWER($1)',
            [username]
        );
        return result.rows.length === 0;
    } catch (error) {
        console.error('Error checking username availability:', error);
        throw error;
    }
}

/**
 * Generate available username suggestions
 */
export async function generateAvailableUsernames(name: string): Promise<string[]> {
    const baseSuggestions = generateUsernameSuggestions(name);
    const availableSuggestions: string[] = [];

    // Check each base suggestion
    for (const suggestion of baseSuggestions) {
        if (await isUsernameAvailable(suggestion)) {
            availableSuggestions.push(suggestion);
        } else {
            // Try with numbers if base is taken
            for (let i = 2; i <= 99; i++) {
                const numbered = `${suggestion}${i}`;
                if (await isUsernameAvailable(numbered)) {
                    availableSuggestions.push(numbered);
                    break;
                }
            }
        }

        // Stop when we have 3 suggestions
        if (availableSuggestions.length >= 3) {
            break;
        }
    }

    return availableSuggestions.slice(0, 3);
}

/**
 * Validate username format
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
    if (!username || username.length < 3) {
        return { valid: false, error: 'Username deve ter no mínimo 3 caracteres' };
    }

    if (username.length > 30) {
        return { valid: false, error: 'Username deve ter no máximo 30 caracteres' };
    }

    // Only allow letters, numbers, dots, and underscores
    if (!/^[a-zA-Z0-9._]+$/.test(username)) {
        return { valid: false, error: 'Username pode conter apenas letras, números, pontos e underscores' };
    }

    // Must start with a letter
    if (!/^[a-zA-Z]/.test(username)) {
        return { valid: false, error: 'Username deve começar com uma letra' };
    }

    // Cannot end with dot or underscore
    if (/[._]$/.test(username)) {
        return { valid: false, error: 'Username não pode terminar com ponto ou underscore' };
    }

    // Cannot have consecutive dots or underscores
    if (/[._]{2,}/.test(username)) {
        return { valid: false, error: 'Username não pode ter pontos ou underscores consecutivos' };
    }

    return { valid: true };
}
