import { useSimulation } from './simulation/useSimulation';
import Header from './components/Header/Header';
import ConveyorView from './components/ConveyorView/ConveyorView';
import CameraGrid from './components/CameraGrid/CameraGrid';
import KPICards from './components/KPICards/KPICards';
import DefectBreakdown from './components/DefectBreakdown/DefectBreakdown';
import RejectArm from './components/RejectArm/RejectArm';
import TimelineCharts from './components/TimelineCharts/TimelineCharts';
import MLOpsPanel from './components/MLOpsPanel/MLOpsPanel';
import EventLog from './components/EventLog/EventLog';
import styles from './App.module.css';

export default function App() {
  const {
    packages,
    events,
    stats,
    defectBreakdown,
    confidenceHistogram,
    throughputHistory,
    latencyHistory,
    defectRateHistory,
    currentSample,
  } = useSimulation(500, 5000);

  return (
    <div className={styles.app}>
      <Header stats={stats} />

      <main className={styles.main}>
        {/* Row 1: Conveyor + Cameras */}
        <div className={styles.row1}>
          <div className={styles.conveyorCol}>
            <ConveyorView packages={packages} />
          </div>
          <div className={styles.cameraCol}>
            <CameraGrid packages={packages} events={events} />
          </div>
        </div>

        {/* Row 2: KPIs full width */}
        <div className={styles.row2}>
          <KPICards stats={stats} currentSample={currentSample} />
        </div>

        {/* Row 2b: Defect + Reject Arms + additional */}
        <div className={styles.row2b}>
          <div className={styles.defectCol}>
            <DefectBreakdown defectBreakdown={defectBreakdown} />
          </div>
          <div className={styles.rejectCol}>
            <RejectArm rejectArms={stats?.rejectArms} />
          </div>
          <div className={styles.mlopsCol}>
            <MLOpsPanel stats={stats} confidenceHistogram={confidenceHistogram} />
          </div>
        </div>

        {/* Row 3: Timeline Charts full width */}
        <div className={styles.row3}>
          <div className={styles.timelineCol}>
            <TimelineCharts
              throughputHistory={throughputHistory}
              latencyHistory={latencyHistory}
              defectRateHistory={defectRateHistory}
            />
          </div>
        </div>

        {/* Row 4: Event Log */}
        <div className={styles.row4}>
          <EventLog events={events} />
        </div>
      </main>
    </div>
  );
}
