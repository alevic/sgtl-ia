import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    suffix?: string;
    icon?: LucideIcon;
    backLink?: string;
    backLabel?: string;
    rightElement?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    subtitle,
    suffix,
    icon: Icon,
    backLink,
    backLabel = "Voltar",
    rightElement
}) => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="space-y-4">
                {backLink && (
                    <button
                        onClick={() => navigate(backLink)}
                        className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                    >
                        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{backLabel}</span>
                    </button>
                )}
                <div className="flex items-center gap-4">
                    {Icon && (
                        <div className="p-3 bg-primary/10 rounded-sm text-primary hidden md:flex animate-in zoom-in-95 duration-500">
                            <Icon size={24} />
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-display-header">
                                {title}
                            </h1>
                            {suffix && (
                                <span className="text-primary italic font-black text-4xl hidden lg:inline tracking-tight leading-none animate-in fade-in slide-in-from-left-4 duration-700">
                                    {suffix}
                                </span>
                            )}
                        </div>
                        {subtitle && (
                            <p className="text-display-subtitle">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
            </div>
            {rightElement && (
                <div className="flex items-center gap-3">
                    {rightElement}
                </div>
            )}
        </div>
    );
};
