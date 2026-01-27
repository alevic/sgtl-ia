import React, { useState } from 'react';
import { Phone, ChevronDown } from 'lucide-react';

interface Country {
    code: string;
    flag: string;
    name: string;
    mask: string;
}

interface PhoneInputProps {
    value: string;
    onChange: (value: string) => void;
    countryCode: string;
    onCountryCodeChange: (code: string) => void;
    required?: boolean;
    showLabel?: boolean;
}

const COUNTRIES: Country[] = [
    { code: '+55', flag: '🇧🇷', name: 'Brasil', mask: '(99) 99999-9999' },
    { code: '+1', flag: '🇺🇸', name: 'EUA', mask: '(999) 999-9999' },
    { code: '+351', flag: '🇵🇹', name: 'Portugal', mask: '999 999 999' },
    { code: '+34', flag: '🇪🇸', name: 'Espanha', mask: '999 999 999' },
    { code: '+39', flag: '🇮🇹', name: 'Itália', mask: '999 999 9999' },
    { code: '+33', flag: '🇫🇷', name: 'França', mask: '9 99 99 99 99' },
    { code: '+49', flag: '🇩🇪', name: 'Alemanha', mask: '9999 9999999' },
    { code: '+44', flag: '🇬🇧', name: 'Reino Unido', mask: '9999 999999' },
    { code: '+54', flag: '🇦🇷', name: 'Argentina', mask: '9 9999-9999' },
    { code: '+52', flag: '🇲🇽', name: 'México', mask: '999 999 9999' },
];

export const PhoneInput: React.FC<PhoneInputProps> = ({
    value,
    onChange,
    countryCode,
    onCountryCodeChange,
    required = true,
    showLabel = true
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];

    const formatPhone = (phone: string, mask: string): string => {
        const numbers = phone.replace(/\D/g, '');
        let formatted = '';
        let numberIndex = 0;

        for (let i = 0; i < mask.length && numberIndex < numbers.length; i++) {
            if (mask[i] === '9') {
                formatted += numbers[numberIndex];
                numberIndex++;
            } else {
                formatted += mask[i];
            }
        }

        return formatted;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        const numbers = input.replace(/\D/g, '');
        onChange(numbers);
    };

    const handleCountrySelect = (country: Country) => {
        onCountryCodeChange(country.code);
        setIsOpen(false);
    };

    return (
        <div className="space-y-2">
            {showLabel && (
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Telefone {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div className="flex gap-2">
                {/* Country Selector */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className="h-14 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 min-w-[100px]"
                    >
                        <span className="text-xl">{selectedCountry.flag}</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">{selectedCountry.code}</span>
                        <ChevronDown size={16} className="text-slate-400" />
                    </button>

                    {isOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setIsOpen(false)}
                            />
                            <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm shadow-lg z-20 max-h-80 overflow-y-auto">
                                {COUNTRIES.map((country) => (
                                    <button
                                        key={country.code}
                                        type="button"
                                        onClick={() => handleCountrySelect(country)}
                                        className="w-full px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 text-left"
                                    >
                                        <span className="text-xl">{country.flag}</span>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                                {country.name}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                                {country.code}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Phone Input */}
                <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="tel"
                        value={formatPhone(value, selectedCountry.mask)}
                        onChange={handlePhoneChange}
                        className="w-full h-14 pl-10 pr-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        placeholder={selectedCountry.mask.replace(/9/g, '0')}
                        required={required}
                    />
                </div>
            </div>

            <p className="text-xs text-slate-500">
                Formato: {selectedCountry.code} {selectedCountry.mask.replace(/9/g, '0')}
            </p>
        </div>
    );
};
