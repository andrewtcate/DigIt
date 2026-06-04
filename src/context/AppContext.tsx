import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Post, View } from '../types';
import { mockPosts, currentUser } from '../data/mockData';

interface AppContextValue {
  view: View;
  setView: (v: View) => void;
  posts: Post[];
  toggleLike: (postId: string) => void;
  addPost: (post: Post) => void;
  selectedPost: Post | null;
  setSelectedPost: (post: Post | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<View>('feed');
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const toggleLike = useCallback((postId: string) => {
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
        : p
    ));
  }, []);

  const addPost = useCallback((post: Post) => {
    setPosts(prev => [post, ...prev]);
  }, []);

  return (
    <AppContext.Provider value={{ view, setView, posts, toggleLike, addPost, selectedPost, setSelectedPost }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}

export { currentUser };
