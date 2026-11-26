import fs from 'fs';
import path from 'path';

const cleanJson = (p) => {
  let s = fs.readFileSync(p, 'utf8');
  s = s.replace(/```.*$/s, '').trim();
  const lastBracket = s.lastIndexOf('}');
  if (lastBracket !== -1) s = s.substring(0, lastBracket + 1);
  return JSON.parse(s);
};

// 1. Read source data
const finalExamData = cleanJson('NEW Data/LAB-Tasks.json'); // Contains the 15 final exam questions
const lab10Data = cleanJson('NEW Data/PF-final.json');      // Contains the 8 lab 10 questions

// 2. Define PF subject structure
const pfSubject = {
  id: "pf",
  name: "Programming Fundamentals",
  shortName: "PF",
  description: "C/C++ fundamentals, logic building, nested loops, arrays, strings, and live compilation with Judge0 & Bugsy AI",
  categories: [
    {
      id: "lab10-tasks",
      name: "Lab 10 Tasks",
      subcategories: [
        { id: "nested-loops", name: "Nested Loops & Calculations" },
        { id: "patterns", name: "Pattern Printing" },
        { id: "control-flow", name: "Loops & Flow Control" },
        { id: "arrays", name: "1D Arrays & Algorithms" }
      ]
    },
    {
      id: "final-exam",
      name: "Final Exam Tasks",
      subcategories: [
        { id: "code-tracing", name: "Output & Code Tracing" },
        { id: "arrays-matrices", name: "2D Arrays & Matrices" },
        { id: "strings-chars", name: "Character Arrays & Strings" },
        { id: "system-design", name: "Systems & Logic Refactoring" }
      ]
    }
  ]
};

// Clean out existing directories in src/data/content/pf except subject.json
const pfContentDir = path.resolve('src/data/content/pf');
if (fs.existsSync(pfContentDir)) {
  const entries = fs.readdirSync(pfContentDir);
  for (const entry of entries) {
    const full = path.join(pfContentDir, entry);
    if (fs.statSync(full).isDirectory()) {
      fs.rmSync(full, { recursive: true, force: true });
    }
  }
}

// Helper to ensure dir exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// 3. Transform Lab 10 Questions
const lab10Questions = {
  'nested-loops': [],
  'patterns': [],
  'control-flow': [],
  'arrays': []
};

for (const q of lab10Data.questions) {
  const qid = q.question_unique_id;
  let subcat = 'nested-loops';
  let title = 'Lab 10 Task';
  let diff = 'medium';
  let starterCode = '';
  let expOut = q.sample_outputs && q.sample_outputs[0] ? q.sample_outputs[0] : '';

  if (qid === 'FAST_CL1002_F26_LAB10_P1') {
    subcat = 'nested-loops';
    title = 'Student Results & Grading System';
    diff = 'hard';
    starterCode = `#include <iostream>
using namespace std;

// Analyze results of 5 students, each having marks in 3 subjects.
// Outer loop for students, inner loop for subjects.
// Grade scale: 80-100: A, 70-79: B, 60-69: C, 50-59: D, <50: F.
// Display marks, grades, total/300, percentage, and Pass/Fail (all >= 50).

int main() {
    const int NUM_STUDENTS = 5;
    const int NUM_SUBJECTS = 3;

    for (int i = 1; i <= NUM_STUDENTS; i++) {
        int total = 0;
        bool allPass = true;
        cout << "--- Student " << i << " ---" << endl;

        for (int j = 1; j <= NUM_SUBJECTS; j++) {
            int marks;
            cout << "Enter marks for Subject " << j << " (0-100): ";
            cin >> marks;

            while (marks < 0 || marks > 100) {
                cout << "Invalid marks! Re-enter (0-100): ";
                cin >> marks;
            }

            total += marks;
            if (marks < 50) allPass = false;

            char grade;
            if (marks >= 80) grade = 'A';
            else if (marks >= 70) grade = 'B';
            else if (marks >= 60) grade = 'C';
            else if (marks >= 50) grade = 'D';
            else grade = 'F';

            cout << "Subject " << j << " Grade: " << grade << endl;
        }

        float percentage = (total / 300.0f) * 100.0f;
        cout << "Total: " << total << "/300 | Percentage: " << percentage << "%" << endl;
        cout << "Status: " << (allPass ? "PASS" : "FAIL") << endl << endl;
    }
    return 0;
}`;
  } else if (qid === 'FAST_CL1002_F26_LAB10_P2') {
    subcat = 'nested-loops';
    title = 'Cafeteria Billing System';
    diff = 'medium';
    starterCode = `#include <iostream>
using namespace std;

// 4 customers, each purchasing 3 items. Reject prices <= 0.
// Subtotal >= 5000: 15% discount with card, 10% without.
// Subtotal < 5000: 5% discount with card, 0% without.
// Display subtotal, discount, final bill per customer and grand total revenue.

int main() {
    const int CUSTOMERS = 4;
    const int ITEMS = 3;
    double grandTotalRevenue = 0.0;

    for (int c = 1; c <= CUSTOMERS; c++) {
        double subtotal = 0.0;
        cout << "Customer " << c << ":" << endl;
        for (int i = 1; i <= ITEMS; i++) {
            double price;
            cout << "Enter item " << i << " price: ";
            cin >> price;
            while (price <= 0) {
                cout << "Price must be positive! Re-enter: ";
                cin >> price;
            }
            subtotal += price;
        }

        char hasCard;
        cout << "Do you have a membership card? (y/n): ";
        cin >> hasCard;

        double discountRate = 0.0;
        if (subtotal >= 5000) {
            discountRate = (hasCard == 'y' || hasCard == 'Y') ? 0.15 : 0.10;
        } else {
            discountRate = (hasCard == 'y' || hasCard == 'Y') ? 0.05 : 0.00;
        }

        double discountAmount = subtotal * discountRate;
        double finalBill = subtotal - discountAmount;
        grandTotalRevenue += finalBill;

        cout << "Subtotal: Rs. " << subtotal << " | Discount: Rs. " << discountAmount << " | Final Bill: Rs. " << finalBill << endl << endl;
    }

    cout << "Total Revenue Collected: Rs. " << grandTotalRevenue << endl;
    return 0;
}`;
  } else if (qid === 'FAST_CL1002_F26_LAB10_P3') {
    subcat = 'patterns';
    title = 'Centered Star Pyramid Pattern';
    diff = 'easy';
    expOut = '    *\n   ***\n  *****\n *******\n*********';
    starterCode = `#include <iostream>
using namespace std;

// Input a positive integer N and print a centered star pyramid.
// Outer loop for rows, inner loops for leading spaces and stars.
// Row 1 has 1 star, subsequent rows increase by 2 stars. Last row has 2N-1 stars.

int main() {
    int n = 5;
    // cin >> n;

    for (int i = 1; i <= n; i++) {
        // Leading spaces
        for (int s = 1; s <= n - i; s++) {
            cout << " ";
        }
        // Stars (2*i - 1)
        for (int k = 1; k <= (2 * i - 1); k++) {
            cout << "*";
        }
        cout << endl;
    }
    return 0;
}`;
  } else if (qid === 'FAST_CL1002_F26_LAB10_P4') {
    subcat = 'patterns';
    title = 'Square Border & Diagonals Pattern';
    diff = 'medium';
    expOut = '*****\n** **\n* * *\n** **\n*****';
    starterCode = `#include <iostream>
using namespace std;

// Input integer N (>= 3). Print N x N square pattern.
// Border (row 0, row N-1, col 0, col N-1) or diagonals (row == col || row + col == N - 1) get '*'.
// Other positions get a space ' '.

int main() {
    int n = 5;
    // cin >> n;
    if (n < 3) {
        cout << "Error: N must be at least 3" << endl;
        return 0;
    }

    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            if (i == 0 || i == n - 1 || j == 0 || j == n - 1 || i == j || i + j == n - 1) {
                cout << "*";
            } else {
                cout << " ";
            }
        }
        cout << endl;
    }
    return 0;
}`;
  } else if (qid === 'FAST_CL1002_F26_LAB10_P5') {
    subcat = 'control-flow';
    title = 'Electricity Consumption Monitor';
    diff = 'medium';
    starterCode = `#include <iostream>
using namespace std;

// Monitor daily household electricity consumption for up to 30 days using a while loop.
// Negative reading: print 'Invalid Reading' and skip with continue.
// Reading > 500: print 'Unusually High Consumption'.
// Reading == 0: terminate with break.
// Display count of valid readings and total consumption.

int main() {
    int validCount = 0;
    double totalUnits = 0.0;
    int day = 1;

    while (day <= 30) {
        double reading;
        cout << "Day " << day << " consumption (0 to stop): ";
        cin >> reading;

        if (reading == 0) {
            break;
        }
        if (reading < 0) {
            cout << "Invalid Reading" << endl;
            continue;
        }
        if (reading > 500) {
            cout << "Unusually High Consumption" << endl;
        }

        totalUnits += reading;
        validCount++;
        day++;
    }

    cout << "Valid readings recorded: " << validCount << endl;
    cout << "Total units consumed: " << totalUnits << endl;
    return 0;
}`;
  } else if (qid === 'FAST_CL1002_F26_LAB10_P6') {
    subcat = 'arrays';
    title = '1D Array Declaration & Traversal';
    diff = 'easy';
    expOut = '10 20 30 40 50';
    starterCode = `#include <iostream>
using namespace std;

// Declare an integer array int numbers[5], initialize it at declaration time,
// and display all elements in a single line using a loop.

int main() {
    int numbers[5] = {10, 20, 30, 40, 50};

    for (int i = 0; i < 5; i++) {
        cout << numbers[i] << (i < 4 ? " " : "");
    }
    cout << endl;
    return 0;
}`;
  } else if (qid === 'FAST_CL1002_F26_LAB10_P7') {
    subcat = 'arrays';
    title = 'Duplicate Roll Numbers Detection';
    diff = 'hard';
    expOut = 'Duplicate roll numbers:\n101\n102';
    starterCode = `#include <iostream>
using namespace std;

// Identify duplicate roll numbers among N students using a 1D integer array and nested loops.
// Print each duplicate roll number only once even if it appears more than twice.

int main() {
    int n;
    cout << "Enter number of students: ";
    cin >> n;

    if (n < 1 || n > 100) {
        cout << "Invalid student count!" << endl;
        return 0;
    }

    int roll[100];
    cout << "Enter roll numbers: ";
    for (int i = 0; i < n; i++) {
        cin >> roll[i];
    }

    cout << "Duplicate roll numbers:" << endl;
    bool foundAny = false;

    for (int i = 0; i < n; i++) {
        // Check if already printed earlier
        bool alreadySeen = false;
        for (int k = 0; k < i; k++) {
            if (roll[k] == roll[i]) {
                alreadySeen = true;
                break;
            }
        }
        if (alreadySeen) continue;

        // Check if appears later
        bool hasDuplicate = false;
        for (int j = i + 1; j < n; j++) {
            if (roll[j] == roll[i]) {
                hasDuplicate = true;
                break;
            }
        }

        if (hasDuplicate) {
            cout << roll[i] << endl;
            foundAny = true;
        }
    }

    if (!foundAny) {
        cout << "No duplicates found." << endl;
    }

    return 0;
}`;
  } else if (qid === 'FAST_CL1002_F26_LAB10_P8') {
    subcat = 'arrays';
    title = 'Quiz Mark Frequency & Mode Finder';
    diff = 'hard';
    expOut = 'Mark Frequency\n70\n3\n85\n3\n90\n1\n60\n1\nHighest frequency: 3\nMarks with highest frequency: 70, 85';
    starterCode = `#include <iostream>
using namespace std;

// Count how many times each distinct quiz mark appears for N students using a 1D array and nested loops.
// Display distinct mark & frequency, highest frequency, and all marks tied for it.

int main() {
    int n;
    cout << "Enter number of students: ";
    cin >> n;

    int marks[100];
    cout << "Enter marks: ";
    for (int i = 0; i < n; i++) {
        cin >> marks[i];
    }

    int distinctMarks[100];
    int frequencies[100];
    int distinctCount = 0;

    for (int i = 0; i < n; i++) {
        bool seen = false;
        for (int d = 0; d < distinctCount; d++) {
            if (distinctMarks[d] == marks[i]) {
                seen = true;
                break;
            }
        }
        if (seen) continue;

        int freq = 0;
        for (int j = 0; j < n; j++) {
            if (marks[j] == marks[i]) freq++;
        }

        distinctMarks[distinctCount] = marks[i];
        frequencies[distinctCount] = freq;
        distinctCount++;
    }

    cout << "Mark Frequency" << endl;
    int maxFreq = 0;
    for (int i = 0; i < distinctCount; i++) {
        cout << distinctMarks[i] << endl << frequencies[i] << endl;
        if (frequencies[i] > maxFreq) maxFreq = frequencies[i];
    }

    cout << "Highest frequency: " << maxFreq << endl;
    cout << "Marks with highest frequency: ";
    bool first = true;
    for (int i = 0; i < distinctCount; i++) {
        if (frequencies[i] == maxFreq) {
            if (!first) cout << ", ";
            cout << distinctMarks[i];
            first = false;
        }
    }
    cout << endl;

    return 0;
}`;
  }

  const newObj = {
    id: `pf-lab10-${qid.split('_').pop().toLowerCase()}`,
    type: 'code_submit',
    subjectId: 'pf',
    categoryId: 'lab10-tasks',
    subcategoryId: subcat,
    title: title,
    difficulty: diff,
    statement: q.problem_statement,
    starterCode: starterCode,
    expectedOutput: expOut,
    hints: [
      `Carefully review the requirements in ${qid}.`,
      'Use standard C++ PF-lab constructs (nested loops, basic arrays, no banned STL).'
    ],
    tags: q.subtopics || ['cpp', 'lab', 'loops']
  };

  lab10Questions[subcat].push(newObj);
}

// 4. Transform Final Exam Questions
const finalQuestions = {
  'code-tracing': [],
  'arrays-matrices': [],
  'strings-chars': [],
  'system-design': []
};

for (const q of finalExamData.questions) {
  const qid = q.question_unique_id;
  let subcat = 'code-tracing';
  let title = 'Final Exam Problem';
  let diff = 'medium';
  let starterCode = '';
  let expOut = q.sample_outputs && q.sample_outputs[0] ? q.sample_outputs[0] : '';

  if (qid.startsWith('FAST_CFD_PF_F23_FINAL_Q1')) {
    subcat = 'code-tracing';
    diff = 'easy';
    const letter = qid.replace('FAST_CFD_PF_F23_FINAL_Q1', '');
    const titles = {
      'A': 'Function Overloading Output Tracing',
      'B': 'Pass by Value & Scope Tracing',
      'C': 'Infinite For Loop & Break Tracing',
      'D': 'Nested Star Pattern Output Tracing',
      'E': 'Nested Ternary Operator Evaluation',
      'F': 'While Loop Decrement Floor Tracing',
      'G': 'Nested If-Else & Dangling Else Tracing',
      'H': 'Descending Bubble Sort Tracing'
    };
    title = titles[letter] || `Output Prediction Q1${letter}`;
    
    // Starter code encapsulates the exact snippet into compilable main so user can test and run
    let snippet = q.problem_statement;
    if (snippet.includes('Assuming there are no errors')) {
      snippet = snippet.split('write the output of the given code:\n\n')[1] || snippet;
    }
    if (!snippet.includes('#include')) {
      starterCode = `#include <iostream>\nusing namespace std;\n\n${snippet}`;
      if (!starterCode.includes('return 0;') && starterCode.includes('int main')) {
        starterCode = starterCode.replace(/}\s*$/, '    return 0;\n}');
      }
    } else {
      starterCode = snippet;
    }
  } else if (qid === 'FAST_CFD_PF_F23_FINAL_Q2') {
    subcat = 'system-design';
    title = 'Library Book Checkout System';
    diff = 'hard';
    starterCode = `#include <iostream>
#include <string>
using namespace std;

// Library Book Checkout System
// Manage 10 books (IDs 1-10, titles, availability: bool available[10]).
// Menu: 1. Display available books, 2. Check out a book, 3. Exit.
// Validate invalid IDs or already checked-out books.

int main() {
    const int TOTAL_BOOKS = 10;
    int bookIds[TOTAL_BOOKS];
    string bookTitles[TOTAL_BOOKS] = {
        "Book A", "Book B", "Book C", "Book D", "Book E",
        "Book F", "Book G", "Book H", "Book I", "Book J"
    };
    bool isAvailable[TOTAL_BOOKS];

    for (int i = 0; i < TOTAL_BOOKS; i++) {
        bookIds[i] = i + 1;
        isAvailable[i] = true;
    }

    cout << "Welcome to the Library Book Checkout System!" << endl;
    int choice = 0;

    while (choice != 3) {
        cout << "\\nMenu:" << endl;
        cout << "1. Display available books" << endl;
        cout << "2. Check out a book" << endl;
        cout << "3. Exit" << endl;
        cout << "Enter your choice: ";
        cin >> choice;

        if (choice == 1) {
            cout << "Available Books:" << endl;
            for (int i = 0; i < TOTAL_BOOKS; i++) {
                if (isAvailable[i]) {
                    cout << "ID: " << bookIds[i] << ", Title: \\"" << bookTitles[i] << "\\", Available: Yes" << endl;
                }
            }
        } else if (choice == 2) {
            int reqId;
            cout << "Enter the ID of the book you want to check out: ";
            cin >> reqId;

            if (reqId < 1 || reqId > TOTAL_BOOKS) {
                cout << "Invalid book ID!" << endl;
            } else if (!isAvailable[reqId - 1]) {
                cout << "Sorry, this book is already checked out." << endl;
            } else {
                isAvailable[reqId - 1] = false;
                cout << "Book with ID " << reqId << " has been checked out successfully." << endl;
            }
        } else if (choice == 3) {
            cout << "Exiting the program. Thank you!" << endl;
        } else {
            cout << "Invalid choice! Please select 1, 2, or 3." << endl;
        }
    }

    return 0;
}`;
  } else if (qid === 'FAST_CFD_PF_F23_FINAL_Q3A') {
    subcat = 'arrays-matrices';
    title = '2D Matrix Difference & Reverse Column Indexing';
    diff = 'hard';
    starterCode = `#include <iostream>
using namespace std;

// Three 2D arrays size N x M (constants N=3, M=4).
// Array1[r][c] = (r + c)^2.
// Array2 taken from user input.
// Array3 initialized with 0s.
// Array3[r][M - 1 - c] = Array1[r][c] - Array2[r][c].
// Print all three matrices without hardcoding.

int main() {
    const int N = 3;
    const int M = 4;

    int Array1[N][M];
    int Array2[N][M];
    int Array3[N][M] = {0};

    // Initialize Array1
    for (int r = 0; r < N; r++) {
        for (int c = 0; c < M; c++) {
            Array1[r][c] = (r + c) * (r + c);
        }
    }

    // Input Array2
    cout << "Enter " << (N * M) << " elements for Array2:" << endl;
    for (int r = 0; r < N; r++) {
        for (int c = 0; c < M; c++) {
            cin >> Array2[r][c];
        }
    }

    // Populate Array3 in reverse column order
    for (int r = 0; r < N; r++) {
        for (int c = 0; c < M; c++) {
            Array3[r][M - 1 - c] = Array1[r][c] - Array2[r][c];
        }
    }

    // Display Array1
    cout << "\\nArray1:" << endl;
    for (int r = 0; r < N; r++) {
        for (int c = 0; c < M; c++) cout << Array1[r][c] << " ";
        cout << endl;
    }

    // Display Array2
    cout << "\\nArray2:" << endl;
    for (int r = 0; r < N; r++) {
        for (int c = 0; c < M; c++) cout << Array2[r][c] << " ";
        cout << endl;
    }

    // Display Array3
    cout << "\\nArray3:" << endl;
    for (int r = 0; r < N; r++) {
        for (int c = 0; c < M; c++) cout << Array3[r][c] << " ";
        cout << endl;
    }

    return 0;
}`;
  } else if (qid === 'FAST_CFD_PF_F23_FINAL_Q3B') {
    subcat = 'strings-chars';
    title = 'C-String Subsequence Verification (No Built-ins)';
    diff = 'medium';
    starterCode = `#include <iostream>
using namespace std;

// Check whether word2 is a subsequence of word1.
// Do not use any built-in functions (<cstring> / <string> methods banned).
// Both word1 and word2 are char arrays of max size 100.

bool isSubsequence(const char word1[], const char word2[]) {
    int i = 0; // index for word1
    int j = 0; // index for word2

    while (word1[i] != '\\0' && word2[j] != '\\0') {
        if (word1[i] == word2[j]) {
            j++;
        }
        i++;
    }

    return (word2[j] == '\\0');
}

int main() {
    char word1[100];
    char word2[100];

    cout << "Enter word1: ";
    cin >> word1;
    cout << "Enter word2: ";
    cin >> word2;

    if (isSubsequence(word1, word2)) {
        cout << "Yes, word2 is a subsequence of word1." << endl;
    } else {
        cout << "No, word2 is not a subsequence of word1." << endl;
    }

    return 0;
}`;
  } else if (qid === 'FAST_CFD_PF_F23_FINAL_Q4_1') {
    subcat = 'system-design';
    title = 'Conditional Logic Refactoring without Logical Operators';
    diff = 'medium';
    starterCode = `#include <iostream>
using namespace std;

// Refactor two boolean conditions without using logical operators (&& and ||):
// Snippet 1: if (a > b || !b >= c || a != c && c <= b)
// Snippet 2: if (a > b || !b == c && a != c || c <= b)

void testSnippet1(int a, int b, int c) {
    bool result = false;
    // Implement using purely nested if-else structures
    if (a > b) {
        result = true;
    } else if ((!b) >= c) {
        result = true;
    } else if (a != c) {
        if (c <= b) {
            result = true;
        }
    }
    cout << "Snippet 1 evaluated to: " << (result ? "TRUE" : "FALSE") << endl;
}

int main() {
    int a = 5, b = 2, c = 4;
    testSnippet1(a, b, c);
    return 0;
}`;
  } else if (qid === 'FAST_CFD_PF_F23_FINAL_Q4_2') {
    subcat = 'strings-chars';
    title = 'Random 4-Letter Word Generator without Char Variables';
    diff = 'medium';
    starterCode = `#include <iostream>
#include <cstdlib>
#include <ctime>
using namespace std;

// Output a random 4-letter word using upper- and lower-case English alphabets.
// Use a switch structure for selection.
// Rule: You cannot create a char variable or char array for any purpose!

int main() {
    srand(time(0));

    for (int i = 0; i < 4; i++) {
        int caseType = rand() % 2; // 0 for uppercase, 1 for lowercase
        int asciiVal;

        switch (caseType) {
            case 0:
                asciiVal = 65 + (rand() % 26); // 'A' to 'Z'
                break;
            case 1:
                asciiVal = 97 + (rand() % 26); // 'a' to 'z'
                break;
        }

        // Print via typecast without creating any char variable
        cout << (char)asciiVal;
    }
    cout << endl;

    return 0;
}`;
  } else if (qid === 'FAST_CFD_PF_F23_FINAL_Q5A') {
    subcat = 'arrays-matrices';
    title = 'validateMatrix: Peak Element & Const Prototypes';
    diff = 'hard';
    starterCode = `#include <iostream>
using namespace std;

// 1. Write validateMatrix taking two 2D integer arrays (matrix A and matrix B) and dimensions.
// If an element in A is strictly greater than both left and right neighbors, mark B with -1.
// 2. Const correctness: const int A[][10].

const int MAX_COLS = 10;

void validateMatrix(const int A[][MAX_COLS], int B[][MAX_COLS], int rows, int cols) {
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            B[i][j] = A[i][j]; // Copy original
            if (j > 0 && j < cols - 1) {
                if (A[i][j] > A[i][j - 1] && A[i][j] > A[i][j + 1]) {
                    B[i][j] = -1; // Mark peak
                }
            }
        }
    }
}

int main() {
    int A[3][MAX_COLS] = {
        {1, 5, 2, 4},
        {3, 8, 1, 9},
        {4, 2, 7, 3}
    };
    int B[3][MAX_COLS] = {0};

    validateMatrix(A, B, 3, 4);

    cout << "Matrix B after peak validation:" << endl;
    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 4; j++) {
            cout << B[i][j] << " ";
        }
        cout << endl;
    }
    return 0;
}`;
  } else if (qid === 'FAST_CFD_PF_F23_FINAL_Q5B') {
    subcat = 'system-design';
    title = 'Automated Quiz Grader with File I/O';
    diff = 'hard';
    starterCode = `#include <iostream>
#include <fstream>
#include <string>
using namespace std;

// Read student submission.txt and solution.txt, grade each student out of 20,
// and write student Roll No & Score to marks.txt.

int main() {
    cout << "Simulating Quiz Grader..." << endl;
    // In local Judge0 / sandbox, standard input/output simulates file reading:
    string sampleKey = "TFTFFTTFFTTFTFTFTFTF";
    cout << "Solution Key: " << sampleKey << endl;

    string sampleStudentRoll = "F230503";
    string sampleStudentAnswers = "TFTFFTTFFTTFTFTFTFFF"; // 19 correct

    int score = 0;
    for (int i = 0; i < 20; i++) {
        if (sampleStudentAnswers[i] == sampleKey[i]) score++;
    }

    cout << "Result: " << sampleStudentRoll << " " << score << "/20" << endl;
    return 0;
}`;
  }

  const cleanId = `pf-final-${qid.replace('FAST_CFD_PF_F23_FINAL_', '').toLowerCase().replace('_', '-')}`;
  const newObj = {
    id: cleanId,
    type: 'code_submit',
    subjectId: 'pf',
    categoryId: 'final-exam',
    subcategoryId: subcat,
    title: title,
    difficulty: diff,
    statement: q.problem_statement,
    starterCode: starterCode,
    expectedOutput: expOut,
    hints: [
      `Review concepts required for ${qid}.`,
      'Observe strict PF-lab constraints: avoid banned STL algorithms and classes.'
    ],
    tags: q.subtopics || ['cpp', 'final', 'exam']
  };

  finalQuestions[subcat].push(newObj);
}

// 5. Write subject.json
fs.writeFileSync(path.join(pfContentDir, 'subject.json'), JSON.stringify(pfSubject, null, 2));

// 6. Write each subcategory questions.json
for (const [subcat, qList] of Object.entries(lab10Questions)) {
  const dir = path.join(pfContentDir, 'lab10-tasks', subcat);
  ensureDir(dir);
  fs.writeFileSync(path.join(dir, 'questions.json'), JSON.stringify(qList, null, 2));
}

for (const [subcat, qList] of Object.entries(finalQuestions)) {
  const dir = path.join(pfContentDir, 'final-exam', subcat);
  ensureDir(dir);
  fs.writeFileSync(path.join(dir, 'questions.json'), JSON.stringify(qList, null, 2));
}

console.log('Migration complete!');
console.log('Lab 10 questions count:', Object.values(lab10Questions).flat().length);
console.log('Final Exam questions count:', Object.values(finalQuestions).flat().length);
