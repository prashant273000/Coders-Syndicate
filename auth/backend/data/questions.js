// Google Doodle-themed coding battle questions with test cases
const questions = [
  {
    id: 1,
    title: "The Pac-Man Path",
    description: `Given an array of points eaten \`nums\` and a target score \`target\`, return the indices of two point values that add up exactly to the target.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
    difficulty: "Easy",
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]",
      },
    ],
    testCases: [
      { input: "4\n2 7 11 15\n9", expectedOutput: "0 1" },
      { input: "3\n3 2 4\n6", expectedOutput: "1 2" },
      { input: "2\n3 3\n6", expectedOutput: "0 1" },
    ],
  },
  {
    id: 2,
    title: "Rewind the Doodle",
    description: `A bug messed up the title of today's Doodle! Reverse the given string to fix it.

Print the reversed string.`,
    difficulty: "Easy",
    examples: [
      {
        input: "s = \"elgood\"",
        output: "\"doogle\"",
      },
      {
        input: "s = \"dlrow\"",
        output: "\"world\"",
      },
    ],
    testCases: [
      { input: "elgood", expectedOutput: "doogle" },
      { input: "dlrow", expectedOutput: "world" },
      { input: "edcba", expectedOutput: "abcde" },
    ],
  },
  {
    id: 3,
    title: "Count the Confetti",
    description: `You have N piles of confetti for the anniversary Doodle. Print their total sum.

Given N integers, calculate and print their sum.`,
    difficulty: "Easy",
    examples: [
      {
        input: "5\n1 2 3 4 5",
        output: "15",
      },
      {
        input: "3\n10 20 30",
        output: "60",
      },
    ],
    testCases: [
      { input: "5\n1 2 3 4 5", expectedOutput: "15" },
      { input: "3\n10 20 30", expectedOutput: "60" },
      { input: "4\n1 1 1 1", expectedOutput: "4" },
    ],
  },
  {
    id: 4,
    title: "The Champion's Factorial",
    description: `The Doodle Champion Island Games needs a score multiplier! Given a number N, calculate its factorial.

The factorial of N (denoted as N!) is the product of all positive integers from 1 to N.

Note: 0! = 1`,
    difficulty: "Medium",
    examples: [
      {
        input: "5",
        output: "120",
      },
      {
        input: "0",
        output: "1",
      },
    ],
    testCases: [
      { input: "5", expectedOutput: "120" },
      { input: "0", expectedOutput: "1" },
      { input: "7", expectedOutput: "5040" },
    ],
  },
  {
    id: 5,
    title: "Symmetric Shapes",
    description: `The design team wants to know if their new logo shape name is symmetrical (a palindrome). 

Given a string, print **YES** if it reads the same forwards and backwards, **NO** otherwise.

The comparison should be case-sensitive.`,
    difficulty: "Medium",
    examples: [
      {
        input: "racecar",
        output: "YES",
      },
      {
        input: "google",
        output: "NO",
      },
    ],
    testCases: [
      { input: "racecar", expectedOutput: "YES" },
      { input: "google", expectedOutput: "NO" },
      { input: "madam", expectedOutput: "YES" },
    ],
  },
];

// Language mapping for Piston API
const languageIds = {
  javascript: "javascript",
  python: "python",
  cpp: "c++",
  java: "java",
  c: "c",
};

// Language name mapping for display
const languageNames = {
  javascript: "JavaScript",
  python: "Python",
  "c++": "C++",
  java: "Java",
  c: "C",
};

module.exports = { questions, languageIds, languageNames };