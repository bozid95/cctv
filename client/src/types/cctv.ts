export type CctvView = [string, string, string]; // [title, m3u8Url, embedUrl]

export interface CctvCamera {
  id: string;
  src: string;
  kind?: string;
  name: string;
  sub?: string;
  lat: number;
  lng: number;
  views: CctvView[];
}

export interface CctvSource {
  id: string;
  name: string;
  owner?: string;
  page?: string;
  count?: number;
}

export interface CctvApiResponse {
  total: number;
  sources: Record<string, { name: string; owner: string; page: string }>;
  checkedAt: string;
  cameras: CctvCamera[];
}
