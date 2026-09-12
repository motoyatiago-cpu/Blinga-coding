"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import HoverBounceMotion from "./hover-bounce";
import SmoothScrollMotion from "./smooth-scroll";
import { WebDesktopPet } from "./web-pet";

/** Keep existing application enhancements off the independent entrance surface. */
export default function SiteEffects() {
  const pathname = usePathname();
  const entrance = pathname === "/" || pathname === "/author";
  useEffect(() => {
    if (!entrance) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [entrance]);
  return entrance ? null : <><SmoothScrollMotion /><HoverBounceMotion /><WebDesktopPet /></>;
}
