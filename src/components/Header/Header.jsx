import { Activity, Gauge, Clock, Radio, Zap, AlertTriangle, Shield } from 'lucide-react';
import styles from './Header.module.css';

function formatUptime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getLatencyStatus(latency) {
  const val = parseFloat(latency);
  if (val <= 35) return 'success';
  if (val <= 45) return 'warning';
  return 'danger';
}

const MODE_COLORS = {
  PRODUCTION: 'var(--status-success)',
  CALIBRATING: 'var(--status-warning)',
  MAINTENANCE: 'var(--text-muted)',
};

export default function Header({ stats }) {
  if (!stats) return null;

  const latencyStatus = getLatencyStatus(stats.currentLatency);

  return (
    <header className={styles.header} id="pdds-header">
      <div className={styles.brand}>
        <div className={styles.logoWrap}>
          <Shield size={22} className={styles.logoIcon} />
        </div>
        <div className={styles.brandText}>
          <h1 className={styles.title}>PDDS</h1>
          <span className={styles.subtitle}>Package Damage Detection System</span>
        </div>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric} id="header-line-speed">
          <Gauge size={14} className={styles.metricIcon} />
          <span className={styles.metricLabel}>Line Speed</span>
          <span className={`${styles.metricValue} mono`}>{stats.lineSpeed} <small>m/s</small></span>
        </div>

        <div className={styles.divider} />

        <div className={styles.metric} id="header-uptime">
          <Clock size={14} className={styles.metricIcon} />
          <span className={styles.metricLabel}>Uptime</span>
          <span className={`${styles.metricValue} mono`}>{formatUptime(stats.uptime)}</span>
        </div>

        <div className={styles.divider} />

        <div className={styles.metric} id="header-latency">
          <Zap size={14} className={styles.metricIcon} />
          <span className={styles.metricLabel}>Latency</span>
          <span className={`${styles.metricValue} mono ${styles[latencyStatus]}`}>
            {stats.currentLatency} <small>ms</small>
          </span>
        </div>

        <div className={styles.divider} />

        <div className={styles.metric} id="header-total-packages">
          <Activity size={14} className={styles.metricIcon} />
          <span className={styles.metricLabel}>Processed</span>
          <span className={`${styles.metricValue} mono`}>{stats.totalPackages.toLocaleString()}</span>
        </div>
      </div>

      <div className={styles.status}>
        <div
          className={styles.modeBadge}
          style={{ '--mode-color': MODE_COLORS[stats.mode] || MODE_COLORS.PRODUCTION }}
          id="header-mode-badge"
        >
          <Radio size={10} />
          <span>{stats.mode}</span>
        </div>

        {stats.inBurst && (
          <div className={`status-badge status-badge--danger`} id="header-burst-alert">
            <AlertTriangle size={10} />
            BURST
          </div>
        )}

        <div className={styles.liveIndicator} id="header-live-indicator">
          <div className={stats.isRunning ? 'live-dot' : 'live-dot live-dot--danger'} />
          <span className={styles.liveText}>{stats.isRunning ? 'LIVE' : 'PAUSED'}</span>
        </div>
      </div>
    </header>
  );
}
