// AI-based code evaluator (replaces Judge0)
// Uses Gemini to analyze C/C++ code against the problem statement
// and returns structured feedback matching the Judge0 response shape.

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Evaluates student C/C++ code using Gemini AI.
 * Returns an object matching the Judge0 response shape so the UI needs no changes.
 *
 * @param {string} sourceCode   – The student's code
 * @param {object} question     – The question object { title, statement, expectedOutput, ... }
 * @param {string} stdin        – Custom stdin provided by the student
 */
export async function evaluateCodeWithAI(sourceCode, question = {}, stdin = '') {
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
    return offlineHeuristic(sourceCode, question, stdin);
  }

  const prompt = buildPrompt(sourceCode, question, stdin);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);

    const body = await res.json();
    const raw = body.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return parseAIResponse(raw, sourceCode);
  } catch (err) {
    console.warn('AI eval failed, falling back to heuristic:', err);
    return offlineHeuristic(sourceCode, question, stdin);
  }
}

function buildPrompt(code, question, stdin) {
  return `You are Bugsy, an expert FAST NUCES Programming Fundamentals lab TA.
Evaluate this student's C/C++ code against the problem below.

PROBLEM: ${question.title || 'Code Exercise'}
STATEMENT: ${question.statement || question.description || 'Write a C++ program.'}
EXPECTED OUTPUT: ${question.expectedOutput || 'Not specified'}
STUDENT INPUT (stdin): ${stdin || '(none)'}

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

function parseAIResponse(raw, code) {
  try {
    // Strip markdown code fences if present
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const verdict = parsed.verdict || 'Unknown';
    const isAccepted = verdict === 'Accepted';
    const isCompileError = verdict === 'Compilation Error';

    return {
      success: isAccepted,
      status: verdict,
      stdout: parsed.stdout || '',
      stderr: parsed.stderr || '',
      compile_output: parsed.compile_output || '',
      time: parsed.time || '0.08',
      memory: parsed.memory || '1024',
      compiler: 'Bugsy AI (Gemini)',
      aiFeedback: {
        feedback: parsed.feedback || '',
        score: parsed.score ?? 80,
        pfLabViolations: parsed.pfLabViolations || [],
      },
    };
  } catch {
    // If JSON parse fails, do a best-effort heuristic from the raw text
    const isAccepted = /accepted|correct|passed/i.test(raw);
    return {
      success: isAccepted,
      status: isAccepted ? 'Accepted' : 'Reviewed by AI',
      stdout: '',
      stderr: '',
      compile_output: '',
      time: '0.10',
      memory: '1024',
      compiler: 'Bugsy AI (Gemini)',
      aiFeedback: { feedback: raw.slice(0, 400), score: 70, pfLabViolations: [] },
    };
  }
}

function offlineHeuristic(code, question, stdin) {
  const c = code.toLowerCase();
  const violations = [];
  if (/#include\s*<vector>/i.test(code)) violations.push('vector used (banned)');
  if (/#include\s*<algorithm>/i.test(code)) violations.push('algorithm header (banned)');
  if (/\bauto\s+[a-zA-Z_]/i.test(code)) violations.push('auto keyword (banned)');
  if (/std::sort|sort\s*\(/i.test(code)) violations.push('std::sort (banned)');

  const hasMain = /int\s+main/.test(c);
  const hasCout = /cout|printf/.test(c);
  const score = Math.max(0, 100 - violations.length * 25);

  return {
    success: hasMain && hasCout && violations.length === 0,
    status: violations.length > 0 ? 'PF-Lab Violation' : (hasMain ? 'Accepted (Heuristic)' : 'Compilation Error'),
    stdout: hasMain && hasCout ? '[AI offline — output simulated]' : '',
    stderr: !hasMain ? 'Missing int main() function.' : '',
    compile_output: '',
    time: '0.05',
    memory: '1024',
    compiler: 'Bugsy Offline Heuristic',
    aiFeedback: {
      feedback: violations.length > 0
        ? `PF-Lab violations found: ${violations.join(', ')}. Remove these for lab compliance.`
        : (hasMain ? 'Code structure looks correct. Connect to internet for full AI evaluation.' : 'Missing main() function.'),
      score,
      pfLabViolations: violations,
    },
  };
}
