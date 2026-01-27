import React from 'react';
import { cn } from '../../lib/utils';

interface ListFilterSectionProps {
    children: React.ReactNode;
    className?: string;
    gridClassName?: string;
}

export const ListFilterSection: React.FC<ListFilterSectionProps> = ({
    children,
    className,
    gridClassName
}) => {
    return (
        <div className={cn(
            "bg-card   p-6 rounded-sm border border-border/40 shadow-xl shadow-muted/10",
            className
        )}>
            <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", gridClassName)}>
                {children}
            </div>
        </div>
    );
};
