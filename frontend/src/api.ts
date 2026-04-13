const API_BASE = '/api';

export interface Post {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content?: string;
  tags: string;
  word_count?: number;
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

export interface CreatePostData {
  title: string;
  slug: string;
  summary: string;
  content: string;
  tags: string;
}

export async function createPost(data: CreatePostData, token: string): Promise<Post> {
  const res = await fetch(`${API_BASE}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': token,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || 'Failed to create post');
  }
  return res.json();
}

export async function updatePost(slug: string, data: CreatePostData, token: string): Promise<Post> {
  const res = await fetch(`${API_BASE}/posts/${slug}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': token,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || 'Failed to update post');
  }
  return res.json();
}

export async function deletePost(slug: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/posts/${slug}`, {
    method: 'DELETE',
    headers: {
      'X-Auth-Token': token,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || 'Failed to delete post');
  }
}
