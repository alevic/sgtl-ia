import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

// --- shadcn/ui COMPONENTS ---
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '../../lib/utils';

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
        <div className={cn("space-y-2", containerClassName)}>
            {label && (
                <Label className="flex items-center gap-1">
                    {label} {required && <span className="text-destructive">*</span>}
                </Label>
            )}

            <div className="relative">
                {showIcon && (
                    <div className={cn(
                        "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors",
                        error && "text-destructive"
                    )}>
                        <Clock size={18} />
                    </div>
                )}
                <Input
                    type="text"
                    inputMode="numeric"
                    value={displayValue}
                    onChange={handleChange}
                    placeholder={placeholder}
                    maxLength={5}
                    className={cn(
                        'h-14',
                        showIcon ? 'pl-10' : 'px-4',
                        error ? 'border-destructive focus-visible:ring-destructive' : '',
                        className
                    )}
                />
            </div>
            {error && <p className="text-[0.8rem] font-medium text-destructive">Hora inválida (00:00 - 23:59)</p>}
        </div>
    );
};
