"use client";

import { useEffect, useState } from "react";
import { WEB_PET_CONFIG } from "../config/default-config";

export function usePetSize() {
  const [size, setSize] = useState(WEB_PET_CONFIG.desktopSize);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${WEB_PET_CONFIG.mobileBreakpoint}px)`);
    const updateSize = () => setSize(media.matches ? WEB_PET_CONFIG.mobileSize : WEB_PET_CONFIG.desktopSize);

    updateSize();
    media.addEventListener("change", updateSize);
    return () => media.removeEventListener("change", updateSize);
  }, []);

  return size;
}
