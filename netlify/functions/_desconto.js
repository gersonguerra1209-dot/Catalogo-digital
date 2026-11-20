// Indicação premiada: cada indicada pagando tira R$ 10 da mensalidade de quem indicou (máx. 2 → R$ 34,99).
// Esta função confere o preço certo e, se mudou, avisa o Mercado Pago para cobrar o valor novo.
const SUPA = "https://sbcotxamjsojtqbfkyhm.supabase.co";

async function supa(path, SERV, opts = {}) {
  const r = await fetch(`${SUPA}/rest/v1/${path}`, { ...opts, headers: { apikey: SERV, Authorization: `Bearer ${SERV}`, "Content-Type": "application/json", Prefer: "return=representation", ...(opts.headers || {}) } });
  const t = await r.text(); return { ok: r.ok, status: r.status, data: t ? JSON.parse(t) : null };
}
async function precoLoja(lojaId, SERV) {
  const r = await supa("rpc/preco_loja", SERV, { method: "POST", body: JSON.stringify({ p_loja: lojaId }) });
  return r.ok ? Number(r.data) : 54.99;
}
async function ajustaPreco(lojaId, MP, SERV) {
  if (!lojaId) return;
  const l = await supa(`lojas?id=eq.${lojaId}&select=id,plano,mp_assinatura,valor_mensal`, SERV);
  const loja = l.data && l.data[0]; if (!loja) return;
  const novo = await precoLoja(lojaId, SERV);
  if (Number(loja.valor_mensal) === novo) return;
  if (loja.plano === "mensal" && loja.mp_assinatura) {
    const r = await fetch(`https://api.mercadopago.com/preapproval/${loja.mp_assinatura}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${MP}`, "Content-Type": "application/json" },
      body: JSON.stringify({ auto_recurring: { transaction_amount: novo, currency_id: "BRL" } })
    });
    if (!r.ok) return; // tenta de novo na conferência diária
  }
  await supa(`lojas?id=eq.${lojaId}`, SERV, { method: "PATCH", body: JSON.stringify({ valor_mensal: novo }) });
}
module.exports = { supa, precoLoja, ajustaPreco };
