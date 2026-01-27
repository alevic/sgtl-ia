
import { format, parseISO } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { useApp } from '../context/AppContext';

export const useDateFormatter = () => {
    const { systemSettings } = useApp();
    const language = systemSettings['system_language'] || 'pt-BR';

    // Map language codes to date-fns locales
    const getLocale = () => {
        switch (language) {
            case 'en-US':
                return enUS;
            case 'es-ES':
                return es;
            case 'pt-BR':
            default:
                return ptBR;
        }
    };

    const formatDate = (date: string | Date | null | undefined, formatStr = 'dd/MM/yyyy') => {
        if (!date) return '-';

        let dateObj: Date;

        if (typeof date === 'string') {
            // Handle ISO strings (e.g. 2023-01-01T00:00:00.000Z)
            // or simple dates (2023-01-01)
            dateObj = parseISO(date);
        } else {
            dateObj = date;
        }

        // Check for invalid dates
        if (isNaN(dateObj.getTime())) return '-';

        try {
            return format(dateObj, formatStr, { locale: getLocale() });
        } catch (error) {
            console.error('Error formatting date:', error);
            return '-';
        }
    };

    const formatDateTime = (date: string | Date | null | undefined) => {
        return formatDate(date, 'dd/MM/yyyy HH:mm');
    };

    return {
        formatDate,
        formatDateTime,
        locale: getLocale()
    };
};
