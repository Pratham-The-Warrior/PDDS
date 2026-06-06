import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, XCircle, Info, Radio, Brain } from 'lucide-react';
import styles from './EventLog.module.css';

const TYPE_ICONS = {
  DETECTION: AlertCircle,
  REJECT: XCircle,
  ALERT: AlertCircle,
  SYSTEM: Info,
  MLOPS: Brain,
};

const TYPE_COLORS = {
  DETECTION: 'var(--status-warning)',
  REJECT: 'var(--accent-cyan)',
  ALERT: 'var(--status-danger)',
  SYSTEM: 'var(--text-muted)',
  MLOPS: 'var(--accent-purple)',
};

const SEVERITY_COLORS = {
  info: 'var(--accent-cyan)',
  warning: 'var(--status-warning)',
  critical: 'var(--status-danger)',
};

function formatTimestamp(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

export default function EventLog({ events }) {
  const scrollRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-scroll unless hovered
  useEffect(() => {
    if (!isHovered && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events, isHovered]);

  return (
    <div className={`glass-card ${styles.container}`} id="event-log">
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Radio size={12} className={styles.headerIcon} />
          <span className="section-label">Live Event Stream</span>
        </div>
        <span className={`${styles.count} mono`}>{events.length} events</span>
      </div>

      <div
        className={styles.logList}
        ref={scrollRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <AnimatePresence initial={false}>
          {events.map((event) => {
            const Icon = TYPE_ICONS[event.type] || Info;
            return (
              <motion.div
                key={event.id}
                className={styles.logEntry}
                initial={{ opacity: 0, x: 20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <span className={`${styles.timestamp} mono`}>{formatTimestamp(event.timestamp)}</span>
                <Icon
                  size={12}
                  className={styles.typeIcon}
                  style={{ color: TYPE_COLORS[event.type] }}
                />
                <span
                  className={styles.severityBadge}
                  style={{
                    color: SEVERITY_COLORS[event.severity],
                    background: `color-mix(in srgb, ${SEVERITY_COLORS[event.severity]} 12%, transparent)`,
                  }}
                >
                  {event.severity}
                </span>
                <span className={styles.message}>{event.message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {isHovered && (
        <div className={styles.pausedBanner}>
          SCROLL PAUSED — hover to read
        </div>
      )}
    </div>
  );
}
