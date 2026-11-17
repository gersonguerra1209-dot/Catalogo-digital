// ===== Configuração comum =====
const SUPA_URL = "https://sbcotxamjsojtqbfkyhm.supabase.co";
const SUPA_KEY = "sb_publishable_aGDtHnBTeGn_bscaJzxSug_TtGYoZpl";
const sb = supabase.createClient(SUPA_URL, SUPA_KEY);

const TEMAS = {
  doce:       { n: "🌸 Doce",       bg: "radial-gradient(circle at 50% 40%,#ff9fc0 0%,#b03a6e 45%,#2c0a1d 100%)", a: "#ffb3cf", b: "#e0457f", glow: "#ff7aa8", c1: "#ff9fc0", c2: "#b03a6e", c3: "#2c0a1d" },
  amadeirado: { n: "🪵 Amadeirado", bg: "radial-gradient(circle at 50% 40%,#d9a066 0%,#7a4a22 45%,#1c1008 100%)", a: "#f2c58a", b: "#8a5428", glow: "#d9a066", c1: "#d9a066", c2: "#7a4a22", c3: "#1c1008" },
  fresco:     { n: "🌊 Fresco",     bg: "radial-gradient(circle at 50% 40%,#9ff3ff 0%,#2b9fb5 45%,#06232b 100%)", a: "#c4fbff", b: "#2fb3c9", glow: "#5fe0f0", c1: "#9ff3ff", c2: "#2b9fb5", c3: "#06232b" },
  noturno:    { n: "🌙 Noturno",    bg: "radial-gradient(circle at 50% 40%,#b48cff 0%,#4b2a99 45%,#0b0618 100%)", a: "#d4bcff", b: "#5a2fd6", glow: "#9b6bff", c1: "#b48cff", c2: "#4b2a99", c3: "#0b0618" }
};

const brl = v => "R$ " + Number(v).toFixed(2).replace(".", ",");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const p2 = n => String(n).padStart(2, "0");
const $ = id => document.getElementById(id);

function soDigitos(z) { return String(z || "").replace(/\D/g, ""); }
function zapNormal(z) { let d = soDigitos(z); if (d.length === 10 || d.length === 11) d = "55" + d; return d; }
function fmtZap(z) {
  const d = soDigitos(z).replace(/^55/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return z || "";
}
function waLink(zap, texto) { return `https://wa.me/${zapNormal(zap)}?text=${encodeURIComponent(texto)}`; }

function frasco(t, i) {
  const T = TEMAS[t] || TEMAS.doce;
  return `<svg viewBox="0 0 100 140"><defs><linearGradient id="g${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.a}" stop-opacity=".95"/><stop offset="1" stop-color="${T.b}" stop-opacity=".9"/></linearGradient><linearGradient id="c${i}" x1="0" x2="1"><stop offset="0" stop-color="#b8892e"/><stop offset=".5" stop-color="#ffe7a8"/><stop offset="1" stop-color="#b8892e"/></linearGradient></defs>
  <rect x="36" y="4" width="28" height="22" rx="5" fill="url(#c${i})"/><rect x="43" y="26" width="14" height="10" fill="#d9d2c5"/>
  <rect x="16" y="36" width="68" height="98" rx="16" fill="url(#g${i})" stroke="rgba(255,255,255,.55)" stroke-width="1.5"/>
  <rect x="24" y="44" width="9" height="76" rx="4.5" fill="rgba(255,255,255,.35)"/>
  <rect x="34" y="78" width="40" height="24" rx="4" fill="rgba(0,0,0,.28)" stroke="rgba(255,231,168,.7)"/></svg>`;
}

function visual(p) {
  return p.foto_url ? `<img class="full" src="${esc(p.foto_url)}" alt="${esc(p.nome)}" loading="lazy">` : frasco(p.tipo, String(p.id).slice(0, 8));
}

function iniciais(nome) {
  return String(nome || "").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

function lojaAberta(l) {
  const n = new Date(), d = n.getDay(), h = n.getHours() + n.getMinutes() / 60;
  return (l.dias_abertos || []).includes(d) && h >= l.hora_abre && h < l.hora_fecha;
}

function toast(msg, ms = 2200) {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("on");
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("on"), ms);
}

// Roleta genérica: desenha fatias num elemento .wheel
function desenhaRoleta(el, itens, cores) {
  const seg = 360 / itens.length;
  el.style.background = `conic-gradient(${itens.map((x, i) => `${cores[i % cores.length]} ${i * seg}deg ${(i + 1) * seg}deg`).join(",")})`;
  el.innerHTML = itens.map((x, i) => `<span style="transform:rotate(${i * seg + seg / 2}deg) translateY(-82px)">${esc(x)}</span>`).join("");
}
function giraRoleta(el, estado, k, n) {
  const seg = 360 / n, alvo = (360 - (k * seg + seg / 2)) % 360;
  estado.rot += 1800 + ((alvo - estado.rot % 360) + 360) % 360;
  el.style.transform = `rotate(${estado.rot}deg)`;
}

// Compressão de imagem no próprio celular
function carregaImagem(file) {
  return new Promise((ok, erro) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => ok(im); im.onerror = () => erro(new Error("Não consegui abrir essa foto"));
    im.src = url;
  });
}
function canvasParaBlob(cv, q = 0.85) { return new Promise(ok => cv.toBlob(ok, "image/jpeg", q)); }
async function comprimir(file, max = 1200) {
  const im = await carregaImagem(file);
  const k = Math.min(1, max / Math.max(im.width, im.height));
  const cv = document.createElement("canvas"); cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k);
  cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height);
  return canvasParaBlob(cv, 0.85);
}

// ===== Estúdio Mágico: monta uma foto de vitrine com o cenário do tipo de cheiro =====
function estudioMagico(im, tipo) {
  const T = TEMAS[tipo] || TEMAS.doce, W = 1080, H = 1350;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const x = cv.getContext("2d");
  // fundo do cenário
  const g = x.createRadialGradient(W / 2, H * 0.42, 40, W / 2, H * 0.45, H * 0.8);
  g.addColorStop(0, T.c1); g.addColorStop(0.45, T.c2); g.addColorStop(1, T.c3);
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  // raios de luz
  x.save(); x.globalAlpha = 0.10; x.translate(W / 2, -60);
  for (let i = -5; i <= 5; i++) { x.save(); x.rotate(i * 0.11); x.fillStyle = "#fff"; x.beginPath(); x.moveTo(0, 0); x.lineTo(-30, H * 1.2); x.lineTo(30, H * 1.2); x.closePath(); x.fill(); x.restore(); }
  x.restore();
  // chão (pedestal)
  const chaoY = H * 0.80;
  const gc = x.createLinearGradient(0, chaoY, 0, H);
  gc.addColorStop(0, "rgba(0,0,0,0.15)"); gc.addColorStop(1, "rgba(0,0,0,0.65)");
  x.fillStyle = gc; x.fillRect(0, chaoY, W, H - chaoY);
  x.save(); x.globalAlpha = .55; x.fillStyle = "rgba(255,231,168,.25)";
  x.beginPath(); x.ellipse(W / 2, chaoY, W * 0.36, 38, 0, 0, Math.PI * 2); x.fill(); x.restore();
  // foto do perfume, com moldura arredondada
  const areaW = W * 0.72, areaH = H * 0.58;
  const k = Math.min(areaW / im.width, areaH / im.height);
  const w = im.width * k, h = im.height * k, px = (W - w) / 2, py = chaoY - h - 10;
  const rad = 36;
  function forma() { x.beginPath(); x.roundRect ? x.roundRect(px, py, w, h, rad) : x.rect(px, py, w, h); }
  // brilho atrás
  x.save(); x.shadowColor = T.glow; x.shadowBlur = 90; forma(); x.fillStyle = "rgba(0,0,0,.3)"; x.fill(); x.restore();
  x.save(); forma(); x.clip();
  x.filter = "brightness(1.06) contrast(1.10) saturate(1.15)";
  x.drawImage(im, px, py, w, h); x.filter = "none";
  // vinheta suave na foto
  const vg = x.createRadialGradient(W / 2, py + h / 2, Math.min(w, h) * 0.35, W / 2, py + h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.35)");
  x.fillStyle = vg; x.fillRect(px, py, w, h);
  x.restore();
  // borda dourada
  x.save(); forma(); x.lineWidth = 4; const gb = x.createLinearGradient(px, py, px + w, py + h);
  gb.addColorStop(0, "#b8892e"); gb.addColorStop(.5, "#ffe7a8"); gb.addColorStop(1, "#b8892e"); x.strokeStyle = gb; x.stroke(); x.restore();
  // reflexo no chão
  x.save(); x.beginPath(); x.rect(px, chaoY + 10, w, H - chaoY); x.clip();
  x.globalAlpha = 0.22; x.translate(0, chaoY * 2 + 10); x.scale(1, -1);
  x.drawImage(im, px, py, w, h); x.restore();
  const fade = x.createLinearGradient(0, chaoY + 10, 0, H); fade.addColorStop(0, "rgba(0,0,0,0)"); fade.addColorStop(.6, T.c3); fade.addColorStop(1, T.c3);
  x.fillStyle = fade; x.fillRect(0, chaoY + 10, W, H - chaoY);
  // partículas douradas
  for (let i = 0; i < 70; i++) {
    const r = Math.random() * 4 + 1, sx = Math.random() * W, sy = Math.random() * H * 0.85;
    x.save(); x.globalAlpha = Math.random() * 0.7 + 0.2; x.shadowColor = "#ffe7a8"; x.shadowBlur = 12;
    x.fillStyle = "#ffe7a8"; x.beginPath(); x.arc(sx, sy, r, 0, Math.PI * 2); x.fill(); x.restore();
  }
  // vinheta geral
  const vv = x.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
  vv.addColorStop(0, "rgba(0,0,0,0)"); vv.addColorStop(1, "rgba(0,0,0,0.45)");
  x.fillStyle = vv; x.fillRect(0, 0, W, H);
  return cv;
}
