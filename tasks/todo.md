# 작업 플랜 — Phase 2: Excel 365 워치리스트 + 실시간 뉴스 + 한/영 다국어

이전 Phase 1(구글시트 위장 포트폴리오)은 아래 "이전 단계" 섹션 참고. 본 단계는 새 디자인 번들
(`내자산_관리_2026.xlsx.html`)에 맞춰 **마이크로소프트 엑셀 365 룩**의 워치리스트로 전면 교체.

## 확정 사항 (사용자 확인)
1. 새 디자인대로 **전면 교체** (포트폴리오 P&L 제거, 종목명/현재가/등락률 3열)
2. **Finnhub 실시간** 시세
3. **실시간 뉴스 API** (Finnhub `/news` + `/company-news`)
4. **UI+내용 한/영, 기본 영어** (토글)
5. 뉴스 기사 본문은 **원문(영어) 유지** — 한국어 모드에서도 UI·종목명·섹션 제목만 번역

## 체크리스트
- [x] 1. 타입/데이터 — `types.ts`(NewsItem/IndexQuote/Lang, Holding 제거), `data/sheets.ts`,
      `data/decoy.ts`(한/영), `data/indices.ts`, `api/names.ts`(한/영)
- [x] 2. 프로바이더 — `api/news.ts`(NewsProvider + MockNewsProvider 한/영), `api/finnhubNews.ts`,
      `api/finnhub.ts`(크립토 폴백), `api/index.ts`(getNewsProvider), `hooks/useNews.ts`
- [x] 3. i18n — `i18n/index.tsx`(Provider/useI18n/t, 기본 en, localStorage, html lang), `en.ts`/`ko.ts`
- [x] 4. 컴포넌트 — TitleBar(+LangToggle/검색), Ribbon, FormulaBar, Grid, SheetTabs, StatusBar,
      NewsPane, AddDialog, FilterMenu (prototype를 React+TS로 포팅)
- [x] 5. App/셸/스타일 — `App.tsx` 전면 재작성, `index.css`(excel.css 포팅), `main.tsx`(I18nProvider),
      `index.html`(Carlito 폰트), `package.json`(react-datasheet-grid 제거), `.env.example`, 구파일 삭제
- [x] 6. 검증 — typecheck/build 통과, Playwright 헤드리스 렌더로 EN/KO/보스키/즐겨찾기 확인

## 데이터 흐름 (불변식 유지)
`sheet.symbols`(편집 가능, 진실의 원천) → useQuotes/useNews가 시세·뉴스 병합 → 그리드는 읽기전용 표시.
편집은 **종목 열만** (시세/등락은 라이브). 즐겨찾기 Set → ★관심 시트 자동 집계.

## Review
- **신규**: `data/{sheets,decoy,indices}.ts`, `api/{news,finnhubNews}.ts`, `hooks/useNews.ts`,
  `i18n/{index.tsx,en.ts,ko.ts}`, `lib/format.ts`, `components/{TitleBar,Ribbon,FormulaBar,Grid,
  SheetTabs,StatusBar,NewsPane,AddDialog,FilterMenu}.tsx`
- **재작성**: `App.tsx`, `index.css`, `api/names.ts`(한/영), `api/index.ts`, `api/finnhub.ts`,
  `types.ts`, `main.tsx`, `index.html`, `package.json`, `.env.example`
- **삭제**: `components/{StockGrid,FakeChrome,BossKeyOverlay}.tsx`, `hooks/useBossKey.ts`,
  `theme/ThemeContext.tsx`, dependency `react-datasheet-grid`
- **재사용(무수정)**: `hooks/useQuotes.ts`, `api/provider.ts`, `api/mock.ts`
- **검증 결과**:
  - `npm run typecheck` ✅ / `npm run build` ✅ (55 modules)
  - `npm run lint` ⚠️ 사전 결함(무관): repo에 `eslint.config.js` 없음 → ESLint v9 실행 불가
  - **Playwright 헤드리스 렌더(Chrome.app)로 육안 검증 완료** — 콘솔 에러 0:
    - 기본 영어: File/Home…리본, A/B/C 그리드, Ticker/Price/Change %, 데이터막대, 별표,
      뉴스 워크시트(Major Indices/Live News), Top 10/ETF/Crypto/Holdings 탭, Ready·Stocks 10·▲▼·Avg
    - 토글→한국어: 파일/홈…, 종목명/현재가/등락률, 주요 지수/실시간 뉴스, top10/ETF/코인/보유, 준비·종목·평균,
      수식바 종목명·뉴스 본문까지 한국어(mock provider)
    - 보스키(`): 한/영 디코이 예산표로 전환 + 뉴스창 숨김
    - 별표 클릭 → ★ Watchlist(관심) 탭 자동 생성, 행 연노랑
  - 지수 Value 열 폭 보정(52→72px): 19,421.30 등 앞자리 잘림 수정 (NewsPane TMPL)
- **알려진 제약** (`.env.example`에 문서화): Finnhub 무료 티어는 미국 주식 위주 →
  코인은 mock 폴백, 지수 스트립은 현실적 레벨 mock(시세 미연동), 뉴스는 영어(한국어 모드도 본문 원문).

## 후속 변경 (사용자 요청)
- **크립토 제거**: `코인` 시트·`CRYPTO_*`·finnhub 크립토 경로·종목명·목업 뉴스에서 전부 삭제.
  보유 시트는 AAPL/NVDA/MSFT/GOOGL로. localStorage 키 `v2`→`v3`로 올려 기존 코인 시트 자동 폐기.
- **뉴스 다중 소스**: `compositeNews.ts`(여러 NewsProvider 병합·URL 중복제거·시간순, **언어 인지** KO→Naver/EN→Finnhub·Marketaux)
  + 어댑터 `marketauxNews.ts`, `naverNews.ts`. `getNewsProvider()`가 **키가 설정된 소스만** 묶고, 없으면 mock.
  Naver는 **서버사이드 전용**(CORS·시크릿 노출) → `VITE_NAVER_PROXY_URL` 프록시 사용.
  - 검증: typecheck/build 통과, 헤드리스 렌더로 코인 탭 사라짐 + 뉴스 정상 + EN/KO + 콘솔 에러 0 확인(mock 경로).
- **Naver 프록시 내장**: `vite.config.ts`에 `/api/naver/news` 미들웨어(dev+preview). 브라우저는 동일 출처 경로만
  호출, 미들웨어가 `NAVER_CLIENT_ID/SECRET`(비-VITE, 번들 미노출)로 헤더 붙여 Naver에 포워딩. 클라이언트는
  `VITE_NAVER_PROXY_URL=/api/naver/news`로 활성화. (운영 배포 시엔 동일 핸들러를 서버리스/프록시로 재현)
  - 검증: 라우트 마운트 확인(크리덴셜 없으면 500 안내), 더미 크리덴셜로 **Naver까지 포워딩되어 Naver 401 반환**(쿼리·헤더 전달 확인),
    **시크릿이 클라이언트 번들에 0회 노출** 확인. 실제 유효 키로의 응답만 미검증(키 없음).

- **라이브 모드 실키 검증 + 429 수정**: 사용자가 Finnhub/Marketaux/Naver 실제 키 등록 후 헤드리스
  네트워크 캡처로 확인 → 초기엔 Finnhub `/quote`가 burst+StrictMode로 429 폭주, 그리드 가격 빈칸.
  `src/lib/pool.ts`(`mapPoolSettled`, 동시성 4)로 `useQuotes` 팬아웃 제한 → **429 0건, 실시간 가격 표시**.
  최종 캡처: finnhub quote 200×30 / news 200×10 / marketaux 200×5 / naver 200×4, 콘솔 에러 0.

## 후속 변경 2 (사용자 요청: 배포 대비 + UI)
- **UI**: 새로고침 아이콘을 표준 원형 화살표로 교체(`FormulaBar`/`NewsPane`); 상태바에 오늘 날짜 표시
  (`StatusBar`, 한/영 로케일: "May 30, 2026" / "2026년 5월 30일"). 헤드리스 렌더로 확인.
- **운영 배포(Vercel) — 키 서버사이드화**: 클라이언트는 동일 출처 `/api/*`만 호출(번들에 키 0 노출, dist grep 0 확인).
  - 클라: `ProxyQuoteProvider`/`ProxyNewsProvider` → `/api/quote`·`/api/news`. `api/index.ts`는 live(proxy)/mock 분기만.
  - 서버: `api/quote.ts`·`api/news.ts`(Web Request→Response, Vercel 함수) + `api/_lib/providers.ts`(서버 키로 프로바이더 조립).
    dev는 `vite.config.ts` `apiDevServer`가 `ssrLoadModule`로 같은 핸들러 실행 + `.env`→`process.env` 주입(동일 동작).
  - **시세 429 수정**: `api/_lib/quoteCache.ts`(in-flight coalescing + 12s TTL) → StrictMode/중복/폴 burst를 upstream 1콜로 합침.
  - `.env` 시크릿을 비-VITE 이름으로 rename(값 보존), `VITE_NAVER_PROXY_URL` 제거. `.env.example`·`DEPLOY.md`·`vercel.json` 추가.
  - **실키 검증**: 가격 10/10, EN 뉴스(Finnhub+Marketaux), KO 뉴스(Naver), `/api/quote` 502 0건, 콘솔 에러 0, 브라우저→외부 직접콜 0.

## 비범위
- 리본/툴바 버튼 실제 동작(장식), 뉴스 본문 한국어 자동 번역(번역 서비스 미도입).

---
## 이전 단계 (Phase 1 — 구글시트 위장 포트폴리오, 본 단계로 대체됨)
> Phase 1은 구글시트 크롬 + 보유수량/평가손익 8열 포트폴리오였으며, 사용자 요청으로 엑셀 워치리스트로 전면 교체됨.
