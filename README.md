# FASTudy

## Supabase progress tracking

Authenticated learners' profiles, completed questions, attempts, activity heatmaps, and bookmarks are stored in Supabase. Guest-mode records intentionally remain on the device.

1. Copy `.env.example` to `.env.local` and set your Supabase credentials and Gemini API key (`VITE_GEMINI_API_KEY`).
2. Run `supabase_schema.sql` in the project's Supabase SQL Editor.
3. In Supabase Authentication, add local and deployed app URLs to the redirect allow-list and enable your desired sign-in providers.

The schema applies row-level security, so each learner can access only their own progress records.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
You can also try [the experimental native React Compiler support in plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#rust-react-compiler) by using `compiler: true` in the plugin options instead of using the Babel plugin.

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
