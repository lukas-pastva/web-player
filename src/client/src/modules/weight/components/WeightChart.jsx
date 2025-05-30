import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { accentColor } from "../../../theme.js";

ChartJS.register(
  CategoryScale, LinearScale,
  PointElement,  LineElement,
  Title, Tooltip, Legend
);

export default function WeightChart({
  labels = [],
  weights = [],
  normal  = [],         // expected (≈50 th percentile)
  over    = [],         // +10 %
  under   = [],         // –10 %
}) {
  const accent = accentColor();

  const datasets = [
    /* recorded weights */
    {
      label          : "Recorded weight",
      data           : weights,
      borderColor    : accent,
      backgroundColor: accent,
      tension        : 0.25,
      pointRadius    : 4,
      pointHoverRadius:5,
    },
    /* expected */
    {
      label       : "Normal range centre",
      data        : normal,
      borderColor : "#10b981",
      tension     : 0.25,
      pointRadius : 0,
    },
    /* over-weight (+10 %) */
    {
      label       : "Over-weight (≈+10 %)",
      data        : over,
      borderColor : "#dc2626",
      borderDash  : [4,4],
      tension     : 0.25,
      pointRadius : 0,
    },
    /* under-weight (-10 %) */
    {
      label       : "Under-weight (≈-10 %)",
      data        : under,
      borderColor : "#f59e0b",
      borderDash  : [4,4],
      tension     : 0.25,
      pointRadius : 0,
    },
  ];

  const data = { labels, datasets };

  const options = {
    responsive         : true,
    maintainAspectRatio: false,
    plugins            : { legend:{ position:"top" } },
    scales             : {
      x: { title:{ display:true, text:"Date" } },
      y: { title:{ display:true, text:"Grams" } },
    },
  };

  return (
    <div className="card" style={{ height: 300 }}>
      <h3>Weight over time</h3>
      <Line data={data} options={options} />
    </div>
  );
}
