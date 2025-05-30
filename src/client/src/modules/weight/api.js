async function json(p) {
    const r = await p;
    if (r.status === 204) return null;
    if (r.ok) return r.json();
    throw new Error(`HTTP ${r.status} – ${await r.text()}`);
  }
  
  export default {
    listWeights (from, to) {                       // both optional
      const q = [];
      if (from) q.push(`from=${from}`);
      if (to)   q.push(`to=${to}`);
      const qs = q.length ? "?" + q.join("&") : "";
      return json(fetch(`/api/weight/weights${qs}`));
    },
  
    insertWeight(payload) {
      return json(fetch("/api/weight/weights", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify(payload),
      }));
    },
  
    updateWeight(id, payload) {
      return json(fetch(`/api/weight/weights/${id}`, {
        method : "PUT",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify(payload),
      }));
    },
  
    deleteWeight(id) {
      return json(fetch(`/api/weight/weights/${id}`, { method: "DELETE" }));
    },
  };
  