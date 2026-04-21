export type LinkStatus = 'wish' | 'bought' | 'archived'
export type ViewMode = 'grid2' | 'grid3' | 'list'

export interface LinkItem {
  id: string
  user_id: string
  url: string
  title: string
  description: string | null
  thumbnail: string | null
  site_name: string | null
  favicon: string | null
  price: string | null
  category: string
  status: LinkStatus
  memo: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface OGData {
  title: string
  description: string | null
  thumbnail: string | null
  site_name: string | null
  favicon: string | null
  needsManualEdit?: boolean
}
