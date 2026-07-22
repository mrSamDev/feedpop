export interface Feed {
  id: string;
  url: string;
  title: string;
  description: string;
  link: string;
  articles: Article[];
  lastFetchedAt: number | null;
}

export interface Article {
  id: string;
  feedId: string;
  title: string;
  link: string;
  description: string;
  content: string;
  author: string;
  publishedAt: number | null;
}

export interface FeedSubscription {
  id: string;
  url: string;
  title: string;
  addedAt: number;
}