// 공통 유틸 — 외부 의존성 없음 (Node 20+ 내장 기능만 사용)

/** RFC4180 CSV 파서. 따옴표·내부 콤마·줄바꿈·"" 이스케이프 처리. */
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  // 완전히 빈 줄 제거
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

/** 헤더 있는 CSV 텍스트 → 객체 배열 */
export function csvToObjects(text) {
  const rows = parseCSV(text);
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const o = {};
    header.forEach((h, i) => { o[h] = (r[i] ?? "").trim(); });
    return o;
  });
}

/** 값 배열 → CSV 텍스트 (모든 필드 따옴표) */
export function toCSV(header, records) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [header.map(esc).join(",")];
  for (const rec of records) lines.push(header.map((h) => esc(rec[h])).join(","));
  return lines.join("\n") + "\n";
}

/**
 * 소스에서 `  NAME = [ ... ];` 의 배열 리터럴 위치를 찾는다.
 * 문자열/템플릿 리터럴 안의 대괄호는 무시. 반환: {matchStart, valueStart, valueEnd, matchEnd}
 */
export function locateAssignment(src, name) {
  const re = new RegExp(`(^|\\n)([ \\t]*)${name}\\s*=\\s*`, "g");
  const m = re.exec(src);
  if (!m) return null;
  const valueStart = m.index + m[0].length;
  const open = src[valueStart];
  if (open !== "[" && open !== "{") return null;
  const close = open === "[" ? "]" : "}";
  let depth = 0, i = valueStart, str = null;
  for (; i < src.length; i++) {
    const c = src[i], p = src[i - 1];
    if (str) {
      if (c === str && p !== "\\") str = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { str = c; continue; }
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) { i++; break; } }
  }
  // 뒤따르는 세미콜론 포함
  let end = i;
  while (src[end] === " " || src[end] === "\t") end++;
  if (src[end] === ";") end++;
  return { matchStart: m.index + m[1].length, valueStart, valueEnd: i, matchEnd: end, indent: m[2] };
}

/** JS 객체 리터럴 텍스트를 실제 값으로 평가 (신뢰된 소스 전용) */
export function evalLiteral(text) {
  return new Function(`"use strict";return (${text});`)();
}

/** 값 → 보기 좋은 JS 리터럴 텍스트 (JSON은 유효한 JS이므로 그대로 사용) */
export function jsLiteral(value, indent = "  ") {
  return JSON.stringify(value, null, 2)
    .split("\n")
    .map((line, i) => (i === 0 ? line : indent + line))
    .join("\n");
}
