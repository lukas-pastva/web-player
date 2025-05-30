import React, { useEffect, useState, useMemo } from "react";
import {
  startOfToday,
  differenceInCalendarDays,
  addDays,
} from "date-fns";

import Header        from "../../../components/Header.jsx";
import api           from "../api.js";
import WeightForm    from "../components/WeightForm.jsx";
import WeightTable   from "../components/WeightTable.jsx";
import WeightChart   from "../components/WeightChart.jsx";
import { loadConfig } from "../../../config.js";

/* ── simple piece-wise growth model (0-12 m) ──────────────────────────
 * Approximate WHO girl standards centred on birth weight.
 * • 0-3 m  ~ +30 g/day
 * • 4-6 m  ~ +20 g/day
 * • 7-12 m ~ +10 g/day
 */
function expectedWeight(birthGrams, ageDays) {
  if (!birthGrams) return null;
  if (ageDays <= 90)   return birthGrams + ageDays * 30;
  if (ageDays <= 180)  return birthGrams + 90 * 30 + (ageDays - 90)  * 20;
  /* 181-365 */
  return birthGrams + 90 * 30 + 90 * 20 + (ageDays - 180) * 10;
}

export default function WeightDashboard() {
  const { birthTs: birthTsRaw, birthWeightGrams } = loadConfig();
  const birthDate   = birthTsRaw ? new Date(birthTsRaw) : null;
  const initWeight  = Number.isFinite(birthWeightGrams) ? birthWeightGrams : 3500;

  const [weights, setWeights] = useState([]);
  const [err,     setErr]     = useState("");

  /* ------------------------------------------------------------------ */
  /*  CRUD helpers                                                      */
  /* ------------------------------------------------------------------ */
  const reload = () =>
    api.listWeights().then(setWeights).catch(e => setErr(e.message));
  useEffect(reload, []);

  const handleSave   = p      => api.insertWeight(p)   .then(reload).catch(e => setErr(e.message));
  const handleUpdate = (id,p) => api.updateWeight(id,p).then(reload).catch(e => setErr(e.message));
  const handleDelete = id     => api.deleteWeight(id)  .then(reload).catch(e => setErr(e.message));

  /* ------------------------------------------------------------------ */
  /*  Build *continuous* day-by-day series for the chart                */
  /* ------------------------------------------------------------------ */
  const { labels, weightSeries, normal, over, under } = useMemo(() => {
    /* nothing recorded yet → empty chart */
    if (weights.length === 0) {
      return { labels: [], weightSeries: [], normal: [], over: [], under: [] };
    }

    /* map for O(1) look-up of recorded weights */
    const byDay = Object.fromEntries(
      weights.map(w => [w.measuredAt, w.weightGrams])
    );

    /* timeline bounds: first recorded day (or birth) → today */
    const start = birthDate ?? new Date(weights[0].measuredAt);
    const end   = startOfToday();
    const days  = differenceInCalendarDays(end, start) + 1;

    const L = [];
    const S = [];
    const N = [];
    const O = [];
    const U = [];

    for (let i = 0; i < days; i++) {
      const d      = addDays(start, i);
      const isoDay = d.toISOString().slice(0, 10);   // YYYY-MM-DD

      L.push(isoDay);
      S.push(byDay[isoDay] ?? null);                 // ⟵ null = gap in the line

      if (birthDate && initWeight) {
        const age = differenceInCalendarDays(d, birthDate);
        const rec = expectedWeight(initWeight, age);
        N.push(rec ?? null);
        O.push(rec ? Math.round(rec * 1.10) : null); // +10 %
        U.push(rec ? Math.round(rec * 0.90) : null); // –10 %
      } else {
        N.push(null); O.push(null); U.push(null);
      }
    }

    return { labels: L, weightSeries: S, normal: N, over: O, under: U };
  }, [weights, birthDate, initWeight]);

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */
  return (
    <>
      <Header />

      {err && <p style={{ color:"#c00", padding:"0 1rem" }}>{err}</p>}

      <main>
        <WeightForm onSave={handleSave} defaultDate={startOfToday()} />

        <WeightChart
          labels={labels}
          weights={weightSeries}
          normal={normal}
          over={over}
          under={under}
        />

        <WeightTable
          rows={weights}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      </main>
    </>
  );
}
