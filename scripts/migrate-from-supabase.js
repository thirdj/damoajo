/**
 * Supabase → Neon 데이터 마이그레이션
 * 실행: node scripts/migrate-from-supabase.js
 */
const SUPABASE_URL = 'https://itqwetzqravoqoswbagx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0cXdldHpxcmF2b3Fvc3diYWd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjYyMTQxMiwiZXhwIjoyMDkyMTk3NDEyfQ.HOYgH-aNY0289zO2eujEGv7VwqGtboYRrfbEhGEaqgo'


async function migrate() {
  console.log('Supabase에서 데이터 가져오는 중...')
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  }
  const [linksRes, catsRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/links?select=*`, { headers }),
    fetch(`${SUPABASE_URL}/rest/v1/categories?select=*`, { headers }),
  ])
  const links = await linksRes.json()
  const categories = await catsRes.json()
  
  console.log('linksRes status:', linksRes.status)
  console.log('links raw:', links)
  
  console.log(`링크 ${links.length}개, 카테고리 ${categories.length}개`)

  const exportData = { version: '2.0', exported_at: new Date().toISOString(), links, categories }
  const fs = await import('fs')
  fs.writeFileSync('supabase-export.json', JSON.stringify(exportData, null, 2))
  console.log('✅ supabase-export.json 생성 완료! Damoajo 앱에서 가져오기로 업로드하세요.')
}
migrate().catch(console.error)
