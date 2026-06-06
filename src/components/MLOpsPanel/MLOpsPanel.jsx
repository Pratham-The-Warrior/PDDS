import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts';
import { Brain, Database, RefreshCw, Target, TrendingUp } from 'lucide-react';
import styles from './MLOpsPanel.module.css';

const STATUS_CONFIG = {
  HEALTHY: { color: 'var(--status-success)', label: 'Model Healthy' },
  DRIFT_DETECTED: { color: 'var(--status-warning)', label: 'Drift Detected' },
  RETRAINING_SCHEDULED: { color: 'var(--status-danger)', label: 'Retraining Scheduled' },
};

const BarTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className={styles.tooltip}>
      <span>{payload[0].payload.range}</span>
      <strong>{payload[0].value} samples</strong>
    </div>
  );
};

export default function MLOpsPanel({ stats, confidenceHistogram }) {
  if (!stats) return null;

  const mlops = stats.mlops;
  const statusConfig = STATUS_CONFIG[mlops.status] || STATUS_CONFIG.HEALTHY;
  const bufferPercent = (mlops.edgeCaseBuffer / mlops.edgeCaseBufferMax) * 100;

  return (
    <div className={`glass-card ${styles.container}`} id="mlops-panel">
      <div className={styles.header}>
        <span className="section-label">MLOps & Active Learning</span>
        <span
          className={styles.statusBadge}
          style={{
            color: statusConfig.color,
            background: `color-mix(in srgb, ${statusConfig.color} 12%, transparent)`,
          }}
        >
          <Brain size={10} />
          {statusConfig.label}
        </span>
      </div>

      {/* Model Info */}
      <div className={styles.modelInfo}>
        <div className={styles.infoRow}>
          <Target size={12} className={styles.infoIcon} />
          <span className={styles.infoLabel}>Model</span>
          <span className={`${styles.infoValue} mono`}>{mlops.modelVersion}</span>
        </div>
        <div className={styles.infoRow}>
          <TrendingUp size={12} className={styles.infoIcon} />
          <span className={styles.infoLabel}>mAP@50</span>
          <span className={`${styles.infoValue} mono`}>{(mlops.mAP50 * 100).toFixed(1)}%</span>
        </div>
        <div className={styles.infoRow}>
          <RefreshCw size={12} className={styles.infoIcon} />
          <span className={styles.infoLabel}>Last trained</span>
          <span className={`${styles.infoValue} mono`}>
            {new Date(mlops.lastRetrained).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Edge Case Buffer */}
      <div className={styles.bufferSection}>
        <div className={styles.bufferHeader}>
          <Database size={12} />
          <span>Edge-Case Buffer</span>
          <span className={`${styles.bufferCount} mono`}>
            {mlops.edgeCaseBuffer}/{mlops.edgeCaseBufferMax}
          </span>
        </div>
        <div className={styles.bufferBar}>
          <div
            className={styles.bufferFill}
            style={{
              width: `${bufferPercent}%`,
              background: bufferPercent > 80 ? 'var(--status-danger)'
                : bufferPercent > 50 ? 'var(--status-warning)'
                : 'var(--accent-cyan)',
            }}
          />
        </div>
        <div className={styles.harvestRate}>
          <span>Harvest rate:</span>
          <span className={`mono`}>{mlops.harvestRate}/hr</span>
        </div>
      </div>

      {/* Confidence Histogram */}
      <div className={styles.histogramSection}>
        <span className={styles.histogramTitle}>Confidence Distribution</span>
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={confidenceHistogram} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis
              dataKey="range"
              tick={{ fontSize: 7, fill: 'var(--text-muted)' }}
              stroke="var(--chart-axis)"
              interval={1}
            />
            <YAxis
              tick={{ fontSize: 8, fill: 'var(--text-muted)' }}
              stroke="var(--chart-axis)"
            />
            <Tooltip content={<BarTooltip />} />
            <Bar
              dataKey="count"
              fill="var(--accent-purple)"
              radius={[2, 2, 0, 0]}
              animationDuration={300}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
