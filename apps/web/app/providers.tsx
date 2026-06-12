"use client";

import { createContext, useContext } from "react";
import type { PaletteItem } from "@/lib/site/palette";

const PaletteItemsCtx = createContext<PaletteItem[]>([]);

export function PaletteItemsProvider({
  items,
  children,
}: {
  items: PaletteItem[];
  children: React.ReactNode;
}) {
  return <PaletteItemsCtx.Provider value={items}>{children}</PaletteItemsCtx.Provider>;
}

export function usePaletteItems(): PaletteItem[] {
  return useContext(PaletteItemsCtx);
}
