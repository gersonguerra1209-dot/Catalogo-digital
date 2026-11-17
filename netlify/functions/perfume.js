// Link de um perfume: mostra a FOTO na conversa do WhatsApp e leva o cliente direto ao perfume.
const { supa, esc, brl, origem, metas } = require("./_base");
exports.handler = async (event) => {
  const id = (event.queryStringParameters || {}).id || "";
  const base = origem(event);
  try {
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("id");
    const rows = await supa(`perfumes?id=eq.${id}&select=id,nome,preco,descricao,foto_url,lojas(slug,nome)`);
    const p = rows[0]; if (!p || !p.lojas) throw new Error("nao achou");
    const destino = `${base}/${p.lojas.slug}#p-${p.id}`;
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
${metas({ titulo: `${p.nome} — ${brl(p.preco)} | ${p.lojas.nome}`, descricao: p.descricao || `Perfume no catálogo da ${p.lojas.nome}`, imagem: p.foto_url, url: `${base}/p/${p.id}` })}
<meta http-equiv="refresh" content="0;url=${esc(destino)}"></head>
<body style="background:#0b0710;color:#fff;font-family:sans-serif;text-align:center;padding:40px">Abrindo o perfume...<script>location.replace(${JSON.stringify(destino)})</script></body></html>`;
    return { statusCode: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" }, body: html };
  } catch (e) {
    return { statusCode: 302, headers: { location: base + "/" }, body: "" };
  }
};
