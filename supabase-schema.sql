-- 사용자 프로필 테이블 (닉네임 필드 추가)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nickname TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'teacher')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 게시글 테이블
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  likes_count INTEGER DEFAULT 0,
  dislikes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_blinded BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_notice BOOLEAN DEFAULT FALSE,
  scraps_count INTEGER DEFAULT 0
);

-- 댓글 테이블
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  parent_id UUID REFERENCES comments(id),
  anonymous_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  likes_count INTEGER DEFAULT 0,
  dislikes_count INTEGER DEFAULT 0
);

-- 게시글 반응 테이블
CREATE TABLE post_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  reaction_type TEXT CHECK (reaction_type IN ('like', 'dislike')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- 댓글 반응 테이블
CREATE TABLE comment_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  reaction_type TEXT CHECK (reaction_type IN ('like', 'dislike')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id, reaction_type)
);

-- 스크랩 테이블
CREATE TABLE scraps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 신고 테이블
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES auth.users(id) NOT NULL,
  target_type TEXT CHECK (target_type IN ('post', 'comment')) NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) 설정
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraps ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS 정책 설정
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view all posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can insert their own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view all comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own reactions" ON post_reactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own reactions" ON comment_reactions FOR ALL USING (auth.uid() = user_id);
-- 스크랩 RLS: SELECT/DELETE는 USING, INSERT/UPDATE는 WITH CHECK 필요
DROP POLICY IF EXISTS "Users can manage their own scraps" ON scraps;
CREATE POLICY "Users can view own scraps" ON scraps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scraps" ON scraps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own scraps" ON scraps FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins can view all reports" ON reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
);

-- 관리자/교사 권한 정책 (posts 업데이트, comments 삭제 허용)
CREATE POLICY "Admins can update any posts" ON posts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
);
CREATE POLICY "Admins can delete any comments" ON comments FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
);

-- 함수 생성
CREATE OR REPLACE FUNCTION increment(row_id UUID, column_name TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT column_name::INTEGER + 1 FROM posts WHERE id = row_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement(row_id UUID, column_name TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT column_name::INTEGER - 1 FROM posts WHERE id = row_id);
END;
$$ LANGUAGE plpgsql;

-- 사용자 가입 시 프로필 자동 생성 함수
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, nickname)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 스크랩 카운트 유지 트리거
CREATE OR REPLACE FUNCTION increment_scraps_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET scraps_count = COALESCE(scraps_count,0) + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_scraps_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET scraps_count = GREATEST(COALESCE(scraps_count,0) - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_scrap_insert ON scraps;
DROP TRIGGER IF EXISTS on_scrap_delete ON scraps;
CREATE TRIGGER on_scrap_insert
  AFTER INSERT ON scraps
  FOR EACH ROW EXECUTE FUNCTION increment_scraps_count();
CREATE TRIGGER on_scrap_delete
  AFTER DELETE ON scraps
  FOR EACH ROW EXECUTE FUNCTION decrement_scraps_count();

-- 댓글 카운트 유지 트리거
CREATE OR REPLACE FUNCTION increment_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET comments_count = COALESCE(comments_count,0) + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET comments_count = GREATEST(COALESCE(comments_count,0) - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_comment_insert ON comments;
DROP TRIGGER IF EXISTS on_comment_delete ON comments;
CREATE TRIGGER on_comment_insert
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION increment_comments_count();
CREATE TRIGGER on_comment_delete
  AFTER DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION decrement_comments_count();

-- 댓글 익명 번호 자동 배정 함수 및 RPC
CREATE OR REPLACE FUNCTION insert_comment_with_anonymous_number(p_post_id UUID, p_content TEXT)
RETURNS comments AS $$
DECLARE
  next_num INTEGER;
  new_comment comments;
BEGIN
  SELECT COALESCE(MAX(anonymous_number), 0) + 1 INTO next_num FROM comments WHERE post_id = p_post_id;
  INSERT INTO comments (post_id, content, user_id, anonymous_number)
  VALUES (p_post_id, p_content, auth.uid(), next_num)
  RETURNING * INTO new_comment;
  RETURN new_comment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION insert_comment_with_anonymous_number(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION insert_comment_with_anonymous_number(UUID, TEXT) TO authenticated;
