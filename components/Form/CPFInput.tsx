import React from 'react';
import { CreditCard } from 'lucide-react';

interface CPFInputProps {
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
}

export const CPFInput: React.FC<CPFInputProps> = ({ value, onChange, required = false }) => {
    const formatCPF = (cpf: string): string => {
        const numbers = cpf.replace(/\D/g, '');
        return numbers
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
            .substring(0, 14);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        const numbers = input.replace(/\D/g, '');
        onChange(numbers);
    };

    const validateCPF = (cpf: string): boolean => {
        const numbers = cpf.replace(/\D/g, '');
        if (numbers.length !== 11) return false;

        // Check if all digits are the same
        if (/^(\d)\1+$/.test(numbers)) return false;

        // Validate check digits
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(numbers.charAt(i)) * (10 - i);
        }
        let checkDigit = 11 - (sum % 11);
        if (checkDigit >= 10) checkDigit = 0;
        if (checkDigit !== parseInt(numbers.charAt(9))) return false;

        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(numbers.charAt(i)) * (11 - i);
        }
        checkDigit = 11 - (sum % 11);
        if (checkDigit >= 10) checkDigit = 0;
        if (checkDigit !== parseInt(numbers.charAt(10))) return false;

        return true;
    };

    // Only show validation when field has content
    const isValid = value.length === 0 ? null : (value.length === 11 ? validateCPF(value) : false);

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                CPF {required && <span className="text-red-500">*</span>}
                {!required && <span className="text-xs text-slate-500 ml-1">(opcional)</span>}
            </label>

            <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    value={formatCPF(value)}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white ${isValid === false
                        ? 'border-red-300 dark:border-red-700'
                        : isValid === true
                            ? 'border-green-300 dark:border-green-700'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                    placeholder="000.000.000-00"
                    required={required}
                    maxLength={14}
                />
            </div>

            {isValid === false && (
                <p className="text-xs text-red-600 dark:text-red-400">
                    CPF inválido
                </p>
            )}
        </div>
    );
};
