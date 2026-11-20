// O Mercado Pago chama este endereço a cada pagamento. Nunca confiamos no aviso:
// sempre perguntamos de novo ao próprio Mercado Pago antes de liberar a loja.
const PLANOS = require("./_planos");
const { ajustaPreco } = require("./_desconto");
const SUPA = "https://sbcotxamjsojtqbfkyhm.supabase.co";
const ok = { statusCode: 200, body: "ok" };

async function mp(path, MP) {
  const r = await fetch(`https://api.mercadopago.com${path}`, { headers: { Authorization: `Bearer ${MP}` } });
  if (!r.ok) throw new Error("mp " + r.status);
  return r.json();
}
async function supa(path, SERV, opts = {}) {
  const r = await fetch(`${SUPA}/rest/v1/${path}`, { ...opts, headers: { apikey: SERV, Authorization: `Bearer ${SERV}`, "Content-Type": "application/json", Prefer: "return=representation", ...(opts.headers || {}) } });
  const t = await r.text(); return { ok: r.ok, status: r.status, data: t ? JSON.parse(t) : null };
}
function somaMeses(dataISO, meses) {
  const hoje = new Date(); hoje.setUTCHours(12, 0, 0, 0);
  const atual = new Date(dataISO + "T12:00:00Z");
  const base = atual > hoje ? atual : hoje;
  base.setUTCMonth(base.getUTCMonth() + meses);
  base.setUTCDate(base.getUTCDate() + 2); // 2 dias de folga
  return base.toISOString().slice(0, 10);
}

exports.handler = async (event) => {
  const MP = process.env.MP_ACCESS_TOKEN, SERV = process.env.SUPABASE_SERVICE_KEY;
  if (!MP || !SERV) return ok;
  try {
    const q = event.queryStringParameters || {};
    let body = {}; try { body = JSON.parse(event.body || "{}"); } catch (e) {}
    const tipo = body.type || q.type || q.topic || "";
    const id = (body.data && body.data.id) || q["data.id"] || q.id;
    if (!id) return ok;

    if (tipo === "subscription_preapproval") {
      const pre = await mp(`/preapproval/${id}`, MP);
      const [lojaId] = String(pre.external_reference || "").split("|");
      if (!lojaId) return ok;
      if (pre.status === "cancelled") {
        // a dona cancelou: a loja fica no ar até o dia já pago, mas deixa de contar como indicação
        const r = await supa(`lojas?id=eq.${lojaId}&mp_assinatura=eq.${pre.id}`, SERV, { method: "PATCH", body: JSON.stringify({ plano: "cancelado" }) });
        const l = r.data && r.data[0];
        if (l && l.indicado_por) await ajustaPreco(l.indicado_por, MP, SERV);
      } else {
        await supa(`lojas?id=eq.${lojaId}`, SERV, { method: "PATCH", body: JSON.stringify({ mp_assinatura: pre.id }) });
      }
      return ok;
    }

    if (tipo === "subscription_authorized_payment") {
      const ap = await mp(`/authorized_payments/${id}`, MP);
      const aprovado = ap.status === "processed" || (ap.payment && ap.payment.status === "approved");
      if (!aprovado) return ok;
      const pre = await mp(`/preapproval/${ap.preapproval_id}`, MP);
      const [lojaId, plano] = String(pre.external_reference || "").split("|");
      const P = PLANOS[plano]; if (!lojaId || !P) return ok;
      // não conta o mesmo pagamento duas vezes
      const ins = await supa("pagamentos", SERV, { method: "POST", body: JSON.stringify({ id: String(ap.id), loja_id: lojaId, plano, valor: ap.transaction_amount || P.valor }) });
      if (!ins.ok) return ok;
      const l = await supa(`lojas?id=eq.${lojaId}&select=ativo_ate`, SERV);
      const atual = (l.data && l.data[0] && l.data[0].ativo_ate) || new Date().toISOString().slice(0, 10);
      const up = await supa(`lojas?id=eq.${lojaId}`, SERV, { method: "PATCH", body: JSON.stringify({ ativo_ate: somaMeses(atual, P.meses), plano, mp_assinatura: pre.id }) });
      const loja = up.data && up.data[0];
      // ela pagou: quem indicou ganha o desconto; e ela mesma pode ter direito a desconto
      if (loja && loja.indicado_por) await ajustaPreco(loja.indicado_por, MP, SERV);
      await ajustaPreco(lojaId, MP, SERV);
      return ok;
    }
    return ok;
  } catch (e) {
    return { statusCode: 500, body: "erro" }; // o Mercado Pago tenta de novo depois
  }
};
