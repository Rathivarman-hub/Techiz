import React, { useState } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark, atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useTheme } from '../context/ThemeContext';
import { FiCopy, FiCheck } from 'react-icons/fi';
import { motion } from 'framer-motion';
import './CodeDisplay.css';

const LANGUAGE_LABELS = { java: 'Java', python: 'Python', c: 'C', cpp: 'C++', javascript: 'JavaScript' };

const CodeDisplay = ({ 
  code, 
  language = 'javascript', 
  showLineNumbers = true,
  showLanguageBadge = true,
  showCopyButton = true,
  className = '',
  title = '',
  height = 'auto'
}) => {
  const { isDark } = useTheme();
  const [copied, setCopied] = useState(false);

  const languageMap = {
    python: 'python',
    javascript: 'javascript',
    js: 'javascript',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
  };

  const mappedLanguage = languageMap[language] || language;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      className={`code-display ${className} ${isDark ? 'dark' : 'light'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {title && (
        <div className="code-display-title">
          <h6>{title}</h6>
        </div>
      )}
      
      <div className="code-display-container" style={{ height }}>
        <div className="code-display-header">
          {showLanguageBadge && (
            <span className="language-badge">
              {LANGUAGE_LABELS[language.toLowerCase()] || language.toUpperCase()}
            </span>
          )}
          <div className="code-display-actions">
            {showCopyButton && (
              <motion.button
                className="copy-button"
                onClick={handleCopy}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="Copy code"
              >
                {copied ? (
                  <>
                    <FiCheck size={16} />
                    <span className="ml-1">Copied!</span>
                  </>
                ) : (
                  <>
                    <FiCopy size={16} />
                    <span className="ml-1">Copy</span>
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>

        <div className="code-content">
          <SyntaxHighlighter
            language={mappedLanguage}
            style={isDark ? atomOneDark : atomOneLight}
            showLineNumbers={showLineNumbers}
            wrapLines={true}
            lineNumberStyle={{
              color: isDark ? '#64748b' : '#cbd5e1',
              paddingRight: '20px',
              userSelect: 'none',
            }}
            customStyle={{
              margin: 0,
              padding: '20px',
              backgroundColor: 'transparent',
              fontSize: '14px',
              lineHeight: '1.6',
              fontFamily: '"Fira Code", "Courier New", monospace',
            }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      </div>
    </motion.div>
  );
};

export default CodeDisplay;
