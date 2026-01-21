import React from 'react';
import { DayPicker } from 'react-day-picker';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Common classes to match shadcn/ui look
const calendarStyles = {
    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
    month: "space-y-4",
    month_caption: "flex justify-center pt-1 relative items-center px-8",
    caption_label: "text-sm font-medium text-slate-900 dark:text-slate-100",
    nav: "space-x-1 flex items-center",
    button_previous: "absolute left-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800",
    button_next: "absolute right-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800",
    month_grid: "w-full border-collapse space-y-1",
    weekdays: "flex",
    weekday: "text-slate-500 rounded-md w-9 font-normal text-[0.8rem] dark:text-slate-400",
    week: "flex w-full mt-2",
    day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center text-slate-900 dark:text-slate-100",
    day_button: "h-9 w-9 p-0 font-normal text-slate-900 dark:text-slate-100",
    selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
    today: "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 font-bold",
    outside: "text-slate-400 opacity-50 dark:text-slate-500",
    disabled: "text-slate-400 opacity-50 cursor-not-allowed dark:text-slate-500",
    hidden: "invisible",
};

interface DatePickerCalendarProps {
    selected?: Date;
    onSelect: (date: Date | undefined) => void;
}

export const DatePickerCalendar: React.FC<DatePickerCalendarProps> = ({ selected, onSelect }) => {
    return (
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <DayPicker
                mode="single"
                selected={selected}
                onSelect={onSelect}
                locale={ptBR}
                classNames={calendarStyles}
                components={{
                    Chevron: ({ orientation }) => orientation === 'left'
                        ? <ChevronLeft className="h-4 w-4" />
                        : <ChevronRight className="h-4 w-4" />,
                }}
            />
        </div>
    );
};
