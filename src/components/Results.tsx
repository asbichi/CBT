import React from 'react';
import { CandidateResult, CandidateInfo, Question } from '../types';
import { 
  CheckCircle, 
  Download, 
  Clock, 
  Award, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  BookOpen, 
  ChevronRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ResultsProps {
  result: CandidateResult;
  candidate: CandidateInfo;
  questions?: Question[];
}

export const Results: React.FC<ResultsProps> = ({ result, candidate, questions = [] }) => {
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Compute subject-wise breakdown
  const subjectBreakdown = React.useMemo(() => {
    if (!questions || questions.length === 0) return [];
    
    const breakdownMap: Record<string, {
      subject: string;
      totalQuestions: number;
      correct: number;
      incorrect: number;
      maxPoints: number;
      earnedPoints: number;
    }> = {};

    questions.forEach(q => {
      const subject = q.subject || 'General';
      if (!breakdownMap[subject]) {
        breakdownMap[subject] = {
          subject,
          totalQuestions: 0,
          correct: 0,
          incorrect: 0,
          maxPoints: 0,
          earnedPoints: 0,
        };
      }

      const stats = breakdownMap[subject];
      stats.totalQuestions++;
      stats.maxPoints += q.points;

      const isCorrect = result.mcqBreakdown[q.id];
      if (isCorrect === true) {
        stats.correct++;
        stats.earnedPoints += q.points;
      } else {
        stats.incorrect++;
      }
    });

    return Object.values(breakdownMap).map(stats => ({
      ...stats,
      percentage: stats.maxPoints > 0 ? (stats.earnedPoints / stats.maxPoints) * 100 : 0
    }));
  }, [questions, result]);

  // Compute question type breakdown
  const typeBreakdown = React.useMemo(() => {
    if (!questions || questions.length === 0) return [];

    const typeMap: Record<string, {
      typeLabel: string;
      total: number;
      correct: number;
      incorrect: number;
    }> = {};

    const typeLabels: Record<string, string> = {
      mcq: 'Multiple Choice (MCQ)',
      mrx: 'Multiple Response (MRX)',
      tf: 'True / False (T/F)',
      fill: 'Fill in the Blanks',
      essay: 'Short Answer / Essay'
    };

    questions.forEach(q => {
      const label = typeLabels[q.type] || q.type;
      if (!typeMap[label]) {
        typeMap[label] = {
          typeLabel: label,
          total: 0,
          correct: 0,
          incorrect: 0
        };
      }

      const stats = typeMap[label];
      stats.total++;
      if (result.mcqBreakdown[q.id] === true) {
        stats.correct++;
      } else {
        stats.incorrect++;
      }
    });

    return Object.values(typeMap).map(stats => ({
      ...stats,
      accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
    }));
  }, [questions, result]);

  const downloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Theme branding colors
    const primaryColor: [number, number, number] = [30, 58, 138]; // Deep Navy Blue
    const secondaryColor: [number, number, number] = [71, 85, 105]; // Slate-600
    const successColor: [number, number, number] = [22, 163, 74]; // Green-600
    const failColor: [number, number, number] = [220, 38, 38]; // Red-600
    const neutralDark: [number, number, number] = [30, 41, 59]; // slate-800
    const neutralMuted: [number, number, number] = [100, 116, 139]; // slate-500
    const lightBg: [number, number, number] = [248, 250, 252]; // slate-50

    // Set standard font style
    doc.setFont("helvetica", "normal");

    // 1. Header Ribbon Banner
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 40, 'F');

    // Header Content
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("OFFICIAL EXAMINATION PERFORMANCE SUMMARY", 105, 16, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(219, 234, 254);
    doc.text("Computer-Based Assessment Center", 105, 23, { align: 'center' });
    doc.text(`Report Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 105, 29, { align: 'center' });

    // 2. Candidate & Exam Profile
    doc.setTextColor(neutralDark[0], neutralDark[1], neutralDark[2]);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("STUDENT PROFILE & EXAM SPECIFICATION", 15, 52);
    
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(15, 54, 195, 54);

    // Profile Grid Layout
    doc.setFontSize(9);
    doc.setTextColor(neutralMuted[0], neutralMuted[1], neutralMuted[2]);
    doc.setFont("helvetica", "normal");
    doc.text("Candidate Name:", 15, 61);
    doc.text("Candidate ID:", 15, 67);
    doc.text("Examination Title:", 15, 73);
    doc.text("Registered Subject:", 15, 79);

    doc.setTextColor(neutralDark[0], neutralDark[1], neutralDark[2]);
    doc.setFont("helvetica", "bold");
    doc.text(candidate.name, 50, 61);
    doc.setFont("helvetica", "oblique");
    doc.text(candidate.id, 50, 67);
    doc.setFont("helvetica", "bold");
    doc.text(candidate.examTitle, 50, 73);
    doc.text(candidate.subject, 50, 79);

    // Right Column Profile Grid
    doc.setFont("helvetica", "normal");
    doc.setTextColor(neutralMuted[0], neutralMuted[1], neutralMuted[2]);
    doc.text("Passing Grade Threshold:", 115, 61);
    doc.text("Exam Duration Elapsed:", 115, 67);
    doc.text("Total Possible Points:", 115, 73);
    doc.text("Actual Score Secured:", 115, 79);

    doc.setTextColor(neutralDark[0], neutralDark[1], neutralDark[2]);
    doc.setFont("helvetica", "bold");
    doc.text("50.0%", 165, 61);
    doc.text(formatTime(result.timeSpent), 165, 67);
    doc.text(`${result.totalPoints} pts`, 165, 73);
    doc.text(`${result.score} pts`, 165, 79);

    // 3. Overall Outcome Highlight Card
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, 86, 180, 24, 'FD');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(neutralDark[0], neutralDark[1], neutralDark[2]);
    doc.text("CANDIDATE SCORE PERCENTAGE", 25, 96);

    const isPass = result.percentage >= 50;
    doc.setFontSize(26);
    if (isPass) {
      doc.setTextColor(successColor[0], successColor[1], successColor[2]);
    } else {
      doc.setTextColor(failColor[0], failColor[1], failColor[2]);
    }
    doc.text(`${result.percentage.toFixed(1)}%`, 110, 103);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(isPass ? "STATUS: PASS" : "STATUS: FAIL", 155, 100);

    // 4. Subject Area Breakdown (Table)
    let tableY = 118;
    if (subjectBreakdown.length > 0) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(neutralDark[0], neutralDark[1], neutralDark[2]);
      doc.text("PERFORMANCE SUMMARY BY SUBJECT CATEGORY", 15, 118);
      doc.line(15, 120, 195, 120);

      const subjectRows = subjectBreakdown.map(sub => [
        sub.subject,
        sub.totalQuestions.toString(),
        sub.correct.toString(),
        sub.incorrect.toString(),
        `${sub.earnedPoints} / ${sub.maxPoints} pts`,
        `${sub.percentage.toFixed(1)}%`
      ]);

      autoTable(doc, {
        startY: 123,
        margin: { left: 15, right: 15 },
        head: [['Subject Module / Area', 'Questions', 'Correct', 'Incorrect', 'Score', 'Accuracy %']],
        body: subjectRows,
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.5,
          halign: 'center'
        },
        columnStyles: {
          0: { halign: 'left', fontStyle: 'bold', cellWidth: 70 },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'center', fontStyle: 'bold' }
        },
        styles: {
          fontSize: 8.5,
          cellPadding: 2.5
        }
      });

      tableY = (doc as any).lastAutoTable.finalY + 10;
    }

    // 5. Question Type breakdown table
    if (typeBreakdown.length > 0) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(neutralDark[0], neutralDark[1], neutralDark[2]);
      doc.text("ACCURACY RATING BY QUESTION FORMAT", 15, tableY);
      doc.line(15, tableY + 2, 195, tableY + 2);

      const typeRows = typeBreakdown.map(t => [
        t.typeLabel,
        t.total.toString(),
        t.correct.toString(),
        t.incorrect.toString(),
        `${t.accuracy.toFixed(1)}%`
      ]);

      autoTable(doc, {
        startY: tableY + 5,
        margin: { left: 15, right: 15 },
        head: [['Question Format', 'Total Count', 'Correct Responses', 'Incorrect Responses', 'Accuracy Rate']],
        body: typeRows,
        theme: 'grid',
        headStyles: {
          fillColor: secondaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.5,
          halign: 'center'
        },
        columnStyles: {
          0: { halign: 'left', fontStyle: 'bold', cellWidth: 70 },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center', fontStyle: 'bold' }
        },
        styles: {
          fontSize: 8.5,
          cellPadding: 2.5
        }
      });
    }

    // 6. Security & Audit Footer on all pages
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(neutralMuted[0], neutralMuted[1], neutralMuted[2]);
      
      doc.setDrawColor(241, 245, 249);
      doc.line(15, 280, 195, 280);
      
      doc.text("Official Academic Assessment Report • Verify and process with authorized system administrator.", 15, 285);
      doc.text(`Page ${i} of ${pageCount}`, 195, 285, { align: 'right' });
    }

    const cleanedFileName = `Result_Summary_${candidate.id}_${candidate.name.replace(/\s+/g, '_')}.pdf`;
    doc.save(cleanedFileName);
  };

  const isPassStatus = result.percentage >= 50;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200"
      >
        {/* Header Ribbon */}
        <div className="p-8 text-center bg-blue-600 text-white relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2 blur-2xl"></div>
            
            <CheckCircle className="w-16 h-16 mx-auto mb-3 text-white/90" />
            <h1 className="text-3xl font-extrabold tracking-tight mb-1">
                Examination Completed
            </h1>
            <p className="text-white/80 font-medium max-w-md mx-auto">Your responses have been successfully compiled and saved in the central examination database.</p>
        </div>

        <div className="p-8 space-y-8">
            {/* Student metadata header */}
            <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Candidate Details</span>
                    <h2 className="text-2xl font-bold text-slate-800 mt-1">{candidate.name}</h2>
                    <p className="text-slate-500 font-mono text-sm mt-0.5">Registration Number: <span className="font-semibold">{candidate.id}</span></p>
                </div>
                <div className="text-left md:text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Exam Identity</span>
                    <div className="mt-1 inline-block px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        {candidate.examTitle}
                    </div>
                    <p className="text-xs font-mono text-slate-500 mt-1.5">Subject: {candidate.subject}</p>
                </div>
            </div>

            {/* Scorecard grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-50/60 p-5 rounded-xl border border-slate-150 text-center flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Percentage Score</span>
                    <span className={`text-3xl font-extrabold block my-2 ${isPassStatus ? 'text-green-600' : 'text-primary-500'}`}>
                        {result.percentage.toFixed(1)}%
                    </span>
                    <div className={`text-xs font-bold py-1 px-3 rounded-full inline-block mx-auto ${isPassStatus ? 'bg-green-100 text-green-700' : 'bg-primary-100 text-primary-700'}`}>
                        {isPassStatus ? 'PASS' : 'FAIL'}
                    </div>
                </div>

                <div className="bg-slate-50/60 p-5 rounded-xl border border-slate-150 text-center flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Marks Obtained</span>
                    <span className="text-3xl font-extrabold text-slate-700 block my-2">
                        {result.score} <span className="text-sm font-normal text-slate-400">/ {result.totalPoints}</span>
                    </span>
                    <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
                        <Award className="w-3.5 h-3.5 text-blue-500" />
                        <span>Weightage points</span>
                    </div>
                </div>

                <div className="bg-slate-50/60 p-5 rounded-xl border border-slate-150 text-center flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Response Distribution</span>
                    <div className="flex justify-around items-center my-2">
                        <div className="text-center">
                            <span className="text-sm font-bold text-green-600 block">{result.correctCount}</span>
                            <span className="text-[9px] text-slate-400 uppercase font-semibold">Correct</span>
                        </div>
                        <div className="h-6 w-px bg-slate-200"></div>
                        <div className="text-center">
                            <span className="text-sm font-bold text-primary-500 block">{result.incorrectCount}</span>
                            <span className="text-[9px] text-slate-400 uppercase font-semibold">Incorrect</span>
                        </div>
                        <div className="h-6 w-px bg-slate-200"></div>
                        <div className="text-center">
                            <span className="text-sm font-bold text-slate-400 block">{result.unansweredCount}</span>
                            <span className="text-[9px] text-slate-400 uppercase font-semibold">Skipped</span>
                        </div>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        <span>{questions.length} Total questions</span>
                    </div>
                </div>

                <div className="bg-slate-50/60 p-5 rounded-xl border border-slate-150 text-center flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Time Spent</span>
                    <span className="text-3xl font-extrabold text-slate-700 block my-2">
                        {formatTime(result.timeSpent)}
                    </span>
                    <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span>Total elapsed</span>
                    </div>
                </div>
            </div>

            {/* Subject breakdowns if questions are provided */}
            {subjectBreakdown.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <h3 className="text-base font-bold text-slate-700 uppercase tracking-wider">Subject Performance Breakdown</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {subjectBreakdown.map((sub, idx) => {
                            const subPass = sub.percentage >= 50;
                            return (
                                <div key={idx} className="border border-slate-150 rounded-xl p-4 space-y-3 bg-white hover:shadow-sm transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm">{sub.subject}</h4>
                                            <p className="text-xs text-slate-400 mt-0.5">Questions Answered: {sub.correct} / {sub.totalQuestions}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-sm font-bold ${subPass ? 'text-green-600' : 'text-primary-500'}`}>{sub.percentage.toFixed(1)}%</span>
                                            <p className="text-[10px] text-slate-400 font-mono">{sub.earnedPoints}/{sub.maxPoints} pts</p>
                                        </div>
                                    </div>

                                    {/* Progress line */}
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${subPass ? 'bg-green-600' : 'bg-primary-500'}`}
                                            style={{ width: `${sub.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Question Type breakdowns */}
            {typeBreakdown.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <TrendingUp className="w-5 h-5 text-slate-600" />
                        <h3 className="text-base font-bold text-slate-700 uppercase tracking-wider">Question Format Accuracy Rating</h3>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        {typeBreakdown.map((type, idx) => (
                            <div key={idx} className="flex-1 min-w-[200px] border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 flex items-center justify-between gap-3">
                                <div>
                                    <span className="text-xs font-semibold text-slate-600 block">{type.typeLabel}</span>
                                    <span className="text-[10px] text-slate-400">Total count: {type.total}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-extrabold text-slate-700 block">{type.accuracy.toFixed(1)}%</span>
                                    <span className="text-[10px] font-semibold text-green-600">{type.correct} correct</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Warning / Advisory Note */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex gap-3 items-start text-sm text-slate-600 leading-relaxed">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold text-slate-700">Official Outcome Acknowledgement</p>
                    <p className="mt-1">The examination results shown above represent a verified, finalized computer-generated log. Your marks and registration ID have been persistently written to the student records. You may download a printable PDF copy of this summary report for your records or personal reference.</p>
                </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4">
                <button 
                  onClick={downloadPDF}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                    <Download className="w-4 h-4" />
                    Download Result Summary (PDF)
                </button>

                <button 
                  onClick={() => window.location.reload()}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                    <FileText className="w-4 h-4" />
                    Return to Login
                </button>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

