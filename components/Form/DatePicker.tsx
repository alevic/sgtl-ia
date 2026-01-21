import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DatePickerCalendar } from './DatePickerCalendar';
import { parse, format, isValid } from 'date-fns';

interface DatePickerProps {
    value: string; // YYYY-MM-DD format (native date input format)
    onChange: (value: string) => void;
    label?: string;
    required?: boolean;
    minAge?: number;
    placeholder?: string;
    showIcon?: boolean;
    className?: string;
    containerClassName?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
    value,
    onChange,
    label,
    required = false,
    minAge = 0,
    placeholder = 'DD/MM/AAAA',
    showIcon = true,
    className = '',
    containerClassName = ''
}) => {
    // Convert ISO (YYYY-MM-DD) to Display (DD/MM/YYYY)
    const formatToDisplay = (isoDate: string) => {
        if (!isoDate) return '';
        const parts = isoDate.split('-');
        if (parts.length !== 3) return isoDate;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    const [displayValue, setDisplayValue] = useState(formatToDisplay(value));
    const [error, setError] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initial date object for Calendar
    const getCalendarDate = (isoDate: string) => {
        if (!isoDate) return undefined;
        const d = new Date(isoDate + 'T12:00:00'); // Midday to avoid timezone issues
        return isValid(d) ? d : undefined;
    };

    // Update display if value prop changes externally
    useEffect(() => {
        setDisplayValue(formatToDisplay(value));
    }, [value]);

    // Handle click outside to close calendar
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowCalendar(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCalendarSelect = (date: Date | undefined) => {
        if (date) {
            const iso = format(date, 'yyyy-MM-dd');
            onChange(iso);
            setDisplayValue(format(date, 'dd/MM/yyyy'));
            setError(false);
            setShowCalendar(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let input = e.target.value.replace(/\D/g, ''); // Remove non-digits

        // Masking logic: DD/MM/YYYY
        if (input.length > 8) input = input.substring(0, 8);

        let formatted = input;
        if (input.length >= 3 && input.length <= 4) {
            formatted = `${input.substring(0, 2)}/${input.substring(2)}`;
        } else if (input.length > 4) {
            formatted = `${input.substring(0, 2)}/${input.substring(2, 4)}/${input.substring(4)}`;
        }

        setDisplayValue(formatted);

        // Validation and Update Logic
        if (input.length === 8) {
            const day = parseInt(input.substring(0, 2));
            const month = parseInt(input.substring(2, 4));
            const year = parseInt(input.substring(4, 8));

            // Basic validation
            if (day > 0 && day <= 31 && month > 0 && month <= 12 && year > 1900 && year < 2100) {
                // Convert back to ISO for parent component
                const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                onChange(isoDate);
                setError(false);
            } else {
                setError(true);
            }
        } else {
            // If incomplete, don't update parent with invalid data, or clear it if empty
            if (input.length === 0 && !required) {
                onChange('');
                setError(false);
            }
        }
    };

    return (
        <div className={`space-y-2 relative ${containerClassName}`} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div className="relative">
                {showIcon && (
                    <button
                        type="button"
                        onClick={() => setShowCalendar(!showCalendar)}
                        className={`absolute left-3 top-1/2 -translate-y-1/2 hover:text-blue-500 transition-colors ${error ? 'text-red-400' : 'text-slate-400'}`}
                    >
                        <CalendarIcon size={18} />
                    </button>
                )}
                <input
                    type="text"
                    inputMode="numeric"
                    value={displayValue}
                    onChange={handleChange}
                    onClick={() => setShowCalendar(true)}
                    placeholder={placeholder}
                    maxLength={10}
                    className={`w-full ${showIcon ? 'pl-10' : 'px-4'} pr-4 py-2 bg-white dark:bg-slate-900 border ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500'} rounded-lg focus:ring-2 outline-none transition-all dark:text-white ${className}`}
                />

                {showCalendar && (
                    <div className="absolute z-[100] top-full left-0 mt-2">
                        <DatePickerCalendar
                            selected={getCalendarDate(value)}
                            onSelect={handleCalendarSelect}
                        />
                    </div>
                )}
            </div>
            {error && <p className="text-xs text-red-500">Data inválida</p>}
        </div>
    );
};

