# 🍱 점심 메뉴 룰렛

오늘 점심 메뉴를 룰렛으로 정하는 정적 웹 페이지입니다. 빌드 과정 없이 `index.html`, `style.css`, `app.js` 세 파일로 동작합니다.

## 기능

- 기본 메뉴 20개를 룰렛에 표시, "돌리기"를 누르면 하나를 골라 크게 표시
- 룰렛이 빙글빙글 돌다가 멈추는 애니메이션 (결과는 포인터 아래 칸과 항상 일치)
- 메뉴 추가·삭제: 종류(한식/중식/일식/양식/분식)를 골라 추가
- 종류별로 골라 돌리기: 필터를 바꿔도 추가한 메뉴는 그대로 유지
- 메뉴 목록·선택한 종류·최근 결과 5개를 내 브라우저(localStorage)에만 저장

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
