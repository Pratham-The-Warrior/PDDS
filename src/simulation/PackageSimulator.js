/* ============================================================
   PackageSimulator — Stochastic Data Generation Engine
   Generates realistic telemetry for the PDDS dashboard
   ============================================================ */

const DEFECT_TYPES = [
  { type: 'crushed_corner', weight: 0.30, color: '#ff6b6b', label: 'Crushed Corner' },
  { type: 'punctured_surface', weight: 0.20, color: '#ffa726', label: 'Punctured Surface' },
  { type: 'open_flap', weight: 0.20, color: '#ffee58', label: 'Open Flap' },
  { type: 'torn_tape', weight: 0.18, color: '#ab47bc', label: 'Torn Tape' },
  { type: 'liquid_leak', weight: 0.12, color: '#29b6f6', label: 'Liquid Leak' },
];

const CAMERA_IDS = ['CAM-01', 'CAM-02', 'CAM-03', 'CAM-04'];

const SEVERITY_MAP = {
  crushed_corner: 'high',
  punctured_surface: 'critical',
  open_flap: 'medium',
  torn_tape: 'low',
  liquid_leak: 'critical',
};

let idCounter = 0;

function generateId() {
  return `PKG-${String(++idCounter).padStart(6, '0')}`;
}

function generateEventId() {
  return `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Box-Muller transform for normal distribution
function normalRandom(mean, stdDev) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

// Beta distribution sampling (approximate via Jöhnk's algorithm for small params)
function betaRandom(alpha, beta) {
  // Use gamma sampling method
  function gammaRandom(shape) {
    if (shape < 1) {
      return gammaRandom(shape + 1) * Math.pow(Math.random(), 1 / shape);
    }
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    while (true) {
      let x, v;
      do {
        x = normalRandom(0, 1);
        v = Math.pow(1 + c * x, 3);
      } while (v <= 0);
      const u = Math.random();
      if (u < 1 - 0.0331 * x * x * x * x) return d * v;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }
  const ga = gammaRandom(alpha);
  const gb = gammaRandom(beta);
  return ga / (ga + gb);
}

// Weighted random selection
function weightedRandom(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

export class PackageSimulator {
  constructor(config = {}) {
    this.config = {
      basePackagesPerMin: config.basePackagesPerMin || 120,
      baseDefectRate: config.baseDefectRate || 0.08,
      meanLatency: config.meanLatency || 28,
      latencyStdDev: config.latencyStdDev || 6,
      lineSpeed: config.lineSpeed || 2.4,  // m/s
      burstProbability: config.burstProbability || 0.02,
      burstMultiplier: config.burstMultiplier || 3,
      ...config,
    };

    this.state = {
      isRunning: true,
      mode: 'PRODUCTION', // PRODUCTION | CALIBRATING | MAINTENANCE
      uptime: 0,
      totalPackages: 0,
      totalDefects: 0,
      defectCounts: Object.fromEntries(DEFECT_TYPES.map(d => [d.type, 0])),
      rejectArms: [
        { id: 1, status: 'ARMED', actuations: 0, lastFire: null, psi: 85 },
        { id: 2, status: 'ARMED', actuations: 0, lastFire: null, psi: 82 },
        { id: 3, status: 'ARMED', actuations: 0, lastFire: null, psi: 88 },
      ],
      mlops: {
        modelVersion: 'v3.2.1',
        mAP50: 0.943,
        lastRetrained: '2026-06-04T14:30:00Z',
        edgeCaseBuffer: 0,
        edgeCaseBufferMax: 500,
        harvestRate: 0,
        status: 'HEALTHY',
        confidenceHistory: [],
      },
      lineSpeed: 2.4,
      inBurst: false,
      burstRemaining: 0,
    };

    // Rolling data windows
    this.packages = [];           // last 20 packages for conveyor view
    this.events = [];             // last 100 events
    this.throughputHistory = [];  // last 5 min, sampled every 5s
    this.latencyHistory = [];     // last 5 min, sampled every 5s
    this.defectRateHistory = [];  // last 5 min, sampled every 5s

    this._recentPackageCount = 0;
    this._recentDefectCount = 0;
    this._recentLatencies = [];
  }

  tick(deltaMs = 500) {
    if (!this.state.isRunning) return { packages: [], events: [] };

    this.state.uptime += deltaMs;
    const newPackages = [];
    const newEvents = [];

    // Check for burst mode
    if (this.state.burstRemaining > 0) {
      this.state.burstRemaining -= deltaMs;
      if (this.state.burstRemaining <= 0) {
        this.state.inBurst = false;
        newEvents.push(this._createEvent('SYSTEM', 'info', 'Defect burst subsided — returning to normal detection rates'));
      }
    } else if (Math.random() < this.config.burstProbability * (deltaMs / 1000)) {
      this.state.inBurst = true;
      this.state.burstRemaining = 3000 + Math.random() * 5000;
      newEvents.push(this._createEvent('ALERT', 'warning', `⚡ Defect burst detected — elevated damage rate for ${(this.state.burstRemaining / 1000).toFixed(1)}s`));
    }

    // Generate packages based on Poisson rate
    const rate = this.config.basePackagesPerMin / 60; // per second
    const expectedInDelta = rate * (deltaMs / 1000);
    const numPackages = this._poissonSample(expectedInDelta);

    for (let i = 0; i < numPackages; i++) {
      const pkg = this._generatePackage();
      newPackages.push(pkg);
      this.state.totalPackages++;
      this._recentPackageCount++;

      if (pkg.isDamaged) {
        this.state.totalDefects++;
        this._recentDefectCount++;
        this.state.defectCounts[pkg.defect.type]++;

        // Fire reject arm
        const arm = this.state.rejectArms[Math.floor(Math.random() * 3)];
        arm.status = 'FIRING';
        arm.actuations++;
        arm.lastFire = Date.now();
        arm.psi = 80 + Math.random() * 15;
        setTimeout(() => { arm.status = 'ARMED'; }, 800);

        newEvents.push(this._createEvent(
          'DETECTION',
          SEVERITY_MAP[pkg.defect.type] === 'critical' ? 'critical' : 'warning',
          `${pkg.defect.label} detected on ${pkg.id} — confidence: ${(pkg.confidence * 100).toFixed(1)}% — surface degradation: ${(pkg.surfaceDegradation * 100).toFixed(1)}%`
        ));

        newEvents.push(this._createEvent(
          'REJECT',
          'info',
          `Package ${pkg.id} diverted to reject lane ${arm.id} — arm actuation #${arm.actuations}`
        ));

        // MLOps: harvest edge cases
        if (pkg.confidence < 0.7 || (pkg.confidence > 0.4 && pkg.confidence < 0.6)) {
          this.state.mlops.edgeCaseBuffer = Math.min(
            this.state.mlops.edgeCaseBuffer + 1,
            this.state.mlops.edgeCaseBufferMax
          );
        }
      }

      this._recentLatencies.push(pkg.latency);
    }

    // Update packages window (keep last 20)
    this.packages = [...this.packages, ...newPackages].slice(-20);

    // Update events window (keep last 100)
    this.events = [...this.events, ...newEvents].slice(-100);

    // MLOps confidence history
    if (newPackages.length > 0) {
      this.state.mlops.confidenceHistory = [
        ...this.state.mlops.confidenceHistory,
        ...newPackages.map(p => p.confidence)
      ].slice(-200);
    }

    // Periodically vary line speed slightly
    if (Math.random() < 0.05) {
      this.state.lineSpeed = Math.max(1.8, Math.min(3.0,
        this.config.lineSpeed + normalRandom(0, 0.1)
      ));
    }

    // MLOps drift detection
    if (this.state.mlops.edgeCaseBuffer > this.state.mlops.edgeCaseBufferMax * 0.8) {
      this.state.mlops.status = 'RETRAINING_SCHEDULED';
    } else if (this.state.mlops.edgeCaseBuffer > this.state.mlops.edgeCaseBufferMax * 0.5) {
      this.state.mlops.status = 'DRIFT_DETECTED';
    } else {
      this.state.mlops.status = 'HEALTHY';
    }

    // MLOps harvest rate (edge cases per hour)
    this.state.mlops.harvestRate = Math.round(
      (this.state.mlops.edgeCaseBuffer / Math.max(1, this.state.uptime / 3600000)) * 60
    );

    return { packages: newPackages, events: newEvents };
  }

  // Sample stats for time-series (called every ~5s)
  sampleTimeSeries() {
    const now = Date.now();
    const throughput = (this._recentPackageCount / 5) * 60; // extrapolate to per-min
    const defectRate = this._recentPackageCount > 0
      ? (this._recentDefectCount / this._recentPackageCount) * 100
      : 0;
    const avgLatency = this._recentLatencies.length > 0
      ? this._recentLatencies.reduce((a, b) => a + b, 0) / this._recentLatencies.length
      : this.config.meanLatency;

    this.throughputHistory = [...this.throughputHistory, { time: now, value: throughput }].slice(-60);
    this.latencyHistory = [...this.latencyHistory, { time: now, value: avgLatency }].slice(-60);
    this.defectRateHistory = [...this.defectRateHistory, { time: now, value: defectRate }].slice(-60);

    // Reset recent counters
    this._recentPackageCount = 0;
    this._recentDefectCount = 0;
    this._recentLatencies = [];

    return { throughput, defectRate, avgLatency };
  }

  getStats() {
    const uptime = this.state.uptime;
    const totalPkg = this.state.totalPackages;
    const avgThroughput = totalPkg > 0 ? (totalPkg / (uptime / 60000)) : 0;
    const overallDefectRate = totalPkg > 0 ? (this.state.totalDefects / totalPkg) * 100 : 0;
    const recentLatency = this._recentLatencies.length > 0
      ? this._recentLatencies.reduce((a, b) => a + b, 0) / this._recentLatencies.length
      : this.config.meanLatency;

    return {
      uptime,
      totalPackages: totalPkg,
      totalDefects: this.state.totalDefects,
      avgThroughput: Math.round(avgThroughput),
      defectRate: overallDefectRate.toFixed(2),
      currentLatency: recentLatency.toFixed(1),
      lineSpeed: this.state.lineSpeed.toFixed(1),
      mode: this.state.mode,
      isRunning: this.state.isRunning,
      defectCounts: { ...this.state.defectCounts },
      rejectArms: this.state.rejectArms.map(a => ({ ...a })),
      mlops: { ...this.state.mlops },
      inBurst: this.state.inBurst,
    };
  }

  getDefectBreakdown() {
    return DEFECT_TYPES.map(d => ({
      ...d,
      count: this.state.defectCounts[d.type],
    }));
  }

  getConfidenceHistogram() {
    const bins = Array(10).fill(0);
    for (const c of this.state.mlops.confidenceHistory) {
      const idx = Math.min(9, Math.floor(c * 10));
      bins[idx]++;
    }
    return bins.map((count, i) => ({
      range: `${i * 10}-${(i + 1) * 10}%`,
      count,
    }));
  }

  _generatePackage() {
    const defectRate = this.state.inBurst
      ? this.config.baseDefectRate * this.config.burstMultiplier
      : this.config.baseDefectRate;

    const isDamaged = Math.random() < defectRate;
    const defect = isDamaged ? weightedRandom(DEFECT_TYPES) : null;

    // Confidence score: high for clear cases, lower for damaged
    const confidence = isDamaged
      ? Math.max(0.15, Math.min(0.99, betaRandom(6, 2)))
      : Math.max(0.85, Math.min(0.999, betaRandom(12, 1.5)));

    // Latency: normally distributed
    const latency = Math.max(12, Math.min(55, normalRandom(
      this.config.meanLatency,
      this.config.latencyStdDev
    )));

    // Surface degradation ratio for damaged packages
    const surfaceDegradation = isDamaged
      ? Math.max(0.02, Math.min(0.65, betaRandom(2, 5)))
      : 0;

    const camera = CAMERA_IDS[Math.floor(Math.random() * 4)];

    return {
      id: generateId(),
      timestamp: Date.now(),
      isDamaged,
      defect,
      confidence,
      latency: Math.round(latency * 10) / 10,
      surfaceDegradation,
      camera,
      dimensions: {
        l: 20 + Math.random() * 40,
        w: 15 + Math.random() * 30,
        h: 10 + Math.random() * 25,
      },
      position: 0, // 0-100, used for conveyor animation
    };
  }

  _createEvent(type, severity, message) {
    return {
      id: generateEventId(),
      timestamp: Date.now(),
      type, // DETECTION, REJECT, ALERT, SYSTEM, MLOPS
      severity, // info, warning, critical
      message,
    };
  }

  _poissonSample(lambda) {
    // For small lambda, use direct method
    if (lambda < 30) {
      let L = Math.exp(-lambda);
      let k = 0;
      let p = 1;
      do {
        k++;
        p *= Math.random();
      } while (p > L);
      return k - 1;
    }
    // For large lambda, use normal approximation
    return Math.max(0, Math.round(normalRandom(lambda, Math.sqrt(lambda))));
  }
}

export { DEFECT_TYPES, CAMERA_IDS, SEVERITY_MAP };
