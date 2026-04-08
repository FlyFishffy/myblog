const API_BASE = '/api';

export interface Post {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content?: string;
  tags: string;
  created_at: string;
  updated_at: string;
}

export interface PostsResponse {
  posts: Post[];
  total: number;
}

export async function fetchPosts(): Promise<PostsResponse> {
  const res = await fetch(`${API_BASE}/posts`);
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}

export async function fetchPost(slug: string): Promise<Post> {
  const res = await fetch(`${API_BASE}/posts/${slug}`);
  if (!res.ok) throw new Error('Post not found');
  return res.json();
}
