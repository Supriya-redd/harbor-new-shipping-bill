// Promise-based mock API. Replace these methods with HTTP requests when a
// backend is available; UI modules should only depend on this interface.
const STORAGE_KEY = "harbor.shipping-bill-drafts.v1";
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const formOptions = {
  exporters: ["Northstar Textiles Pvt. Ltd.", "Aster Components India Pvt. Ltd.", "Meridian Foods & Exports", "Bluewave Marine Products Ltd.", "Cedar Home & Living Pvt. Ltd.", "Evergreen Organics India", "Fable Footwear Exports Pvt. Ltd.", "Golden Harvest Foods Ltd.", "Indigo Looms & Fabrics", "Kite Electronics India Pvt. Ltd.", "Lotus Wellness Exports", "Summit Auto Parts India"],
  countries: [["AE", "United Arab Emirates"], ["AU", "Australia"], ["BD", "Bangladesh"], ["BE", "Belgium"], ["BR", "Brazil"], ["CA", "Canada"], ["CH", "Switzerland"], ["CN", "China"], ["DE", "Germany"], ["DK", "Denmark"], ["EG", "Egypt"], ["ES", "Spain"], ["FR", "France"], ["GB", "United Kingdom"], ["HK", "Hong Kong"], ["ID", "Indonesia"], ["IL", "Israel"], ["IT", "Italy"], ["JP", "Japan"], ["KE", "Kenya"], ["KR", "South Korea"], ["LK", "Sri Lanka"], ["MY", "Malaysia"], ["MX", "Mexico"], ["NG", "Nigeria"], ["NL", "Netherlands"], ["NP", "Nepal"], ["NZ", "New Zealand"], ["OM", "Oman"], ["PH", "Philippines"], ["PK", "Pakistan"], ["QA", "Qatar"], ["SA", "Saudi Arabia"], ["SE", "Sweden"], ["SG", "Singapore"], ["TH", "Thailand"], ["TR", "Türkiye"], ["TW", "Taiwan"], ["US", "United States"], ["VN", "Vietnam"], ["ZA", "South Africa"]].map(([code, name]) => ({ code, name })),
  ports: ["INMUN1 — Mundra", "INNSA1 — Nhava Sheva (JNPT)", "INPAV1 — Pipavav", "INJMB1 — Jamnagar", "INHZA1 — Hazira", "INBOM1 — Mumbai", "INMAA1 — Chennai", "INKAT1 — Kattupalli", "INTUT1 — Tuticorin", "INKRI1 — Krishnapatnam", "INVTZ1 — Visakhapatnam", "INKAK1 — Kakinada", "INKOL1 — Kolkata", "INHAL1 — Haldia", "INCCU4 — Kolkata Air Cargo", "INMAA4 — Chennai Air Cargo", "INBLR4 — Bengaluru Air Cargo", "INDEL4 — Delhi Air Cargo", "INBOM4 — Mumbai Air Cargo", "INHYD4 — Hyderabad Air Cargo", "INCOK4 — Kochi Air Cargo", "INAMD4 — Ahmedabad Air Cargo", "INPNQ4 — Pune Air Cargo", "INLKO4 — Lucknow Air Cargo"],
  transports: ["Sea freight", "Air freight", "Road freight", "Rail freight", "Courier / express", "Multimodal"],
  units: ["pcs", "kg", "g", "tonne", "box", "carton", "case", "crate", "pallet", "set", "pair", "dozen", "litre", "metre", "square metre"]
};

function readDrafts() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value.filter(draft => draft && typeof draft.id === "string" && Array.isArray(draft.items)) : [];
  } catch { return []; }
}
function writeDrafts(drafts) { localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts)); }
function createId() {
  const suffix = globalThis.crypto?.randomUUID?.().slice(0, 8).toUpperCase() || Math.random().toString(36).slice(2, 10).toUpperCase();
  return `SB-${new Date().getFullYear()}-${suffix}`;
}

export const shippingBillService = {
  async getFormOptions() { await delay(320); return structuredClone(formOptions); },
  async getDrafts() { await delay(80); return readDrafts().sort((a, b) => b.savedAt.localeCompare(a.savedAt)); },
  async saveDraft(payload) {
    await delay(650);
    const drafts = readDrafts();
    const existing = payload.id ? drafts.find(draft => draft.id === payload.id) : null;
    const now = new Date().toISOString();
    const saved = { ...payload, id: existing?.id || createId(), createdAt: existing?.createdAt || now, savedAt: now };
    writeDrafts(existing ? drafts.map(draft => draft.id === saved.id ? saved : draft) : [saved, ...drafts]);
    return saved;
  },
  async deleteDraft(id) { await delay(80); writeDrafts(readDrafts().filter(draft => draft.id !== id)); },
  async checkStorage() {
    const probe = `${STORAGE_KEY}.check`;
    localStorage.setItem(probe, "ok"); localStorage.removeItem(probe);
  }
};
