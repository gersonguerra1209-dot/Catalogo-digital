// Cria a assinatura no Mercado Pago para a loja da dona logada e devolve o link de pagamento.
const PLANOS = require("./_planos");
const { precoLoja, supa } = require("./_desconto");
const SUPA = "https://sbcotxamjsojtqbfkyhm.supabase.co";
const ANON = "sb_publishable_aGDtHnBTeGn_bscaJzxSug_TtGYoZpl";
const json = (code, obj) => ({ statusCode: code, headers: { "content-type": "application/json" }, body: JSON.stringify(obj) });

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { erro: "Use POST" });
  const MP = process.env.MP_ACCESS_TOKEN, SERV = process.env.SUPABASE_SERVICE_KEY;
  if (!MP || !SERV) return json(503, { erro: "Pagamento ainda não configurado. Fale com o GD." });
  try {
    const token = String(event.headers.authorization || "").replace(/^Bearer\s+/i, "");
    const { plano } = JSON.parse(event.body || "{}");
    const P = PLANOS[plano]; if (!P) return json(400, { erro: "Plano inválido" });
    // quem é a dona?
    const u = await fetch(`${SUPA}/auth/v1/user`, { headers: { apikey: ANON, Authorization: `Bearer ${token}` } });
    if (!u.ok) return json(401, { erro: "Entre no painel de novo" });
    const user = await u.json();
    const r = await fetch(`${SUPA}/rest/v1/lojas?owner_id=eq.${user.id}&select=id,nome,slug`, { headers: { apikey: SERV, Authorization: `Bearer ${SERV}` } });
    const [loja] = await r.json();
    if (!loja) return json(404, { erro: "Loja não encontrada" });
    const valor = plano === "mensal" ? await precoLoja(loja.id, SERV) : P.valor;
    const base = `https://${event.headers["x-forwarded-host"] || event.headers.host}`;
    const mp = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: { Authorization: `Bearer ${MP}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: `${P.nome} — ${loja.nome}`,
        external_reference: `${loja.id}|${plano}`,
        payer_email: user.email,
        back_url: `${base}/painel.html?pago=1`,
        auto_recurring: { frequency: P.meses, frequency_type: "months", transaction_amount: valor, currency_id: "BRL" },
        status: "pending"
      })
    });
    const d = await mp.json();
    if (!mp.ok || !d.init_point) return json(502, { erro: "Mercado Pago recusou: " + (d.message || mp.status) });
    if (plano === "mensal") await supa(`lojas?id=eq.${loja.id}`, SERV, { method: "PATCH", body: JSON.stringify({ valor_mensal: valor }) });
    return json(200, { link: d.init_point });
  } catch (e) {
    return json(500, { erro: "Erro: " + e.message });
  }
};
