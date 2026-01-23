export interface SummarySection {
  title: string;
  content: string;
}

export interface SummaryData {
  content: string;
  sections: SummarySection[];
}
