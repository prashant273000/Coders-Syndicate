require("dotenv").config();
const mongoose = require("mongoose");
const Question = require("./models/question");

const questions = [
  {
    title: "Two Sum",
    difficulty: "Easy",
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.`,
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]" },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
    ],
    testCases: [
      { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]" },
      { input: "[3,2,4]\n6", expectedOutput: "[1,2]" },
      { input: "[3,3]\n6", expectedOutput: "[0,1]" },
    ],
    functionSignature: {
      javascript: "function twoSum(nums, target) {\n  // write your code here\n}",
      python: "def two_sum(nums, target):\n    # write your code here\n    pass",
      cpp: "vector<int> twoSum(vector<int>& nums, int target) {\n    // write your code here\n}",
    },
  },
  {
    title: "FizzBuzz",
    difficulty: "Easy",
    description: `Given an integer n, return a string array where answer[i] is "FizzBuzz" if divisible by 3 and 5, "Fizz" if divisible by 3, "Buzz" if divisible by 5, or the number as string otherwise.`,
    examples: [
      { input: "n = 3", output: '["1","2","Fizz"]' },
      { input: "n = 5", output: '["1","2","Fizz","4","Buzz"]' },
    ],
    testCases: [
      { input: "3", expectedOutput: '["1","2","Fizz"]' },
      { input: "5", expectedOutput: '["1","2","Fizz","4","Buzz"]' },
    ],
    functionSignature: {
      javascript: "function fizzBuzz(n) {\n  // write your code here\n}",
      python: "def fizz_buzz(n):\n    # write your code here\n    pass",
      cpp: "vector<string> fizzBuzz(int n) {\n    // write your code here\n}",
    },
  },
  {
    title: "Palindrome Check",
    difficulty: "Easy",
    description: `Given a string s, return true if it is a palindrome, or false otherwise. A palindrome reads the same forward and backward. Ignore case and non-alphanumeric characters.`,
    examples: [
      { input: 's = "racecar"', output: "true" },
      { input: 's = "hello"', output: "false" },
    ],
    testCases: [
      { input: "racecar", expectedOutput: "true" },
      { input: "hello", expectedOutput: "false" },
      { input: "madam", expectedOutput: "true" },
    ],
    functionSignature: {
      javascript: "function isPalindrome(s) {\n  // write your code here\n}",
      python: "def is_palindrome(s):\n    # write your code here\n    pass",
      cpp: "bool isPalindrome(string s) {\n    // write your code here\n}",
    },
  },
  {
    title: "Maximum Subarray",
    difficulty: "Medium",
    description: `Given an integer array nums, find the subarray with the largest sum and return its sum. A subarray is a contiguous non-empty sequence of elements within an array.`,
    examples: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6" },
      { input: "nums = [1]", output: "1" },
    ],
    testCases: [
      { input: "[-2,1,-3,4,-1,2,1,-5,4]", expectedOutput: "6" },
      { input: "[1]", expectedOutput: "1" },
      { input: "[5,4,-1,7,8]", expectedOutput: "23" },
    ],
    functionSignature: {
      javascript: "function maxSubArray(nums) {\n  // write your code here\n}",
      python: "def max_sub_array(nums):\n    # write your code here\n    pass",
      cpp: "int maxSubArray(vector<int>& nums) {\n    // write your code here\n}",
    },
  },
  {
    title: "Valid Parentheses",
    difficulty: "Easy",
    description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if open brackets are closed by the same type of brackets and in the correct order.`,
    examples: [
      { input: 's = "()"', output: "true" },
      { input: 's = "()[]{}"', output: "true" },
      { input: 's = "(]"', output: "false" },
    ],
    testCases: [
      { input: "()", expectedOutput: "true" },
      { input: "()[]{}", expectedOutput: "true" },
      { input: "(]", expectedOutput: "false" },
      { input: "([)]", expectedOutput: "false" },
      { input: "{[]}", expectedOutput: "true" },
    ],
    functionSignature: {
      javascript: "function isValid(s) {\n  // write your code here\n}",
      python: "def is_valid(s):\n    # write your code here\n    pass",
      cpp: "bool isValid(string s) {\n    // write your code here\n}",
    },
  },
  {
    title: "Climbing Stairs",
    difficulty: "Easy",
    description: `You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?`,
    examples: [
      { input: "n = 2", output: "2" },
      { input: "n = 3", output: "3" },
    ],
    testCases: [
      { input: "2", expectedOutput: "2" },
      { input: "3", expectedOutput: "3" },
      { input: "5", expectedOutput: "8" },
      { input: "10", expectedOutput: "89" },
    ],
    functionSignature: {
      javascript: "function climbStairs(n) {\n  // write your code here\n}",
      python: "def climb_stairs(n):\n    # write your code here\n    pass",
      cpp: "int climbStairs(int n) {\n    // write your code here\n}",
    },
  },
  {
    title: "Reverse Linked List",
    difficulty: "Easy",
    description: `Given the head of a singly linked list, reverse the list, and return the reversed list. Return the values of the reversed list as an array.`,
    examples: [
      { input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]" },
      { input: "head = [1,2]", output: "[2,1]" },
    ],
    testCases: [
      { input: "[1,2,3,4,5]", expectedOutput: "[5,4,3,2,1]" },
      { input: "[1,2]", expectedOutput: "[2,1]" },
      { input: "[1]", expectedOutput: "[1]" },
    ],
    functionSignature: {
      javascript: "function reverseList(head) {\n  // write your code here\n  // Input is given as array, return as array\n}",
      python: "def reverse_list(head):\n    # write your code here\n    pass",
      cpp: "vector<int> reverseList(vector<int>& head) {\n    // write your code here\n}",
    },
  },
  {
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    description: `You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit you can achieve. If you cannot achieve any profit, return 0.`,
    examples: [
      { input: "prices = [7,1,5,3,6,4]", output: "5" },
      { input: "prices = [7,6,4,3,1]", output: "0" },
    ],
    testCases: [
      { input: "[7,1,5,3,6,4]", expectedOutput: "5" },
      { input: "[7,6,4,3,1]", expectedOutput: "0" },
      { input: "[1,2,3,4,5]", expectedOutput: "4" },
    ],
    functionSignature: {
      javascript: "function maxProfit(prices) {\n  // write your code here\n}",
      python: "def max_profit(prices):\n    # write your code here\n    pass",
      cpp: "int maxProfit(vector<int>& prices) {\n    // write your code here\n}",
    },
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Question.deleteMany({});
    await Question.insertMany(questions);
    console.log("✅ Questions seeded successfully! Total:", questions.length);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

seed();