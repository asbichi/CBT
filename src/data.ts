import { Question } from './types';

export const mockQuestions: Question[] = [
  {
    id: 'q1',
    type: 'mcq',
    text: 'What is the primary function of the mitochondria in a cellular structure?',
    options: [
      'Protein synthesis',
      'Energy generation (ATP)',
      'Waste disposal',
      'Cellular division'
    ],
    correctAnswer: 'Energy generation (ATP)',
    points: 1
  },
  {
    id: 'q2',
    type: 'mrx',
    text: 'Select all the elements that are classified as noble gases.',
    options: [
      'Oxygen',
      'Helium',
      'Nitrogen',
      'Argon',
      'Neon',
      'Chlorine'
    ],
    correctAnswer: ['Helium', 'Argon', 'Neon'],
    points: 2
  },
  {
    id: 'q3',
    type: 'tf',
    text: 'The concept of "time dilation" is a key component of Albert Einstein\'s Theory of General Relativity.',
    options: ['True', 'False'],
    correctAnswer: 'True',
    points: 1
  },
  {
    id: 'q4',
    type: 'fill',
    text: 'The process by which plants convert light energy into chemical energy is called _______.',
    correctAnswer: 'photosynthesis',
    points: 1
  },
  {
    id: 'q5',
    type: 'mcq',
    text: 'In computing, what does the acronym "RAM" stand for?',
    options: [
      'Read Access Memory',
      'Random Access Memory',
      'Rapid Action Memory',
      'Root Access Module'
    ],
    correctAnswer: 'Random Access Memory',
    points: 1
  },
  {
    id: 'q6',
    type: 'essay',
    text: 'Briefly explain the socioeconomic impacts of the Industrial Revolution in 19th century Europe. Mention at least two positive and two negative impacts.',
    points: 5
  },
  {
    id: 'q7',
    type: 'mcq',
    text: 'Which of the following sorting algorithms has the best worst-case time complexity?',
    options: [
      'Quick Sort',
      'Bubble Sort',
      'Merge Sort',
      'Insertion Sort'
    ],
    correctAnswer: 'Merge Sort',
    points: 1
  },
  {
    id: 'q8',
    type: 'mrx',
    text: 'Which of these are required components of a valid React component?',
    options: [
      'It must return JSX, null, or a valid React Node',
      'It must be a class',
      'It must start with an uppercase letter',
      'It must use the useState hook'
    ],
    correctAnswer: ['It must return JSX, null, or a valid React Node', 'It must start with an uppercase letter'],
    points: 2
  },
  {
    id: 'q9',
    type: 'tf',
    text: 'HTTP status code 404 indicates an internal server error.',
    options: ['True', 'False'],
    correctAnswer: 'False',
    points: 1
  },
  {
    id: 'q10',
    type: 'fill',
    text: 'The speed of light in a vacuum is approximately _______ million meters per second. (Enter number only)',
    correctAnswer: '300', // Close enough for a fill in blank format
    points: 1
  }
];

export const CANDIDATE_INFO = {
  name: 'Alex Mercer',
  id: 'CBT-2026-X992A',
  examTitle: 'Dialogue Institute of Technology and Management Kaduna',
  subject: 'Multidisciplinary Core'
};

export const EXAM_DURATION_SECONDS = 30 * 60; // 30 minutes for demo
