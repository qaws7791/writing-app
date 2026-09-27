import { parseApiEnv } from "@/config/env"
parseApiEnv(process.env)
process.stdout.write(JSON.stringify("API 환경 검증을 통과했습니다.") + "\n")
