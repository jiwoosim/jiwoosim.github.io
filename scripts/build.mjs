// 데이터 → 사이트 빌드.
//   1) SHEET_ID 환경변수가 있으면 구글 시트 각 탭을 CSV로 내려받아 data/*.csv 갱신
//   2) data/*.csv 를 portfolio.dc.html 에 주입
//   3) index.html 출력
//
//   node scripts/build.mjs
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { csvToObjects, locateAssignment, jsLiteral } from "./lib.mjs";
import { TABS, SCALARS } from "./schema.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "portfolio.dc.html");
const OUT = join(ROOT, "index.html");
const DATA = join(ROOT, "data");
const SHEET_ID = process.env.SHEET_ID?.trim();

mkdirSync(DATA, { recursive: true });

// ── 1. 시트 → data/*.csv ─────────────────────────────────────────
async function pullSheet() {
  if (!SHEET_ID) { console.log("SHEET_ID 없음 — 커밋된 data/*.csv 로 빌드"); return; }
  const tabs = [...Object.keys(TABS), "meta"];
  for (const tab of tabs) {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (text.includes("<!DOCTYPE html>") || text.startsWith("<HTML")) throw new Error("HTML 반환 (시트 미공개 또는 탭 이름 불일치)");
      writeFileSync(join(DATA, `${tab}.csv`), text, "utf8");
      console.log(`↓ ${tab}.csv`);
    } catch (e) {
      console.warn(`⚠ ${tab} 시트 읽기 실패: ${e.message} — 기존 data/${tab}.csv 유지`);
    }
  }
}

// ── 2. 주입 ──────────────────────────────────────────────────────
function readCSV(name) {
  const f = join(DATA, `${name}.csv`);
  return existsSync(f) ? csvToObjects(readFileSync(f, "utf8")) : null;
}

function injectArrays(src) {
  let out = src;
  // 뒤에서 앞으로 치환해야 인덱스가 안 밀림 → 위치 수집 후 역순 적용
  const edits = [];
  for (const [tab, def] of Object.entries(TABS)) {
    const rows = readCSV(tab);
    if (!rows) { console.warn(`⚠ data/${tab}.csv 없음 — ${def.array} 원본 유지`); continue; }
    const value = rows.map(def.toObj);
    const loc = locateAssignment(out, def.array);
    if (!loc) { console.warn(`⚠ ${def.array} 주입 위치 못 찾음`); continue; }
    const literal = jsLiteral(value, loc.indent || "  ");
    edits.push({ start: loc.valueStart, end: loc.valueEnd, text: literal, name: def.array, n: value.length });
  }
  edits.sort((a, b) => b.start - a.start);
  for (const e of edits) {
    out = out.slice(0, e.start) + e.text + out.slice(e.end);
    console.log(`✔ ${e.name}  (${e.n})`);
  }
  return out;
}

function injectScalars(src) {
  let out = src;
  const meta = readCSV("meta");
  if (!meta) return out;
  const get = (k) => meta.find((r) => r.key === k)?.value ?? "";
  for (const [key, def] of Object.entries(SCALARS)) {
    const v = get(key);
    if (v === "") continue;
    if (def.kind === "field") {
      out = out.replace(new RegExp(`(${def.array}\\s*=\\s*)(["'\`])[\\s\\S]*?\\2`), `$1"${v.replace(/"/g, '\\"')}"`);
    } else if (def.kind === "helmet-title") {
      out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${v}</title>`);
    } else if (def.kind === "helmet-desc") {
      out = out.replace(/(<meta\s+name="description"\s+content=")[^"]*(")/,`$1${v.replace(/"/g, "&quot;")}$2`);
    }
    console.log(`✔ ${key}`);
  }
  return out;
}

// ── 실행 ─────────────────────────────────────────────────────────
await pullSheet();
let html = readFileSync(SRC, "utf8");
html = injectArrays(html);
html = injectScalars(html);
writeFileSync(OUT, html, "utf8");
// 시트에서 받은 최신 data/*.csv 도 함께 커밋되도록 workflow 에서 처리
console.log(`\n✅ index.html 생성 (${(html.length / 1024).toFixed(0)} KB)`);
