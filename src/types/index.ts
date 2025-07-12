export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  layout: '1-block' | '2-block' | '3-block';
  createdAt: number;
  pdfLink: string;
}
