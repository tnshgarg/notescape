/**
 * Seed script for NST data
 * Creates sample subjects, notes, and teacher personas
 * Run: node seedNstData.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const NstSubject = require('./models/NstSubject');
const NstTeacherPersona = require('./models/NstTeacherPersona');

dotenv.config();

// Teacher Personas with different teaching styles
const teacherPersonas = [
  {
    name: 'Dr. Maya Scholar',
    title: 'Professor of Computer Science',
    avatar: '👩‍🏫',
    style: 'academic',
    description: 'Formal, comprehensive explanations with references to theory and research.',
    personality: 'Precise, methodical, thorough',
    systemPrompt: `You are Dr. Maya Scholar, an experienced professor who teaches in a formal academic style.

Your approach:
- Use precise technical terminology with clear definitions
- Reference foundational theories and seminal papers
- Provide structured explanations with clear logical flow
- Include proofs or formal reasoning when applicable
- Relate concepts to the broader field of study

Always maintain an encouraging but professional tone. Help students develop rigorous thinking.`,
    subjects: ['CS301', 'CS401', 'CS501'],
    accentColor: '#6366f1',
    isDefault: true
  },
  {
    name: 'Alex Coder',
    title: 'Senior Software Engineer',
    avatar: '👨‍💻',
    style: 'practical',
    description: 'Hands-on approach with real code examples and industry insights.',
    personality: 'Practical, code-focused, industry-aware',
    systemPrompt: `You are Alex Coder, a senior software engineer who teaches through practical examples.

Your approach:
- Use real-world code examples and snippets
- Share industry best practices and common patterns
- Explain concepts through practical implementation
- Discuss trade-offs and when to use what
- Include tips about debugging and optimization

Keep explanations grounded in "what you'd actually do in a job." Use informal but professional language.`,
    subjects: ['CS301', 'CS302', 'CS401'],
    accentColor: '#22c55e'
  },
  {
    name: 'Prof. Aria Thinker',
    title: 'Philosophy of Computing',
    avatar: '🤔',
    style: 'socratic',
    description: 'Guides you to discover answers through thoughtful questions.',
    personality: 'Inquisitive, patient, thought-provoking',
    systemPrompt: `You are Prof. Aria Thinker, who uses the Socratic method to teach.

Your approach:
- Ask guiding questions instead of giving direct answers
- Help students discover concepts through reasoning
- Challenge assumptions gently
- Build understanding step by step
- Celebrate "aha moments"

Start responses with a question that leads toward the answer. Only provide direct explanations if the student is stuck after multiple attempts.`,
    subjects: ['CS301', 'CS401', 'PHI101'],
    accentColor: '#f59e0b'
  },
  {
    name: 'Sam Sketcher',
    title: 'Visual Learning Specialist',
    avatar: '🎨',
    style: 'visual',
    description: 'Explains concepts using diagrams, analogies, and visual metaphors.',
    personality: 'Creative, visual, analogy-driven',
    systemPrompt: `You are Sam Sketcher, who excels at making complex concepts visual and intuitive.

Your approach:
- Use ASCII diagrams and visual representations
- Create memorable analogies to everyday objects
- Break down complex ideas into simple visual steps
- Use metaphors that make abstract concepts tangible
- Describe what things "look like" conceptually

Make heavy use of formatting to create visual structure. Think of yourself as drawing pictures with words.`,
    subjects: ['CS301', 'CS302', 'MATH201'],
    accentColor: '#ec4899'
  }
];

// Sample ADA subject with lecture notes (mirrors NST portal structure)
const sampleSubjects = [
  {
    name: 'ADA - Algorithm Design & Analysis',
    code: 'CS301',
    description: 'Advanced algorithms including dynamic programming, greedy algorithms, and graph algorithms.',
    semester: 3,
    icon: '🔢',
    color: '#6366f1',
    isNstOfficial: true,
    notes: [
      {
        title: '2D Dynamic Programming (2D DP)',
        description: 'Understanding 2D DP with grid problems and optimization',
        duration: '1:30:00',
        hasAttachment: true,
        xpValue: 30,
        order: 0,
        content: `# 2D Dynamic Programming

## Introduction
2D Dynamic Programming extends the concept of 1D DP to problems that require a two-dimensional state space. These problems often involve grids, two sequences, or situations where we need to track two variables.

## When to Use 2D DP
- Grid traversal problems (finding paths)
- String comparison problems (edit distance, LCS)
- Subset problems with two constraints
- Game theory problems with two players

## Common Patterns

### Grid Path Problems
Given an m×n grid, find the number of ways to reach from (0,0) to (m-1,n-1).

\`\`\`python
def uniquePaths(m, n):
    dp = [[1] * n for _ in range(m)]
    for i in range(1, m):
        for j in range(1, n):
            dp[i][j] = dp[i-1][j] + dp[i][j-1]
    return dp[m-1][n-1]
\`\`\`

### Longest Common Subsequence (LCS)
Find the longest subsequence present in both strings.

\`\`\`python
def lcs(X, Y):
    m, n = len(X), len(Y)
    dp = [[0] * (n+1) for _ in range(m+1)]
    
    for i in range(1, m+1):
        for j in range(1, n+1):
            if X[i-1] == Y[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    
    return dp[m][n]
\`\`\`

## Key Takeaways
1. Identify the two dimensions of state
2. Define the recurrence relation
3. Handle base cases carefully
4. Choose iteration order based on dependencies`
      },
      {
        title: 'Greedy Algorithms',
        description: 'Making locally optimal choices for globally optimal solutions',
        duration: '1:30:00',
        hasAttachment: true,
        xpValue: 30,
        order: 1,
        content: `# Greedy Algorithms

## What is Greedy?
A greedy algorithm makes the locally optimal choice at each step, hoping to find a global optimum. Unlike DP, greedy doesn't reconsider previous choices.

## When Greedy Works
Greedy works when:
1. **Greedy Choice Property**: A global optimum can be reached by making locally optimal choices
2. **Optimal Substructure**: An optimal solution contains optimal solutions to subproblems

## Classic Examples

### Activity Selection
Given activities with start and end times, select maximum non-overlapping activities.

\`\`\`python
def activitySelection(activities):
    # Sort by end time
    activities.sort(key=lambda x: x[1])
    
    selected = [activities[0]]
    last_end = activities[0][1]
    
    for start, end in activities[1:]:
        if start >= last_end:
            selected.append((start, end))
            last_end = end
    
    return selected
\`\`\`

### Huffman Coding
Build optimal prefix-free codes for data compression.

### Fractional Knapsack
Unlike 0/1 knapsack, we can take fractions of items.

## Proving Greedy Correctness
1. Show greedy choice is part of some optimal solution
2. Show that combining greedy choice with optimal solution to reduced problem gives optimal solution to original

## Greedy vs Dynamic Programming
| Aspect | Greedy | DP |
|--------|--------|-----|
| Approach | Top-down, make choice first | Bottom-up, solve subproblems first |
| Efficiency | Usually O(n log n) | Often O(n²) or more |
| Applicability | Limited problems | Broader applicability |`
      },
      {
        title: 'Graph Algorithms - DFS & BFS',
        description: 'Depth-first and breadth-first traversal techniques',
        duration: '1:45:00',
        hasAttachment: true,
        xpValue: 30,
        order: 2,
        content: `# Graph Traversal: DFS & BFS

## Depth-First Search (DFS)
Explores as far as possible along each branch before backtracking.

### Implementation
\`\`\`python
def dfs(graph, start, visited=None):
    if visited is None:
        visited = set()
    
    visited.add(start)
    print(start, end=' ')
    
    for neighbor in graph[start]:
        if neighbor not in visited:
            dfs(graph, neighbor, visited)
\`\`\`

### Applications
- Cycle detection
- Topological sorting
- Finding connected components
- Path finding in mazes

## Breadth-First Search (BFS)
Explores all neighbors before moving to the next level.

### Implementation
\`\`\`python
from collections import deque

def bfs(graph, start):
    visited = {start}
    queue = deque([start])
    
    while queue:
        vertex = queue.popleft()
        print(vertex, end=' ')
        
        for neighbor in graph[vertex]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
\`\`\`

### Applications
- Shortest path in unweighted graphs
- Level-order traversal
- Finding connected components
- Web crawling

## Comparison
| Feature | DFS | BFS |
|---------|-----|-----|
| Data Structure | Stack (recursion) | Queue |
| Space | O(h) height | O(w) width |
| Shortest Path | No | Yes (unweighted) |
| Complete | No (infinite) | Yes |`
      }
    ]
  },
  {
    name: 'DBMS - Database Management',
    code: 'CS302',
    description: 'Relational databases, SQL, normalization, and transaction management.',
    semester: 3,
    icon: '🗄️',
    color: '#22c55e',
    isNstOfficial: true,
    notes: [
      {
        title: 'Introduction to DBMS',
        description: 'What is a database and why we need DBMS',
        duration: '1:00:00',
        hasAttachment: true,
        xpValue: 25,
        order: 0,
        content: `# Introduction to Database Management Systems

## What is a Database?
A database is an organized collection of structured information or data, typically stored electronically.

## Why DBMS?
- Data redundancy control
- Data consistency
- Data sharing
- Data security
- Data integrity

## DBMS Architecture
Three-level architecture:
1. **External Level**: User views
2. **Conceptual Level**: Logical structure
3. **Internal Level**: Physical storage

## Types of DBMS
- Relational (MySQL, PostgreSQL)
- NoSQL (MongoDB, Redis)
- Object-oriented
- Hierarchical`
      },
      {
        title: 'SQL Fundamentals',
        description: 'SELECT, INSERT, UPDATE, DELETE and more',
        duration: '1:30:00',
        hasAttachment: true,
        xpValue: 30,
        order: 1,
        content: `# SQL Fundamentals

## Basic Queries

### SELECT Statement
\`\`\`sql
SELECT column1, column2
FROM table_name
WHERE condition
ORDER BY column1;
\`\`\`

### INSERT Statement
\`\`\`sql
INSERT INTO table_name (col1, col2)
VALUES (val1, val2);
\`\`\`

### UPDATE Statement
\`\`\`sql
UPDATE table_name
SET column1 = value1
WHERE condition;
\`\`\`

### DELETE Statement
\`\`\`sql
DELETE FROM table_name
WHERE condition;
\`\`\`

## Joins
- INNER JOIN
- LEFT JOIN
- RIGHT JOIN
- FULL OUTER JOIN`
      }
    ]
  }
];

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await NstTeacherPersona.deleteMany({});
    await NstSubject.deleteMany({});
    console.log('Cleared existing NST data');

    // Create teacher personas
    const teachers = await NstTeacherPersona.insertMany(teacherPersonas);
    console.log(`Created ${teachers.length} teacher personas:`);
    teachers.forEach(t => console.log(`  - ${t.name} (${t.style})`));

    // Create subjects with notes
    for (const subjectData of sampleSubjects) {
      const subject = new NstSubject({
        ...subjectData,
        teacherPersonas: teachers.map(t => t._id)
      });
      await subject.save();
      console.log(`Created subject: ${subject.name} with ${subject.notes.length} notes`);
    }

    console.log('\n✅ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seedData();
