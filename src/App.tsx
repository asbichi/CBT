/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Dashboard } from "./components/Dashboard";
import { SecurityAlerts } from "./components/SecurityAlerts";
import { SubmissionModal } from "./components/SubmissionModal";
import { Results } from "./components/Results";
import { Header } from "./components/Header";
import { Navigator } from "./components/Navigator";
import { QuestionArea } from "./components/QuestionArea";
import { FooterControls } from "./components/FooterControls";
import { Login } from "./components/Login";
import { AdminDashboard } from "./components/AdminDashboard";
import { ExamSummary } from "./components/ExamSummary";

import { useTimer } from "./hooks/useTimer";
import { useSecurity } from "./hooks/useSecurity";
import { mockQuestions, CANDIDATE_INFO, EXAM_DURATION_SECONDS } from "./data";
import {
  AnswerStatus,
  CandidateResult,
  CandidateInfo,
  Question,
} from "./types";

import { db, auth } from "./lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy,
  addDoc,
  doc,
  getDoc,
} from "firebase/firestore";

enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

type AppState = "login" | "dashboard" | "exam" | "results" | "admin";

export default function App() {
  const [appState, setAppState] = useState<AppState>("login");
  const [candidateInfo, setCandidateInfo] =
    useState<CandidateInfo>(CANDIDATE_INFO);
  const [examDuration, setExamDuration] = useState(EXAM_DURATION_SECONDS);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CandidateResult | null>(null);
  const [showSaveToast, setShowSaveToast] = useState(false);

  // Exam State
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const previousAnswersRef = useRef(answers);
  const [examStatus, setExamStatus] = useState<Record<string, AnswerStatus>>(
    {},
  );
  const [showSummary, setShowSummary] = useState(false);
  const [theme, setTheme] = useState<string>("red");

  const { securityStats, warnings, requestFullscreen, dismissWarning } =
    useSecurity();

  const handleTimerExpire = useCallback(() => {
    handleFinalSubmit();
  }, [answers, examStatus]); // Requires deps if referenced inside, let's keep it simple

  const {
    formattedTime,
    start: startTimer,
    stop: stopTimer,
    reset: resetTimer,
    secondsRemaining,
    isWarning,
    isCritical,
  } = useTimer(examDuration, handleTimerExpire);

  useEffect(() => {
    // Fetch global theme
    const fetchTheme = async () => {
      try {
        const themeDoc = await getDoc(doc(db, "settings", "global_theme"));
        if (themeDoc.exists()) {
          setTheme(themeDoc.data().theme || "red");
        }
      } catch (e) {
        console.log("Could not load global theme, falling back to default.", e);
      }
    };
    fetchTheme();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Update logic to handle late-bound callback closure issue
  useEffect(() => {
    if (secondsRemaining <= 0 && appState === "exam") {
      handleFinalSubmit();
    }
  }, [secondsRemaining, appState]);

  // Local persistence sync
  useEffect(() => {
    if (appState === "exam" && candidateInfo.id) {
      const cacheKey = `exam_cache_${candidateInfo.id}`;
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          answers,
          examStatus,
          currentQuestionIndex,
          secondsRemaining,
        }),
      );

      if (previousAnswersRef.current !== answers) {
          setShowSaveToast(true);
          const timer = setTimeout(() => setShowSaveToast(false), 2000);
          previousAnswersRef.current = answers;
          return () => clearTimeout(timer);
      }
    }
  }, [
    answers,
    examStatus,
    currentQuestionIndex,
    secondsRemaining,
    appState,
    candidateInfo.id,
  ]);

  const handleStudentLogin = async (regNo: string) => {
    try {
      // Attempt to fetch candidate info, exam questions, and exam timing in parallel to speed up login
      const qC = query(
        collection(db, "candidates"),
        where("candidate_id", "==", regNo),
        limit(1),
      );
      const examQ = query(
        collection(db, "exams"),
        orderBy("created_at", "desc"),
        limit(1),
      );
      const [querySnapshot, questionsSnapshot, examSnapshot] =
        await Promise.all([
          getDocs(qC),
          getDocs(collection(db, "questions")),
          getDocs(examQ),
        ]);

      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        setCandidateInfo({
          name: `${data.first_name} ${data.last_name}`,
          id: data.candidate_id,
          examTitle: CANDIDATE_INFO.examTitle,
          subject: "ICT Core Subjects",
        });
      } else {
        setCandidateInfo({
          name: `Candidate ${regNo}`,
          id: regNo,
          examTitle: CANDIDATE_INFO.examTitle,
          subject: "ICT Core Subjects",
        });
      }

      const allQuestions: Question[] = [];
      questionsSnapshot.forEach((doc) => {
        const d = doc.data();
        allQuestions.push({
          id: doc.id,
          type: d.question_type,
          text: d.question_text,
          options: d.options || [],
          correctAnswer: d.correct_answer,
          points: d.points || 1,
          subject: d.subject || "General",
          difficulty: d.difficulty || "Beginner",
        });
      });

      // Group by subjects
      const bySubject: Record<string, Question[]> = {
        EXCEL: [],
        "MICROSOFT WORD": [],
        POWERPOINT: [],
        ACCESS: [],
      };

      allQuestions.forEach((q) => {
        if (q.subject && bySubject[q.subject.toUpperCase()]) {
          bySubject[q.subject.toUpperCase()].push(q);
        } else if (q.subject && q.subject.toUpperCase() === "WORD") {
          bySubject["MICROSOFT WORD"].push(q);
        }
      });

      let selectedQuestions: Question[] = [];
      Object.keys(bySubject).forEach((sub) => {
        const qs = bySubject[sub];

        // Filter by difficulty
        const beginners = qs.filter((q) => q.difficulty === "Beginner");
        const middleClass = qs.filter((q) => q.difficulty === "Middle Class");
        const professionals = qs.filter((q) => q.difficulty === "Professional");

        // Shuffle helper
        const shuffle = (arr: Question[]) => {
          const copy = [...arr];
          for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
          }
          return copy;
        };

        // Pick 20 from each (or as many as available)
        const selectedB = shuffle(beginners).slice(0, 20);
        const selectedM = shuffle(middleClass).slice(0, 20);
        const selectedP = shuffle(professionals).slice(0, 20);

        // Combine and append
        selectedQuestions = selectedQuestions.concat(
          selectedB,
          selectedM,
          selectedP,
        );
      });

      // Optionally, shuffle the entire set or just set it
      if (selectedQuestions.length === 0) {
        // Fallback to mock if db is empty
        selectedQuestions = mockQuestions;
      }

      setExamQuestions(selectedQuestions);

      // Initialize Exam Array
      const initialStatus: Record<string, AnswerStatus> = {};
      selectedQuestions.forEach((q, i) => {
        initialStatus[q.id] = i === 0 ? "unanswered" : "not-visited";
      });
      setExamStatus(initialStatus);

      if (!examSnapshot.empty) {
        const examData = examSnapshot.docs[0].data();
        if (examData.duration_minutes) {
          setExamDuration(examData.duration_minutes * 60);
          setCandidateInfo((prev) => ({ ...prev, examTitle: examData.title }));
        }
      }

      setAppState("dashboard");
    } catch (e: any) {
      console.error("Login Error:", e);
      setCandidateInfo({ ...CANDIDATE_INFO, id: regNo });
      setExamQuestions(mockQuestions);
      setAppState("dashboard");
    }
  };

  const handleAdminLogin = () => {
    setAppState("admin");
  };

  const handleStart = async () => {
    await requestFullscreen();

    const cacheKey = `exam_cache_${candidateInfo.id}`;
    const cached = localStorage.getItem(cacheKey);
    let startTime = examDuration;

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.answers) setAnswers(parsed.answers);
        if (parsed.examStatus) setExamStatus(parsed.examStatus);
        if (typeof parsed.currentQuestionIndex === "number") {
          setCurrentQuestionIndex(parsed.currentQuestionIndex);
        }
        if (typeof parsed.secondsRemaining === "number") {
          startTime = parsed.secondsRemaining;
        }
      } catch (e) {
        console.error("Failed to restore cached exam state", e);
      }
    }

    setAppState("exam");
    resetTimer(startTime);
    startTimer();
  };

  const handleAnswerChange = (newAnswer: string | string[]) => {
    const q = examQuestions[currentQuestionIndex];
    if (!q) return;
    setAnswers((prev) => ({ ...prev, [q.id]: newAnswer }));

    const hasAnswer = Array.isArray(newAnswer)
      ? newAnswer.length > 0
      : !!newAnswer;
    if (examStatus[q.id] !== "marked-for-review") {
      setExamStatus((prev) => ({
        ...prev,
        [q.id]: hasAnswer ? "answered" : "unanswered",
      }));
    }
  };

  const handleClear = () => {
    const q = examQuestions[currentQuestionIndex];
    if (!q) return;
    const newAnswers = { ...answers };
    delete newAnswers[q.id];
    setAnswers(newAnswers);
    setExamStatus((prev) => ({ ...prev, [q.id]: "unanswered" }));
  };

  const handleMarkReview = () => {
    const q = examQuestions[currentQuestionIndex];
    if (!q) return;
    const current = examStatus[q.id];
    setExamStatus((prev) => ({
      ...prev,
      [q.id]:
        current === "marked-for-review"
          ? answers[q.id]
            ? "answered"
            : "unanswered"
          : "marked-for-review",
    }));
  };

  const navigateTo = (index: number) => {
    setCurrentQuestionIndex(index);
    const qId = examQuestions[index].id;
    if (examStatus[qId] === "not-visited") {
      setExamStatus((prev) => ({ ...prev, [qId]: "unanswered" }));
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < examQuestions.length - 1) {
      navigateTo(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      navigateTo(currentQuestionIndex - 1);
    }
  };

  const handleFinalSubmit = async () => {
    stopTimer();
    setShowSubmitModal(false);
    setIsSubmitting(true);

    // Clear local storage cache
    if (candidateInfo.id) {
      localStorage.removeItem(`exam_cache_${candidateInfo.id}`);
    }

    let score = 0;
    let totalPoints = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    const mcqBreakdown: Record<string, boolean> = {};

    examQuestions.forEach((q) => {
      totalPoints += q.points;
      const ans = answers[q.id];

      if (!ans || (Array.isArray(ans) && ans.length === 0)) {
        unansweredCount++;
        mcqBreakdown[q.id] = false;
        return;
      }

      let isCorrect = false;

      if (q.type === "mcq" || q.type === "tf" || q.type === "fill") {
        if (typeof ans === "string" && typeof q.correctAnswer === "string") {
          isCorrect =
            ans.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
        }
      } else if (q.type === "mrx") {
        if (Array.isArray(ans) && Array.isArray(q.correctAnswer)) {
          if (ans.length === q.correctAnswer.length) {
            isCorrect = ans.every((a) =>
              (q.correctAnswer as string[]).includes(a),
            );
          }
        }
      } else if (q.type === "essay") {
        isCorrect = typeof ans === "string" && ans.length > 50;
      }

      if (isCorrect) {
        score += q.points;
        correctCount++;
      } else {
        incorrectCount++;
      }
      mcqBreakdown[q.id] = isCorrect;
    });

    const timeSpent = examDuration - secondsRemaining;

    const examResult: CandidateResult = {
      score,
      totalPoints,
      percentage: (score / totalPoints) * 100,
      timeSpent,
      correctCount,
      incorrectCount,
      unansweredCount,
      mcqBreakdown,
    };

    try {
      await addDoc(collection(db, "exam_results"), {
        candidate_id: candidateInfo.id,
        candidate_name: candidateInfo.name,
        exam_title: candidateInfo.examTitle,
        subject: candidateInfo.subject,
        score: examResult.score,
        total_points: examResult.totalPoints,
        percentage: examResult.percentage,
        time_spent_seconds: examResult.timeSpent,
        correct_count: examResult.correctCount,
        incorrect_count: examResult.incorrectCount,
        unanswered_count: examResult.unansweredCount,
        mcq_breakdown: examResult.mcqBreakdown,
        security_logs: securityStats.violations,
        created_at: new Date().toISOString(),
        user_id: auth.currentUser?.uid || "guest",
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "exam_results");
    }

    setIsSubmitting(false);
    setResult(examResult);
    setAppState("results");
  };

  if (appState === "login") {
    return (
      <Login
        onStudentLogin={handleStudentLogin}
        onAdminLogin={handleAdminLogin}
      />
    );
  }

  if (appState === "admin") {
    return <AdminDashboard onLogout={() => setAppState("login")} />;
  }

  if (appState === "dashboard") {
    return (
      <Dashboard
        candidate={candidateInfo}
        onStart={handleStart}
        examDuration={examDuration}
        totalQuestions={examQuestions.length}
      />
    );
  }

  if (appState === "results" && result) {
    return (
      <Results
        result={result}
        candidate={candidateInfo}
        questions={examQuestions}
      />
    );
  }

  if (appState === "exam" && showSummary) {
    return (
      <ExamSummary
        questions={examQuestions}
        answers={answers}
        examStatus={examStatus}
        onNavigate={(index) => {
          setShowSummary(false);
          navigateTo(index);
        }}
        onReturn={() => setShowSummary(false)}
        onConfirm={() => {
          setShowSummary(false);
          setShowSubmitModal(true);
        }}
        formattedTime={formattedTime}
        candidate={candidateInfo}
      />
    );
  }

  const currentQuestion = examQuestions[currentQuestionIndex];
  if (!currentQuestion) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      <Header
        candidate={candidateInfo}
        formattedTime={formattedTime}
        isWarning={isWarning}
        isCritical={isCritical}
        isFullscreen={securityStats.isFullscreen}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Main Question Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center justify-start">
          <div className="w-full max-w-4xl mb-6">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                Progress
              </span>
              <span className="text-sm font-medium text-slate-500">
                {
                  Object.keys(answers).filter((id) =>
                    Array.isArray(answers[id])
                      ? answers[id].length > 0
                      : !!answers[id],
                  ).length
                }{" "}
                of {examQuestions.length} Answered
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                style={{
                  width: `${(Object.keys(answers).filter((id) => (Array.isArray(answers[id]) ? answers[id].length > 0 : !!answers[id])).length / Math.max(examQuestions.length, 1)) * 100}%`,
                }}
              ></div>
            </div>
          </div>
          <QuestionArea
            question={currentQuestion}
            currentIndex={currentQuestionIndex}
            totalQuestions={examQuestions.length}
            answer={answers[currentQuestion.id] || ""}
            onAnswerChange={handleAnswerChange}
          />
        </main>

        {/* Side Navigator */}
        <Navigator
          questions={examQuestions}
          currentQuestionIndex={currentQuestionIndex}
          examStatus={examStatus}
          onNavigate={navigateTo}
          isPanelOpen={isPanelOpen}
          togglePanel={() => setIsPanelOpen(!isPanelOpen)}
          onViewSummary={() => setShowSummary(true)}
        />
      </div>

      {/* Toast Notification */}
      <div 
        className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg text-sm transition-all duration-300 z-50 flex items-center gap-2 ${showSaveToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      >
        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Draft saved locally
      </div>

      <FooterControls
        onPrevious={handlePrevious}
        onNext={handleNext}
        onMarkReview={handleMarkReview}
        onClear={handleClear}
        onSubmit={() => setShowSummary(true)}
        isFirst={currentQuestionIndex === 0}
        isLast={currentQuestionIndex === examQuestions.length - 1}
        currentStatus={examStatus[currentQuestion.id] || "not-visited"}
      />

      {showSubmitModal && !isSubmitting && (
        <SubmissionModal
          examStatus={examStatus}
          totalQuestions={examQuestions.length}
          onConfirm={handleFinalSubmit}
          onCancel={() => setShowSubmitModal(false)}
        />
      )}

      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-800 font-medium font-sans">
              Submitting examination data securely...
            </p>
          </div>
        </div>
      )}

      <SecurityAlerts warnings={warnings} onDismiss={dismissWarning} />
    </div>
  );
}
