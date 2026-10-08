import { useMemo, useState } from 'react';
import type { PointerEvent } from 'react';
import type { RatePoint } from '../types';
import { formatObservationDate, formatRate } from '../lib/rates';

type Props = { points: RatePoint[]; windowLabel?: string; scrollable?: boolean };
const WIDTH = 760;
const HEIGHT = 300;
const PAD = { top: 26, right: 25, bottom: 38, left: 20 };

export function RateChart({ points, windowLabel = 'Two-week', scrollable = false }: Props) {
  const [selected, setSelected] = useState<RatePoint | null>(null);
  const svgWidth = scrollable ? Math.max(1100, points.length * 22) : WIDTH;
  const chart = useMemo(() => {
    if (points.length === 0) return null;
    const low = Math.min(...points.map((point) => point.rate));
    const high = Math.max(...points.map((point) => point.rate));
    const span = Math.max(high - low, high * 0.001);
    const min = low - span * 0.18;
    const max = high + span * 0.2;
    const plotWidth = svgWidth - PAD.left - PAD.right;
    const plotHeight = HEIGHT - PAD.top - PAD.bottom;
    const first = new Date(`${points[0].date}T00:00:00Z`).getTime();
    const last = new Date(`${points.at(-1)!.date}T00:00:00Z`).getTime();
    const elapsed = Math.max(last - first, 1);
    const coords = points.map((point) => {
      const stamp = new Date(`${point.date}T00:00:00Z`).getTime();
      return {
        point,
        x: PAD.left + ((stamp - first) / elapsed) * plotWidth,
        y: PAD.top + ((max - point.rate) / (max - min)) * plotHeight,
      };
    });
    return { low, high, coords, path: coords.map(({ x, y }) => `${x},${y}`).join(' '), svgWidth };
  }, [points, svgWidth]);

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!chart) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const svgX = ((event.clientX - rect.left) / rect.width) * chart.svgWidth;
    const nearest = chart.coords.reduce((best, item) => Math.abs(item.x - svgX) < Math.abs(best.x - svgX) ? item : best);
    setSelected(nearest.point);
  };

  if (!chart) return <div className="chart-empty">Waiting for published rate observations…</div>;
  const latest = chart.coords.at(-1)!;
  const peak = chart.coords.reduce((best, item) => item.point.rate > best.point.rate ? item : best);
  const selectedPoint = selected ? chart.coords.find((item) => item.point.date === selected.date) : null;
  const focus = selectedPoint ?? latest;

  return (
    <div className="chart-wrap">
      <div className="chart-key">
        <span><i className="key-dot today" />Latest published</span>
        <span><i className="key-dot peak" />{windowLabel} peak</span>
      </div>
      <div className={`chart-scroll${scrollable ? ' is-scrollable' : ''}`}>
        <svg
          className="rate-chart"
          style={scrollable ? { width: `${chart.svgWidth}px` } : undefined}
          viewBox={`0 0 ${chart.svgWidth} ${HEIGHT}`}
          role="img"
          aria-label={`${windowLabel} MYR to KRW daily reference chart. Peak ${formatRate(chart.high)} on ${formatObservationDate(peak.point.date)}.`}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setSelected(null)}
        >
        {[0, 1, 2, 3].map((step) => {
          const y = PAD.top + (step / 3) * (HEIGHT - PAD.top - PAD.bottom);
          const value = chart.high - ((chart.high - chart.low) * step) / 3;
          return <g key={step}><line x1={PAD.left} x2={chart.svgWidth - PAD.right} y1={y} y2={y} className="grid-line" /><text x={PAD.left + 2} y={y - 6} className="axis-label">{formatRate(value)}</text></g>;
        })}
        <polyline points={chart.path} className="rate-line" />
        <circle cx={peak.x} cy={peak.y} r="7" className="peak-halo" />
        <circle cx={peak.x} cy={peak.y} r="4" className="peak-dot" />
        {focus && <line x1={focus.x} x2={focus.x} y1={PAD.top} y2={HEIGHT - PAD.bottom} className="focus-line" />}
        {chart.coords.map(({ point, x, y }) => <circle key={point.date} cx={x} cy={y} r="3" className="rate-dot" />)}
        <circle cx={latest.x} cy={latest.y} r="11" className="today-pulse" />
        <circle cx={latest.x} cy={latest.y} r="5" className="today-dot" />
        <text x={PAD.left} y={HEIGHT - 9} className="axis-date">{formatObservationDate(points[0].date)}</text>
        <text x={chart.svgWidth - PAD.right} y={HEIGHT - 9} className="axis-date" textAnchor="end">{formatObservationDate(points.at(-1)!.date)}</text>
        </svg>
      </div>
      <div className="chart-readout" aria-live="polite">
        <span className="readout-label">{selectedPoint ? 'Selected day' : 'Latest in period'}</span>
        <strong>{focus ? formatRate(focus.point.rate) : '—'} <small>KRW / RM1</small></strong>
        <span>{focus ? formatObservationDate(focus.point.date) : 'No rate date'}</span>
        <span className="peak-readout">PEAK {formatRate(chart.high)} · {formatObservationDate(peak.point.date)}</span>
      </div>
      <p className="chart-caption">{scrollable ? 'Scroll horizontally to inspect each day; weekends and publication gaps remain blank.' : 'Daily reference observations · weekends and publication gaps are left blank.'}</p>
    </div>
  );
}
