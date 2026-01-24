import React from 'react';
import { Card, CardContent } from '../ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FormSectionProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    children: React.ReactNode;
    className?: string;
    footer?: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({
    title,
    description,
    icon: Icon,
    children,
    className,
    footer
}) => {
    return (
        <Card className={cn("shadow-xl shadow-muted/20 bg-card/50 backdrop-blur-sm border border-border/40 overflow-hidden", className)}>
            <div className="p-8 border-b border-border/50 bg-muted/20">
                <h3 className="text-section-header flex items-center gap-2">
                    {Icon && <Icon size={14} className="text-primary" />}
                    {title}
                </h3>
            </div>
            <CardContent className="p-8">
                {description && (
                    <p className="text-section-description mb-8 border-l-2 border-primary/30 pl-4 py-1">
                        {description}
                    </p>
                )}
                <div className="space-y-6">
                    {children}
                </div>
            </CardContent>
            {footer && (
                <div className="p-8 border-t border-border/40 bg-muted/10">
                    {footer}
                </div>
            )}
        </Card>
    );
};
