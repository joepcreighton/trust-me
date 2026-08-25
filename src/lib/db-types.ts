export interface DbUser {
  id: string;
  handle: string;
  full_name: string;
  bio: string | null;
  avatar_url: string | null;
  gender: string | null;
  locations: Array<{ city: string; state: string; neighborhood?: string }>;
  onboarding_complete: boolean;
  created_at: string;
}

export interface DbRecommendation {
  id: string;
  user_id: string;
  business_name: string;
  service_provider: string | null;
  category: string;
  subcategory: string | null;
  blurb: string;
  photo_url: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  neighborhood: string | null;
  latitude: number | null;
  longitude: number | null;
  mapbox_place_id: string | null;
  takes_appointments: boolean;
  created_at: string;
  recommender?: Pick<DbUser, "id" | "handle" | "full_name" | "avatar_url"> | null;
  vouches?: Array<{ user_id: string; chain_source: string | null }>;
  likes?: Array<{ user_id: string }>;
  disagreements?: Array<{ id: string; user_id: string; comment: string; created_at: string }>;
}

export interface DbAsk {
  id: string;
  user_id: string;
  question: string;
  category: string | null;
  city: string | null;
  created_at: string;
  asker?: Pick<DbUser, "id" | "handle" | "full_name" | "avatar_url"> | null;
  replies?: Array<{
    id: string;
    user_id: string;
    recommendation_id: string | null;
    text: string | null;
    created_at: string;
    replier?: Pick<DbUser, "id" | "handle" | "full_name" | "avatar_url"> | null;
  }>;
}
