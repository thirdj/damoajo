import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!, {
  ssl: 'require',
  max: 5,
  idle_timeout: 10,
  connect_timeout: 10,
  prepare: false, // 서버리스 환경에서 더 빠름
})

export default sql