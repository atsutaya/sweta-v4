# 학교 익명 게시판

학교 전용 익명 게시판 웹 서비스입니다. 휴대폰에서 웹앱처럼 최적화되어 사용할 수 있도록 반응형 디자인과 PWA 설정을 포함하고 있습니다.

## 🚀 기술 스택

- **Frontend**: Next.js 14 (TypeScript) + TailwindCSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **상태 관리**: React Query (TanStack Query)
- **배포**: Vercel
- **PWA**: next-pwa

## ✨ 주요 기능

### 1단계 (핵심 기능, MVP) ✅ 완성
- ✅ 회원가입/로그인 (Supabase Auth, OAuth 포함)
- ✅ 글 작성, 조회, 삭제 (익명으로 표시되지만 서버에는 user_id 저장)
- ✅ 댓글 작성, 수정, 삭제 (글마다 익명 번호 유지: 익명1, 익명2 등)
- ✅ 좋아요/싫어요 기능 (싫어요 일정 수 이상이면 자동 블라인드 처리)
- ✅ 게시판 분류 (카테고리: 자유, 질문, 정보, 고민 등)
- ✅ 신고 기능 (문제 글/댓글을 관리자 확인용으로 기록)

### 2단계 (활성화 기능) ✅ 완성
- ✅ 인기글 기능 (최근 24시간 기준 좋아요+댓글 수를 반영한 정렬)
- ✅ 검색 기능 (키워드, 카테고리별, 날짜별 검색)
- ✅ 대댓글 기능 (트리 구조, 익명 번호 유지)
- ✅ 내 활동 모아보기 (내가 쓴 글/댓글을 사용자 본인만 확인 가능)

### 3단계 (심화 기능)
- 📝 쪽지 기능 (1:1 대화방 구조, 쪽지함 UI 필요, 하루 전송 제한, 차단 기능 필요)
- 📌 공지/고정글 기능 (관리자나 선생님 계정이 글을 상단에 고정 가능)
- 🗳️ 투표 기능 (예: 학급 행사, 점심 메뉴 투표)
- 🖼️ 이미지 업로드 지원 (글/댓글에 사진 첨부 가능)
- 🌙 다크 모드 지원
- 🔔 실시간 알림 (내 글에 댓글이나 좋아요 발생 시 알림)

### 4단계 (부가/확장 기능)
- 📅 시간표/학교 일정 연동 (시험 일정, 행사 일정 표시)
- 📧 학교 이메일 인증 기반 가입 (폐쇄형 커뮤니티 지원)
- 🎨 익명 프로필 꾸미기 (색상 태그, 아이콘, 아바타 등)
- 👨‍💼 관리자 대시보드 (신고된 글/댓글 모니터링, 사용자 제재 기능)

## 🛠️ 설치 및 실행

### 1. 저장소 클론
```bash
git clone <repository-url>
cd school-anonymous-board
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Supabase 설정
1. [Supabase](https://supabase.com)에서 새 프로젝트를 생성하세요
2. SQL 편집기에서 다음 스키마를 실행하세요:

```sql
-- 사용자 프로필 테이블
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
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
  is_notice BOOLEAN DEFAULT FALSE
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
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS 정책 설정
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

CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins can view all reports" ON reports FOR SELECT USING (
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
```

### 5. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 📱 PWA 기능

이 프로젝트는 PWA(Progressive Web App)로 설정되어 있어:

- 📱 모바일에서 홈 화면에 추가 가능
- 🔄 오프라인 지원
- 📱 네이티브 앱과 유사한 사용자 경험
- 🔔 푸시 알림 지원 (향후 구현 예정)

## 🚀 배포

### Vercel 배포
1. [Vercel](https://vercel.com)에 GitHub 계정으로 로그인
2. 새 프로젝트 생성 및 GitHub 저장소 연결
3. 환경 변수 설정
4. 배포 완료

### 환경 변수 설정
Vercel 대시보드에서 다음 환경 변수를 설정하세요:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🔧 개발 가이드

### 프로젝트 구조
```
src/
├── app/                 # Next.js App Router
│   ├── auth/           # 인증 페이지
│   ├── posts/          # 게시글 관련 페이지
│   └── globals.css     # 전역 스타일
├── components/         # React 컴포넌트
│   ├── auth/          # 인증 관련 컴포넌트
│   ├── ui/            # 기본 UI 컴포넌트
│   └── ...            # 기타 컴포넌트
├── lib/               # 유틸리티 및 설정
│   ├── supabase.ts    # Supabase 클라이언트
│   └── utils.ts       # 유틸리티 함수
└── hooks/             # 커스텀 훅
```

### 코드 스타일
- TypeScript 사용
- ESLint + Prettier 설정
- 컴포넌트는 함수형 컴포넌트 사용
- 상태 관리는 React Query 사용

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.

---

**학교 익명 게시판** - 자유롭게 의견을 나누는 공간 🎯
