import React, { useState, useMemo, useRef, useLayoutEffect } from "react";

// ---------------------------------------------------------------------------
// DATA
// ---------------------------------------------------------------------------

// Nominal dimensional lumber. Board footage uses NOMINAL dims; weight uses ACTUAL.
const NOMINAL_SIZES = [
  { label: "1x2", nomT: 1, nomW: 2, actT: 0.75, actW: 1.5 },
  { label: "1x3", nomT: 1, nomW: 3, actT: 0.75, actW: 2.5 },
  { label: "1x4", nomT: 1, nomW: 4, actT: 0.75, actW: 3.5 },
  { label: "1x6", nomT: 1, nomW: 6, actT: 0.75, actW: 5.5 },
  { label: "1x8", nomT: 1, nomW: 8, actT: 0.75, actW: 7.25 },
  { label: "1x10", nomT: 1, nomW: 10, actT: 0.75, actW: 9.25 },
  { label: "1x12", nomT: 1, nomW: 12, actT: 0.75, actW: 11.25 },
  { label: "2x2", nomT: 2, nomW: 2, actT: 1.5, actW: 1.5 },
  { label: "2x4", nomT: 2, nomW: 4, actT: 1.5, actW: 3.5 },
  { label: "2x6", nomT: 2, nomW: 6, actT: 1.5, actW: 5.5 },
  { label: "2x8", nomT: 2, nomW: 8, actT: 1.5, actW: 7.25 },
  { label: "2x10", nomT: 2, nomW: 10, actT: 1.5, actW: 9.25 },
  { label: "2x12", nomT: 2, nomW: 12, actT: 1.5, actW: 11.25 },
  { label: "4x4", nomT: 4, nomW: 4, actT: 3.5, actW: 3.5 },
  { label: "4x6", nomT: 4, nomW: 6, actT: 3.5, actW: 5.5 },
  { label: "6x6", nomT: 6, nomW: 6, actT: 5.5, actW: 5.5 },
];

// Species. ovenDry = oven-dry density (lb/ft^3). Weight is built up from oven-dry
// density plus moisture content, so MC drives the water weight.
const SPECIES = [
  { name: "Douglas Fir", ovenDry: 30, group: "Softwood" },
  { name: "Southern Yellow Pine", ovenDry: 34, group: "Softwood" },
  { name: "Eastern White Pine", ovenDry: 23, group: "Softwood" },
  { name: "Spruce-Pine-Fir (SPF)", ovenDry: 26, group: "Softwood" },
  { name: "Western Red Cedar", ovenDry: 20, group: "Softwood" },
  { name: "Hemlock", ovenDry: 27, group: "Softwood" },
  { name: "Redwood", ovenDry: 24, group: "Softwood" },
  { name: "Red Oak", ovenDry: 40, group: "Hardwood" },
  { name: "White Oak", ovenDry: 42, group: "Hardwood" },
  { name: "Hard Maple", ovenDry: 39, group: "Hardwood" },
  { name: "Poplar", ovenDry: 26, group: "Hardwood" },
  { name: "Walnut", ovenDry: 34, group: "Hardwood" },
  { name: "Cherry", ovenDry: 31, group: "Hardwood" },
  { name: "Ash", ovenDry: 37, group: "Hardwood" },
];

// Monthly EMC (%) by city. Source: USDA FPL Res. Note FPL-RN-0268 (Simpson 1998),
// updated by Mitchell / NC State using 1981-2010 NOAA Climate Normals.
// Order: Jan..Dec. lat/lon used only for "nearest city" from geolocation.
const CITIES = [
  { name: "Seattle, WA", lat: 47.61, lon: -122.33, emc: [16.3,14.9,14.4,13.6,12.9,12.8,12.0,12.4,13.4,15.7,16.6,16.9] },
  { name: "Portland, OR", lat: 45.52, lon: -122.68, emc: [16.7,14.9,14.0,13.2,12.7,12.1,11.2,11.4,12.2,14.6,16.6,17.2] },
  { name: "Eugene, OR", lat: 44.05, lon: -123.09, emc: [18.9,17.0,15.4,14.2,13.7,12.7,11.0,11.1,11.9,15.0,18.7,19.9] },
  { name: "Quillayute, WA", lat: 47.94, lon: -124.56, emc: [19.7,17.4,17.0,16.1,15.9,16.1,15.7,16.1,16.1,17.9,19.6,20.2] },
  { name: "Spokane, WA", lat: 47.66, lon: -117.43, emc: [17.7,15.5,12.8,11.1,10.5,10.0,8.3,8.2,9.4,12.2,16.9,18.5] },
  { name: "San Francisco, CA", lat: 37.77, lon: -122.42, emc: [15.2,15.8,15.8,15.3,16.3,14.6,16.6,16.4,14.4,14.9,14.7,16.5] },
  { name: "Los Angeles, CA", lat: 34.05, lon: -118.24, emc: [9.4,10.2,10.5,10.4,11.0,11.7,11.6,11.2,10.8,10.6,9.8,9.9] },
  { name: "Sacramento, CA", lat: 38.58, lon: -121.49, emc: [15.9,13.9,12.7,11.4,10.4,9.6,9.2,9.5,9.5,10.5,13.4,15.8] },
  { name: "Phoenix, AZ", lat: 33.45, lon: -112.07, emc: [8.9,8.3,7.4,6.0,4.9,4.4,6.2,6.8,6.5,6.9,7.8,9.0] },
  { name: "Las Vegas, NV", lat: 36.17, lon: -115.14, emc: [8.3,7.6,6.4,5.3,4.6,3.7,4.4,5.0,5.0,5.7,7.1,8.2] },
  { name: "Denver, CO", lat: 39.74, lon: -104.99, emc: [10.1,10.0,8.8,9.1,9.2,8.3,8.0,8.4,8.4,9.1,9.6,10.5] },
  { name: "Albuquerque, NM", lat: 35.08, lon: -106.65, emc: [9.9,8.8,7.5,6.5,6.3,6.0,7.8,8.5,8.2,8.3,8.8,10.1] },
  { name: "Salt Lake City, UT", lat: 40.76, lon: -111.89, emc: [14.6,13.1,10.6,9.7,9.0,7.8,6.8,7.1,8.1,10.0,12.6,14.9] },
  { name: "Boise, ID", lat: 43.62, lon: -116.21, emc: [14.8,12.9,10.6,9.6,9.2,8.4,6.9,6.9,7.9,9.5,12.7,14.8] },
  { name: "Billings, MT", lat: 45.79, lon: -108.50, emc: [11.4,11.1,10.9,10.2,10.3,10.0,8.5,8.3,9.2,10.0,10.9,11.4] },
  { name: "Dallas, TX", lat: 32.78, lon: -96.80, emc: [12.7,12.7,11.9,12.5,12.9,12.1,11.3,11.0,12.0,12.2,12.4,12.5] },
  { name: "Houston, TX", lat: 29.76, lon: -95.37, emc: [14.3,14.3,13.9,13.9,14.1,14.1,14.0,13.9,14.2,13.8,14.3,14.6] },
  { name: "El Paso, TX", lat: 31.76, lon: -106.49, emc: [8.9,7.7,6.4,5.6,5.5,6.0,8.0,8.5,8.5,8.2,8.3,9.3] },
  { name: "New Orleans, LA", lat: 29.95, lon: -90.07, emc: [14.6,14.3,13.7,13.9,13.8,14.4,14.8,15.0,14.5,13.8,14.1,14.7] },
  { name: "Miami, FL", lat: 25.76, lon: -80.19, emc: [13.5,13.1,12.7,12.2,12.5,13.7,13.4,13.8,14.4,13.8,13.6,13.5] },
  { name: "Atlanta, GA", lat: 33.75, lon: -84.39, emc: [13.3,12.5,12.2,11.8,12.3,12.7,13.4,13.5,13.5,12.9,12.8,13.2] },
  { name: "Charlotte, NC", lat: 35.23, lon: -80.84, emc: [12.6,12.1,11.8,11.4,12.2,12.4,12.9,13.3,13.4,13.0,12.7,12.7] },
  { name: "Memphis, TN", lat: 35.15, lon: -90.05, emc: [13.4,12.9,12.2,12.2,12.7,12.6,12.9,12.8,13.0,12.5,12.8,13.4] },
  { name: "Chicago, IL", lat: 41.85, lon: -87.65, emc: [14.3,14.1,13.4,12.4,12.3,12.3,12.7,13.3,13.3,13.2,13.9,15.1] },
  { name: "Minneapolis-St. Paul, MN", lat: 44.98, lon: -93.27, emc: [14.0,13.8,13.3,11.8,11.7,12.3,12.4,13.1,13.4,13.1,14.2,14.9] },
  { name: "Duluth, MN", lat: 46.79, lon: -92.10, emc: [14.5,14.0,13.8,12.7,12.4,13.5,13.9,14.7,14.8,14.3,15.2,15.6] },
  { name: "Kansas City, MO", lat: 39.10, lon: -94.58, emc: [13.7,13.6,13.0,12.5,13.5,13.6,13.4,13.6,13.6,13.0,13.5,14.3] },
  { name: "Detroit, MI", lat: 42.33, lon: -83.05, emc: [14.8,14.1,13.2,12.2,12.0,12.2,12.3,13.2,13.5,13.5,14.2,15.1] },
  { name: "New York, NY", lat: 40.71, lon: -74.01, emc: [12.2,11.9,11.4,11.0,11.5,11.9,11.8,12.4,12.7,12.3,12.5,12.3] },
  { name: "Boston, MA", lat: 42.36, lon: -71.06, emc: [12.1,11.7,11.8,11.5,12.0,12.0,11.8,12.4,12.8,12.6,12.5,12.2] },
  { name: "Philadelphia, PA", lat: 39.95, lon: -75.17, emc: [12.7,12.0,11.7,11.2,11.7,11.8,11.9,12.3,12.8,12.8,12.6,12.6] },
  { name: "Washington, DC", lat: 38.85, lon: -77.04, emc: [11.9,11.5,11.2,11.0,11.6,11.7,11.7,12.1,12.6,12.6,12.2,12.1] },
  { name: "Anchorage, AK", lat: 61.22, lon: -149.90, emc: [14.7,14.0,12.2,11.5,10.7,11.8,13.1,13.8,14.2,14.2,15.0,15.6] },
  { name: "Fairbanks, AK", lat: 64.84, lon: -147.72, emc: [13.5,13.0,11.5,10.2,8.7,9.8,11.3,12.6,13.0,14.8,14.7,14.1] },
  { name: "Juneau, AK", lat: 58.30, lon: -134.42, emc: [17.3,16.7,14.9,13.9,13.4,14.0,15.6,16.5,18.4,18.5,18.1,18.5] },
  { name: "Honolulu, HI", lat: 21.31, lon: -157.86, emc: [13.1,12.7,12.3,11.7,11.3,11.1,11.1,11.0,11.4,12.0,12.5,13.0] },
];

const MONTHS = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];

// Lumber condition determines how MC relates to ambient EMC.
const CONDITIONS = [
  { key: "kiln", name: "Kiln-dried", note: "Dried low; stays dry if protected", cap: 9 },
  { key: "air", name: "Air-dried", note: "Follows local air \u2014 where region matters most", cap: null },
  { key: "green", name: "Green (fresh sawn)", note: "Still saturated; ~65% MC", fixed: 65 },
];

// Recommended tools. Replace `url` with your real affiliate links once approved
// (Amazon Associates, Home Depot via Impact, etc.). Keep the list short and
// genuinely useful — items that pair with measuring and pricing lumber.
const TOOLS = [
  { name: "25' Tape Measure", blurb: "Wide standout blade for reaching across boards solo.", url: "https://amzn.to/4fndUbj" },
  { name: "Pinless Moisture Meter", blurb: "Check moisture content before you buy — pairs with the weight estimate here.", url: "https://amzn.to/4weXfhp" },
  { name: "Speed / Rafter Square", blurb: "Fast square cuts and angle marking on framing lumber.", url: "https://amzn.to/44EnZeU" },
  { name: "Safety Glasses", blurb: "Basic eye protection for cutting and handling.", url: "https://amzn.to/4yutOsV" },
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

const boardFeetPerPiece = (s, lengthFt) => (s.nomT * s.nomW * lengthFt) / 12;
const actualCubicFeet = (s, lengthFt) => (s.actT * s.actW * (lengthFt * 12)) / 1728;

function moistureContent(cityEmc, monthIdx, condition) {
  const emc = cityEmc[monthIdx];
  if (condition.fixed != null) return condition.fixed;
  if (condition.cap != null) return Math.min(emc, condition.cap);
  return emc;
}

function pieceWeight(species, cubicFt, mc) {
  const ovenDryWeight = species.ovenDry * cubicFt;
  return ovenDryWeight * (1 + mc / 100);
}

function nearestCity(lat, lon) {
  let best = CITIES[0], bestD = Infinity;
  for (const c of CITIES) {
    const d = (c.lat - lat) ** 2 + (c.lon - lon) ** 2;
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}

const fmt = (n, d = 2) =>
  n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

// Scales its text down (never up past maxPx) so the full number always fits
// its container width — no truncation, no ellipsis, no hover tooltip.
function AutoFitNumber({ children, maxPx = 38, minPx = 15, className }) {
  const boxRef = useRef(null);
  const textRef = useRef(null);
  const [size, setSize] = useState(maxPx);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const text = textRef.current;
    if (!box || !text) return;

    const fit = () => {
      let lo = minPx, hi = maxPx, best = minPx;
      // Binary-search the largest font size that doesn't overflow.
      for (let i = 0; i < 8; i++) {
        const mid = (lo + hi) / 2;
        text.style.fontSize = mid + "px";
        if (text.scrollWidth <= box.clientWidth) {
          best = mid; lo = mid;
        } else {
          hi = mid;
        }
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

export default function LumberCalculator() {
  const [sizeLabel, setSizeLabel] = useState("2x4");
  const [lengthText, setLengthText] = useState("8");
  const [qtyText, setQtyText] = useState("1");
  const [speciesName, setSpeciesName] = useState("Douglas Fir");
  const [cityName, setCityName] = useState("Seattle, WA");
  const [monthIdx, setMonthIdx] = useState(0);
  const [conditionKey, setConditionKey] = useState("air");
  const [geoStatus, setGeoStatus] = useState(null);
  const [addressText, setAddressText] = useState("");
  const [addrStatus, setAddrStatus] = useState(null); // null|searching|ok|notfound|error
  const [matchedFrom, setMatchedFrom] = useState(null); // label of what geocoded
  // Pricing: two-way. User edits either MBF or per-piece; the other is derived.
  const [mbfText, setMbfText] = useState("2300");
  const [pieceText, setPieceText] = useState("");
  const [priceEdited, setPriceEdited] = useState("mbf"); // "mbf" | "piece"

  const size = NOMINAL_SIZES.find((s) => s.label === sizeLabel);
  const species = SPECIES.find((s) => s.name === speciesName);
  const city = CITIES.find((c) => c.name === cityName);
  const condition = CONDITIONS.find((c) => c.key === conditionKey);

  // Editable text fields; fall back to safe values for the math while typing.
  const lengthFt = Math.max(0, parseFloat(lengthText) || 0);
  const qty = Math.max(1, Math.floor(parseFloat(qtyText) || 1));

  const results = useMemo(() => {
    const bfEach = boardFeetPerPiece(size, lengthFt);
    const cf = actualCubicFeet(size, lengthFt);
    const mc = moistureContent(city.emc, monthIdx, condition);
    const wtEach = pieceWeight(species, cf, mc);

    const byMonth = city.emc.map((_, mi) => {
      const m = moistureContent(city.emc, mi, condition);
      return { monthIdx: mi, mc: m, weightTotal: pieceWeight(species, cf, m) * qty };
    });

    return { bfEach, bfTotal: bfEach * qty, mc, wtEach, wtTotal: wtEach * qty, byMonth };
  }, [size, lengthFt, qty, species, city, monthIdx, condition]);

  const maxMonthWeight = Math.max(...results.byMonth.map((m) => m.weightTotal), 0.0001);
  const heaviest = results.byMonth.reduce((a, b) => (b.weightTotal > a.weightTotal ? b : a));
  const lightest = results.byMonth.reduce((a, b) => (b.weightTotal < a.weightTotal ? b : a));
  const swing = heaviest.weightTotal - lightest.weightTotal;

  // ---- Two-way pricing ----------------------------------------------------
  // bfEach can be 0 while the length field is mid-edit; guard against it.
  const bfEach = results.bfEach;
  const mbfInput = parseFloat(mbfText);
  const pieceInput = parseFloat(pieceText);

  // Derive the field the user is NOT currently editing.
  let mbfPrice, piecePrice;
  if (priceEdited === "mbf") {
    mbfPrice = isFinite(mbfInput) ? mbfInput : null;
    piecePrice = mbfPrice != null ? (bfEach / 1000) * mbfPrice : null;
  } else {
    piecePrice = isFinite(pieceInput) ? pieceInput : null;
    mbfPrice = piecePrice != null && bfEach > 0 ? (piecePrice / bfEach) * 1000 : null;
  }
  const orderTotal = piecePrice != null ? piecePrice * qty : null;

  // The derived field's display value (the edited one shows the raw text).
  const mbfDisplay = priceEdited === "mbf" ? mbfText : (mbfPrice != null ? mbfPrice.toFixed(2) : "");
  const pieceDisplay = priceEdited === "piece" ? pieceText : (piecePrice != null ? piecePrice.toFixed(2) : "");

  const usd = (n) => n == null ? "—" :
    "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoStatus("unsupported");
      return;
    }
    setGeoStatus("locating");

    // If the browser suppresses the permission prompt entirely (common inside
    // sandboxed iframes), neither callback fires — so guard it ourselves.
    let settled = false;
    const guard = setTimeout(() => {
      if (!settled) {
        settled = true;
        setGeoStatus("blocked");
      }
    }, 9000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (settled) return;
        settled = true;
        clearTimeout(guard);
        const c = nearestCity(pos.coords.latitude, pos.coords.longitude);
        setCityName(c.name);
        setGeoStatus("ok");
      },
      (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(guard);
        // 1 = permission denied, 2 = position unavailable, 3 = timeout
        if (err.code === 1) setGeoStatus("denied");
        else if (err.code === 3) setGeoStatus("timeout");
        else setGeoStatus("blocked");
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  }

  // Geocode a typed address / city / ZIP, then snap to the nearest EMC city.
  // Each provider is isolated so one failing (CORS, network, no-match) still
  // lets the others run. ZIPs go to Nominatim's structured postalcode search;
  // street addresses prefer the US Census geocoder.
  async function searchAddress() {
    const q = addressText.trim();
    if (!q) return;
    setAddrStatus("searching");
    setMatchedFrom(null);

    const applyMatch = (lat, lon, label) => {
      if (!isFinite(lat) || !isFinite(lon)) return false;
      const c = nearestCity(lat, lon);
      setCityName(c.name);
      setGeoStatus(null);
      setMatchedFrom(label);
      setAddrStatus("ok");
      return true;
    };

    const isBareZip = /^\d{5}(-\d{4})?$/.test(q);

    // Provider A: Nominatim structured ZIP lookup (best for bare ZIPs).
    async function tryNominatimZip() {
      try {
        const url =
          "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&postalcode=" +
          encodeURIComponent(q.slice(0, 5));
        const r = await fetch(url, { headers: { Accept: "application/json" } });
        if (!r.ok) return false;
        const j = await r.json();
        if (Array.isArray(j) && j[0])
          return applyMatch(parseFloat(j[0].lat), parseFloat(j[0].lon), j[0].display_name);
      } catch (e) { /* fall through */ }
      return false;
    }

    // Provider B: US Census (best for full street addresses).
    async function tryCensus() {
      try {
        const url =
          "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress" +
          "?benchmark=Public_AR_Current&format=json&address=" +
          encodeURIComponent(q);
        const r = await fetch(url);
        if (!r.ok) return false;
        const j = await r.json();
        const m = j?.result?.addressMatches?.[0];
        if (m) return applyMatch(m.coordinates.y, m.coordinates.x, m.matchedAddress || q);
      } catch (e) { /* fall through */ }
      return false;
    }

    // Provider C: Nominatim free-text (catches cities and anything else).
    async function tryNominatimText() {
      try {
        const url =
          "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" +
          encodeURIComponent(q);
        const r = await fetch(url, { headers: { Accept: "application/json" } });
        if (!r.ok) return false;
        const j = await r.json();
        if (Array.isArray(j) && j[0])
          return applyMatch(parseFloat(j[0].lat), parseFloat(j[0].lon), j[0].display_name);
      } catch (e) { /* fall through */ }
      return false;
    }

    // Run providers in the smartest order for the input, stopping on first hit.
    const order = isBareZip
      ? [tryNominatimZip, tryCensus, tryNominatimText]
      : [tryCensus, tryNominatimText, tryNominatimZip];

    for (const provider of order) {
      if (await provider()) return;
    }
    setAddrStatus("notfound");
  }

  return (
    <div className="lc-root">
      <style>{css}</style>

      <header className="lc-header">
        <div className="lc-eyebrow">Board Foot &amp; Weight Calculator</div>
        <h1 className="lc-title">Timber<span className="lc-title-tally">Tally</span></h1>
        <p className="lc-sub">
          Volume and location-aware weight for dimensional lumber. Weight uses the
          local equilibrium moisture content (EMC) from USDA Forest Products Lab
          climate data, so the same board weighs more in damp Seattle than in dry
          Las Vegas.
        </p>
      </header>

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
            <div className="lc-actual">Actual: {fmt(size.actT)}&#8243; &#215; {fmt(size.actW)}&#8243;</div>
          </div>

          <div className="lc-row2">
            <div className="lc-field">
              <label className="lc-label">Length (ft)</label>
              <input type="number" min="0.5" step="0.5" value={lengthText}
                onChange={(e) => setLengthText(e.target.value)}
                onBlur={() => {
                  const n = parseFloat(lengthText);
                  setLengthText(!n || n <= 0 ? "1" : String(n));
                }}
                className="lc-input" />
            </div>
            <div className="lc-field">
              <label className="lc-label">Quantity</label>
              <input type="number" min="1" step="1" value={qtyText}
                onChange={(e) => setQtyText(e.target.value)}
                onBlur={() => {
                  const n = Math.floor(parseFloat(qtyText));
                  setQtyText(!n || n < 1 ? "1" : String(n));
                }}
                className="lc-input" />
            </div>
          </div>

          <div className="lc-field">
            <label className="lc-label">Species / material</label>
            <select value={speciesName} onChange={(e) => setSpeciesName(e.target.value)}
              className="lc-input lc-select">
              <optgroup label="Softwood">
                {SPECIES.filter((s) => s.group === "Softwood").map((s) => (
                  <option key={s.name}>{s.name}</option>))}
              </optgroup>
              <optgroup label="Hardwood">
                {SPECIES.filter((s) => s.group === "Hardwood").map((s) => (
                  <option key={s.name}>{s.name}</option>))}
              </optgroup>
            </select>
          </div>

          <div className="lc-field">
            <div className="lc-loc-head">
              <label className="lc-label" style={{ marginBottom: 0 }}>Location</label>
              <button className="lc-geo" onClick={useMyLocation}>
                {geoStatus === "locating" ? "Locating\u2026" : "Use my location"}
              </button>
            </div>

            <div className="lc-addr-row">
              <input
                type="text"
                value={addressText}
                onChange={(e) => setAddressText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") searchAddress(); }}
                placeholder="Enter address, city, or ZIP"
                className="lc-input lc-addr-input"
              />
              <button className="lc-addr-btn" onClick={searchAddress}
                disabled={addrStatus === "searching"}>
                {addrStatus === "searching" ? "\u2026" : "Find"}
              </button>
            </div>
            {addrStatus === "ok" && matchedFrom &&
              <div className="lc-actual">Matched &ldquo;{matchedFrom}&rdquo; &rarr; nearest data city below.</div>}
            {addrStatus === "notfound" &&
              <div className="lc-note">No match for that address. Try a ZIP or &ldquo;City, State&rdquo;, or pick a city below.</div>}
            {addrStatus === "error" &&
              <div className="lc-note">Address lookup failed (network or sandbox). Pick a city below instead.</div>}

            <select value={cityName} onChange={(e) => { setCityName(e.target.value); setGeoStatus(null); setAddrStatus(null); }}
              className="lc-input lc-select">
              {CITIES.map((c) => <option key={c.name}>{c.name}</option>)}
            </select>
            {geoStatus === "ok" && <div className="lc-actual">Snapped to the nearest city in our data.</div>}
            {geoStatus === "denied" && <div className="lc-note">Location permission was denied. Allow it in your browser, or just pick a city above.</div>}
            {geoStatus === "blocked" && <div className="lc-note">This preview can&#8217;t access location (it runs in a sandbox). Pick a city above &mdash; it works the same.</div>}
            {geoStatus === "timeout" && <div className="lc-note">Location timed out. Try again, or pick a city above.</div>}
            {geoStatus === "unsupported" && <div className="lc-note">Your browser doesn&#8217;t support location. Pick a city above.</div>}
          </div>

          <div className="lc-field">
            <label className="lc-label">Month</label>
            <select value={monthIdx} onChange={(e) => setMonthIdx(+e.target.value)}
              className="lc-input lc-select">
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          </div>

          <div className="lc-field">
            <label className="lc-label">Lumber condition</label>
            <div className="lc-chip-wrap">
              {CONDITIONS.map((c) => (
                <button key={c.key}
                  className={`lc-chip ${c.key === conditionKey ? "is-on" : ""}`}
                  onClick={() => setConditionKey(c.key)}>{c.name}</button>
              ))}
            </div>
            <div className="lc-actual">{condition.note}</div>
          </div>

          <div className="lc-pricing">
            <label className="lc-label">Pricing &mdash; enter either side</label>
            <div className="lc-price-two">
              <div className="lc-price-cell">
                <div className="lc-price-cap">$ / MBF (per 1,000 bf)</div>
                <div className="lc-money">
                  <span className="lc-money-sign">$</span>
                  <input type="number" min="0" step="1" inputMode="decimal"
                    value={mbfDisplay}
                    onChange={(e) => { setPriceEdited("mbf"); setMbfText(e.target.value); }}
                    className="lc-input lc-money-input" placeholder="2300" />
                </div>
              </div>
              <div className="lc-price-swap">&#8644;</div>
              <div className="lc-price-cell">
                <div className="lc-price-cap">$ / piece</div>
                <div className="lc-money">
                  <span className="lc-money-sign">$</span>
                  <input type="number" min="0" step="0.01" inputMode="decimal"
                    value={pieceDisplay}
                    onChange={(e) => { setPriceEdited("piece"); setPieceText(e.target.value); }}
                    className="lc-input lc-money-input" placeholder="0.00" />
                </div>
              </div>
            </div>
            <div className="lc-actual">
              Type in a per-thousand price to get the piece price, or a piece price to back out the $/MBF. Based on {fmt(bfEach)} bf per piece.
            </div>
          </div>
        </section>

        <section className="lc-panel lc-results">
          <div className="lc-headline">
            <div className="lc-hl-block">
              <AutoFitNumber className="lc-hl-num">{fmt(results.bfTotal)}</AutoFitNumber>
              <div className="lc-hl-lab">board feet</div>
            </div>
            <div className="lc-hl-div" />
            <div className="lc-hl-block">
              <AutoFitNumber className="lc-hl-num">{fmt(results.wtTotal, 1)}</AutoFitNumber>
              <div className="lc-hl-lab">lbs &#183; {MONTHS[monthIdx].slice(0,3)}</div>
            </div>
            <div className="lc-hl-div" />
            <div className="lc-hl-block">
              <AutoFitNumber className="lc-hl-num">{orderTotal != null ? usd(orderTotal) : "\u2014"}</AutoFitNumber>
              <div className="lc-hl-lab">order total</div>
            </div>
          </div>

          <div className="lc-detail">
            <div className="lc-detail-row"><span>Board feet each</span><span>{fmt(results.bfEach)} bf</span></div>
            <div className="lc-detail-row"><span>Price per piece</span><span>{usd(piecePrice)}</span></div>
            <div className="lc-detail-row"><span>Price per MBF</span><span>{mbfPrice != null ? usd(mbfPrice) + " /M" : "\u2014"}</span></div>
            <div className="lc-detail-row"><span>Weight each</span><span>{fmt(results.wtEach, 1)} lb</span></div>
            <div className="lc-detail-row"><span>Moisture content used</span><span>{fmt(results.mc, 1)}%</span></div>
            <div className="lc-detail-row"><span>Order</span><span>{qty} &#215; {sizeLabel} @ {fmt(lengthFt,1)}&#8242;</span></div>
          </div>

          <div className="lc-season-block">
            <div className="lc-season-title">Total weight through the year &mdash; {city.name}</div>
            {results.byMonth.map((m) => (
              <div key={m.monthIdx} className="lc-bar-row">
                <span className="lc-bar-name">{MONTHS[m.monthIdx].slice(0,3)}</span>
                <div className="lc-bar-track">
                  <div className={`lc-bar-fill ${m.monthIdx === monthIdx ? "is-on" : ""}`}
                    style={{ width: `${(m.weightTotal / maxMonthWeight) * 100}%` }} />
                </div>
                <span className="lc-bar-val">{fmt(m.weightTotal, 0)}</span>
              </div>
            ))}
            <div className="lc-swing">
              Seasonal swing here: <strong>{fmt(swing, 1)} lb</strong> between{" "}
              {MONTHS[lightest.monthIdx].slice(0,3)} (lightest) and{" "}
              {MONTHS[heaviest.monthIdx].slice(0,3)} (heaviest).
              {condition.key === "kiln" &&
                " Kiln-dried and protected, so location barely moves the weight."}
            </div>
          </div>
        </section>
      </div>

      <section className="lc-tools">
        <div className="lc-tools-head">
          <h2 className="lc-tools-title">Recommended tools</h2>
          <span className="lc-tools-disc">
            As an Amazon Associate this site may earn from qualifying purchases.
          </span>
        </div>
        <div className="lc-tools-grid">
          {TOOLS.map((t) => {
            const live = t.url && t.url.length > 0;
            return (
              <a
                key={t.name}
                className={`lc-tool ${live ? "" : "lc-tool-soon"}`}
                href={live ? t.url : undefined}
                target={live ? "_blank" : undefined}
                rel={live ? "sponsored noopener noreferrer" : undefined}
                onClick={live ? undefined : (e) => e.preventDefault()}
              >
                <div className="lc-tool-name">{t.name}</div>
                <div className="lc-tool-blurb">{t.blurb}</div>
                <div className="lc-tool-cta">{live ? "View on Amazon \u2192" : "Link coming soon"}</div>
              </a>
            );
          })}
        </div>
      </section>

      <footer className="lc-foot">
        EMC values: USDA Forest Products Laboratory Research Note FPL-RN-0268
        (Simpson 1998), updated by P. Mitchell / NC State from 1981&#8211;2010 NOAA
        Climate Normals. EMC assumes wood exposed to outdoor air but sheltered
        from rain and sun. Oven-dry densities are species averages; actual weight
        varies with grade and growth. Board footage uses nominal dimensions.
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const css = `
.lc-root{
  --ink:#241c14; --paper:#f6efe3; --card:#fffdf8; --line:#d8cbb4;
  --grain:#7a5c38; --sap:#3f6d4e; --amber:#c8792b; --wet:#2f6b8f;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  color:var(--ink);
  background:
    repeating-linear-gradient(90deg, rgba(122,92,56,.035) 0 2px, transparent 2px 26px),
    var(--paper);
  min-height:100%; padding:32px 20px 48px; box-sizing:border-box;
}
.lc-header{max-width:960px; margin:0 auto 24px;}
.lc-eyebrow{font-size:11px; letter-spacing:.28em; text-transform:uppercase;
  color:var(--grain); font-weight:700;}
.lc-title{font-family:Georgia,"Times New Roman",serif; font-size:52px; line-height:.95;
  margin:6px 0 8px; letter-spacing:-.02em;}
.lc-title-tally{color:var(--sap); font-style:italic;}
.lc-sub{margin:0; max-width:680px; color:#5c4e3c; font-size:14px; line-height:1.5;}

.lc-grid{max-width:960px; margin:0 auto; display:grid;
  grid-template-columns:minmax(0,1.05fr) minmax(0,1fr); gap:20px;}
@media(max-width:780px){.lc-grid{grid-template-columns:1fr;} .lc-title{font-size:42px;}}

.lc-panel{background:var(--card); border:1px solid var(--line); border-radius:4px;
  padding:22px; box-shadow:0 1px 0 rgba(122,92,56,.15);}

.lc-field{margin-bottom:18px;}
.lc-field:last-child{margin-bottom:0;}
.lc-label{display:block; font-size:11px; letter-spacing:.16em; text-transform:uppercase;
  color:var(--grain); font-weight:700; margin-bottom:8px;}
.lc-actual{margin-top:7px; font-size:12px; color:#8a7a62; font-style:italic;}
.lc-note{margin-top:7px; font-size:12px; line-height:1.45; color:#5c4e3c;
  background:#f3ecdd; border-left:3px solid var(--amber); padding:7px 9px;
  border-radius:0 3px 3px 0;}

.lc-chip-wrap{display:flex; flex-wrap:wrap; gap:6px;}
.lc-chip{font:inherit; font-size:13px; padding:6px 11px; border:1px solid var(--line);
  background:#fff; border-radius:3px; cursor:pointer; color:#6b5c46; transition:.12s;}
.lc-chip:hover{border-color:var(--grain);}
.lc-chip.is-on{background:var(--ink); color:var(--paper); border-color:var(--ink);}

.lc-row2{display:grid; grid-template-columns:1fr 1fr; gap:12px;}
.lc-input{font:inherit; width:100%; box-sizing:border-box; padding:9px 11px;
  border:1px solid var(--line); border-radius:3px; background:#fff; color:var(--ink);}
.lc-input:focus{outline:2px solid var(--sap); outline-offset:1px; border-color:var(--sap);}
.lc-select{cursor:pointer;}

.lc-loc-head{display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;}
.lc-pricing{margin-top:18px; padding-top:18px; border-top:1px solid var(--line);}
.lc-price-two{display:grid; grid-template-columns:1fr auto 1fr; align-items:end; gap:10px;}
.lc-price-cell{min-width:0;}
.lc-price-cap{font-size:11px; color:#8a7a62; margin-bottom:5px;}
.lc-price-swap{font-size:18px; color:var(--sap); padding-bottom:8px;}
.lc-money{display:flex; align-items:center; border:1px solid var(--line);
  border-radius:3px; background:#fff; overflow:hidden;}
.lc-money:focus-within{outline:2px solid var(--sap); outline-offset:1px; border-color:var(--sap);}
.lc-money-sign{padding:0 6px 0 10px; color:#8a7a62; font-size:14px;}
.lc-money-input{border:none !important; outline:none !important; padding-left:2px;
  background:transparent;}
.lc-money-input:focus{outline:none !important;}
.lc-addr-row{display:flex; gap:8px; margin-bottom:8px;}
.lc-addr-input{flex:1;}
.lc-addr-btn{font:inherit; font-size:13px; font-weight:600; padding:0 16px;
  border:1px solid var(--sap); background:var(--sap); color:#fff; border-radius:3px;
  cursor:pointer; white-space:nowrap;}
.lc-addr-btn:hover{background:#356044;}
.lc-addr-btn:disabled{opacity:.6; cursor:default;}
.lc-geo{font:inherit; font-size:12px; padding:3px 9px; border:1px solid var(--wet);
  color:var(--wet); background:#fff; border-radius:3px; cursor:pointer;}
.lc-geo:hover{background:var(--wet); color:#fff;}

.lc-headline{display:flex; flex-wrap:wrap; align-items:flex-start; gap:14px 18px; padding-bottom:18px;
  border-bottom:1px solid var(--line); margin-bottom:16px;}
.lc-hl-block{flex:1 1 90px; min-width:0;}
.lc-hl-num{font-family:Georgia,serif; line-height:1.05; font-variant-numeric:tabular-nums;}
.lc-hl-lab{font-size:11px; letter-spacing:.14em; text-transform:uppercase;
  color:var(--grain); margin-top:6px; font-weight:700;}
.lc-hl-div{width:1px; align-self:stretch; background:var(--line);}

.lc-detail{margin-bottom:20px;}
.lc-detail-row{display:flex; justify-content:space-between; align-items:baseline;
  gap:12px; font-size:13px; padding:6px 0; border-bottom:1px dotted var(--line); color:#5c4e3c;}
.lc-detail-row span:first-child{flex:0 1 auto; min-width:0;}
.lc-detail-row span:last-child{flex:0 0 auto; text-align:right; white-space:nowrap;
  font-variant-numeric:tabular-nums; font-weight:600; color:var(--ink);}

.lc-season-title{font-size:11px; letter-spacing:.14em; text-transform:uppercase;
  color:var(--grain); font-weight:700; margin-bottom:12px;}
.lc-bar-row{display:grid; grid-template-columns:34px 1fr auto; align-items:center;
  gap:9px; margin-bottom:6px;}
.lc-bar-name{font-size:12px; color:#6b5c46;}
.lc-bar-track{height:13px; background:#efe6d4; border-radius:2px; overflow:hidden;}
.lc-bar-fill{height:100%; background:var(--grain); border-radius:2px; transition:width .3s;}
.lc-bar-fill.is-on{background:var(--wet);}
.lc-bar-val{font-size:12px; text-align:right; white-space:nowrap; min-width:44px;
  font-variant-numeric:tabular-nums; font-weight:600; color:var(--ink);}
.lc-swing{margin-top:12px; font-size:12.5px; line-height:1.5; color:#5c4e3c;
  background:#f3ecdd; border-left:3px solid var(--wet); padding:9px 11px; border-radius:0 3px 3px 0;}

.lc-tools{max-width:960px; margin:26px auto 0; padding-top:22px; border-top:1px solid var(--line);}
.lc-tools-head{display:flex; flex-wrap:wrap; align-items:baseline; justify-content:space-between;
  gap:6px 14px; margin-bottom:14px;}
.lc-tools-title{font-family:Georgia,serif; font-size:20px; margin:0; color:var(--ink);}
.lc-tools-disc{font-size:11px; color:#8a7a62; font-style:italic;}
.lc-tools-grid{display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px;}
.lc-tool{display:flex; flex-direction:column; text-decoration:none; background:var(--card);
  border:1px solid var(--line); border-radius:4px; padding:14px; transition:.12s; color:var(--ink);}
.lc-tool:hover{border-color:var(--grain); box-shadow:0 2px 6px rgba(122,92,56,.12);}
.lc-tool-soon{opacity:.72; cursor:default;}
.lc-tool-soon:hover{border-color:var(--line); box-shadow:none;}
.lc-tool-name{font-weight:700; font-size:14px; margin-bottom:5px;}
.lc-tool-blurb{font-size:12px; color:#5c4e3c; line-height:1.45; flex:1;}
.lc-tool-cta{margin-top:10px; font-size:12px; font-weight:700; color:var(--sap); letter-spacing:.02em;}
.lc-tool-soon .lc-tool-cta{color:#a89a80;}

.lc-foot{max-width:960px; margin:22px auto 0; font-size:11px; color:#8a7a62;
  line-height:1.5; border-top:1px solid var(--line); padding-top:14px;}
`;
