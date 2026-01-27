import React from 'react';
import { Calendar } from 'lucide-react';

interface DateInputProps {
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    label?: string;
    minAge?: number;
    showLabel?: boolean;
}

export const DateInput: React.FC<DateInputProps> = ({
    value,
    onChange,
    required = false,
    label = 'Data de Nascimento',
    minAge = 18,
    showLabel = true
}) => {
    const formatDate = (date: string): string => {
        const numbers = date.replace(/\D/g, '');
        return numbers
            .replace(/(\d{2})(\d)/, '$1/$2')
            .replace(/(\d{2})(\d)/, '$1/$2')
            .substring(0, 10);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        const numbers = input.replace(/\D/g, '');
        onChange(numbers);
    };

    const validateDate = (dateStr: string): { valid: boolean; error?: string } => {
        const numbers = dateStr.replace(/\D/g, '');
        if (numbers.length !== 8) return { valid: false };

        const day = parseInt(numbers.substring(0, 2));
        const month = parseInt(numbers.substring(2, 4));
        const year = parseInt(numbers.substring(4, 8));

        // Create Date object - month is 0-indexed
        const date = new Date(year, month - 1, day);

        // Check if date components match (detects overflow like Feb 30 -> Mar 02)
        if (date.getDate() !== day || (date.getMonth() + 1) !== month || date.getFullYear() !== year) {
            return { valid: false, error: 'Data inválida' };
        }

        if (year < 1900 || year > new Date().getFullYear() + 100) return { valid: false, error: 'Ano inválido' };

        // Check minimum age
        if (minAge) {
            const today = new Date();
            const age = today.getFullYear() - date.getFullYear();
            const monthDiff = today.getMonth() - date.getMonth();
            const dayDiff = today.getDate() - date.getDate();

            const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

            if (actualAge < minAge) {
                return { valid: false, error: `Idade mínima: ${minAge} anos` };
            }
        }

        return { valid: true };
    };

    const validation = value.length === 8 ? validateDate(value) : { valid: true };

    return (
        <div className="space-y-2">
            {showLabel && (
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {label} {required && <span className="text-red-500">*</span>}
                    {!required && <span className="text-xs text-slate-500 ml-1">(opcional)</span>}
                </label>
            )}

            <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    value={formatDate(value)}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 h-14 bg-slate-50 dark:bg-slate-900 border rounded-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white ${!validation.valid
                        ? 'border-red-300 dark:border-red-700'
                        : value.length === 8
                            ? 'border-green-300 dark:border-green-700'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                    placeholder="DD/MM/AAAA"
                    required={required}
                    maxLength={10}
                />
            </div>

            {validation.error && (
                <p className="text-xs text-red-600 dark:text-red-400">
                    {validation.error}
                </p>
            )}
        </div>
    );
};
