import type {
  AdminCourseListDto,
  AdminCourseListInputDto,
  AdminCourseTreeDto,
  AdminUserListDto,
} from "@/admin/admin.dto"

export interface AdminRepository {
  listCourses(input: AdminCourseListInputDto): Promise<AdminCourseListDto>
  listCourseTree(): Promise<AdminCourseTreeDto>
  listUsers(): Promise<AdminUserListDto>
}
