export const trimText = (value: string): string => {
    return value.trim();
};

export const normalizeSpaces = (value: string): string => {
    return value.trim().replace(/\s+/g, ' ');
};

export const onlyNumbers = (value: string): string => {
    return value.replace(/\D/g, '');
};

export const onlyLettersAndSpaces = (value: string): string => {
    return value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '');
};

export const toUpperText = (value: string): string => {
    return normalizeSpaces(value).toUpperCase();
};
