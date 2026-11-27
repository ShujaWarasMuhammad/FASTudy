// Bugsy: FAST NUCES AI Lab TA & Automated Code Verifier
// Generates rigorous edge cases, evaluates beginner PF-lab constraints,
// executes tests via Judge0, and tracks performance and weak topics.

import { supabase } from '../config/supabase';
import { evaluateCodeWithAI } from './aiEval';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const LOCAL_STORAGE_EDGECASES_KEY = 'fastudy_bugsy_edgecases_v1';
const LOCAL_STORAGE_EVALS_KEY = 'fastudy_bugsy_evaluations_v1';
const LOCAL_STORAGE_TOPIC_STATS_KEY = 'fastudy_bugsy_topic_stats_v1';

// Banned C++ constructs in FAST PF Labs (students must use fundamentals)
const BANNED_PATTERNS = [
  { pattern: /#include\s*<vector>/i, rule: 'Vectors Banned', message: 'Avoid <vector>. FAST PF Labs require primitive fixed-size arrays.' },
  { pattern: /#include\s*<algorithm>/i, rule: 'STL Algorithms Banned', message: 'Avoid <algorithm>. Implement sorting and searching using manual loops (e.g. Bubble Sort, Linear Search).' },
  { pattern: /#include\s*<map>/i, rule: 'Map Banned', message: 'Avoid <map>. Use parallel arrays or frequency arrays as taught in PF Lab 10.' },
  { pattern: /#include\s*<set>/i, rule: 'Set Banned', message: 'Avoid <set>. Use nested loops or boolean flags to track uniqueness.' },
  { pattern: /#include\s*<queue>|#include\s*<stack>|#include\s*<deque>/i, rule: 'STL Containers Banned', message: 'Avoid STL queue/stack. Use basic arrays and index pointers.' },
  { pattern: /\bstd::sort\b|\bsort\s*\(/i, rule: 'std::sort Banned', message: 'Do not use std::sort(). Implement your own loop-based sorting algorithm.' },
  { pattern: /\bauto\s+[a-zA-Z_]/i, rule: 'auto Keyword Banned', message: 'Do not use "auto". In PF Lab, explicitly specify primitive data types (int, float, double, char, bool).' },
  { pattern: /\[\s*(&|=|[\w\s,]*)\s*\]\s*\(.*\)\s*->|\b\[\s*(&|=|[\w\s,]*)\s*\]\s*\{/i, rule: 'Lambdas Banned', message: 'Lambda expressions are forbidden. Write standard named C++ functions.' },
  { pattern: /\btemplate\s*<|\bclass\s+[a-zA-Z_]/i, rule: 'Classes & Templates Banned', message: 'OOP classes and templates are outside PF scope. Use structs and standalone functions.' },
];

/**
 * Loads stored edgecases for all questions from localStorage
 */
function loadCachedEdgecases() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_EDGECASES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn('Failed to load cached edgecases:', e);
    return {};
  }
}

/**
 * Saves edgecases for all questions into localStorage
 */
function saveCachedEdgecases(allEdgecases) {
  try {
    localStorage.setItem(LOCAL_STORAGE_EDGECASES_KEY, JSON.stringify(allEdgecases));
  } catch (e) {
    console.warn('Failed to save cached edgecases:', e);
  }
}

/**
 * Deterministic domain edgecase fallback when Gemini is not configured or offline
 */
function getDomainFallbackEdgecases(question) {
  const qid = (question.id || '').toLowerCase();
  const statement = (question.statement || question.description || '').toLowerCase();

  // Pattern printing questions
  if (qid.includes('pattern') || qid.includes('p3') || qid.includes('p4') || qid.includes('q1d')) {
    return [
      {
        name: 'Minimum Valid Boundary',
        stdin: '3\n',
        expectedBehavior: 'Smallest supported dimension (N=3). Verifies border and single center star.',
        edgeType: 'boundary',
        rationale: 'Students frequently hardcode loop conditions or fail at N=3.'
      },
      {
        name: 'Standard Lab Dimension',
        stdin: '5\n',
        expectedBehavior: 'Properly formatted centered pyramid or border square with exact spacing.',
        edgeType: 'standard',
        rationale: 'Validates leading spaces and star count calculations (2*i - 1).'
      },
      {
        name: 'Invalid Dimension Filter',
        stdin: '2\n4\n',
        expectedBehavior: 'Displays error message for N < 3 and re-prompts or safely halts.',
        edgeType: 'negative_filter',
        rationale: 'FAST lab guidelines mandate validation for N < 3.'
      }
    ];
  }

  // Duplicate or frequency in 1D array (P7, P8)
  if (qid.includes('p7') || qid.includes('p8') || statement.includes('duplicate') || statement.includes('frequency')) {
    return [
      {
        name: 'All Distinct Elements (No Duplicates)',
        stdin: '4\n10 20 30 40\n',
        expectedBehavior: 'Reports "No duplicates found" or counts each frequency as 1.',
        edgeType: 'empty_tie',
        rationale: 'Tests whether the student displays the "No duplicates" fallback message.'
      },
      {
        name: 'Multiple Ties for Highest Frequency',
        stdin: '6\n10 20 10 30 20 40\n',
        expectedBehavior: 'Correctly identifies both 10 and 20 tied at frequency 2 without duplicate printouts.',
        edgeType: 'tied_extremes',
        rationale: 'Most students print only the first mode and miss tied elements.'
      },
      {
        name: 'Single Element Boundary',
        stdin: '1\n100\n',
        expectedBehavior: 'Handles N=1 gracefully without out-of-bounds array access.',
        edgeType: 'boundary',
        rationale: 'Verifies inner loop does not read garbage memory when j = i + 1.'
      }
    ];
  }

  // Nested loops & billing / consumption (P1, P2, P5)
  if (qid.includes('p1') || qid.includes('p2') || qid.includes('p5') || statement.includes('discount') || statement.includes('electricity')) {
    return [
      {
        name: 'Negative Input Filtering',
        stdin: '-15\n100\n-5\n250\n0\n',
        expectedBehavior: 'Prints "Invalid" message and uses "continue" to skip invalid readings.',
        edgeType: 'negative_filter',
        rationale: 'Checks if negative inputs are correctly rejected before calculation.'
      },
      {
        name: 'Discount Threshold Exact Boundary',
        stdin: '5000\ny\n',
        expectedBehavior: 'Subtotal == Rs. 5,000 must receive 15% discount (not 5%).',
        edgeType: 'boundary',
        rationale: 'Students often use ">" instead of ">=" leading to wrong tier classification.'
      },
      {
        name: 'Immediate Break / Zero Termination',
        stdin: '0\n',
        expectedBehavior: 'Breaks immediately and outputs count 0 with total 0.',
        edgeType: 'boundary',
        rationale: 'Ensures the while loop does not process zero or divide by zero.'
      }
    ];
  }

  // Subsequence & Strings (Q3B)
  if (qid.includes('q3b') || statement.includes('subsequence')) {
    return [
      {
        name: 'Identical Strings Match',
        stdin: 'fastnuces\nfastnuces\n',
        expectedBehavior: 'Reports Yes, identical strings are valid subsequences.',
        edgeType: 'boundary',
        rationale: 'Tests full string traversal matching.'
      },
      {
        name: 'Reversed Characters (Order Violation)',
        stdin: 'apple\npla\n',
        expectedBehavior: 'Reports No, characters exist but violate sequence order.',
        edgeType: 'logic',
        rationale: 'Detects naive frequency-based checking instead of sequential two-pointer checking.'
      },
      {
        name: 'Single Character Subsequence',
        stdin: 'university\nv\n',
        expectedBehavior: 'Reports Yes, single char match works correctly.',
        edgeType: 'boundary',
        rationale: 'Checks single-character search and null-terminator termination.'
      }
    ];
  }

  // General fallback
  return [
    {
      name: 'Zero & Minimum Boundary',
      stdin: '0\n',
      expectedBehavior: 'Program handles zero or minimum valid input without crash.',
      edgeType: 'boundary',
      rationale: 'Boundary testing for minimal input values.'
    },
    {
      name: 'Typical Lab Test Case',
      stdin: '5\n',
      expectedBehavior: 'Outputs expected result formatted as specified in problem statement.',
      edgeType: 'standard',
      rationale: 'Ensures baseline algorithmic correctness.'
    },
    {
      name: 'Maximum Constraint Boundary',
      stdin: '100\n',
      expectedBehavior: 'Executes within fixed array size (e.g. N <= 100) without buffer overflow.',
      edgeType: 'overflow',
      rationale: 'Ensures code stays within FAST lab array bounds.'
    }
  ];
}

/**
 * Bugsy generates edge cases for a question (or retrieves cached edge cases)
 * Caches in localStorage and attempts Supabase persistence.
 */
export async function getBugsyEdgecases(question) {
  if (!question || !question.id) return [];

  // 1. Check local cache first
  const cache = loadCachedEdgecases();
  if (cache[question.id] && Array.isArray(cache[question.id]) && cache[question.id].length > 0) {
    return cache[question.id];
  }

  // 2. Try fetching from Supabase if online
  try {
    const { data, error } = await supabase
      .from('bugsy_edgecases')
      .select('edgecases')
      .eq('question_id', question.id)
      .maybeSingle();

    if (!error && data && Array.isArray(data.edgecases) && data.edgecases.length > 0) {
      cache[question.id] = data.edgecases;
      saveCachedEdgecases(cache);
      return data.edgecases;
    }
  } catch (err) {
    // Supabase unavailable or table pending migration, proceed to generation
  }

  // 3. Generate via Gemini if API key available
  let generated = null;
  if (GEMINI_API_KEY) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const prompt = `You are Bugsy, the senior Programming Fundamentals (PF) Lab TA at FAST NUCES.
Analyze this C++ problem and generate 3 rigorous edge cases that will test beginner student code:
Title: ${question.title}
Problem Statement: ${question.statement || question.description}
Starter Code: ${question.starterCode || ''}

Return ONLY a valid JSON array of 3 objects with these exact keys:
[
  {
    "name": "Edge Case Name",
    "stdin": "input values separated by spaces or newlines ending with \\n",
    "expectedBehavior": "exact expected output or condition description",
    "edgeType": "boundary | negative_filter | tied_extremes | overflow",
    "rationale": "one sentence explaining why this tests beginner PF code"
  }
]`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (res.ok) {
        const body = await res.json();
        const jsonText = body.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          const parsed = JSON.parse(jsonText);
          if (Array.isArray(parsed) && parsed.length > 0) {
            generated = parsed;
          }
        }
      }
    } catch (apiErr) {
      console.warn('Bugsy Gemini edgecase generation fallback:', apiErr);
    }
  }

  // 4. Fallback to domain heuristics if Gemini wasn't available or failed
  if (!generated) {
    generated = getDomainFallbackEdgecases(question);
  }

  // 5. Store against question in cache
  cache[question.id] = generated;
  saveCachedEdgecases(cache);

  // 6. Asynchronously attempt saving to Supabase
  try {
    await supabase.from('bugsy_edgecases').upsert({
      question_id: question.id,
      edgecases: generated,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    // Non-fatal if offline
  }

  return generated;
}

/**
 * Checks whether the student's code adheres to "Beginner PF-Lab Way"
 * Limits advanced STL, checks input validation, and verifies lab standards.
 */
export function evaluatePfLabStyle(userCode = '', question = {}) {
  const code = userCode || '';
  const qid = (question.id || '').toLowerCase();
  const statement = (question.statement || question.description || '').toLowerCase();

  const violations = [];
  const strengths = [];
  let score = 100;

  // 1. Check banned advanced STL / constructs
  for (const item of BANNED_PATTERNS) {
    if (item.pattern.test(code)) {
      violations.push({
        rule: item.rule,
        message: item.message,
        penalty: 15,
        severity: 'high'
      });
      score -= 15;
    }
  }

  // 2. Question-specific checks
  // Subsequence without built-in functions (FAST_CFD_PF_F23_FINAL_Q3B)
  if (qid.includes('q3b') || statement.includes('do not use any built-in functions')) {
    if (/#include\s*<cstring>|#include\s*<string>|\bstrlen\b|\bstrcmp\b|\bstrstr\b|\bstrcpy\b/.test(code)) {
      violations.push({
        rule: 'Built-in String Functions Forbidden',
        message: 'Question strictly forbids built-in string functions. Implement character array traversal manually using while (str[i] != \'\\0\').',
        penalty: 25,
        severity: 'critical'
      });
      score -= 25;
    } else if (/while\s*\([^\)]*!=.*'\\0'/.test(code)) {
      strengths.push('Excellent manual null-terminator (\'\\0\') character array traversal!');
    }
  }

  // Random word without char variables (FAST_CFD_PF_F23_FINAL_Q4_2)
  if (qid.includes('q4-2') || statement.includes('cannot create a char variable or char array')) {
    if (/\bchar\s+[a-zA-Z_]/.test(code)) {
      violations.push({
        rule: 'Char Variable Rule Broken',
        message: 'Question forbids declaring char variables or char arrays. Output characters using integer ASCII values and direct typecasting: (char)asciiVal.',
        penalty: 30,
        severity: 'critical'
      });
      score -= 30;
    } else if (/\(char\)/.test(code)) {
      strengths.push('Great job using ASCII integer typecasting without char variables!');
    }
  }

  // Refactoring without logical operators (FAST_CFD_PF_F23_FINAL_Q4_1)
  if (qid.includes('q4-1') || statement.includes('without using logical operators')) {
    if (/&&|\|\|/.test(code)) {
      violations.push({
        rule: 'Logical Operators Forbidden',
        message: 'Conditions must be refactored using pure nested if-else statements without && or ||.',
        penalty: 30,
        severity: 'critical'
      });
      score -= 30;
    } else {
      strengths.push('Successfully refactored boolean logic using pure nested if-else structures!');
    }
  }

  // 3. Input validation & Bounds limiting check
  const hasInputValidation =
    /while\s*\([^)]*(?:<|>|<=|>=|!=|==)[^)]*\)/.test(code) ||
    /if\s*\([^)]*(?:<|<=|zero|negative|invalid)[^)]*\)/i.test(code) ||
    /cin\.fail\(\)/.test(code);

  if (statement.includes('validate') || statement.includes('reject') || statement.includes('invalid') || statement.includes('boundary')) {
    if (!hasInputValidation) {
      violations.push({
        rule: 'Missing Input Validation Loop',
        message: 'FAST PF lab tasks require actively rejecting invalid inputs (e.g. negative numbers, out-of-range marks 0-100) using a re-prompt loop.',
        penalty: 15,
        severity: 'medium'
      });
      score -= 15;
    } else {
      strengths.push('Proper input validation and bounds checking detected.');
    }
  }

  // 4. Check for nested loops in nested loop tasks
  if (qid.includes('nested') || qid.includes('p1') || qid.includes('p2') || qid.includes('p3') || qid.includes('p4') || qid.includes('p7') || qid.includes('p8')) {
    const loopMatches = (code.match(/\b(?:for|while)\s*\(/g) || []).length;
    if (loopMatches < 2) {
      violations.push({
        rule: 'Nested Loops Required',
        message: 'This task requires nested loops (at least one outer loop and one inner loop).',
        penalty: 20,
        severity: 'high'
      });
      score -= 20;
    } else {
      strengths.push('Correct use of nested loop architecture.');
    }
  }

  // 5. Code cleanliness & indentation checks
  const lines = code.split('\n');
  if (lines.length > 5 && !code.includes('    ') && !code.includes('\t')) {
    violations.push({
      rule: 'Indentation Standard',
      message: 'Code lacks consistent indentation. Proper indentation is graded strictly in FAST labs.',
      penalty: 5,
      severity: 'low'
    });
    score -= 5;
  }

  score = Math.max(0, Math.min(100, score));
  const isBeginnerCompliant = violations.filter(v => v.severity === 'critical' || v.severity === 'high').length === 0;

  // Generate Bugsy's TA review narrative
  let critique = '';
  if (score >= 90) {
    critique = '🌟 Bugsy TA Verdict: Outstanding! Your code follows genuine FAST PF-Lab beginner practices. Clean manual logic, zero banned STL shortcuts, and solid fundamentals.';
  } else if (score >= 70) {
    critique = '👍 Bugsy TA Verdict: Good effort! Code works, but you lost marks on PF lab conventions or missed boundary/input-limiting checks. Review the feedback below to maximize your lab marks.';
  } else {
    critique = '⚠️ Bugsy TA Verdict: Lab Convention Warning! Your submission uses banned STL/advanced constructs or ignores crucial input limits. In FAST PF exams, this results in significant deductions. Stick to fundamental loops and fixed arrays!';
  }

  return {
    score,
    isBeginnerCompliant,
    violations,
    strengths,
    critique
  };
}

/**
 * Runs code through AI evaluator for all test cases (sample + Bugsy edgecases)
 */
export async function runJudge0TestMatrix(userCode, testCases = [], question = {}) {
  if (!testCases || testCases.length === 0) {
    const singleRun = await evaluateCodeWithAI(userCode, question, '');
    return {
      totalTests: 1,
      passedTests: singleRun.success ? 1 : 0,
      results: [
        {
          name: 'Default Execution',
          stdin: '',
          expected: 'Compile & Execute',
          actual: singleRun.stdout || singleRun.stderr || singleRun.compile_output,
          passed: singleRun.success,
          time: singleRun.time,
          memory: singleRun.memory,
          status: singleRun.status,
          error: !singleRun.success ? (singleRun.compile_output || singleRun.stderr) : null
        }
      ]
    };
  }

  const results = [];
  let passedCount = 0;

  for (const test of testCases) {
    const input = test.stdin || '';
    const res = await evaluateCodeWithAI(userCode, question, input);

    let isPassed = false;
    if (res.success) {
      if (test.expected) {
        isPassed = res.stdout.trim() === test.expected.trim() || res.stdout.includes(test.expected.trim());
      } else {
        isPassed = true;
      }
    }

    if (isPassed) passedCount++;

    results.push({
      name: test.name || 'Test Case',
      stdin: input,
      expected: test.expected || test.expectedBehavior || 'Valid execution without runtime error',
      actual: res.stdout || res.compile_output || res.stderr || 'No output produced',
      passed: isPassed,
      time: res.time,
      memory: res.memory,
      status: res.status,
      error: !res.success ? (res.compile_output || res.stderr) : null
    });
  }

  return {
    totalTests: testCases.length,
    passedTests: passedCount,
    results
  };
}

/**
 * Logs evaluation into localStorage and Supabase, and updates Weak-Topics Memory
 */
export async function recordBugsyEvaluation({
  question,
  userCode,
  timeTakenSeconds = 0,
  testSummary,
  styleReport,
  user
}) {
  const qid = question.id;
  const topic = question.tags?.[0] || question.subcategoryId || 'General PF';
  const categoryId = question.categoryId || 'pf-lab';
  const subcategoryId = question.subcategoryId || 'pf-topic';

  const evalRecord = {
    id: `eval_${Date.now()}`,
    questionId: qid,
    questionTitle: question.title,
    topic,
    categoryId,
    subcategoryId,
    timeTakenSeconds,
    testsPassed: testSummary?.passedTests || 0,
    testsTotal: testSummary?.totalTests || 1,
    styleScore: styleReport?.score || 100,
    isBeginnerCompliant: styleReport?.isBeginnerCompliant ?? true,
    violationsCount: styleReport?.violations?.length || 0,
    timestamp: new Date().toISOString()
  };

  // 1. Save in localStorage evaluations history
  let allEvals = [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_EVALS_KEY);
    allEvals = raw ? JSON.parse(raw) : [];
  } catch (e) {}

  allEvals.unshift(evalRecord);
  if (allEvals.length > 100) allEvals = allEvals.slice(0, 100);

  try {
    localStorage.setItem(LOCAL_STORAGE_EVALS_KEY, JSON.stringify(allEvals));
  } catch (e) {}

  // 2. Update Aggregated Topic Stats & Weak Topics Memory
  updateBugsyTopicStats(allEvals);

  // 3. Save to Supabase if authenticated
  if (user && !user.id?.startsWith('guest_')) {
    try {
      await supabase.from('bugsy_evaluations').insert({
        user_id: user.id,
        question_id: qid,
        topic,
        time_taken_seconds: timeTakenSeconds,
        tests_passed: evalRecord.testsPassed,
        tests_total: evalRecord.testsTotal,
        style_score: evalRecord.styleScore,
        critique: styleReport?.critique || '',
        created_at: evalRecord.timestamp
      });
    } catch (err) {
      console.warn('Remote Bugsy eval sync skipped (offline or table pending):', err);
    }
  }

  return evalRecord;
}

/**
 * Computes topic statistics and flags Weak Topics
 */
function updateBugsyTopicStats(allEvals) {
  const statsMap = {};

  for (const ev of allEvals) {
    const top = ev.topic || 'General PF';
    if (!statsMap[top]) {
      statsMap[top] = {
        topic: top,
        attempts: 0,
        solves: 0,
        totalTime: 0,
        totalStyleScore: 0,
        failedTestsCount: 0
      };
    }

    const s = statsMap[top];
    s.attempts++;
    if (ev.testsPassed === ev.testsTotal && ev.testsTotal > 0) {
      s.solves++;
    }
    s.totalTime += ev.timeTakenSeconds || 0;
    s.totalStyleScore += ev.styleScore || 0;
    s.failedTestsCount += (ev.testsTotal - ev.testsPassed);
  }

  const topicSummary = Object.values(statsMap).map(s => {
    const avgTime = Math.round(s.totalTime / s.attempts);
    const avgStyle = Math.round(s.totalStyleScore / s.attempts);
    const successRate = Math.round((s.solves / s.attempts) * 100);
    // Topic is considered weak if success rate < 60% with >= 1 attempt, or multiple failed tests
    const isWeak = (successRate < 60 && s.attempts >= 1) || (avgStyle < 65) || (s.failedTestsCount >= 2);

    return {
      topic: s.topic,
      attempts: s.attempts,
      solves: s.solves,
      successRate,
      avgTime,
      avgStyle,
      isWeak
    };
  });

  try {
    localStorage.setItem(LOCAL_STORAGE_TOPIC_STATS_KEY, JSON.stringify(topicSummary));
  } catch (e) {}

  return topicSummary;
}

/**
 * Gets the current weak topics and diagnostics summary
 */
export function getBugsyAnalytics() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TOPIC_STATS_KEY);
    const topicSummary = raw ? JSON.parse(raw) : [];

    const rawEvals = localStorage.getItem(LOCAL_STORAGE_EVALS_KEY);
    const recentEvals = rawEvals ? JSON.parse(rawEvals) : [];

    const weakTopics = topicSummary.filter(t => t.isWeak);
    const strongTopics = topicSummary.filter(t => !t.isWeak);

    return {
      totalEvaluations: recentEvals.length,
      weakTopics,
      strongTopics,
      recentEvals: recentEvals.slice(0, 10),
      topicSummary
    };
  } catch (e) {
    return {
      totalEvaluations: 0,
      weakTopics: [],
      strongTopics: [],
      recentEvals: [],
      topicSummary: []
    };
  }
}
