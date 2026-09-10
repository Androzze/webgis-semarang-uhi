// ===========================================================
// KONFIGURASI VARIABEL
// Sesuaikan nama kolom di sini kalau GeoJSON kamu berubah.
// ===========================================================
const VAR_CONFIG = {
  lst:       { 2016: "lst2016_me",  2026: "lst2026_me",  label: "LST (°C)",           ramp: "thermal" },
  ndvi:      { 2016: "ndvi2016_m",  2026: "ndvi2026_m",  label: "NDVI",               ramp: "green" },
  ndbi:      { 2016: "ndbi2016_m",  2026: "ndbi2026_m",  label: "NDBI",               ramp: "thermal" },
  ndwi:      { 2016: "ndwi2016_m",  2026: "ndwi2026_m",  label: "NDWI — indeks air",  ramp: "cold" },
  built:     { 2016: "built2016",   2026: "built2026",   label: "Built-up fraction",  ramp: "thermal" },
  popdens:   { 2016: "PopDens16",   2026: "PopDens26",   label: "Kepadatan penduduk", ramp: "cold" },

  delta_lst:     { 2016: "delta_LST",     2026: "delta_LST",     label: "Delta LST (°C)",       ramp: "diverging" },
  delta_ndvi:    { 2016: "delta_NDVI",    2026: "delta_NDVI",    label: "Delta NDVI",           ramp: "diverging" },
  delta_ndbi:    { 2016: "delta_NDBI",    2026: "delta_NDBI",    label: "Delta NDBI",           ramp: "diverging" },
  delta_ndwi:    { 2016: "delta_NDWI",    2026: "delta_NDWI",    label: "Delta NDWI",           ramp: "diverging" },
  delta_fvc:     { 2016: "delta_FVC",     2026: "delta_FVC",     label: "Delta FVC (vegetasi)", ramp: "diverging" },
  delta_built:   { 2016: "delta_built",   2026: "delta_built",   label: "Delta Built-up",       ramp: "diverging" },
  delta_wsf:     { 2016: "delta_WSF",     2026: "delta_WSF",     label: "Delta WSF",            ramp: "diverging" },
  delta_pwg:     { 2016: "delta_PWG",     2026: "delta_PWG",     label: "Delta PWG",            ramp: "diverging" },
  delta_popdens: { 2016: "delta_PopDens", 2026: "delta_PopDens", label: "Delta Kepadatan Penduduk", ramp: "diverging" },

  road_density:  { 2016: "road_density",  2026: "road_density",  label: "Kepadatan jalan",        ramp: "green" },
  distCBD:       { 2016: "Distance matrix_cbd",           2026: "Distance matrix_cbd",           label: "Jarak ke CBD (km)",          ramp: "thermal" },
  distArterial:  { 2016: "distance_arterial_arterial_",   2026: "distance_arterial_arterial_",   label: "Jarak ke jalan arteri (km)", ramp: "thermal" },
  distCoastline: { 2016: "distance_coastline_coastline_", 2026: "distance_coastline_coastline_", label: "Jarak ke garis pantai (km)", ramp: "cold" },

  ols_residuals:      { 2016: "ols_residuals",      2026: "ols_residuals",      label: "Residual OLS (anomali)",        ramp: "diverging" },
  spatial_residuals:  { 2016: "spatial_residuals",  2026: "spatial_residuals",  label: "Residual model spasial (SEM)",  ramp: "diverging" },
  ols_predicted:      { 2016: "ols_predicted",      2026: "ols_predicted",      label: "Prediksi model (ΔLST)",         ramp: "diverging" },

  lisa:          { 2016: "lisa_cluster",  2026: "lisa_cluster",  label: "Klaster LISA",       ramp: "categorical" },
  lisa_quadrant: { 2016: "lisa_quadrant", 2026: "lisa_quadrant", label: "Kuadran LISA (angka)", ramp: "categorical_quadrant" },
  lisa_pval:     { 2016: "lisa_p_val",    2026: "lisa_p_val",    label: "Signifikansi LISA (p-value)", ramp: "cold" }
};

const LISA_COLORS = {
  "High-High": "#C1441E",
  "Low-Low": "#2F6B8A",
  "Low-High": "#8FBEDC",
  "High-Low": "#E8A688",
  "Not Significant": "#D8DCE1"
};

// lisa_quadrant biasanya berupa angka: 1=HH, 2=LH, 3=LL, 4=HL, 0=not significant
const LISA_QUADRANT_COLORS = {
  0: "#D8DCE1",
  1: "#C1441E",
  2: "#8FBEDC",
  3: "#2F6B8A",
  4: "#E8A688"
};
const LISA_QUADRANT_LABELS = {
  0: "Not Significant",
  1: "High-High",
  2: "Low-High",
  3: "Low-Low",
  4: "High-Low"
};

let geojsonData = null;
let geoLayer = null;      // main single map layer
let geoLayerLeft = null;  // swipe mode: 2016
let geoLayerRight = null; // swipe mode: 2026
let swipeMode = false;

// ---------------------------------------------------------------
// MAP SETUP — CartoDB Positron basemap
// ---------------------------------------------------------------
const map = L.map("map", { zoomControl: true }).setView([-7.0, 110.4], 11);
const mapLeft = L.map("map-left", { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false, touchZoom: false }).setView([-7.0, 110.4], 11);
const mapRight = L.map("map-right", { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false, touchZoom: false }).setView([-7.0, 110.4], 11);

const positronUrl = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=cb1_31c8_1_7199bf1b7f1b9ebeeac68ad2";
const positronAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

L.tileLayer(positronUrl, { maxZoom: 19, attribution: positronAttr }).addTo(map);
L.tileLayer(positronUrl, { maxZoom: 19 }).addTo(mapLeft);
L.tileLayer(positronUrl, { maxZoom: 19 }).addTo(mapRight);

// keep the three maps in sync when not swiping (defensive; swipe maps stay hidden until toggled)
map.on("move zoom", () => {
  if (swipeMode) {
    mapLeft.setView(map.getCenter(), map.getZoom(), { animate: false });
    mapRight.setView(map.getCenter(), map.getZoom(), { animate: false });
  }
});

// ---------------------------------------------------------------
// LOAD DATA
// ---------------------------------------------------------------
fetch("grid_semarang.geojson")
  .then(res => res.json())
  .then(data => {
    geojsonData = data;
    render();
  })
  .catch(err => {
    console.error("Gagal load GeoJSON:", err);
    alert("Gagal load grid_semarang.geojson. Pastikan file ada satu folder dengan index.html dan dibuka lewat Live Server.");
  });

// ---------------------------------------------------------------
// COLOR HELPERS
// ---------------------------------------------------------------
function getMinMax(field) {
  let min = Infinity, max = -Infinity;
  geojsonData.features.forEach(f => {
    const v = f.properties[field];
    if (typeof v === "number" && !isNaN(v)) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
  });
  return { min, max };
}

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16)
  };
}

function blendHex(hexA, hexB, t) {
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r},${g},${bl})`;
}

function interpolateStops(t, stops) {
  t = Math.max(0, Math.min(1, t));
  const n = stops.length - 1;
  const idx = Math.min(n - 1, Math.floor(t * n));
  const localT = (t * n) - idx;
  return blendHex(stops[idx], stops[idx + 1], localT);
}

const RAMPS = {
  thermal:  ["#2F6B8A", "#8FBEDC", "#F3D9A4", "#E8814A", "#C1441E"],
  green:    ["#8A6A4A", "#C9A876", "#A9C48A", "#4F7A3C"],
  cold:     ["#EAF1F5", "#B9D3E0", "#6F9FB8", "#2F6B8A"],
  diverging_neg: ["#0E4E68", "#2F6B8A", "#FFFFFF"],
  diverging_pos: ["#FFFFFF", "#E8814A", "#C1441E"]
};

function colorScale(value, min, max, ramp) {
  if (value === null || value === undefined || isNaN(value)) return "#D8DCE1";
  const t = (value - min) / (max - min || 1);
  if (ramp === "thermal") return interpolateStops(t, RAMPS.thermal);
  if (ramp === "green") return interpolateStops(t, RAMPS.green);
  if (ramp === "cold") return interpolateStops(t, RAMPS.cold);
  return "#888888";
}

function divergingColor(value, absMax) {
  if (value === null || value === undefined || isNaN(value)) return "#D8DCE1";
  if (value < 0) {
    const t = 1 - Math.min(1, Math.abs(value) / (absMax || 1));
    return interpolateStops(t, RAMPS.diverging_neg);
  } else {
    const t = Math.min(1, value / (absMax || 1));
    return interpolateStops(t, RAMPS.diverging_pos);
  }
}

// ---------------------------------------------------------------
// STYLE / POPUP
// ---------------------------------------------------------------
function styleFeature(feature, field, ramp, minMax) {
  const val = feature.properties[field];
  let fillColor;
  if (ramp === "categorical") {
    fillColor = LISA_COLORS[val] || "#D8DCE1";
  } else if (ramp === "categorical_quadrant") {
    fillColor = LISA_QUADRANT_COLORS[val] ?? "#D8DCE1";
  } else if (ramp === "diverging") {
    fillColor = divergingColor(val, minMax.max);
  } else {
    fillColor = colorScale(val, minMax.min, minMax.max, ramp);
  }
  return {
    color: "#8B94A0",
    weight: 0.5,
    fillColor: fillColor,
    fillOpacity: 0.8
  };
}

function popupContent(props) {
  const rows = [
    ["ID grid", props.id],
    ["LST 2016", fmt(props.lst2016_me)],
    ["LST 2026", fmt(props.lst2026_me)],
    ["Delta LST", fmt(props.delta_LST)],
    ["Delta NDVI", fmt(props.delta_NDVI)],
    ["Delta Built-up", fmt(props.delta_built)],
    ["NDWI 2026", fmt(props.ndwi2026_m)],
    ["Built-up 2026", fmt(props.built2026)],
    ["Kepadatan penduduk 2026", fmt(props.PopDens26)],
    ["Kepadatan jalan", fmt(props.road_density)],
    ["Jarak ke CBD (km)", fmt(props["Distance matrix_cbd"])],
    ["Jarak ke arteri (km)", fmt(props.distance_arterial_arterial_)],
    ["Jarak ke pantai (km)", fmt(props.distance_coastline_coastline_)],
    ["Residual OLS", fmt(props.ols_residuals)],
    ["Residual spasial (SEM)", fmt(props.spatial_residuals)],
    ["Klaster LISA", props.lisa_cluster ?? "-"]
  ];
  return `<table>${rows.map(([k,v]) => `<tr><td>${k}</td><td><b>${v}</b></td></tr>`).join("")}</table>`;
}

function fmt(v) {
  if (typeof v === "number") return v.toFixed(2);
  return v ?? "-";
}

// ---------------------------------------------------------------
// SIDEBAR: legend, chart, info panel
// ---------------------------------------------------------------
function updateLegend(ramp, minMax) {
  const gradientEl = document.getElementById("legend-gradient");
  const minEl = document.getElementById("legend-min");
  const maxEl = document.getElementById("legend-max");
  const catEl = document.getElementById("legend-categorical");
  catEl.innerHTML = "";

  if (ramp === "categorical") {
    gradientEl.style.background = "none";
    minEl.textContent = "";
    maxEl.textContent = "";
    Object.entries(LISA_COLORS).forEach(([label, color]) => {
      const row = document.createElement("div");
      row.className = "legend-cat-item";
      row.innerHTML = `<span class="legend-cat-swatch" style="background:${color}"></span><span>${label}</span>`;
      catEl.appendChild(row);
    });
    return;
  }

  if (ramp === "categorical_quadrant") {
    gradientEl.style.background = "none";
    minEl.textContent = "";
    maxEl.textContent = "";
    Object.entries(LISA_QUADRANT_LABELS).forEach(([code, label]) => {
      const row = document.createElement("div");
      row.className = "legend-cat-item";
      row.innerHTML = `<span class="legend-cat-swatch" style="background:${LISA_QUADRANT_COLORS[code]}"></span><span>${label}</span>`;
      catEl.appendChild(row);
    });
    return;
  }

  let stops;
  if (ramp === "thermal") stops = RAMPS.thermal;
  else if (ramp === "green") stops = RAMPS.green;
  else if (ramp === "cold") stops = RAMPS.cold;
  else if (ramp === "diverging") stops = ["#0E4E68", "#2F6B8A", "#FFFFFF", "#E8814A", "#C1441E"];
  else stops = ["#ccc", "#333"];

  gradientEl.style.background = `linear-gradient(to right, ${stops.join(",")})`;
  if (ramp === "diverging") {
    minEl.textContent = "-" + minMax.max.toFixed(1);
    maxEl.textContent = "+" + minMax.max.toFixed(1);
  } else {
    minEl.textContent = minMax.min.toFixed(1);
    maxEl.textContent = minMax.max.toFixed(1);
  }
}

function drawHistogram(field, ramp, minMax) {
  const canvas = document.getElementById("histChart");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (ramp === "categorical" || ramp === "categorical_quadrant") {
    const colorMap = ramp === "categorical" ? LISA_COLORS : LISA_QUADRANT_COLORS;
    const labelMap = ramp === "categorical" ? null : LISA_QUADRANT_LABELS;
    const counts = {};
    geojsonData.features.forEach(f => {
      const v = f.properties[field];
      counts[v] = (counts[v] || 0) + 1;
    });
    const keys = Object.keys(colorMap);
    const maxCount = Math.max(...keys.map(k => counts[k] || 0), 1);
    const barW = canvas.width / keys.length;
    keys.forEach((key, i) => {
      const c = counts[key] || 0;
      const h = (c / maxCount) * (canvas.height - 24);
      ctx.fillStyle = colorMap[key];
      ctx.fillRect(i * barW + 4, canvas.height - h - 18, barW - 8, h);
      ctx.fillStyle = "#5B6470";
      ctx.font = "9px Inter";
      ctx.textAlign = "center";
      ctx.fillText(c, i * barW + barW / 2, canvas.height - h - 22 < 10 ? 10 : canvas.height - h - 22);
    });
    return;
  }

  const values = geojsonData.features
    .map(f => f.properties[field])
    .filter(v => typeof v === "number" && !isNaN(v));

  const bins = 16;
  const lo = ramp === "diverging" ? -minMax.max : minMax.min;
  const hi = minMax.max;
  const binW = (hi - lo) / bins || 1;
  const counts = new Array(bins).fill(0);
  values.forEach(v => {
    let idx = Math.floor((v - lo) / binW);
    idx = Math.max(0, Math.min(bins - 1, idx));
    counts[idx]++;
  });
  const maxCount = Math.max(...counts, 1);
  const barW = canvas.width / bins;

  counts.forEach((c, i) => {
    const h = (c / maxCount) * (canvas.height - 8);
    const binVal = lo + (i + 0.5) * binW;
    let color;
    if (ramp === "diverging") color = divergingColor(binVal, hi);
    else color = colorScale(binVal, minMax.min, minMax.max, ramp);
    ctx.fillStyle = color;
    ctx.fillRect(i * barW + 1, canvas.height - h, barW - 2, h);
  });
}

function showGridInfo(props) {
  const el = document.getElementById("gridInfo");
  const rows = [
    ["ID grid", props.id],
    ["LST 2016", fmt(props.lst2016_me) + " °C"],
    ["LST 2026", fmt(props.lst2026_me) + " °C"],
    ["Delta LST", fmt(props.delta_LST) + " °C"],
    ["Delta NDVI", fmt(props.delta_NDVI)],
    ["Delta Built-up", fmt(props.delta_built)],
    ["NDWI 2026", fmt(props.ndwi2026_m)],
    ["Built-up 2026", fmt(props.built2026)],
    ["Kepadatan jalan", fmt(props.road_density)],
    ["Klaster LISA", props.lisa_cluster ?? "-"],
    ["Jarak ke CBD", fmt(props["Distance matrix_cbd"]) + " km"],
    ["Jarak ke arteri", fmt(props.distance_arterial_arterial_) + " km"],
    ["Jarak ke pantai", fmt(props.distance_coastline_coastline_) + " km"],
    ["Residual OLS", fmt(props.ols_residuals)],
    ["Residual spasial (SEM)", fmt(props.spatial_residuals)]
  ];
  el.innerHTML = `
    <span class="control-label">Detail grid #${props.id}</span>
    <div class="info-table">
      ${rows.map(([k,v]) => `<div class="info-row"><span class="k">${k}</span><span class="v">${v}</span></div>`).join("")}
    </div>
  `;
}

// ---------------------------------------------------------------
// MAIN RENDER (single map mode)
// ---------------------------------------------------------------
function render() {
  if (!geojsonData || swipeMode) return;

  const year = document.getElementById("yearSel").value;
  const varKey = document.getElementById("varSel").value;
  const cfg = VAR_CONFIG[varKey];
  const field = cfg[year];

  let minMax = { min: 0, max: 1 };
  if (cfg.ramp === "diverging") {
    const mm = getMinMax(field);
    const absMax = Math.max(Math.abs(mm.min), Math.abs(mm.max));
    minMax = { min: -absMax, max: absMax };
  } else if (cfg.ramp !== "categorical" && cfg.ramp !== "categorical_quadrant") {
    minMax = getMinMax(field);
  }

  if (geoLayer) map.removeLayer(geoLayer);

  geoLayer = L.geoJSON(geojsonData, {
    style: feature => styleFeature(feature, field, cfg.ramp, minMax),
    onEachFeature: (feature, layer) => {
      layer.bindPopup(popupContent(feature.properties));
      layer.on("mouseover", () => layer.setStyle({ weight: 1.6, color: "#1C1F23" }));
      layer.on("mouseout", () => layer.setStyle({ weight: 0.5, color: "#8B94A0" }));
      layer.on("click", () => showGridInfo(feature.properties));
    }
  }).addTo(map);

  updateLegend(cfg.ramp, minMax);
  drawHistogram(field, cfg.ramp, minMax);
}

// ---------------------------------------------------------------
// SWIPE MODE (2016 left, 2026 right, same variable)
// ---------------------------------------------------------------
function renderSwipe() {
  if (!geojsonData) return;
  const varKey = document.getElementById("varSel").value;
  const cfg = VAR_CONFIG[varKey];

  let minMax = { min: 0, max: 1 };
  if (cfg.ramp !== "categorical") {
    const mm2016 = getMinMax(cfg[2016]);
    const mm2026 = getMinMax(cfg[2026]);
    minMax = {
      min: Math.min(mm2016.min, mm2026.min),
      max: Math.max(mm2016.max, mm2026.max)
    };
  }

  if (geoLayerLeft) mapLeft.removeLayer(geoLayerLeft);
  if (geoLayerRight) mapRight.removeLayer(geoLayerRight);

  geoLayerLeft = L.geoJSON(geojsonData, {
    style: f => styleFeature(f, cfg[2016], cfg.ramp, minMax)
  }).addTo(mapLeft);

  geoLayerRight = L.geoJSON(geojsonData, {
    style: f => styleFeature(f, cfg[2026], cfg.ramp, minMax)
  }).addTo(mapRight);

  updateLegend(cfg.ramp, minMax);
}

function setSwipeClip(percent) {
  document.getElementById("map-left").style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
  document.getElementById("map-right").style.clipPath = `inset(0 0 0 ${percent}%)`;
  document.getElementById("swipe-handle").style.left = percent + "%";
}

function enterSwipeMode() {
  swipeMode = true;
  document.getElementById("map").style.display = "none";
  document.getElementById("map-left").style.display = "block";
  document.getElementById("map-right").style.display = "block";
  document.getElementById("swipe-handle").style.display = "block";
  document.querySelectorAll(".map-label").forEach(el => el.style.display = "block");
  document.getElementById("yearSel").disabled = true;

  const center = map.getCenter();
  const zoom = map.getZoom();
  mapLeft.setView(center, zoom, { animate: false });
  mapRight.setView(center, zoom, { animate: false });
  setTimeout(() => { mapLeft.invalidateSize(); mapRight.invalidateSize(); }, 50);

  setSwipeClip(50);
  renderSwipe();
}

function exitSwipeMode() {
  swipeMode = false;
  document.getElementById("map").style.display = "block";
  document.getElementById("map-left").style.display = "none";
  document.getElementById("map-right").style.display = "none";
  document.getElementById("swipe-handle").style.display = "none";
  document.querySelectorAll(".map-label").forEach(el => el.style.display = "none");
  document.getElementById("yearSel").disabled = false;
  setTimeout(() => map.invalidateSize(), 50);
  render();
}

// swipe handle drag
let dragging = false;
const handle = document.getElementById("swipe-handle");
const mapWrap = document.querySelector(".map-wrap");

handle.addEventListener("mousedown", () => { dragging = true; });
window.addEventListener("mouseup", () => { dragging = false; });
window.addEventListener("mousemove", e => {
  if (!dragging) return;
  const rect = mapWrap.getBoundingClientRect();
  let pct = ((e.clientX - rect.left) / rect.width) * 100;
  pct = Math.max(2, Math.min(98, pct));
  setSwipeClip(pct);
});
handle.addEventListener("touchstart", () => { dragging = true; });
window.addEventListener("touchend", () => { dragging = false; });
window.addEventListener("touchmove", e => {
  if (!dragging) return;
  const rect = mapWrap.getBoundingClientRect();
  let pct = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
  pct = Math.max(2, Math.min(98, pct));
  setSwipeClip(pct);
});

// ---------------------------------------------------------------
// SEARCH
// ---------------------------------------------------------------
document.getElementById("searchGrid").addEventListener("keydown", e => {
  if (e.key !== "Enter" || !geojsonData) return;
  const query = e.target.value.trim();
  const hint = document.getElementById("searchHint");
  if (!query) return;

  const feature = geojsonData.features.find(f => String(f.properties.id) === query);
  if (!feature) {
    hint.textContent = "Grid tidak ditemukan.";
    hint.style.color = "#C1441E";
    return;
  }
  hint.textContent = `Grid ${query} ditemukan.`;
  hint.style.color = "#5B6470";

  const layer = L.geoJSON(feature);
  const bounds = layer.getBounds();
  if (swipeMode) {
    mapLeft.fitBounds(bounds, { maxZoom: 15 });
    mapRight.fitBounds(bounds, { maxZoom: 15 });
  } else {
    map.fitBounds(bounds, { maxZoom: 15 });
    geoLayer.eachLayer(l => {
      if (String(l.feature.properties.id) === query) {
        l.openPopup();
        showGridInfo(l.feature.properties);
      }
    });
  }
});

// ---------------------------------------------------------------
// EVENT WIRING
// ---------------------------------------------------------------
document.getElementById("yearSel").addEventListener("change", render);
document.getElementById("varSel").addEventListener("change", () => {
  if (swipeMode) renderSwipe(); else render();
});
document.getElementById("swipeToggle").addEventListener("change", e => {
  if (e.target.checked) enterSwipeMode(); else exitSwipeMode();
});
