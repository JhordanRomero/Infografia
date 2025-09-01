
export interface Kpi {
  label: string;
  value: string;
  description: string;
}

export interface StatusTableRow {
    name: string;
    participants: string;
    status: string;
}

export interface ChartDataPoint {
    name: string;
    value: number;
    fill?: string;
}

export interface MarketSummary {
    marketName: string;
    mainPercentage: number;
    statusTable: StatusTableRow[];
    pieChartData: ChartDataPoint[];
    barChartData: ChartDataPoint[];
}

export interface MarketOverallStat {
  label: string;
  value: string;
}

export interface MarketLocalStat {
  localName: string;
  asistencia: string;
  completitud: string;
}

export interface MarketBreakdown {
  marketName: string;
  overallStats: MarketOverallStat[];
  localStats: MarketLocalStat[];
}

export interface Highlight {
    marketName: string;
    icon: string;
    content: string;
}

export interface PageOneData {
    mainTitle: string;
    date: string;
    mainKpis: Kpi[];
    marketSummaries: MarketSummary[];
}
export interface PageTwoData {
    mainTitle: string;
    marketBreakdowns: MarketBreakdown[];
}

export interface PageThreeData {
    mainTitle: string;
    highlightsTitle: string;
    highlights: Highlight[];
}

export interface InfographicData {
    page1: PageOneData;
    page2: PageTwoData;
    page3: PageThreeData;
}