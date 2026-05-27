import * as React from "react"
import type { AdminUserListDto } from "@workspace/core/admin"
import { Badge } from "@workspace/ui/components/ui/badge"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/ui/table"

type AdminUsersPageProps = {
  users: AdminUserListDto["users"]
}

const joinedDateFormatter = new Intl.DateTimeFormat("ko-KR")

export function AdminUsersPage({ users }: AdminUsersPageProps) {
  return (
    <main className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-normal">사용자</h1>
        <p className="text-sm text-muted-foreground">
          학습자 계정의 기본 정보와 이메일 인증 상태를 확인합니다.
        </p>
      </header>

      {users.length === 0 ? (
        <Empty
          aria-label="사용자 없음"
          className="rounded-lg border"
          role="status"
        >
          <EmptyHeader>
            <EmptyTitle>조회할 사용자가 없습니다.</EmptyTitle>
            <EmptyDescription>
              어드민 API에서 조회된 사용자 목록이 없습니다.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>이메일 인증</TableHead>
                <TableHead>가입일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.emailVerified ? "secondary" : "outline"}
                    >
                      {user.emailVerified ? "인증됨" : "미인증"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {joinedDateFormatter.format(new Date(user.createdAt))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </main>
  )
}
