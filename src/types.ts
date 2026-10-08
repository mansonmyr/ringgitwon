export type RatePoint = {
  date: string;
  rate: number;
};

export type RateSnapshot = {
  points: RatePoint[];
  fetchedAt: string;
};

export type Headline = {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  language?: string;
};

export type NewsSnapshot = {
  articles: Headline[];
  fetchedAt: string;
  unavailableMonths?: string[];
};
