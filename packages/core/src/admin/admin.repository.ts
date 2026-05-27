import type { AdminCourseTreeDto, AdminUserListDto } from "@/admin/admin.dto"

export interface AdminRepository {
  listCourseTree(): Promise<AdminCourseTreeDto>
  listUsers(): Promise<AdminUserListDto>
}
