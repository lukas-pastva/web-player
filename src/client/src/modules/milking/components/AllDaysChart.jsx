import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Title, Tooltip, Legend,
} from "chart.js";
import { accentColor } from "../../../theme.js";
import { buildTypeMeta, ORDER as FEED_TYPES } from "../../../feedTypes.js";

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  PointElement,  LineElement, Title, Tooltip, Legend,
);

/* colour + label map from the single source */
const TYPE_META = buildTypeMeta();

export default function AllDaysChart({
  labels      = [],
  stacks      = {},      // { FEED_TYPE:[…] }
  recommended = [],
}) {
  const accent = accentColor();

  /* bar datasets in canonical order */
  const datasets = FEED_TYPES.map(code => ({
    type           : "bar",
    label          : TYPE_META[code].lbl,
    data           : stacks[code] || labels.map(()=>0),
    backgroundColor: TYPE_META[code].c,
    stack          : "feeds",
    yAxisID        : "y",
  }));

  /* total line */
  const totals = labels.map((_,i)=>
    FEED_TYPES.reduce((s,k)=>s+(stacks[k]?.[i]||0),0)
  );
  datasets.push({
    type           : "line",
    label          : "Total",
    data           : totals,
    borderColor    : accent,
    backgroundColor: accent,
    tension        : 0.25,
    pointRadius    : 3,
    yAxisID        : "y",
  });

  /* recommended dotted line (hidden axis) */
  datasets.push({
    type       : "line",
    label      : "Recommended",
    data       : recommended,
    borderColor: "#9ca3af",
    borderDash : [4,4],
    pointRadius: 2,
    tension    : 0.25,
    yAxisID    : "rec",
  });

  const data = { labels, datasets };

  const options = {
    responsive         : true,
    maintainAspectRatio: false,
    interaction        : { mode:"index", intersect:false },
    plugins            : { legend:{ position:"top" } },
    scales             : {
      y  : { stacked:true, beginAtZero:true },
      rec: { display:false, beginAtZero:true },
    },
  };

  return (
    <div className="card" style={{ height:420 }}>
      <h3>Intake per day</h3>
      <Bar data={data} options={options} />
    </div>
  );
}
