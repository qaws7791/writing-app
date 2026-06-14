import { ShieldCheck } from "lucide-react"

export function AdminAuthPage({ signInPath }: { readonly signInPath: string }) {
  return (
    <main className="admin-auth-page">
      <section className="admin-auth-card">
        <div className="admin-auth-card__mark">
          <ShieldCheck aria-hidden="true" size={28} />
        </div>
        <span>글결 운영 콘솔</span>
        <h1>관리자 로그인</h1>
        <p>
          콘텐츠, 사용자, 분석, 운영 설정을 관리하려면 관리자 계정으로
          로그인하세요.
        </p>
        <a className="admin-primary-button" href={signInPath}>
          Google로 계속하기
        </a>
      </section>
    </main>
  )
}
