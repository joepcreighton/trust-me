"use client";

import { createContext, useContext } from "react";

interface UIContextType {
  openRecommendSheet: () => void;
}

export const UIContext = createContext<UIContextType>({
  openRecommendSheet: () => {},
});

export const useUI = () => useContext(UIContext);
