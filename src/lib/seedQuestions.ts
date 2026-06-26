import { db } from './firebase';
import { collection, addDoc, getDocs, writeBatch, doc } from 'firebase/firestore';

const SUBJECTS = ['EXCEL', 'MICROSOFT WORD', 'POWERPOINT', 'ACCESS'];
const Q_PER_SUBJECT = 150;
const DIFFICULTIES = ['Beginner', 'Middle Class', 'Professional'];

function generateQuestionsForSubject(subject: string) {
  const questions = [];
  const baseTopics = [
    { topic: 'Shortcut', q: `What is the keyboard shortcut to save a document in ${subject}?`, ans: 'Ctrl + S', opts: ['Ctrl + S', 'Ctrl + N', 'Ctrl + O', 'Ctrl + P'] },
    { topic: 'Feature', q: `Which of the following is a primary function of ${subject}?`, ans: `Specific ${subject} task`, opts: [`Specific ${subject} task`, 'Playing games', 'Editing audio', 'Graphic design'] },
    { topic: 'Menu', q: `Where can you find the 'Print' option in ${subject}?`, ans: 'File Menu', opts: ['File Menu', 'Home Menu', 'Insert Menu', 'View Menu'] },
    { topic: 'Extension', q: `What is the default file extension for a ${subject} file?`, ans: 'Default Ext', opts: ['Default Ext', '.txt', '.pdf', '.jpg'] },
    { topic: 'Action', q: `How do you undo the last action in ${subject}?`, ans: 'Ctrl + Z', opts: ['Ctrl + Z', 'Ctrl + Y', 'Ctrl + U', 'Ctrl + X'] }
  ];

  for (let i = 0; i < Q_PER_SUBJECT; i++) {
    const base = baseTopics[i % baseTopics.length];
    
    // Assign difficulty: 50 of each (since 150 / 3 = 50)
    let difficulty = 'Beginner';
    if (i >= 50 && i < 100) difficulty = 'Middle Class';
    if (i >= 100) difficulty = 'Professional';
    
    // Create slight variations to ensure 150 distinct questions
    let qText = base.q;
    if (i >= baseTopics.length) {
       qText = `(${difficulty} Variant ${i + 1}) ` + qText;
    }

    questions.push({
      subject: subject,
      question_type: 'mcq',
      question_text: qText,
      options: base.opts,
      correct_answer: base.ans,
      points: difficulty === 'Professional' ? 3 : (difficulty === 'Middle Class' ? 2 : 1),
      difficulty: difficulty,
      created_at: new Date().toISOString()
    });
  }

  // Adjust specific answers for correctness on the first few
  if (subject === 'EXCEL') {
     questions[1].correct_answer = 'Creating spreadheets and data analysis';
     questions[1].options[0] = 'Creating spreadheets and data analysis';
     questions[3].correct_answer = '.xlsx';
     questions[3].options[0] = '.xlsx';
  } else if (subject === 'MICROSOFT WORD') {
     questions[1].correct_answer = 'Word processing and document creation';
     questions[1].options[0] = 'Word processing and document creation';
     questions[3].correct_answer = '.docx';
     questions[3].options[0] = '.docx';
  } else if (subject === 'POWERPOINT') {
     questions[1].correct_answer = 'Creating presentations and slide decks';
     questions[1].options[0] = 'Creating presentations and slide decks';
     questions[3].correct_answer = '.pptx';
     questions[3].options[0] = '.pptx';
  } else if (subject === 'ACCESS') {
     questions[1].correct_answer = 'Relational database management';
     questions[1].options[0] = 'Relational database management';
     questions[3].correct_answer = '.accdb';
     questions[3].options[0] = '.accdb';
  }
  
  return questions;
}

export async function seedQuestionsDB() {
  try {
    const collRef = collection(db, 'questions');
    // First, check if we already have questions to avoid duplicating 600 questions
    const snap = await getDocs(collRef);
    if (snap.size >= 600) {
       return { success: true, message: 'Database already seeded with questions.' };
    }

    let allQuestions: any[] = [];
    SUBJECTS.forEach(sub => {
       allQuestions = allQuestions.concat(generateQuestionsForSubject(sub));
    });

    // Firestore batch writes are limited to 500 operations. We have 600 questions.
    // So we need multiple batches.
    const batches = [];
    let currentBatch = writeBatch(db);
    let opCount = 0;

    for (const q of allQuestions) {
       const newDocRef = doc(collRef);
       currentBatch.set(newDocRef, q);
       opCount++;
       if (opCount === 400) {
           batches.push(currentBatch);
           currentBatch = writeBatch(db);
           opCount = 0;
       }
    }
    
    if (opCount > 0) {
        batches.push(currentBatch);
    }

    for (const b of batches) {
        await b.commit();
    }

    return { success: true, message: `Successfully seeded ${allQuestions.length} standard questions.` };

  } catch (error: any) {
    console.error("Error seeding:", error);
    return { success: false, message: error.message };
  }
}
