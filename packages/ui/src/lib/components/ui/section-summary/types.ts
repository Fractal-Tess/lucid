export interface SummarySection {
  title: string;
  content: string;
}

export interface SummaryData {
  id: string;
  content: string;
  sections: SummarySection[];
  createdAt: number;
}
