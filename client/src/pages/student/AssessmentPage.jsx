import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronRight, FiChevronLeft, FiSkipForward, FiCheck, FiVolume2, FiVolumeX } from 'react-icons/fi';
import api from '../../api/axios';
import { useTheme } from '../../context/ThemeContext';
import CircularTimer from '../../components/CircularTimer';
import CodeDisplay from '../../components/CodeDisplay';
import Spinner from '../../components/Spinner';
import { useTimer } from '../../hooks/useTimer';
import { useAntiCheat } from '../../hooks/useAntiCheat';
import { useSound } from '../../hooks/useSound';
import './AssessmentPage.css';

const TIMER_SECONDS = 30;

const typeConfig = {
  mcq: { badge: 'badge-mcq', label: 'MCQ', color: '#3b82f6' },
  output: { badge: 'badge-output', label: 'Output Prediction', color: '#06b6d4' },
  syntax: { badge: 'badge-syntax', label: 'Syntax Error', color: '#f59e0b' },
  error: { badge: 'badge-error', label: 'Error Detection', color: '#ef4444' },
  coding: { badge: 'badge-coding', label: 'Coding', color: '#8b5cf6' },
};

const OPTIONS_LETTERS = ['A', 'B', 'C', 'D'];

const AssessmentPage = () => {
  const { language } = useParams();
  const navigate = useNavigate();
  const { colors, isDark } = useTheme();
  const { playTick, playUrgent, playSuccess, playError, toggleSound, isSoundEnabled } = useSound();

  // State
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [warningCount, setWarningCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [fsRequested, setFsRequested] = useState(false);
  const submittedRef = useRef(false);
  const currentQuestion = questions[currentIdx];
  const effectiveAnswer = selectedAnswer;
  const answeredQuestionIds = useMemo(() => new Set(answers.map((answer) => answer.questionId)), [answers]);

  const upsertAnswer = useCallback((questionId, questionAnswer, timeSpent) => {
    if (!questionId) return;
    setAnswers((prev) => {
      const existingIndex = prev.findIndex((answer) => answer.questionId === questionId);
      if (existingIndex === -1) {
        return [...prev, { questionId, selectedAnswer: questionAnswer, timeTaken: timeSpent }];
      }
      const nextAnswers = [...prev];
      nextAnswers[existingIndex] = { ...nextAnswers[existingIndex], selectedAnswer: questionAnswer, timeTaken: timeSpent };
      return nextAnswers;
    });
  }, []);

  // Calculate question stats
  const answeredCount = answers.length;
  const unansweredCount = questions.length - answeredCount;
  const progress = answeredCount > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
  const currentScore = answers.filter((a) => a.selectedAnswer).length;

  // Handle submission
  const handleSubmit = useCallback(async (autoStatus = 'completed') => {
    if (submittedRef.current || !assessment) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const finalAnswers = [...answers];
      if (effectiveAnswer && !answers.find(a => a.questionId === questions[currentIdx]._id)) {
        finalAnswers.push({
          questionId: questions[currentIdx]._id,
          selectedAnswer: effectiveAnswer,
          timeTaken: TIMER_SECONDS - seconds
        });
      }
      await api.post(`/assessments/${assessment}/submit`, { answers: finalAnswers, status: autoStatus });
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
      submittedRef.current = false;
      setSubmitting(false);
    }
  }, [assessment, answers, effectiveAnswer, questions, navigate]);

  // Timer - must be declared before moveNext since moveNext depends on 'seconds'
  const { seconds, percentage, isRunning, isUrgent, start, reset, stop } = useTimer(TIMER_SECONDS, () => {
    if (!questions[currentIdx]?._id) return;
    upsertAnswer(questions[currentIdx]._id, '', TIMER_SECONDS);
  });

  const moveNext = useCallback(() => {
    const activeQuestionId = questions[currentIdx]?._id;
    if (activeQuestionId) {
      if (effectiveAnswer) {
        upsertAnswer(activeQuestionId, effectiveAnswer, TIMER_SECONDS - seconds);
      } else if (!answeredQuestionIds.has(activeQuestionId)) {
        upsertAnswer(activeQuestionId, '', TIMER_SECONDS - seconds);
      }
    }

    const next = currentIdx + 1;
    if (next >= questions.length) {
      playSuccess();
      handleSubmit('completed');
    } else {
      setCurrentIdx(next);
      setSelectedAnswer('');
      setShowFeedback(false);
      reset();
      setTimeout(() => start(), 100);
    }
  }, [currentIdx, questions, effectiveAnswer, seconds, answeredQuestionIds, handleSubmit, playSuccess, upsertAnswer, reset, start]);

  // Handle timer expiration
  useEffect(() => {
    if (seconds === 0 && isRunning && questions.length > 0 && currentQuestion?._id) {
      const questionId = currentQuestion._id;
      if (!answeredQuestionIds.has(questionId)) {
        upsertAnswer(questionId, '', TIMER_SECONDS);
      }
      stop();
      moveNext();
    }
  }, [seconds, isRunning, questions.length, currentQuestion, answeredQuestionIds, upsertAnswer, stop, moveNext]);

  // Sound effects
  useEffect(() => {
    if (!isRunning) return;
    if (isUrgent) playUrgent(seconds);
    else if (seconds % 5 === 0 && seconds !== TIMER_SECONDS) playTick();
  }, [seconds, isUrgent, isRunning]);

  // Anti-cheat
  const handleWarning = useCallback((count, max) => {
    setWarningCount(count);
    setShowWarning(true);
    if (count >= max) {
      setTimeout(() => { handleSubmit('auto-submitted'); }, 2000);
    } else {
      setTimeout(() => setShowWarning(false), 3000);
    }
  }, [handleSubmit]);

  const { activate, deactivate, enterFullscreen } = useAntiCheat({ onWarning: handleWarning, maxWarnings: 3 });

  // Initialize assessment
  useEffect(() => {
    const startAssessment = async () => {
      try {
        const { data } = await api.post('/assessments/start', { language });
        setAssessment(data.data.assessmentId);
        setQuestions(data.data.questions);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Could not start assessment');
        navigate('/languages');
      } finally {
        setLoading(false);
      }
    };
    startAssessment();
  }, [language, navigate]);

  // Fullscreen and anti-cheat
  useEffect(() => {
    if (!loading && questions.length > 0 && !fsRequested) {
      setFsRequested(true);
      enterFullscreen();
      setTimeout(() => activate(), 500);
      start();
    }
    return () => deactivate();
  }, [loading, questions.length, enterFullscreen, activate, deactivate, start]);

  // Reset timer when question changes
  useEffect(() => {
    if (questions.length > 0 && currentIdx > 0) {
      reset();
      setTimeout(() => start(), 100);
    }
  }, [currentIdx, questions.length, reset, start]);

  // Restore an answer when navigating back to an already answered question.
  useEffect(() => {
    const question = questions[currentIdx];
    const savedAnswer = answers.find((answer) => answer.questionId === question?._id);
    if (!savedAnswer) return;

    setSelectedAnswer(savedAnswer.selectedAnswer);
  }, [currentIdx, questions, answers]);

  // Handlers
  const handleSelect = (opt) => {
    setSelectedAnswer(opt);
    setShowFeedback(false);
  };

  const handleAnswerSubmit = () => {
    if (!effectiveAnswer) {
      toast.warning('Please select an answer');
      return;
    }
    const timeTaken = TIMER_SECONDS - seconds;
    upsertAnswer(questions[currentIdx]._id, effectiveAnswer, timeTaken);
    stop();
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (questions[currentIdx]?._id) {
      const timeTaken = TIMER_SECONDS - seconds;
      upsertAnswer(questions[currentIdx]._id, effectiveAnswer || '', timeTaken);
    }
    moveNext();
  };

  const handleSkip = () => {
    if (questions[currentIdx]?._id) {
      const timeTaken = TIMER_SECONDS - seconds;
      upsertAnswer(questions[currentIdx]._id, '', timeTaken);
    }
    moveNext();
  };

  // Jump to question
  const handleJumpQuestion = (index) => {
    const targetQuestion = questions[index];
    if (!targetQuestion || index === currentIdx) return;
    if (index < currentIdx || answeredQuestionIds.has(targetQuestion._id)) return;

    if (selectedAnswer && !answeredQuestionIds.has(questions[currentIdx]._id)) {
      const timeTaken = TIMER_SECONDS - seconds;
      upsertAnswer(questions[currentIdx]._id, effectiveAnswer, timeTaken);
    }
    setCurrentIdx(index);
    setSelectedAnswer('');
    setShowFeedback(false);
    reset();
    setTimeout(() => start(), 100);
  };

  if (loading) return <Spinner text="Preparing your assessment..." />;
  if (submitting) return <Spinner text="Submitting your answers..." />;
  if (questions.length === 0) return null;

  const q = questions[currentIdx];
  const answerOptions = q.options || [];
  const isAnswered = answers.some(a => a.questionId === q._id);
  const currentAnswer = answers.find(a => a.questionId === q._id)?.selectedAnswer;

  return (
    <div className={`assessment-page ${isDark ? 'dark' : 'light'}`}>
      {/* Warning Overlay */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            className="warning-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowWarning(false)}
          >
            <motion.div
              className="warning-content"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <div className="warning-icon">Warning</div>
              <h3>Warning {warningCount}/3</h3>
              <p>Please stay on the assessment page</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="assessment-layout">
        {/* LEFT SIDEBAR - Question Navigator */}
        <motion.aside
          className="question-navigator"
          initial={{ x: -300 }}
          animate={{ x: sidebarOpen ? 0 : -300 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="navigator-header">
            <h5>Questions</h5>
            <span className="navigator-badge">{currentIdx + 1}/{questions.length}</span>
          </div>

          <div className="navigator-stats">
            <div className="stat">
              <span className="stat-label">Answered</span>
              <span className="stat-value answered">{answeredCount}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Unanswered</span>
              <span className="stat-value unanswered">{unansweredCount}</span>
            </div>
          </div>

          <div className="navigator-list">
            {questions.map((que, idx) => {
              const isCurrentQuestion = idx === currentIdx;
              const isQuestionAnswered = answeredQuestionIds.has(que._id);
              const isLocked = idx < currentIdx || isQuestionAnswered;
              return (
                <motion.button
                  key={que._id}
                  className={`navigator-item ${isCurrentQuestion ? 'active' : ''} ${isQuestionAnswered ? 'answered' : ''}`}
                  onClick={() => handleJumpQuestion(idx)}
                  disabled={isLocked}
                  whileHover={isLocked ? undefined : { x: 4 }}
                  whileTap={isLocked ? undefined : { x: 0 }}
                >
                  <span className="navigator-number">{idx + 1}</span>
                  <div className="navigator-info">
                    <span className="navigator-type">{typeConfig[que.type]?.label}</span>
                    {isQuestionAnswered && <FiCheck size={14} className="navigator-check" />}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.aside>

        {/* Toggle Sidebar Button */}
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          {sidebarOpen ? <FiChevronLeft /> : <FiChevronRight />}
        </button>

        {/* CENTER - Question Content */}
        <main className="question-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              className="question-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Question Header */}
              <div className="question-header">
                <div className="question-title-section">
                  <h2 className="question-number">Question {currentIdx + 1}</h2>
                  <span className={`question-type-badge ${typeConfig[q.type]?.badge}`}>
                    {typeConfig[q.type]?.label}
                  </span>
                  <span className={`question-language-badge`}>
                    {language.toUpperCase()}
                  </span>
                </div>
                <div className="question-actions">
                  <motion.button
                    className="sound-btn"
                    onClick={() => { const s = toggleSound(); setSoundOn(s); }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {soundOn ? <FiVolume2 size={18} /> : <FiVolumeX size={18} />}
                  </motion.button>
                </div>
              </div>

              {/* Question Text */}
              <div className="question-text-section">
                <h3 className="question-text">{q.question}</h3>
              </div>

              {/* Code Display */}
              {q.codeSnippet && (
                <CodeDisplay
                  code={q.codeSnippet}
                  language={language}
                  title="Code Snippet"
                  height="300px"
                />
              )}

              {/* Options */}
              <div className="options-section">
                <h5 className="options-title">Select Your Answer</h5>
                {answerOptions && answerOptions.length > 0 ? (
                  <div className="options-grid">
                    {answerOptions.map((opt, i) => (
                      <motion.button
                        key={i}
                        className={`option-btn ${selectedAnswer === opt ? 'selected' : ''} ${isAnswered && currentAnswer === opt ? 'answered' : ''}`}
                        onClick={() => handleSelect(opt)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="option-letter">{OPTIONS_LETTERS[i]}</span>
                        <span className="option-text">{opt}</span>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <textarea
                    className="coding-input"
                    rows={8}
                    placeholder="Write your code here..."
                    value={selectedAnswer}
                    onChange={(e) => handleSelect(e.target.value)}
                    style={{ fontFamily: '"Fira Code", monospace' }}
                  />
                )}
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <div className="center-actions">
                  <motion.button
                    className="btn-outline"
                    onClick={handleSkip}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiSkipForward size={18} />
                    Skip
                  </motion.button>

                  {(!isAnswered || !showFeedback) ? (
                    <motion.button
                      className="btn-primary"
                      onClick={handleAnswerSubmit}
                      disabled={!selectedAnswer}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiCheck size={18} />
                      {isAnswered ? 'Review' : 'Answer'}
                    </motion.button>
                  ) : (
                    <motion.button
                      className="btn-success"
                      onClick={handleNext}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {currentIdx === questions.length - 1 ? 'Finish' : 'Next'}
                    </motion.button>
                  )}
                </div>

              </div>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* RIGHT SIDEBAR - Timer and Progress */}
        <aside className="progress-sidebar">
          {/* Timer */}
          <div className="timer-section">
            <CircularTimer
              seconds={seconds}
              totalSeconds={TIMER_SECONDS}
              isUrgent={isUrgent}
            />
            <div className="timer-info">
              <p className="timer-label">Time Remaining</p>
              <p className={`timer-value ${isUrgent ? 'urgent' : ''}`}>{seconds}s</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="progress-section">
            <div className="progress-header">
              <h5>Progress</h5>
              <span className="progress-percentage">{progress}%</span>
            </div>
            <div className="progress-bar">
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              />
            </div>
            <div className="progress-text">
              <span>{answeredCount} answered</span>
              <span>{unansweredCount} remaining</span>
            </div>
          </div>

          {/* Score Preview */}
          <div className="score-section">
            <h5>Answered</h5>
            <div className="score-display">
              <span className="score-value">{currentScore}</span>
              <span className="score-total">/ {questions.length}</span>
            </div>
          </div>

          {/* Statistics */}
          <div className="stats-section">
            <div className="stat-item">
              <span className="stat-name">Question {currentIdx + 1}</span>
              <span className="stat-number">{questions.length} total</span>
            </div>
            <div className="stat-item">
              <span className="stat-name">Time/Question</span>
              <span className="stat-number">30 sec</span>
            </div>
            <div className="stat-item">
              <span className="stat-name">Warning</span>
              <span className={`stat-number ${warningCount > 0 ? 'warning' : ''}`}>
                {warningCount}/3
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AssessmentPage;
