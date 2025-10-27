// 허용된 학교 이메일 도메인 목록
// 새로운 학교를 추가할 때는 이 배열에 도메인을 추가하면 됩니다.

export const ALLOWED_SCHOOL_DOMAINS = [
  'sawoo.hs.kr',  // 사우고
  // 다른 학교 도메인을 여기에 추가하세요
  // 'example.hs.kr',
  // 'another-school.edu.kr',
]

// 이메일 도메인 검증 함수
export const validateSchoolEmail = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase()
  return ALLOWED_SCHOOL_DOMAINS.includes(domain || '')
}

// 허용된 도메인 목록을 문자열로 반환
export const getAllowedDomainsString = (): string => {
  return ALLOWED_SCHOOL_DOMAINS.join(', ')
}
