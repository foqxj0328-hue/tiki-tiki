# tiki tiki

마인크래프트 1.21.1 기반 Pixelmon 사설 서버의 공식 사이트와 전용 위키입니다.

## 구성

- 공식 랜딩 페이지
- Google Drive 기반 NeoForge 및 필수 모드 다운로드 안내
- 포인트 시스템·명령어·상품 전용 위키
- 공지사항 목록 및 버전별 상세 패치노트
- Cloudflare Pages 정적 사이트 배포

## 로컬 실행

```bash
npm install
npm run dev
```

## Cloudflare Pages 배포

GitHub 저장소를 Cloudflare Pages에 연결하고 빌드 출력 디렉터리를 `public`으로 설정합니다.
설치 파일은 사이트에 포함하지 않으며 접속 방법 페이지에서 Google Drive 폴더로 안내합니다.
