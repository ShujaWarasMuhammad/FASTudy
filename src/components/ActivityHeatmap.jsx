import { useMemo } from 'react';
import { localDateKey } from '../utils/dates';

const WEEKS = 26; // ~6 months
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

const level = (count) => (count === 0 ? 0 : count <= 1 ? 1 : count <= 3 ? 2 : count <= 6 ? 3 : 4);

/**
 * Activity heatmap. `submissions` maps local YYYY-MM-DD keys to attempt counts
 * (the same keys ProfileContext writes), so cells always line up with recorded activity.
 */
export default function ActivityHeatmap({ submissions = {} }) {
  const { weeks, months, total, activeDays } = useMemo(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0); // midday avoids DST edge cases when stepping days
    const todayKey = localDateKey(today);

    const start = new Date(today);
    start.setDate(start.getDate() - start.getDay() - (WEEKS - 1) * 7); // Sunday, WEEKS-1 weeks ago

    const cols = [];
    const monthMarks = [];
    let sum = 0;
    let active = 0;
    const cursor = new Date(start);

    for (let w = 0; w < WEEKS; w++) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const key = localDateKey(cursor);
        const future = key > todayKey;
        const count = future ? 0 : submissions[key] || 0;
        if (!future) { sum += count; if (count > 0) active++; }
        if (cursor.getDate() === 1 || (w === 0 && d === 0)) {
          monthMarks.push({ week: w, label: cursor.toLocaleString(undefined, { month: 'short' }) });
        }
        col.push({
          key,
          count,
          future,
          isToday: key === todayKey,
          label: cursor.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      cols.push(col);
    }
    // Drop a leading partial-month label if the next one is too close to fit.
    if (monthMarks.length > 1 && monthMarks[1].week - monthMarks[0].week < 2) monthMarks.shift();
    return { weeks: cols, months: monthMarks, total: sum, activeDays: active };
  }, [submissions]);

  return (
    <div className="heatmap-container">
      <div className="heatmap-header">
        <span className="heatmap-title">Practice heatmap</span>
        <span className="heatmap-count">
          {total} {total === 1 ? 'attempt' : 'attempts'} · {activeDays} active {activeDays === 1 ? 'day' : 'days'}
        </span>
      </div>

      <div className="heatmap-grid-scroll">
        <div className="hm">
          <div className="hm-months" style={{ gridTemplateColumns: `28px repeat(${WEEKS}, 1fr)` }}>
            {months.map((m) => (
              <span key={`${m.week}-${m.label}`} style={{ gridColumnStart: m.week + 2 }}>{m.label}</span>
            ))}
          </div>
          <div className="hm-grid" style={{ gridTemplateColumns: `28px repeat(${WEEKS}, 1fr)` }}>
              {DAY_LABELS.map((d, i) => <span key={`d${i}`} className="hm-day">{d}</span>)}
              {weeks.map((col) =>
                col.map((day) => (
                  <div
                    key={day.key}
                    className={`hm-cell hm-l${level(day.count)}${day.future ? ' hm-future' : ''}${day.isToday ? ' hm-today' : ''}`}
                    title={day.future ? day.label : `${day.label}: ${day.count} ${day.count === 1 ? 'attempt' : 'attempts'}`}
                  />
                ))
              )}
          </div>
        </div>
      </div>

      <div className="heatmap-legend">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((l) => <div key={l} className={`hm-cell hm-l${l}`} />)}
        <span>More</span>
      </div>
    </div>
  );
}
