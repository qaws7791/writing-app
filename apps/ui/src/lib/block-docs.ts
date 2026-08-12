export type BlockDoc = {
  slug: string;
  title: string;
  description: string;
  installName: string;
};

export type BlockSection = {
  id: string;
  title: string;
  description: string;
  blocks: BlockDoc[];
};

export const loginBlocks: BlockDoc[] = [
  {
    slug: "login-split",
    title: "Login Split",
    description: "브랜드 분위기 패널과 자격 증명 폼을 좌우로 나눈 로그인 화면입니다.",
    installName: "login-split",
  },
  {
    slug: "login-quiet",
    title: "Login Quiet",
    description: "브랜드가 중심인 절제된 중앙 정렬 로그인 화면입니다.",
    installName: "login-quiet",
  },
  {
    slug: "login-otp",
    title: "Login OTP",
    description: "비밀번호 없이 이메일 코드를 받아 로그인하는 패스워드리스 흐름입니다.",
    installName: "login-otp",
  },
  {
    slug: "login-social",
    title: "Login Social",
    description: "소셜 로그인을 우선하고 이메일은 보조 경로로 두는 소비자형 로그인입니다.",
    installName: "login-social",
  },
  {
    slug: "login-workspace",
    title: "Login Workspace",
    description: "워크스페이스 URL과 SSO를 우선하는 B2B 조직 로그인 흐름입니다.",
    installName: "login-workspace",
  },
];

export const learnerBlocks: BlockDoc[] = [
  {
    slug: "home-learner",
    title: "Home Learner",
    description:
      "로그인한 학습자 홈입니다. 인사와 학습 요약, 진행중·완료 탭의 코스 카드에서 다음 레슨을 이어갑니다.",
    installName: "home-learner",
  },
  {
    slug: "learn-catalog",
    title: "Learn Catalog",
    description:
      "로그인한 학습자의 코스 탐색 화면입니다. 주제별 섹션 아래 패턴 썸네일·제목·설명·레슨 수 목록만 보여 줍니다.",
    installName: "learn-catalog",
  },
  {
    slug: "course-detail",
    title: "Course Detail",
    description:
      "로그인한 학습자의 코스 상세입니다. 히어로에서 요약·진행·CTA를 보고, 유닛 아코디언으로 커리큘럼을 둘러봅니다.",
    installName: "course-detail",
  },
  {
    slug: "lesson-session",
    title: "Lesson Session",
    description:
      "학습자 레슨 세션입니다. 읽기·객관식·참거짓·빈칸·구간 선택·순서·짝 맞추기·분류·비교·문장 조립·받아쓰기·오류 교정·문단 구성 열세 가지 스텝을 순서대로 둘러봅니다.",
    installName: "lesson-session",
  },
  {
    slug: "profile-learner",
    title: "Profile Learner",
    description:
      "학습자 프로필입니다. 정체성·리듬·숙련·작품을 보고, 학습 기록과 설정으로 들어갑니다.",
    installName: "profile-learner",
  },
];

export const adminBlocks: BlockDoc[] = [
  {
    slug: "home-admin",
    title: "Home Admin",
    description:
      "통합 운영자용 어드민 홈입니다. 사이드바·지표·일별 레슨 완료 차트와 조치 큐로 운영 현황을 한눈에 봅니다.",
    installName: "home-admin",
  },
  {
    slug: "courses-admin",
    title: "Courses Admin",
    description:
      "통합 운영자용 코스 관리 화면입니다. 검색·상태 필터·페이지네이션이 있는 데이터 테이블로 코스를 다룹니다.",
    installName: "courses-admin",
  },
  {
    slug: "course-admin",
    title: "Course Admin",
    description:
      "통합 운영자용 코스 상세입니다. 코스 정보·커리큘럼 빌더·검증·게시를 탭으로 나눠 편집합니다.",
    installName: "course-admin",
  },
  {
    slug: "users-admin",
    title: "Users Admin",
    description:
      "통합 운영자용 사용자 관리 화면입니다. 검색·역할·상태 필터와 선택 작업, 기록 시트가 있는 데이터 테이블로 학습자와 강사를 다룹니다. 전체 기록은 user-admin 상세를 참고합니다.",
    installName: "users-admin",
  },
  {
    slug: "user-admin",
    title: "User Admin",
    description:
      "통합 운영자용 사용자 상세입니다. 계정·학습 기록·지원·코호트를 탭으로 나눠 관리합니다.",
    installName: "user-admin",
  },
  {
    slug: "admin-analytics",
    title: "Admin Analytics",
    description:
      "통합 운영자용 분석 화면입니다. 기간·코호트 필터, 학습 KPI, 완료·세션 추이, 개입 큐와 학습·쓰기·문항 드릴다운을 한곳에서 봅니다.",
    installName: "admin-analytics",
  },
  {
    slug: "admin-settings",
    title: "Admin Settings",
    description:
      "통합 운영자용 설정 화면입니다. 좌측 섹션 탭과 우측 설정 폼으로 조직·알림·보안·환경을 다룹니다.",
    installName: "admin-settings",
  },
  {
    slug: "audit-admin",
    title: "Audit Admin",
    description:
      "통합 운영자용 감사 로그 화면입니다. 검색·환경·유형·기간 필터와 상세·복원 확인으로 변경 이력을 추적합니다.",
    installName: "audit-admin",
  },
  {
    slug: "agent-mission-control",
    title: "Agent Mission Control",
    description:
      "Hermes 에이전트 미션 컨트롤입니다. 읽기 전용 실행 큐·처리량·인시던트와 스텝 트레이스로 진행 상태를 확인합니다. 한 실행의 전체 맥락은 agent-session-detail을 참고합니다.",
    installName: "agent-mission-control",
  },
  {
    slug: "agent-session-detail",
    title: "Agent Session Detail",
    description:
      "Hermes 에이전트 세션 상세입니다. 읽기 전용 스텝 트레이스·실행 설정·활동·출처로 한 실행의 진행과 실패를 확인합니다.",
    installName: "agent-session-detail",
  },
];

export const blockSections: BlockSection[] = [
  {
    id: "learning",
    title: "학습",
    description:
      "한국어 학습 서비스의 로그인 이후 화면입니다. 홈에서 이어 배우고, 학습에서 코스를 살펴본 뒤 상세에서 시작합니다.",
    blocks: learnerBlocks,
  },
  {
    id: "admin",
    title: "운영",
    description:
      "한국어 학습 서비스의 통합 운영자 화면입니다. 홈에서 현황을 보고, 코스·사용자 목록에서 콘텐츠와 계정을 관리하며, 분석·설정·에이전트 미션 컨트롤·감사 로그에서 지표와 조직·보안·실행 상태·변경 이력을 다룹니다.",
    blocks: adminBlocks,
  },
  {
    id: "authentication",
    title: "로그인",
    description:
      "제품 문맥에 맞는 로그인 페이지 블록입니다. 설치 후 라우트에 바로 붙여 쓸 수 있습니다.",
    blocks: loginBlocks,
  },
];
