import React, { useState, useRef, useLayoutEffect } from "react";

// ---------------------------------------------------------------------------
// DATA
// ---------------------------------------------------------------------------

// Nominal dimensional lumber. Board footage uses NOMINAL dims.
const NOMINAL_SIZES = [
  { label: "1x2", nomT: 1, nomW: 2 },
  { label: "1x3", nomT: 1, nomW: 3 },
  { label: "1x4", nomT: 1, nomW: 4 },
  { label: "1x6", nomT: 1, nomW: 6 },
  { label: "1x8", nomT: 1, nomW: 8 },
  { label: "1x10", nomT: 1, nomW: 10 },
  { label: "1x12", nomT: 1, nomW: 12 },
  { label: "2x2", nomT: 2, nomW: 2 },
  { label: "2x4", nomT: 2, nomW: 4 },
  { label: "2x6", nomT: 2, nomW: 6 },
  { label: "2x8", nomT: 2, nomW: 8 },
  { label: "2x10", nomT: 2, nomW: 10 },
  { label: "2x12", nomT: 2, nomW: 12 },
  { label: "4x4", nomT: 4, nomW: 4 },
  { label: "4x6", nomT: 4, nomW: 6 },
  { label: "6x6", nomT: 6, nomW: 6 },
];

// Rough average weight of construction lumber, ~2.3 lb per board foot.
// (Softwood at typical in-service moisture — a fair all-around ballpark.)
const LB_PER_BF = 2.3;

// Recommended tools. Replace `url` with real affiliate links.
const TOOLS = [
  { name: "25' Tape Measure", blurb: "Wide standout blade for reaching across boards solo.", url: "https://amzn.to/4fndUbj" },
  { name: "Pinless Moisture Meter", blurb: "Spot damp or green stock before you buy it.", url: "https://amzn.to/4weXfhp" },
  { name: "Speed / Rafter Square", blurb: "Fast square cuts and angle marking on framing lumber.", url: "https://amzn.to/44EnZeU" },
  { name: "Safety Glasses", blurb: "Basic eye protection for cutting and handling.", url: "https://amzn.to/4yutOsV" },
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

const boardFeetPerPiece = (s, lengthFt) => (s.nomT * s.nomW * lengthFt) / 12;

const fmt = (n, d = 2) =>
  n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

const usd = (n) => n == null ? "\u2014" :
  "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ---------------------------------------------------------------------------
// AUTO-FIT NUMBER — scales text down so the full number always fits.
// ---------------------------------------------------------------------------
function AutoFitNumber({ children, maxPx = 44, minPx = 15, className }) {
  const boxRef = useRef(null);
  const textRef = useRef(null);
  const [size, setSize] = useState(maxPx);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const text = textRef.current;
    if (!box || !text) return;
    const fit = () => {
      let lo = minPx, hi = maxPx, best = minPx;
      for (let i = 0; i < 8; i++) {
        const mid = (lo + hi) / 2;
        text.style.fontSize = mid + "px";
        if (text.scrollWidth <= box.clientWidth) { best = mid; lo = mid; }
        else { hi = mid; }
      }
      text.style.fontSize = "";
      setSize(best);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [children, maxPx, minPx]);

  return (
    <div ref={boxRef} className={className} style={{ overflow: "hidden" }}>
      <span ref={textRef} style={{ fontSize: size + "px", whiteSpace: "nowrap", display: "inline-block" }}>
        {children}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------
export default function LumberCalculator() {
  const [tab, setTab] = useState("lumber");   // "lumber" | "plywood" | "calc"
  const [theme, setTheme] = useState("light"); // "light" | "dark"

  // --- Lumber tab state ---
  const [sizeLabel, setSizeLabel] = useState("2x4");
  const [lengthText, setLengthText] = useState("8");
  const [qtyText, setQtyText] = useState("1");
  const [mbfText, setMbfText] = useState("2300");
  const [pieceText, setPieceText] = useState("");
  const [priceEdited, setPriceEdited] = useState("mbf"); // "mbf" | "piece"

  // --- Plywood tab state ---
  const [plyWidthText, setPlyWidthText] = useState("48");
  const [plyLengthText, setPlyLengthText] = useState("96");
  const [plyThickText, setPlyThickText] = useState("0.75");
  const [plyQtyText, setPlyQtyText] = useState("1");
  const [plySheetPriceText, setPlySheetPriceText] = useState("");

  // --- Calculator tab state ---
  const [calcDisplay, setCalcDisplay] = useState("0");
  const [calcPrev, setCalcPrev] = useState(null);
  const [calcOp, setCalcOp] = useState(null);
  const [calcFresh, setCalcFresh] = useState(true);

  const size = NOMINAL_SIZES.find((s) => s.label === sizeLabel);
  const lengthFt = Math.max(0, parseFloat(lengthText) || 0);
  const qty = Math.max(1, Math.floor(parseFloat(qtyText) || 1));

  // ---- Lumber calc ----
  const bfEach = boardFeetPerPiece(size, lengthFt);
  const bfTotal = bfEach * qty;
  const wtEach = bfEach * LB_PER_BF;
  const wtTotal = wtEach * qty;

  // ---- Two-way pricing ----
  const mbfInput = parseFloat(mbfText);
  const pieceInput = parseFloat(pieceText);
  let mbfPrice, piecePrice;
  if (priceEdited === "mbf") {
    mbfPrice = isFinite(mbfInput) ? mbfInput : null;
    piecePrice = mbfPrice != null ? (bfEach / 1000) * mbfPrice : null;
  } else {
    piecePrice = isFinite(pieceInput) ? pieceInput : null;
    mbfPrice = piecePrice != null && bfEach > 0 ? (piecePrice / bfEach) * 1000 : null;
  }
  const orderTotal = piecePrice != null ? piecePrice * qty : null;
  const mbfDisplay = priceEdited === "mbf" ? mbfText : (mbfPrice != null ? mbfPrice.toFixed(2) : "");
  const pieceDisplay = priceEdited === "piece" ? pieceText : (piecePrice != null ? piecePrice.toFixed(2) : "");

  // ---- Plywood calc ----
  const plyW = Math.max(0, parseFloat(plyWidthText) || 0);
  const plyL = Math.max(0, parseFloat(plyLengthText) || 0);
  const plyQty = Math.max(1, Math.floor(parseFloat(plyQtyText) || 1));
  const plySheetPrice = plySheetPriceText === "" ? null : Math.max(0, parseFloat(plySheetPriceText) || 0);
  const plySqFtPerSheet = (plyW * plyL) / 144;
  const plyTotalSqFt = plySqFtPerSheet * plyQty;
  const plyTotalPrice = plySheetPrice != null ? plySheetPrice * plyQty : null;

  // ---- Plain calculator ----
  function calcInput(key) {
    if (key === "C") { setCalcDisplay("0"); setCalcPrev(null); setCalcOp(null); setCalcFresh(true); return; }
    if (key === "back") {
      setCalcDisplay((d) => (d.length > 1 ? d.slice(0, -1) : "0"));
      return;
    }
    if (key === "±") { setCalcDisplay((d) => (d.startsWith("-") ? d.slice(1) : d === "0" ? d : "-" + d)); return; }
    if (key === "%") { setCalcDisplay((d) => String(parseFloat(d) / 100)); return; }
    if ("+-×÷".includes(key)) {
      setCalcPrev(parseFloat(calcDisplay));
      setCalcOp(key);
      setCalcFresh(true);
      return;
    }
    if (key === "=") {
      if (calcOp == null || calcPrev == null) return;
      const a = calcPrev, b = parseFloat(calcDisplay);
      let r = b;
      if (calcOp === "+") r = a + b;
      else if (calcOp === "-") r = a - b;
      else if (calcOp === "×") r = a * b;
      else if (calcOp === "÷") r = b === 0 ? NaN : a / b;
      setCalcDisplay(isFinite(r) ? String(+r.toFixed(10)) : "Error");
      setCalcPrev(null); setCalcOp(null); setCalcFresh(true);
      return;
    }
    if (key === ".") {
      setCalcDisplay((d) => (calcFresh ? "0." : d.includes(".") ? d : d + "."));
      setCalcFresh(false);
      return;
    }
    // a digit
    setCalcDisplay((d) => (calcFresh || d === "0" ? key : d + key));
    setCalcFresh(false);
  }

  const CALC_KEYS = [
    ["C", "±", "%", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    ["0", ".", "back", "="],
  ];

  return (
    <div className={`lc-root lc-theme-${theme}`}>
      <style>{css}</style>

      <div className="lc-topbar">
        <button className="lc-theme-toggle"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          aria-label="Toggle light or dark mode">
          {theme === "light" ? "\u263D Dark" : "\u2600 Light"}
        </button>
      </div>

      <header className="lc-header">
        <div className="lc-eyebrow">
          {tab === "lumber" ? "Board Foot & Pricing"
            : tab === "plywood" ? "Plywood Sheet Pricing"
            : "Calculator"}
        </div>
        <h1 className="lc-title">Timber<span className="lc-title-tally">Tally</span></h1>
        <p className="lc-sub">
          {tab === "lumber"
            ? "Board footage, a ballpark weight, and two-way per-thousand (MBF) pricing for dimensional lumber."
            : tab === "plywood"
            ? "Quick per-sheet plywood pricing. Enter your sheet size, price, and quantity for an order total."
            : "A simple calculator for quick math on the job."}
        </p>
      </header>

      <div className="lc-tabs">
        <button className={`lc-tab ${tab === "lumber" ? "is-on" : ""}`} onClick={() => setTab("lumber")}>Lumber</button>
        <button className={`lc-tab ${tab === "plywood" ? "is-on" : ""}`} onClick={() => setTab("plywood")}>Plywood</button>
        <button className={`lc-tab ${tab === "calc" ? "is-on" : ""}`} onClick={() => setTab("calc")}>Calculator</button>
      </div>

      {tab === "lumber" && (
      <div className="lc-grid">
        <section className="lc-panel lc-inputs">
          <div className="lc-field">
            <label className="lc-label">Nominal size</label>
            <div className="lc-chip-wrap">
              {NOMINAL_SIZES.map((s) => (
                <button key={s.label}
                  className={`lc-chip ${s.label === sizeLabel ? "is-on" : ""}`}
                  onClick={() => setSizeLabel(s.label)}>{s.label}</button>
              ))}
            </div>
          </div>

          <div className="lc-row2">
            <div className="lc-field">
              <label className="lc-label">Length (ft)</label>
              <input type="number" min="0.5" step="0.5" value={lengthText}
                onChange={(e) => setLengthText(e.target.value)}
                onBlur={() => { const n = parseFloat(lengthText); setLengthText(!n || n <= 0 ? "1" : String(n)); }}
                className="lc-input" />
            </div>
            <div className="lc-field">
              <label className="lc-label">Quantity</label>
              <input type="number" min="1" step="1" value={qtyText}
                onChange={(e) => setQtyText(e.target.value)}
                onBlur={() => { const n = Math.floor(parseFloat(qtyText)); setQtyText(!n || n < 1 ? "1" : String(n)); }}
                className="lc-input" />
            </div>
          </div>

          <div className="lc-pricing">
            <label className="lc-label">Pricing &mdash; enter either side</label>
            <div className="lc-price-two">
              <div className="lc-price-cell">
                <div className="lc-price-cap">$ / MBF (per 1,000 bf)</div>
                <div className="lc-money">
                  <span className="lc-money-sign">$</span>
                  <input type="number" min="0" step="1" inputMode="decimal" value={mbfDisplay}
                    onChange={(e) => { setPriceEdited("mbf"); setMbfText(e.target.value); }}
                    className="lc-input lc-money-input" placeholder="2300" />
                </div>
              </div>
              <div className="lc-price-swap">&#8644;</div>
              <div className="lc-price-cell">
                <div className="lc-price-cap">$ / piece</div>
                <div className="lc-money">
                  <span className="lc-money-sign">$</span>
                  <input type="number" min="0" step="0.01" inputMode="decimal" value={pieceDisplay}
                    onChange={(e) => { setPriceEdited("piece"); setPieceText(e.target.value); }}
                    className="lc-input lc-money-input" placeholder="0.00" />
                </div>
              </div>
            </div>
            <div className="lc-actual">Based on {fmt(bfEach)} bf per piece.</div>
          </div>
        </section>

        <section className="lc-panel lc-results">
          <div className="lc-headline">
            <div className="lc-hl-block">
              <AutoFitNumber className="lc-hl-num">{fmt(bfTotal)}</AutoFitNumber>
              <div className="lc-hl-lab">board feet</div>
            </div>
            <div className="lc-hl-div" />
            <div className="lc-hl-block">
              <AutoFitNumber className="lc-hl-num">{fmt(wtTotal, 0)}</AutoFitNumber>
              <div className="lc-hl-lab">lbs (approx)</div>
            </div>
            <div className="lc-hl-div" />
            <div className="lc-hl-block">
              <AutoFitNumber className="lc-hl-num">{orderTotal != null ? usd(orderTotal) : "\u2014"}</AutoFitNumber>
              <div className="lc-hl-lab">order total</div>
            </div>
          </div>

          <div className="lc-detail">
            <div className="lc-detail-row"><span>Board feet each</span><span>{fmt(bfEach)} bf</span></div>
            <div className="lc-detail-row"><span>Weight each (approx)</span><span>{fmt(wtEach, 1)} lb</span></div>
            <div className="lc-detail-row"><span>Price per piece</span><span>{usd(piecePrice)}</span></div>
            <div className="lc-detail-row"><span>Price per MBF</span><span>{mbfPrice != null ? usd(mbfPrice) + " /M" : "\u2014"}</span></div>
            <div className="lc-detail-row"><span>Order</span><span>{qty} &#215; {sizeLabel} @ {fmt(lengthFt,1)}&#8242;</span></div>
          </div>
          <div className="lc-actual">Weight is a rough estimate at ~{LB_PER_BF} lb per board foot; actual varies by species and moisture.</div>
        </section>
      </div>
      )}

      {tab === "plywood" && (
      <div className="lc-grid">
        <section className="lc-panel lc-inputs">
          <div className="lc-field">
            <label className="lc-label">Sheet size (inches)</label>
            <div className="lc-row2">
              <div>
                <div className="lc-price-cap">Width</div>
                <input type="number" min="1" step="1" inputMode="decimal" value={plyWidthText}
                  onChange={(e) => setPlyWidthText(e.target.value)} className="lc-input" />
              </div>
              <div>
                <div className="lc-price-cap">Length</div>
                <input type="number" min="1" step="1" inputMode="decimal" value={plyLengthText}
                  onChange={(e) => setPlyLengthText(e.target.value)} className="lc-input" />
              </div>
            </div>
            <div className="lc-actual">Standard sheet is 48&#8243; &#215; 96&#8243; (4&#215;8). Enter any custom size.</div>
          </div>

          <div className="lc-row2">
            <div className="lc-field">
              <label className="lc-label">Thickness (in)</label>
              <input type="number" min="0" step="0.03125" inputMode="decimal" value={plyThickText}
                onChange={(e) => setPlyThickText(e.target.value)} className="lc-input" />
            </div>
            <div className="lc-field">
              <label className="lc-label">Quantity</label>
              <input type="number" min="1" step="1" value={plyQtyText}
                onChange={(e) => setPlyQtyText(e.target.value)}
                onBlur={() => { const n = Math.floor(parseFloat(plyQtyText)); setPlyQtyText(!n || n < 1 ? "1" : String(n)); }}
                className="lc-input" />
            </div>
          </div>

          <div className="lc-field">
            <label className="lc-label">Price per sheet</label>
            <div className="lc-money">
              <span className="lc-money-sign">$</span>
              <input type="number" min="0" step="0.01" inputMode="decimal" value={plySheetPriceText}
                onChange={(e) => setPlySheetPriceText(e.target.value)}
                className="lc-input lc-money-input" placeholder="0.00" />
            </div>
            <div className="lc-actual">Enter what one sheet costs to get your order total.</div>
          </div>
        </section>

        <section className="lc-panel lc-results">
          <div className="lc-headline">
            <div className="lc-hl-block">
              <AutoFitNumber className="lc-hl-num">{plyQty}</AutoFitNumber>
              <div className="lc-hl-lab">sheets</div>
            </div>
            <div className="lc-hl-div" />
            <div className="lc-hl-block">
              <AutoFitNumber className="lc-hl-num">{plyTotalPrice != null ? usd(plyTotalPrice) : "\u2014"}</AutoFitNumber>
              <div className="lc-hl-lab">order total</div>
            </div>
          </div>

          <div className="lc-detail">
            <div className="lc-detail-row"><span>Sheet size</span><span>{fmt(plyW,0)}&#8243; &#215; {fmt(plyL,0)}&#8243; &#215; {plyThickText}&#8243;</span></div>
            <div className="lc-detail-row"><span>Coverage per sheet</span><span>{fmt(plySqFtPerSheet,1)} sq ft</span></div>
            <div className="lc-detail-row"><span>Total coverage</span><span>{fmt(plyTotalSqFt,1)} sq ft</span></div>
            <div className="lc-detail-row"><span>Price per sheet</span><span>{usd(plySheetPrice)}</span></div>
            <div className="lc-detail-row"><span>Order total</span><span>{plyTotalPrice != null ? usd(plyTotalPrice) : "\u2014"}</span></div>
          </div>
        </section>
      </div>
      )}

      {tab === "calc" && (
      <div className="lc-calc-wrap">
        <section className="lc-panel lc-calc">
          <div className="lc-calc-display">{calcDisplay}</div>
          <div className="lc-calc-grid">
            {CALC_KEYS.flat().map((k) => {
              const isOp = "÷×-+=".includes(k);
              const isFn = ["C", "±", "%", "back"].includes(k);
              const label = k === "back" ? "\u232B" : k;
              return (
                <button key={k}
                  className={`lc-key ${isOp ? "lc-key-op" : ""} ${isFn ? "lc-key-fn" : ""} ${k === "0" ? "lc-key-wide" : ""}`}
                  onClick={() => calcInput(k)}>{label}</button>
              );
            })}
          </div>
        </section>
      </div>
      )}

      <section className="lc-tools">
        <div className="lc-tools-head">
          <h2 className="lc-tools-title">Recommended tools</h2>
          <span className="lc-tools-disc">As an Amazon Associate this site may earn from qualifying purchases.</span>
        </div>
        <div className="lc-tools-grid">
          {TOOLS.map((t) => {
            const live = t.url && t.url.length > 0;
            return (
              <a key={t.name}
                className={`lc-tool ${live ? "" : "lc-tool-soon"}`}
                href={live ? t.url : undefined}
                target={live ? "_blank" : undefined}
                rel={live ? "sponsored noopener noreferrer" : undefined}
                onClick={live ? undefined : (e) => e.preventDefault()}>
                <div className="lc-tool-name">{t.name}</div>
                <div className="lc-tool-blurb">{t.blurb}</div>
                <div className="lc-tool-cta">{live ? "View on Amazon \u2192" : "Link coming soon"}</div>
              </a>
            );
          })}
        </div>
      </section>

      <footer className="lc-foot">
        Board footage uses nominal dimensions. Weight is a rough ballpark; pricing is
        exactly what you enter. TimberTally is a quick estimating aid, not a substitute
        for a supplier quote.
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------
const css = `
.lc-root{
  /* Light theme (default) */
  --bg:#fbfbfd; --card:#ffffff; --ink:#1d1d1f; --sub:#6e6e73; --faint:#86868b;
  --line:#e3e3e6; --line-soft:#eeeef0; --accent:#2f8f5b; --accent-strong:#25794c;
  --field:#ffffff; --field-line:#d2d2d7; --chip:#f5f5f7; --shadow:0 1px 3px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.05);
  --font: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-family: var(--font);
  color:var(--ink); background:var(--bg);
  min-height:100%; padding:20px 20px 56px; box-sizing:border-box;
  -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility;
  transition:background .3s ease, color .3s ease;
}
.lc-theme-dark{
  --bg:#000000; --card:#1c1c1e; --ink:#f5f5f7; --sub:#a1a1a6; --faint:#8e8e93;
  --line:#2c2c2e; --line-soft:#242426; --accent:#41c37e; --accent-strong:#52d68e;
  --field:#2c2c2e; --field-line:#3a3a3c; --chip:#2c2c2e; --shadow:0 1px 3px rgba(0,0,0,.3), 0 8px 24px rgba(0,0,0,.4);
}

*{box-sizing:border-box;}

.lc-topbar{max-width:960px; margin:0 auto 8px; display:flex; justify-content:flex-end;}
.lc-theme-toggle{font:inherit; font-size:13px; font-weight:500; padding:7px 14px;
  border:1px solid var(--field-line); background:var(--card); color:var(--sub);
  border-radius:980px; cursor:pointer; transition:.15s;}
.lc-theme-toggle:hover{color:var(--ink); border-color:var(--sub);}

.lc-header{max-width:960px; margin:0 auto 22px;}
.lc-eyebrow{font-size:12px; letter-spacing:.01em; color:var(--accent); font-weight:600;}
.lc-title{font-size:44px; line-height:1.05; margin:4px 0 8px; letter-spacing:-.025em;
  font-weight:700;}
.lc-title-tally{color:var(--accent);}
.lc-sub{margin:0; max-width:600px; color:var(--sub); font-size:17px; line-height:1.5;
  font-weight:400;}

.lc-tabs{max-width:960px; margin:0 auto 20px; display:inline-flex; gap:2px;
  background:var(--chip); padding:3px; border-radius:980px;}
.lc-tabs-wrap{max-width:960px; margin:0 auto 20px;}
.lc-tab{font:inherit; font-size:14px; font-weight:500; padding:8px 22px; cursor:pointer;
  background:none; border:none; color:var(--sub); border-radius:980px; transition:.15s;}
.lc-tab:hover{color:var(--ink);}
.lc-tab.is-on{background:var(--card); color:var(--ink); box-shadow:0 1px 3px rgba(0,0,0,.08); font-weight:600;}

.lc-grid{max-width:960px; margin:0 auto; display:grid;
  grid-template-columns:minmax(0,1.05fr) minmax(0,1fr); gap:18px;}
@media(max-width:780px){.lc-grid{grid-template-columns:1fr;} .lc-title{font-size:34px;}
  .lc-sub{font-size:15px;}}

.lc-panel{background:var(--card); border:1px solid var(--line-soft); border-radius:18px;
  padding:24px; box-shadow:var(--shadow);}

.lc-field{margin-bottom:20px;}
.lc-field:last-child{margin-bottom:0;}
.lc-label{display:block; font-size:12px; letter-spacing:.02em; text-transform:uppercase;
  color:var(--faint); font-weight:600; margin-bottom:9px;}
.lc-actual{margin-top:8px; font-size:12px; color:var(--faint); line-height:1.4;}
.lc-note{margin-top:8px; font-size:12px; line-height:1.45; color:var(--sub);
  background:var(--chip); border-radius:10px; padding:9px 11px;}

.lc-chip-wrap{display:flex; flex-wrap:wrap; gap:6px;}
.lc-chip{font:inherit; font-size:13px; padding:7px 13px; border:1px solid var(--field-line);
  background:var(--field); border-radius:980px; cursor:pointer; color:var(--sub); transition:.15s;}
.lc-chip:hover{border-color:var(--sub); color:var(--ink);}
.lc-chip.is-on{background:var(--accent); color:#fff; border-color:var(--accent);}

.lc-row2{display:grid; grid-template-columns:1fr 1fr; gap:12px;}
.lc-input{font:inherit; font-size:15px; width:100%; box-sizing:border-box; padding:11px 13px;
  border:1px solid var(--field-line); border-radius:10px; background:var(--field); color:var(--ink);
  transition:.15s;}
.lc-input:focus{outline:none; border-color:var(--accent); box-shadow:0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent);}
.lc-select{cursor:pointer;}

.lc-loc-head{display:flex; justify-content:space-between; align-items:center; margin-bottom:9px;}
.lc-pricing{margin-top:20px; padding-top:20px; border-top:1px solid var(--line-soft);}
.lc-price-two{display:grid; grid-template-columns:1fr auto 1fr; align-items:end; gap:10px;}
.lc-price-cell{min-width:0;}
.lc-price-cap{font-size:12px; color:var(--faint); margin-bottom:6px;}
.lc-price-swap{font-size:18px; color:var(--accent); padding-bottom:9px;}
.lc-money{display:flex; align-items:center; border:1px solid var(--field-line);
  border-radius:10px; background:var(--field); overflow:hidden; transition:.15s;}
.lc-money:focus-within{border-color:var(--accent); box-shadow:0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent);}
.lc-money-sign{padding:0 4px 0 12px; color:var(--faint); font-size:15px;}
.lc-money-input{border:none !important; box-shadow:none !important; padding-left:3px; background:transparent;}
.lc-money-input:focus{outline:none !important; box-shadow:none !important;}
.lc-addr-row{display:flex; gap:8px; margin-bottom:8px;}
.lc-addr-input{flex:1;}
.lc-addr-btn{font:inherit; font-size:14px; font-weight:500; padding:0 18px;
  border:none; background:var(--accent); color:#fff; border-radius:10px;
  cursor:pointer; white-space:nowrap; transition:.15s;}
.lc-addr-btn:hover{background:var(--accent-strong);}
.lc-addr-btn:disabled{opacity:.5; cursor:default;}
.lc-geo{font:inherit; font-size:13px; padding:5px 13px; border:1px solid var(--field-line);
  color:var(--accent); background:var(--card); border-radius:980px; cursor:pointer; transition:.15s;}
.lc-geo:hover{background:var(--accent); color:#fff; border-color:var(--accent);}

.lc-headline{display:flex; flex-wrap:wrap; align-items:flex-start; gap:16px 20px; padding-bottom:20px;
  border-bottom:1px solid var(--line-soft); margin-bottom:18px;}
.lc-hl-block{flex:1 1 90px; min-width:0;}
.lc-hl-num{line-height:1.05; letter-spacing:-.02em; font-weight:600;
  font-variant-numeric:tabular-nums;}
.lc-hl-lab{font-size:12px; letter-spacing:.02em; text-transform:uppercase;
  color:var(--faint); margin-top:7px; font-weight:600;}
.lc-hl-div{width:1px; align-self:stretch; background:var(--line-soft);}

.lc-detail{margin-bottom:22px;}
.lc-detail-row{display:flex; justify-content:space-between; align-items:baseline;
  gap:12px; font-size:14px; padding:9px 0; border-bottom:1px solid var(--line-soft); color:var(--sub);}
.lc-detail-row:last-child{border-bottom:none;}
.lc-detail-row span:first-child{flex:0 1 auto; min-width:0;}
.lc-detail-row span:last-child{flex:0 0 auto; text-align:right; white-space:nowrap;
  font-variant-numeric:tabular-nums; font-weight:600; color:var(--ink);}

.lc-tools{max-width:960px; margin:28px auto 0; padding-top:24px; border-top:1px solid var(--line-soft);}
.lc-tools-head{display:flex; flex-wrap:wrap; align-items:baseline; justify-content:space-between;
  gap:6px 14px; margin-bottom:16px;}
.lc-tools-title{font-size:22px; margin:0; color:var(--ink); font-weight:600; letter-spacing:-.01em;}
.lc-tools-disc{font-size:12px; color:var(--faint);}
.lc-tools-grid{display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px;}
.lc-tool{display:flex; flex-direction:column; text-decoration:none; background:var(--card);
  border:1px solid var(--line-soft); border-radius:14px; padding:16px; transition:.15s; color:var(--ink);
  box-shadow:var(--shadow);}
.lc-tool:hover{transform:translateY(-2px);}
.lc-tool-soon{opacity:.6; cursor:default;}
.lc-tool-soon:hover{transform:none;}
.lc-tool-name{font-weight:600; font-size:15px; margin-bottom:6px;}
.lc-tool-blurb{font-size:13px; color:var(--sub); line-height:1.45; flex:1;}
.lc-tool-cta{margin-top:12px; font-size:13px; font-weight:600; color:var(--accent);}
.lc-tool-soon .lc-tool-cta{color:var(--faint);}

.lc-foot{max-width:960px; margin:24px auto 0; font-size:12px; color:var(--faint);
  line-height:1.5; border-top:1px solid var(--line-soft); padding-top:16px;}

.lc-calc-wrap{max-width:420px; margin:0 auto;}
.lc-calc{padding:20px;}
.lc-calc-display{font-variant-numeric:tabular-nums; text-align:right; font-size:44px;
  font-weight:400; letter-spacing:-.02em; padding:18px 14px 22px; min-height:64px;
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--ink);}
.lc-calc-grid{display:grid; grid-template-columns:repeat(4,1fr); gap:10px;}
.lc-key{font:inherit; font-size:22px; font-weight:400; height:64px; border:none;
  border-radius:16px; cursor:pointer; background:var(--chip); color:var(--ink);
  transition:.12s; display:flex; align-items:center; justify-content:center;}
.lc-key:hover{filter:brightness(.96);}
.lc-key:active{transform:scale(.97);}
.lc-key-fn{background:var(--field-line); color:var(--ink);}
.lc-key-op{background:var(--accent); color:#fff; font-weight:500;}
.lc-key-wide{grid-column:span 2; justify-content:flex-start; padding-left:26px;}
`;
