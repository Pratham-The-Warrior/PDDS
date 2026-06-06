import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DEFECT_TYPES } from '../../simulation/PackageSimulator';
import styles from './DefectBreakdown.module.css';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipDot} style={{ background: data.color }} />
      <span className={styles.tooltipLabel}>{data.label}</span>
      <span className={styles.tooltipValue}>{data.count}</span>
    </div>
  );
};

export default function DefectBreakdown({ defectBreakdown }) {
  const total = defectBreakdown.reduce((sum, d) => sum + d.count, 0);

  const chartData = defectBreakdown.map(d => ({
    ...d,
    name: d.label,
    value: d.count || 0,
  }));

  return (
    <div className={`glass-card ${styles.container}`} id="defect-breakdown">
      <span className="section-label">Defect Classification</span>

      <div className={styles.chartWrap}>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={72}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
              animationBegin={0}
              animationDuration={800}
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} opacity={0.85} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className={styles.centerLabel}>
          <span className={`${styles.centerNumber} mono`}>{total}</span>
          <span className={styles.centerText}>Defects</span>
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        {defectBreakdown.map(d => (
          <div key={d.type} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: d.color }} />
            <span className={styles.legendLabel}>{d.label}</span>
            <span className={`${styles.legendCount} mono`}>{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
