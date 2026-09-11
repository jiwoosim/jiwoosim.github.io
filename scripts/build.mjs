// 데이터 → 사이트 빌드.
//   SHEET_ID = "포트폴리오 아카이브" 스프레드시트 ID
//   SITE       탭 → 사이트 ARCHIVE (포폴반영 = YES 인 프로젝트만)
//   04_METRICS 탭 → 사이트 IMPACT
//   그 외(tags·introTiles·bringItems·workflow·meta) → 커밋된 data/*.csv (코드 관리)
//
//   node scripts/build.mjs
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseCSV, csvToObjects, locateAssignment, jsLiteral } from "./lib.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "portfolio.dc.html");
const OUT = join(ROOT, "index.html");
const DATA = join(ROOT, "data");
const SHEET_ID = process.env.SHEET_ID?.trim();

mkdirSync(DATA, { recursive: true });

// ── 시트 탭 CSV 받기 ────────────────────────────────────────────
async function fetchTab(tab) {
  // headers=1: 시트 첫 행을 확실히 헤더로 취급 (없으면 gviz가 열 타입을 자동추론하면서
  // 텍스트/숫자가 섞인 열의 앞 몇 행을 헤더와 뭉개버리는 경우가 있음)
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}&headers=1`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (text.startsWith("<!DOCTYPE") || text.startsWith("<HTML"))
    throw new Error("HTML 반환 — 시트 미공개 또는 탭 이름 불일치");
  return text;
}

/** headerMarker 를 포함한 행을 헤더로 잡고 객체 배열로 변환 */
function rowsAsObjects(csv, headerMarker) {
  const rows = parseCSV(csv);
  let hi = rows.findIndex((r) => r.some((c) => c.includes(headerMarker)));
  if (hi < 0) hi = 0;
  const header = rows[hi].map((h) => h.replace(/^METRICS\s+/, "").trim());
  return rows.slice(hi + 1).map((r) => {
    const o = {};
    header.forEach((h, i) => (o[h] = (r[i] ?? "").trim()));
    return o;
  });
}
const get = (o, ...keys) => { for (const k of keys) { const v = (o[k] || "").trim(); if (v) return v; } return ""; };
const isUrl = (v) => /^https?:\/\//.test(v);

// ── SITE → archive ──────────────────────────────────────────────
const CAT_BY_TYPE = {
  "영상": "VIDEO", "웹": "WEB", "콘텐츠": "EDITORIAL", "브로슈어/백서": "EDITORIAL",
  "전시/이벤트": "EXHIBITION", "캠페인": "SOCIAL", "인터랙티브": "WEB", "기타": "EDITORIAL",
};
const MEDIA_BY_TYPE = {
  "영상": "video", "웹": "web", "인터랙티브": "web", "전시/이벤트": "photo",
  "캠페인": "image", "콘텐츠": "print", "브로슈어/백서": "print", "기타": "print",
};

function siteToArchive(objs) {
  return objs
    .filter((o) => get(o, "제목") && /^(YES|Y|예|포함)$/i.test(get(o, "포폴반영", "포폴 반영")))
    .map((o) => {
      const type = get(o, "유형");
      const period = get(o, "기간");
      const yearMatch = period.match(/20\d{2}/);
      const item = {
        cat: CAT_BY_TYPE[type] || "EDITORIAL",
        year: yearMatch ? yearMatch[0] : "",
        title: get(o, "제목"),
        media: MEDIA_BY_TYPE[type] || "print",
      };
      if (/^S$/i.test(get(o, "포폴등급", "포폴 등급"))) item.featured = true;
      if (period) item.period = period;
      const contribution = get(o, "기여도");
      if (contribution) item.contribution = contribution;
      const impact = get(o, "핵심성과", "핵심 성과");
      if (impact) item.impact = impact;
      const tools = get(o, "사용툴", "사용 툴");
      if (tools) item.tools = tools;
      const videoUrl = get(o, "영상");
      if (isUrl(videoUrl)) item.videoUrl = videoUrl;
      const imageUrl = get(o, "이미지");
      if (isUrl(imageUrl)) item.imageUrl = imageUrl;
      const docUrl = get(o, "문서");
      if (isUrl(docUrl)) item.docUrl = docUrl;
      const webUrl = get(o, "공개URL", "공개 URL");
      if (isUrl(webUrl)) item.webUrl = webUrl;
      return item;
    });
}

// ── 04_METRICS → impacts ───────────────────────────────────────
function metricsToImpacts(objs, nameById) {
  return objs
    .filter((o) => (o["Metric"] || "").trim() && /확인|verified|yes/i.test(o["Verified"] || ""))
    .map((o) => {
      const change = (o["Change"] || "").trim();
      const phrase = (o["Portfolio Phrase"] || "").trim();
      const before = (o["Before"] || "").trim();
      const after = (o["After"] || "").trim();
      const unit = (o["Unit"] || "").trim();
      // 표기는 사람이 쓴 Portfolio Phrase 우선. 숫자 카운트업은 쓰지 않음(단위가 제각각).
      return {
        value: 0, pre: "", suf: "",
        display: phrase || (before && after ? `${before} → ${after}${unit ? " " + unit : ""}` : change),
        label: (o["Metric"] || "").trim(),
        note: (o["Evidence / Source"] || "").trim(),
        source: nameById[(o["Project ID"] || "").trim()] || (o["Project ID"] || "").trim(),
      };
    });
}

// ── 코드 관리 배열 (data/*.csv) ────────────────────────────────
function fromCSV(name, mapRow) {
  const f = join(DATA, `${name}.csv`);
  if (!existsSync(f)) return null;
  const objs = csvToObjects(readFileSync(f, "utf8"));
  return objs.map(mapRow);
}

// ── 주입 ───────────────────────────────────────────────────────
function replaceArray(src, name, value) {
  const loc = locateAssignment(src, name);
  if (!loc) { console.warn(`⚠ ${name} 주입 위치 못 찾음`); return src; }
  const literal = jsLiteral(value, loc.indent || "  ");
  console.log(`✔ ${name} (${Array.isArray(value) ? value.length : "?"})`);
  return src.slice(0, loc.valueStart) + literal + src.slice(loc.valueEnd);
}

function replaceScalarField(src, name, val) {
  if (!val) return src;
  return src.replace(new RegExp(`(${name}\\s*=\\s*)(["'\`])[\\s\\S]*?\\2`), `$1"${String(val).replace(/"/g, '\\"')}"`);
}

// ── 실행 ───────────────────────────────────────────────────────
let archive = null, impacts = null;
if (SHEET_ID) {
  try {
    const siteCsv = await fetchTab("SITE");
    const metricsCsv = await fetchTab("04_METRICS");
    writeFileSync(join(DATA, "SITE.csv"), siteCsv, "utf8");
    writeFileSync(join(DATA, "04_METRICS.csv"), metricsCsv, "utf8");
    const siteObjs = rowsAsObjects(siteCsv, "제목");
    const metricObjs = rowsAsObjects(metricsCsv, "Portfolio Phrase");
    const nameById = {};
    siteObjs.forEach((o) => (nameById[get(o, "ID")] = get(o, "제목")));
    archive = siteToArchive(siteObjs);
    impacts = metricsToImpacts(metricObjs, nameById);
    console.log(`↓ SITE ${siteObjs.length}행 → archive ${archive.length}`);
    console.log(`↓ 04_METRICS ${metricObjs.length}행 → impacts ${impacts.length}`);
  } catch (e) {
    console.warn(`⚠ 시트 읽기 실패: ${e.message} — 커밋된 스냅샷/원본 유지`);
    const sPath = join(DATA, "SITE.csv");
    if (existsSync(sPath)) {
      const so = rowsAsObjects(readFileSync(sPath, "utf8"), "제목");
      const nameById = {};
      so.forEach((o) => (nameById[get(o, "ID")] = get(o, "제목")));
      archive = siteToArchive(so);
      const kPath = join(DATA, "04_METRICS.csv");
      if (existsSync(kPath)) impacts = metricsToImpacts(rowsAsObjects(readFileSync(kPath, "utf8"), "Portfolio Phrase"), nameById);
    }
  }
} else {
  console.log("SHEET_ID 없음 — archive/impacts 원본 유지");
}

let html = readFileSync(SRC, "utf8");
if (archive && archive.length) html = replaceArray(html, "archive", archive);
if (impacts && impacts.length) html = replaceArray(html, "impacts", impacts);

// 코드 관리 배열
const tags = fromCSV("tags", (r) => r.tag);
const introTiles = fromCSV("introTiles", (r) => r.tile);
const bringItems = fromCSV("bringItems", (r) => ({ no: r.no, name: r.name, desc: r.desc }));
const workflow = fromCSV("workflow", (r) => ({ no: r.no, name: r.name, tag: r.tag, problem: r.problem, system: r.system, impact: r.impact, slot: r.slot }));
if (tags) html = replaceArray(html, "tags", tags);
if (introTiles) html = replaceArray(html, "introTiles", introTiles);
if (bringItems) html = replaceArray(html, "bringItems", bringItems);
if (workflow) html = replaceArray(html, "workflow", workflow);

// meta.csv → archiveSpan / title / description
const meta = existsSync(join(DATA, "meta.csv")) ? csvToObjects(readFileSync(join(DATA, "meta.csv"), "utf8")) : [];
const metaGet = (k) => meta.find((r) => r.key === k)?.value ?? "";
html = replaceScalarField(html, "archiveSpan", metaGet("archiveSpan"));
if (metaGet("title")) html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${metaGet("title")}</title>`);
if (metaGet("description")) html = html.replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${metaGet("description")}$2`);

writeFileSync(OUT, html, "utf8");
console.log(`\n✅ index.html 생성 (${(html.length / 1024).toFixed(0)} KB)`);
