# 셋업 가이드

포트폴리오를 **GitHub Pages**에 올리고, 내용을 **Google Sheet**에서 관리하는 구조.

```
Google Sheet ──▶ GitHub Actions(build.mjs) ──▶ index.html ──▶ GitHub Pages
   (데이터)          6시간마다 / 버튼 / 시트수정             (공개 사이트)
```

- **시트로 관리**: `archive`, `impacts`, `workflow`, `bringItems`, `tags`, `introTiles`, `meta`
- **코드로 직접 관리**: SELECTED WORK 4개 케이스(`projects`), Profile 패널 → `portfolio.dc.html` 안에서 수정
- **이미지·PDF**: `assets/` 폴더에 넣고 커밋. 현재는 회사 서버(`unionbiometrics.com`) 링크를 그대로 쓰는 중

---

## 1. GitHub 저장소 만들기

1. github.com → **New repository**
   - 이름: 예 `jiwoo-portfolio`
   - **Public** 선택
2. 이 폴더 전체를 업로드
   - 웹: repo 첫 화면 → *uploading an existing file* → 폴더 드래그
   - 또는 GitHub Desktop / `git`:
     ```
     git init
     git add .
     git commit -m "init"
     git branch -M main
     git remote add origin https://github.com/<USERNAME>/jiwoo-portfolio.git
     git push -u origin main
     ```
   - `_reference/` 폴더는 `.gitignore`에 걸려 있어 올라가지 않음 (다른 버전 포트폴리오·참고자료)

## 2. Actions 권한 켜기

repo → **Settings → Actions → General → Workflow permissions**
→ **Read and write permissions** 선택 → Save
(Actions가 빌드 결과를 다시 커밋할 수 있어야 함)

## 3. GitHub Pages 켜기

repo → **Settings → Pages**
→ **Source: GitHub Actions** 선택
(브랜치 방식 아님. 이 repo는 Actions로 배포함)

## 4. 첫 배포

repo → **Actions 탭 → "Build & Deploy" → Run workflow**
1~2분 후 **Settings → Pages** 상단에 사이트 주소가 뜸:
`https://<USERNAME>.github.io/jiwoo-portfolio/`

> 이 시점에는 `data/*.csv`(리포에 이미 들어있는 초기값)로 빌드됨.
> 시트 연결 전이라도 사이트는 정상 동작함.

---

## 5. Google Sheet 연결

### 5-1. 시트 만들기

새 스프레드시트 1개. 아래 이름으로 **탭(시트)** 7개를 만든다 (이름 정확히, 대소문자 구분):

| 탭 이름 | 1행(헤더) |
|---|---|
| `archive` | `cat, year, title, roles, media, featured, url, img, fit, bg` |
| `impacts` | `display, label, note, source, value, pre, suf` |
| `workflow` | `no, name, tag, problem, system, impact, slot` |
| `bringItems` | `no, name, desc` |
| `tags` | `tag` |
| `introTiles` | `tile` |
| `meta` | `key, value` |

### 5-2. 초기값 채우기

repo의 `data/` 폴더에 있는 CSV 7개를 각각 같은 이름 탭에 붙여넣는다.
- CSV 파일 열기 → 전체 복사 → 시트 A1 셀에 붙여넣기
- 또는 시트에서 **파일 → 가져오기 → 업로드**로 CSV 선택

### 5-3. 웹에 게시 (인증 없이 읽기용)

시트 → **파일 → 공유 → 웹에 게시** → **게시** 클릭
(전체 문서, 웹페이지 형식이면 됨. 링크는 안 써도 됨)

> 이러면 시트 내용이 read-only로 공개됨. 포트폴리오 데이터라 문제 없음.
> 편집 권한은 그대로 본인만 가짐.

### 5-4. 시트 ID를 GitHub에 등록

시트 주소에서 ID를 복사:
`https://docs.google.com/spreadsheets/d/`**`여기가_ID`**`/edit`

repo → **Settings → Secrets and variables → Actions → New repository secret**
- Name: `SHEET_ID`
- Value: 위에서 복사한 ID

### 5-5. 확인

Actions → **Run workflow** 다시 실행.
로그에 `↓ archive.csv` … 가 찍히고, 시트 내용대로 사이트가 갱신되면 성공.

---

## 6. 평소 사용법

### 아카이브·성과 추가/수정
1. 구글 시트에서 해당 탭에 행 추가·수정
2. GitHub → Actions → **Run workflow** (또는 최대 6시간 기다리면 자동)
3. 1~2분 후 사이트 반영

### 케이스(SELECTED WORK) 수정
`portfolio.dc.html` 파일에서 `projects = [` 블록을 직접 편집 → 커밋 → 자동 배포

### 이미지 추가
1. 파일을 `assets/`에 넣고 커밋
2. 시트 `archive` 탭의 `img` 칸에 `assets/파일명.png` 입력
   (한글·공백·대괄호 없는 파일명 권장: `petid-puppy.png` 식)

---

## 7. (선택) 시트 수정 시 자동 배포

`apps-script/Code.gs` 참고. 안 해도 "Run workflow" 버튼 + 6시간 자동으로 충분.

---

## 열의 의미

**archive**
- `roles`: 파이프(`|`)로 구분 — 예 `Concept|Editing|Build`
- `media`: `photo` `video` `web` `print` `image` 중 하나 (카드 아이콘 결정)
- `featured`: 대표작이면 `TRUE`, 아니면 빈칸
- `url`: 있으면 카드가 링크됨 / `img`: 썸네일 이미지 / `fit`: `contain` 또는 빈칸 / `bg`: 배경색 헥사

**impacts**
- `display`: 카드에 크게 보이는 문구 (예 `+26%`, `14 → 5 DAYS`)
- `value` `pre` `suf`: 숫자 카운트업 애니메이션용. 애니메이션 없이 문구만 쓰려면 `value`=0, `display`에만 입력
- `note`: 아래 작은 설명 / `source`: 출처 프로젝트

**meta**
- `archiveSpan`: ARCHIVE 섹션 연도 범위 표기
- `title` `description`: 브라우저 탭 제목 / 검색·공유 설명
