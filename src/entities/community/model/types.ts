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

export interface CommunityComment {
  id: string;
  handle: string;
  time: string;
  likes: number;
  body: string;
}

export interface CommunityPostDetail {
  id: string;
  category: string;
  handle: string;
  date: string;
  views: number;
  title: string;
  likes: number;
  commentCount: number;
  body: string[];
  comments: CommunityComment[];
}
