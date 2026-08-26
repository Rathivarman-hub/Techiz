import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import CodeDisplay from './CodeDisplay';
import { FiAlertCircle, FiCheckCircle, FiInfo, FiChevronDown } from 'react-icons/fi';
import './ErrorLearningSystem.css';

const ErrorLearningSystem = ({ 
  question, 
  selectedAnswer, 
  showFeedback = false,
  isCorrect = null,
  language = 'javascript'
}) => {
  const { colors, isDark } = useTheme();
  const [expanded, setExpanded] = React.useState(true);

  if (!showFeedback || !question?.errorType || !selectedAnswer) {
    return null;
  }

  const errorIcons = {
    'Syntax Error': <FiAlertCircle className="error-icon syntax-error" />,
    'Runtime Error': <FiAlertCircle className="error-icon runtime-error" />,
    'Compilation Error': <FiAlertCircle className="error-icon compilation-error" />,
    'Logical Error': <FiAlertCircle className="error-icon logical-error" />,
    'Type Error': <FiAlertCircle className="error-icon type-error" />,
    'Reference Error': <FiAlertCircle className="error-icon reference-error" />,
    'Null Pointer Exception': <FiAlertCircle className="error-icon null-pointer-error" />,
    'Index Out Of Bounds Exception': <FiAlertCircle className="error-icon index-error" />,
    'No Runtime Error': <FiCheckCircle className="error-icon no-error" />,
    'Undefined Behavior': <FiAlertCircle className="error-icon undefined-behavior" />,
  };

  return (
    <AnimatePresence>
      <motion.div
        className={`error-learning-system ${isDark ? 'dark' : 'light'}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        {/* Main Card */}
        <div className={`error-card ${isCorrect === true ? 'correct' : isCorrect === false ? 'incorrect' : ''}`}>
          <motion.div
            className="error-card-header"
            onClick={() => setExpanded(!expanded)}
            style={{ cursor: 'pointer' }}
          >
            <div className="error-header-content">
              <div className="error-icon-wrapper">
                {errorIcons[question.errorType]}
              </div>
              <div className="error-info">
                <h5 className="error-type">{question.errorType}</h5>
                <p className="error-status">
                  {isCorrect === true ? 'Correct! No error found.' : isCorrect === false ? 'Error detected in the code' : 'Answer recorded'}
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: expanded ? 0 : -90 }}
              transition={{ duration: 0.3 }}
            >
              <FiChevronDown size={20} />
            </motion.div>
          </motion.div>

          {/* Expanded Content */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                className="error-card-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Error Explanation */}
                <div className="error-section">
                  <div className="section-header">
                    <FiAlertCircle size={18} />
                    <h6>Why the Error Occurred</h6>
                  </div>
                  <p className="explanation">
                    {question.errorExplanation}
                  </p>
                </div>

                {/* Correct Code */}
                {question.correctCode && (
                  <div className="error-section">
                    <div className="section-header">
                      <FiCheckCircle size={18} />
                      <h6>Correct Code</h6>
                    </div>
                    <CodeDisplay
                      code={question.correctCode}
                      language={language}
                      showLineNumbers={false}
                      showLanguageBadge={false}
                      height="200px"
                    />
                  </div>
                )}

                {/* Learning Tip */}
                {question.learningTip && (
                  <div className="error-section learning-tip">
                    <div className="section-header">
                      <FiInfo size={18} />
                      <h6>Learning Tip</h6>
                    </div>
                    <p className="tip-text">
                      {question.learningTip}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Stats */}
        <div className="error-stats">
          <div className="stat-item">
            <span className="stat-label">Error Type</span>
            <span className={`stat-value type-badge ${question.errorType.replace(/\s+/g, '-').toLowerCase()}`}>
              {question.errorType}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Your Answer</span>
            <span className="stat-value">{selectedAnswer}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Status</span>
            <span className={`stat-value status-badge ${isCorrect === true ? 'correct' : isCorrect === false ? 'incorrect' : ''}`}>
              {isCorrect === true ? 'Correct' : isCorrect === false ? 'Incorrect' : 'Pending result'}
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ErrorLearningSystem;
