// 시트 탭 ↔ portfolio.dc.html 배열 매핑 정의.
// 새 컬럼을 추가하려면 여기 fields 에만 넣으면 extract/build 양쪽에 반영됨.

const splitRoles = (s) => String(s || "").split("|").map((x) => x.trim()).filter(Boolean);
const joinRoles = (a) => (Array.isArray(a) ? a.join("|") : String(a || ""));
const num = (s) => { const n = Number(String(s).replace(/,/g, "").trim()); return Number.isFinite(n) ? n : 0; };
const truthy = (s) => /^(true|1|y|yes|o|✓)$/i.test(String(s).trim());

/** 객체에서 빈 문자열/undefined 키 제거 */
const prune = (o) => {
  const r = {};
  for (const [k, v] of Object.entries(o)) {
    if (v === "" || v === undefined || v === null) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    r[k] = v;
  }
  return r;
};

export const TABS = {
  archive: {
    array: "archive",
    // CSV 컬럼 순서
    header: ["cat", "year", "title", "roles", "media", "featured", "url", "img", "fit", "bg"],
    // 객체 → CSV 행
    toRow: (o) => ({
      cat: o.cat, year: o.year, title: o.title,
      roles: joinRoles(o.roles), media: o.media,
      featured: o.featured ? "TRUE" : "",
      url: o.url || "", img: o.img || "", fit: o.fit || "", bg: o.bg || "",
    }),
    // CSV 행 → 객체
    toObj: (r) => prune({
      cat: r.cat, year: r.year, title: r.title,
      roles: splitRoles(r.roles), media: r.media,
      featured: truthy(r.featured) ? true : "",
      url: r.url, img: r.img, fit: r.fit, bg: r.bg,
    }),
  },

  impacts: {
    array: "impacts",
    header: ["display", "label", "note", "source", "value", "pre", "suf"],
    toRow: (o) => ({
      display: o.display || "", label: o.label || "", note: o.note || "",
      source: o.source || "", value: o.value ?? 0, pre: o.pre || "", suf: o.suf || "",
    }),
    toObj: (r) => ({
      value: num(r.value), pre: r.pre || "", suf: r.suf || "",
      display: r.display || "", label: r.label || "", note: r.note || "", source: r.source || "",
    }),
  },

  workflow: {
    array: "workflow",
    header: ["no", "name", "tag", "problem", "system", "impact", "slot"],
    toRow: (o) => ({ no: o.no, name: o.name, tag: o.tag, problem: o.problem, system: o.system, impact: o.impact, slot: o.slot || "" }),
    toObj: (r) => prune({ no: r.no, name: r.name, tag: r.tag, problem: r.problem, system: r.system, impact: r.impact, slot: r.slot }),
  },

  bringItems: {
    array: "bringItems",
    header: ["no", "name", "desc"],
    toRow: (o) => ({ no: o.no, name: o.name, desc: o.desc }),
    toObj: (r) => ({ no: r.no, name: r.name, desc: r.desc }),
  },

  tags: {
    array: "tags",
    header: ["tag"],
    scalarList: true, // ["a","b"] 형태
    toRow: (v) => ({ tag: v }),
    toObj: (r) => r.tag,
  },

  introTiles: {
    array: "introTiles",
    header: ["tile"],
    scalarList: true,
    toRow: (v) => ({ tile: v }),
    toObj: (r) => r.tile,
  },
};

// 클래스 필드가 아니라 단일 값 — 정규식으로 치환
export const SCALARS = {
  archiveSpan: { array: "archiveSpan", kind: "field", quote: true },
  title: { kind: "helmet-title" },
  description: { kind: "helmet-desc" },
};
