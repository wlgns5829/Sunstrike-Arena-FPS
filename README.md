# Sunstrike Arena

three.js로 만든 밝은 아레나형 FPS 프로토타입입니다. 정확한 화면 중앙 히트스캔 조준, 드론 AI 웨이브, 엄폐물 중심의 밝은 맵, HUD와 간단한 전투 사운드를 포함합니다.

## 실행

정적 파일이라 별도 빌드 없이 바로 서빙하면 됩니다.

```powershell
cd C:\Users\idpar\OneDrive\문서\Playground\sunstrike-fps
node server.mjs
```

브라우저에서 `http://127.0.0.1:4173` 으로 열면 됩니다.

WSL처럼 오래된 Node 환경에서도 동작하도록 `node:fs/promises` 없이 작성했습니다.

## GitHub Pages 배포

이 프로젝트는 정적 사이트라 GitHub Pages에 그대로 올릴 수 있습니다. 그러면 와이파이 안쪽이 아니라 외부 인터넷에서도 폰으로 접속할 수 있습니다.

권장 방식:

1. `sunstrike-fps` 폴더 자체를 별도 GitHub 저장소로 만듭니다.
2. 이 폴더를 `main` 브랜치로 푸시합니다.
3. GitHub 저장소의 `Settings > Pages` 에서 `Build and deployment` 방식을 `GitHub Actions` 로 둡니다.
4. 푸시가 끝나면 `.github/workflows/deploy-pages.yml` 이 자동 실행됩니다.
5. 배포 URL은 보통 `https://<github-username>.github.io/<repo-name>/` 형식입니다.

예시:

- 저장소 이름이 `sunstrike-fps` 라면 `https://your-name.github.io/sunstrike-fps/`

주의:

- 지금 추가한 GitHub Actions 워크플로우는 이 폴더가 저장소 루트일 때 바로 동작합니다.
- 만약 더 큰 저장소의 하위 폴더로 올릴 생각이면 `deploy-pages.yml` 의 업로드 경로를 `sunstrike-fps` 로 바꿔야 합니다.

## 폰에서 열기

같은 와이파이에 연결된 폰에서도 열 수 있습니다.

1. 가장 쉬운 방법은 Windows PowerShell에서 `node server.mjs` 를 실행하는 것입니다.
2. PC IP를 확인합니다. 예: `ipconfig` 에서 `IPv4 Address`.
3. 폰 브라우저에서 `http://PC-IP:4173` 으로 접속합니다. 예: `http://192.168.0.15:4173`

WSL에서 실행하는 경우:

- `HOST=0.0.0.0 node server.mjs` 로 띄우면 네트워크 바인딩은 됩니다.
- 다만 WSL 네트워크/방화벽 설정에 따라 폰에서 바로 안 보일 수 있어서, 폰 테스트는 Windows 쪽에서 실행하는 방식이 가장 안정적입니다.

GitHub Pages로 배포한 뒤에는:

- 같은 와이파이가 아니어도 됩니다.
- 폰에서 배포 URL만 열면 됩니다.
- 카카오톡, 디스코드, 메모앱, 사파리, 크롬 등 어떤 앱에서 링크를 눌러도 접속 가능합니다.

## 조작

- `WASD`: 이동
- `Shift`: 질주
- `Space`: 점프
- `마우스`: 시점 이동
- `좌클릭`: 사격
- `우클릭`: 집중 조준
- `Q` 또는 `1 / 2`: 무기 교체
- `R`: 리로드
- `Esc`: 일시정지
- 모바일: 왼쪽 패드 이동, 오른쪽 패드 시점, `FIRE / ADS / JUMP / RELOAD / SWAP`

## 메모

- `three`와 examples 모듈은 HTML의 import map으로 CDN에서 불러옵니다.
- 정확한 에임을 위해 총알 판정은 총구가 아니라 카메라 중앙 레이캐스트 기준으로 계산됩니다.
- 코어 업그레이드는 브라우저 로컬 스토리지에 저장됩니다.
- GitHub Pages는 HTTPS라서 모바일 브라우저에서 열기에도 적합합니다.
