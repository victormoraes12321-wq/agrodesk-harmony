import { createContext } from "react";

import type { AppState } from "@/lib/store";

export const AppContext = createContext<AppState | null>(null);
