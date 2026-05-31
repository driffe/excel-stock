import type { Lang } from '../types'

type DecoyRow =
  | { type: 'title'; text: string }
  | { type: 'report'; text: string }
  | { type: 'meta'; cells: (string | null)[] }
  | { type: 'empty' }
  | { type: 'header'; cells: string[] }
  | { type: 'section'; text: string }
  | { type: 'data'; cells: (string | number | null)[]; sub?: boolean; total?: boolean }
  | { type: 'note'; text: string }

export interface DecoyData {
  filename: string
  sheets: string[]
  colWidths: number[]
  rows: DecoyRow[]
}

/* ──────────────────── KOREAN ──────────────────── */
const KO: DecoyData = {
  filename: '2026_1분기_부서예산_v3_final.xlsx',
  sheets: ['예산집행', '인건비현황', '전사종합', '비용분석', 'Sheet5'],
  colWidths: [158, 106, 106, 72, 106, 114, 86],
  rows: [
    { type: 'title',  text: '㈜ 넥스트솔루션' },
    { type: 'report', text: '2026년 1분기 부서별 예산 집행 현황 보고서 (내부 결재용)' },
    { type: 'meta',   cells: ['보고 기간 : 2026.01.01 ~ 2026.03.31', null, '작성부서 : 재무기획팀', null, '문서번호 : FIN-2026-Q1-007', null, null] },
    { type: 'meta',   cells: ['작　성 : 재무기획팀  김 대리', null, '검　토 : 재무팀장  이 부장', null, '승　인 : CFO  박 전무', null, null] },
    { type: 'empty' },
    // ── 본부별 집계 ──
    { type: 'report', text: '[ 1 ]  부서별 예산 집행 현황' },
    { type: 'header', cells: ['부서', 'Q1 예산(천원)', 'Q1 실적(천원)', '달성률', 'Q2 예산(천원)', '연간 예산(천원)', '전년 대비'] },

    // 영업본부
    { type: 'section', text: '▶ 영업본부' },
    { type: 'data',   cells: ['  영업1팀',      48_000,  41_250, '85.9%',  51_000, 196_000, '▲ 3.2%'] },
    { type: 'data',   cells: ['  영업2팀',      42_000,  39_800, '94.8%',  44_000, 172_000, '▲ 1.1%'] },
    { type: 'data',   cells: ['  영업3팀',      38_000,  33_100, '87.1%',  40_000, 155_000, '▼ 2.4%'] },
    { type: 'data',   cells: ['  온라인채널팀', 31_000,  26_400, '85.2%',  33_000, 128_000, '▲ 7.3%'] },
    { type: 'data',   cells: ['  파트너십팀',   24_000,  21_800, '90.8%',  25_000,  98_000, '▲ 4.5%'] },
    { type: 'data',   cells: ['  기업영업팀',   35_000,  29_600, '84.6%',  37_000, 144_000, '▲ 5.8%'] },
    { type: 'data',   cells: ['  소  계',      218_000, 191_950, '88.1%', 230_000, 893_000, '▲ 3.8%'], sub: true },
    { type: 'empty' },

    // 마케팅·브랜드본부
    { type: 'section', text: '▶ 마케팅·브랜드본부' },
    { type: 'data',   cells: ['  브랜드마케팅팀', 42_000, 33_800, '80.5%',  44_000, 172_000, '▲ 6.2%'] },
    { type: 'data',   cells: ['  디지털마케팅팀', 38_000, 31_200, '82.1%',  40_000, 156_000, '▲ 9.4%'] },
    { type: 'data',   cells: ['  콘텐츠팀',       18_000, 15_100, '83.9%',  19_000,  74_000, '▲ 3.1%'] },
    { type: 'data',   cells: ['  광고·PR팀',       28_000, 22_400, '80.0%',  30_000, 116_000, '▲ 4.8%'] },
    { type: 'data',   cells: ['  전략기획팀',     18_000, 15_600, '86.7%',  19_000,  74_000, '▲ 2.2%'] },
    { type: 'data',   cells: ['  소  계',        144_000, 118_100, '82.0%', 152_000, 592_000, '▲ 5.5%'], sub: true },
    { type: 'empty' },

    // 개발본부
    { type: 'section', text: '▶ 개발본부' },
    { type: 'data',   cells: ['  플랫폼개발1팀', 55_000, 44_800, '81.5%',  58_000, 226_000, '▲ 8.2%'] },
    { type: 'data',   cells: ['  플랫폼개발2팀', 48_000, 38_900, '81.0%',  50_000, 196_000, '▲ 6.1%'] },
    { type: 'data',   cells: ['  서비스개발팀',  42_000, 34_600, '82.4%',  44_000, 172_000, '▲ 5.7%'] },
    { type: 'data',   cells: ['  모바일개발팀',  35_000, 28_400, '81.1%',  37_000, 144_000, '▲ 7.9%'] },
    { type: 'data',   cells: ['  QA팀',          22_000, 18_200, '82.7%',  23_000,  90_000, '▲ 3.4%'] },
    { type: 'data',   cells: ['  인프라·보안팀', 38_000, 30_800, '81.1%',  40_000, 156_000, '▲ 5.2%'] },
    { type: 'data',   cells: ['  소  계',       240_000, 195_700, '81.5%', 252_000, 984_000, '▲ 6.4%'], sub: true },
    { type: 'empty' },

    // 해외사업본부
    { type: 'section', text: '▶ 해외사업본부' },
    { type: 'data',   cells: ['  해외영업팀',        32_000, 26_500, '82.8%',  34_000, 132_000, '▲12.4%'] },
    { type: 'data',   cells: ['  글로벌마케팅팀',    24_000, 19_200, '80.0%',  26_000,  98_000, '▲15.1%'] },
    { type: 'data',   cells: ['  현지법인 (미국)',    55_000, 43_800, '79.6%',  58_000, 226_000, '▲18.3%'] },
    { type: 'data',   cells: ['  현지법인 (일본)',    38_000, 30_100, '79.2%',  40_000, 156_000, '▲ 8.7%'] },
    { type: 'data',   cells: ['  소  계',           149_000, 119_600, '80.3%', 158_000, 612_000, '▲13.8%'], sub: true },
    { type: 'empty' },

    // 경영지원본부
    { type: 'section', text: '▶ 경영지원본부' },
    { type: 'data',   cells: ['  인사·교육팀',  24_000, 20_850, '86.9%',  25_000,  98_000, '▲ 2.0%'] },
    { type: 'data',   cells: ['  재무·회계팀',  28_000, 23_400, '83.6%',  29_000, 114_000, '▲ 4.3%'] },
    { type: 'data',   cells: ['  법무팀',        16_000, 13_800, '86.3%',  17_000,  66_000, '▲ 1.8%'] },
    { type: 'data',   cells: ['  총무·시설팀',   22_000, 19_400, '88.2%',  23_000,  90_000, '▼ 1.2%'] },
    { type: 'data',   cells: ['  IT지원팀',      18_000, 15_200, '84.4%',  19_000,  74_000, '▲ 3.7%'] },
    { type: 'data',   cells: ['  소  계',       108_000,  92_650, '85.8%', 113_000, 442_000, '▲ 2.3%'], sub: true },
    { type: 'empty' },
    { type: 'data',   cells: ['합  계',         859_000, 718_000, '83.6%', 905_000, 3_523_000, '▲ 6.1%'], total: true },
    { type: 'empty' },
    { type: 'empty' },

    // ── 비용구분별 집계 ──
    { type: 'report', text: '[ 2 ]  전사 비용구분별 집계 현황' },
    { type: 'header', cells: ['비용구분', 'Q1 예산(천원)', 'Q1 실적(천원)', '달성률', 'Q2 예산(천원)', '연간 예산(천원)', '비중(%)'] },

    { type: 'section', text: '▶ 인건비·복리후생' },
    { type: 'data',   cells: ['  급여 및 성과급',   280_000, 235_200, '84.0%', 295_000, 1_152_000, '32.7%'] },
    { type: 'data',   cells: ['  퇴직급여·충당금',   48_000,  40_100, '83.5%',  51_000,   198_000,  '5.6%'] },
    { type: 'data',   cells: ['  복리후생비',         35_000,  29_800, '85.1%',  37_000,   144_000,  '4.1%'] },
    { type: 'data',   cells: ['  소  계',           363_000, 305_100, '84.0%', 383_000, 1_494_000, '42.4%'], sub: true },
    { type: 'empty' },

    { type: 'section', text: '▶ 운영비·관리비' },
    { type: 'data',   cells: ['  임차료·관리비',     62_000,  52_400, '84.5%',  65_000,   254_000,  '7.2%'] },
    { type: 'data',   cells: ['  IT·통신비',          45_000,  37_800, '84.0%',  47_000,   184_000,  '5.2%'] },
    { type: 'data',   cells: ['  업무추진비·출장비',  38_000,  29_100, '76.6%',  40_000,   156_000,  '4.4%'] },
    { type: 'data',   cells: ['  소  계',           145_000, 119_300, '82.3%', 152_000,   594_000, '16.9%'], sub: true },
    { type: 'empty' },

    { type: 'section', text: '▶ 마케팅·홍보비' },
    { type: 'data',   cells: ['  광고선전비',         82_000,  64_300, '78.4%',  87_000,   336_000,  '9.5%'] },
    { type: 'data',   cells: ['  행사·전시·스폰서비', 34_000,  25_800, '75.9%',  36_000,   139_000,  '3.9%'] },
    { type: 'data',   cells: ['  소  계',           116_000,  90_100, '77.7%', 123_000,   475_000, '13.5%'], sub: true },
    { type: 'empty' },

    { type: 'section', text: '▶ 자본지출 (CapEx)' },
    { type: 'data',   cells: ['  서버·인프라 장비',   95_000,  77_200, '81.3%', 100_000,   390_000, '11.1%'] },
    { type: 'data',   cells: ['  소프트웨어·라이선스',55_000,  43_600, '79.3%',  57_000,   226_000,  '6.4%'] },
    { type: 'data',   cells: ['  기타 자본지출',       85_000,  82_700, '97.3%',  90_000,   344_000,  '9.8%'] },
    { type: 'data',   cells: ['  소  계',           235_000, 203_500, '86.6%', 247_000,   960_000, '27.3%'], sub: true },
    { type: 'empty' },
    { type: 'data',   cells: ['합  계',             859_000, 718_000, '83.6%', 905_000, 3_523_000, '100.0%'], total: true },
    { type: 'empty' },
    { type: 'note',   text: '※ 달성률 90% 이상 : 우수 / 80~89% : 정상 / 70~79% : 주의 / 70% 미만 : 개선 필요' },
    { type: 'note',   text: '※ 단위 : 천원  |  음영(초록) 항목은 소계 행  |  본 자료는 대외비이며 외부 유출 금지' },
  ],
}

/* ──────────────────── ENGLISH ──────────────────── */
const EN: DecoyData = {
  filename: '2026_Q1_Dept_Budget_v3_final.xlsx',
  sheets: ['Budget Exec.', 'Payroll', 'Company Overview', 'Cost Analysis', 'Sheet5'],
  colWidths: [158, 106, 106, 72, 106, 114, 86],
  rows: [
    { type: 'title',  text: 'NextSolution Corp.' },
    { type: 'report', text: 'Q1 2026 Departmental Budget Execution Report (Internal — Confidential)' },
    { type: 'meta',   cells: ['Period : Jan 1 – Mar 31, 2026', null, 'Dept : Finance Planning', null, 'Doc No. : FIN-2026-Q1-007', null, null] },
    { type: 'meta',   cells: ['Prepared : Finance Planning  Kim', null, 'Reviewed : Finance Director  Lee', null, 'Approved : CFO  Park', null, null] },
    { type: 'empty' },
    { type: 'report', text: '[ 1 ]  Departmental Budget Execution' },
    { type: 'header', cells: ['Department', 'Q1 Budget ($K)', 'Q1 Actual ($K)', 'Rate', 'Q2 Budget ($K)', 'Annual Budget ($K)', 'YoY'] },

    { type: 'section', text: '▶ Sales Division' },
    { type: 'data',   cells: ['  Sales Team 1',     48_000,  41_250, '85.9%',  51_000, 196_000, '▲ 3.2%'] },
    { type: 'data',   cells: ['  Sales Team 2',     42_000,  39_800, '94.8%',  44_000, 172_000, '▲ 1.1%'] },
    { type: 'data',   cells: ['  Sales Team 3',     38_000,  33_100, '87.1%',  40_000, 155_000, '▼ 2.4%'] },
    { type: 'data',   cells: ['  Online Channel',   31_000,  26_400, '85.2%',  33_000, 128_000, '▲ 7.3%'] },
    { type: 'data',   cells: ['  Partnerships',     24_000,  21_800, '90.8%',  25_000,  98_000, '▲ 4.5%'] },
    { type: 'data',   cells: ['  Enterprise Sales', 35_000,  29_600, '84.6%',  37_000, 144_000, '▲ 5.8%'] },
    { type: 'data',   cells: ['  Subtotal',        218_000, 191_950, '88.1%', 230_000, 893_000, '▲ 3.8%'], sub: true },
    { type: 'empty' },

    { type: 'section', text: '▶ Marketing & Brand' },
    { type: 'data',   cells: ['  Brand Marketing',  42_000,  33_800, '80.5%',  44_000, 172_000, '▲ 6.2%'] },
    { type: 'data',   cells: ['  Digital Marketing', 38_000, 31_200, '82.1%',  40_000, 156_000, '▲ 9.4%'] },
    { type: 'data',   cells: ['  Content',           18_000,  15_100, '83.9%',  19_000,  74_000, '▲ 3.1%'] },
    { type: 'data',   cells: ['  Advertising & PR',  28_000,  22_400, '80.0%',  30_000, 116_000, '▲ 4.8%'] },
    { type: 'data',   cells: ['  Strategy Planning', 18_000,  15_600, '86.7%',  19_000,  74_000, '▲ 2.2%'] },
    { type: 'data',   cells: ['  Subtotal',         144_000, 118_100, '82.0%', 152_000, 592_000, '▲ 5.5%'], sub: true },
    { type: 'empty' },

    { type: 'section', text: '▶ Engineering Division' },
    { type: 'data',   cells: ['  Platform Dev 1',   55_000,  44_800, '81.5%',  58_000, 226_000, '▲ 8.2%'] },
    { type: 'data',   cells: ['  Platform Dev 2',   48_000,  38_900, '81.0%',  50_000, 196_000, '▲ 6.1%'] },
    { type: 'data',   cells: ['  Service Dev',      42_000,  34_600, '82.4%',  44_000, 172_000, '▲ 5.7%'] },
    { type: 'data',   cells: ['  Mobile Dev',       35_000,  28_400, '81.1%',  37_000, 144_000, '▲ 7.9%'] },
    { type: 'data',   cells: ['  QA',               22_000,  18_200, '82.7%',  23_000,  90_000, '▲ 3.4%'] },
    { type: 'data',   cells: ['  Infrastructure & Security', 38_000, 30_800, '81.1%', 40_000, 156_000, '▲ 5.2%'] },
    { type: 'data',   cells: ['  Subtotal',        240_000, 195_700, '81.5%', 252_000, 984_000, '▲ 6.4%'], sub: true },
    { type: 'empty' },

    { type: 'section', text: '▶ International Business' },
    { type: 'data',   cells: ['  Overseas Sales',     32_000,  26_500, '82.8%',  34_000, 132_000, '▲12.4%'] },
    { type: 'data',   cells: ['  Global Marketing',   24_000,  19_200, '80.0%',  26_000,  98_000, '▲15.1%'] },
    { type: 'data',   cells: ['  US Subsidiary',      55_000,  43_800, '79.6%',  58_000, 226_000, '▲18.3%'] },
    { type: 'data',   cells: ['  Japan Subsidiary',   38_000,  30_100, '79.2%',  40_000, 156_000, '▲ 8.7%'] },
    { type: 'data',   cells: ['  Subtotal',          149_000, 119_600, '80.3%', 158_000, 612_000, '▲13.8%'], sub: true },
    { type: 'empty' },

    { type: 'section', text: '▶ G&A' },
    { type: 'data',   cells: ['  HR & Training',    24_000,  20_850, '86.9%',  25_000,  98_000, '▲ 2.0%'] },
    { type: 'data',   cells: ['  Finance & Acctg',  28_000,  23_400, '83.6%',  29_000, 114_000, '▲ 4.3%'] },
    { type: 'data',   cells: ['  Legal',            16_000,  13_800, '86.3%',  17_000,  66_000, '▲ 1.8%'] },
    { type: 'data',   cells: ['  Admin & Facilities',22_000,  19_400, '88.2%',  23_000,  90_000, '▼ 1.2%'] },
    { type: 'data',   cells: ['  IT Support',       18_000,  15_200, '84.4%',  19_000,  74_000, '▲ 3.7%'] },
    { type: 'data',   cells: ['  Subtotal',        108_000,  92_650, '85.8%', 113_000, 442_000, '▲ 2.3%'], sub: true },
    { type: 'empty' },
    { type: 'data',   cells: ['Total',             859_000, 718_000, '83.6%', 905_000, 3_523_000, '▲ 6.1%'], total: true },
    { type: 'empty' },
    { type: 'empty' },

    { type: 'report', text: '[ 2 ]  Company-wide Cost Category Summary' },
    { type: 'header', cells: ['Cost Category', 'Q1 Budget ($K)', 'Q1 Actual ($K)', 'Rate', 'Q2 Budget ($K)', 'Annual Budget ($K)', 'Share (%)'] },

    { type: 'section', text: '▶ Personnel & Benefits' },
    { type: 'data',   cells: ['  Salaries & Bonus',  280_000, 235_200, '84.0%', 295_000, 1_152_000, '32.7%'] },
    { type: 'data',   cells: ['  Retirement Fund',    48_000,  40_100, '83.5%',  51_000,   198_000,  '5.6%'] },
    { type: 'data',   cells: ['  Employee Benefits',  35_000,  29_800, '85.1%',  37_000,   144_000,  '4.1%'] },
    { type: 'data',   cells: ['  Subtotal',          363_000, 305_100, '84.0%', 383_000, 1_494_000, '42.4%'], sub: true },
    { type: 'empty' },

    { type: 'section', text: '▶ Operations & Admin' },
    { type: 'data',   cells: ['  Rent & Facilities',  62_000,  52_400, '84.5%',  65_000,   254_000,  '7.2%'] },
    { type: 'data',   cells: ['  IT & Telecom',        45_000,  37_800, '84.0%',  47_000,   184_000,  '5.2%'] },
    { type: 'data',   cells: ['  T&E & Entertainment', 38_000,  29_100, '76.6%',  40_000,   156_000,  '4.4%'] },
    { type: 'data',   cells: ['  Subtotal',           145_000, 119_300, '82.3%', 152_000,   594_000, '16.9%'], sub: true },
    { type: 'empty' },

    { type: 'section', text: '▶ Marketing & PR' },
    { type: 'data',   cells: ['  Advertising',         82_000,  64_300, '78.4%',  87_000,   336_000,  '9.5%'] },
    { type: 'data',   cells: ['  Events & Sponsorship', 34_000,  25_800, '75.9%',  36_000,   139_000,  '3.9%'] },
    { type: 'data',   cells: ['  Subtotal',            116_000,  90_100, '77.7%', 123_000,   475_000, '13.5%'], sub: true },
    { type: 'empty' },

    { type: 'section', text: '▶ Capital Expenditure (CapEx)' },
    { type: 'data',   cells: ['  Server & Infrastructure', 95_000, 77_200, '81.3%', 100_000, 390_000, '11.1%'] },
    { type: 'data',   cells: ['  Software & Licenses',     55_000, 43_600, '79.3%',  57_000, 226_000,  '6.4%'] },
    { type: 'data',   cells: ['  Other CapEx',             85_000, 82_700, '97.3%',  90_000, 344_000,  '9.8%'] },
    { type: 'data',   cells: ['  Subtotal',               235_000, 203_500, '86.6%', 247_000, 960_000, '27.3%'], sub: true },
    { type: 'empty' },
    { type: 'data',   cells: ['Total',                    859_000, 718_000, '83.6%', 905_000, 3_523_000, '100.0%'], total: true },
    { type: 'empty' },
    { type: 'note',   text: '* Rate ≥90%: Excellent  |  80–89%: On Track  |  70–79%: Caution  |  <70%: Needs Immediate Review' },
    { type: 'note',   text: '* Unit: USD thousands  |  Green rows = subtotals  |  CONFIDENTIAL — Do not distribute externally' },
  ],
}

const DECOY: Record<Lang, DecoyData> = { ko: KO, en: EN }

export function getDecoy(lang: Lang): DecoyData {
  return DECOY[lang]
}
