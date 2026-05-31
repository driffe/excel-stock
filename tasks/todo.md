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
## Phase 3 — 런칭 하드닝 (바이럴 스파이크 생존) [진행중]

**전략 맥락**: 목표 = 바이럴/성장 플레이, 페르소나 = 가벼운 체커, 베팅 = 위장 깊이 + Stealth 알림,
런칭 채널 = ② 서사(Show HN/Reddit, 오픈소스). 첫 스프린트 = **데이터층 하드닝**(깨지는 데모로 런칭 = 자살).

**핵심 문제**: Show HN/Reddit 스파이크 → 동시 수백 명 × 서버리스 콜드스타트 → 인스턴스별 캐시가 전부
미스 → Finnhub 무료 티어(~60/min) 폭사 → 가장 많이 보는 순간 가격이 전부 `—`. 엣지 캐싱은 per-POP라
단독으론 60/min 못 넘김. **진짜 해법 = 공유 기본 워치리스트를 유저 트래픽에서 분리해 쿼터를 상수로.**

**검증 완료**: Stooq 키 없는 light-quote CSV가 US 주식 전체를 **단일 배치 콜**로 커버
(AAPL/MSFT/NVDA/BRK-B/JPM OHLC+Vol+Name 확인). 기본 시트 ~30종목 = origin 1콜/윈도우, 유저 수 무관.
트레이드오프: ~15분 지연 + changePct가 종가-대비-시가(Finnhub 실시간과 의미 약간 다름) — 런칭 모드엔 허용.

### 체크리스트
- [x] 1. **Stooq 배치 시세 소스** — `src/server/stooqQuotes.ts`: 심볼 배열 → `s=aapl.us+...` 한 콜,
      CSV 파싱(BRK.B→brk-b.us 매핑), `Quote`로 정규화(changePct=종가vs시가, prevClose=null), TTL 캐시
      +coalescing. 유니버스를 DEFAULT_SHEETS로 시드 → 첫 refresh가 전 기본심볼을 한 배치로(동시 단일-심볼
      요청이 1콜로 합쳐지게). 유저 추가 심볼은 유니버스에 누적(MAX_TRACKED=500 캡). QUOTE_TTL_MS env 다이얼.
      - **검증(라이브 Stooq)**: 기본 30종목(NASDAQ/NYSE/ETF/holdings, BRK.B·SPY 포함) 30/30 단일 배치 805ms.
        30개 동시 콜드 단일-심볼 읽기 → **업스트림 콜 정확히 1회**, 웜 2회차 → 신규 0, 유저심볼(IBM) 정상.
        typecheck 통과.
- [x] 2. **서버 시세 라우팅** (A안) — `quoteCache.getQuoteCached`가 `SHARED_SYMBOLS`(기본 워치리스트)면
      Stooq 캐시(`getStooqQuoteCached`)에서 먼저, 가격 없거나 Stooq 실패 시에만 기존 Finnhub 경로로 폴백.
      유저 추가 임의 심볼은 Stooq 미경유 → Finnhub 온디맨드(실시간 유지, per-IP 레이트리밋 bound).
      → 95% 바이럴 트래픽(기본 뷰)이 Finnhub를 안 건드림. 쿼터 = (심볼수 × 갱신율), 유저 무관.
      - **검증**: 기본 30종목 동시 → Stooq 배치 1콜(AAPL 312.06, prevClose=null), 유저심볼 IBM → Stooq 0콜·
        폴백 프로바이더(mock walk, prevClose=265). typecheck 통과.
- [x] 3. **엣지 CDN 캐싱(곱셈기)** — `api/{quote,news,indices}.ts` `send()`에 cache-control 인자 추가.
      200엔 `public, s-maxage=<TTL>, stale-while-revalidate=<win>` (quote 30/120, news 45/180, indices 30/120),
      비-200(400/403/429/502)·guard 거부는 `no-store`. news는 `lang/type/symbols`가 이미 쿼리 파라미터
      → CDN 캐시 키에 포함(헤더 Vary 불필요, 오언어 서빙 방지). 캐시 히트 시 guard 우회는 공개 시세라 무해.
      - **검증(dev 서버 실 응답 헤더)**: quote 200=s-maxage=30 + Stooq 312.06, quote 400=no-store,
        indices 200=s-maxage=30, news?lang=ko 200=s-maxage=45 + 한국어 Naver 정상.
- [x] 4. **스파이크 다이얼** — `QUOTE_TTL_MS` env가 Stooq 업스트림 TTL을 제어(상수-쿼터 핵심 레버, 구현됨).
      엣지 s-maxage는 정적값(곱셈기) — 필요 시 env화 가능하나 업스트림 TTL이 부하를 bound하므로 충분. DEPLOY.md에 문서화.
- [x] 5. **런칭 하드닝 문서** — `DEPLOY.md`에 "Launch hardening" 섹션 + 사전 체크리스트
      (`ALLOWED_ORIGIN` 강제, 스파이크 시 `QUOTE_TTL_MS` 상향, 프리뷰 가격 스모크테스트, 선택적 KV 한정자).
      env 테이블에 `QUOTE_TTL_MS` 행 추가, `.env.example`에 문서화.

- [x] 6. **change% 충실도 수정 (advisor 지적)** — 초기엔 Stooq에 전일종가가 없다고 보고 changePct를
      "종가 vs 시가"로 계산 → Yahoo/Google과 어긋나고(부호 뒤집힘 가능), 기본행(Stooq)·유저행(Finnhub)이
      같은 그리드에서 기준 불일치. **light-quote `p` 필드(전일종가)를 발견** → `f=sohlcp` 단일 배치 키 없는
      콜에서 전일종가 공짜로 획득. changePct를 **전일종가 기준**으로 변경 → Finnhub·Yahoo와 기준 통일.
      (Stooq 일별-히스토리 엔드포인트는 이제 API 키 필요 — `p` 필드가 keyless 해법.)

### 검증 결과
- `npm run typecheck` ✅ / `npm run build` ✅ (61 modules).
- Stooq 배치 라이브: 기본 30종목(BRK.B·ETF 포함) 30/30 단일 콜, 30 동시 콜드 읽기 → 업스트림 **정확히 1콜**.
- 라우팅: 기본심볼→Stooq, 유저심볼(IBM)→폴백 프로바이더, Stooq 0콜.
- **change% 수정 검증**: AAPL +0.09%(vs open) → **-0.14%(vs prevClose, Yahoo와 일치, 부호 플립 해결)**,
  MSFT 4.09%→5.45%(1.36%p 괴리 교정), prevClose 전 종목 채워짐.
- dev 실 응답: quote/indices/news 200=`s-maxage`, 에러=`no-store`, news lang은 URL 키.
- **헤드리스 Chrome 렌더(라이브 모드)**: `/api/quote` 30×200, 콘솔 에러 0, 그리드 셀에 실 Stooq 가격+전일종가
  change% 표시(NVDA $211.14 -1.45% / AAPL $312.06 -0.14% / MSFT +5.45%), 엑셀 룩 시각 무결성 OK.
- 클라이언트 번들에 `stooq.com`/finnhub URL 0 (서버 전용 트리셰이크), 키 노출 0.

### 런칭 전 잔여 검증 (오늘 불가 — 일요일/프리뷰 미배포; DEPLOY.md 체크리스트에 명시)
- 프리뷰 배포에서 엣지 캐시 실동작(`x-vercel-cache: HIT`, `s-maxage` 적용) — dev 서버엔 CDN 없음.
- 평일 장중 세션에서 Stooq 인트라데이 지연/주기 + change%가 Yahoo와 일치하는지 라이브 확인.
- 프로덕션 `ALLOWED_ORIGIN` 설정(오픈 프록시 차단), 스파이크 시 `QUOTE_TTL_MS` 상향.

### 비범위(이번 스프린트)
- Vercel KV/Upstash/Cron 도입(Stooq 분리로 불필요 — 추후 옵션).
  in-app 공유 버튼/K-factor(①, 런칭 후). 오픈소스 공개 작업(README/LICENSE 정리)은 별도.

---
## Phase 4 — 위장 깊이: alt-tab 자동 은폐 (hero clip 기능) [진행중]

**맥락**: 바이럴 hero 클립의 핵심 — "alt-tab 하면 즉시 예산표로". 기존 보스키(백틱) decoy에 연결.

- [x] **자동 은폐 효과** (`App.tsx`) — `window blur` + `document visibilitychange(hidden)` → `setDecoy(true)`
      + 필터 닫기. **은폐 전용**: 포커스/가시성 복귀 시 자동 공개 안 함 — 공개는 백틱으로만(의도적).
      자리 비운 새 동료가 화면 봐도 예산표 유지가 목적. 리스너는 1회 arm(키 핸들러 패턴과 동일).
      - **검증(헤드리스 Chrome)**: 초기=주식+뉴스, blur→탭제목 decoy 파일명+뉴스 숨김(은폐),
        focus 복귀→은폐 유지(자동공개 X), 백틱→주식+뉴스 복귀. 콘솔 에러 0. build ✅.

### 후속 후보
- 자동 은폐 on/off 설정(너무 공격적일 때) — 현재 기본 on, 토글 미구현.
- 다음: stealth 알림(위장된 노티), hero GIF 녹화/공유, 런칭 서사+오픈소스.

---
## 이전 단계 (Phase 1 — 구글시트 위장 포트폴리오, 본 단계로 대체됨)
> Phase 1은 구글시트 크롬 + 보유수량/평가손익 8열 포트폴리오였으며, 사용자 요청으로 엑셀 워치리스트로 전면 교체됨.
