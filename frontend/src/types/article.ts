export interface Article {
  title:    string;
  summary:  string;
  url:      string;
  category: string;
  tags:     string[];
}

export interface Issue {
  feed:     string;
  date:     string;
  headline: string;
  articles: Article[];
}
