import { useEffect, useMemo, useState } from "react";
// FIX: this file lives in src/components/DataDashboardView/, so go up two levels
import client, { baseUrl } from "../../api/client";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Legend, RadialBarChart, RadialBar
} from "recharts";
import styles from "./DataDashboardView.module.css";

/**
 * DataDashboardView - Pro dashboard version
 * - KPI tiles
 * - Device & Type selector
 * - Multi gauges for types (RadialBarChart)
 * - Time-series chart
 * - Auto refresh
 */
export default function DataDashboardView() {
  const [metrics, setMetrics]   = useState([]);            // aggregated per (mac, type)
  const [series, setSeries]     = useState([]);            // timeseries for selected (mac,type)
  const [selectedMac, setMac]   = useState("");
  const [selectedType, setType] = useState("");
  const [loading, setLoading]   = useState(false);
  const [refresh, setRefresh]   = useState(false);         // auto refresh
  const [intervalMs, setMs]     = useState(5000);

  // load metrics
  useEffect(() => {
    loadMetrics();
  }, []);

  // auto refresh metrics
  useEffect(() => {
    if (!refresh) return;
    const t = setInterval(loadMetrics, intervalMs);
    return () => clearInterval(t);
  }, [refresh, intervalMs]);

  // fetch timeseries for selection
  useEffect(() => {
    if (!selectedMac || !selectedType) return;
    setLoading(true);
    client.get("/device/data", { params: { mac: selectedMac, limit: 600 } })
      .then(res => {
        const rows = (res?.data?.data ?? []).filter(r => r.type === selectedType);
        setSeries(rows);
      })
      .finally(() => setLoading(false));
  }, [selectedMac, selectedType]);

  const loadMetrics = () => {
    client.get("/device/metrics")
      .then(res => setMetrics(res?.data?.data ?? []))
      .catch(err => console.error("metrics error:", err));
  };

  // group by device
  const byDevice = useMemo(() => {
    const map = new Map(); // mac -> [{...metric}]
    for (const m of metrics) {
      if (!map.has(m.mac)) map.set(m.mac, []);
      map.get(m.mac).push(m);
    }
    return map;
  }, [metrics]);

  const allDevices = useMemo(() => Array.from(byDevice.keys()), [byDevice]);

  // pick default selection after first metrics load
  useEffect(() => {
    if (!selectedMac && allDevices.length) {
      setMac(allDevices[0]);
    }
  }, [allDevices, selectedMac]);

  const typesForSelected = useMemo(() => {
    if (!selectedMac) return [];
    return (byDevice.get(selectedMac) ?? []).map(x => x.type);
  }, [byDevice, selectedMac]);

  useEffect(() => {
    if (!selectedType && typesForSelected.length) {
      setType(typesForSelected[0]);
    }
  }, [typesForSelected, selectedType]);

  // KPI: totals
  const totalDevices = allDevices.length;
  const totalPoints  = metrics.reduce((acc, m) => acc + (m.count || 0), 0);
  const lastUpdated  = useMemo(() => {
    let latest = null;
    for (const m of metrics) {
      if (m.latest?.ts) {
        const ts = new Date(m.latest.ts).getTime();
        if (!latest || ts > latest) latest = ts;
      }
    }
    return latest ? new Date(latest).toLocaleString() : "—";
  }, [metrics]);

  // Gauges: build for selected device (one gauge per type)
  const gaugesForSelected = useMemo(() => {
    if (!selectedMac) return [];
    const items = byDevice.get(selectedMac) ?? [];
    return items.map((m) => {
      // normalize needle in [0, 100] using min-max
      const min = isNum(m.min) ? m.min : 0;
      const max = isNum(m.max) ? m.max : 100;
      const val = isNum(m.latest?.value) ? Number(m.latest.value) : 0;
      const range = Math.max(1e-9, max - min);
      const pct = ((val - min) / range) * 100;
      return {
        type: m.type,
        value: clamp(pct, 0, 100),
        display: isNum(m.latest?.value) ? m.latest.value : "—",
        min, max,
        count: m.count || 0,
        ts: m.latest?.ts ? new Date(m.latest.ts).toLocaleString() : "—",
      };
    });
  }, [byDevice, selectedMac]);

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>IoT Data Dashboard</h1>
          <div className={styles.api}>API: {baseUrl}</div>
        </div>

        <div className={styles.headerRight}>
          <label className={styles.inline}>
            <input
              type="checkbox"
              checked={refresh}
              onChange={(e) => setRefresh(e.target.checked)}
            />
            <span> Auto refresh</span>
          </label>
          <select
            value={intervalMs}
            onChange={(e) => setMs(Number(e.target.value))}
            className={styles.select}
            title="Refresh interval"
          >
            <option value={3000}>3s</option>
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className={styles.kpiRow}>
        <KpiCard label="Devices" value={totalDevices} />
        <KpiCard label="Datapoints" value={totalPoints} />
        <KpiCard label="Last updated" value={lastUpdated} />
      </div>

      {/* Selectors */}
      <div className={styles.filters}>
        <div className={styles.filter}>
          <div className={styles.filterLabel}>Device</div>
          <select
            className={styles.select}
            value={selectedMac}
            onChange={(e) => { setMac(e.target.value); setType(""); }}
          >
            {allDevices.length === 0 ? (
              <option value="">No devices</option>
            ) : (
              allDevices.map(mac => <option key={mac} value={mac}>{mac}</option>)
            )}
          </select>
        </div>

        <div className={styles.filter}>
          <div className={styles.filterLabel}>Type</div>
          <select
            className={styles.select}
            value={selectedType}
            onChange={(e) => setType(e.target.value)}
            disabled={!selectedMac}
          >
            {!selectedMac ? (
              <option value="">—</option>
            ) : typesForSelected.length === 0 ? (
              <option value="">No types</option>
            ) : (
              typesForSelected.map(t => <option key={t} value={t}>{t}</option>)
            )}
          </select>
        </div>
      </div>

      {/* Gauges */}
      <div className={styles.gaugeGrid}>
        {gaugesForSelected.length === 0 ? (
          <div className={styles.placeholder}>No gauges</div>
        ) : (
          gaugesForSelected.map(g => (
            <div key={g.type} className={styles.gaugeCard}>
              <div className={styles.gaugeTitle}>{g.type}</div>
              <ResponsiveContainer width="100%" height={180}>
                <RadialBarChart
                  innerRadius="60%"
                  outerRadius="100%"
                  data={[{ name: g.type, value: g.value }]}
                  startAngle={210}
                  endAngle={-30}
                >
                  <RadialBar dataKey="value" cornerRadius={10} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className={styles.gaugeValue}>
                {String(g.display)} <span className={styles.gaugeUnit}>({Math.round(g.value)}%)</span>
              </div>
              <div className={styles.gaugeMeta}>
                <span>min {fmt(g.min)}</span>
                <span>max {fmt(g.max)}</span>
                <span>{g.count} pts</span>
              </div>
              <div className={styles.gaugeTs}>{g.ts}</div>
            </div>
          ))
        )}
      </div>

      {/* Timeseries */}
      <div className={styles.chartBox}>
        <div className={styles.chartHeader}>
          <div className={styles.chartTitle}>Time Series</div>
          {selectedMac && selectedType && (
            <div className={styles.selection}>({selectedMac} / {selectedType})</div>
          )}
        </div>

        <div className={styles.chartBody}>
          {loading ? (
            <div className={styles.placeholder}>Loading…</div>
          ) : series.length === 0 ? (
            <div className={styles.placeholder}>No data</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="ts"
                  tickFormatter={(v) => new Date(v).toLocaleTimeString()}
                  minTickGap={24}
                />
                <YAxis />
                <Tooltip labelFormatter={(v) => new Date(v).toLocaleString()} />
                <Legend />
                <Line type="monotone" dataKey="value" name={selectedType} dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value }) {
  return (
    <div className={styles.kpiCard}>
      <div className={styles.kpiLabel}>{label}</div>
      <div className={styles.kpiValue}>{value}</div>
    </div>
  );
}

function isNum(n) {
  return typeof n === "number" && !Number.isNaN(n);
}
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function fmt(n) {
  return isNum(n) ? n.toFixed(2) : "—";
}
