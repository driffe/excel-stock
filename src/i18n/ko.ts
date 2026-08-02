import type { TranslationKey } from './en'

/** Korean strings. Keys mirror en.ts (enforced by the Record type). */
export const ko: Record<TranslationKey, string> = {
  // Window / title bar
  'app.filename': '가계부_2026년.xlsx',
  'titlebar.searchHint': '종목 검색',
  'titlebar.lang': 'EN',

  // Ribbon tabs
  'ribbon.tab.file': '파일',
  'ribbon.tab.home': '홈',
  'ribbon.tab.insert': '삽입',
  'ribbon.tab.draw': '그리기',
  'ribbon.tab.pageLayout': '페이지 레이아웃',
  'ribbon.tab.formulas': '수식',
  'ribbon.tab.data': '데이터',
  'ribbon.tab.review': '검토',
  'ribbon.tab.view': '보기',
  'ribbon.tab.help': '도움말',

  // Ribbon group labels
  'ribbon.group.clipboard': '클립보드',
  'ribbon.group.font': '글꼴',
  'ribbon.group.alignment': '맞춤',
  'ribbon.group.number': '표시 형식',
  'ribbon.group.styles': '스타일',
  'ribbon.group.cells': '셀',
  'ribbon.group.editing': '편집',

  // Ribbon buttons
  'ribbon.btn.paste': '붙여넣기',
  'ribbon.btn.conditionalFormatting': '조건부\n서식',
  'ribbon.btn.formatAsTable': '표\n서식',
  'ribbon.btn.cellStyles': '셀\n스타일',
  'ribbon.btn.insert': '삽입',
  'ribbon.btn.delete': '삭제',
  'ribbon.btn.format': '서식',
  'ribbon.btn.sortFilter': '정렬 및\n필터',
  'ribbon.btn.findSelect': '찾기 및\n선택',
  'ribbon.combo.general': '일반',

  // Column headers
  'col.name': '종목명',
  'col.price': '현재가',
  'col.change': '등락률',

  // Sheet default names
  'sheet.nasdaq': '나스닥 10',
  'sheet.nyse': '뉴욕 10',
  'sheet.etf': 'ETF',
  'sheet.holdings': '보유',
  'sheet.fav': '관심',
  'sheet.newTab': '새 시트',
  'sheet.add': '새 시트',
  'sheet.rename': '이름 바꾸기',
  'sheet.delete': '삭제',

  // Status bar
  'status.ready': '준비',
  'status.count': '종목 {n}',
  'status.up': '▲ {n}',
  'status.down': '▼ {n}',
  'status.avg': '평균',
  'status.news': '뉴스',
  'status.statAvg': '평균: {v}',
  'status.statCount': '개수: 1',
  'status.statSum': '합계: {v}',
  'status.view.normal': '기본',
  'status.view.pageLayout': '페이지 레이아웃',
  'status.view.pageBreak': '페이지 나누기 미리 보기',

  // Filter menu
  'filter.sortAscNum': '숫자 오름차순 정렬',
  'filter.sortDescNum': '숫자 내림차순 정렬',
  'filter.sortAscText': '텍스트 오름차순 정렬',
  'filter.sortDescText': '텍스트 내림차순 정렬',
  'filter.favFirst': '★ 관심종목 먼저 보기',
  'filter.changeLabel': '등락 필터',
  'filter.all': '모두 표시',
  'filter.up': '▲ 상승만',
  'filter.down': '▼ 하락만',

  // Add dialog
  'add.title': '종목 추가 — {sheet}',
  'add.tickerLabel': '종목명 / 티커',
  'add.tickerPlaceholder': '예: AAPL',
  'add.cancel': '취소',
  'add.submit': '추가',

  // Boss-key hint
  'hint.bosskey': '{key} 키를 누르면 위장 모드 (보스키) · 자동 위장은 선택 사항이며 기본값은 꺼짐',
  'hint.bossmodeShort': '` 보스키',

  // News pane
  'news.title': '뉴스',
  'news.sectionIndices': '■ 주요 지수',
  'news.sectionNews': '■ 실시간 뉴스',
  'news.idx.index': '지수',
  'news.idx.value': '현재가',
  'news.idx.change': '등락',
  'news.col.ticker': '종목',
  'news.col.change': '등락',
  'news.col.headline': '헤드라인',
  'news.col.summary': '요약',
  'news.col.link': '링크',
  'news.col.source': '출처',
  'news.col.time': '시간',
  'news.link': '기사 보기 ↗',
  'news.refresh': '새로 고침',
  'news.close': '창 닫기',

  // Index display names
  'index.sp500': 'S&P 500',
  'index.nasdaq': '나스닥',
  'index.dow': '다우',

  // Relative time
  'time.now': '방금 전',
  'time.min': '{n}분 전',
  'time.hour': '{n}시간 전',
  'time.day': '{n}일 전',

  // Formula bar
  'fbar.refresh': '시세 새로 고침',

  // Grid placeholder
  'grid.addHint': '여기에 종목 추가…',

  // Help / feedback dialog
  'help.title': '도움말 및 피드백',
  'help.subjectLabel': '제목',
  'help.subjectPlaceholder': '예: 기능 요청 또는 버그 신고',
  'help.bodyLabel': '내용',
  'help.bodyPlaceholder': '요청 사항이나 불편한 점을 자세히 알려주세요…',
  'help.send': '이메일 보내기',
  'help.cancel': '취소',

  // TitleBar extra buttons
  'titlebar.help': '도움말 및 피드백',

  // Ribbon support group
  'ribbon.btn.autoconceal': '자동\n위장',
  'ribbon.btn.help': '도움말\n피드백',
  'ribbon.group.support': '지원',

  // Tooltips (decorative Excel chrome)
  'tip.autosave': '자동 저장',
  'tip.save': '저장',
  'tip.undo': '실행 취소',
  'tip.redo': '다시 실행',
  'tip.lang': 'Language / 언어',
  'tip.cut': '잘라내기',
  'tip.copy': '복사',
  'tip.formatPainter': '서식 복사',
  'tip.fontGrow': '글꼴 크게',
  'tip.fontShrink': '글꼴 작게',
  'tip.bold': '굵게',
  'tip.italic': '기울임꼴',
  'tip.underline': '밑줄',
  'tip.border': '테두리',
  'tip.fillColor': '채우기 색',
  'tip.fontColor': '글꼴 색',
  'tip.orientation': '방향',
  'tip.alignLeft': '왼쪽 맞춤',
  'tip.alignCenter': '가운데 맞춤',
  'tip.alignRight': '오른쪽 맞춤',
  'tip.wrapText': '텍스트 줄 바꿈',
  'tip.mergeCenter': '병합하고 가운데 맞춤',
  'tip.currency': '통화',
  'tip.percent': '백분율 스타일',
  'tip.comma': '쉼표 스타일',
  'tip.incDecimal': '자릿수 늘림',
  'tip.decDecimal': '자릿수 줄임',
  'tip.autosum': '자동 합계',
  'tip.fill': '채우기',
  'tip.clear': '지우기',
  'tip.autoconceal': '창이 비활성화되면 자동 위장 (선택 사항, 기본값 꺼짐)',

  // Sheet delete confirmation
  'sheet.deleteConfirm': '"{name}" 시트와 종목을 삭제할까요?',

  // Loading / error / empty states
  'news.empty': '뉴스 없음',
  'news.loading': '뉴스 불러오는 중…',
  'fbar.error': '연결 오류',

  // Disclaimer
  'disclaimer.short': 'Excel Stock · Microsoft와 관련 없는 독립 프로젝트',
  'disclaimer.full':
    'Excel Stock은 스프레드시트 형태의 UI를 가진 독립적인 오픈소스 관심종목 앱입니다. Microsoft와 제휴, 승인 또는 후원 관계가 없습니다. Excel과 Office는 각 소유권자의 상표입니다.',
}
