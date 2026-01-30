import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/components/ui/tooltip';

interface ActivityDay {
    date: string;
    count: number;
    level: 0 | 1 | 2 | 3 | 4;
}

interface ActivityHeatmapProps {
    data?: ActivityDay[];
    weeks?: number;
}

// Generate mock data if none provided
function generateMockData(weeks: number): ActivityDay[] {
    const data: ActivityDay[] = [];
    const today = new Date();

    for (let i = weeks * 7 - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // More activity on weekdays
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const maxCount = isWeekend ? 5 : 15;
        const count = Math.floor(Math.random() * maxCount);

        let level: 0 | 1 | 2 | 3 | 4 = 0;
        if (count > 0) level = 1;
        if (count > 3) level = 2;
        if (count > 7) level = 3;
        if (count > 12) level = 4;

        data.push({
            date: date.toISOString().split('T')[0],
            count,
            level,
        });
    }

    return data;
}

const LEVEL_COLORS = {
    0: 'bg-muted hover:bg-muted/80',
    1: 'bg-primary/20 hover:bg-primary/30',
    2: 'bg-primary/40 hover:bg-primary/50',
    3: 'bg-primary/70 hover:bg-primary/80',
    4: 'bg-primary hover:bg-primary/90',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function ActivityHeatmap({ data, weeks = 12 }: ActivityHeatmapProps) {
    const activityData = useMemo(() => data ?? generateMockData(weeks), [data, weeks]);

    // Group by weeks
    const weeklyData = useMemo(() => {
        const result: ActivityDay[][] = [];
        let currentWeek: ActivityDay[] = [];

        activityData.forEach((day, index) => {
            const dayOfWeek = new Date(day.date).getDay();

            if (index === 0 && dayOfWeek !== 0) {
                // Pad the first week with empty cells
                for (let i = 0; i < dayOfWeek; i++) {
                    currentWeek.push({ date: '', count: 0, level: 0 });
                }
            }

            currentWeek.push(day);

            if (dayOfWeek === 6 || index === activityData.length - 1) {
                result.push(currentWeek);
                currentWeek = [];
            }
        });

        return result;
    }, [activityData]);

    // Get month labels
    const monthLabels = useMemo(() => {
        const labels: { month: string; week: number }[] = [];
        let lastMonth = -1;

        weeklyData.forEach((week, weekIndex) => {
            const firstDay = week.find((d) => d.date);
            if (firstDay) {
                const month = new Date(firstDay.date).getMonth();
                if (month !== lastMonth) {
                    labels.push({ month: MONTHS[month], week: weekIndex });
                    lastMonth = month;
                }
            }
        });

        return labels;
    }, [weeklyData]);

    const totalActivity = activityData.reduce((sum, day) => sum + day.count, 0);

    return (
        <Card className="border-border">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Activity Heatmap</CardTitle>
                    <span className="text-sm text-muted-foreground">
                        {totalActivity} events in the last {weeks} weeks
                    </span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    {/* Month labels */}
                    <div className="flex mb-1 text-xs text-muted-foreground" style={{ paddingLeft: '32px' }}>
                        {monthLabels.map((label, i) => (
                            <div
                                key={i}
                                className="flex-shrink-0"
                                style={{
                                    width: `${((weeklyData.length - label.week) / weeklyData.length) * 100}%`,
                                    marginLeft: i === 0 ? `${(label.week / weeklyData.length) * 100}%` : 0,
                                    position: i === 0 ? 'relative' : 'absolute',
                                }}
                            >
                                {i === 0 || label.week > monthLabels[i - 1].week + 2 ? label.month : ''}
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-0.5">
                        {/* Day labels */}
                        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground pr-2">
                            {DAYS.map((day, i) => (
                                <div
                                    key={day}
                                    className="h-3 flex items-center justify-end"
                                    style={{ visibility: i % 2 === 1 ? 'visible' : 'hidden' }}
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Grid */}
                        <TooltipProvider delayDuration={0}>
                            <div className="flex gap-0.5">
                                {weeklyData.map((week, weekIndex) => (
                                    <div key={weekIndex} className="flex flex-col gap-0.5">
                                        {week.map((day, dayIndex) => (
                                            <Tooltip key={`${weekIndex}-${dayIndex}`}>
                                                <TooltipTrigger asChild>
                                                    <div
                                                        className={`w-3 h-3 rounded-sm transition-colors ${day.date ? LEVEL_COLORS[day.level] : 'bg-transparent'
                                                            }`}
                                                    />
                                                </TooltipTrigger>
                                                {day.date && (
                                                    <TooltipContent side="top" className="text-xs">
                                                        <strong>{day.count} events</strong>
                                                        <br />
                                                        {new Date(day.date).toLocaleDateString('en-US', {
                                                            weekday: 'long',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        })}
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </TooltipProvider>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-end gap-2 mt-3 text-xs text-muted-foreground">
                        <span>Less</span>
                        {[0, 1, 2, 3, 4].map((level) => (
                            <div
                                key={level}
                                className={`w-3 h-3 rounded-sm ${LEVEL_COLORS[level as 0 | 1 | 2 | 3 | 4]}`}
                            />
                        ))}
                        <span>More</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
