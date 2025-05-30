import React, { useState } from "react";
import { formatISO, format } from "date-fns";

/**
 * One-line form to record baby's weight with animated feedback.
 */
export default function WeightForm({ onSave, defaultDate = new Date() }) {
  const [grams, setGrams]   = useState("");
  const [date, setDate]     = useState(format(defaultDate, "yyyy-MM-dd"));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!grams) return;

    setSaving(true);

    await onSave({
      measuredAt : formatISO(new Date(date), { representation: "date" }),
      weightGrams: Number(grams),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    setGrams("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add weight</h3>
      <div style={{ display:"flex", gap:".7rem", alignItems:"center", flexWrap:"wrap" }}>
        <input
          type="number"
          placeholder="g"
          value={grams}
          onChange={e => setGrams(e.target.value)}
          min={0}
          style={{ width:120 }}
          required
        />
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
        />
        <button className="btn" disabled={saving}>
          {saving ? <span className="spinner"></span> : "Save"}
        </button>
        {saved && <span className="msg-success" role="status">✓ Saved</span>}
      </div>
    </form>
  );
}
