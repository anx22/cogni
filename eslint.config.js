import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

// Lint-Schärfe Phase 4 (final):
// - ERROR: no-unused-vars, prefer-const, eqeqeq, no-console (Browser),
//   react-hooks/rules-of-hooks
// - WARN bewusst belassen:
//   - @typescript-eslint/no-explicit-any → Supabase-/Graphiti-Returns sind
//     dynamisch; harter Cast zu unknown würde Lesbarkeit verschlechtern.
//     Drift bleibt als Warning sichtbar.
//   - react-refresh/only-export-components → reiner HMR-Hint, kein Runtime-Risiko.
//   - react-hooks/exhaustive-deps → false-positives bei Refs/Stable-Callbacks.
// shadcn-Komponenten und generierte Supabase-Types sind ausgenommen, weil sie
// extern gepflegt werden und nicht unsere Stilrichtlinie tragen.
export default tseslint.config(
  { ignores: ["dist", "src/components/ui/**", "src/integrations/supabase/types.ts", "tailwind.config.ts"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": ["error", { allow: ["warn", "error", "debug"] }],
      "prefer-const": "error",
      "eqeqeq": ["error", "smart"],
    },
  },
  {
    // Edge Functions laufen in Deno — andere Globals, console ist dort der
    // einzige Logging-Pfad (zusätzlich zum strukturierten Logger).
    files: ["supabase/functions/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },
);
