export interface CommunityPost {
  id: string;
  category: string;
  handle: string;
  date: string;
  title: string;
  likes: number;
  comments: number;
}

export interface CommunityHero {
  id: string;
  handle: string;
  title: string;
  likes: number;
  comments: number;
}
