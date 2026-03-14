// src/utils/battle.js — Group Battle (up to 10 players)
import { supabase } from "./supabase";

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;

// ── Generate room code ────────────────────────────────────────
export function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ── Problems list ─────────────────────────────────────────────
export const BATTLE_PROBLEMS = [
  // Easy
  { id:1,  title:"Two Sum",                          difficulty:"Easy",   tags:["Array","Hash Table"],       problem:`Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nExample 1: Input: nums = [2,7,11,15], target = 9  → Output: [0,1]\nExample 2: Input: nums = [3,2,4], target = 6  → Output: [1,2]\n\nConstraints:\n- 2 <= nums.length <= 10^4\n- Only one valid answer exists.` },
  { id:2,  title:"Valid Parentheses",                difficulty:"Easy",   tags:["Stack","String"],           problem:`Given a string s containing just '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nExample 1: Input: s = "()"     → Output: true\nExample 2: Input: s = "()[]{}" → Output: true\nExample 3: Input: s = "(]"     → Output: false` },
  { id:3,  title:"Reverse Linked List",              difficulty:"Easy",   tags:["Linked List"],              problem:`Given the head of a singly linked list, reverse the list and return the reversed list.\n\nExample: Input: head = [1,2,3,4,5] → Output: [5,4,3,2,1]` },
  { id:4,  title:"Climbing Stairs",                  difficulty:"Easy",   tags:["DP","Math"],                problem:`You are climbing a staircase with n steps. Each time you can climb 1 or 2 steps. How many distinct ways to reach the top?\n\nExample 1: Input: n = 2 → Output: 2\nExample 2: Input: n = 3 → Output: 3` },
  { id:5,  title:"Binary Search",                    difficulty:"Easy",   tags:["Array","Binary Search"],    problem:`Given sorted array nums and a target, return index if found else -1. Must be O(log n).\n\nExample 1: Input: nums = [-1,0,3,5,9,12], target = 9 → Output: 4\nExample 2: Input: nums = [-1,0,3,5,9,12], target = 2 → Output: -1` },
  { id:6,  title:"Best Time to Buy and Sell Stock",  difficulty:"Easy",   tags:["Array","Greedy"],           problem:`Given prices[i] = stock price on day i, return max profit. If no profit, return 0.\n\nExample 1: Input: prices = [7,1,5,3,6,4] → Output: 5\nExample 2: Input: prices = [7,6,4,3,1]   → Output: 0` },
  { id:7,  title:"Merge Two Sorted Lists",           difficulty:"Easy",   tags:["Linked List"],              problem:`Merge two sorted linked lists and return as one sorted list.\n\nExample: Input: l1 = [1,2,4], l2 = [1,3,4] → Output: [1,1,2,3,4,4]` },
  { id:8,  title:"Maximum Depth of Binary Tree",     difficulty:"Easy",   tags:["Tree","DFS"],               problem:`Given the root of a binary tree, return its maximum depth.\n\nExample 1: Input: root = [3,9,20,null,null,15,7] → Output: 3\nExample 2: Input: root = [1,null,2]              → Output: 2` },
  { id:9,  title:"Contains Duplicate",               difficulty:"Easy",   tags:["Array","Hash Table"],       problem:`Given integer array nums, return true if any value appears at least twice.\n\nExample 1: Input: nums = [1,2,3,1]   → Output: true\nExample 2: Input: nums = [1,2,3,4]   → Output: false` },
  { id:10, title:"Palindrome Number",                difficulty:"Easy",   tags:["Math"],                     problem:`Given an integer x, return true if x is a palindrome.\n\nExample 1: Input: x = 121  → Output: true\nExample 2: Input: x = -121 → Output: false\nExample 3: Input: x = 10  → Output: false` },
  { id:11, title:"Single Number",                    difficulty:"Easy",   tags:["Array","Bit Manipulation"], problem:`Given a non-empty array where every element appears twice except one, find that single one. O(1) extra memory.\n\nExample 1: Input: nums = [2,2,1]      → Output: 1\nExample 2: Input: nums = [4,1,2,1,2]  → Output: 4` },
  { id:12, title:"Majority Element",                 difficulty:"Easy",   tags:["Array","Hash Table"],       problem:`Given array nums of size n, return the majority element (appears more than n/2 times).\n\nExample 1: Input: nums = [3,2,3]          → Output: 3\nExample 2: Input: nums = [2,2,1,1,1,2,2]  → Output: 2` },
  { id:13, title:"Move Zeroes",                      difficulty:"Easy",   tags:["Array","Two Pointers"],     problem:`Move all 0s to end while maintaining relative order of non-zero elements. Do it in-place.\n\nExample 1: Input: nums = [0,1,0,3,12] → Output: [1,3,12,0,0]\nExample 2: Input: nums = [0]          → Output: [0]` },
  { id:14, title:"Missing Number",                   difficulty:"Easy",   tags:["Array","Math"],             problem:`Given array nums containing n distinct numbers in range [0,n], return the missing number.\n\nExample 1: Input: nums = [3,0,1]    → Output: 2\nExample 2: Input: nums = [0,1]      → Output: 2` },
  { id:15, title:"Reverse String",                   difficulty:"Easy",   tags:["String","Two Pointers"],    problem:`Reverse a string in-place. Input is given as an array of characters.\n\nExample 1: Input: s = ["h","e","l","l","o"] → Output: ["o","l","l","e","h"]\nExample 2: Input: s = ["H","a","n","n","a","h"] → Output: ["h","a","n","n","a","H"]` },
  { id:16, title:"Fibonacci Number",                 difficulty:"Easy",   tags:["Math","DP"],                problem:`Given n, calculate F(n) where F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2).\n\nExample 1: Input: n = 2 → Output: 1\nExample 2: Input: n = 4 → Output: 3` },
  { id:17, title:"Valid Anagram",                    difficulty:"Easy",   tags:["String","Hash Table"],      problem:`Given two strings s and t, return true if t is an anagram of s.\n\nExample 1: Input: s = "anagram", t = "nagaram" → Output: true\nExample 2: Input: s = "rat",     t = "car"     → Output: false` },
  { id:18, title:"First Unique Character",           difficulty:"Easy",   tags:["String","Hash Table"],      problem:`Given string s, find the first non-repeating character and return its index. If none, return -1.\n\nExample 1: Input: s = "leetcode"     → Output: 0\nExample 2: Input: s = "loveleetcode" → Output: 2` },
  { id:19, title:"Squares of Sorted Array",          difficulty:"Easy",   tags:["Array","Two Pointers"],     problem:`Given sorted array nums, return array of squares sorted in non-decreasing order.\n\nExample 1: Input: nums = [-4,-1,0,3,10]  → Output: [0,1,9,16,100]\nExample 2: Input: nums = [-7,-3,2,3,11]  → Output: [4,9,9,49,121]` },
  { id:20, title:"Linked List Cycle",                difficulty:"Easy",   tags:["Linked List","Two Pointers"],problem:`Given head of a linked list, determine if it has a cycle.\n\nExample 1: Input: head = [3,2,0,-4], pos=1 → Output: true\nExample 2: Input: head = [1], pos=-1       → Output: false` },
  { id:21, title:"Roman to Integer",                 difficulty:"Easy",   tags:["Math","String"],            problem:`Convert a roman numeral string to integer. I=1,V=5,X=10,L=50,C=100,D=500,M=1000\n\nExample 1: Input: s = "III"     → Output: 3\nExample 2: Input: s = "MCMXCIV" → Output: 1994` },
  { id:22, title:"Count Primes",                     difficulty:"Easy",   tags:["Math","Sieve"],             problem:`Given n, return the number of prime numbers strictly less than n.\n\nExample 1: Input: n = 10 → Output: 4 (2,3,5,7)\nExample 2: Input: n = 0  → Output: 0` },
  { id:23, title:"Plus One",                         difficulty:"Easy",   tags:["Array","Math"],             problem:`Given large integer as array digits, increment by one and return result.\n\nExample 1: Input: digits = [1,2,3] → Output: [1,2,4]\nExample 2: Input: digits = [9]     → Output: [1,0]` },
  { id:24, title:"Power of Two",                     difficulty:"Easy",   tags:["Math","Bit Manipulation"],  problem:`Given integer n, return true if it is a power of two.\n\nExample 1: Input: n = 1  → Output: true\nExample 2: Input: n = 16 → Output: true\nExample 3: Input: n = 3  → Output: false` },
  { id:25, title:"Happy Number",                     difficulty:"Easy",   tags:["Math","Hash Table"],        problem:`A happy number: replace by sum of squares of digits, repeat until 1 or loop. Return true if happy.\n\nExample 1: Input: n = 19 → Output: true\nExample 2: Input: n = 2  → Output: false` },
  { id:26, title:"Longest Common Prefix",            difficulty:"Easy",   tags:["String"],                   problem:`Find the longest common prefix string among an array of strings.\n\nExample 1: Input: strs = ["flower","flow","flight"] → Output: "fl"\nExample 2: Input: strs = ["dog","racecar","car"]    → Output: ""` },
  { id:27, title:"Remove Element",                   difficulty:"Easy",   tags:["Array","Two Pointers"],     problem:`Remove all occurrences of val in-place. Return count of elements not equal to val.\n\nExample 1: Input: nums = [3,2,2,3], val=3    → Output: 2\nExample 2: Input: nums = [0,1,2,2,3,0,4,2], val=2 → Output: 5` },
  { id:28, title:"Search Insert Position",           difficulty:"Easy",   tags:["Array","Binary Search"],    problem:`Given sorted array and target, return index if found, else the insertion index.\n\nExample 1: Input: nums=[1,3,5,6], target=5 → Output: 2\nExample 2: Input: nums=[1,3,5,6], target=7 → Output: 4` },
  { id:29, title:"Symmetric Tree",                   difficulty:"Easy",   tags:["Tree","BFS"],               problem:`Check whether a binary tree is a mirror of itself.\n\nExample 1: Input: root = [1,2,2,3,4,4,3]      → Output: true\nExample 2: Input: root = [1,2,2,null,3,null,3] → Output: false` },
  { id:30, title:"Remove Duplicates from Sorted Array", difficulty:"Easy", tags:["Array","Two Pointers"],   problem:`Remove duplicates in-place from sorted array. Return count of unique elements.\n\nExample 1: Input: nums = [1,1,2]          → Output: 2\nExample 2: Input: nums = [0,0,1,1,1,2,2,3] → Output: 4` },
  { id:31, title:"Two Sum II",                       difficulty:"Easy",   tags:["Array","Two Pointers"],     problem:`Given 1-indexed sorted array, return indices of two numbers that add to target. O(1) extra space.\n\nExample 1: Input: numbers=[2,7,11,15], target=9 → Output: [1,2]\nExample 2: Input: numbers=[2,3,4],    target=6 → Output: [1,3]` },
  { id:32, title:"Isomorphic Strings",               difficulty:"Easy",   tags:["String","Hash Table"],      problem:`Determine if two strings s and t are isomorphic (characters can be replaced to get t).\n\nExample 1: Input: s="egg",  t="add"   → Output: true\nExample 2: Input: s="foo",  t="bar"   → Output: false` },
  { id:33, title:"Word Pattern",                     difficulty:"Easy",   tags:["String","Hash Table"],      problem:`Return true if string s follows the same pattern (bijection between letters and words).\n\nExample 1: Input: pattern="abba", s="dog cat cat dog" → Output: true\nExample 2: Input: pattern="abba", s="dog cat cat fish"→ Output: false` },
  { id:34, title:"Valid Palindrome",                 difficulty:"Easy",   tags:["String","Two Pointers"],    problem:`A phrase is a palindrome if after lowercasing and removing non-alphanumeric chars, it reads same forward and backward.\n\nExample 1: Input: s = "A man, a plan, a canal: Panama" → Output: true\nExample 2: Input: s = "race a car" → Output: false` },
  { id:35, title:"Intersection of Two Arrays",       difficulty:"Easy",   tags:["Array","Hash Table"],       problem:`Return array of intersection of two arrays. Each element must appear only once.\n\nExample 1: Input: nums1=[1,2,2,1], nums2=[2,2]      → Output: [2]\nExample 2: Input: nums1=[4,9,5], nums2=[9,4,9,8,4]  → Output: [9,4]` },
  { id:36, title:"Ransom Note",                      difficulty:"Easy",   tags:["String","Hash Table"],      problem:`Return true if ransomNote can be constructed using letters from magazine.\n\nExample 1: Input: ransomNote="a",  magazine="b"   → Output: false\nExample 2: Input: ransomNote="aa", magazine="aab" → Output: true` },
  { id:37, title:"Path Sum",                         difficulty:"Easy",   tags:["Tree","DFS"],               problem:`Return true if there is a root-to-leaf path in binary tree where sum equals targetSum.\n\nExample 1: Input: root=[5,4,8,11,null,13,4], targetSum=22 → Output: true\nExample 2: Input: root=[1,2,3], targetSum=5              → Output: false` },
  { id:38, title:"Length of Last Word",              difficulty:"Easy",   tags:["String"],                   problem:`Return the length of the last word in string s.\n\nExample 1: Input: s = "Hello World"  → Output: 5\nExample 2: Input: s = "fly me to the moon" → Output: 4` },
  { id:39, title:"Number of 1 Bits",                 difficulty:"Easy",   tags:["Bit Manipulation"],         problem:`Write a function that returns the number of '1' bits in an unsigned integer.\n\nExample 1: Input: 00000000000000000000000000001011 → Output: 3\nExample 2: Input: 11111111111111111111111111111101 → Output: 31` },
  { id:40, title:"Reverse Bits",                     difficulty:"Easy",   tags:["Bit Manipulation"],         problem:`Reverse bits of a given 32 bits unsigned integer.\n\nExample 1: Input:  00000010100101000001111010011100 → Output: 00111001011110000010100101000000` },

  // Medium
  { id:41, title:"Maximum Subarray",                 difficulty:"Medium", tags:["Array","DP"],               problem:`Find the subarray with the largest sum and return its sum.\n\nExample 1: Input: nums = [-2,1,-3,4,-1,2,1,-5,4] → Output: 6\nExample 2: Input: nums = [5,4,-1,7,8]            → Output: 23` },
  { id:42, title:"Longest Substring Without Repeating", difficulty:"Medium", tags:["Sliding Window"],       problem:`Find the length of the longest substring without repeating characters.\n\nExample 1: Input: s = "abcabcbb" → Output: 3\nExample 2: Input: s = "pwwkew"   → Output: 3` },
  { id:43, title:"3Sum",                             difficulty:"Medium", tags:["Array","Two Pointers"],     problem:`Return all triplets that sum to zero. No duplicate triplets.\n\nExample 1: Input: nums = [-1,0,1,2,-1,-4] → Output: [[-1,-1,2],[-1,0,1]]\nExample 2: Input: nums = [0,0,0]          → Output: [[0,0,0]]` },
  { id:44, title:"Container With Most Water",        difficulty:"Medium", tags:["Array","Two Pointers"],     problem:`Find two lines that form container holding most water.\n\nExample: Input: height = [1,8,6,2,5,4,8,3,7] → Output: 49` },
  { id:45, title:"Group Anagrams",                   difficulty:"Medium", tags:["Array","Hash Table"],       problem:`Group the anagrams together.\n\nExample: Input: strs = ["eat","tea","tan","ate","nat","bat"]\nOutput: [["bat"],["nat","tan"],["ate","eat","tea"]]` },
  { id:46, title:"Coin Change",                      difficulty:"Medium", tags:["DP"],                       problem:`Return fewest coins needed to make up amount. Return -1 if not possible.\n\nExample 1: Input: coins=[1,5,11], amount=15 → Output: 3\nExample 2: Input: coins=[2], amount=3       → Output: -1` },
  { id:47, title:"Product of Array Except Self",     difficulty:"Medium", tags:["Array","Prefix Sum"],       problem:`Return array where output[i] = product of all except nums[i]. O(n), no division.\n\nExample: Input: nums = [1,2,3,4] → Output: [24,12,8,6]` },
  { id:48, title:"Number of Islands",                difficulty:"Medium", tags:["Graph","BFS","DFS"],        problem:`Given 2D grid of '1's and '0's, return number of islands.\n\nExample 1: Input:\n11110\n11010\n→ Output: 1\n\nExample 2: Input:\n11000\n00100\n→ Output: 3` },
  { id:49, title:"Longest Palindromic Substring",    difficulty:"Medium", tags:["String","DP"],              problem:`Return the longest palindromic substring.\n\nExample 1: Input: s = "babad" → Output: "bab"\nExample 2: Input: s = "cbbd"  → Output: "bb"` },
  { id:50, title:"Jump Game",                        difficulty:"Medium", tags:["Array","Greedy"],           problem:`Return true if you can reach the last index.\n\nExample 1: Input: nums = [2,3,1,1,4] → Output: true\nExample 2: Input: nums = [3,2,1,0,4] → Output: false` },
  { id:51, title:"Spiral Matrix",                    difficulty:"Medium", tags:["Array","Matrix"],           problem:`Return all elements of matrix in spiral order.\n\nExample: Input: matrix = [[1,2,3],[4,5,6],[7,8,9]] → Output: [1,2,3,6,9,8,7,4,5]` },
  { id:52, title:"Unique Paths",                     difficulty:"Medium", tags:["DP","Math"],                problem:`Robot on m×n grid, can only move right or down. How many unique paths to bottom-right?\n\nExample 1: Input: m=3, n=7 → Output: 28\nExample 2: Input: m=3, n=2 → Output: 3` },
  { id:53, title:"House Robber",                     difficulty:"Medium", tags:["Array","DP"],               problem:`Cannot rob adjacent houses. Return max amount robbed.\n\nExample 1: Input: nums = [1,2,3,1]   → Output: 4\nExample 2: Input: nums = [2,7,9,3,1] → Output: 12` },
  { id:54, title:"Longest Increasing Subsequence",   difficulty:"Medium", tags:["Array","DP"],               problem:`Return length of longest strictly increasing subsequence.\n\nExample 1: Input: nums = [10,9,2,5,3,7,101,18] → Output: 4\nExample 2: Input: nums = [0,1,0,3,2,3]          → Output: 4` },
  { id:55, title:"Find Minimum in Rotated Array",    difficulty:"Medium", tags:["Array","Binary Search"],    problem:`Return minimum element in sorted rotated array. O(log n).\n\nExample 1: Input: nums = [3,4,5,1,2]     → Output: 1\nExample 2: Input: nums = [4,5,6,7,0,1,2] → Output: 0` },
  { id:56, title:"Subsets",                          difficulty:"Medium", tags:["Array","Backtracking"],     problem:`Return all possible subsets of array with unique elements.\n\nExample: Input: nums = [1,2,3] → Output: [[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]` },
  { id:57, title:"Permutations",                     difficulty:"Medium", tags:["Array","Backtracking"],     problem:`Return all possible permutations of distinct integers.\n\nExample: Input: nums = [1,2,3] → Output: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]` },
  { id:58, title:"Combination Sum",                  difficulty:"Medium", tags:["Array","Backtracking"],     problem:`Return all unique combinations that sum to target. Same number can be reused.\n\nExample: Input: candidates=[2,3,6,7], target=7 → Output: [[2,2,3],[7]]` },
  { id:59, title:"Rotate Image",                     difficulty:"Medium", tags:["Array","Matrix"],           problem:`Rotate n×n matrix 90 degrees clockwise in-place.\n\nExample: Input: [[1,2,3],[4,5,6],[7,8,9]] → Output: [[7,4,1],[8,5,2],[9,6,3]]` },
  { id:60, title:"Top K Frequent Elements",          difficulty:"Medium", tags:["Array","Hash Table"],       problem:`Return k most frequent elements.\n\nExample 1: Input: nums=[1,1,1,2,2,3], k=2 → Output: [1,2]\nExample 2: Input: nums=[1], k=1            → Output: [1]` },
  { id:61, title:"Merge Intervals",                  difficulty:"Medium", tags:["Array","Sorting"],          problem:`Merge all overlapping intervals.\n\nExample: Input: [[1,3],[2,6],[8,10],[15,18]] → Output: [[1,6],[8,10],[15,18]]` },
  { id:62, title:"Sort Colors",                      difficulty:"Medium", tags:["Array","Two Pointers"],     problem:`Sort array of 0s,1s,2s in-place in single pass.\n\nExample: Input: nums=[2,0,2,1,1,0] → Output: [0,0,1,1,2,2]` },
  { id:63, title:"Kth Largest Element",              difficulty:"Medium", tags:["Array","Heap"],             problem:`Return the kth largest element.\n\nExample 1: Input: nums=[3,2,1,5,6,4], k=2      → Output: 5\nExample 2: Input: nums=[3,2,3,1,2,4,5,5,6], k=4 → Output: 4` },
  { id:64, title:"Course Schedule",                  difficulty:"Medium", tags:["Graph","Topological Sort"], problem:`Return true if you can finish all courses (no cycle).\n\nExample 1: Input: numCourses=2, prerequisites=[[1,0]]       → Output: true\nExample 2: Input: numCourses=2, prerequisites=[[1,0],[0,1]] → Output: false` },
  { id:65, title:"Validate BST",                     difficulty:"Medium", tags:["Tree","DFS"],               problem:`Determine if binary tree is a valid BST.\n\nExample 1: Input: root = [2,1,3]              → Output: true\nExample 2: Input: root = [5,1,4,null,null,3,6] → Output: false` },
  { id:66, title:"Decode Ways",                      difficulty:"Medium", tags:["String","DP"],              problem:`Return number of ways to decode digit string (A=1...Z=26).\n\nExample 1: Input: s="12"  → Output: 2 (AB or L)\nExample 2: Input: s="226" → Output: 3` },
  { id:67, title:"Word Search",                      difficulty:"Medium", tags:["Array","Backtracking"],     problem:`Return true if word exists in grid (adjacent cells, no reuse).\n\nExample: board=[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word="ABCCED" → Output: true` },
  { id:68, title:"Minimum Path Sum",                 difficulty:"Medium", tags:["Array","DP"],               problem:`Find path from top-left to bottom-right minimizing sum. Move right or down only.\n\nExample: Input: grid=[[1,3,1],[1,5,1],[4,2,1]] → Output: 7` },
  { id:69, title:"Add Two Numbers",                  difficulty:"Medium", tags:["Linked List","Math"],       problem:`Two linked lists represent integers in reverse. Add and return as linked list.\n\nExample: Input: l1=[2,4,3], l2=[5,6,4] → Output: [7,0,8] (342+465=807)` },
  { id:70, title:"Remove Nth Node From End",         difficulty:"Medium", tags:["Linked List","Two Pointers"],problem:`Remove the nth node from end and return head.\n\nExample: Input: head=[1,2,3,4,5], n=2 → Output: [1,2,3,5]` },
  { id:71, title:"Letter Combinations Phone Number", difficulty:"Medium", tags:["Backtracking","String"],    problem:`Return all possible letter combinations from phone keypad digits.\n\nExample: Input: digits="23" → Output: ["ad","ae","af","bd","be","bf","cd","ce","cf"]` },
  { id:72, title:"Search in Rotated Sorted Array",   difficulty:"Medium", tags:["Array","Binary Search"],    problem:`Search target in rotated sorted array. O(log n).\n\nExample 1: Input: nums=[4,5,6,7,0,1,2], target=0 → Output: 4\nExample 2: Input: nums=[4,5,6,7,0,1,2], target=3 → Output: -1` },
  { id:73, title:"Partition Equal Subset Sum",       difficulty:"Medium", tags:["Array","DP"],               problem:`Return true if array can be partitioned into two subsets with equal sum.\n\nExample 1: Input: nums=[1,5,11,5] → Output: true\nExample 2: Input: nums=[1,2,3,5]  → Output: false` },
  { id:74, title:"Pacific Atlantic Water Flow",      difficulty:"Medium", tags:["Graph","BFS"],              problem:`Return cells where water can flow to both Pacific and Atlantic oceans.\n\nExample: Input: heights=[[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]\nOutput: [[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]` },
  { id:75, title:"Clone Graph",                      difficulty:"Medium", tags:["Graph","BFS"],              problem:`Return a deep copy of connected undirected graph.\n\nExample: Input: adjList=[[2,4],[1,3],[2,4],[1,3]] → Output: [[2,4],[1,3],[2,4],[1,3]]` },
  { id:76, title:"Binary Tree Level Order Traversal",difficulty:"Medium", tags:["Tree","BFS"],               problem:`Return level order traversal values (left to right, level by level).\n\nExample: Input: root=[3,9,20,null,null,15,7] → Output: [[3],[9,20],[15,7]]` },
  { id:77, title:"Reorder List",                     difficulty:"Medium", tags:["Linked List"],              problem:`Reorder L0→Ln→L1→Ln-1→L2→Ln-2...\n\nExample 1: Input: [1,2,3,4]   → Output: [1,4,2,3]\nExample 2: Input: [1,2,3,4,5] → Output: [1,5,2,4,3]` },
  { id:78, title:"Flatten Binary Tree to Linked List",difficulty:"Medium",tags:["Tree","DFS"],               problem:`Flatten binary tree to linked list in-place using pre-order traversal.\n\nExample: Input: root=[1,2,5,3,4,null,6]\nOutput: [1,null,2,null,3,null,4,null,5,null,6]` },
  { id:79, title:"Minimum Window Substring",         difficulty:"Medium", tags:["Sliding Window","String"],  problem:`Return minimum window substring of s that contains all chars of t.\n\nExample: Input: s="ADOBECODEBANC", t="ABC" → Output: "BANC"` },
  { id:80, title:"Insert Interval",                  difficulty:"Medium", tags:["Array"],                    problem:`Insert new interval into sorted non-overlapping intervals and merge.\n\nExample: Input: intervals=[[1,3],[6,9]], newInterval=[2,5] → Output: [[1,5],[6,9]]` },

  // Hard
  { id:81, title:"Median of Two Sorted Arrays",      difficulty:"Hard",   tags:["Array","Binary Search"],    problem:`Return median of two sorted arrays. O(log(m+n)).\n\nExample 1: Input: nums1=[1,3], nums2=[2]     → Output: 2.0\nExample 2: Input: nums1=[1,2], nums2=[3,4]   → Output: 2.5` },
  { id:82, title:"Trapping Rain Water",              difficulty:"Hard",   tags:["Array","Two Pointers"],     problem:`Compute how much water can be trapped after raining.\n\nExample: Input: height=[0,1,0,2,1,0,1,3,2,1,2,1] → Output: 6` },
  { id:83, title:"Merge K Sorted Lists",             difficulty:"Hard",   tags:["Linked List","Heap"],       problem:`Merge k sorted linked lists into one sorted list.\n\nExample: Input: lists=[[1,4,5],[1,3,4],[2,6]] → Output: [1,1,2,3,4,4,5,6]` },
  { id:84, title:"Regular Expression Matching",      difficulty:"Hard",   tags:["String","DP"],              problem:`Implement regex matching with '.' and '*'.\n\nExample 1: Input: s="aa", p="a*"  → Output: true\nExample 2: Input: s="ab", p=".*"  → Output: true` },
  { id:85, title:"Largest Rectangle in Histogram",   difficulty:"Hard",   tags:["Array","Stack"],            problem:`Return area of largest rectangle in histogram.\n\nExample: Input: heights=[2,1,5,6,2,3] → Output: 10` },
  { id:86, title:"N-Queens",                         difficulty:"Hard",   tags:["Backtracking"],             problem:`Place n queens on n×n board so no two attack each other. Return all solutions.\n\nExample: Input: n=4 → Output: [[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]` },
  { id:87, title:"Word Ladder",                      difficulty:"Hard",   tags:["BFS","Hash Table"],         problem:`Return length of shortest transformation sequence from beginWord to endWord.\n\nExample: Input: beginWord="hit", endWord="cog", wordList=["hot","dot","dog","lot","log","cog"] → Output: 5` },
  { id:88, title:"Sliding Window Maximum",           difficulty:"Hard",   tags:["Array","Deque"],            problem:`Return max of each sliding window of size k.\n\nExample: Input: nums=[1,3,-1,-3,5,3,6,7], k=3 → Output: [3,3,5,5,6,7]` },
  { id:89, title:"Edit Distance",                    difficulty:"Hard",   tags:["String","DP"],              problem:`Return minimum operations to convert word1 to word2.\n\nExample: Input: word1="horse", word2="ros" → Output: 3` },
  { id:90, title:"First Missing Positive",           difficulty:"Hard",   tags:["Array","Hash Table"],       problem:`Return smallest missing positive integer. O(n) time, O(1) space.\n\nExample 1: Input: nums=[1,2,0]     → Output: 3\nExample 2: Input: nums=[3,4,-1,1]  → Output: 2` },
  { id:91, title:"Longest Valid Parentheses",        difficulty:"Hard",   tags:["String","DP","Stack"],      problem:`Return length of longest valid parentheses substring.\n\nExample 1: Input: s="(()"    → Output: 2\nExample 2: Input: s=")()())" → Output: 4` },
  { id:92, title:"Maximal Rectangle",                difficulty:"Hard",   tags:["Array","Stack","DP"],       problem:`Find largest rectangle containing only 1s in binary matrix.\n\nExample: Input: matrix=[["1","0","1","0"],["1","0","1","1"],["1","1","1","1"]] → Output: 6` },
  { id:93, title:"Longest Consecutive Sequence",     difficulty:"Hard",   tags:["Array","Hash Table"],       problem:`Return length of longest consecutive sequence. O(n).\n\nExample: Input: nums=[100,4,200,1,3,2] → Output: 4` },
  { id:94, title:"Find Median from Data Stream",     difficulty:"Hard",   tags:["Heap","Design"],            problem:`Design data structure supporting addNum() and findMedian().\n\nExample: addNum(1)→addNum(2)→findMedian()=1.5→addNum(3)→findMedian()=2.0` },
  { id:95, title:"Wildcard Matching",                difficulty:"Hard",   tags:["String","DP"],              problem:`Match string with pattern containing '?' (any char) and '*' (any sequence).\n\nExample 1: Input: s="aa",    p="*"    → Output: true\nExample 2: Input: s="adceb", p="*a*b" → Output: true` },
  { id:96, title:"Jump Game II",                     difficulty:"Hard",   tags:["Array","Greedy"],           problem:`Return minimum jumps to reach last index.\n\nExample: Input: nums=[2,3,1,1,4] → Output: 2` },
  { id:97, title:"Serialize and Deserialize BST",    difficulty:"Hard",   tags:["Tree","BFS"],               problem:`Design algorithm to serialize and deserialize a BST.\n\nExample: root=[2,1,3] → serialize → "2,1,3," → deserialize → [2,1,3]` },
  { id:98, title:"Longest Increasing Path in Matrix",difficulty:"Hard",   tags:["Graph","DFS","DP"],         problem:`Return length of longest increasing path in matrix.\n\nExample: Input: matrix=[[9,9,4],[6,6,8],[2,1,1]] → Output: 4 (1→2→6→9)` },
  { id:99, title:"Text Justification",               difficulty:"Hard",   tags:["String","Greedy"],          problem:`Format text so each line has exactly maxWidth characters and is fully justified.\n\nExample: words=["What","must","be"], maxWidth=16 → ["What   must  be"]` },
  { id:100,title:"Alien Dictionary",                 difficulty:"Hard",   tags:["Graph","Topological Sort"], problem:`Derive character order from sorted alien language words.\n\nExample: Input: words=["wrt","wrf","er","ett","rftt"] → Output: "wertf"` },
];

export function getRandomProblem(difficulty = null) {
  const pool = difficulty
    ? BATTLE_PROBLEMS.filter(p => p.difficulty === difficulty)
    : BATTLE_PROBLEMS;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Create room ───────────────────────────────────────────────
export async function createRoom({ userId, userName, timeLimit, maxPlayers, problemId }) {
  const code    = generateRoomCode();
  const problem = problemId
    ? BATTLE_PROBLEMS.find(p => p.id === problemId) || getRandomProblem()
    : getRandomProblem();

  const { data, error } = await supabase.from("battle_rooms").insert({
    id:              code,
    problem_id:      problem.id,
    problem_title:   problem.title,
    problem_text:    problem.problem,
    difficulty:      problem.difficulty,
    time_limit:      timeLimit,
    max_players:     maxPlayers,
    status:          "waiting",
    created_by:      userId,
    created_by_name: userName,
  }).select().single();

  if (error) throw error;

  // Creator joins as first player
  await supabase.from("battle_players").insert({
    room_id: code, user_id: userId, name: userName, lang: "cpp",
  });

  return { ...data, problem };
}

// ── Join room ─────────────────────────────────────────────────
export async function joinRoom({ roomCode, userId, userName }) {
  const code = roomCode.toUpperCase().trim();

  const { data: room, error: re } = await supabase
    .from("battle_rooms").select("*").eq("id", code).single();
  if (re) throw new Error("Room not found!");
  if (room.status === "done") throw new Error("Battle already finished!");
  if (room.status === "active") throw new Error("Battle already started!");

  // Check if already joined
  const { data: existing } = await supabase
    .from("battle_players").select("id").eq("room_id", code).eq("user_id", userId).single();
  if (existing) throw new Error("You already joined this room!");

  // Check max players
  const { data: players } = await supabase
    .from("battle_players").select("id").eq("room_id", code);
  if (players.length >= room.max_players) throw new Error(`Room is full! (${room.max_players} players max)`);

  await supabase.from("battle_players").insert({
    room_id: code, user_id: userId, name: userName, lang: "cpp",
  });

  return room;
}

// ── Start battle (creator only) ───────────────────────────────
export async function startBattle(roomCode) {
  const { error } = await supabase.from("battle_rooms")
    .update({ status: "active", started_at: new Date().toISOString() })
    .eq("id", roomCode);
  if (error) throw error;
}

// ── Update my code ────────────────────────────────────────────
export async function updateMyCode({ roomCode, userId, code }) {
  await supabase.from("battle_players")
    .update({ code })
    .eq("room_id", roomCode).eq("user_id", userId);
}

// ── Update my language ────────────────────────────────────────
export async function updateMyLang({ roomCode, userId, lang }) {
  await supabase.from("battle_players")
    .update({ lang })
    .eq("room_id", roomCode).eq("user_id", userId);
}

// ── Submit solution ───────────────────────────────────────────
export async function submitSolution({ roomCode, userId, code, lang }) {
  await supabase.from("battle_players").update({
    code, lang, submitted: true,
    submit_time: new Date().toISOString(),
  }).eq("room_id", roomCode).eq("user_id", userId);
}

// ── AI Judge all solutions ────────────────────────────────────
export async function judgeAllSolutions({ room, players }) {
  const submissions = players.map((p, i) =>
    `Player ${i+1} (${p.name}) [${p.lang || "cpp"}]:\n${p.code || "(no submission)"}`
  ).join("\n\n---\n\n");

  const prompt = `You are a code judge. Given a LeetCode problem and ${players.length} solutions, rank all players.

Problem: ${room.problem_title}
${room.problem_text}

${submissions}

Return ONLY valid JSON:
{
  "rankings": [
    { "player_name": "name", "rank": 1, "score": 95, "verdict": "Correct", "reason": "one sentence" },
    { "player_name": "name", "rank": 2, "score": 70, "verdict": "Partial", "reason": "one sentence" }
  ],
  "summary": "one sentence about the overall battle"
}

Rank 1 = best. Score 0-100. Verdict: Correct / Partial / Incorrect / No Submission.
Judge fairly regardless of language used. Be strict but constructive.`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1, max_tokens: 1000,
      response_format: { type: "json_object" },
    }),
  });
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

// ── Save results to DB ────────────────────────────────────────
export async function saveResults({ roomCode, rankings, players }) {
  for (const r of rankings) {
    const player = players.find(p => p.name === r.player_name);
    if (!player) continue;
    await supabase.from("battle_players").update({
      rank: r.rank, score: r.score, verdict: r.verdict,
    }).eq("room_id", roomCode).eq("user_id", player.user_id);
  }
  await supabase.from("battle_rooms").update({ status: "done" }).eq("id", roomCode);
}