const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PERSON_NAME_PATTERN = /^[A-Za-zÀ-ſÑñ\s.'-]+$/;

export const isRequired = (value: string | number | null | undefined): boolean => {
    if (value === null || value === undefined) return false;
    return String(value).trim().length > 0;
};

export const onlyDigits = (value: string) => value.replace(/\D/g, '');

export const isValidEmail = (value: string) => EMAIL_PATTERN.test(value.trim().toLowerCase());

export const isOnlyLettersAndSpaces = (value: string): boolean => {
    return /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(value.trim());
};

export const isValidPersonName = (value: string, min = 2, max = 80) => {
    const text = value.trim();
    return text.length >= min && text.length <= max && PERSON_NAME_PATTERN.test(text);
};

export const isStrongPassword = (value: string) => (
    value.length >= 8 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value)
);

export const hasValidLength = (value: string, min: number, max: number): boolean => {
    const length = value.trim().length;
    return length >= min && length <= max;
};

export const isOnlyNumbers = (value: string): boolean => {
    return /^\d+$/.test(value);
};

export const hasRepeatedDigits = (value: string) => {
    const digits = onlyDigits(value);
    return digits.length >= 6 && /^(\d)\1+$/.test(digits);
};

export const isValidPhone = (value: string, min = 7, max = 15) => {
    const digits = onlyDigits(value);

    if (!digits) return true;

    return digits.length >= min && digits.length <= max && !hasRepeatedDigits(digits);
};

export const isValidDocumentNumber = (value: string): boolean => {
    const digits = onlyDigits(value);
    return digits.length >= 8 && digits.length <= 12 && !hasRepeatedDigits(digits);
};

export const isPositiveNumber = (value: number): boolean => {
    return !Number.isNaN(value) && value > 0;
};

export const isValidPercentage = (value: number, min = 0, max = 100): boolean => {
    return !Number.isNaN(value) && value >= min && value <= max;
};

export const isValidHttpUrl = (value: string) => {
    const text = value.trim();

    if (!text) return true;

    try {
        const url = new URL(text);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};

export const isValidImageFile = (file: File, maxSizeMb = 5) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    return allowedTypes.includes(file.type) && file.size <= maxSizeMb * 1024 * 1024;
};
