export interface Location {
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  text: string;
  timestamp: Date;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  imageUrl: string;
  caption: string;
  plantName: string;
  plantEmoji: string;
  location: Location;
  likes: number;
  comments: Comment[];
  timestamp: Date;
  tags: string[];
  isLiked: boolean;
}

export interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
  bio: string;
  location: string;
  followers: number;
  following: number;
  postsCount: number;
}

export type View = 'feed' | 'map' | 'camera' | 'explore' | 'profile';
