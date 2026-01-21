import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimePickerProps {
    value: string; // HH:MM format
    onChange: (value: string) => void;
    label?: string;
    required?: boolean;
    placeholder?: string;
    showIcon?: boolean;
    className?: string;
    containerClassName?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
    value,
    onChange,
    label,
    required = false,
    placeholder = 'HH:MM',
    showIcon = true,
    className = '',
    containerClassName = ''
}) => {
    const [displayValue, setDisplayValue] = useState(value || '');
    const [error, setError] = useState(false);

    useEffect(() => {
        setDisplayValue(value || '');
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let input = e.target.value.replace(/\D/g, ''); // Remove non-digits

        if (input.length > 4) input = input.substring(0, 4);

        let formatted = input;
        if (input.length >= 3) {
            formatted = `${input.substring(0, 2)}:${input.substring(2)}`;
        }

        setDisplayValue(formatted);

        // Validation logic
        if (input.length === 4) {
            const hours = parseInt(input.substring(0, 2));
            const minutes = parseInt(input.substring(2, 4));

            if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
                const finalValue = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                onChange(finalValue);
                setError(false);
            } else {
                setError(true);
            }
        } else if (input.length === 0) {
            if (!required) {
                onChange('');
                setError(false);
            }
        }
    };

    return (
        <div className={`space-y-1 ${containerClassName}`}>
            {label && (
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div className="relative">
                {showIcon && (
                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${error ? 'text-red-400' : 'text-slate-400'}`}>
                        <Clock size={18} />
                    </div>
                )}
                <input
                    type="text"
                    inputMode="numeric"
                    value={displayValue}
                    onChange={handleChange}
                    placeholder={placeholder}
                    maxLength={5}
                    className={`w-full ${showIcon ? 'pl-10' : 'px-4'} pr-4 py-2 bg-white dark:bg-slate-900 border ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500'} rounded-lg focus:ring-2 outline-none transition-all dark:text-white ${className}`}
                />
            </div>
            {error && <p className="text-xs text-red-500 mt-1">Hora inválida (00:00 - 23:59)</p>}
        </div>
    );
};
