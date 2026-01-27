
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
            dateObj = parseISO(date);
        } else {
            dateObj = date;
        }

        if (isNaN(dateObj.getTime())) return '-';

        try {
            const systemTimezone = systemSettings['system_timezone'];
            let finalDate = dateObj;

            if (systemTimezone) {
                try {
                    // Create a date shifted to the target timezone so date-fns format() 
                    // outputs the "local" time of that timezone
                    const formatter = new Intl.DateTimeFormat('en-US', {
                        timeZone: systemTimezone,
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                        hour12: false
                    });

                    const parts = formatter.formatToParts(dateObj);
                    const map: Record<string, string> = {};
                    parts.forEach(p => map[p.type] = p.value);

                    // Reconstruct date object in "local" time of target timezone
                    finalDate = new Date(
                        parseInt(map.year),
                        parseInt(map.month) - 1,
                        parseInt(map.day),
                        parseInt(map.hour),
                        parseInt(map.minute),
                        parseInt(map.second)
                    );
                } catch (tzError) {
                    console.error('Invalid timezone:', systemTimezone);
                }
            }

            return format(finalDate, formatStr, { locale: getLocale() });
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
