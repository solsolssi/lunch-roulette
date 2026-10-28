# 🍱 점심 메뉴 룰렛

오늘 점심 메뉴를 룰렛으로 정하는 정적 웹 페이지입니다. 빌드 과정 없이 `index.html`, `style.css`, `app.js` 세 파일로 동작합니다.

## 기능

- 룰렛 돌리기 (결과는 포인터 아래 칸과 항상 일치)
- 메뉴 추가·삭제, 프리셋(전체/한식/중식/일식/양식/분식)
- 메뉴 목록과 최근 결과 5개를 브라우저(localStorage)에 저장

## 로컬 실행

```bash
node .claude/serve.mjs
```

이후 http://localhost:5173 에 접속합니다.

## 배포 (Vercel)

1. 이 저장소를 GitHub에 push
2. https://vercel.com/new 에서 저장소 Import
3. Framework Preset은 **Other**로 두고 Deploy (빌드 명령 불필요)

이후 `main` 브랜치에 push할 때마다 자동으로 다시 배포됩니다.
