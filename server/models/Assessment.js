import mongoose from 'mongoose';

const assessmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    language: { type: String, required: true },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    answers: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        selectedAnswer: { type: String, default: '' },
        isCorrect: { type: Boolean, default: false },
        timeTaken: { type: Number, default: 0 }, // seconds
      },
    ],
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    rank: { type: Number, default: 0 },
    status: { type: String, enum: ['in-progress', 'completed', 'auto-submitted'], default: 'in-progress' },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// WHY: Without indexes MongoDB does a full collection scan for every query.
// At 100k assessments each query would read every document — O(N) instead of O(log N).

// Most common query: a student's completed assessments
assessmentSchema.index({ userId: 1, status: 1 });

// Leaderboard & admin filter by language + status
assessmentSchema.index({ language: 1, status: 1 });

// Sorting by completion date (used in getAllAssessments, getMyAssessments)
assessmentSchema.index({ completedAt: -1 });

// Pass-rate calculation: percentage >= 40 filter
assessmentSchema.index({ status: 1, percentage: -1 });

// Admin: finding assessments for a student sorted by date
assessmentSchema.index({ userId: 1, completedAt: -1 });

export default mongoose.model('Assessment', assessmentSchema);
