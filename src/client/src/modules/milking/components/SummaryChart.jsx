import React, { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, TimeScale,
  BarElement, PointElement, LineElement, Tooltip, Legend,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { startOfDay, endOfDay } from "date-fns";
import { accentColor } from "../../../theme.js";
import { buildTypeMeta, ORDER as FEED_TYPES } from "../../../feedTypes.js";

ChartJS.register(
  CategoryScale, LinearScale, TimeScale,
  BarElement, PointElement, LineElement,
  Tooltip, Legend,
);

const TYPE_META = buildTypeMeta();

export default function SummaryChart({ feeds = [], recommended = 0 }) {
  const {
    barDataByType, cumulativeLine, startTs, endTs,
  } = useMemo(() => {
    const baseDate = feeds.length ? new Date(feeds[0].fedAt) : new Date();
    const dayStart = startOfDay(baseDate);
    const dayEnd   = endOfDay(baseDate);

    const byType  = Object.fromEntries(FEED_TYPES.map(k=>[k,[]]));
    const cumLine = [];
    let running   = 0;

    [...feeds].sort((a,b)=>new Date(a.fedAt)-new Date(b.fedAt))
      .forEach(({ fedAt, feedingType, amountMl }) => {
        const ts = new Date(fedAt);
        byType[feedingType].push({ x:ts, y:amountMl });
        running += amountMl;
        cumLine.push({ x:ts, y:running });
      });

    if (cumLine.length === 0) cumLine.push({ x:dayStart, y:0 });

    return { barDataByType:byType, cumulativeLine:cumLine,
             startTs:dayStart, endTs:dayEnd };
  }, [feeds]);

  const accent = accentColor();

  /* bar datasets in canonical order */
  const barSets = FEED_TYPES.map(code => ({
    type           : "bar",
    label          : TYPE_META[code].lbl,
    data           : barDataByType[code],
    backgroundColor: TYPE_META[code].c,
    barThickness   : 8,
    borderSkipped  : false,
    yAxisID        : "y",
    order          : 2,
  }));

  const datasets = [
    ...barSets,
    {
      type           : "line",
      label          : "Cumulative total",
      data           : cumulativeLine,
      borderColor    : accent,
      backgroundColor: accent,
      tension        : 0.25,
      stepped        : true,
      pointRadius    : 3,
      yAxisID        : "y",
      order          : 1,
    },
    {
      type       : "line",
      label      : "Recommended",
      data       : [
        { x:startTs, y:recommended },
        { x:endTs,   y:recommended },
      ],
      borderColor: "#9ca3af",
      borderDash : [4,4],
      pointRadius: 0,
      tension    : 0,
      stepped    : true,
      yAxisID    : "y",
      order      : 0,
    },
  ];

  const options = {
    responsive         : true,
    maintainAspectRatio: false,
    interaction        : { mode:"index", intersect:false },
    plugins            : { legend:{ position:"top" } },
    scales             : {
      y:{ beginAtZero:true, stacked:true, title:{ display:true, text:"ml" }},
      x:{
        type:"time",
        time:{ unit:"hour", displayFormats:{ hour:"HH:mm" } },
        min:startTs, max:endTs,
        title:{ display:true, text:"Time of day" },
      },
    },
  };

  return (
    <>
      <h3>Intake over the day</h3>
      <div style={{ height:320 }}>
        <Bar data={{ datasets }} options={options} />
      </div>
    </>
  );
}
