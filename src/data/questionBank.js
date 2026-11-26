import comments from './content/community/comments.json';

const subjectModules = import.meta.glob('./content/*/subject.json', {
  eager: true,
  import: 'default',
});
const questionModules = import.meta.glob('./content/*/*/*/questions.json', {
  eager: true,
  import: 'default',
});

export const subjects = Object.values(subjectModules).sort((a, b) => a.name.localeCompare(b.name));
export const questions = Object.entries(questionModules)
  .sort(([pathA], [pathB]) => pathA.localeCompare(pathB))
  .flatMap(([, fileQuestions]) => fileQuestions);

/**
 * The app's local content source of truth. Add/edit JSON in content/;
 * no React component should need changing when the question bank grows.
 */
export { comments };

export const getQuestionsByFilter = (subjectId, categoryId, subcategoryId) =>
  questions.filter(
    (question) =>
      (!subjectId || question.subjectId === subjectId) &&
      (!categoryId || question.categoryId === categoryId) &&
      (!subcategoryId || question.subcategoryId === subcategoryId)
  );

export const getQuestionById = (id) => questions.find((question) => question.id === id);
export const getCommentsByQuestionId = (questionId) =>
  comments.filter((comment) => comment.questionId === questionId);
