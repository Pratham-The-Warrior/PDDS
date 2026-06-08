import { useState, useEffect, useCallback } from 'react';

export function useWebSocket(url = 'ws://localhost:8000/ws/dashboard') {
  const [packages, setPackages] = useState([]);
  const [events, setEvents] = useState([]);
  
  const [stats, setStats] = useState({
    lineSpeed: 2.4,
    uptime: 99.9,
    latency: 28.5,
    processedCount: 0,
    rejectCount: 0,
    isRunning: false,
    mode: 'LIVE',
    modelHealth: 100,
    edgeCasesHarvested: 0,
    driftStatus: 'STABLE',
    rejectArms: [
      { id: 1, status: 'READY', pressure: 85, actuations: 0 },
      { id: 2, status: 'READY', pressure: 82, actuations: 0 },
      { id: 3, status: 'READY', pressure: 88, actuations: 0 }
    ]
  });

  const [defectBreakdown, setDefectBreakdown] = useState([
    { name: 'Crushed Corner', value: 0, color: '#ffab00' },
    { name: 'Punctured', value: 0, color: '#ff3d5a' },
    { name: 'Open Flap', value: 0, color: '#00e5ff' },
    { name: 'Torn Tape', value: 0, color: '#b388ff' },
    { name: 'Liquid Leak', value: 0, color: '#00e676' },
  ]);

  const [confidenceHistogram, setConfidenceHistogram] = useState(
    Array.from({ length: 10 }, (_, i) => ({ bin: `${i * 10}-${i * 10 + 10}%`, count: 0 }))
  );

  const [throughputHistory, setThroughputHistory] = useState([]);
  const [latencyHistory, setLatencyHistory] = useState([]);
  const [defectRateHistory, setDefectRateHistory] = useState([]);
  const [currentSample, setCurrentSample] = useState({ throughput: 0, defectRate: 0, avgLatency: 0 });

  useEffect(() => {
    let ws;
    let reconnectTimer;

    const connect = () => {
      ws = new WebSocket(url);

      ws.onopen = () => {
        setStats(s => ({ ...s, isRunning: true, mode: 'LIVE' }));
        console.log('🔌 Connected to PDDS Backend WebSocket');
        
        setEvents(prev => [{
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString(),
          type: 'SYSTEM',
          severity: 'INFO',
          message: 'Connected to Live Backend',
        }, ...prev].slice(0, 50));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'TICK') {
            // Update stats
            setStats(s => ({
              ...s,
              lineSpeed: 2.4, // Static for now
              uptime: message.stats.uptime,
              latency: message.stats.latency,
            }));
            
            // Accumulate time series
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            setThroughputHistory(prev => [...prev.slice(-20), { time: timeStr, value: message.stats.throughput }]);
            setLatencyHistory(prev => [...prev.slice(-20), { time: timeStr, value: message.stats.latency }]);
            setDefectRateHistory(prev => [...prev.slice(-20), { time: timeStr, value: message.stats.defect_rate }]);
            
            setCurrentSample({
              throughput: message.stats.throughput,
              defectRate: message.stats.defect_rate,
              avgLatency: message.stats.latency
            });
            
          } else if (message.type === 'DETECTION') {
            const data = message.data;
            
            // Update packages for cameras/conveyor
            setPackages(prev => {
              const newPkg = {
                id: data.package_id,
                x: 0, // Simplified conveyor logic
                isDamaged: data.decision === 'REJECT',
                severity: data.severity,
                defects: data.defects,
                cameraId: data.camera
              };
              return [...prev.slice(-10), newPkg];
            });

            // Update stats counts
            setStats(s => {
              const newStats = { ...s, processedCount: s.processedCount + 1 };
              if (data.decision === 'REJECT') {
                newStats.rejectCount += 1;
                // Trigger a reject arm visually
                const laneIdx = Math.floor(Math.random() * 3);
                newStats.rejectArms = [...s.rejectArms];
                newStats.rejectArms[laneIdx] = { 
                  ...newStats.rejectArms[laneIdx], 
                  status: 'FIRING', 
                  actuations: newStats.rejectArms[laneIdx].actuations + 1 
                };
                
                // Reset arm after 500ms
                setTimeout(() => {
                  setStats(curr => {
                    const resetArms = [...curr.rejectArms];
                    resetArms[laneIdx] = { ...resetArms[laneIdx], status: 'READY' };
                    return { ...curr, rejectArms: resetArms };
                  });
                }, 500);
              }
              return newStats;
            });

            // Update Breakdown
            if (data.defects && data.defects.length > 0) {
              setDefectBreakdown(prev => {
                const next = [...prev];
                data.defects.forEach(d => {
                  let idx = 0;
                  if (d.type === 'crushed_corner') idx = 0;
                  else if (d.type === 'punctured_surface') idx = 1;
                  else if (d.type === 'open_flap') idx = 2;
                  else if (d.type === 'torn_tape') idx = 3;
                  else if (d.type === 'liquid_leak') idx = 4;
                  
                  if (next[idx]) next[idx].value += 1;
                });
                return next;
              });

              // Update Confidence Histogram
              setConfidenceHistogram(prev => {
                const next = [...prev];
                data.defects.forEach(d => {
                  const binIdx = Math.min(9, Math.floor(d.confidence * 10));
                  next[binIdx].count += 1;
                });
                return next;
              });
            }

            // Update Event Log
            setEvents(prev => [{
              id: Date.now().toString() + Math.random(),
              timestamp: new Date().toLocaleTimeString(),
              type: data.decision,
              severity: data.severity,
              message: `Package ${data.package_id} detected on ${data.camera}. ${data.defects.length > 0 ? data.defects[0].type : 'Clean'}`,
            }, ...prev].slice(0, 50));
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      ws.onclose = () => {
        setStats(s => ({ ...s, isRunning: false }));
        console.log('🔌 Disconnected from backend. Retrying in 5s...');
        setEvents(prev => [{
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString(),
          type: 'SYSTEM',
          severity: 'CRITICAL',
          message: 'Connection Lost. Retrying...',
        }, ...prev].slice(0, 50));
        
        reconnectTimer = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimer);
    };
  }, [url]);

  const toggleRunning = useCallback(() => console.log('Cannot pause live backend'), []);

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
