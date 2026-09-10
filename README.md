# 심지우 | 콘텐츠 마케팅 포트폴리오

콘텐츠 전략 · 디지털 콘텐츠 · AI 기반 제작 · 브랜드 경험 · 데이터 분석 포트폴리오.

## 구조

| 파일 | 역할 |
|---|---|
| `portfolio.dc.html` | **원본.** 사이트 구조 + 케이스(`projects`) + Profile |
| `index.html` | 빌드 결과 (자동 생성 — 직접 수정 금지) |
| `support.js` | 렌더링 런타임 |
| `data/*.csv` | 시트에서 동기화되는 데이터 |
| `scripts/` | 빌드·추출 스크립트 (Node, 의존성 없음) |
| `assets/` | 이미지·PDF |
| `.github/workflows/` | 자동 빌드·배포 |

## 데이터를 어디서 고치나

- **아카이브 / 성과 / 워크플로 / 태그** → Google Sheet (→ 자동 반영)
- **SELECTED WORK 케이스 / Profile** → `portfolio.dc.html` 직접 편집
- **세부 셋업** → [SETUP.md](SETUP.md)

## 로컬에서 빌드 (선택, Node 20+)

```
node scripts/build.mjs      # data/*.csv → index.html
node scripts/extract.mjs    # portfolio.dc.html → data/*.csv (초기 추출)
```

`SHEET_ID` 환경변수를 주면 빌드 시 시트를 직접 내려받는다.

## 섹션

01 HERO · 02 HOW I WORK · 03 SELECTED WORK · 04 ARCHIVE · 05 IMPACT · 06 AI WORKFLOW · 07 WHAT I BRING · 08 CONTACT

## 사실관계 · 디자인 규칙

`CLAUDE.md` 참조 (수치·이력·톤·컬러 규칙).
