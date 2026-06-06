import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import styles from './TimelineCharts.module.css';

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' });
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipTime}>{formatTime(label)}</span>
      {payload.map((p, i) => (
        <div key={i} className={styles.tooltipRow}>
          <span className={styles.tooltipDot} style={{ background: p.color }} />
          <span className={styles.tooltipValue}>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function TimelineCharts({ throughputHistory, latencyHistory, defectRateHistory }) {
  return (
    <div className={`glass-card ${styles.container}`} id="timeline-charts">
      <span className="section-label">Time Series</span>

      <div className={styles.charts}>
        {/* Throughput Chart */}
        <div className={styles.chartCard}>
          <span className={styles.chartTitle}>Throughput <span className={styles.chartUnit}>pkg/min</span></span>
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={throughputHistory} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="throughputGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00e5ff" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00e5ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis
                dataKey="time"
                tickFormatter={formatTime}
                stroke="var(--chart-axis)"
                tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="var(--chart-axis)"
                tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#00e5ff"
                strokeWidth={2}
                fill="url(#throughputGrad)"
                dot={false}
                animationDuration={300}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Latency Chart */}
        <div className={styles.chartCard}>
          <span className={styles.chartTitle}>
            Inference Latency <span className={styles.chartUnit}>ms</span>
            <span className={styles.thresholdLabel}>45ms threshold</span>
          </span>
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={latencyHistory} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis
                dataKey="time"
                tickFormatter={formatTime}
                stroke="var(--chart-axis)"
                tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="var(--chart-axis)"
                tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                domain={[0, 60]}
              />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine
                y={45}
                stroke="var(--status-danger)"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                label={{ value: '45ms', position: 'right', fill: 'var(--status-danger)', fontSize: 9 }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3d8bfd"
                strokeWidth={2}
                dot={false}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Defect Rate Chart */}
        <div className={styles.chartCard}>
          <span className={styles.chartTitle}>Defect Rate <span className={styles.chartUnit}>%</span></span>
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={defectRateHistory} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="defectGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffab00" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ffab00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis
                dataKey="time"
                tickFormatter={formatTime}
                stroke="var(--chart-axis)"
                tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="var(--chart-axis)"
                tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#ffab00"
                strokeWidth={2}
                fill="url(#defectGrad)"
                dot={false}
                animationDuration={300}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
