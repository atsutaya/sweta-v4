import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yvtyuehiyrphtugbetai.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2dHl1ZWhpeXJwaHR1Z2JldGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MzQ0ODAsImV4cCI6MjA3MjIxMDQ4MH0.ROZ3XbBeieuRCYsJ5YX3fpM1xioJeoODN_k0f2E5LSQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// 자동 블라인드 체크 함수
export async function checkAndBlindPost(postId: string) {
  const { data: post } = await supabase
    .from('posts')
    .select('dislikes_count')
    .eq('id', postId)
    .single()

  if (post && post.dislikes_count >= 10) { // 싫어요 10개 이상이면 블라인드
    await supabase
      .from('posts')
      .update({ is_blinded: true })
      .eq('id', postId)
  }
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
          role: 'user' | 'admin' | 'teacher'
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          updated_at?: string
          role?: 'user' | 'admin' | 'teacher'
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
          role?: 'user' | 'admin' | 'teacher'
        }
      }
      posts: {
        Row: {
          id: string
          title: string
          content: string
          category: string
          user_id: string
          created_at: string
          updated_at: string
          likes_count: number
          dislikes_count: number
          comments_count: number
          is_blinded: boolean
          is_pinned: boolean
          is_notice: boolean
        }
        Insert: {
          id?: string
          title: string
          content: string
          category: string
          user_id: string
          created_at?: string
          updated_at?: string
          likes_count?: number
          dislikes_count?: number
          comments_count?: number
          is_blinded?: boolean
          is_pinned?: boolean
          is_notice?: boolean
        }
        Update: {
          id?: string
          title?: string
          content?: string
          category?: string
          user_id?: string
          created_at?: string
          updated_at?: string
          likes_count?: number
          dislikes_count?: number
          comments_count?: number
          is_blinded?: boolean
          is_pinned?: boolean
          is_notice?: boolean
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          content: string
          user_id: string
          parent_id: string | null
          anonymous_number: number
          created_at: string
          updated_at: string
          likes_count: number
          dislikes_count: number
        }
        Insert: {
          id?: string
          post_id: string
          content: string
          user_id: string
          parent_id?: string | null
          anonymous_number?: number
          created_at?: string
          updated_at?: string
          likes_count?: number
          dislikes_count?: number
        }
        Update: {
          id?: string
          post_id?: string
          content?: string
          user_id?: string
          parent_id?: string | null
          anonymous_number?: number
          created_at?: string
          updated_at?: string
          likes_count?: number
          dislikes_count?: number
        }
      }
      post_reactions: {
        Row: {
          id: string
          post_id: string
          user_id: string
          reaction_type: 'like' | 'dislike'
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          reaction_type: 'like' | 'dislike'
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          reaction_type?: 'like' | 'dislike'
          created_at?: string
        }
      }
      comment_reactions: {
        Row: {
          id: string
          comment_id: string
          user_id: string
          reaction_type: 'like' | 'dislike'
          created_at: string
        }
        Insert: {
          id?: string
          comment_id: string
          user_id: string
          reaction_type: 'like' | 'dislike'
          created_at?: string
        }
        Update: {
          id?: string
          comment_id?: string
          user_id?: string
          reaction_type?: 'like' | 'dislike'
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          target_type: 'post' | 'comment'
          target_id: string
          reason: string
          status: 'pending' | 'reviewed' | 'resolved'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          target_type: 'post' | 'comment'
          target_id: string
          reason: string
          status?: 'pending' | 'reviewed' | 'resolved'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          target_type?: 'post' | 'comment'
          target_id?: string
          reason?: string
          status?: 'pending' | 'reviewed' | 'resolved'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
