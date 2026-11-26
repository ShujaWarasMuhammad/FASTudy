/** Validate local JSON content before committing or running a build. */
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const contentRoot = resolve(root, 'src/data/content');
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const fail = (message) => { throw new Error(`Question bank: ${message}`); };

const contentEntries = await readdir(contentRoot);
const subjectFiles = [];
for (const entry of contentEntries) {
  const subjectPath = resolve(contentRoot, entry);
  if ((await stat(subjectPath)).isDirectory()) {
    try {
      subjectFiles.push(resolve(subjectPath, 'subject.json'));
      await readJson(resolve(subjectPath, 'subject.json'));
    } catch {
      subjectFiles.pop();
    }
  }
}
const subjects = await Promise.all(subjectFiles.map(readJson));
const topicKeys = new Set();
const subjectIds = new Set();

for (const subject of subjects) {
  if (!subject.id || subjectIds.has(subject.id)) fail(`duplicate or missing subject id: ${subject.id || '(missing)'}`);
  subjectIds.add(subject.id);
  for (const category of subject.categories || []) {
    for (const subcategory of category.subcategories || []) {
      topicKeys.add(`${subject.id}/${category.id}/${subcategory.id}`);
    }
  }
}

const ids = new Set();
let count = 0;
let fileCount = 0;

for (const subject of subjects) {
  for (const category of subject.categories || []) {
    for (const subcategory of category.subcategories || []) {
      const file = resolve(contentRoot, subject.id, category.id, subcategory.id, 'questions.json');
      let entries;
      try {
        entries = await readJson(file);
      } catch {
        fail(`missing question file for ${subject.id}/${category.id}/${subcategory.id}`);
      }
      if (!Array.isArray(entries)) fail(`${file} must contain an array`);
      fileCount += 1;
      for (const question of entries) {
    count += 1;
        if (!question.id || ids.has(question.id)) fail(`duplicate or missing question id: ${question.id || '(missing)'}`);
        ids.add(question.id);
        if (!['dry_run', 'code_submit', 'math_input', 'math_study'].includes(question.type)) fail(`${question.id}: unsupported type '${question.type}'`);
        if (!topicKeys.has(`${question.subjectId}/${question.categoryId}/${question.subcategoryId}`)) fail(`${question.id}: subject/category/subcategory does not exist in subject.json`);
        if (!question.title || !question.difficulty) fail(`${question.id}: title and difficulty are required`);
        if (!Array.isArray(question.tags) || !Array.isArray(question.hints)) fail(`${question.id}: tags and hints must be arrays`);
      }
    }
  }
}

console.log(`Question bank valid: ${count} questions across ${fileCount} subsection files.`);
