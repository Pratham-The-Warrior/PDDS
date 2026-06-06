import { useState, useEffect, useRef, useCallback } from 'react';
import { PackageSimulator } from './PackageSimulator';

export function useSimulation(tickInterval = 500, timeSeriesInterval = 5000) {
  const simulatorRef = useRef(null);
  const [packages, setPackages] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [defectBreakdown, setDefectBreakdown] = useState([]);
  const [confidenceHistogram, setConfidenceHistogram] = useState([]);
  const [throughputHistory, setThroughputHistory] = useState([]);
  const [latencyHistory, setLatencyHistory] = useState([]);
  const [defectRateHistory, setDefectRateHistory] = useState([]);
  const [currentSample, setCurrentSample] = useState({ throughput: 0, defectRate: 0, avgLatency: 28 });

  // Initialize simulator
  if (!simulatorRef.current) {
    simulatorRef.current = new PackageSimulator();
  }

  useEffect(() => {
    const sim = simulatorRef.current;

    // Main tick loop
    const tickId = setInterval(() => {
      sim.tick(tickInterval);

      setPackages([...sim.packages]);
      setEvents([...sim.events]);
      setStats(sim.getStats());
      setDefectBreakdown(sim.getDefectBreakdown());
      setConfidenceHistogram(sim.getConfidenceHistogram());
    }, tickInterval);

    // Time-series sampling loop
    const tsId = setInterval(() => {
      const sample = sim.sampleTimeSeries();
      setCurrentSample(sample);
      setThroughputHistory([...sim.throughputHistory]);
      setLatencyHistory([...sim.latencyHistory]);
      setDefectRateHistory([...sim.defectRateHistory]);
    }, timeSeriesInterval);

    // Initial seed — run a few ticks to populate data
    for (let i = 0; i < 10; i++) {
      sim.tick(500);
    }
    sim.sampleTimeSeries();
    setPackages([...sim.packages]);
    setEvents([...sim.events]);
    setStats(sim.getStats());
    setDefectBreakdown(sim.getDefectBreakdown());
    setConfidenceHistogram(sim.getConfidenceHistogram());
    setThroughputHistory([...sim.throughputHistory]);
    setLatencyHistory([...sim.latencyHistory]);
    setDefectRateHistory([...sim.defectRateHistory]);

    return () => {
      clearInterval(tickId);
      clearInterval(tsId);
    };
  }, [tickInterval, timeSeriesInterval]);

  const toggleRunning = useCallback(() => {
    const sim = simulatorRef.current;
    sim.state.isRunning = !sim.state.isRunning;
    setStats(sim.getStats());
  }, []);

  return {
    packages,
    events,
    stats,
    defectBreakdown,
    confidenceHistogram,
    throughputHistory,
    latencyHistory,
    defectRateHistory,
    currentSample,
    toggleRunning,
  };
}
