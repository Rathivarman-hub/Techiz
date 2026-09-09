import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    language: {
      type: String,
      required: true,
      enum: ['java', 'python', 'c', 'cpp', 'javascript'],
    },
    type: {
      type: String,
      required: true,
      enum: ['mcq', 'output', 'syntax', 'error', 'coding'],
    },
    question: { type: String, required: true },
    codeSnippet: { type: String, default: '' },
    options: [{ type: String }],   // For MCQ / output / syntax / error
    answer: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'easy',
    },
    marks: { type: Number, default: 1 },
    explanation: { type: String, default: '' },
    // Error Learning System Fields
    errorType: {
      type: String,
      enum: [
        'Syntax Error',
        'Runtime Error',
        'Compilation Error',
        'Logical Error',
        'Type Error',
        'Reference Error',
        'Null Pointer Exception',
        'Index Out Of Bounds Exception',
        'No Runtime Error',
        'Undefined Behavior',
      ],
      default: null,
    },
    errorExplanation: { type: String, default: '' },
    correctCode: { type: String, default: '' },
    learningTip: { type: String, default: '' },
  },
  { timestamps: true }
);

// Auto-set marks based on type before save
questionSchema.pre('save', function (next) {
  const marksMap = { mcq: 1, output: 2, syntax: 2, error: 2, coding: 5 };
  this.marks = marksMap[this.type] ?? 1;
  next();
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
// WHY: $sample + $match in startAssessment does a collection scan without an index.
// language+type index lets MongoDB filter before sampling, dramatically faster.

// Used in: startAssessment aggregation ($match: { language })
questionSchema.index({ language: 1, type: 1 });

// Used in: getQuestions filtered queries
questionSchema.index({ language: 1, difficulty: 1 });

// Full-text search on question content (admin search box)
questionSchema.index({ question: 'text' });

export default mongoose.model('Question', questionSchema);
