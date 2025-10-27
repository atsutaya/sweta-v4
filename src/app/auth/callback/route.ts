import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  
  // OAuth 로그인 후 자동으로 홈페이지로 리다이렉트
  return NextResponse.redirect(requestUrl.origin)
}
