"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { DbRecommendation } from "./db-types";
import { Recommendation, Category } from "./mock-data";

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function mapDbRec(row: DbRecommendation): Recommendation {
  return {
    id: row.id,
    recommenderId: row.user_id,
    businessName: row.business_name,
    serviceProvider: row.service_provider ?? undefined,
    category: capitalize(row.category) as Category,
    subCategory: row.subcategory ?? "Other",
    city: row.city ?? "",
    neighborhood: row.neighborhood ?? undefined,
    lat: row.latitude ?? undefined,
    lng: row.longitude ?? undefined,
    blurb: row.blurb,
    photo: row.photo_url ?? undefined,
    website: row.website ?? undefined,
    phone: row.phone ?? undefined,
    timestamp: row.created_at,
    likesCount: row.likes?.length ?? 0,
    vouches: row.vouches?.map((v) => v.user_id) ?? [],
    commentCount: 0,
    reservations: row.takes_appointments,
  };
}

interface UserRecsContextType {
  userRecs: Recommendation[];
  addUserRec: (rec: Recommendation) => void;
  refreshRecs: () => Promise<void>;
}

const UserRecsContext = createContext<UserRecsContextType>({
  userRecs: [],
  addUserRec: () => {},
  refreshRecs: async () => {},
});

export function UserRecsProvider({ children }: { children: React.ReactNode }) {
  const { authUser } = useAuth();
  const [userRecs, setUserRecs] = useState<Recommendation[]>([]);

  const fetchRecs = useCallback(async () => {
    if (!authUser) {
      setUserRecs([]);
      return;
    }
    const supabase = createClient();
    const { data } = await supabase
      .from("recommendations")
      .select("*, vouches(user_id), likes(user_id)")
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false });

    if (data) setUserRecs(data.map(mapDbRec));
  }, [authUser]);

  useEffect(() => {
    fetchRecs();
  }, [fetchRecs]);

  function addUserRec(rec: Recommendation) {
    setUserRecs((prev) => [rec, ...prev]);
  }

  return (
    <UserRecsContext.Provider value={{ userRecs, addUserRec, refreshRecs: fetchRecs }}>
      {children}
    </UserRecsContext.Provider>
  );
}

export const useUserRecs = () => useContext(UserRecsContext);
