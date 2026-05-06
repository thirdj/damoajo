import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!, {
  ssl: 'require',
  max: 3,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
  connection: {
    application_name: 'damoajo',
  },
})

export default sql