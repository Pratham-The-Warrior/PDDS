import { useState, useEffect, useRef } from 'react';
import { Video, Aperture } from 'lucide-react';
import styles from './CameraGrid.module.css';

const CAMERA_CONFIGS = [
  { id: 'CAM-01', label: 'Top-Down Overview', angle: 'Bird\'s Eye', fov: '120°' },
  { id: 'CAM-02', label: 'Side Profile Left', angle: 'Left Lateral', fov: '90°' },
  { id: 'CAM-03', label: 'Side Profile Right', angle: 'Right Lateral', fov: '90°' },
  { id: 'CAM-04', label: 'Front Approach', angle: 'Frontal', fov: '110°' },
];

function CameraFeed({ config, events, packages }) {
  const [flash, setFlash] = useState(false);
  const [lastDetection, setLastDetection] = useState(null);
  const frameCountRef = useRef(0);

  // Check if any recent package was from this camera
  useEffect(() => {
    const recentDamaged = packages.find(
      p => p.isDamaged && p.camera === config.id && Date.now() - p.timestamp < 2000
    );
    if (recentDamaged && recentDamaged.id !== lastDetection?.id) {
      setFlash(true);
      setLastDetection(recentDamaged);
      const timer = setTimeout(() => setFlash(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [packages, config.id]);

  // Simulated FPS counter
  useEffect(() => {
    const interval = setInterval(() => {
      frameCountRef.current = 58 + Math.floor(Math.random() * 4);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`${styles.feed} ${flash ? styles.feedFlash : ''}`} id={`camera-${config.id}`}>
      {/* Simulated feed background */}
      <div className={styles.feedCanvas}>
        <div className={styles.grid} />
        <div className={styles.scanline} />

        {/* Simulated bounding box on detection */}
        {flash && lastDetection && (
          <div className={styles.boundingBox}>
            <span className={styles.boxLabel}>
              {lastDetection.defect?.label} ({(lastDetection.confidence * 100).toFixed(0)}%)
            </span>
          </div>
        )}

        {/* Conveyor lines */}
        <div className={styles.conveyorLines}>
          <div className={styles.conveyorLine} />
          <div className={styles.conveyorLine} />
        </div>
      </div>

      {/* Camera HUD */}
      <div className={styles.hud}>
        <div className={styles.hudTopLeft}>
          <div className={styles.recDot} />
          <span className={styles.hudText}>REC</span>
        </div>
        <div className={styles.hudTopRight}>
          <span className={styles.hudText}>{frameCountRef.current || 60} FPS</span>
        </div>
      </div>

      <div className={styles.hudBottom}>
        <div className={styles.hudBottomLeft}>
          <Video size={10} />
          <span className={styles.camId}>{config.id}</span>
        </div>
        <div className={styles.hudBottomRight}>
          <Aperture size={10} />
          <span className={styles.hudText}>{config.fov}</span>
        </div>
      </div>

      <div className={styles.camLabel}>{config.label}</div>
    </div>
  );
}

export default function CameraGrid({ packages, events }) {
  return (
    <div className={`glass-card ${styles.container}`} id="camera-grid">
      <div className={styles.header}>
        <span className="section-label">Camera Array</span>
        <span className={styles.syncBadge}>
          <div className="live-dot" style={{ width: 6, height: 6 }} />
          SYNCED
        </span>
      </div>
      <div className={styles.grid_layout}>
        {CAMERA_CONFIGS.map(config => (
          <CameraFeed
            key={config.id}
            config={config}
            events={events}
            packages={packages}
          />
        ))}
      </div>
    </div>
  );
}
