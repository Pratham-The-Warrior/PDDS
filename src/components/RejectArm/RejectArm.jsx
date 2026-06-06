import { Crosshair, Gauge } from 'lucide-react';
import styles from './RejectArm.module.css';

const STATUS_CONFIG = {
  ARMED: { color: 'var(--status-success)', label: 'ARMED' },
  FIRING: { color: 'var(--status-danger)', label: 'FIRING' },
  COOLDOWN: { color: 'var(--status-warning)', label: 'COOLDOWN' },
};

function formatTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function ArmCard({ arm }) {
  const config = STATUS_CONFIG[arm.status] || STATUS_CONFIG.ARMED;
  const isFiring = arm.status === 'FIRING';

  return (
    <div className={`${styles.arm} ${isFiring ? styles.armFiring : ''}`} id={`reject-arm-${arm.id}`}>
      <div className={styles.armHeader}>
        <span className={styles.armId}>LANE {arm.id}</span>
        <span
          className={styles.statusDot}
          style={{ background: config.color }}
        />
      </div>

      <div
        className={styles.statusBadge}
        style={{
          color: config.color,
          background: `color-mix(in srgb, ${config.color} 12%, transparent)`,
        }}
      >
        {config.label}
      </div>

      <div className={styles.armStats}>
        <div className={styles.statRow}>
          <Crosshair size={10} className={styles.statIcon} />
          <span className={styles.statLabel}>Actuations</span>
          <span className={`${styles.statValue} mono`}>{arm.actuations}</span>
        </div>
        <div className={styles.statRow}>
          <Gauge size={10} className={styles.statIcon} />
          <span className={styles.statLabel}>Pressure</span>
          <span className={`${styles.statValue} mono`}>{arm.psi.toFixed(0)} <small>PSI</small></span>
        </div>
      </div>

      <div className={styles.lastFire}>
        <span className={styles.lastFireLabel}>Last fire</span>
        <span className={`${styles.lastFireTime} mono`}>{formatTime(arm.lastFire)}</span>
      </div>

      {/* Pressure bar */}
      <div className={styles.pressureBar}>
        <div
          className={styles.pressureFill}
          style={{
            width: `${(arm.psi / 100) * 100}%`,
            background: arm.psi > 90 ? 'var(--status-warning)' : 'var(--accent-cyan)',
          }}
        />
      </div>
    </div>
  );
}

export default function RejectArm({ rejectArms }) {
  if (!rejectArms) return null;

  const totalActuations = rejectArms.reduce((sum, a) => sum + a.actuations, 0);

  return (
    <div className={`glass-card ${styles.container}`} id="reject-arms">
      <div className={styles.header}>
        <span className="section-label">Pneumatic Reject Arms</span>
        <span className={`${styles.totalBadge} mono`}>{totalActuations} total</span>
      </div>
      <div className={styles.arms}>
        {rejectArms.map(arm => (
          <ArmCard key={arm.id} arm={arm} />
        ))}
      </div>
    </div>
  );
}
