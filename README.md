# tiki tiki

마인크래프트 1.21.1 기반 Pixelmon 사설 서버의 공식 사이트와 전용 위키입니다.

## 구성

- 공식 랜딩 페이지
- NeoForge 및 필수 모드 다운로드 안내
- 포인트 시스템·명령어·상품 전용 위키
- Cloudflare Workers 정적 자산 배포
- Cloudflare Workers Assets 기반 설치 파일 제공
- 25MiB를 넘는 Pixelmon 파일의 투명한 분할 저장·단일 파일 스트리밍

## 로컬 실행

```bash
npm install
npm run dev
```

## 전체 배포

Cloudflare 인증 후 아래 명령을 실행합니다.

```bash
npm run deploy:full
```

이 명령은 로컬의 제공 파일을 `deploy-assets/`에 준비하고, 375MiB Pixelmon 파일을 20MiB 조각으로 나눈 뒤,
사이트와 설치 파일을 함께 Workers Assets에 배포합니다. 다운로드 시 Worker가 조각을 원본 JAR 한 개로 스트리밍합니다.

설치 파일과 생성된 배포 자산은 크기 및 배포권 관리 문제로 Git 저장소에 포함하지 않습니다.
NeoForge Installer가 기본 다운로드 폴더에 없다면 `NEOFORGE_INSTALLER` 환경 변수로 파일 경로를 지정할 수 있습니다.
