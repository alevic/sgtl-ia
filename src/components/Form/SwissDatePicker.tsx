import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface SwissDatePickerProps {
    value: string; // YYYY-MM-DD
    onChange: (value: string) => void;
    label?: string;
    required?: boolean;
    placeholder?: string;
    showIcon?: boolean;
    className?: string; // Input classes
    containerClassName?: string;
    disabled?: boolean;
}

export const SwissDatePicker: React.FC<SwissDatePickerProps> = ({
    value,
    onChange,
    label,
    required = false,
    placeholder = 'DD/MM/AAAA',
    showIcon = true,
    className = '',
    containerClassName = '',
    disabled = false
}) => {
    const [date, setDate] = useState<Date | undefined>();
    const [inputValue, setInputValue] = useState('');
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [error, setError] = useState(false);

    // Sync internal state when external value changes
    useEffect(() => {
        if (value) {
            const parsed = parseISO(value);
            // Fix timezone offset for YYYY-MM-DD strings to ensure correct day
            const d = new Date(value + 'T12:00:00');
            if (isValid(d)) {
                setDate(d);
                setInputValue(format(d, 'dd/MM/yyyy'));
                setError(false);
            }
        } else {
            setDate(undefined);
            setInputValue('');
        }
    }, [value]);

    const handleCalendarSelect = (newDate: Date | undefined) => {
        setDate(newDate);
        if (newDate) {
            setInputValue(format(newDate, 'dd/MM/yyyy'));
            onChange(format(newDate, 'yyyy-MM-dd'));
            setIsCalendarOpen(false);
            setError(false);
        } else {
            setInputValue('');
            onChange('');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');

        // Input Mask: DD/MM/YYYY
        if (val.length > 8) val = val.substring(0, 8);

        let masked = val;
        if (val.length >= 3 && val.length <= 4) {
            masked = `${val.substring(0, 2)}/${val.substring(2)}`;
        } else if (val.length > 4) {
            masked = `${val.substring(0, 2)}/${val.substring(2, 4)}/${val.substring(4)}`;
        }

        setInputValue(masked);

        // Validate when full date is typed
        if (val.length === 8) {
            const day = parseInt(val.substring(0, 2));
            const month = parseInt(val.substring(2, 4));
            const year = parseInt(val.substring(4, 8));

            // Basic validation
            if (day > 0 && day <= 31 && month > 0 && month <= 12 && year > 1900 && year < 2100) {
                // Create date object (ISO format for consistency)
                const isoStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                const d = new Date(isoStr + 'T12:00:00');

                if (isValid(d)) {
                    setDate(d);
                    onChange(isoStr);
                    setError(false);
                } else {
                    setError(true);
                }
            } else {
                setError(true);
            }
        } else if (val.length === 0) {
            setDate(undefined);
            onChange('');
            setError(false);
        }
    };

    return (
        <div className={cn("space-y-1 group", containerClassName)}>
            {label && (
                <Label className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-muted-foreground/70 mb-1.5 ml-0.5">
                    {label} {required && <span className="text-destructive">*</span>}
                </Label>
            )}

            <div className="relative flex items-center">
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={disabled}
                            className={cn(
                                "absolute left-0 top-0 h-full w-14 text-muted-foreground hover:text-primary transition-colors rounded-none border-r border-transparent hover:bg-muted/50 z-10",
                                error && "text-destructive",
                                isCalendarOpen && "bg-muted text-foreground border-border"
                            )}
                        >
                            <CalendarIcon size={20} strokeWidth={2.5} />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-sm border-border shadow-2xl" align="start">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleCalendarSelect}
                            locale={ptBR}
                            initialFocus
                            captionLayout="dropdown"
                            fromYear={1920}
                            toYear={new Date().getFullYear() + 10}
                        />
                    </PopoverContent>
                </Popover>

                <Input
                    type="text"
                    inputMode="numeric"
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={handleInputChange}
                    disabled={disabled}
                    className={cn(
                        "pl-14 h-14 bg-muted/20 border-border rounded-sm font-mono text-sm tracking-wide transition-all",
                        "focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary",
                        "placeholder:text-muted-foreground/30",
                        error && "border-destructive text-destructive focus-visible:ring-destructive",
                        disabled && "opacity-50 cursor-not-allowed",
                        className
                    )}
                />
            </div>
            {error && <p className="text-[10px] font-bold text-destructive uppercase tracking-wide mt-1 animate-in fade-in slide-in-from-left-1">Data Inválida</p>}
        </div>
    );
};
