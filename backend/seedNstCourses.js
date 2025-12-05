/**
 * Seed script for NST Course data
 * Run: node seedNstCourses.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const NstCourse = require('./models/NstCourse');

dotenv.config();

const mockCourses = [
  // Semester 1
  {
    semester: 1,
    subject: 'Introduction to Business',
    subjectCode: 'BUS101',
    description: 'Fundamentals of business concepts, organizational structures, and entrepreneurship basics.',
    coverImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400',
    units: [
      {
        title: 'Unit 1: Business Fundamentals',
        description: 'Core concepts of what makes a business',
        order: 0,
        topics: [
          {
            title: 'What is Business?',
            description: 'Understanding the definition and scope of business',
            content: `# What is Business?

Business refers to any activity that involves the production, distribution, or sale of goods and services with the primary goal of earning profit. It encompasses a wide range of activities undertaken by individuals or organizations.

## Key Characteristics of Business:
1. **Economic Activity**: Business is fundamentally an economic activity focused on creating value.
2. **Profit Motive**: The primary objective is generating profit to sustain operations.
3. **Risk and Uncertainty**: Every business involves some degree of risk.
4. **Continuity**: Business operations are ongoing, not one-time activities.

## Types of Business Activities:
- **Industry**: Manufacturing, extraction, and construction
- **Commerce**: Trade and auxiliaries to trade
- **Service**: Professional and personal services

## Business Environment:
The business environment includes all internal and external factors that affect a company's operating situation. This includes economic conditions, government policies, technology, and social trends.`,
            order: 0,
            externalRefs: ['https://www.investopedia.com/terms/b/business.asp']
          },
          {
            title: 'Forms of Business Organization',
            description: 'Sole proprietorship, partnership, and corporations',
            content: `# Forms of Business Organization

Different legal structures exist for organizing a business, each with its own advantages and disadvantages.

## 1. Sole Proprietorship
A business owned and operated by a single individual.
- **Pros**: Easy to set up, complete control, all profits go to owner
- **Cons**: Unlimited liability, limited capital, limited skills

## 2. Partnership
A business owned by two or more individuals who share responsibilities.
- **Pros**: Shared responsibility, more capital, diverse skills
- **Cons**: Shared liability, potential conflicts, limited life

## 3. Corporation
A legal entity separate from its owners.
- **Pros**: Limited liability, perpetual existence, easy capital raising
- **Cons**: Complex regulations, double taxation, expensive to set up

## 4. Limited Liability Company (LLC)
A hybrid structure combining features of corporations and partnerships.
- **Pros**: Limited liability, tax flexibility, operational flexibility
- **Cons**: Self-employment taxes, varying state laws`,
            order: 1,
            externalRefs: []
          }
        ]
      },
      {
        title: 'Unit 2: Business Environment',
        description: 'Internal and external factors affecting business',
        order: 1,
        topics: [
          {
            title: 'Internal Business Environment',
            description: 'Factors within the organization',
            content: `# Internal Business Environment

The internal environment consists of factors within the organization that affect its ability to achieve its objectives.

## Key Internal Factors:

### 1. Organizational Culture
The shared values, beliefs, and practices that shape behavior within the organization.

### 2. Resources
- **Human Resources**: Skills, knowledge, and capabilities of employees
- **Financial Resources**: Available capital and funding
- **Physical Resources**: Equipment, facilities, and technology

### 3. Management Structure
The hierarchy and decision-making processes within the organization.

### 4. Corporate Governance
The system of rules and practices by which a company is directed and controlled.

## Importance of Internal Environment:
Understanding internal factors helps organizations leverage strengths and address weaknesses effectively.`,
            order: 0,
            externalRefs: []
          }
        ]
      }
    ]
  },
  {
    semester: 1,
    subject: 'Financial Accounting',
    subjectCode: 'ACC101',
    description: 'Basic principles of financial accounting, balance sheets, and financial statements.',
    coverImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
    units: [
      {
        title: 'Unit 1: Introduction to Accounting',
        description: 'Fundamentals of accounting principles',
        order: 0,
        topics: [
          {
            title: 'What is Accounting?',
            description: 'Understanding the accounting discipline',
            content: `# What is Accounting?

Accounting is the systematic process of recording, analyzing, and reporting financial transactions of a business.

## Functions of Accounting:
1. **Recording**: Maintaining systematic records of all financial transactions
2. **Classifying**: Organizing transactions into categories
3. **Summarizing**: Preparing financial statements
4. **Interpreting**: Analyzing financial data for decision-making

## Branches of Accounting:
- **Financial Accounting**: External reporting to stakeholders
- **Management Accounting**: Internal reporting for decision-making
- **Cost Accounting**: Tracking production costs
- **Tax Accounting**: Preparing tax returns and planning

## Accounting Equation:
Assets = Liabilities + Owner's Equity

This fundamental equation forms the basis of double-entry bookkeeping.`,
            order: 0,
            externalRefs: ['https://www.accountingcoach.com/accounting-basics/explanation']
          },
          {
            title: 'Journal Entries',
            description: 'Recording transactions in the journal',
            content: `# Journal Entries

A journal entry is the first step in the accounting cycle, where business transactions are recorded.

## Components of a Journal Entry:
1. **Date**: When the transaction occurred
2. **Accounts**: Which accounts are affected
3. **Debit Amount**: Amount to be debited
4. **Credit Amount**: Amount to be credited
5. **Narration**: Brief description of the transaction

## Rules of Debit and Credit:

### For Real Accounts:
- Debit what comes IN
- Credit what goes OUT

### For Personal Accounts:
- Debit the receiver
- Credit the giver

### For Nominal Accounts:
- Debit all expenses and losses
- Credit all incomes and gains

## Example:
Purchase of machinery for $10,000 cash:
- Debit: Machinery $10,000
- Credit: Cash $10,000`,
            order: 1,
            externalRefs: []
          }
        ]
      }
    ]
  },
  // Semester 2
  {
    semester: 2,
    subject: 'Microeconomics',
    subjectCode: 'ECO201',
    description: 'Study of individual economic agents and their decision-making processes.',
    coverImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',
    units: [
      {
        title: 'Unit 1: Demand and Supply',
        description: 'Fundamental concepts of market economics',
        order: 0,
        topics: [
          {
            title: 'Law of Demand',
            description: 'Understanding demand curves and consumer behavior',
            content: `# Law of Demand

The Law of Demand states that, all else being equal, as the price of a product increases, quantity demanded decreases, and vice versa.

## Key Concepts:

### Demand Curve
A graphical representation showing the relationship between price and quantity demanded.
- Typically slopes downward from left to right
- Movement along the curve = change in price
- Shift of the curve = change in other factors

### Factors Affecting Demand:
1. **Price of the good**: Inverse relationship with quantity
2. **Consumer income**: More income = more demand (for normal goods)
3. **Prices of related goods**: Substitutes and complements
4. **Consumer preferences**: Tastes and trends
5. **Consumer expectations**: Future price expectations

### Elasticity of Demand:
Measures how responsive quantity demanded is to price changes.
- Elastic: Demand changes significantly with price
- Inelastic: Demand changes little with price
- Unit Elastic: Proportional change

## Formula:
Price Elasticity of Demand = % Change in Quantity Demanded / % Change in Price`,
            order: 0,
            externalRefs: ['https://www.khanacademy.org/economics-finance-domain/microeconomics']
          },
          {
            title: 'Law of Supply',
            description: 'Understanding supply curves and producer behavior',
            content: `# Law of Supply

The Law of Supply states that, all else being equal, as the price of a product increases, the quantity supplied also increases, and vice versa.

## Key Concepts:

### Supply Curve
A graphical representation showing the relationship between price and quantity supplied.
- Typically slopes upward from left to right
- Higher prices incentivize producers to supply more

### Factors Affecting Supply:
1. **Price of the good**: Direct relationship with quantity
2. **Production costs**: Higher costs = lower supply
3. **Technology**: Better technology = more efficient production
4. **Number of suppliers**: More suppliers = more supply
5. **Government policies**: Taxes, subsidies, regulations

### Market Equilibrium:
The point where supply equals demand.
- Equilibrium price: Price at which Qs = Qd
- Equilibrium quantity: Quantity traded at equilibrium price

## Supply Schedule Example:
| Price | Quantity Supplied |
|-------|-------------------|
| $10   | 100 units        |
| $15   | 150 units        |
| $20   | 200 units        |`,
            order: 1,
            externalRefs: []
          }
        ]
      }
    ]
  },
  {
    semester: 2,
    subject: 'Business Communication',
    subjectCode: 'COM201',
    description: 'Effective communication strategies for professional environments.',
    coverImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
    units: [
      {
        title: 'Unit 1: Communication Fundamentals',
        description: 'Basics of business communication',
        order: 0,
        topics: [
          {
            title: 'The Communication Process',
            description: 'Understanding how communication works',
            content: `# The Communication Process

Communication is the process of exchanging information between parties through a common system of symbols, signs, or behavior.

## Elements of Communication:

### 1. Sender
The person who initiates the message and encodes it.

### 2. Message
The information being transmitted.

### 3. Channel
The medium through which the message is sent (email, phone, face-to-face).

### 4. Receiver
The person who receives and decodes the message.

### 5. Feedback
The response from the receiver that completes the communication loop.

### 6. Noise
Any interference that disrupts the communication process.

## Types of Business Communication:
- **Verbal**: Spoken communication
- **Non-verbal**: Body language, gestures
- **Written**: Emails, reports, memos
- **Visual**: Charts, graphs, presentations

## 7 Cs of Effective Communication:
1. Clear
2. Concise
3. Concrete
4. Correct
5. Coherent
6. Complete
7. Courteous`,
            order: 0,
            externalRefs: []
          }
        ]
      }
    ]
  }
];

async function seedCourses() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing NST courses
    await NstCourse.deleteMany({});
    console.log('Cleared existing NST courses');

    // Insert mock courses one by one (so pre-save hook runs)
    const result = [];
    for (const courseData of mockCourses) {
      const course = new NstCourse(courseData);
      await course.save();
      result.push(course);
    }
    console.log(`Inserted ${result.length} NST courses`);

    // Display summary
    for (const course of result) {
      console.log(`  - ${course.subject} (Semester ${course.semester}): ${course.totalTopics} topics`);
    }

    console.log('\nSeed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seedCourses();
