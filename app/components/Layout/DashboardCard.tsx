import React from 'react';
import { Card, CardContent } from '../ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DashboardCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    variant?: 'primary' | 'emerald' | 'blue' | 'purple' | 'amber' | 'rose';
    trend?: string;
    className?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
    title,
    value,
    icon: Icon,
    variant = 'primary',
    trend,
    className
}) => {
    const variants = {
        primary: 'bg-primary/10 text-primary',
        emerald: 'bg-emerald-500/10 text-emerald-600',
        blue: 'bg-blue-500/10 text-blue-600',
        purple: 'bg-purple-500/10 text-purple-600',
        amber: 'bg-amber-500/10 text-amber-600',
        rose: 'bg-rose-500/10 text-rose-600',
    };

    return (
        <Card className={cn(
            "shadow-xl shadow-muted/20 bg-card/50 backdrop-blur-sm group hover:bg-card transition-all duration-300 rounded-3xl border border-border/40",
            className
        )}>
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <p className="text-label-caps">
                            {title}
                        </p>
                        <p className="text-data-kpi">
                            {value}
                        </p>
                        {trend && (
                            <p className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                                {trend}
                            </p>
                        )}
                    </div>
                    <div className={cn(
                        "p-3 rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
                        variants[variant]
                    )}>
                        <Icon size={20} strokeWidth={2.5} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
