// Link da loja: entrega o catálogo já com nome, logo e descrição para a prévia do WhatsApp e do Instagram.
const { supa, origem, metas } = require("./_base");
let cacheHtml = null, cacheEm = 0;
exports.handler = async (event) => {
  const q = (event.queryStringParameters || {}).slug;
  const pelaUrl = String(event.path || "").split("/").filter(Boolean)[0];
  const slug = String(q || (pelaUrl && !pelaUrl.startsWith(".netlify") ? pelaUrl : "") || "").toLowerCase();
  const base = origem(event);
  try {
    if (!cacheHtml || Date.now() - cacheEm > 300000) {
      const r = await fetch(`${base}/loja.html`); if (!r.ok) throw new Error("loja.html");
      cacheHtml = await r.text(); cacheEm = Date.now();
    }
    let extra = "";
    if (/^[a-z0-9-]{3,40}$/.test(slug)) {
      const rows = await supa(`lojas?slug=eq.${slug}&select=nome,titulo,logo_url,fachada_url`);
      const l = rows[0];
      if (l) {
        const fotos = await supa(`perfumes?loja_id=not.is.null&select=foto_url,lojas!inner(slug)&lojas.slug=eq.${slug}&foto_url=neq.&limit=1`).catch(() => []);
        extra = metas({ titulo: `${l.nome} — Catálogo de perfumes`, descricao: `${l.titulo}. Veja os perfumes, gire a roleta de prêmios e peça pelo WhatsApp.`,
          imagem: l.fachada_url || l.logo_url || (fotos[0] && fotos[0].foto_url) || `${base}/icons/icon-512.png`, url: `${base}/${slug}` });
      }
    }
    const html = extra ? cacheHtml.replace("<title>Catálogo</title>", extra) : cacheHtml;
    return { statusCode: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=60" }, body: html };
  } catch (e) {
    return { statusCode: 302, headers: { location: `${base}/loja.html?l=${encodeURIComponent(slug)}` }, body: "" };
  }
};
