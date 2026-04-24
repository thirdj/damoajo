export type ViewMode = 'grid2' | 'grid3' | 'list'
export type SortMode = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'site'
export type FilterMode = 'all' | 'favorite' | 'no_price'

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
  last_price: string | null
  price_updated_at: string | null
  category: string
  is_favorite: boolean
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

export interface PriceHistory {
  id: string
  link_id: string
  old_price: string | null
  new_price: string | null
  changed_at: string
}

export interface PriceAlert {
  id: string
  link_id: string
  link_title: string
  old_price: string | null
  new_price: string | null
  is_read: boolean
  created_at: string
}
