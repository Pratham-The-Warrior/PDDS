import { TrendingUp, TrendingDown, Minus, Package, AlertTriangle, Zap } from 'lucide-react';
import styles from './KPICards.module.css';

function KPICard({ icon: Icon, label, value, unit, delta, status, ringPercent, id }) {
  const statusClass = status === 'success' ? styles.success
    : status === 'warning' ? styles.warning
    : status === 'danger' ? styles.danger
    : '';

  const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;

  return (
    <div className={`glass-card ${styles.card}`} id={id}>
      <div className={styles.cardHeader}>
        <div className={styles.iconWrap}>
          <Icon size={16} />
        </div>
        <span className={`section-label`}>{label}</span>
      </div>

      <div className={styles.valueRow}>
        <div className={styles.mainValue}>
          <span className={`${styles.number} mono ${statusClass}`}>{value}</span>
          {unit && <span className={styles.unit}>{unit}</span>}
        </div>

        {ringPercent !== undefined && (
          <div className={styles.ring}>
            <svg viewBox="0 0 36 36" className={styles.ringSvg}>
              <circle
                cx="18" cy="18" r="15.5"
                fill="none"
                stroke="var(--border-default)"
                strokeWidth="3"
              />
              <circle
                cx="18" cy="18" r="15.5"
                fill="none"
                stroke={status === 'danger' ? 'var(--status-danger)' : status === 'warning' ? 'var(--status-warning)' : 'var(--accent-cyan)'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${ringPercent * 97.39 / 100} 97.39`}
                transform="rotate(-90 18 18)"
                className={styles.ringProgress}
              />
            </svg>
            <span className={styles.ringLabel}>{Math.round(ringPercent)}%</span>
          </div>
        )}
      </div>

      {delta !== undefined && (
        <div className={styles.delta}>
          <DeltaIcon size={12} className={delta > 0 ? styles.deltaUp : delta < 0 ? styles.deltaDown : ''} />
          <span className={delta > 0 ? styles.deltaUp : delta < 0 ? styles.deltaDown : styles.deltaFlat}>
            {Math.abs(delta).toFixed(1)}% vs last hr
          </span>
        </div>
      )}
    </div>
  );
}

export default function KPICards({ stats, currentSample }) {
  if (!stats) return null;

  const latencyVal = parseFloat(stats.currentLatency);
  const latencyStatus = latencyVal <= 35 ? 'success' : latencyVal <= 45 ? 'warning' : 'danger';
  const defectRate = parseFloat(stats.defectRate);
  const defectStatus = defectRate <= 5 ? 'success' : defectRate <= 10 ? 'warning' : 'danger';

  return (
    <div className={styles.container} id="kpi-cards">
      <KPICard
        icon={Package}
        label="Throughput"
        value={currentSample.throughput || stats.avgThroughput}
        unit="pkg/min"
        delta={2.3}
        status="success"
        id="kpi-throughput"
      />
      <KPICard
        icon={AlertTriangle}
        label="Defect Rate"
        value={stats.defectRate}
        unit="%"
        delta={-0.5}
        status={defectStatus}
        id="kpi-defect-rate"
      />
      <KPICard
        icon={Zap}
        label="Avg Latency"
        value={stats.currentLatency}
        unit="ms"
        status={latencyStatus}
        ringPercent={Math.min(100, (latencyVal / 45) * 100)}
        id="kpi-latency"
      />
    </div>
  );
}
