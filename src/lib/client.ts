/**
 * VivaMentor frontend demo data layer.
 *
 * This module intentionally keeps data in the current browser's localStorage.
 * It replaces the original server/database API for a portable frontend-only
 * demo. No requests, credentials, or user files are sent to a backend.
 */

type Role = "STUDENT" | "TEACHER" | "ADMIN";
type JsonRecord = Record<string, unknown>;

type DemoUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  department: string | null;
  goal: string | null;
  streak: number;
  xp: number;
  dailyAiLimit: number;
  aiUsedToday: number;
  createdAt: string;
};

type Subject = {
  id: string;
  name: string;
  department: string;
  topics: { name: string; weight: number }[];
};

type DemoDocument = {
  id: string;
  type: "resume" | "syllabus";
  fileName: string;
  chunkCount: number;
  pageCount: number;
  createdAt: string;
};

type DemoAnswer = {
  id: string;
  sessionId: string;
  questionText: string;
  topic: string;
  isFollowUp: boolean;
  score: number;
  missingPoints: string[];
  coveredPoints: string[];
  inputType: "text" | "voice";
  createdAt: string;
  userAnswer: string;
  criteria: { correctness: number; completeness: number; clarity: number; depth: number };
};

type DemoQuestion = {
  questionText: string;
  topic: string;
  difficulty: number;
  keyPoints: string[];
  isFollowUp: boolean;
  followUpCount: number;
  askedAt: string;
};

type DemoSession = {
  id: string;
  userId: string;
  mode: string;
  persona: string;
  timeLimit: number;
  questionCount: number;
  subjectId: string;
  subject: string;
  topics: string[];
  difficulty: number;
  status: "in_progress" | "completed";
  startedAt: string;
  completedAt?: string;
  totalScore: number | null;
  delivery: { avgWpm: number; fillerPerMin: number; pauses: number } | null;
  currentQuestion: DemoQuestion | null;
  answers: DemoAnswer[];
};

type Flashcard = {
  id: string;
  topic: string;
  front: string;
  back: string;
  ef: number;
  intervalDays: number;
  repetitions: number;
  dueDate: string;
};

type BankQuestion = {
  id: string;
  subject: string;
  subjectId: string;
  topic: string;
  difficulty: number;
  question: string;
  keyPoints: string[];
  source: string;
  verified: boolean;
};

type DemoState = {
  version: 1;
  users: DemoUser[];
  currentUserId: string | null;
  subjects: Subject[];
  documents: DemoDocument[];
  sessions: DemoSession[];
  cards: Flashcard[];
  reviewedToday: number;
  questionBank: BankQuestion[];
  teacherMarks: Record<string, { score: number; comment: string | null; teacher: string }>;
};

const STORAGE_KEY = "vivamentor.frontend-demo.v1";
const nowIso = () => new Date().toISOString();
const makeId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const round = (n: number, places = 1) => Number(n.toFixed(places));

const SUBJECTS: Subject[] = [
  {
    id: "subject-dbms",
    name: "DBMS",
    department: "Computer Science",
    topics: [
      { name: "Relational Model", weight: 0.18 },
      { name: "Normalization", weight: 0.2 },
      { name: "SQL & Joins", weight: 0.2 },
      { name: "Transactions", weight: 0.17 },
      { name: "Indexing", weight: 0.13 },
      { name: "Concurrency Control", weight: 0.12 },
    ],
  },
  {
    id: "subject-os",
    name: "Operating Systems",
    department: "Computer Science",
    topics: [
      { name: "Process Management", weight: 0.2 },
      { name: "Memory Management", weight: 0.2 },
      { name: "Scheduling", weight: 0.18 },
      { name: "Deadlocks", weight: 0.17 },
      { name: "File Systems", weight: 0.13 },
      { name: "Concurrency", weight: 0.12 },
    ],
  },
  {
    id: "subject-hr",
    name: "HR Interview",
    department: "Career Preparation",
    topics: [
      { name: "Introduction", weight: 0.2 },
      { name: "Strengths & Weaknesses", weight: 0.2 },
      { name: "Conflict Resolution", weight: 0.2 },
      { name: "Career Goals", weight: 0.2 },
      { name: "Teamwork", weight: 0.2 },
    ],
  },
];

function defaultState(): DemoState {
  const createdAt = nowIso();
  return {
    version: 1,
    currentUserId: null,
    users: [
      { id: "demo-student", name: "Ayesha Khan", email: "student@vivamentor.edu", password: "Study@123", role: "STUDENT", department: "Computer Science", goal: "Clear the DBMS viva", streak: 4, xp: 260, dailyAiLimit: 40, aiUsedToday: 3, createdAt },
      { id: "demo-teacher", name: "Dr. Ahmed Raza", email: "teacher@vivamentor.edu", password: "Teach@1234", role: "TEACHER", department: "Computer Science", goal: "Prepare my class for externals", streak: 2, xp: 80, dailyAiLimit: 100, aiUsedToday: 8, createdAt },
      { id: "demo-admin", name: "System Administrator", email: "admin@vivamentor.edu", password: "Admin@123", role: "ADMIN", department: "Administration", goal: null, streak: 0, xp: 0, dailyAiLimit: 200, aiUsedToday: 12, createdAt },
    ],
    subjects: SUBJECTS,
    documents: [],
    sessions: [],
    cards: [
      { id: "card-1", topic: "Normalization", front: "What is database normalization?", back: "Normalization organizes relational data to reduce redundancy and avoid insertion, update, and deletion anomalies.", ef: 2.5, intervalDays: 1, repetitions: 0, dueDate: createdAt },
      { id: "card-2", topic: "SQL & Joins", front: "What is the difference between INNER JOIN and LEFT JOIN?", back: "INNER JOIN returns matching rows from both tables. LEFT JOIN keeps every row from the left table and fills missing right-side values with NULL.", ef: 2.5, intervalDays: 1, repetitions: 0, dueDate: createdAt },
      { id: "card-3", topic: "Transactions", front: "Name the ACID properties.", back: "Atomicity, Consistency, Isolation, and Durability.", ef: 2.5, intervalDays: 1, repetitions: 0, dueDate: createdAt },
    ],
    reviewedToday: 0,
    questionBank: [
      { id: "bank-1", subject: "DBMS", subjectId: "subject-dbms", topic: "Normalization", difficulty: 3, question: "Explain the purpose of normalization and describe the difference between 2NF and 3NF.", keyPoints: ["reduces redundancy", "prevents anomalies", "partial dependency", "transitive dependency"], source: "faculty", verified: true },
      { id: "bank-2", subject: "DBMS", subjectId: "subject-dbms", topic: "Transactions", difficulty: 3, question: "Explain the ACID properties with a practical example.", keyPoints: ["atomicity", "consistency", "isolation", "durability"], source: "faculty", verified: true },
      { id: "bank-3", subject: "Operating Systems", subjectId: "subject-os", topic: "Deadlocks", difficulty: 4, question: "What are the four necessary conditions for a deadlock?", keyPoints: ["mutual exclusion", "hold and wait", "no preemption", "circular wait"], source: "faculty", verified: true },
    ],
    teacherMarks: {},
  };
}

function readState(): DemoState {
  if (typeof window === "undefined") throw new Error("Demo data is available in the browser only.");
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState;
      if (parsed.version === 1 && Array.isArray(parsed.users) && Array.isArray(parsed.sessions)) return parsed;
    }
  } catch {
    // Recover from malformed or unavailable local demo data.
  }
  const state = defaultState();
  writeState(state);
  return state;
}

function writeState(state: DemoState) {
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function currentUser(state: DemoState): DemoUser {
  const user = state.users.find((item) => item.id === state.currentUserId);
  if (!user) throw new Error("Please sign in to continue.");
  return user;
}

function publicUser(user: DemoUser) {
  const { password: _password, aiUsedToday: _aiUsedToday, ...safe } = user;
  return safe;
}

function getSession(state: DemoState, id: string): DemoSession {
  const session = state.sessions.find((item) => item.id === id && item.userId === currentUser(state).id);
  if (!session) throw new Error("Session not found.");
  return session;
}

function sessionSummary(session: DemoSession) {
  return {
    id: session.id,
    mode: session.mode,
    persona: session.persona,
    subject: session.subject,
    status: session.status,
    totalScore: session.totalScore,
    startedAt: session.startedAt,
    delivery: session.delivery,
    timeLimit: session.timeLimit,
    questionCount: session.questionCount,
  };
}

function generateQuestion(session: DemoSession, state: DemoState): DemoQuestion {
  const index = session.answers.length;
  const topic = session.topics[index % Math.max(1, session.topics.length)] ?? "Core concepts";
  const bankItem = state.questionBank.find((item) => item.subjectId === session.subjectId && item.topic === topic && item.verified);
  const topicQuestions: Record<string, string> = {
    "Relational Model": "Explain the relational model. What are relations, tuples, attributes, and candidate keys?",
    Normalization: "Why is normalization important in relational database design? Explain 2NF and 3NF.",
    "SQL & Joins": "Compare INNER JOIN, LEFT JOIN, and FULL OUTER JOIN with an example.",
    Transactions: "What are the ACID properties, and why are they important for database transactions?",
    Indexing: "How does a database index improve query performance, and what are its trade-offs?",
    "Concurrency Control": "What problems can occur when transactions execute concurrently, and how can they be prevented?",
    "Process Management": "Explain the difference between a process and a thread.",
    "Memory Management": "What is virtual memory, and how does demand paging work?",
    Scheduling: "Compare preemptive and non-preemptive CPU scheduling.",
    Deadlocks: "Describe the four necessary conditions for a deadlock.",
    "File Systems": "Explain how a file system organizes and stores files on disk.",
    Concurrency: "What is a race condition, and how can synchronization prevent it?",
    Introduction: "Tell me about yourself and the experiences most relevant to this opportunity.",
    "Strengths & Weaknesses": "What is one professional strength you rely on, and one area you are actively improving?",
    "Conflict Resolution": "Describe how you would handle a disagreement with a teammate.",
    "Career Goals": "Where would you like your career to be in three years, and why?",
    Teamwork: "Tell me about a time you contributed to a team goal.",
  };
  const defaults = [
    `Define ${topic} and explain why it matters.`,
    `Describe the main principles of ${topic} and give a practical example.`,
    `What common mistakes arise when working with ${topic}, and how would you avoid them?`,
  ];
  return {
    questionText: bankItem?.question ?? topicQuestions[topic] ?? defaults[index % defaults.length],
    topic,
    difficulty: session.difficulty,
    keyPoints: bankItem?.keyPoints ?? keyPointsForTopic(topic),
    isFollowUp: false,
    followUpCount: 0,
    askedAt: nowIso(),
  };
}

function keyPointsForTopic(topic: string): string[] {
  const map: Record<string, string[]> = {
    Normalization: ["reduces redundancy", "prevents anomalies", "functional dependencies", "normal forms"],
    Transactions: ["atomicity", "consistency", "isolation", "durability"],
    "SQL & Joins": ["matching rows", "join condition", "NULL values", "practical example"],
    "Relational Model": ["relations", "tuples", "attributes", "keys"],
    Deadlocks: ["mutual exclusion", "hold and wait", "no preemption", "circular wait"],
  };
  return map[topic] ?? ["clear definition", "key principles", "relevant example", "limitations or trade-offs"];
}

function progressData(state: DemoState, user: DemoUser) {
  const sessions = state.sessions.filter((item) => item.userId === user.id);
  const completed = sessions.filter((item) => item.status === "completed");
  const allAnswers = completed.flatMap((item) => item.answers.map((answer) => ({ ...answer, sessionId: item.id })));
  const readiness = state.subjects.map((subject) => {
    const answers = allAnswers.filter((answer) => subject.topics.some((topic) => topic.name === answer.topic));
    const perTopic = subject.topics.map((topic) => {
      const attempts = answers.filter((answer) => answer.topic === topic.name);
      const avg = attempts.length ? attempts.reduce((sum, answer) => sum + answer.score, 0) / attempts.length : 6.2;
      const strength = round(avg / 10 * 10, 1);
      return { topic: topic.name, effectiveStrength: strength, strength, attempts: attempts.length, weight: topic.weight };
    });
    const index = round(perTopic.reduce((sum, topic) => sum + topic.effectiveStrength * (topic.weight * 10), 0));
    const topFixes = perTopic.slice().sort((a, b) => a.effectiveStrength - b.effectiveStrength).slice(0, 3).map((topic) => ({ topic: topic.topic, contribution: topic.weight, effectiveStrength: topic.effectiveStrength }));
    return {
      subjectId: subject.id,
      subject: subject.name,
      index,
      band: index >= 75 ? "green" : index >= 55 ? "amber" : "red",
      perTopic,
      topFixes,
    };
  });
  const trend = completed.map((session) => ({
    date: session.completedAt ?? session.startedAt,
    score: session.totalScore ?? 0,
    subject: session.subject,
    sessionId: session.id,
  }));
  const days = Array.from({ length: 84 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (83 - index));
    const dayKey = date.toISOString().slice(0, 10);
    const count = sessions.filter((session) => session.startedAt.slice(0, 10) === dayKey).length;
    return { date: dayKey, count };
  });
  const avgScore = completed.length ? round(completed.reduce((sum, session) => sum + (session.totalScore ?? 0), 0) / completed.length) : null;
  const recommended = readiness.flatMap((item) => item.perTopic.filter((topic) => topic.effectiveStrength < 7).map((topic) => ({ topic: topic.topic, subject: item.subject, strength: topic.effectiveStrength, attempts: topic.attempts })));
  return {
    streak: user.streak,
    xp: user.xp,
    trend,
    readiness,
    recommended: recommended.slice(0, 5),
    badges: completed.length ? [{ type: "first_session", earnedAt: completed[0].completedAt ?? completed[0].startedAt }] : [],
    recentAnswers: allAnswers.slice(-30).map((answer) => ({
      id: answer.id, sessionId: answer.sessionId, topic: answer.topic, questionText: answer.questionText,
      score: answer.score, isFollowUp: answer.isFollowUp, inputType: answer.inputType, createdAt: answer.createdAt,
      missingPoints: answer.missingPoints, coveredPoints: answer.coveredPoints,
    })),
    heatmap: days,
    sessionCount: sessions.length,
    avgScore,
  };
}

function calibrationData(state: DemoState, subjectId: string) {
  const subject = state.subjects.find((item) => item.id === subjectId) ?? state.subjects[0];
  const answers = state.sessions.flatMap((session) => session.answers.map((answer) => ({ answer, session })))
    .filter(({ answer, session }) => session.subjectId === subject.id);
  const sample = answers.slice(-8).map(({ answer, session }) => ({
    id: answer.id,
    student: state.users.find((user) => user.id === session.userId)?.name ?? "Demo student",
    topic: answer.topic,
    question: answer.questionText,
    answerExcerpt: answer.userAnswer.slice(0, 220),
    aiScore: answer.score,
    teacherMark: state.teacherMarks[answer.id] ?? null,
  }));
  const marked = sample.filter((item) => item.teacherMark);
  const diffs = marked.map((item) => item.teacherMark!.score - item.aiScore);
  return {
    subject: { id: subject.id, name: subject.name },
    markedCount: marked.length,
    correlation: marked.length > 1 ? 0.92 : null,
    meanDiff: diffs.length ? round(diffs.reduce((sum, item) => sum + item, 0) / diffs.length) : null,
    bias: diffs.length ? (diffs.reduce((sum, item) => sum + item, 0) > 0 ? "AI scores lower" : "AI scores higher") : null,
    targetCorrelation: 0.8,
    topicBias: subject.topics.map((topic) => ({ topic: topic.name, meanDiff: 0, count: 0 })),
    sample,
  };
}

function readBody(init?: RequestInit): JsonRecord {
  if (!init?.body || typeof init.body !== "string") return {};
  try { return JSON.parse(init.body) as JsonRecord; } catch { return {}; }
}

function dateAfter(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

async function mockApi(path: string, init?: RequestInit): Promise<unknown> {
  const state = readState();
  const method = (init?.method ?? "GET").toUpperCase();
  const body = readBody(init);

  if (path === "/api/auth/login" && method === "POST") {
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const user = state.users.find((item) => item.email.toLowerCase() === email && item.password === password);
    if (!user) throw new Error("Invalid email or password. Use a demo account or register a new one.");
    state.currentUserId = user.id;
    writeState(state);
    return { user: publicUser(user) };
  }

  if (path === "/api/auth/register" && method === "POST") {
    const email = String(body.email ?? "").trim().toLowerCase();
    if (state.users.some((item) => item.email.toLowerCase() === email)) throw new Error("An account with this email already exists.");
    const role = body.role === "TEACHER" ? "TEACHER" : "STUDENT";
    const user: DemoUser = {
      id: makeId("user"), name: String(body.name ?? "New user"), email,
      password: String(body.password ?? ""), role,
      department: String(body.department ?? "") || null,
      goal: String(body.goal ?? "") || null,
      streak: 0, xp: 0, dailyAiLimit: 40, aiUsedToday: 0, createdAt: nowIso(),
    };
    state.users.push(user);
    state.currentUserId = user.id;
    writeState(state);
    return { user: publicUser(user) };
  }

  if (path === "/api/auth/me") {
    const user = currentUser(state);
    return { user: publicUser(user), dueCards: state.cards.length, aiUsed: user.aiUsedToday };
  }
  if (path === "/api/auth/logout" && method === "POST") {
    state.currentUserId = null;
    writeState(state);
    return { ok: true };
  }

  if (path === "/api/subjects") return { subjects: state.subjects };

  if (path === "/api/documents" && method === "GET") {
    currentUser(state);
    return { documents: state.documents };
  }
  if (path === "/api/documents" && method === "POST") {
    currentUser(state);
    const file = init?.body instanceof FormData ? init.body.get("file") : null;
    const typeValue = init?.body instanceof FormData ? init.body.get("type") : "resume";
    if (!(file instanceof File)) throw new Error("Choose a document to upload.");
    if (file.size > 8 * 1024 * 1024) throw new Error("The demo upload limit is 8 MB.");
    const doc: DemoDocument = {
      id: makeId("doc"), type: typeValue === "syllabus" ? "syllabus" : "resume",
      fileName: file.name, chunkCount: 1, pageCount: 1, createdAt: nowIso(),
    };
    state.documents.push(doc);
    writeState(state);
    return { document: doc };
  }
  const deleteDoc = path.match(/^\/api\/documents\/([^/?]+)$/);
  if (deleteDoc && method === "DELETE") {
    currentUser(state);
    state.documents = state.documents.filter((doc) => doc.id !== deleteDoc[1]);
    writeState(state);
    return { ok: true };
  }

  if (path === "/api/sessions" && method === "GET") {
    const user = currentUser(state);
    return { sessions: state.sessions.filter((session) => session.userId === user.id).sort((a, b) => b.startedAt.localeCompare(a.startedAt)).map(sessionSummary) };
  }
  if (path === "/api/sessions" && method === "POST") {
    const user = currentUser(state);
    const subject = state.subjects.find((item) => item.id === body.subjectId) ?? state.subjects[0];
    const session: DemoSession = {
      id: makeId("session"), userId: user.id,
      mode: String(body.mode ?? "viva"), persona: String(body.persona ?? "friendly"),
      timeLimit: Number(body.timeLimit ?? 120), questionCount: Math.max(1, Math.min(20, Number(body.questionCount ?? 5))),
      subjectId: subject.id, subject: subject.name,
      topics: Array.isArray(body.topics) ? body.topics.map(String) : subject.topics.map((topic) => topic.name),
      difficulty: Number(body.difficulty ?? 3), status: "in_progress", startedAt: nowIso(),
      totalScore: null, delivery: null, currentQuestion: null, answers: [],
    };
    state.sessions.unshift(session);
    user.aiUsedToday += 1;
    writeState(state);
    return { session: { id: session.id } };
  }

  const questionMatch = path.match(/^\/api\/sessions\/([^/]+)\/question$/);
  if (questionMatch && method === "GET") {
    const session = getSession(state, questionMatch[1]);
    if (session.answers.length >= session.questionCount || session.status === "completed") return { done: true };
    if (!session.currentQuestion) session.currentQuestion = generateQuestion(session, state);
    writeState(state);
    return { done: false, question: session.currentQuestion };
  }

  const answerMatch = path.match(/^\/api\/sessions\/([^/]+)\/answer$/);
  if (answerMatch && method === "POST") {
    const user = currentUser(state);
    const session = getSession(state, answerMatch[1]);
    const question = session.currentQuestion ?? generateQuestion(session, state);
    const answerText = String(body.userAnswer ?? "");
    const terms = question.keyPoints;
    const lower = answerText.toLowerCase();
    const covered = terms.filter((term) => lower.includes(term.toLowerCase().split(" ")[0]));
    const missing = terms.filter((term) => !covered.includes(term));
    const completeness = answerText.length < 30 ? 3 : Math.min(9, 4 + covered.length * 1.2);
    const clarity = answerText.length < 25 ? 3 : Math.min(9, 5 + Math.min(4, answerText.split(/\s+/).length / 18));
    const correctness = Math.min(9, 4 + covered.length * 1.3 + (answerText.length > 100 ? 1 : 0));
    const depth = Math.min(9, 3.5 + covered.length * 1.1 + (answerText.length > 160 ? 1 : 0));
    const score = round((correctness * 0.4 + completeness * 0.25 + clarity * 0.2 + depth * 0.15));
    const criteria = { correctness: round(correctness), completeness: round(completeness), clarity: round(clarity), depth: round(depth) };
    const evaluation = {
      criteria, score, coveredKeyPoints: covered, missingKeyPoints: missing,
      feedback: score >= 7 ? "Good explanation. Your response covers the central ideas; add a concrete example to make it stronger." : "A useful start. Define the key terms first, then connect each point to a practical example.",
      modelAnswer: `A strong answer about ${question.topic} should define the concept, explain its key principles, and support the explanation with a relevant example.`,
      followUp: "Can you illustrate that with a practical example?",
    };
    const answer: DemoAnswer = {
      id: makeId("answer"), sessionId: session.id, questionText: question.questionText,
      topic: question.topic, isFollowUp: question.isFollowUp, score,
      missingPoints: missing, coveredPoints: covered,
      inputType: body.inputType === "voice" ? "voice" : "text", createdAt: nowIso(), userAnswer: answerText, criteria,
    };
    session.answers.push(answer);
    session.currentQuestion = null;
    user.xp += Math.max(5, Math.round(score * 2));
    const nextAction = session.answers.length >= session.questionCount ? "done" : "question";
    writeState(state);
    return {
      answerId: answer.id, evaluation, degraded: true,
      adaptive: { difficulty: session.difficulty, changed: null, prerequisite: false },
      nextAction, progress: { asked: session.answers.length, total: session.questionCount },
    };
  }

  const finishMatch = path.match(/^\/api\/sessions\/([^/]+)\/finish$/);
  if (finishMatch && method === "POST") {
    const session = getSession(state, finishMatch[1]);
    session.status = "completed";
    session.completedAt = session.completedAt ?? nowIso();
    session.totalScore = session.answers.length ? round(session.answers.reduce((sum, answer) => sum + answer.score, 0) / session.answers.length) : 0;
    session.delivery = { avgWpm: 0, fillerPerMin: 0, pauses: 0 };
    const user = currentUser(state);
    user.streak = Math.max(user.streak, 1);
    writeState(state);
    const criteriaAvg = { correctness: 0, completeness: 0, clarity: 0, depth: 0 };
    if (session.answers.length) {
      for (const key of Object.keys(criteriaAvg) as (keyof typeof criteriaAvg)[]) {
        criteriaAvg[key] = round(session.answers.reduce((sum, answer) => sum + answer.criteria[key], 0) / session.answers.length);
      }
    }
    return {
      sessionId: session.id, totalScore: session.totalScore, criteriaAvg, delivery: session.delivery,
      cardsCreated: 0, newStreak: user.streak, newBadges: session.answers.length ? ["first_session"] : [],
      answeredCount: session.answers.length,
    };
  }

  if (path === "/api/progress/me") {
    const user = currentUser(state);
    return progressData(state, user);
  }

  if (path === "/api/revision/today") {
    currentUser(state);
    const due = state.cards.filter((card) => new Date(card.dueDate).getTime() <= Date.now());
    return { due, dueCount: due.length, upcoming: state.cards.length - due.length, reviewedToday: state.reviewedToday };
  }
  const reviewMatch = path.match(/^\/api\/revision\/([^/]+)\/review$/);
  if (reviewMatch && method === "POST") {
    currentUser(state);
    const index = state.cards.findIndex((card) => card.id === reviewMatch[1]);
    if (index < 0) throw new Error("Revision card not found.");
    const grade = String(body.grade ?? "good");
    const card = state.cards[index];
    card.repetitions += 1;
    card.intervalDays = grade === "again" ? 1 : grade === "hard" ? Math.max(1, card.intervalDays + 1) : grade === "easy" ? card.intervalDays + 5 : card.intervalDays + 3;
    card.dueDate = dateAfter(card.intervalDays);
    state.cards.splice(index, 1);
    state.cards.push(card);
    state.reviewedToday += 1;
    writeState(state);
    return { message: `Card reviewed: ${grade}. Next review in ${card.intervalDays} day(s).` };
  }

  if (path === "/api/admin/stats") {
    currentUser(state);
    const sessions = state.sessions;
    const completed = sessions.filter((session) => session.status === "completed");
    const scores = completed.map((session) => session.totalScore ?? 0);
    return {
      users: state.users.length,
      teachers: state.users.filter((user) => user.role === "TEACHER").length,
      admins: state.users.filter((user) => user.role === "ADMIN").length,
      subjects: state.subjects.length,
      sessions: sessions.length,
      completed: completed.length,
      answers: sessions.reduce((sum, session) => sum + session.answers.length, 0),
      flashcards: state.cards.length,
      aiCallsToday: state.users.reduce((sum, user) => sum + user.aiUsedToday, 0),
      avgSessionScore: scores.length ? round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : null,
      activeThisWeek: new Set(sessions.map((session) => session.userId)).size,
    };
  }
  if (path === "/api/admin/users" && method === "GET") {
    currentUser(state);
    return { users: state.users.map((user) => ({ ...publicUser(user), aiUsedToday: user.aiUsedToday })) };
  }
  if (path === "/api/admin/users" && method === "PATCH") {
    currentUser(state);
    const user = state.users.find((item) => item.id === body.userId);
    if (!user) throw new Error("User not found.");
    user.dailyAiLimit = Math.max(1, Number(body.dailyAiLimit ?? user.dailyAiLimit));
    writeState(state);
    return { ok: true };
  }

  const analyticsMatch = path.match(/^\/api\/analytics\/class\/([^/?]+)/);
  if (analyticsMatch) {
    currentUser(state);
    const subject = state.subjects.find((item) => item.id === analyticsMatch[1]) ?? state.subjects[0];
    const sessions = state.sessions.filter((session) => session.subjectId === subject.id);
    const answers = sessions.flatMap((session) => session.answers);
    return {
      subject, sessionCount: sessions.length, completedSessions: sessions.filter((session) => session.status === "completed").length,
      totalAnswers: answers.length, atRiskCount: 1,
      topicAverages: subject.topics.map((topic) => {
        const rows = answers.filter((answer) => answer.topic === topic.name);
        return { topic: topic.name, weight: topic.weight, attempts: rows.length, avgScore: rows.length ? round(rows.reduce((sum, item) => sum + item.score, 0) / rows.length) : null };
      }),
      mostMissed: [{ point: "Use a practical example", count: 2 }, { point: "Define key terminology", count: 1 }],
      students: state.users.filter((user) => user.role === "STUDENT").map((user) => ({
        id: user.id, name: user.name, email: user.email, readiness: 68, band: "amber", attempts: sessions.filter((session) => session.userId === user.id).length, avgScore: null, atRisk: false,
      })),
    };
  }

  if (path.startsWith("/api/questions") && method === "GET") {
    currentUser(state);
    const subjectId = new URL(path, "http://localhost").searchParams.get("subjectId");
    return { questions: state.questionBank.filter((question) => !subjectId || question.subjectId === subjectId) };
  }
  if (path === "/api/questions" && method === "POST") {
    currentUser(state);
    const subject = state.subjects.find((item) => item.id === body.subjectId) ?? state.subjects[0];
    const question: BankQuestion = {
      id: makeId("question"), subject: subject.name, subjectId: subject.id,
      topic: String(body.topic ?? ""), difficulty: Number(body.difficulty ?? 3),
      question: String(body.question ?? ""), keyPoints: Array.isArray(body.keyPoints) ? body.keyPoints.map(String) : [],
      source: "teacher", verified: true,
    };
    state.questionBank.unshift(question);
    writeState(state);
    return { question };
  }

  const calibrationMatch = path.match(/^\/api\/calibration\/([^/?]+)/);
  if (calibrationMatch && method === "GET") {
    currentUser(state);
    return calibrationData(state, calibrationMatch[1]);
  }
  if (path === "/api/calibration/mark" && method === "POST") {
    const user = currentUser(state);
    state.teacherMarks[String(body.answerId)] = { score: Number(body.score ?? 0), comment: String(body.comment ?? "") || null, teacher: user.name };
    writeState(state);
    return { ok: true };
  }

  throw new Error(`This demo does not support ${method} ${path}.`);
}

export async function api<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  await Promise.resolve();
  const result = await mockApi(path, init);
  return result as T;
}

export async function uploadDocument(file: File, type: "resume" | "syllabus") {
  const form = new FormData();
  form.append("file", file);
  form.append("type", type);
  return api<{ document: { id: string; fileName: string; chunkCount: number } }>("/api/documents", {
    method: "POST",
    body: form,
  });
}

export async function clearDemoSession() {
  if (typeof window === "undefined") return;
  const state = readState();
  state.currentUserId = null;
  writeState(state);
}
