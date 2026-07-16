const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const pad2 = (value: number) => String(value).padStart(2, '0');

export const todayDateOnly = () => {
    const today = new Date();
    return `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
};

export const isValidDateOnly = (value: string) => {
    if (!DATE_ONLY_PATTERN.test(value)) return false;

    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
};

export const isDateNotAbsurd = (
    value: string,
    { minYear = 2000, maxFutureYears = 3 } = {}
) => {
    if (!isValidDateOnly(value)) return false;

    const year = Number(value.slice(0, 4));
    const maxYear = new Date().getFullYear() + maxFutureYears;

    return year >= minYear && year <= maxYear;
};

export const diffDays = (start: string, end: string) => {
    if (!isValidDateOnly(start) || !isValidDateOnly(end)) return null;

    const startDate = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);

    return Math.round((endDate.getTime() - startDate.getTime()) / 86400000);
};

export const validateDateRange = ({
    start,
    end,
    allowSameDay = false,
    allowPast = false,
    maxDays,
    maxFutureYears = 3
}: {
    start: string;
    end: string;
    allowSameDay?: boolean;
    allowPast?: boolean;
    maxDays?: number;
    maxFutureYears?: number;
}) => {
    if (!isValidDateOnly(start) || !isValidDateOnly(end)) {
        return 'Las fechas deben tener formato válido.';
    }

    if (
        !isDateNotAbsurd(start, { maxFutureYears }) ||
        !isDateNotAbsurd(end, { maxFutureYears })
    ) {
        return 'Las fechas están fuera del rango permitido.';
    }

    const today = todayDateOnly();

    if (!allowPast && (start < today || end < today)) {
        return 'No se permiten fechas pasadas.';
    }

    if (allowSameDay ? end < start : end <= start) {
        return allowSameDay
            ? 'La fecha de fin no puede ser menor que la fecha de inicio.'
            : 'La fecha de fin debe ser mayor que la fecha de inicio.';
    }

    const days = diffDays(start, end);

    if (typeof maxDays === 'number' && days !== null && days > maxDays) {
        return `El rango de fechas no debe superar ${maxDays} días.`;
    }

    return '';
};
