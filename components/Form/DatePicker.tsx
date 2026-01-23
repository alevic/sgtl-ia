import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { parse, format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- shadcn/ui COMPONENTS ---
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

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
    const [open, setOpen] = useState(false);

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

    const handleCalendarSelect = (date: Date | undefined) => {
        if (date) {
            const iso = format(date, 'yyyy-MM-dd');
            onChange(iso);
            setDisplayValue(format(date, 'dd/MM/yyyy'));
            setError(false);
            setOpen(false);
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
        setError(false);

        // Validation and Update Logic
        if (input.length === 8) {
            const day = parseInt(input.substring(0, 2));
            const month = parseInt(input.substring(2, 4));
            const year = parseInt(input.substring(4, 8));

            // Parse strictly to validate existence (e.g., 31/02)
            try {
                const parsedDate = parse(formatted, 'dd/MM/yyyy', new Date());

                // Extra check: date-fns parse might roll over if not careful with format strings,
                // but 'dd/MM/yyyy' is usually safe. However, let's verify components.
                if (isValid(parsedDate) &&
                    parsedDate.getDate() === day &&
                    (parsedDate.getMonth() + 1) === month &&
                    parsedDate.getFullYear() === year &&
                    year >= 1900 && year < 2100) {

                    const isoDate = format(parsedDate, 'yyyy-MM-dd');
                    onChange(isoDate);
                    setError(false);
                } else {
                    setError(true);
                }
            } catch (e) {
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
        <div className={cn("space-y-2", containerClassName)}>
            {label && (
                <Label className="flex items-center gap-1">
                    {label} {required && <span className="text-destructive">*</span>}
                </Label>
            )}

            <div className="relative flex items-center">
                <Input
                    type="text"
                    inputMode="numeric"
                    value={displayValue}
                    onChange={handleChange}
                    placeholder={placeholder}
                    maxLength={10}
                    className={cn(
                        'h-14',
                        showIcon ? 'pl-10' : 'px-4',
                        error ? 'border-destructive focus-visible:ring-destructive' : '',
                        className
                    )}
                />

                {showIcon && (
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary transition-colors",
                                    error && "text-destructive"
                                )}
                            >
                                <CalendarIcon size={18} />
                                <span className="sr-only">Abrir calendário</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={getCalendarDate(value)}
                                onSelect={handleCalendarSelect}
                                locale={ptBR}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                )}
            </div>
            {error && <p className="text-[0.8rem] font-medium text-destructive">Data inválida</p>}
        </div>
    );
};

