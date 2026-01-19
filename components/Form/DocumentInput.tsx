import React from 'react';
import { CreditCard } from 'lucide-react';
import { TipoDocumento } from '../../types';

interface DocumentInputProps {
    documentType: TipoDocumento;
    documentNumber: string;
    onTypeChange: (type: TipoDocumento) => void;
    onNumberChange: (number: string) => void;
    required?: boolean;
    disabled?: boolean;
    label?: string;
}

export const DocumentInput: React.FC<DocumentInputProps> = ({
    documentType,
    documentNumber,
    onTypeChange,
    onNumberChange,
    required = false,
    disabled = false,
    label = 'Documento'
}) => {
    const getPlaceholder = () => {
        switch (documentType) {
            case TipoDocumento.CPF:
                return '000.000.000-00';
            case TipoDocumento.RG:
                return 'Ex: 12.345.678-9';
            case TipoDocumento.CNH:
                return '00000000000';
            case TipoDocumento.PASSAPORTE:
                return 'Ex: AB123456';
            case TipoDocumento.RNE:
                return 'Ex: V123456-7';
            case TipoDocumento.CNPJ:
                return '00.000.000/0000-00';
            default:
                return 'Número do documento';
        }
    };

    const formatCPF = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 11) {
            return numbers
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        }
        return numbers.slice(0, 11);
    };

    const formatCNPJ = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 14) {
            return numbers
                .replace(/(\d{2})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1/$2')
                .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
        }
        return numbers.slice(0, 14);
    };

    const formatRG = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 9) {
            return numbers
                .replace(/(\d{2})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1})$/, '$1-$2');
        }
        return numbers.slice(0, 9);
    };

    const formatDocument = (value: string) => {
        switch (documentType) {
            case TipoDocumento.CPF:
                return formatCPF(value);
            case TipoDocumento.CNPJ:
                return formatCNPJ(value);
            case TipoDocumento.RG:
                return formatRG(value);
            case TipoDocumento.CNH:
                // CNH: apenas números, 11 dígitos
                return value.replace(/\D/g, '').slice(0, 11);
            case TipoDocumento.PASSAPORTE:
                // Passaporte: alfanumérico, uppercase
                return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 9);
            case TipoDocumento.RNE:
                // RNE: alfanumérico
                return value.toUpperCase().slice(0, 15);
            default:
                return value.slice(0, 30);
        }
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatDocument(e.target.value);
        onNumberChange(formatted);
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Tipo de {label} {required && <span className="text-red-500">*</span>}
            </label>

            <select
                value={documentType}
                onChange={(e) => onTypeChange(e.target.value as TipoDocumento)}
                disabled={disabled}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
            >
                <option value={TipoDocumento.CPF}>CPF</option>
                <option value={TipoDocumento.RG}>RG</option>
                <option value={TipoDocumento.CNH}>CNH</option>
                <option value={TipoDocumento.PASSAPORTE}>Passaporte</option>
                <option value={TipoDocumento.RNE}>RNE</option>
                <option value={TipoDocumento.CNPJ}>CNPJ</option>
                <option value={TipoDocumento.OUTRO}>Outro</option>
            </select>

            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mt-3">
                Número do {label} {required && <span className="text-red-500">*</span>}
            </label>

            <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    value={documentNumber}
                    onChange={handleNumberChange}
                    placeholder={getPlaceholder()}
                    required={required}
                    disabled={disabled}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                />
            </div>

            {/* Helper text */}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {documentType === TipoDocumento.CPF && 'Apenas números, formatação automática'}
                {documentType === TipoDocumento.CNPJ && 'Apenas números, formatação automática'}
                {documentType === TipoDocumento.RG && 'Formato varia por estado'}
                {documentType === TipoDocumento.CNH && '11 dígitos numéricos'}
                {documentType === TipoDocumento.PASSAPORTE && 'Letras e números, até 9 caracteres'}
                {documentType === TipoDocumento.RNE && 'Registro Nacional de Estrangeiro'}
            </p>
        </div>
    );
};
