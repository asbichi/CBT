import React, { useState, useEffect } from "react";
import {
  Users,
  BookOpen,
  FileQuestion,
  Clock,
  CheckCircle,
  UploadCloud,
  FileText,
  Download,
  Database,
  FileOutput,
  ShieldAlert,
} from "lucide-react";
import { db } from "../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  updateDoc,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { seedQuestionsDB } from "../lib/seedQuestions";
import { defaultCandidates } from "../lib/defaultCandidates";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<
    "students" | "subjects" | "questions" | "exam" | "results" | "security"
  >("students");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [results, setResults] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [resultsSearchTerm, setResultsSearchTerm] = useState("");
  const [questionsList, setQuestionsList] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionsSearchTerm, setQuestionsSearchTerm] = useState("");
  const [securitySearchTerm, setSecuritySearchTerm] = useState("");

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  // Student Form
  const [student, setStudent] = useState({
    id: "",
    firstName: "",
    lastName: "",
  });
  const [isDragging, setIsDragging] = useState(false);
  const [pastedCSV, setPastedCSV] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isSeedingCandidates, setIsSeedingCandidates] = useState(false);
  const [importFormat, setImportFormat] = useState<
    "id-first-last" | "id-last-first"
  >("id-first-last");
  const [importStatus, setImportStatus] = useState<
    "idle" | "parsing" | "uploading" | "complete" | "error"
  >("idle");
  const [importProgress, setImportProgress] = useState<number>(0);
  const [importStats, setImportStats] = useState({
    processed: 0,
    total: 0,
    success: 0,
    failed: 0,
  });

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = student.id.trim();
    if (!cleanId) return;

    try {
      // Check for duplicate registration ID
      const q = query(
        collection(db, "candidates"),
        where("candidate_id", "==", cleanId),
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Update existing candidate or prompt
        const candidateDoc = querySnapshot.docs[0];
        await updateDoc(candidateDoc.ref, {
          first_name: student.firstName.trim(),
          last_name: student.lastName.trim(),
          password: cleanId, // reset password to registration ID as default
          updated_at: new Date().toISOString(),
        });
        showMessage(
          "success",
          `Updated pre-existing student registration with ID ${cleanId}.`,
        );
      } else {
        // Add new candidate
        await addDoc(collection(db, "candidates"), {
          candidate_id: cleanId,
          first_name: student.firstName.trim(),
          last_name: student.lastName.trim(),
          password: cleanId,
          created_at: new Date().toISOString(),
        });
        showMessage(
          "success",
          "Student added successfully with registration number as password.",
        );
      }
      setStudent({ id: "", firstName: "", lastName: "" });
    } catch (err: any) {
      showMessage("error", err.message);
    }
  };

  const processImportData = async (data: any, isBinary: boolean) => {
    try {
      setImportStatus("parsing");
      setImportProgress(0);
      setImportStats({ processed: 0, total: 0, success: 0, failed: 0 });
      setIsImporting(true);

      const workbook = XLSX.read(data, { type: isBinary ? "array" : "string" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) {
        showMessage("error", "The uploaded sheet/data is empty.");
        setImportStatus("error");
        setIsImporting(false);
        return;
      }

      // Convert worksheet to an array of arrays (including headers)
      const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
      if (rows.length === 0) {
        showMessage("error", "The uploaded data has no rows.");
        setImportStatus("error");
        setIsImporting(false);
        return;
      }

      // Filter out completely empty rows (rows where all cells are null, undefined, or empty strings)
      const nonEmptyRows = rows.filter((row) => {
        return (
          row &&
          row.some(
            (cell) =>
              cell !== null && cell !== undefined && String(cell).trim() !== "",
          )
        );
      });

      if (nonEmptyRows.length === 0) {
        showMessage("error", "The uploaded data contains only empty rows.");
        setImportStatus("error");
        setIsImporting(false);
        return;
      }

      // Analyze the first row to check if it's a header row
      const firstRow = nonEmptyRows[0];
      const firstRowStr = firstRow.map((cell) =>
        String(cell || "")
          .trim()
          .toLowerCase(),
      );

      const isHeaderRow = firstRowStr.some(
        (part) =>
          part.includes("id") ||
          part.includes("reg") ||
          part.includes("num") ||
          part.includes("name") ||
          part.includes("student") ||
          part.includes("candidate") ||
          part.includes("surname") ||
          part.includes("code") ||
          part.includes("matric"),
      );

      let idIndex = 0;
      let lastNameIndex = importFormat === "id-last-first" ? 1 : 2;
      let firstNameIndex = importFormat === "id-last-first" ? 2 : 1;
      let hasHeaders = false;

      if (isHeaderRow) {
        hasHeaders = true;
        // Identify registration/candidate ID index
        const foundIdIndex = firstRowStr.findIndex(
          (p) =>
            p.includes("id") ||
            p.includes("reg") ||
            p.includes("num") ||
            p.includes("code") ||
            p.includes("matric") ||
            p.includes("roll"),
        );
        if (foundIdIndex !== -1) {
          idIndex = foundIdIndex;
        }

        // Identify First Name
        const foundFirstNameIndex = firstRowStr.findIndex(
          (p) =>
            p.includes("first") ||
            p.includes("given") ||
            p.includes("forename"),
        );
        if (foundFirstNameIndex !== -1) {
          firstNameIndex = foundFirstNameIndex;
        } else {
          // Fallback to general 'name'
          const foundNameIndex = firstRowStr.findIndex(
            (p) =>
              p === "name" ||
              p.includes("full") ||
              p.includes("student") ||
              p.includes("candidate"),
          );
          if (foundNameIndex !== -1) {
            firstNameIndex = foundNameIndex;
          }
        }

        // Identify Last Name
        const foundLastNameIndex = firstRowStr.findIndex(
          (p) =>
            p.includes("last") || p.includes("sur") || p.includes("family"),
        );
        if (foundLastNameIndex !== -1) {
          lastNameIndex = foundLastNameIndex;
        }
      }

      const startIndex = isHeaderRow ? 1 : 0;
      const candidatesToProcess: {
        id: string;
        firstName: string;
        lastName: string;
      }[] = [];

      for (let i = startIndex; i < nonEmptyRows.length; i++) {
        const row = nonEmptyRows[i];
        if (!row || row.length === 0) continue;

        let rawId = row[idIndex];
        if (rawId === null || rawId === undefined) continue;

        let id = String(rawId).trim();
        // If it's a decimal (e.g. 202401.0), strip .0
        if (id.endsWith(".0")) {
          id = id.substring(0, id.length - 2);
        }

        if (!id) continue;

        let firstName = "";
        let lastName = "";

        if (hasHeaders) {
          if (
            firstNameIndex < row.length &&
            lastNameIndex < row.length &&
            firstNameIndex !== lastNameIndex
          ) {
            firstName = String(row[firstNameIndex] || "").trim();
            lastName = String(row[lastNameIndex] || "").trim();
          } else {
            const nameColIndex =
              firstNameIndex < row.length
                ? firstNameIndex
                : row.length > 1
                  ? 1
                  : 0;
            const fullName = String(row[nameColIndex] || "").trim();
            const nameParts = fullName.split(/\s+/).filter(Boolean);
            if (nameParts.length >= 2) {
              firstName = nameParts[0];
              lastName = nameParts.slice(1).join(" ");
            } else {
              firstName = nameParts[0] || "Candidate";
              lastName = "Student";
            }
          }
        } else {
          if (row.length >= 3) {
            if (importFormat === "id-first-last") {
              firstName = String(row[1] || "").trim();
              lastName = String(row[2] || "").trim();
            } else {
              lastName = String(row[1] || "").trim();
              firstName = String(row[2] || "").trim();
            }
          } else if (row.length === 2) {
            const fullName = String(row[1] || "").trim();
            const nameParts = fullName.split(/\s+/).filter(Boolean);
            if (nameParts.length >= 2) {
              firstName = nameParts[0];
              lastName = nameParts.slice(1).join(" ");
            } else {
              firstName = nameParts[0] || "Candidate";
              lastName = "Student";
            }
          } else {
            firstName = "Candidate";
            lastName = "Student";
          }
        }

        candidatesToProcess.push({
          id,
          firstName: firstName || "Candidate",
          lastName: lastName || "Student",
        });
      }

      if (candidatesToProcess.length === 0) {
        showMessage("error", "No valid student records found.");
        setImportStatus("error");
        setIsImporting(false);
        return;
      }

      setImportStatus("uploading");
      setImportStats({
        processed: 0,
        total: candidatesToProcess.length,
        success: 0,
        failed: 0,
      });
      let successCount = 0;
      let errorCount = 0;

      // Fetch all existing candidates to check for duplicates in O(1) time
      const querySnapshot = await getDocs(collection(db, "candidates"));
      const existingCandidatesMap = new Map<
        string,
        { docId: string; ref: any }
      >();
      querySnapshot.forEach((doc) => {
        const d = doc.data();
        if (d.candidate_id) {
          existingCandidatesMap.set(String(d.candidate_id).trim(), {
            docId: doc.id,
            ref: doc.ref,
          });
        }
      });

      // Process in chunks of 25 for extremely fast batch concurrent execution
      const chunkSize = 25;
      for (let i = 0; i < candidatesToProcess.length; i += chunkSize) {
        const chunk = candidatesToProcess.slice(i, i + chunkSize);
        await Promise.all(
          chunk.map(async (cand) => {
            try {
              const existing = existingCandidatesMap.get(cand.id);
              if (existing) {
                await updateDoc(existing.ref, {
                  first_name: cand.firstName,
                  last_name: cand.lastName,
                  password: cand.id,
                  updated_at: new Date().toISOString(),
                });
              } else {
                await addDoc(collection(db, "candidates"), {
                  candidate_id: cand.id,
                  first_name: cand.firstName,
                  last_name: cand.lastName,
                  password: cand.id,
                  created_at: new Date().toISOString(),
                });
              }
              successCount++;
            } catch (err) {
              console.error("Error writing candidate:", err);
              errorCount++;
            }
          }),
        );

        const processedCount = Math.min(
          i + chunkSize,
          candidatesToProcess.length,
        );
        setImportStats({
          processed: processedCount,
          total: candidatesToProcess.length,
          success: successCount,
          failed: errorCount,
        });
        setImportProgress(
          Math.round((processedCount / candidatesToProcess.length) * 100),
        );
      }

      setIsImporting(false);
      setImportStatus("complete");

      if (successCount > 0) {
        showMessage(
          "success",
          `Successfully processed ${successCount} student(s).${errorCount > 0 ? ` Failed on ${errorCount} records.` : ""}`,
        );
      } else {
        showMessage("error", "Failed to process any student records.");
        setImportStatus("error");
      }
    } catch (err: any) {
      setIsImporting(false);
      setImportStatus("error");
      console.error("Error processing import data:", err);
      showMessage("error", `Failed to parse data: ${err.message || err}`);
    }
  };

  const processCSVFile = async (file: File) => {
    const nameLower = file.name.toLowerCase();
    const isExcel = nameLower.endsWith(".xlsx") || nameLower.endsWith(".xls");

    const reader = new FileReader();
    if (isExcel) {
      reader.onload = async (event) => {
        const data = event.target?.result;
        if (!data) return;
        await processImportData(data, true);
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        if (!text) return;
        await processImportData(text, false);
      };
      reader.readAsText(file);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processCSVFile(file);
    e.target.value = "";
  };

  const handleImportPastedCSV = async () => {
    if (!pastedCSV.trim()) return;
    setIsImporting(true);
    try {
      await processImportData(pastedCSV, false);
      setPastedCSV("");
    } catch (err: any) {
      showMessage("error", err.message || "Failed to import manual text.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const nameLower = file.name.toLowerCase();
    const isAcceptedType =
      nameLower.endsWith(".csv") ||
      nameLower.endsWith(".txt") ||
      nameLower.endsWith(".xlsx") ||
      nameLower.endsWith(".xls") ||
      file.type === "text/csv" ||
      file.type === "text/plain" ||
      file.type === "application/vnd.ms-excel" ||
      file.type === "application/csv" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    if (!isAcceptedType) {
      showMessage(
        "error",
        "Please upload a valid CSV, TXT, or Excel (.xlsx, .xls) file.",
      );
      return;
    }
    await processCSVFile(file);
  };

  // Subject Form
  const [subjectTitle, setSubjectTitle] = useState("");

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "subjects"), {
        name: subjectTitle,
        created_at: new Date().toISOString(),
      });
      showMessage("success", "Subject added successfully.");
      setSubjectTitle("");
    } catch (err: any) {
      showMessage("error", err.message);
    }
  };

  // Timing/Exam settings Map to 'exams' table
  const [examConfig, setExamConfig] = useState({
    title: "",
    duration: 60,
    marks: 100,
  });
  const [globalTheme, setGlobalTheme] = useState("red");

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const themeDoc = await getDoc(doc(db, "settings", "global_theme"));
        if (themeDoc.exists()) {
          setGlobalTheme(themeDoc.data().theme || "red");
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchTheme();
  }, []);

  const handleSaveTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "settings", "global_theme"), { theme: globalTheme });
      showMessage("success", "Theme configuration saved successfully. Students will see the new theme on their next login.");
    } catch (err: any) {
      showMessage("error", err.message);
    }
  };

  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "exams"), {
        title: examConfig.title,
        duration_minutes: examConfig.duration,
        total_marks: examConfig.marks,
        created_at: new Date().toISOString(),
      });
      showMessage("success", "Exam configuration saved successfully.");
      setExamConfig({ title: "", duration: 60, marks: 100 });
    } catch (err: any) {
      showMessage("error", err.message);
    }
  };

  // Question Form
  const [question, setQuestion] = useState({
    type: "mcq",
    text: "",
    options: "",
    answer: "",
    points: 1,
  });
  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const opts = question.options
        ? question.options.split(",").map((s) => s.trim())
        : null;
      await addDoc(collection(db, "questions"), {
        question_type: question.type,
        question_text: question.text,
        options: opts,
        correct_answer: question.answer,
        points: question.points,
        subject: "General",
        created_at: new Date().toISOString(),
      });
      showMessage("success", "Question banked successfully.");
      setQuestion({
        type: "mcq",
        text: "",
        options: "",
        answer: "",
        points: 1,
      });
    } catch (err: any) {
      showMessage("error", err.message);
    }
  };

  const [isSeeding, setIsSeeding] = useState(false);
  const handleSeedQuestions = async () => {
    setIsSeeding(true);
    const res = await seedQuestionsDB();
    setIsSeeding(false);
    if (res.success) {
      showMessage("success", res.message);
    } else {
      showMessage("error", res.message);
    }
  };

  const handleSeedMassCandidates = async () => {
    try {
      setIsSeedingCandidates(true);
      setImportStatus("uploading");
      setImportProgress(0);

      const massCandidates = Array.from({ length: 1500 }).map((_, i) => ({
        id: `DITM-MASS-${1000 + i}`,
        firstName: `Test Student`,
        lastName: `${i + 1}`,
      }));

      setImportStats({
        processed: 0,
        total: massCandidates.length,
        success: 0,
        failed: 0,
      });

      const querySnapshot = await getDocs(collection(db, "candidates"));
      const existingCandidatesMap = new Map<
        string,
        { docId: string; ref: any }
      >();
      querySnapshot.forEach((doc) => {
        const d = doc.data();
        if (d.candidate_id) {
          existingCandidatesMap.set(String(d.candidate_id).trim(), {
            docId: doc.id,
            ref: doc.ref,
          });
        }
      });

      let successCount = 0;
      let errorCount = 0;
      const chunkSize = 50;

      for (let i = 0; i < massCandidates.length; i += chunkSize) {
        const chunk = massCandidates.slice(i, i + chunkSize);
        await Promise.all(
          chunk.map(async (cand) => {
            try {
              const existing = existingCandidatesMap.get(cand.id);
              if (existing) {
                await updateDoc(existing.ref, {
                  first_name: cand.firstName,
                  last_name: cand.lastName,
                  password: cand.id,
                  updated_at: new Date().toISOString(),
                });
              } else {
                await addDoc(collection(db, "candidates"), {
                  candidate_id: cand.id,
                  first_name: cand.firstName,
                  last_name: cand.lastName,
                  password: cand.id,
                  created_at: new Date().toISOString(),
                });
              }
              successCount++;
            } catch (err) {
              console.error("Error writing candidate:", err);
              errorCount++;
            }
          }),
        );

        const processedCount = Math.min(i + chunkSize, massCandidates.length);
        setImportStats({
          processed: processedCount,
          total: massCandidates.length,
          success: successCount,
          failed: errorCount,
        });
        setImportProgress(
          Math.round((processedCount / massCandidates.length) * 100),
        );
      }

      setImportStatus("complete");
      showMessage(
        "success",
        `Successfully populated 1500 mass candidates for scale testing!`,
      );
    } catch (err: any) {
      setImportStatus("error");
      showMessage(
        "error",
        `Failed to seed mass candidates: ${err.message || err}`,
      );
    } finally {
      setIsSeedingCandidates(false);
    }
  };

  const handleSeedDefaultCandidates = async () => {
    try {
      setIsSeedingCandidates(true);
      setImportStatus("uploading");
      setImportProgress(0);
      setImportStats({
        processed: 0,
        total: defaultCandidates.length,
        success: 0,
        failed: 0,
      });

      const querySnapshot = await getDocs(collection(db, "candidates"));
      const existingCandidatesMap = new Map<
        string,
        { docId: string; ref: any }
      >();
      querySnapshot.forEach((doc) => {
        const d = doc.data();
        if (d.candidate_id) {
          existingCandidatesMap.set(String(d.candidate_id).trim(), {
            docId: doc.id,
            ref: doc.ref,
          });
        }
      });

      let successCount = 0;
      let errorCount = 0;
      const chunkSize = 25;

      for (let i = 0; i < defaultCandidates.length; i += chunkSize) {
        const chunk = defaultCandidates.slice(i, i + chunkSize);
        await Promise.all(
          chunk.map(async (cand) => {
            try {
              const existing = existingCandidatesMap.get(cand.id);
              if (existing) {
                await updateDoc(existing.ref, {
                  first_name: cand.firstName,
                  last_name: cand.lastName,
                  password: cand.id,
                  updated_at: new Date().toISOString(),
                });
              } else {
                await addDoc(collection(db, "candidates"), {
                  candidate_id: cand.id,
                  first_name: cand.firstName,
                  last_name: cand.lastName,
                  password: cand.id,
                  created_at: new Date().toISOString(),
                });
              }
              successCount++;
            } catch (err) {
              console.error("Error writing candidate:", err);
              errorCount++;
            }
          }),
        );

        const processedCount = Math.min(
          i + chunkSize,
          defaultCandidates.length,
        );
        setImportStats({
          processed: processedCount,
          total: defaultCandidates.length,
          success: successCount,
          failed: errorCount,
        });
        setImportProgress(
          Math.round((processedCount / defaultCandidates.length) * 100),
        );
      }

      setImportStatus("complete");
      showMessage(
        "success",
        `Successfully populated all 88 DITM candidates into the database!`,
      );
    } catch (err: any) {
      setImportStatus("error");
      showMessage(
        "error",
        `Failed to seed DITM candidates: ${err.message || err}`,
      );
    } finally {
      setIsSeedingCandidates(false);
    }
  };

  useEffect(() => {
    if (activeTab === "results" || activeTab === "security") {
      const fetchResults = async () => {
        setLoadingResults(true);
        try {
          const resultsQuery = query(
            collection(db, "exam_results"),
            orderBy("created_at", "desc"),
          );
          const snapshot = await getDocs(resultsQuery);
          const resultsData: any[] = [];
          snapshot.forEach((doc) => {
            resultsData.push({ id: doc.id, ...doc.data() });
          });
          setResults(resultsData);
        } catch (error) {
          console.error("Error fetching results:", error);
          showMessage("error", "Failed to load exam results.");
        } finally {
          setLoadingResults(false);
        }
      };
      fetchResults();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "questions") {
      const fetchQuestions = async () => {
        setLoadingQuestions(true);
        try {
          const qQuery = query(
            collection(db, "questions"),
            orderBy("created_at", "desc"),
          );
          const snapshot = await getDocs(qQuery);
          const data: any[] = [];
          snapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
          });
          setQuestionsList(data);
        } catch (error) {
          console.error("Error fetching questions:", error);
          showMessage("error", "Failed to load questions.");
        } finally {
          setLoadingQuestions(false);
        }
      };
      fetchQuestions();
    }
  }, [activeTab]);

  const seedDummyResults = async () => {
    setIsSeeding(true);
    try {
      const dummyResults = [
        {
          candidate_id: "DITM001",
          candidate_name: "Alice Johnson",
          exam_title: "DITM Midterm",
          subject: "Computer Science",
          score: 85,
          total_points: 100,
          percentage: 85,
          time_spent_seconds: 1200,
          correct_count: 85,
          incorrect_count: 10,
          unanswered_count: 5,
          created_at: new Date().toISOString(),
          user_id: "guest",
        },
        {
          candidate_id: "DITM002",
          candidate_name: "Bob Smith",
          exam_title: "DITM Midterm",
          subject: "Computer Science",
          score: 92,
          total_points: 100,
          percentage: 92,
          time_spent_seconds: 1500,
          correct_count: 92,
          incorrect_count: 8,
          unanswered_count: 0,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          user_id: "guest",
        },
      ];

      for (const result of dummyResults) {
        await addDoc(collection(db, "exam_results"), result);
      }

      showMessage("success", "Successfully added dummy results!");
      // Refresh results
      setLoadingResults(true);
      const resultsQuery = query(
        collection(db, "exam_results"),
        orderBy("created_at", "desc"),
      );
      const snapshot = await getDocs(resultsQuery);
      const resultsData: any[] = [];
      snapshot.forEach((doc) => {
        resultsData.push({ id: doc.id, ...doc.data() });
      });
      setResults(resultsData);
      setLoadingResults(false);
    } catch (err: any) {
      console.error(err);
      showMessage("error", `Failed to seed results: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const downloadCSV = () => {
    const filteredResults = results.filter((result) => {
      const search = resultsSearchTerm.toLowerCase();
      const name = (result.candidate_name || "").toLowerCase();
      const id = (result.candidate_id || "").toLowerCase();
      return name.includes(search) || id.includes(search);
    });

    if (filteredResults.length === 0) return;

    const headers = [
      "REG NO",
      "NAME",
      "EXAM TITLE",
      "SUBJECT",
      "SCORE",
      "TOTAL POINTS",
      "PERCENTAGE",
      "TIME SPENT (SEC)",
      "CORRECT",
      "INCORRECT",
      "UNANSWERED",
      "DATE TAKEN",
    ];

    const rows = filteredResults.map((row) => {
      const cName = row.candidate_name
        ? String(row.candidate_name).replace(/"/g, '""')
        : "Unknown";
      const cExamTitle = row.exam_title
        ? String(row.exam_title).replace(/"/g, '""')
        : "";
      const cSubject = row.subject
        ? String(row.subject).replace(/"/g, '""')
        : "";
      const dateTaken = row.created_at?.toDate
        ? row.created_at.toDate().toLocaleString().replace(/"/g, '""')
        : "";

      return [
        `"${row.candidate_id || ""}"`,
        `"${cName}"`,
        `"${cExamTitle}"`,
        `"${cSubject}"`,
        row.score || 0,
        row.total_points || 0,
        `${row.percentage || 0}%`,
        row.time_spent_seconds || 0,
        row.correct_count || 0,
        row.incorrect_count || 0,
        row.unanswered_count || 0,
        `"${dateTaken}"`,
      ].join(",");
    });

    const BOM = "\uFEFF";
    const csvContent = BOM + headers.join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `exam_results_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    const filteredResults = results.filter((result) => {
      const search = resultsSearchTerm.toLowerCase();
      const name = (result.candidate_name || "").toLowerCase();
      const id = (result.candidate_id || "").toLowerCase();
      return name.includes(search) || id.includes(search);
    });

    if (filteredResults.length === 0) return;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Report Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(33, 33, 33);
    doc.text("Official Exam Results Report", 14, 22);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Candidates: ${filteredResults.length}`, 14, 35);

    // Calculate Summary Statistics
    const averageScore =
      filteredResults.reduce((acc, curr) => acc + (curr.percentage || 0), 0) /
      filteredResults.length;
    const highestScore = Math.max(
      ...filteredResults.map((r) => r.percentage || 0),
    );
    doc.text(`Average Score: ${averageScore.toFixed(1)}%`, 14, 40);
    doc.text(`Highest Score: ${highestScore.toFixed(1)}%`, 14, 45);

    // Results Table
    const tableData = filteredResults.map((row) => {
      const dateTaken = row.created_at?.toDate
        ? row.created_at.toDate().toLocaleString()
        : "";
      return [
        row.candidate_id || "",
        row.candidate_name || "Unknown",
        row.exam_title || "",
        row.subject || "",
        `${row.score || 0}/${row.total_points || 0}`,
        `${row.percentage || 0}%`,
        `${Math.floor((row.time_spent_seconds || 0) / 60)}m ${(row.time_spent_seconds || 0) % 60}s`,
        dateTaken,
      ];
    });

    autoTable(doc, {
      startY: 55,
      head: [
        [
          "REG NO",
          "NAME",
          "EXAM TITLE",
          "SUBJECT",
          "SCORE",
          "PERCENTAGE",
          "TIME",
          "DATE TAKEN",
        ],
      ],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Page ${i} of ${pageCount} - Generated by Admin Portal`,
        14,
        doc.internal.pageSize.height - 10,
      );
    }

    doc.save(
      `exam_results_report_${new Date().toISOString().split("T")[0]}.pdf`,
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white rounded-full p-1 shadow-md flex-shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src="https://i.ibb.co/XfdCjdnM/294463932-545722830683545-9019441332151319432-n.jpg"
                alt="Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <h2 className="text-xl font-bold text-primary-500 leading-tight">
              Admin
              <br />
              Portal
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 pl-[3.75rem]">
            DITM Control Center
          </p>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => setActiveTab("students")}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors justify-start ${activeTab === "students" ? "bg-primary-600 text-white" : "text-slate-300 hover:bg-slate-800"}`}
          >
            <Users className="w-5 h-5 mr-3 flex-shrink-0" /> Manage Students
          </button>
          <button
            onClick={() => setActiveTab("subjects")}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors justify-start ${activeTab === "subjects" ? "bg-primary-600 text-white" : "text-slate-300 hover:bg-slate-800"}`}
          >
            <BookOpen className="w-5 h-5 mr-3 flex-shrink-0" /> Manage Subjects
          </button>
          <button
            onClick={() => setActiveTab("exam")}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors justify-start ${activeTab === "exam" ? "bg-primary-600 text-white" : "text-slate-300 hover:bg-slate-800"}`}
          >
            <Clock className="w-5 h-5 mr-3 flex-shrink-0" /> Exam Configuration
          </button>
          <button
            onClick={() => setActiveTab("questions")}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors justify-start ${activeTab === "questions" ? "bg-primary-600 text-white" : "text-slate-300 hover:bg-slate-800"}`}
          >
            <FileQuestion className="w-5 h-5 mr-3 flex-shrink-0" /> Question
            Bank
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors justify-start ${activeTab === "results" ? "bg-primary-600 text-white" : "text-slate-300 hover:bg-slate-800"}`}
          >
            <FileText className="w-5 h-5 mr-3 flex-shrink-0" /> Exam Results
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors justify-start ${activeTab === "security" ? "bg-primary-600 text-white" : "text-slate-300 hover:bg-slate-800"}`}
          >
            <ShieldAlert className="w-5 h-5 mr-3 flex-shrink-0" /> Security Logs
          </button>
        </nav>
        <div className="p-4">
          <button
            onClick={onLogout}
            className="w-full py-2 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-800 mb-8 capitalize">
            {activeTab.replace("_", " ")} Settings
          </h1>

          {message.text && (
            <div
              className={`p-4 rounded-lg mb-6 flex items-center shadow-sm ${message.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-primary-50 text-primary-800 border border-primary-200"}`}
            >
              {message.type === "success" && (
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              )}
              {message.text}
            </div>
          )}

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            {activeTab === "students" && (
              <div className="space-y-8">
                <form onSubmit={handleAddStudent} className="space-y-5">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">
                      Add Allowed Candidate
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">
                      Manually provision student access for the CBT system
                      (supports 10,000+ concurrent connections via Firestore).
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Registration Number
                      </label>
                      <input
                        required
                        type="text"
                        value={student.id}
                        onChange={(e) =>
                          setStudent({ ...student, id: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g. DIT-001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        First Name
                      </label>
                      <input
                        required
                        type="text"
                        value={student.firstName}
                        onChange={(e) =>
                          setStudent({ ...student, firstName: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Last Name
                      </label>
                      <input
                        required
                        type="text"
                        value={student.lastName}
                        onChange={(e) =>
                          setStudent({ ...student, lastName: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div className="pt-4">
                    <button
                      type="submit"
                      className="bg-slate-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors"
                    >
                      Provision Student
                    </button>
                  </div>
                </form>

                <div className="border-t border-slate-200 pt-8 mt-8">
                  <h3 className="text-lg font-bold text-slate-800 mb-1">
                    Bulk Upload Candidates
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Upload a CSV file, paste the details directly below, or use
                    the quick seed button to register students. Format:{" "}
                    <code className="bg-slate-100 px-1 py-0.5 rounded text-xs text-slate-700">
                      Reg No, First Name, Surname
                    </code>{" "}
                    or{" "}
                    <code className="bg-slate-100 px-1 py-0.5 rounded text-xs text-slate-700">
                      Reg No, Surname, First Name
                    </code>
                    .
                  </p>

                  {/* DITM Quick Seed Banner */}
                  <div className="mb-6 p-4 rounded-xl border border-primary-100 bg-primary-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                    <div className="space-y-1 text-center sm:text-left">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center justify-center sm:justify-start gap-2">
                        <Database className="w-4 h-4 text-primary-600 animate-pulse" />
                        Candidate Quick Setup
                      </h4>
                      <p className="text-xs text-slate-600">
                        Instantly populate the system with standard DITM
                        candidates or generate 1500 concurrent candidates for
                        scale testing.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSeedDefaultCandidates}
                        disabled={isSeedingCandidates || isImporting}
                        className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 shrink-0 cursor-pointer shadow-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {isSeedingCandidates
                          ? "Populating..."
                          : "Seed 88 Candidates"}
                      </button>
                      <button
                        type="button"
                        onClick={handleSeedMassCandidates}
                        disabled={isSeedingCandidates || isImporting}
                        className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 shrink-0 cursor-pointer shadow-sm"
                      >
                        <Database className="w-3.5 h-3.5" />
                        {isSeedingCandidates
                          ? "Populating..."
                          : "Seed 1500 Concurrent Test"}
                      </button>
                    </div>
                  </div>

                  {/* Column Configuration Selector */}
                  <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Column Mapping Preference
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setImportFormat("id-first-last")}
                        className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${importFormat === "id-first-last" ? "border-primary-500 bg-primary-50/20 ring-1 ring-primary-500" : "border-slate-200 bg-white hover:border-slate-300"}`}
                      >
                        <span className="text-xs font-bold text-slate-800">
                          Registration Number, First Name, Surname
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5">
                          Example: DICT-001-001, Aisha, Anan Abubakar (Standard
                          DITM layout)
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setImportFormat("id-last-first")}
                        className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${importFormat === "id-last-first" ? "border-primary-500 bg-primary-50/20 ring-1 ring-primary-500" : "border-slate-200 bg-white hover:border-slate-300"}`}
                      >
                        <span className="text-xs font-bold text-slate-800">
                          Registration Number, Surname, First Name
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5">
                          Example: DICT-001-001, Anan Abubakar, Aisha
                        </span>
                      </button>
                    </div>
                  </div>

                  {importStatus !== "idle" && (
                    <div className="mb-6 p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4 shadow-sm transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          {importStatus === "parsing" && (
                            <div className="w-5 h-5 rounded-full border-2 border-primary-500 border-t-transparent animate-spin shrink-0 mt-0.5" />
                          )}
                          {importStatus === "uploading" && (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-700 border-t-transparent animate-spin shrink-0 mt-0.5" />
                          )}
                          {importStatus === "complete" && (
                            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                          )}
                          {importStatus === "error" && (
                            <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-primary-700 font-bold text-xs">
                                !
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-semibold text-slate-800">
                              {importStatus === "parsing" &&
                                "Parsing File Contents..."}
                              {importStatus === "uploading" &&
                                `Uploading Candidates to Firestore (${importStats.processed} / ${importStats.total})`}
                              {importStatus === "complete" &&
                                "Upload Complete!"}
                              {importStatus === "error" && "Import Error"}
                            </span>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {importStatus === "parsing" &&
                                "Reading sheets and validating candidate details..."}
                              {importStatus === "uploading" &&
                                `Processing chunks of 25 concurrent updates. Checked duplicates and updated entries.`}
                              {importStatus === "complete" &&
                                `Successfully uploaded or updated ${importStats.success} records.${importStats.failed > 0 ? ` Failed on ${importStats.failed} records.` : ""}`}
                              {importStatus === "error" &&
                                "Verify your columns (e.g., Reg No, Surname, First Name). Decimals on candidate IDs have been auto-trimmed."}
                            </p>
                          </div>
                        </div>

                        {(importStatus === "complete" ||
                          importStatus === "error") && (
                          <button
                            onClick={() => setImportStatus("idle")}
                            className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>

                      {(importStatus === "uploading" ||
                        importStatus === "complete") && (
                        <div className="space-y-2">
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
                              style={{ width: `${importProgress}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] font-mono text-slate-500">
                            <span>
                              Progress: {importProgress}% (
                              {importStats.processed} of {importStats.total}{" "}
                              processed)
                            </span>
                            <span>
                              Success:{" "}
                              <span className="text-green-600 font-semibold">
                                {importStats.success}
                              </span>{" "}
                              | Failed:{" "}
                              <span className="text-primary-500 font-semibold">
                                {importStats.failed}
                              </span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    <div className="space-y-3">
                      <span className="block text-sm font-semibold text-slate-700">
                        Option 1: Drag & Drop CSV / Excel File
                      </span>
                      <label
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`flex items-center justify-center w-full h-40 px-4 transition rounded-xl border-2 border-dashed appearance-none cursor-pointer focus:outline-none ${isDragging ? "border-primary-500 bg-primary-50/60" : "border-slate-300 bg-white hover:border-primary-400 hover:bg-slate-50"}`}
                      >
                        <span className="flex flex-col items-center space-y-2 pointer-events-none">
                          <UploadCloud
                            className={`w-8 h-8 transition-colors ${isDragging ? "text-primary-500" : "text-slate-400 group-hover:text-primary-500"}`}
                          />
                          <span
                            className={`font-semibold text-xs text-center transition-colors ${isDragging ? "text-primary-700" : "text-slate-600"}`}
                          >
                            {isDragging
                              ? "Drop your CSV or Excel file here now!"
                              : "Drop your CSV or Excel file here, or click to browse"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Accepts .csv, .xlsx, .xls, .txt files
                          </span>
                        </span>
                        <input
                          type="file"
                          accept=".csv, text/csv, application/csv, text/comma-separated-values, text/plain, application/vnd.ms-excel, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="space-y-3">
                      <span className="block text-sm font-semibold text-slate-700">
                        Option 2: Paste CSV Data Directly
                      </span>
                      <div className="relative">
                        <textarea
                          rows={4}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-slate-50 focus:bg-white transition-all resize-none outline-none"
                          placeholder={
                            importFormat === "id-first-last"
                              ? "DICT-001-001, Aisha, Anan Abubakar\nDICT-001-002, Sa'adatu, Muhammad Bello"
                              : "DICT-001-001, Anan Abubakar, Aisha\nDICT-001-002, Muhammad Bello, Sa'adatu"
                          }
                          value={pastedCSV}
                          onChange={(e) => setPastedCSV(e.target.value)}
                          disabled={isImporting}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleImportPastedCSV}
                        disabled={!pastedCSV.trim() || isImporting}
                        className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Database className="w-4 h-4" />
                        {isImporting
                          ? "Importing..."
                          : "Import Pasted Students"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "subjects" && (
              <form onSubmit={handleAddSubject} className="space-y-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">
                    Add Examination Subject
                  </h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Define a core subject identifier.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Subject Name
                  </label>
                  <input
                    required
                    type="text"
                    value={subjectTitle}
                    onChange={(e) => setSubjectTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g. Mathematics 101"
                  />
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    className="bg-slate-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors"
                  >
                    Save Subject
                  </button>
                </div>
              </form>
            )}

            {activeTab === "exam" && (
              <div className="space-y-8">
                <form onSubmit={handleAddExam} className="space-y-5">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">
                      Configure Global Exam & Timing
                    </h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Adjust duration and global scoring parameters.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Exam Title
                  </label>
                  <input
                    required
                    type="text"
                    value={examConfig.title}
                    onChange={(e) =>
                      setExamConfig({ ...examConfig, title: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g. End of Semester Examinations"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Global Duration (Minutes)
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={examConfig.duration}
                      onChange={(e) =>
                        setExamConfig({
                          ...examConfig,
                          duration: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Total Expected Marks
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={examConfig.marks}
                      onChange={(e) =>
                        setExamConfig({
                          ...examConfig,
                          marks: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    className="bg-slate-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors"
                  >
                    Apply Configuration
                  </button>
                </div>
              </form>

              <hr className="my-8 border-slate-200" />

              <form onSubmit={handleSaveTheme} className="space-y-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">
                    Student Interface Theme
                  </h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Select the color scheme that students will see during their examination.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Color Theme
                    </label>
                    <div className="flex flex-wrap gap-4">
                      {['red', 'blue', 'green', 'indigo', 'purple', 'orange'].map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setGlobalTheme(t)}
                          className={`w-12 h-12 rounded-full border-4 transition-transform ${globalTheme === t ? 'border-slate-800 scale-110' : 'border-transparent hover:scale-105'}`}
                          style={{
                            backgroundColor: `var(--color-${t === 'green' ? 'emerald' : t}-500)`
                          }}
                          aria-label={`${t} theme`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    className="bg-slate-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors"
                  >
                    Save Theme
                  </button>
                </div>
              </form>
            </div>
            )}

            {activeTab === "questions" && (
              <div className="space-y-8">
                <form onSubmit={handleAddQuestion} className="space-y-5">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">
                      Question Bank Master
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">
                      Insert new standardized questions.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Points / Weight
                      </label>
                      <input
                        required
                        type="number"
                        min="1"
                        value={question.points}
                        onChange={(e) =>
                          setQuestion({
                            ...question,
                            points: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Question Format
                      </label>
                      <select
                        required
                        value={question.type}
                        onChange={(e) =>
                          setQuestion({ ...question, type: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                      >
                        <option value="mcq">
                          Multiple Choice Question (MCQ)
                        </option>
                        <option value="tf">True / False</option>
                        <option value="fill">Fill in the Blank</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Question Query
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={question.text}
                      onChange={(e) =>
                        setQuestion({ ...question, text: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-y"
                      placeholder="Describe the question in detail..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Options (Comma separated) - Required for MCQ
                    </label>
                    <input
                      type="text"
                      value={question.options}
                      onChange={(e) =>
                        setQuestion({ ...question, options: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Option A, Option B, Option C, Option D"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Correct Answer (Exact string)
                    </label>
                    <input
                      required
                      type="text"
                      value={question.answer}
                      onChange={(e) =>
                        setQuestion({ ...question, answer: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter the exact correct response"
                    />
                  </div>
                  <div className="pt-4">
                    <button
                      type="submit"
                      className="bg-slate-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors"
                    >
                      Publish to Bank
                    </button>
                  </div>
                </form>
                <div className="border-t border-slate-200 pt-8 mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-1">
                        Question Bank Repository
                      </h3>
                      <p className="text-sm text-slate-500">
                        Manage and search existing questions.
                      </p>
                    </div>
                    <input
                      type="text"
                      placeholder="Search by text or subject..."
                      value={questionsSearchTerm}
                      onChange={(e) => setQuestionsSearchTerm(e.target.value)}
                      className="border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500 w-64"
                    />
                  </div>
                  {loadingQuestions ? (
                    <div className="py-8 text-center text-slate-500">
                      Loading questions...
                    </div>
                  ) : questionsList.length === 0 ? (
                    <div className="py-8 text-center text-slate-500">
                      No questions found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-96 border border-slate-200 rounded-lg">
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-white shadow-sm z-10">
                          <tr className="border-b border-slate-200">
                            <th className="py-3 px-4 text-sm font-semibold text-slate-600">
                              Question Text
                            </th>
                            <th className="py-3 px-4 text-sm font-semibold text-slate-600 w-32">
                              Subject
                            </th>
                            <th className="py-3 px-4 text-sm font-semibold text-slate-600 w-24">
                              Type
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {questionsList
                            .filter((q) => {
                              const search = questionsSearchTerm.toLowerCase();
                              const text = (
                                q.question_text || ""
                              ).toLowerCase();
                              const subject = (q.subject || "").toLowerCase();
                              return (
                                text.includes(search) ||
                                subject.includes(search)
                              );
                            })
                            .map((q) => (
                              <tr
                                key={q.id}
                                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                              >
                                <td
                                  className="py-3 px-4 text-sm text-slate-800 max-w-md truncate"
                                  title={q.question_text}
                                >
                                  {q.question_text}
                                </td>
                                <td className="py-3 px-4 text-sm text-slate-600">
                                  {q.subject}
                                </td>
                                <td className="py-3 px-4 text-sm text-slate-600 uppercase">
                                  {q.question_type}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div className="border-t border-slate-200 pt-8 mt-8">
                  <h3 className="text-lg font-bold text-slate-800 mb-1">
                    Auto-Generate Course Questions
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Click below to auto-generate 150 standard questions for
                    EXCEL, MICROSOFT WORD, POWERPOINT, and ACCESS (600 total)
                    into the database.
                  </p>
                  <button
                    onClick={handleSeedQuestions}
                    disabled={isSeeding}
                    className="flex items-center px-6 py-3 bg-primary-50 text-primary-700 font-medium rounded-lg border border-primary-200 hover:bg-primary-100 transition-colors disabled:opacity-50"
                  >
                    <Database className="w-5 h-5 mr-2" />
                    {isSeeding
                      ? "Seeding Database..."
                      : "Seed 600 Standard Questions"}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "results" && (
              <div className="space-y-5">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">
                      Candidate Exam Results
                    </h3>
                    <p className="text-sm text-slate-500">
                      View and download completed exam results.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Search by Name or Reg No..."
                      value={resultsSearchTerm}
                      onChange={(e) => setResultsSearchTerm(e.target.value)}
                      className="border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500 w-64"
                    />
                    <button
                      onClick={seedDummyResults}
                      disabled={isSeeding}
                      className="bg-primary-50 text-primary-700 px-6 py-2 rounded-lg font-medium border border-primary-200 hover:bg-primary-100 transition-colors flex items-center disabled:opacity-50"
                    >
                      <Database className="w-4 h-4 mr-2" />{" "}
                      {isSeeding ? "Seeding..." : "Seed Data"}
                    </button>
                    <button
                      onClick={downloadCSV}
                      className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center"
                    >
                      <Download className="w-4 h-4 mr-2" /> Download CSV
                    </button>
                    <button
                      onClick={downloadPDF}
                      className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center"
                    >
                      <FileOutput className="w-4 h-4 mr-2" /> Download PDF
                    </button>
                  </div>
                </div>
                {loadingResults ? (
                  <div className="py-8 text-center text-slate-500">
                    Loading results...
                  </div>
                ) : results.length === 0 ? (
                  <div className="py-8 text-center text-slate-500">
                    No results found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="py-3 px-4 text-sm font-semibold text-slate-600">
                            Reg No
                          </th>
                          <th className="py-3 px-4 text-sm font-semibold text-slate-600">
                            Name
                          </th>
                          <th className="py-3 px-4 text-sm font-semibold text-slate-600">
                            Score
                          </th>
                          <th className="py-3 px-4 text-sm font-semibold text-slate-600">
                            Percentage
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.filter((result) => {
                          const search = resultsSearchTerm.toLowerCase();
                          const name = (
                            result.candidate_name || ""
                          ).toLowerCase();
                          const id = (result.candidate_id || "").toLowerCase();
                          return name.includes(search) || id.includes(search);
                        }).length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="py-8 text-center text-slate-500"
                            >
                              No matching results found.
                            </td>
                          </tr>
                        ) : (
                          results
                            .filter((result) => {
                              const search = resultsSearchTerm.toLowerCase();
                              const name = (
                                result.candidate_name || ""
                              ).toLowerCase();
                              const id = (
                                result.candidate_id || ""
                              ).toLowerCase();
                              return (
                                name.includes(search) || id.includes(search)
                              );
                            })
                            .map((result) => (
                              <tr
                                key={result.id}
                                className="border-b border-slate-100 hover:bg-slate-50"
                              >
                                <td className="py-3 px-4 text-sm text-slate-800">
                                  {result.candidate_id}
                                </td>
                                <td className="py-3 px-4 text-sm text-slate-800">
                                  {result.candidate_name}
                                </td>
                                <td className="py-3 px-4 text-sm font-medium text-slate-800">
                                  {result.score} / {result.total_points}
                                </td>
                                <td className="py-3 px-4 text-sm text-slate-600">
                                  {result.percentage}%
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            {activeTab === "security" && (
              <div className="space-y-5">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">
                      Security Violation Logs
                    </h3>
                    <p className="text-sm text-slate-500">
                      Review logged security incidents during candidate exam
                      sessions.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Search by Name or Reg No..."
                      value={securitySearchTerm}
                      onChange={(e) => setSecuritySearchTerm(e.target.value)}
                      className="border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500 w-64"
                    />
                  </div>
                </div>
                {loadingResults ? (
                  <div className="py-8 text-center text-slate-500">
                    Loading security logs...
                  </div>
                ) : results.length === 0 ? (
                  <div className="py-8 text-center text-slate-500">
                    No logs found.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {results
                      .filter((result) => {
                        const search = securitySearchTerm.toLowerCase();
                        const name = (
                          result.candidate_name || ""
                        ).toLowerCase();
                        const id = (result.candidate_id || "").toLowerCase();
                        return name.includes(search) || id.includes(search);
                      })
                      .filter(
                        (result) =>
                          result.security_logs &&
                          result.security_logs.length > 0,
                      ).length === 0 ? (
                      <div className="py-8 text-center text-slate-500">
                        No matching security violations found.
                      </div>
                    ) : (
                      results
                        .filter((result) => {
                          const search = securitySearchTerm.toLowerCase();
                          const name = (
                            result.candidate_name || ""
                          ).toLowerCase();
                          const id = (result.candidate_id || "").toLowerCase();
                          return name.includes(search) || id.includes(search);
                        })
                        .filter(
                          (result) =>
                            result.security_logs &&
                            result.security_logs.length > 0,
                        )
                        .map((result) => (
                          <div
                            key={result.id}
                            className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm"
                          >
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                              <div>
                                <h4 className="font-bold text-slate-800 text-lg">
                                  {result.candidate_name}
                                </h4>
                                <div className="flex items-center gap-4 mt-1">
                                  <span className="text-sm text-slate-500 font-mono">
                                    {result.candidate_id}
                                  </span>
                                  <span className="text-sm text-slate-400">
                                    &bull;
                                  </span>
                                  <span className="text-sm text-slate-500">
                                    {result.subject}
                                  </span>
                                </div>
                              </div>
                              <div className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-bold border border-primary-200 flex items-center">
                                <ShieldAlert className="w-3 h-3 mr-1" />
                                {result.security_logs.length} Violations
                              </div>
                            </div>
                            <div className="px-6 py-4">
                              <table className="w-full text-left text-sm">
                                <thead>
                                  <tr className="text-slate-500 border-b border-slate-100">
                                    <th className="pb-2 font-medium w-48">
                                      Timestamp
                                    </th>
                                    <th className="pb-2 font-medium">
                                      Violation Type
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {result.security_logs.map(
                                    (log: any, idx: number) => (
                                      <tr
                                        key={idx}
                                        className="border-b border-slate-50 last:border-0"
                                      >
                                        <td className="py-3 text-slate-600 font-mono text-xs">
                                          {new Date(
                                            log.timestamp,
                                          ).toLocaleString()}
                                        </td>
                                        <td className="py-3 text-slate-800 capitalize font-medium">
                                          {log.type.replace(/_/g, " ")}
                                        </td>
                                      </tr>
                                    ),
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
