# FASTudy

FASTudy is a dedicated learning and practice platform for FAST NUCES students, covering **Programming Fundamentals (PF)**, **Calculus & Analytical Geometry**, and **Physics**.

---

## 🐛 Bugsy: Automated PF Lab TA & Code Verifier

**Bugsy** is the built-in AI agent designed for FAST NUCES Programming Fundamentals:
- **Automatic Edgecase Generation**: When you open any problem, Bugsy synthesizes realistic boundary cases, negative input filters, and extreme-size tests. Edge cases are **persistently stored** against each problem (in `localStorage` and Supabase).
- **Beginner PF-Lab Style Check**: Checks student code against authentic FAST lab grading standards:
  - Banned advanced STL containers (`<vector>`, `<map>`, `<set>`).
  - Banned STL algorithms (`std::sort`, `<algorithm>`).
  - Prohibited modern C++ features (`auto`, lambdas, dynamic OOP classes).
  - Enforces manual loops, primitive arrays, and bounds-checking re-prompt loops.
  - Generates a **PF-Lab Style Score (0–100%)** with actionable TA feedback.
- **Performance & Weak-Topic Memory**: Tracks your time per problem, test pass rates, and identifies topics where you struggle. Surfaces diagnostic tips and weak-topic alerts directly in problem views and the Profile page.

---

## 🤖 Code Evaluation

C/C++ submissions are evaluated by Bugsy through Google Gemini (`VITE_GEMINI_API_KEY`, model overridable with `VITE_GEMINI_MODEL`, default `gemini-2.5-flash`). Output, runtime and memory are AI estimates, not a real compiler run. If the key is missing or the API is unreachable, only static PF-lab checks run and the submission is **not** marked as accepted.

---

## 📂 Programming Fundamentals Question Suite

The old dummy questions have been completely cleaned out. FASTudy now features authentic FAST NUCES coursework from `NEW Data`:
1. **Lab 10 Tasks**:
   - Nested Loops & Conditional Grading (5 students, 3 subjects, marks validation)
   - Cafeteria Billing System (4 customers, item pricing, discount tiers)
   - Centered Star Pyramid Pattern ($2N-1$ stars)
   - Square Border & Diagonal Patterns ($N \times N$)
   - Household Electricity Consumption Monitor (while loop, continue, break)
   - 1D Array Declaration & Traversal
   - Duplicate Roll Numbers Detection (nested loops on 1D array)
   - Quiz Marks Frequency & Mode Finder (tied highest frequencies)
2. **Fall 2023 Final Exam Tasks**:
   - Function Overloading & Scope Tracing
   - Pass-by-Value Execution Tracing
   - Infinite Loops & Break Tracing
   - Ascending & Descending Nested Loops
   - Nested Ternary Operator Logic
   - Decrement Operator & Zero-Floor Tracing
   - Dangling Else & Nested Conditionals
   - Descending Bubble Sort Tracing
   - Menu-Driven Library Book Checkout System (10 books, availability tracking)
   - 2D Array Matrix Difference & Reverse Column Indexing
   - Subsequence Verification in C-Strings without built-ins
   - Boolean Logic Refactoring without `&&` or `||`
   - Random 4-Letter Word Generator without char variables
   - `validateMatrix` 2D Array Peak Element & Const Prototypes
   - Automated Quiz Grader with File I/O Simulation

---

## 🛠️ Environment Setup

1. Copy `.env.example` to `.env.local`:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_GEMINI_API_KEY=your-gemini-api-key
   ```
2. Run database migrations:
   - Run `supabase_schema.sql` in your Supabase SQL Editor.
3. Install dependencies and start the dev server:
   ```bash
   npm install
   npm run dev
   ```
4. Verify question bank integrity:
   ```bash
   npm run data:check
   ```

---

## 🚀 Deploying (Vercel / Netlify)

1. Build command `npm run build`, output directory `dist`.
2. Set the env vars from `.env.example` in the host dashboard (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GEMINI_API_KEY`).
3. In Supabase → Authentication → URL Configuration, add your deployed URL to the allowed redirect URLs.
4. SPA routing is preconfigured: `vercel.json` (Vercel) and `public/_redirects` (Netlify).

**Local mode:** without Supabase variables the app still runs, using the bundled question bank and guest progress stored in the browser. That's useful for an offline demo. Without a Gemini key the AI tutor and code evaluation show a clear "unavailable" message.
