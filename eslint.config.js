import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

// Lint-Schärfe Phase 4:
// - no-unused-vars als WARN (nicht error → CI bleibt grün, Drift wird sichtbar)
// - no-console als WARN, erlaubt warn/error/debug (devlog spiegelt darauf)
// - no-explicit-any als WARN
// - prefer-const + eqeqeq als WARN
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
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": ["warn", { allow: ["warn", "error", "debug"] }],
      "prefer-const": "warn",
      "eqeqeq": ["warn", "smart"],
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
