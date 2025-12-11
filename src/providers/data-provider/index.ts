"use client";

import { dataProvider } from "@rest-data-provider";

// Use environment variable at runtime (client-side)
const API_URL = typeof window !== "undefined" 
  ? process.env.NEXT_PUBLIC_BE_URL 
  : "";

// For SSR, fallback to env at build time
const FALLBACK_API_URL = process.env.NEXT_PUBLIC_BE_URL || "";

export const dataProviders = dataProvider(API_URL || FALLBACK_API_URL);
