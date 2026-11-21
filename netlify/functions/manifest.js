// "Aplicativo" de cada loja: quando o cliente instala, o ícone fica com o nome da loja e abre direto nela.
const { supa } = require("./_base");
exports.handler = async (event) => {
  // o nome da loja pode vir em ?slug= ou no próprio endereço (/m/nome-da-loja)
  const q = (event.queryStringParameters || {}).slug;
  const pelaUrl = String(event.rawUrl || event.path || "").match(/\/m\/([a-z0-9-]{3,40})/i);
  const slug = String((/^[a-z0-9-]{3,40}$/i.test(q || "") ? q : (pelaUrl && pelaUrl[1])) || "").toLowerCase();
  let nome = "Catálogo", icone = "";
  if (/^[a-z0-9-]{3,40}$/.test(slug)) {
    try { const r = await supa(`lojas?slug=eq.${slug}&select=nome,icone_url`); if (r[0] && r[0].nome) nome = r[0].nome; if (r[0] && r[0].icone_url) icone = r[0].icone_url; } catch (e) {}
  }
  const curto = nome.length > 14 ? nome.slice(0, 14).trim() : nome;
  const m = {
    id: `/${slug}`, name: nome, short_name: curto, description: `Catálogo de perfumes da ${nome}`,
    start_url: `/${slug}`, scope: `/${slug}`, display: "standalone",
    background_color: "#0b0710", theme_color: "#0b0710", lang: "pt-BR",
    // com logo: o ícone é a logo da loja; sem logo: o ícone padrão do catálogo
    icons: icone ? [
      { src: icone, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: icone, sizes: "512x512", type: "image/png", purpose: "maskable" }
    ] : [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
  return { statusCode: 200, headers: { "content-type": "application/manifest+json; charset=utf-8", "cache-control": "public, max-age=300" }, body: JSON.stringify(m) };
};
