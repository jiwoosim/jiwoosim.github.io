/**
 * (선택) 구글 시트를 수정하면 GitHub 빌드를 자동 실행.
 * 이걸 안 써도 Actions 탭에서 "Run workflow" 버튼으로 수동 배포 가능하고,
 * 6시간마다 자동으로도 돈다.
 *
 * 설치:
 *  1. 시트 → 확장 프로그램 → Apps Script
 *  2. 이 코드 붙여넣기, 아래 3개 값 입력
 *  3. 왼쪽 "트리거" → 트리거 추가 → 함수 onSheetChange / 이벤트: 스프레드시트에서 / 수정 시
 *  4. GITHUB_TOKEN 은 github.com → Settings → Developer settings →
 *     Personal access tokens (fine-grained) → 해당 repo, Contents: read/write 권한
 */
const GITHUB_OWNER = 'YOUR_GITHUB_USERNAME';
const GITHUB_REPO  = 'jiwoo-portfolio';
const GITHUB_TOKEN = 'ghp_xxxxxxxxxxxxxxxxxxxx';

let _lastRun = 0;

function onSheetChange() {
  // 연속 편집 시 과호출 방지: 60초 디바운스
  const now = Date.now();
  if (now - _lastRun < 60000) return;
  _lastRun = now;

  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/dispatches`;
  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + GITHUB_TOKEN, Accept: 'application/vnd.github+json' },
    payload: JSON.stringify({ event_type: 'sheet-updated' }),
    muteHttpExceptions: true,
  });
}
