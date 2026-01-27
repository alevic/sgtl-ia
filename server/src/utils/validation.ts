/**
 * Validates if a string is in ISO Date format (YYYY-MM-DD) and represents a valid calendar date.
 * Catching cases like 2026-02-30.
 */
export const isValidDateISO = (dateStr: string | null | undefined): boolean => {
    if (!dateStr) return true; // Let nulls/empty pass if optional at schema level

    // Check basic format
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;

    // Parse components
    const [year, month, day] = dateStr.split('-').map(Number);

    // Use Date object for existence check
    const date = new Date(year, month - 1, day);

    // Verify that the date didn't overflow (e.g., Feb 30 -> Mar 02)
    return date.getFullYear() === year &&
        (date.getMonth() + 1) === month &&
        date.getDate() === day;
};
