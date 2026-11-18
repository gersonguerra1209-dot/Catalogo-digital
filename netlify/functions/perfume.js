// Link de um perfume: mostra a FOTO na conversa do WhatsApp e leva o cliente direto ao perfume.
const URL_DB = "https://sbcotxamjsojtqbfkyhm.supabase.co/rest/v1/";
const CHAVE = "sb_publishable_aGDtHnBTeGn_bscaJzxSug_TtGYoZpl";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
async function busca(q) {
  const r = await fetch(URL_DB + q, { headers: { apikey: CHAVE, Authorization: "Bearer " + CHAVE } });
  if (!r.ok) throw new Error("db " + r.status);
  return r.json();
}
exports.handler = async (event) => {
  const host = event.headers["x-forwarded-host"] || event.headers.host;
  const base = "https://" + host;
  const tudo = JSON.stringify(event.queryStringParameters || {}) + " " + (event.rawUrl || "") + " " + (event.path || "");
  const achou = tudo.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  try {
    if (!achou) throw new Error("sem id");
    const id = achou[0];
    const [p] = await busca(`perfumes?id=eq.${id}&select=id,nome,preco,descricao,foto_url,loja_id`);
    if (!p) throw new Error("perfume");
    const [l] = await busca(`lojas?id=eq.${p.loja_id}&select=slug,nome`);
    if (!l) throw new Error("loja");
    const preco = "R$ " + Number(p.preco).toFixed(2).replace(".", ",");
    const destino = `${base}/${l.slug}#p-${p.id}`;
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(p.nome)} — ${preco} | ${esc(l.nome)}</title>
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(p.nome)} — ${preco}">
<meta property="og:description" content="${esc(p.descricao || "Perfume no catálogo da " + l.nome)}">
<meta property="og:url" content="${base}/p/${p.id}">
${p.foto_url ? `<meta property="og:image" content="${esc(p.foto_url)}"><meta name="twitter:card" content="summary_large_image">` : ""}
<meta http-equiv="refresh" content="0;url=${esc(destino)}"></head>
<body style="background:#0b0710;color:#fff;font-family:sans-serif;text-align:center;padding:40px">Abrindo o perfume...<script>location.replace(${JSON.stringify(destino)})</script></body></html>`;
    return { statusCode: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" }, body: html };
  } catch (e) {
    return { statusCode: 200, headers: { "content-type": "text/html; charset=utf-8" }, body: `<!DOCTYPE html><meta charset="utf-8"><body style="background:#0b0710;color:#fff;font-family:sans-serif;padding:30px">Não achei esse perfume (${esc(e.message)}). <a style="color:#f3c96b" href="${base}">Voltar</a></body>` };
  }
};
