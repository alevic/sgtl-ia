import { TipoDocumento } from '@/types';

/**
 * Validate CPF (Cadastro de Pessoa Física)
 */
export const validateCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, '');

    if (cleanCPF.length !== 11) return false;

    // Check for known invalid CPFs (all same digit)
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

    // Validate first check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let checkDigit = 11 - (sum % 11);
    if (checkDigit === 10 || checkDigit === 11) checkDigit = 0;
    if (checkDigit !== parseInt(cleanCPF.charAt(9))) return false;

    // Validate second check digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    checkDigit = 11 - (sum % 11);
    if (checkDigit === 10 || checkDigit === 11) checkDigit = 0;
    if (checkDigit !== parseInt(cleanCPF.charAt(10))) return false;

    return true;
};

/**
 * Validate CNPJ (Cadastro Nacional de Pessoa Jurídica)
 */
export const validateCNPJ = (cnpj: string): boolean => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');

    if (cleanCNPJ.length !== 14) return false;

    // Check for known invalid CNPJs (all same digit)
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;

    // Validate first check digit
    let length = cleanCNPJ.length - 2;
    let numbers = cleanCNPJ.substring(0, length);
    const digits = cleanCNPJ.substring(length);
    let sum = 0;
    let pos = length - 7;

    for (let i = length; i >= 1; i--) {
        sum += parseInt(numbers.charAt(length - i)) * pos--;
        if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    // Validate second check digit
    length = length + 1;
    numbers = cleanCNPJ.substring(0, length);
    sum = 0;
    pos = length - 7;

    for (let i = length; i >= 1; i--) {
        sum += parseInt(numbers.charAt(length - i)) * pos--;
        if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
};

/**
 * Validate document based on type
 */
export const validateDocument = (tipo: TipoDocumento, numero: string): boolean => {
    const cleanNumber = numero.replace(/\D/g, '');

    switch (tipo) {
        case TipoDocumento.CPF:
            return validateCPF(numero);

        case TipoDocumento.CNPJ:
            return validateCNPJ(numero);

        case TipoDocumento.CNH:
            // CNH: 11 digits
            return cleanNumber.length === 11;

        case TipoDocumento.RG:
            // RG: varies by state, 7-9 digits
            return cleanNumber.length >= 7 && cleanNumber.length <= 9;

        case TipoDocumento.PASSAPORTE:
            // Passaporte: 6-9 alphanumeric characters
            const passaporteRegex = /^[A-Z0-9]{6,9}$/i;
            return passaporteRegex.test(numero.toUpperCase());

        case TipoDocumento.RNE:
            // RNE: at least 6 characters
            return numero.length >= 6;

        case TipoDocumento.OUTRO:
            // Other: at least 3 characters
            return numero.length >= 3;

        default:
            return false;
    }
};

/**
 * Get document type label
 */
export const getDocumentTypeLabel = (tipo: TipoDocumento): string => {
    switch (tipo) {
        case TipoDocumento.CPF:
            return 'CPF';
        case TipoDocumento.RG:
            return 'RG';
        case TipoDocumento.CNH:
            return 'CNH';
        case TipoDocumento.PASSAPORTE:
            return 'Passaporte';
        case TipoDocumento.RNE:
            return 'RNE';
        case TipoDocumento.CNPJ:
            return 'CNPJ';
        case TipoDocumento.OUTRO:
            return 'Outro';
        default:
            return 'Documento';
    }
};

/**
 * Format document for display
 */
export const formatDocumentDisplay = (tipo: TipoDocumento, numero: string): string => {
    if (!numero) return '';

    const cleanNumber = numero.replace(/\D/g, '');

    switch (tipo) {
        case TipoDocumento.CPF:
            if (cleanNumber.length === 11) {
                return cleanNumber.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            }
            return numero;

        case TipoDocumento.CNPJ:
            if (cleanNumber.length === 14) {
                return cleanNumber.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
            }
            return numero;

        case TipoDocumento.RG:
            if (cleanNumber.length >= 7) {
                return cleanNumber.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
            }
            return numero;

        default:
            return numero;
    }
};
