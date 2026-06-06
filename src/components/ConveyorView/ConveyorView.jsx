import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ConveyorView.module.css';

const BELT_WIDTH = 100; // percentage

function getPackageColor(pkg) {
  if (!pkg.isDamaged) return 'var(--status-success)';
  if (pkg.confidence < 0.6) return 'var(--status-warning)';
  return 'var(--status-danger)';
}

function getDefectLabel(pkg) {
  if (!pkg.isDamaged || !pkg.defect) return null;
  return pkg.defect.label;
}

export default function ConveyorView({ packages }) {
  // Assign positions to packages for animation
  const positionedPackages = useMemo(() => {
    return packages.map((pkg, i) => ({
      ...pkg,
      xPos: ((i / Math.max(packages.length, 1)) * 85) + 5, // 5-90% range
    }));
  }, [packages]);

  return (
    <div className={`glass-card ${styles.container}`} id="conveyor-view">
      <div className={styles.header}>
        <span className="section-label">Live Conveyor View</span>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: 'var(--status-success)' }} /> Clean
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: 'var(--status-warning)' }} /> Low Conf.
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: 'var(--status-danger)' }} /> Damaged
          </span>
        </div>
      </div>

      <div className={styles.beltArea}>
        {/* Conveyor Belt */}
        <div className={styles.belt}>
          <div className={styles.beltTexture} />
          <div className={styles.beltRailTop} />
          <div className={styles.beltRailBottom} />

          {/* Rollers */}
          <div className={styles.rollers}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className={styles.roller} />
            ))}
          </div>

          {/* Packages */}
          <AnimatePresence mode="popLayout">
            {positionedPackages.map((pkg) => (
              <motion.div
                key={pkg.id}
                className={styles.package}
                style={{
                  '--pkg-color': getPackageColor(pkg),
                  left: `${pkg.xPos}%`,
                }}
                initial={{ x: -60, opacity: 0, scale: 0.8 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: pkg.isDamaged ? 40 : 0, x: pkg.isDamaged ? 0 : 60, scale: 0.7 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                layout
              >
                <div className={styles.packageBody}>
                  <div className={styles.packageTop} />
                  <div className={styles.packageFront} />
                  <div className={styles.packageSide} />
                </div>
                {pkg.isDamaged && (
                  <div className={styles.defectMarker}>
                    <span className={styles.defectPulse} />
                  </div>
                )}
                <span className={styles.packageLabel}>{pkg.id.slice(-4)}</span>
                {pkg.isDamaged && getDefectLabel(pkg) && (
                  <motion.span
                    className={styles.defectTag}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {getDefectLabel(pkg)}
                  </motion.span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Reject Diverter */}
        <div className={styles.rejectZone}>
          <div className={styles.rejectArrow}>↓</div>
          <span className={styles.rejectLabel}>REJECT</span>
        </div>

        {/* Camera indicators */}
        <div className={styles.cameraIndicators}>
          {['CAM-01', 'CAM-02', 'CAM-03', 'CAM-04'].map((cam, i) => (
            <div
              key={cam}
              className={styles.cameraPointer}
              style={{ left: `${15 + i * 22}%` }}
            >
              <div className={styles.cameraIcon}>▼</div>
              <span className={styles.cameraId}>{cam}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
