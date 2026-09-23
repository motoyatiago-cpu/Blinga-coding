import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // This application intentionally uses full-document anchors for its
      // hash/query driven workspace navigation.
      "@next/next/no-html-link-for-pages": "off",
      // Initial data hydration and editor synchronization are effect-driven.
      // They are guarded against stale async work in the components themselves.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["app/web-pet/**/*.{ts,tsx}"],
    rules: {
      // The pet state machine stores mutable animation controllers in refs so
      // animation ticks do not force React renders.
      "react-hooks/refs": "off",
    },
  },
  {
    files: [
      "app/account-menu.tsx",
      "app/forum/forum-client.tsx",
      "app/profile/profile-client.tsx",
      "app/web-pet/components/pet-asset-media.tsx",
    ],
    rules: {
      // These sources are authenticated avatar URLs or registry-selected pet
      // media. They must bypass the public image optimizer.
      "@next/next/no-img-element": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "output/**",
    ".vinext/**",
    ".wrangler/**",
    "public/feeling/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
