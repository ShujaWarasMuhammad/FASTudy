# Question bank

All local learning content lives in `src/data/content/`. The UI reads it through `src/data/questionBank.js`; do not import individual JSON files directly in components.

## Folder map

```text
src/data/content/
  pf/subject.json              # PF metadata, categories, and subcategories
  pf/dry-runs/math/questions.json
  pf/dry-runs/bitwise/questions.json
  pf/logic-building/patterns/questions.json
  calculus/subject.json
  calculus/limits/basic-limits/questions.json
  physics/subject.json
  physics/mechanics/kinematics/questions.json
  community/comments.json      # optional seed discussion comments
  templates/question.template.json
```

## Add a question

1. Open the exact `questions.json` inside the relevant subject/category/subcategory folder.
2. Copy the object in `templates/question.template.json` into that file's array.
3. Give it a globally unique, stable id such as `pf-loops-002`.
4. Make `subjectId`, `categoryId`, and `subcategoryId` exactly match ids in `catalog/subjects.json`.
5. Restart the dev server if it does not hot-reload JSON.

Run `npm run data:check` before committing. It catches duplicate ids, invalid topic paths, unsupported types, and missing required structure.

## Supported question types

| Type | Required content |
| --- | --- |
| `dry_run` | `code`, `expectedOutput`, `explanation`, `hints` |
| `code_submit` | `statement`, `starterCode`, `expectedOutput`, `explanation` |
| `math_input` | `statement`, `latexExpression`, `expectedOutput`, `explanation` |
| `math_study` | `statement`, `latexExpression`, `explanation` |

For LaTeX, store just the expression, for example `"\\lim_{x \\to 0} \\frac{\\sin x}{x}"`. The interface renders it with KaTeX.

## Add a subject or topic

Add the category/subcategory inside that subject's `subject.json`, then create its matching `questions.json` folder path. The app discovers it automatically—no import registration required.

## Original seed migration

The original JS seed file is retained temporarily as a migration source. Run `npm run data:migrate` only if you need to regenerate the JSON seed bank from it; normal content editing happens in the JSON files.
