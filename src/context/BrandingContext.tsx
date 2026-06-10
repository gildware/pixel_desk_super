"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { getPublicBranding, type WebsiteSettings } from "@/src/services/api/settings.api";

type BrandingContextType = {
  branding: WebsiteSettings;
  loading: boolean;
  refetch: () => Promise<void>;
};

const DEFAULT_BRANDING: WebsiteSettings = {
  siteName: "PixelDesk Super Admin",
  logoUrl: null,
  logoDarkUrl: null,
  faviconUrl: null,
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

function applyFavicon(faviconUrl: string | null) {
  if (typeof document === "undefined" || !faviconUrl) return;
  const head = document.head;
  const existing = head.querySelectorAll<HTMLLinkElement>("link[rel~='icon']");
  existing.forEach((el) => el.parentNode?.removeChild(el));
  const link = document.createElement("link");
  link.rel = "icon";
  link.href = faviconUrl;
  head.appendChild(link);
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<WebsiteSettings>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);
  const initialFetchDone = useRef(false);

  const refetch = useCallback(async () => {
    try {
      const data = await getPublicBranding();
      setBranding({
        siteName: data.siteName || DEFAULT_BRANDING.siteName,
        logoUrl: data.logoUrl ?? null,
        logoDarkUrl: data.logoDarkUrl ?? null,
        faviconUrl: data.faviconUrl ?? null,
      });
    } catch {
      // keep defaults on failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;
    refetch();
  }, [refetch]);

  useEffect(() => {
    applyFavicon(branding.faviconUrl);
  }, [branding.faviconUrl]);

  return (
    <BrandingContext.Provider value={{ branding, loading, refetch }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const ctx = useContext(BrandingContext);
  if (ctx === undefined) {
    throw new Error("useBranding must be used within a BrandingProvider");
  }
  return ctx;
}
