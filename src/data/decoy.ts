import type { Lang } from '../types'

/**
 * Boss-key decoy: a believable quarterly department-budget spreadsheet that the
 * grid flips to when the user presses `` ` ``. Bilingual so the disguise reads
 * naturally in either language.
 */
export interface DecoyData {
  filename: string
  title: string
  headers: string[]
  /** Row 0 is the column header is built from `headers`; these are data rows. */
  rows: (string | number)[][]
  sheets: string[]
  /** Localized label for the total row's first cell, used to bold it. */
  totalLabel: string
}

const DECOY: Record<Lang, DecoyData> = {
  ko: {
    filename: '2026_1분기_부서예산_v3_final.xlsx',
    title: '2026년 1분기 부서별 예산 집행 현황',
    headers: ['부서', '배정예산(천원)', '집행액(천원)', '잔액(천원)', '집행률'],
    totalLabel: '합계',
    rows: [
      ['영업1팀', 48000, 41250, 6750, '85.9%'],
      ['영업2팀', 42000, 39800, 2200, '94.8%'],
      ['마케팅팀', 65000, 51200, 13800, '78.8%'],
      ['개발팀', 88000, 72400, 15600, '82.3%'],
      ['인사팀', 21000, 18650, 2350, '88.8%'],
      ['총무팀', 19500, 17200, 2300, '88.2%'],
      ['재무팀', 24000, 20100, 3900, '83.8%'],
      ['고객지원팀', 33000, 29850, 3150, '90.5%'],
      ['합계', 340500, 290450, 50050, '85.3%'],
    ],
    sheets: ['예산집행', '인건비', 'Sheet3'],
  },
  en: {
    filename: '2026_Q1_Dept_Budget_v3_final.xlsx',
    title: 'Q1 2026 Departmental Budget Execution',
    headers: ['Department', 'Budget ($K)', 'Spent ($K)', 'Remaining ($K)', 'Used %'],
    totalLabel: 'Total',
    rows: [
      ['Sales 1', 48000, 41250, 6750, '85.9%'],
      ['Sales 2', 42000, 39800, 2200, '94.8%'],
      ['Marketing', 65000, 51200, 13800, '78.8%'],
      ['Engineering', 88000, 72400, 15600, '82.3%'],
      ['HR', 21000, 18650, 2350, '88.8%'],
      ['G&A', 19500, 17200, 2300, '88.2%'],
      ['Finance', 24000, 20100, 3900, '83.8%'],
      ['Support', 33000, 29850, 3150, '90.5%'],
      ['Total', 340500, 290450, 50050, '85.3%'],
    ],
    sheets: ['Budget', 'Payroll', 'Sheet3'],
  },
}

export function getDecoy(lang: Lang): DecoyData {
  return DECOY[lang]
}
