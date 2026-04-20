import stripsData from "./strips.json";

export type Strip = {
  title: string | null;
  image_title: string | null;
  image_url: string | null;
  image_anchor: string | null;
  image_alt: string | null;
  image_width: string | null;
  image_height: string | null;
  previous_id: number | null;
  next_id: number | null;
  blog_text: string;
};

export type Strips = Record<string, Strip>;

export const strips: Strips = stripsData as Strips;

export const numericStripIds = Object.keys(strips)
  .filter((id) => /^\d+$/.test(id))
  .sort((a, b) => Number(a) - Number(b));
export const firstId = numericStripIds[0];
export const currentId = numericStripIds[numericStripIds.length - 1];
