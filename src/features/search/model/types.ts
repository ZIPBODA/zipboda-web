export type SearchEntry = {
  id: string;
  kind: "housing" | "product";
  name: string;
  href: string;
  description: string;
  context: string;
  fields: string[];
  price?: number;
};
