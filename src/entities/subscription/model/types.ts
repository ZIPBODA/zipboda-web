export type AgencyCode = "LH" | "SH" | "GH" | "IH";

export type SubscriptionSort = "DEADLINE" | "COMPETITION" | "HOUSEHOLDS";

export interface Subscription {
  id: string;
  agency: AgencyCode;
  title: string;
  region: string;
  location: string;
  sizes: number[];
  applicants: number;
  households: number;
  competition: string;
  moveIn: string;
  dday: number;
}

export interface SubscriptionFilter {
  region: string;
  size: string;
  agency: string;
  sort: SubscriptionSort;
}
