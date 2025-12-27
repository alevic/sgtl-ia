import React, { useState } from 'react';
import { MoreVertical, LucideIcon } from 'lucide-react';

export interface ActionItem {
    icon: LucideIcon;
    label: string;
    onClick: (e: React.MouseEvent) => void;
    /** Color theme for the action button */
    color?: 'slate' | 'blue' | 'red' | 'green' | 'yellow' | 'orange' | 'indigo' | 'teal';
    /** Hide this action from the list */
    hidden?: boolean;
    /** Disable this action */
    disabled?: boolean;
}

export interface ActionGroup {
    /** Optional section label (shown in menu only) */
    label?: string;
    actions: ActionItem[];
}

interface ResponsiveActionsProps {
    /** Simple list of actions OR grouped actions with optional sections */
    actions: ActionItem[] | ActionGroup[];
}

// Type guard to check if actions is ActionGroup[]
const isActionGroups = (actions: ActionItem[] | ActionGroup[]): actions is ActionGroup[] => {
    return actions.length > 0 && 'actions' in actions[0];
};

// Flatten groups to get all actions
const flattenActions = (actions: ActionItem[] | ActionGroup[]): ActionItem[] => {
    if (isActionGroups(actions)) {
        return actions.flatMap(group => group.actions);
    }
    return actions;
};

// Color classes for inline buttons (colored background style like Viagens/Reservas)
const getInlineButtonClasses = (color: ActionItem['color'] = 'slate', disabled?: boolean) => {
    const baseClasses = 'p-2 rounded-lg transition-colors';
    const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

    const colorMap: Record<string, string> = {
        slate: 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600',
        blue: 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50',
        red: 'bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50',
        green: 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50',
        yellow: 'bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50',
        orange: 'bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50',
        indigo: 'bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50',
        teal: 'bg-teal-100 dark:bg-teal-900/30 hover:bg-teal-200 dark:hover:bg-teal-900/50'
    };

    return `${baseClasses} ${colorMap[color] || colorMap.slate} ${disabledClasses}`;
};

// Icon color classes
const getIconClasses = (color: ActionItem['color'] = 'slate') => {
    const colorMap: Record<string, string> = {
        slate: 'text-slate-600 dark:text-slate-400',
        blue: 'text-blue-600 dark:text-blue-400',
        red: 'text-red-600 dark:text-red-400',
        green: 'text-green-600 dark:text-green-400',
        yellow: 'text-yellow-600 dark:text-yellow-400',
        orange: 'text-orange-600 dark:text-orange-400',
        indigo: 'text-indigo-600 dark:text-indigo-400',
        teal: 'text-teal-600 dark:text-teal-400'
    };

    return colorMap[color] || colorMap.slate;
};

// Menu item hover classes
const getMenuItemClasses = (color: ActionItem['color'] = 'slate') => {
    const colorMap: Record<string, string> = {
        slate: 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300',
        blue: 'hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        red: 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400',
        green: 'hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400',
        yellow: 'hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
        orange: 'hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400',
        indigo: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
        teal: 'hover:bg-teal-50 dark:hover:bg-teal-900/20 text-teal-600 dark:text-teal-400'
    };

    return colorMap[color] || colorMap.slate;
};

export const ResponsiveActions: React.FC<ResponsiveActionsProps> = ({ actions }) => {
    const [showMenu, setShowMenu] = useState(false);

    // Flatten for inline actions
    const allActions = flattenActions(actions).filter(a => !a.hidden);

    const handleActionClick = (action: ActionItem, e: React.MouseEvent) => {
        if (action.disabled) return;
        e.preventDefault();
        e.stopPropagation();
        setShowMenu(false);
        action.onClick(e);
    };

    // Render menu content (handles both simple and grouped actions)
    const renderMenuContent = () => {
        if (isActionGroups(actions)) {
            return actions.map((group, groupIndex) => {
                const visibleActions = group.actions.filter(a => !a.hidden);
                if (visibleActions.length === 0) return null;

                return (
                    <React.Fragment key={groupIndex}>
                        {groupIndex > 0 && (
                            <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                        )}
                        {group.label && (
                            <div className="px-4 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                {group.label}
                            </div>
                        )}
                        {visibleActions.map((action, actionIndex) => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={actionIndex}
                                    onClick={(e) => handleActionClick(action, e)}
                                    disabled={action.disabled}
                                    className={`w-full px-4 py-2.5 text-left flex items-center gap-2 transition-colors text-sm
                                        ${getMenuItemClasses(action.color)}
                                        ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                >
                                    <Icon size={16} />
                                    {action.label}
                                </button>
                            );
                        })}
                    </React.Fragment>
                );
            });
        }

        // Simple actions list
        return allActions.map((action, index) => {
            const Icon = action.icon;

            return (
                <button
                    key={index}
                    onClick={(e) => handleActionClick(action, e)}
                    disabled={action.disabled}
                    className={`w-full px-4 py-2.5 text-left flex items-center gap-2 transition-colors text-sm
                        ${getMenuItemClasses(action.color)}
                        ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                >
                    <Icon size={16} />
                    {action.label}
                </button>
            );
        });
    };

    return (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.preventDefault()}>
            {/* Desktop: Only inline action icons (hidden on mobile) */}
            <div className="hidden md:flex items-center gap-2">
                {allActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                        <button
                            key={index}
                            onClick={(e) => handleActionClick(action, e)}
                            disabled={action.disabled}
                            className={getInlineButtonClasses(action.color, action.disabled)}
                            title={action.label}
                        >
                            <Icon size={18} className={getIconClasses(action.color)} />
                        </button>
                    );
                })}
            </div>

            {/* Mobile: Only MoreVertical Menu (hidden on desktop) */}
            <div className="relative md:hidden">
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowMenu(!showMenu);
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                    <MoreVertical size={18} className="text-slate-600 dark:text-slate-400" />
                </button>

                {showMenu && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-10"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowMenu(false);
                            }}
                        />

                        {/* Dropdown Menu */}
                        <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-20 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2">
                            {renderMenuContent()}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
