import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/*.d.ts"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,js,mjs}"],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  {
    files: ["ui/web-app/src/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.browser
      }
    }
  },
  {
    files: ["ui/web-table-foundation/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser
      }
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_"
        }
      ]
    }
  },
  {
    files: ["contracts/settlement/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.mocha
      }
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off"
    }
  }
];
