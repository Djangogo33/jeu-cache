(() => {
  const exprEl = document.getElementById("expr");
  const resultEl = document.getElementById("result");
  const keys = document.getElementById("keys");
  const historyEl = document.getElementById("history");
  let expr = "";
  let zeroStreak = 0;
  const history = [];

  const safe = (s) => /^[0-9+\-*/%.() ]+$/.test(s);
  const show = () => { exprEl.textContent = expr; resultEl.textContent = expr || "0"; };
  const escapeHtml = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const pushHistory = (line) => {
    history.unshift(line); if (history.length > 12) history.length = 12;
    historyEl.innerHTML = history.map((h) => `<li>${escapeHtml(h)}</li>`).join("");
  };
  const clearAll = () => { expr = ""; zeroStreak = 0; show(); };
  const del = () => { expr = expr.slice(0, -1); zeroStreak = 0; show(); };

  function onChar(ch) {
    expr += ch; show();
    zeroStreak = ch === "0" ? zeroStreak + 1 : 0;
    if (zeroStreak >= 5) window.location.href = "resources.html";
  }

  function evalExpr() {
    zeroStreak = 0;
    if (!expr.trim() || !safe(expr)) { resultEl.textContent = "Error"; return; }
    try {
      const v = new Function(`return (${expr})`)();
      if (!Number.isFinite(v)) throw new Error("nan");
      pushHistory(`${expr} = ${v}`);
      expr = String(v); show();
    } catch { resultEl.textContent = "Error"; }
  }

  keys.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.a === "c") return clearAll();
    if (b.dataset.a === "d") return del();
    if (b.dataset.a === "e") return evalExpr();
    if (b.dataset.v) onChar(b.dataset.v);
  });

  window.addEventListener("keydown", (e) => {
    if (/[0-9+\-*/.%()]/.test(e.key)) onChar(e.key);
    if (e.key === "Enter" || e.key === "=") evalExpr();
    if (e.key === "Backspace") del();
    if (e.key.toLowerCase() === "c" || e.key === "Escape") clearAll();
  });

  show();
})();
