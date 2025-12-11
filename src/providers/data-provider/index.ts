"use client";

import { dataProvider } from "@rest-data-provider";

// Get API URL - prioritize runtime env var over build-time
const getApiUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_BE_URL;
  if (envUrl) {
    console.log("✅ Using NEXT_PUBLIC_BE_URL:", envUrl);
    return envUrl;
  }
  console.warn("⚠️ NEXT_PUBLIC_BE_URL not set!");
  return "";
};

const API_URL = getApiUrl();

export const dataProviders = dataProvider(API_URL);
