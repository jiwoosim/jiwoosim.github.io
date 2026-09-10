// portfolio.dc.html 의 현재 데이터 → data/*.csv 로 추출.
// 최초 1회 실행해서 나온 CSV를 구글 시트에 붙여넣으면 됨.
//   node scripts/extract.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { locateAssignment, evalLiteral, toCSV } from "./lib.mjs";
import { TABS, SCALARS } from "./schema.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "portfolio.dc.html");
const DATA = join(ROOT, "data");

const src = readFileSync(SRC, "utf8");
mkdirSync(DATA, { recursive: true });

for (const [tab, def] of Object.entries(TABS)) {
  const loc = locateAssignment(src, def.array);
  if (!loc) { console.warn(`⚠ ${def.array} 배열을 찾지 못함 — 건너뜀`); continue; }
  const value = evalLiteral(src.slice(loc.valueStart, loc.valueEnd));
  const rows = value.map(def.toRow);
  writeFileSync(join(DATA, `${tab}.csv`), toCSV(def.header, rows), "utf8");
  console.log(`✔ data/${tab}.csv  (${rows.length} rows)`);
}

// 스칼라값 → meta.csv
const meta = [];
const fieldRe = (name) => new RegExp(`${name}\\s*=\\s*(["'\`])([\\s\\S]*?)\\1`);
for (const [key, def] of Object.entries(SCALARS)) {
  let v = "";
  if (def.kind === "field") {
    const m = src.match(fieldRe(def.array));
    if (m) v = m[2];
  } else if (def.kind === "helmet-title") {
    const m = src.match(/<title>([\s\S]*?)<\/title>/);
    if (m) v = m[1].trim();
  } else if (def.kind === "helmet-desc") {
    const m = src.match(/<meta\s+name="description"\s+content="([^"]*)"/);
    if (m) v = m[1];
  }
  meta.push({ key, value: v });
}
writeFileSync(join(DATA, "meta.csv"), toCSV(["key", "value"], meta), "utf8");
console.log(`✔ data/meta.csv  (${meta.length} rows)`);
console.log("\n완료. data/ 안의 CSV를 각각 같은 이름의 시트 탭에 붙여넣으세요.");
