# pnpm workspaces with Turborepo

The monorepo will use pnpm workspaces with Turborepo for package boundaries and task orchestration. This adds a small migration cost from the current npm setup, but gives cleaner dependency isolation and predictable `dev`, `build`, `lint`, and `test` pipelines as the frontend, API server, and shared contracts grow.
