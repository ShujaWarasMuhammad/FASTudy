/**
 * One-time migration of the original in-code seed bank to editable JSON files.
 * Run: npm run data:migrate
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { subjects, questions, comments } from '../src/data/dummyData.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const contentRoot = resolve(root, 'src/data/content');
const writeJson = (path, value) => writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');

await Promise.all([mkdir(resolve(contentRoot, 'community'), { recursive: true }), mkdir(resolve(contentRoot, 'templates'), { recursive: true })]);

for (const subject of subjects) {
  await mkdir(resolve(contentRoot, subject.id), { recursive: true });
  await writeJson(resolve(contentRoot, `${subject.id}/subject.json`), subject);

  for (const category of subject.categories) {
    for (const subcategory of category.subcategories) {
      const folder = resolve(contentRoot, subject.id, category.id, subcategory.id);
      await mkdir(folder, { recursive: true });
      await writeJson(
        resolve(folder, 'questions.json'),
        questions.filter(
          (question) =>
            question.subjectId === subject.id &&
            question.categoryId === category.id &&
            question.subcategoryId === subcategory.id
        )
      );
    }
  }
}
await writeJson(resolve(contentRoot, 'community/comments.json'), comments);

console.log(`Wrote ${questions.length} questions into ${subjects.length} subject folder trees in src/data/content/.`);
