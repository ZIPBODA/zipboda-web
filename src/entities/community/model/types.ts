export interface CommunityPost {
  id: string;
  category: string;
  handle: string;
  date: string;
  title: string;
  likes: number;
  comments: number;
  image: string;
}

export interface CommunityHero {
  id: string;
  handle: string;
  title: string;
  likes: number;
  comments: number;
  image: string;
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
  /** 본문 문단 사이 이미지. 길이는 (body.length - 1) 이하 */
  bodyImages: string[];
  comments: CommunityComment[];
}
