// AI-based code evaluator (replaces Judge0)
// Uses Gemini to analyze C/C++ code against the problem statement
// and returns structured feedback matching the Judge0 response shape.

import { GEMINI_API_KEY, GEMINI_MODEL, generateGeminiText } from './geminiClient';

/**
 * Evaluates student C/C++ code using Gemini AI.
 * Returns an object matching the Judge0 response shape so the UI needs no changes.
 *
 * @param {string} sourceCode   – The student's code
 * @param {object} question     – The question object { title, statement, expectedOutput, ... }
 * @param {string} stdin        – Custom stdin provided by the student
 */
export async function evaluateCodeWithAI(sourceCode, question = {}, stdin = '', expectedBehavior = '') {
  if (!sourceCode || !sourceCode.trim()) {
    return {
      success: false,
      status: 'No Code',
      stdout: '',
      stderr: 'Please write some code before running.',
      compile_output: '',
      time: '0.00',
      memory: '0',
      compiler: 'Bugsy AI',
      aiFeedback: null,
    };
  }

  if (!GEMINI_API_KEY) {
    // Offline heuristic fallback
    return offlineHeuristic(sourceCode);
  }

  const prompt = buildPrompt(sourceCode, question, stdin, expectedBehavior);

  try {
    const raw = await generateGeminiText(
      [{ role: 'user', parts: [{ text: prompt }] }],
      { temperature: 0.2, maxOutputTokens: 2048, responseMimeType: 'application/json' }
    );
    return parseAIResponse(raw);
  } catch (err) {
    console.warn('AI eval failed, falling back to static checks:', err);
    return offlineHeuristic(sourceCode);
  }
}

function buildPrompt(code, question, stdin, expectedBehavior) {
  return `You are Bugsy, an expert FAST NUCES Programming Fundamentals lab TA.
Evaluate this student's C/C++ code against the problem below.

PROBLEM: ${question.title || 'Code Exercise'}
STATEMENT: ${question.statement || question.description || 'Write a C++ program.'}
EXPECTED OUTPUT: ${question.expectedOutput || 'Not specified'}
STUDENT INPUT (stdin): ${stdin || '(none)'}${expectedBehavior ? `\nEXPECTED BEHAVIOUR FOR THIS INPUT: ${expectedBehavior}\n(Judge the verdict against this behaviour, not the sample output.)` : ''}

STUDENT CODE:
\`\`\`cpp
${code}
\`\`\`

FAST PF-Lab Rules (strict):
- No STL containers: vector, map, set, queue, stack, deque, string class
- No auto keyword, no lambdas, no templates, no classes
- Explicit primitive types only: int, float, double, char, bool, arrays
- Use only basic I/O: cin, cout, printf, scanf

Respond ONLY with a JSON object (no markdown, no explanation outside JSON):
{
  "verdict": "Accepted" | "Wrong Answer" | "Compilation Error" | "PF-Lab Violation",
  "stdout": "<simulated output the program would produce for the given stdin>",
  "stderr": "<compiler or runtime errors if any, else empty string>",
  "compile_output": "<compilation errors if any, else empty string>",
  "time": "<estimated execution time like 0.05>",
  "memory": "<estimated memory in KB like 1024>",
  "pfLabViolations": ["<violation1>", "<violation2>"],
  "feedback": "<2-3 sentence constructive critique for the student>",
  "score": <0-100 integer PF-lab compliance score>
}`;
}

function parseAIResponse(raw) {
  try {
    // Strip markdown code fences if present
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const verdict = parsed.verdict || 'Unknown';
    const isAccepted = verdict === 'Accepted';


    return {
      success: isAccepted,
      status: verdict,
      stdout: parsed.stdout || '',
      stderr: parsed.stderr || '',
      compile_output: parsed.compile_output || '',
      time: parsed.time || '',
      memory: parsed.memory || '',
      compiler: `Bugsy AI (${GEMINI_MODEL})`,
      aiFeedback: {
        feedback: parsed.feedback || '',
        score: Number.isFinite(parsed.score) ? parsed.score : null,
        pfLabViolations: parsed.pfLabViolations || [],
      },
    };
  } catch {
    // Unparseable reply: never guess a verdict from free text.
    return {
      success: false,
      status: 'Evaluation Unavailable',
      stdout: '',
      stderr: 'The AI evaluator returned an unreadable response. Please run again.',
      compile_output: '',
      time: '',
      memory: '',
      compiler: `Bugsy AI (${GEMINI_MODEL})`,
      aiFeedback: { feedback: raw.slice(0, 400), score: null, pfLabViolations: [] },
    };
  }
}

function offlineHeuristic(code) {
  // Without the AI service the code cannot be executed or judged, so only static
  // PF-lab rule checks are reported and the submission is never marked accepted.
  const violations = [];
  if (/#include\s*<vector>/i.test(code)) violations.push('vector used (banned)');
  if (/#include\s*<algorithm>/i.test(code)) violations.push('algorithm header (banned)');
  if (/\bauto\s+[a-zA-Z_]/.test(code)) violations.push('auto keyword (banned)');
  if (/\bstd::sort\b|(?<![\w.])sort\s*\(/.test(code)) violations.push('std::sort (banned)');
  const hasMain = /\bint\s+main\s*\(/.test(code);

  return {
    success: false,
    status: 'Evaluator Offline',
    stdout: '',
    stderr: hasMain ? '' : 'Missing int main() function.',
    compile_output: '',
    time: '',
    memory: '',
    compiler: 'Static checks only',
    aiFeedback: {
      feedback: `The AI evaluator is unavailable (check VITE_GEMINI_API_KEY and your connection), so the code was not run. ${
        violations.length ? `Static checks found: ${violations.join(', ')}.` : 'Static PF-lab checks found no banned constructs.'
      }`,
      score: null,
      pfLabViolations: violations,
    },
  };
}
