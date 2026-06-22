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
import { getSafeImageSrc } from "@/src/utils/safeUrl";

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

const BRANDING_FAVICON_ATTR = "data-pixeldesk-branding-favicon";

/** Update only our own favicon link — never remove Next/React-managed head nodes. */
function applyFavicon(faviconUrl: string | null) {
  if (typeof document === "undefined") return;

  const safeFavicon = getSafeImageSrc(faviconUrl);
  let link = document.querySelector<HTMLLinkElement>(
    `link[${BRANDING_FAVICON_ATTR}]`,
  );

  if (!safeFavicon) {
    link?.remove();
    return;
  }

  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    link.setAttribute(BRANDING_FAVICON_ATTR, "true");
    document.head.appendChild(link);
  }

  if (link.href !== safeFavicon) {
    link.href = safeFavicon;
  }
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
        logoUrl: getSafeImageSrc(data.logoUrl ?? null),
        logoDarkUrl: getSafeImageSrc(data.logoDarkUrl ?? null),
        faviconUrl: getSafeImageSrc(data.faviconUrl ?? null),
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
