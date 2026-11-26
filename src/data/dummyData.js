// Comprehensive academic question dataset with questions categorized by type:
// Question types:
// 1. 'dry_run'     -> Trace the code and enter exact output (number or string)
// 2. 'code_submit' -> Logic building: user enters C/C++ code and Judge0 compiles and executes it
// 3. 'math_input'  -> Calculus problem where answer is just an integer (e.g., limit value)
// 4. 'math_study'  -> Conceptual / derivation problem where user can view, mark as done, copy statement, ask AI, or bookmark

export const subjects = [
  {
    id: 'pf',
    name: 'Programming Fundamentals',
    shortName: 'PF',
    description: 'C/C++ fundamentals, dry runs, control flow, memory tracing, and online compiled logic building',
    categories: [
      {
        id: 'dry-runs',
        name: 'Dry Runs',
        subcategories: [
          { id: 'math', name: 'Math Operations' },
          { id: 'bitwise', name: 'Bitwise Operations' },
          { id: 'loops', name: 'Loops & Iteration' },
          { id: 'arrays', name: 'Arrays & Strings' },
          { id: 'pointers', name: 'Pointers & Memory' },
          { id: 'recursion', name: 'Recursion' },
          { id: 'functions', name: 'Functions & Scope' },
        ],
      },
      {
        id: 'logic-building',
        name: 'Logic Building',
        subcategories: [
          { id: 'patterns', name: 'Pattern Printing' },
          { id: 'sorting', name: 'Sorting Algorithms' },
          { id: 'searching', name: 'Searching Algorithms' },
        ],
      },
      {
        id: 'bug-hunting',
        name: 'Bug Hunting',
        subcategories: [
          { id: 'syntax', name: 'Syntax Errors' },
          { id: 'logical', name: 'Logical Errors' },
          { id: 'runtime', name: 'Runtime Errors' },
        ],
      },
    ],
  },
  {
    id: 'calculus',
    name: 'Calculus',
    shortName: 'CALC',
    description: 'Limits, derivatives, integrals with LaTeX expressions, numeric inputs, and conceptual review cards',
    categories: [
      {
        id: 'limits',
        name: 'Limits',
        subcategories: [
          { id: 'basic-limits', name: 'Basic Limits' },
          { id: 'lhopital', name: "L'Hopital's Rule" },
        ],
      },
      {
        id: 'derivatives',
        name: 'Derivatives',
        subcategories: [
          { id: 'basic-diff', name: 'Basic Differentiation' },
          { id: 'chain-rule', name: 'Chain Rule' },
        ],
      },
      {
        id: 'integrals',
        name: 'Integrals',
        subcategories: [
          { id: 'basic-int', name: 'Basic Integration' },
          { id: 'substitution', name: 'Substitution' },
        ],
      },
    ],
  },
  {
    id: 'physics',
    name: 'Applied Physics',
    shortName: 'PHY',
    description: 'Mechanics, oscillations, and wave equations with numerical inputs and conceptual study checkpoints',
    categories: [
      {
        id: 'mechanics',
        name: 'Mechanics',
        subcategories: [
          { id: 'kinematics', name: 'Kinematics' },
          { id: 'dynamics', name: 'Dynamics' },
        ],
      },
      {
        id: 'waves',
        name: 'Waves & Oscillations',
        subcategories: [
          { id: 'shm', name: 'Simple Harmonic Motion' },
          { id: 'wave-eq', name: 'Wave Equations' },
        ],
      },
    ],
  },
];

export const questions = [
  // ==========================================
  // PROGRAMMING FUNDAMENTALS - DRY RUNS
  // ==========================================
  {
    id: 'pf-math-001',
    type: 'dry_run',
    subjectId: 'pf',
    categoryId: 'dry-runs',
    subcategoryId: 'math',
    title: 'Integer Division & Modulus',
    difficulty: 'easy',
    code: `#include <stdio.h>\n\nint main() {\n    int a = 17, b = 5;\n    int q = a / b;\n    int r = a % b;\n    printf("%d %d", q, r);\n    return 0;\n}`,
    expectedOutput: '3 2',
    explanation: 'Integer division 17 / 5 = 3 (truncated towards zero in C). Modulus 17 % 5 = 2 (remainder).',
    tags: ['division', 'modulus', 'arithmetic'],
    hints: ['Integer division truncates decimal parts in C', 'Modulus operator % yields the remainder'],
  },
  {
    id: 'pf-math-002',
    type: 'dry_run',
    subjectId: 'pf',
    categoryId: 'dry-runs',
    subcategoryId: 'math',
    title: 'Pre and Post Increment Sequence',
    difficulty: 'medium',
    code: `#include <stdio.h>\n\nint main() {\n    int x = 5;\n    int y = x++ + ++x;\n    printf("%d %d", x, y);\n    return 0;\n}`,
    expectedOutput: '7 12',
    explanation: 'Post-increment uses 5 then updates x to 6. Pre-increment increments x to 7 and uses 7. y = 5 + 7 = 12. Final x = 7.',
    tags: ['increment', 'operators', 'evaluation'],
    hints: ['Post-increment evaluates before incrementing', 'Pre-increment increments before evaluation'],
  },
  {
    id: 'pf-math-003',
    type: 'dry_run',
    subjectId: 'pf',
    categoryId: 'dry-runs',
    subcategoryId: 'math',
    title: 'Explicit Type Casting',
    difficulty: 'easy',
    code: `#include <stdio.h>\n\nint main() {\n    int a = 10, b = 3;\n    float c = (float)a / b;\n    float d = a / b;\n    printf("%.2f %.2f", c, d);\n    return 0;\n}`,
    expectedOutput: '3.33 3.00',
    explanation: 'Casting a to float forces floating-point division (3.33). Without cast, integer division produces 3.00.',
    tags: ['casting', 'floating-point', 'division'],
    hints: ['Casting one operand promotes the entire division to float', 'Integer division truncates prior to assignment'],
  },
  {
    id: 'pf-math-004',
    type: 'dry_run',
    subjectId: 'pf',
    categoryId: 'dry-runs',
    subcategoryId: 'math',
    title: 'Compound Assignment Sequence',
    difficulty: 'easy',
    code: `#include <stdio.h>\n\nint main() {\n    int x = 10;\n    x += 5;\n    x -= 3;\n    x *= 2;\n    x /= 4;\n    printf("%d", x);\n    return 0;\n}`,
    expectedOutput: '6',
    explanation: 'Step 1: 10 + 5 = 15. Step 2: 15 - 3 = 12. Step 3: 12 * 2 = 24. Step 4: 24 / 4 = 6.',
    tags: ['operators', 'assignment', 'arithmetic'],
    hints: ['Trace the modifications to variable x line by line'],
  },

  // Bitwise Operations
  {
    id: 'pf-bitwise-001',
    type: 'dry_run',
    subjectId: 'pf',
    categoryId: 'dry-runs',
    subcategoryId: 'bitwise',
    title: 'Basic Bitwise AND, OR, XOR',
    difficulty: 'easy',
    code: `#include <stdio.h>\n\nint main() {\n    int a = 12, b = 10;\n    printf("%d %d %d", a & b, a | b, a ^ b);\n    return 0;\n}`,
    expectedOutput: '8 14 6',
    explanation: '12 in binary is 1100, 10 is 1010. AND = 1000 (8), OR = 1110 (14), XOR = 0110 (6).',
    tags: ['bitwise', 'and', 'or', 'xor'],
    hints: ['Convert 12 and 10 to 4-bit binary representations', 'Perform column-wise logical operations'],
  },
  {
    id: 'pf-bitwise-002',
    type: 'dry_run',
    subjectId: 'pf',
    categoryId: 'dry-runs',
    subcategoryId: 'bitwise',
    title: 'Bitwise Shift Operators',
    difficulty: 'medium',
    code: `#include <stdio.h>\n\nint main() {\n    int x = 5;\n    printf("%d %d", x << 2, x >> 1);\n    return 0;\n}`,
    expectedOutput: '20 2',
    explanation: '5 << 2 = 5 * 2^2 = 20. 5 >> 1 = floor(5 / 2) = 2.',
    tags: ['bitwise', 'shift', 'multiplication'],
    hints: ['Left shifting by N multiplies by 2^N', 'Right shifting by N divides by 2^N'],
  },
  {
    id: 'pf-bitwise-003',
    type: 'dry_run',
    subjectId: 'pf',
    categoryId: 'dry-runs',
    subcategoryId: 'bitwise',
    title: "Bitwise NOT & Two's Complement",
    difficulty: 'hard',
    code: `#include <stdio.h>\n\nint main() {\n    int a = 5;\n    printf("%d", ~a);\n    return 0;\n}`,
    expectedOutput: '-6',
    explanation: 'Bitwise NOT flips all bits. In two complement signed arithmetic, ~a = -(a + 1). So ~5 = -6.',
    tags: ['bitwise', 'not', 'twos-complement'],
    hints: ['Bitwise NOT inverts all bits', 'In signed integer representation, ~x equals -(x + 1)'],
  },

  // Loops & Pointers
  {
    id: 'pf-loops-001',
    type: 'dry_run',
    subjectId: 'pf',
    categoryId: 'dry-runs',
    subcategoryId: 'loops',
    title: 'Accumulator For Loop',
    difficulty: 'easy',
    code: `#include <stdio.h>\n\nint main() {\n    int sum = 0;\n    for(int i = 1; i <= 5; i++) {\n        sum += i;\n    }\n    printf("%d", sum);\n    return 0;\n}`,
    expectedOutput: '15',
    explanation: 'Sum = 1 + 2 + 3 + 4 + 5 = 15.',
    tags: ['loops', 'for-loop', 'accumulator'],
    hints: ['Compute the arithmetic sum from 1 to 5'],
  },
  {
    id: 'pf-loops-002',
    type: 'dry_run',
    subjectId: 'pf',
    categoryId: 'dry-runs',
    subcategoryId: 'loops',
    title: 'Nested Pattern Loop',
    difficulty: 'medium',
    code: `#include <stdio.h>\n\nint main() {\n    for(int i = 0; i < 3; i++) {\n        for(int j = 0; j <= i; j++) {\n            printf("*");\n        }\n        printf("\\n");\n    }\n    return 0;\n}`,
    expectedOutput: '*\n**\n***',
    explanation: 'Row 0: 1 star. Row 1: 2 stars. Row 2: 3 stars. Followed by line breaks.',
    tags: ['nested-loops', 'patterns'],
    hints: ['Outer loop controls line index', 'Inner loop prints i + 1 asterisks on row i'],
  },
  {
    id: 'pf-pointers-001',
    type: 'dry_run',
    subjectId: 'pf',
    categoryId: 'dry-runs',
    subcategoryId: 'pointers',
    title: 'Pointer Dereferencing & Mutation',
    difficulty: 'easy',
    code: `#include <stdio.h>\n\nint main() {\n    int x = 42;\n    int *p = &x;\n    *p = 100;\n    printf("%d %d", x, *p);\n    return 0;\n}`,
    expectedOutput: '100 100',
    explanation: 'Pointer p references x. Assigning 100 to *p modifies x directly. Both x and *p output 100.',
    tags: ['pointers', 'memory', 'dereference'],
    hints: ['*p accesses the actual memory location of x'],
    visualization: {
      type: 'mermaid',
      title: 'Stack Memory & Pointer Reference Diagram',
      content: `graph LR
    subgraph Stack["Stack Frame (main)"]
      x["Variable x (addr: 0x7ffd10)<br/>Value: 100"]
      p["Pointer p (addr: 0x7ffd18)<br/>Stores: 0x7ffd10"]
    end
    p -. "*p dereference" .-> x
    style x fill:#161b22,stroke:#3fb950,stroke-width:2px,color:#f0f6fc
    style p fill:#161b22,stroke:#58a6ff,stroke-width:2px,color:#f0f6fc`,
      caption: 'Visualizing how *p dereferences the address 0x7ffd10 and modifies the memory cell of x.',
    },
  },
  {
    id: 'pf-recursion-001',
    type: 'dry_run',
    subjectId: 'pf',
    categoryId: 'dry-runs',
    subcategoryId: 'recursion',
    title: 'Recursive Factorial Evaluation',
    difficulty: 'medium',
    code: `#include <stdio.h>\n\nint fact(int n) {\n    if (n <= 1) return 1;\n    return n * fact(n - 1);\n}\n\nint main() {\n    printf("%d", fact(5));\n    return 0;\n}`,
    expectedOutput: '120',
    explanation: 'fact(5) = 5 * 4 * 3 * 2 * 1 = 120.',
    tags: ['recursion', 'call-stack', 'factorial'],
    hints: ['Trace call tree: 5 * 24 = 120'],
    visualization: {
      type: 'mermaid',
      title: 'Recursive Call Stack Tree & Return Unwinding',
      content: `graph TD
    A["fact(5) = 5 * fact(4)"] --> B["fact(4) = 4 * fact(3)"]
    B --> C["fact(3) = 3 * fact(2)"]
    C --> D["fact(2) = 2 * fact(1)"]
    D --> E["fact(1) returns 1 (Base Case)"]
    E -. "returns 1" .-> D
    D -. "returns 2" .-> C
    C -. "returns 6" .-> B
    B -. "returns 24" .-> A
    A -. "returns 120" .-> RES["Output: 120"]
    style E fill:#161b22,stroke:#d29922,stroke-width:2px,color:#f0f6fc
    style RES fill:#161b22,stroke:#3fb950,stroke-width:2px,color:#f0f6fc`,
      caption: 'Visualization of the recursive activation tree, descending down to base case n=1 and unwinding back up.',
    },
  },

  // ==========================================
  // LOGIC BUILDING - CODE SUBMISSION VIA JUDGE0
  // ==========================================
  {
    id: 'pf-patterns-001',
    type: 'code_submit',
    subjectId: 'pf',
    categoryId: 'logic-building',
    subcategoryId: 'patterns',
    title: 'Implement Right-Angled Number Triangle',
    difficulty: 'medium',
    starterCode: `#include <stdio.h>\n\n// Write a program that prints a 3-row number triangle:\n// 1\n// 12\n// 123\n\nint main() {\n    // Write your nested loop here\n    \n    return 0;\n}`,
    expectedOutput: '1\n12\n123',
    description: 'Write complete, compilable C code that prints the following pattern:\n\n1\n12\n123\n\nYour code will be compiled and evaluated using an online C compiler.',
    explanation: 'A nested loop where the outer loop iterates rows from 1 to 3, and inner loop prints column j from 1 to i.',
    tags: ['patterns', 'compilation', 'nested-loops'],
    hints: ['Outer loop runs from i = 1 to 3', 'Inner loop runs from j = 1 to i, printing j'],
  },
  {
    id: 'pf-sorting-001',
    type: 'code_submit',
    subjectId: 'pf',
    categoryId: 'logic-building',
    subcategoryId: 'sorting',
    title: 'Implement Bubble Sort Step',
    difficulty: 'hard',
    starterCode: `#include <stdio.h>\n\n// Complete this program to sort the array and print the elements separated by space:\n\nint main() {\n    int arr[] = {5, 2, 8, 1, 3};\n    int n = 5;\n    \n    // Implement sorting algorithm here\n    \n    for(int i = 0; i < n; i++) {\n        printf("%d%s", arr[i], i == n - 1 ? "" : " ");\n    }\n    return 0;\n}`,
    expectedOutput: '1 2 3 5 8',
    description: 'Implement a sorting routine (bubble sort or selection sort) in C. Output the sorted array separated by spaces.',
    explanation: 'Nested loops compare adjacent elements and swap if out of order until the entire array is sorted.',
    tags: ['sorting', 'algorithm', 'compilation'],
    hints: ['Use two nested loops to iterate through array elements', 'Swap arr[j] and arr[j+1] if arr[j] > arr[j+1]'],
  },
  {
    id: 'pf-syntax-001',
    type: 'dry_run',
    subjectId: 'pf',
    categoryId: 'bug-hunting',
    subcategoryId: 'syntax',
    title: 'Missing Statement Semicolons',
    difficulty: 'easy',
    code: `#include <stdio.h>\n\nint main() {\n    int x = 10\n    printf("%d", x)\n    return 0;\n}`,
    expectedOutput: 'Missing semicolons on lines 4 and 5',
    explanation: 'Statements in C require terminating semicolons at the end of declarations and function calls.',
    tags: ['syntax-error', 'c-grammar'],
    hints: ['Check line terminations'],
  },

  // ==========================================
  // CALCULUS - (NUMERIC INTEGER INPUT & STUDY CHECKPOINT)
  // ==========================================
  {
    id: 'calc-limits-001',
    type: 'math_input', // Just integer as input
    subjectId: 'calculus',
    categoryId: 'limits',
    subcategoryId: 'basic-limits',
    title: 'Direct Limit Substitution',
    difficulty: 'easy',
    latexExpression: '\\lim_{x \\to 3} \\left( x^2 + 2x - 1 \\right)',
    expectedOutput: '14', // Exact integer match
    statement: 'Evaluate the limit as x approaches 3:',
    explanation: 'Direct substitution yields: $3^2 + 2(3) - 1 = 9 + 6 - 1 = 14$.',
    tags: ['limits', 'polynomial', 'integer-answer'],
    hints: ['Substitute x = 3 directly into the polynomial expression'],
  },
  {
    id: 'calc-limits-002',
    type: 'math_input', // Just integer as input
    subjectId: 'calculus',
    categoryId: 'limits',
    subcategoryId: 'basic-limits',
    title: 'Difference of Squares Limit',
    difficulty: 'medium',
    latexExpression: '\\lim_{x \\to 2} \\frac{x^2 - 4}{x - 2}',
    expectedOutput: '4', // Exact integer match
    statement: 'Calculate the value of the algebraic limit:',
    explanation: 'Factor numerator as $(x - 2)(x + 2)$. Cancel $(x - 2)$. Then evaluate $2 + 2 = 4$.',
    tags: ['limits', 'factoring', 'integer-answer'],
    hints: ['Factor the numerator: $x^2 - 4 = (x - 2)(x + 2)$', 'Cancel the common factor before substituting'],
    visualization: {
      type: 'latex',
      title: 'Algebraic Simplification & Limit Evaluation Steps',
      content: '\\begin{aligned} \\lim_{x \\to 2} \\frac{x^2 - 4}{x - 2} &= \\lim_{x \\to 2} \\frac{(x - 2)(x + 2)}{x - 2} \\\\[6pt] &= \\lim_{x \\to 2} (x + 2) \\\\[6pt] &= 2 + 2 = \\mathbf{4} \\end{aligned}',
      caption: 'Visualizing difference of squares cancellation to remove the 0/0 removable discontinuity at x = 2.',
    },
  },
  {
    id: 'calc-limits-003',
    type: 'math_study', // Look at question, tick done/not, copy statement, ask AI, bookmark
    subjectId: 'calculus',
    categoryId: 'limits',
    subcategoryId: 'lhopital',
    title: "L'Hopital's Rule for Indeterminate Forms",
    difficulty: 'medium',
    latexExpression: '\\lim_{x \\to 0} \\frac{\\sin(3x)}{x} = \\lim_{x \\to 0} \\frac{\\frac{d}{dx}[\\sin(3x)]}{\\frac{d}{dx}[x]} = \\lim_{x \\to 0} \\frac{3\\cos(3x)}{1} = 3',
    statement: "Study the standard derivation of L'Hopital's Rule for the 0/0 indeterminate trigonometric limit:",
    explanation: "Because evaluating at $x = 0$ results in the indeterminate form $\\frac{0}{0}$, differentiate numerator and denominator independently with respect to $x$.",
    tags: ['lhopital', 'derivation', 'study-card'],
    hints: ['Verify the indeterminate form 0/0 first', 'Differentiate numerator and denominator separately'],
  },
  {
    id: 'calc-diff-001',
    type: 'math_study',
    subjectId: 'calculus',
    categoryId: 'derivatives',
    subcategoryId: 'chain-rule',
    title: 'Chain Rule Composite Function Theorem',
    difficulty: 'easy',
    latexExpression: '\\frac{d}{dx}\\left[ f(g(x)) \\right] = f\'(g(x)) \\cdot g\'(x)',
    statement: 'Review the composite differentiation formula:',
    explanation: 'The derivative of $f(g(x))$ is the derivative of the outer function evaluated at the inner function times the derivative of the inner function.',
    tags: ['derivatives', 'chain-rule', 'theorem'],
    hints: ['Identify inner function u = g(x)', 'Compute dy/dx = (dy/du) * (du/dx)'],
  },

  // ==========================================
  // APPLIED PHYSICS - NUMERICAL & CONCEPTUAL
  // ==========================================
  {
    id: 'phy-kin-001',
    type: 'math_input',
    subjectId: 'physics',
    categoryId: 'mechanics',
    subcategoryId: 'kinematics',
    title: 'Free Fall Displacement Calculation',
    difficulty: 'easy',
    latexExpression: 's = ut + \\frac{1}{2}gt^2',
    statement: 'A ball is dropped from rest ($u = 0$) under gravity ($g = 10\\text{ m/s}^2$). Find the displacement in meters after $t = 3\\text{ s}$. Enter integer answer only:',
    expectedOutput: '45',
    explanation: 'Since $u = 0$, $s = \\frac{1}{2}(10)(3^2) = 5 \\times 9 = 45\\text{ meters}$.',
    tags: ['physics', 'kinematics', 'integer-answer'],
    hints: ['Initial velocity u = 0', 'Compute s = 0.5 * 10 * 9'],
  },
  {
    id: 'phy-shm-001',
    type: 'math_study',
    subjectId: 'physics',
    categoryId: 'waves',
    subcategoryId: 'shm',
    title: 'Simple Harmonic Motion Differential Equation',
    difficulty: 'medium',
    latexExpression: '\\frac{d^2 x}{dt^2} + \\omega^2 x = 0 \\quad \\implies \\quad x(t) = A\\cos(\\omega t + \\phi)',
    statement: 'Study the standard equation of motion for a simple harmonic oscillator:',
    explanation: 'The acceleration is directly proportional to the displacement and directed towards the equilibrium position.',
    tags: ['oscillations', 'shm', 'study-card'],
    hints: ['Recall Hooke\'s law F = -kx', 'Omega is the angular frequency sqrt(k/m)'],
  },
];

export const comments = [
  {
    id: 'c1',
    questionId: 'pf-math-001',
    userId: 'u_101',
    username: 'student_fast',
    content: 'Integer division in C always truncates toward zero.',
    createdAt: '2026-10-15T10:30:00Z',
    likes: 5,
  },
  {
    id: 'c2',
    questionId: 'calc-limits-001',
    userId: 'u_102',
    username: 'calculus_pro',
    content: 'Because this polynomial is continuous everywhere, direct substitution is sufficient.',
    createdAt: '2026-10-16T14:20:00Z',
    likes: 8,
  },
];

export const getQuestionsByFilter = (subjectId, categoryId, subcategoryId) => {
  return questions.filter(
    (q) =>
      (!subjectId || q.subjectId === subjectId) &&
      (!categoryId || q.categoryId === categoryId) &&
      (!subcategoryId || q.subcategoryId === subcategoryId)
  );
};

export const getQuestionById = (id) => {
  return questions.find((q) => q.id === id);
};

export const getCommentsByQuestionId = (questionId) => {
  return comments.filter((c) => c.questionId === questionId);
};
