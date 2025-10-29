/**
 * UUID validation utility
 * Uses regex pattern to validate UUID v4 format
 */

export const isUuid = (str: string): boolean => {
    if (!str || typeof str !== 'string') {
        return false;
    }
    
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
};
