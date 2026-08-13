"use client";

import { AdminAnalytics } from "@workspace/ui/blocks/admin-analytics";
import { AdminSettings } from "@workspace/ui/blocks/admin-settings";
import { AgentMissionControl } from "@workspace/ui/blocks/agent-mission-control";
import { AgentSessionDetail } from "@workspace/ui/blocks/agent-session-detail";
import { AuditAdmin } from "@workspace/ui/blocks/audit-admin";
import { CourseAdmin } from "@workspace/ui/blocks/course-admin";
import { CourseDetail } from "@workspace/ui/blocks/course-detail";
import { CoursesAdmin } from "@workspace/ui/blocks/courses-admin";
import { HomeAdmin } from "@workspace/ui/blocks/home-admin";
import { HomeLearner } from "@workspace/ui/blocks/home-learner";
import { LearnCatalog } from "@workspace/ui/blocks/learn-catalog";
import { LessonSession } from "@workspace/ui/blocks/lesson-session";
import { LoginOtp } from "@workspace/ui/blocks/login-otp";
import { LoginQuiet } from "@workspace/ui/blocks/login-quiet";
import { LoginSocial } from "@workspace/ui/blocks/login-social";
import { LoginSplit } from "@workspace/ui/blocks/login-split";
import { LoginWorkspace } from "@workspace/ui/blocks/login-workspace";
import { ProfileLearner } from "@workspace/ui/blocks/profile-learner";
import { UserAdmin } from "@workspace/ui/blocks/user-admin";
import { UsersAdmin } from "@workspace/ui/blocks/users-admin";
import { WritingCatalog } from "@workspace/ui/blocks/writing-catalog";
import { WritingHome } from "@workspace/ui/blocks/writing-home";
import { WritingStudio } from "@workspace/ui/blocks/writing-studio";
import { WritingTaskAdmin } from "@workspace/ui/blocks/writing-task-admin";
import { WritingTasksAdmin } from "@workspace/ui/blocks/writing-tasks-admin";

const demos = {
  "home-learner": HomeLearner,
  "home-admin": HomeAdmin,
  "courses-admin": CoursesAdmin,
  "course-admin": CourseAdmin,
  "users-admin": UsersAdmin,
  "user-admin": UserAdmin,
  "admin-analytics": AdminAnalytics,
  "admin-settings": AdminSettings,
  "agent-mission-control": AgentMissionControl,
  "agent-session-detail": AgentSessionDetail,
  "audit-admin": AuditAdmin,
  "learn-catalog": LearnCatalog,
  "course-detail": CourseDetail,
  "lesson-session": LessonSession,
  "profile-learner": ProfileLearner,
  "writing-home": WritingHome,
  "writing-catalog": WritingCatalog,
  "writing-studio": WritingStudio,
  "writing-tasks-admin": WritingTasksAdmin,
  "writing-task-admin": WritingTaskAdmin,
  "login-split": LoginSplit,
  "login-quiet": LoginQuiet,
  "login-otp": LoginOtp,
  "login-social": LoginSocial,
  "login-workspace": LoginWorkspace,
} as const;

export type LoginBlockSlug = keyof typeof demos;
export type BlockDemoSlug = LoginBlockSlug;

export function LoginBlockDemo({ slug }: { slug: LoginBlockSlug }) {
  const Demo = demos[slug];
  return <Demo className="h-full min-h-0" />;
}

export function BlockDemo({ slug }: { slug: BlockDemoSlug }) {
  return <LoginBlockDemo slug={slug} />;
}
