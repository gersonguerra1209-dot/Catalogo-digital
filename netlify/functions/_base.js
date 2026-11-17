const SUPA_URL = "https://sbcotxamjsojtqbfkyhm.supabase.co";
const SUPA_KEY = "sb_publishable_aGDtHnBTeGn_bscaJzxSug_TtGYoZpl";
async function supa(caminho) {
  const r = await fetch(`${SUPA_URL}/rest/v1/${caminho}`, { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } });
  if (!r.ok) throw new Error("supabase " + r.status);
  return r.json();
}
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const brl = v => "R$ " + Number(v).toFixed(2).replace(".", ",");
function origem(event) { return `https://${event.headers["x-forwarded-host"] || event.headers.host}`; }
function metas({ titulo, descricao, imagem, url }) {
  return `<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descricao)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descricao)}">
<meta property="og:url" content="${esc(url)}">
${imagem ? `<meta property="og:image" content="${esc(imagem)}">\n<meta name="twitter:card" content="summary_large_image">` : ""}`;
}
module.exports = { supa, esc, brl, origem, metas };
