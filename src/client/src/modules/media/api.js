/* tiny helper – returns JSON or throws */
async function json(promise) {
    const r = await promise;
    if (r.ok) return r.json();
    throw new Error(`HTTP ${r.status} – ${await r.text()}`);
  }
  
  export default {
    list(path = "") {
      const qs = path ? `?path=${encodeURIComponent(path)}` : "";
      return json(fetch(`/api/media${qs}`));
    },
  };
  