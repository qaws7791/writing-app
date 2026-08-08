"use client";

import { AdminAnalytics } from "@/registry/luma/blocks/admin-analytics";
import { AdminSettings } from "@/registry/luma/blocks/admin-settings";
import { AgentMissionControl } from "@/registry/luma/blocks/agent-mission-control";
import { AgentSessionDetail } from "@/registry/luma/blocks/agent-session-detail";
import { AuditAdmin } from "@/registry/luma/blocks/audit-admin";
import { CourseAdmin } from "@/registry/luma/blocks/course-admin";
import { CourseDetail } from "@/registry/luma/blocks/course-detail";
import { CoursesAdmin } from "@/registry/luma/blocks/courses-admin";
import { HomeAdmin } from "@/registry/luma/blocks/home-admin";
import { HomeLearner } from "@/registry/luma/blocks/home-learner";
import { LearnCatalog } from "@/registry/luma/blocks/learn-catalog";
import { LessonSession } from "@/registry/luma/blocks/lesson-session";
import { LoginOtp } from "@/registry/luma/blocks/login-otp";
import { LoginQuiet } from "@/registry/luma/blocks/login-quiet";
import { LoginSocial } from "@/registry/luma/blocks/login-social";
import { LoginSplit } from "@/registry/luma/blocks/login-split";
import { LoginWorkspace } from "@/registry/luma/blocks/login-workspace";
import { ProfileLearner } from "@/registry/luma/blocks/profile-learner";
import { UserAdmin } from "@/registry/luma/blocks/user-admin";
import { UsersAdmin } from "@/registry/luma/blocks/users-admin";

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
