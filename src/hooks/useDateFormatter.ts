
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

        try {
            if (typeof date === 'string') {
                const cleanDate = date.trim();

                // If it's a pure UTC midnight date (e.g. 2026-01-30T00:00:00.000Z), 
                // we often want to display exactly that day regardless of local TZ offset.
                // A safe way is to replace the time part or add enough hours to stay in the same day.
                let modifiedDate = cleanDate;
                if (cleanDate.includes('T00:00:00')) {
                    dateObj = parseISO(cleanDate);
                    // Add 12 hours to be safely in the middle of the intended day for any TZ
                    dateObj.setHours(dateObj.getHours() + 12);
                } else {
                    dateObj = parseISO(cleanDate);
                    if (isNaN(dateObj.getTime())) {
                        dateObj = new Date(cleanDate);
                    }
                }
            } else if (date instanceof Date) {
                dateObj = date;
            } else {
                return '-';
            }

            if (isNaN(dateObj.getTime())) return '-';

            const systemTimezone = systemSettings['system_timezone'];
            let finalDate = dateObj;

            // SAFE TIMEZONE HANDLING
            if (systemTimezone && systemTimezone.trim() && systemTimezone !== 'UTC') {
                try {
                    const options: Intl.DateTimeFormatOptions = {
                        timeZone: systemTimezone,
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                        hour12: false
                    };

                    const formatter = new Intl.DateTimeFormat('en-US', options);
                    const parts = formatter.formatToParts(dateObj);
                    const map: Record<string, string> = {};
                    parts.forEach(p => map[p.type] = p.value);

                    const y = parseInt(map.year);
                    const m = parseInt(map.month);
                    const d = parseInt(map.day);
                    const h = parseInt(map.hour || '0');
                    const min = parseInt(map.minute || '0');
                    const s = parseInt(map.second || '0');

                    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
                        finalDate = new Date(y, m - 1, d, h, min, s);
                    }
                } catch (tzError) {
                    // Fallback
                }
            }

            return format(finalDate, formatStr, { locale: getLocale() });
        } catch (error) {
            console.error('Error formatting date:', error);
            try {
                const legacyDate = new Date(date as any);
                if (!isNaN(legacyDate.getTime())) {
                    const day = String(legacyDate.getDate()).padStart(2, '0');
                    const month = String(legacyDate.getMonth() + 1).padStart(2, '0');
                    const year = legacyDate.getFullYear();
                    return `${day}/${month}/${year}`;
                }
            } catch (e) { }
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
