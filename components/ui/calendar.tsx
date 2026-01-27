import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, useDayPicker, useNavigation } from "react-day-picker"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { cn } from "../../lib/utils"
import { buttonVariants } from "./button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-3", className)}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                month_caption: "flex justify-center pt-1 relative items-center h-10",
                caption_label: "hidden", // Hide default label as we use custom caption
                nav: "flex items-center",
                button_previous: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-muted focus:bg-muted absolute left-0 top-1 rounded-sm border-border z-10"
                ),
                button_next: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-muted focus:bg-muted absolute right-0 top-1 rounded-sm border-border z-10"
                ),
                month_grid: "w-full border-collapse space-y-1",
                weekdays: "flex justify-between mb-2 mt-2",
                weekday:
                    "text-muted-foreground rounded-sm w-9 font-bold text-[10px] uppercase tracking-wider h-8 flex items-center justify-center",
                week: "flex w-full mt-1 justify-between",
                day: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-sm [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-sm last:[&:has([aria-selected])]:rounded-r-sm focus-within:relative focus-within:z-20",
                day_button: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-9 w-9 p-0 font-medium aria-selected:opacity-100 hover:bg-muted rounded-sm transition-colors"
                ),
                day_selected:
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-sm font-bold shadow-md shadow-primary/20",
                day_today: "bg-accent/40 text-accent-foreground font-bold border border-primary/20",
                day_outside:
                    "day-outside text-muted-foreground opacity-30 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                day_disabled: "text-muted-foreground opacity-50 line-through decoration-destructive",
                day_range_middle:
                    "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation }) => {
                    const Icon = orientation === "left" ? ChevronLeft : ChevronRight
                    return <Icon className="h-4 w-4" />
                },
                // CUSTOM CAPTION IMPLEMENTATION for guaranteed Dropdowns
                Caption: (props) => {
                    const { goToMonth, currentMonth } = useNavigation();
                    const { fromYear, toYear } = useDayPicker(); // Access limits from context

                    // Safe defaults if props are not passed
                    const currentYear = currentMonth?.getFullYear() || new Date().getFullYear();
                    const startYear = fromYear || 1920;
                    const endYear = toYear || (new Date().getFullYear() + 10);

                    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
                    const months = Array.from({ length: 12 }, (_, i) => i);

                    const handleChangeMonth = (e: React.ChangeEvent<HTMLSelectElement>) => {
                        const newMonth = new Date(currentMonth || new Date());
                        newMonth.setMonth(parseInt(e.target.value));
                        goToMonth(newMonth);
                    };

                    const handleChangeYear = (e: React.ChangeEvent<HTMLSelectElement>) => {
                        const newMonth = new Date(currentMonth || new Date());
                        newMonth.setFullYear(parseInt(e.target.value));
                        goToMonth(newMonth);
                    };

                    return (
                        <div className="flex justify-center gap-2 items-center w-full px-8 z-20 h-10">
                            {/* Month Select */}
                            <div className="relative">
                                <select
                                    value={currentMonth?.getMonth()}
                                    onChange={handleChangeMonth}
                                    className="bg-card h-8 w-[110px] rounded-sm border border-border text-xs font-bold uppercase tracking-widest text-muted-foreground focus:ring-1 focus:ring-primary cursor-pointer shadow-sm pl-2 pr-1 py-0 opacity-100 appearance-none text-center"
                                >
                                    {months.map(month => (
                                        <option key={month} value={month}>
                                            {format(new Date(2000, month, 1), 'MMMM', { locale: ptBR }).toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Year Select */}
                            <div className="relative">
                                <select
                                    value={currentYear}
                                    onChange={handleChangeYear}
                                    className="bg-card h-8 w-[80px] rounded-sm border border-border text-xs font-bold uppercase tracking-widest text-muted-foreground focus:ring-1 focus:ring-primary cursor-pointer shadow-sm pl-2 pr-1 py-0 opacity-100 appearance-none text-center"
                                >
                                    {years.map(year => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )
                }
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
