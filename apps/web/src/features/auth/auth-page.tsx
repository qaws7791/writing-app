"use client"

import { requestGoogleLogin, requestTestLogin } from "@/lib/auth/auth-client"
import { Button } from "@workspace/ui/components/ui/button"

type AuthPageProps = {
  readonly nextPath: string
  readonly testAuthEnabled?: boolean
}

export function AuthPage({ nextPath, testAuthEnabled = false }: AuthPageProps) {
  const loginWithGoogle = () => {
    void requestGoogleLogin(nextPath)
  }
  const loginWithTestUser = () => {
    requestTestLogin(nextPath)
  }

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-6 an-fi">
      <div className="mb-8 text-display-md" aria-hidden="true">
        ✍️
      </div>
      <h1 className="mb-4 text-center text-display-md font-black">글결.</h1>
      <p className="mb-12 text-center text-body-lg font-medium text-muted-foreground">
        매일 한 단락씩, 글의 결을 다듬는 한국어 글쓰기 학습
      </p>
      <div className="w-full max-w-sm space-y-4">
        <Button
          className="w-full"
          onClick={loginWithGoogle}
          size="extra"
          type="button"
          variant="ink"
        >
          <GoogleIcon className="w-6 h-6" />
          Google로 계속하기
        </Button>
        {testAuthEnabled ? (
          <Button
            className="w-full"
            onClick={loginWithTestUser}
            size="extra"
            type="button"
            variant="secondary"
          >
            테스트 계정으로 계속하기
          </Button>
        ) : null}
        <p className="text-center text-label-md font-medium text-muted-foreground">
          이메일/비밀번호 가입은 지원하지 않습니다
        </p>
      </div>
    </div>
  )
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="white"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="white"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="white"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="white"
      />
    </svg>
  )
}
