import data from "./searchIndex.json";

export type SearchEntry = {
  id: string;
  title: string;
  blog: string;
  image_alt: string | null;
  image_title: string | null;
};

export const searchIndex: SearchEntry[] = data as SearchEntry[];
