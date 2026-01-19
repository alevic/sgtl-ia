import React from 'react';
import { Calendar } from 'lucide-react';

interface DatePickerProps {
    value: string; // YYYY-MM-DD format (native date input format)
    onChange: (value: string) => void;
    label?: string;
    required?: boolean;
    minAge?: number;
    placeholder?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
    value,
    onChange,
    label = 'Data',
    required = false,
    minAge = 0,
    placeholder = 'DD/MM/AAAA'
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log('📅 DatePicker onChange:', e.target.value);
        onChange(e.target.value); // Already in YYYY-MM-DD format
    };

    console.log('📅 DatePicker rendering with value:', value);

    // Calculate max date based on minimum age
    const getMaxDate = (): string => {
        if (minAge === 0) {
            return new Date().toISOString().split('T')[0];
        }
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() - minAge);
        return maxDate.toISOString().split('T')[0];
    };

    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {label} {required && <span className="text-red-500">*</span>}
                    {!required && <span className="text-xs text-slate-500 ml-1">(opcional)</span>}
                </label>
            )}

            <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                <input
                    type="date"
                    value={value}
                    onChange={handleChange}
                    max={getMaxDate()}
                    required={required}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white dark:[color-scheme:dark]"
                />
            </div>
        </div>
    );
};
