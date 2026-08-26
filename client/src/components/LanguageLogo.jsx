import React from 'react';
import { FaJava } from 'react-icons/fa';
import { SiC, SiCplusplus, SiJavascript, SiPython } from 'react-icons/si';

const languageIcons = {
  java: FaJava,
  python: SiPython,
  c: SiC,
  cpp: SiCplusplus,
  javascript: SiJavascript,
};

const LanguageLogo = ({ language, size = 'md', className = '', style }) => {
  const Icon = languageIcons[language];
  if (!Icon) return null;

  return (
    <span className={`language-logo language-logo-${size} ${className}`} style={style} aria-label={`${language} logo`}>
      <Icon aria-hidden="true" />
    </span>
  );
};

export default LanguageLogo;