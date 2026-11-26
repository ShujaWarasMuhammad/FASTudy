import { useMemo } from 'react';

export default function ActivityHeatmap({ submissions = {} }) {
  // Generate the last 16 weeks (112 days) of data
  const { weeks, monthLabels, totalCount } = useMemo(() => {
    const today = new Date();
    const daysToShow = 119; // 17 weeks
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysToShow + 1);

    // Adjust to starting Sunday/Monday
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const allDays = [];
    let curr = new Date(startDate);
    let total = 0;

    while (curr <= today || allDays.length % 7 !== 0) {
      const dateStr = curr.toISOString().split('T')[0];
      const count = submissions[dateStr] || 0;
      total += count;
      allDays.push({
        date: dateStr,
        count,
        day: curr.getDay(),
        month: curr.toLocaleString('default', { month: 'short' }),
        dayNum: curr.getDate(),
      });
      curr.setDate(curr.getDate() + 1);
    }

    // Split into weeks of 7 days
    const weekGroups = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weekGroups.push(allDays.slice(i, i + 7));
    }

    // Generate monthly labels
    const months = [];
    let lastMonth = '';
    weekGroups.forEach((week, wIdx) => {
      const firstDay = week[0];
      if (firstDay && firstDay.month !== lastMonth) {
        months.push({ text: firstDay.month, index: wIdx });
        lastMonth = firstDay.month;
      }
    });

    return { weeks: weekGroups, monthLabels: months, totalCount: total };
  }, [submissions]);

  const getColorClass = (count) => {
    if (count === 0) return 'heat-empty';
    if (count <= 2) return 'heat-level-1';
    if (count <= 5) return 'heat-level-2';
    if (count <= 8) return 'heat-level-3';
    return 'heat-level-4';
  };

  return (
    <div className="heatmap-container">
      <div className="heatmap-header">
        <span className="heatmap-title">Contribution & Dry Run Heatmap</span>
        <span className="heatmap-count">{totalCount} solves in last 4 months</span>
      </div>

      <div className="heatmap-month-labels">
        {monthLabels.map((m, idx) => (
          <span
            key={idx}
            className="heatmap-month-label"
            style={{ left: `${(m.index / weeks.length) * 100}%` }}
          >
            {m.text}
          </span>
        ))}
      </div>

      <div className="heatmap-grid-scroll">
        <div className="heatmap-grid">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="heatmap-col">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={`heatmap-cell ${getColorClass(day.count)}`}
                  title={`${day.date}: ${day.count} solves`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="heatmap-legend">
        <span>Less</span>
        <div className="heatmap-cell heat-empty" />
        <div className="heatmap-cell heat-level-1" />
        <div className="heatmap-cell heat-level-2" />
        <div className="heatmap-cell heat-level-3" />
        <div className="heatmap-cell heat-level-4" />
        <span>More</span>
      </div>
    </div>
  );
}
