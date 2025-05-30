import React, { useState } from "react";
import { formatISO, parseISO } from "date-fns";

/**
 * Editable (inline) list of weight entries – one per day.
 */
export default function WeightTable({ rows, onUpdate, onDelete }) {
  const [editingId, setEdit]  = useState(null);
  const [formVals, setForm]   = useState({ grams:"", datePart:"" });

  /* ---- edit helpers ---------------------------------------------- */
  function beginEdit(w) {
    setForm({
      grams    : w.weightGrams,
      datePart : w.measuredAt,
    });
    setEdit(w.id);
  }

  async function saveEdit(e) {
    e.preventDefault();
    await onUpdate(editingId, {
      measuredAt : formVals.datePart,
      weightGrams: Number(formVals.grams),
    });
    setEdit(null);
  }

  async function del(id) {
    if (confirm("Delete weight record?")) await onDelete(id);
  }

  /* ---- UI --------------------------------------------------------- */
  return (
    <>
      <h3>Recorded weights</h3>

      {rows.length === 0 && <p>No entries.</p>}

      {rows.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Weight&nbsp;(g)</th>
              {(onUpdate || onDelete) && <th></th>}
            </tr>
          </thead>
          <tbody>
            {rows.map(w => (
              <React.Fragment key={w.id}>
                <tr>
                  <td>{w.measuredAt}</td>
                  <td>{w.weightGrams}</td>
                  {(onUpdate || onDelete) && (
                    <td style={{ whiteSpace:"nowrap" }}>
                      {onUpdate && (
                        <button
                          className="btn-light"
                          onClick={() => beginEdit(w)}
                          style={{ marginRight:".4rem" }}
                        >Edit</button>
                      )}
                      {onDelete && (
                        <button
                          className="btn-light"
                          onClick={() => del(w.id)}
                        >×</button>
                      )}
                    </td>
                  )}
                </tr>

                {editingId === w.id && (
                  <tr>
                    <td colSpan={3}>
                      <form onSubmit={saveEdit} style={{ display:"flex", gap:".5rem", flexWrap:"wrap" }}>
                        <input
                          type="number"
                          value={formVals.grams}
                          onChange={e => setForm({ ...formVals, grams:e.target.value })}
                          min={0}
                          required
                          style={{ width:120 }}
                        />
                        <input
                          type="date"
                          value={formVals.datePart}
                          onChange={e => setForm({ ...formVals, datePart:e.target.value })}
                          required
                        />
                        <button className="btn">Save</button>
                        <button type="button" className="btn-light" onClick={() => setEdit(null)}>
                          Cancel
                        </button>
                      </form>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
