// Roda sozinho 1 vez por dia: confere o desconto de todas as assinantes do mensal.
// Pega o caso de uma indicada que parou de pagar (cartão recusado, venceu).
const { supa, ajustaPreco } = require("./_desconto");
exports.handler = async () => {
  const MP = process.env.MP_ACCESS_TOKEN, SERV = process.env.SUPABASE_SERVICE_KEY;
  if (!MP || !SERV) return { statusCode: 200, body: "sem config" };
  const r = await supa("lojas?plano=eq.mensal&mp_assinatura=not.is.null&select=id", SERV);
  for (const l of r.data || []) { try { await ajustaPreco(l.id, MP, SERV); } catch (e) {} }
  return { statusCode: 200, body: "ok " + (r.data || []).length };
};
