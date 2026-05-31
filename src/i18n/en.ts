/** English strings (canonical key set). ko.ts must mirror these keys. */
export const en = {
  // Window / title bar
  'app.filename': 'Budget_Review_2026.xlsx',
  'app.suffix': 'Excel',
  'titlebar.searchHint': 'Search stocks',
  'titlebar.account': 'James Kim',
  'titlebar.lang': 'KO', // label of the toggle = the language you switch TO

  // Ribbon tabs
  'ribbon.tab.file': 'File',
  'ribbon.tab.home': 'Home',
  'ribbon.tab.insert': 'Insert',
  'ribbon.tab.draw': 'Draw',
  'ribbon.tab.pageLayout': 'Page Layout',
  'ribbon.tab.formulas': 'Formulas',
  'ribbon.tab.data': 'Data',
  'ribbon.tab.review': 'Review',
  'ribbon.tab.view': 'View',
  'ribbon.tab.help': 'Help',

  // Ribbon group labels
  'ribbon.group.clipboard': 'Clipboard',
  'ribbon.group.font': 'Font',
  'ribbon.group.alignment': 'Alignment',
  'ribbon.group.number': 'Number',
  'ribbon.group.styles': 'Styles',
  'ribbon.group.cells': 'Cells',
  'ribbon.group.editing': 'Editing',

  // Ribbon buttons
  'ribbon.btn.paste': 'Paste',
  'ribbon.btn.conditionalFormatting': 'Conditional\nFormatting',
  'ribbon.btn.formatAsTable': 'Format as\nTable',
  'ribbon.btn.cellStyles': 'Cell\nStyles',
  'ribbon.btn.insert': 'Insert',
  'ribbon.btn.delete': 'Delete',
  'ribbon.btn.format': 'Format',
  'ribbon.btn.sortFilter': 'Sort &\nFilter',
  'ribbon.btn.findSelect': 'Find &\nSelect',
  'ribbon.combo.general': 'General',

  // Column headers
  'col.name': 'Ticker',
  'col.price': 'Price',
  'col.change': 'Change %',

  // Sheet default names
  'sheet.nasdaq': 'NASDAQ 10',
  'sheet.nyse': 'NYSE 10',
  'sheet.etf': 'ETF',
  'sheet.holdings': 'Holdings',
  'sheet.fav': 'Watchlist',
  'sheet.newTab': 'New sheet',
  'sheet.add': 'New sheet',
  'sheet.rename': 'Rename',
  'sheet.delete': 'Delete',

  // Status bar
  'status.ready': 'Ready',
  'status.count': 'Stocks {n}',
  'status.up': '▲ {n}',
  'status.down': '▼ {n}',
  'status.avg': 'Avg',
  'status.news': 'News',
  'status.statAvg': 'Average: {v}',
  'status.statCount': 'Count: 1',
  'status.statSum': 'Sum: {v}',
  'status.view.normal': 'Normal',
  'status.view.pageLayout': 'Page Layout',
  'status.view.pageBreak': 'Page Break Preview',

  // Filter menu
  'filter.sortAscNum': 'Sort Smallest to Largest',
  'filter.sortDescNum': 'Sort Largest to Smallest',
  'filter.sortAscText': 'Sort A to Z',
  'filter.sortDescText': 'Sort Z to A',
  'filter.favFirst': '★ Show favorites first',
  'filter.changeLabel': 'Change filter',
  'filter.all': 'Show all',
  'filter.up': '▲ Gainers only',
  'filter.down': '▼ Losers only',

  // Add dialog
  'add.title': 'Add stock — {sheet}',
  'add.tickerLabel': 'Ticker symbol',
  'add.tickerPlaceholder': 'e.g. AAPL',
  'add.cancel': 'Cancel',
  'add.submit': 'Add',

  // Boss-key hint
  'hint.bosskey': 'Press {key} for disguise mode (boss key)',
  'hint.bossmodeShort': '` Boss key',

  // News pane
  'news.title': 'News',
  'news.sectionIndices': '■ Major Indices',
  'news.sectionNews': '■ Live News',
  'news.idx.index': 'Index',
  'news.idx.value': 'Value',
  'news.idx.change': 'Change',
  'news.col.ticker': 'Ticker',
  'news.col.change': 'Change',
  'news.col.headline': 'Headline',
  'news.col.summary': 'Summary',
  'news.col.link': 'Link',
  'news.col.source': 'Source',
  'news.col.time': 'Time',
  'news.link': 'Read article ↗',
  'news.refresh': 'Refresh',
  'news.close': 'Close pane',

  // Index display names
  'index.sp500': 'S&P 500',
  'index.nasdaq': 'Nasdaq',
  'index.dow': 'Dow',

  // Relative time
  'time.now': 'just now',
  'time.min': '{n}m ago',
  'time.hour': '{n}h ago',
  'time.day': '{n}d ago',

  // Formula bar
  'fbar.refresh': 'Refresh quotes',

  // Grid placeholder
  'grid.addHint': 'Add ticker here…',

  // Coffee dialog
  'coffee.title': 'Support the Developer',
  'coffee.msg': 'Did you enjoy this project? If tracking your stocks with ExcelStock has been even a little useful — or just fun — a coffee would make my day and keep this project going 😄',
  'coffee.btn': 'Buy Me a Coffee ☕',
  'coffee.close': 'Maybe later',

  // Help / feedback dialog
  'help.title': 'Help & Feedback',
  'help.subjectLabel': 'Subject',
  'help.subjectPlaceholder': 'e.g. Feature request or bug report',
  'help.bodyLabel': 'Message',
  'help.bodyPlaceholder': 'Describe your request or issue in detail…',
  'help.send': 'Send Email',
  'help.cancel': 'Cancel',

  // TitleBar extra buttons
  'titlebar.coffee': 'Buy me a coffee',
  'titlebar.help': 'Help & Feedback',

  // Ribbon support group
  'ribbon.btn.coffee': 'Buy me\na coffee',
  'ribbon.btn.help': 'Help &\nFeedback',
  'ribbon.group.support': 'Support',

  // Tooltips (decorative Excel chrome — localized so EN mode doesn't show Korean)
  'tip.autosave': 'AutoSave',
  'tip.save': 'Save',
  'tip.undo': 'Undo',
  'tip.redo': 'Redo',
  'tip.lang': 'Language / 언어',
  'tip.cut': 'Cut',
  'tip.copy': 'Copy',
  'tip.formatPainter': 'Format Painter',
  'tip.fontGrow': 'Increase Font Size',
  'tip.fontShrink': 'Decrease Font Size',
  'tip.bold': 'Bold',
  'tip.italic': 'Italic',
  'tip.underline': 'Underline',
  'tip.border': 'Borders',
  'tip.fillColor': 'Fill Color',
  'tip.fontColor': 'Font Color',
  'tip.orientation': 'Orientation',
  'tip.alignLeft': 'Align Left',
  'tip.alignCenter': 'Center',
  'tip.alignRight': 'Align Right',
  'tip.wrapText': 'Wrap Text',
  'tip.mergeCenter': 'Merge & Center',
  'tip.currency': 'Accounting Number Format',
  'tip.percent': 'Percent Style',
  'tip.comma': 'Comma Style',
  'tip.incDecimal': 'Increase Decimal',
  'tip.decDecimal': 'Decrease Decimal',
  'tip.autosum': 'AutoSum',
  'tip.fill': 'Fill',
  'tip.clear': 'Clear',

  // Sheet delete confirmation
  'sheet.deleteConfirm': 'Delete the "{name}" sheet and its tickers?',

  // Loading / error / empty states
  'news.empty': 'No news available',
  'news.loading': 'Loading news…',
  'fbar.error': 'Connection error',
} as const

export type TranslationKey = keyof typeof en
