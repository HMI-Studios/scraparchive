import React, { useRef, useState } from 'react';

const TextArea = ({ value, onChange }) => {
  const textareaRef = useRef(null);

  const onKeyDown = (e) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
      e.preventDefault();
  
      const keyText = {
        'Tab': '\t',
        'Enter': '\r\n\t',
      };
      const char = keyText[e.key] ?? '';

      textarea.value = textarea.value.substring(0, start) + char + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + char.length;
    // } else if (e.key === 'Backspace' && start === end && !e.shiftKey) {
    //   const value = textarea.value;
    //   if (start > 1 && value[start - 1] === '\n' && value[start - 2] === '\n') {
    //     e.preventDefault();
    //     // Remove the two newlines
    //     const newValue = value.slice(0, start - 2) + value.slice(start);
    //     textarea.value = newValue;
    //     // Set the cursor position correctly
    //     textarea.selectionStart = textarea.selectionEnd = start - 2;
    //   }
    }
  };

  const handleCopy = (e, isCut) => {
    e.preventDefault();
    e.clipboardData.setData('text/plain', content.replaceAll('\n\t', '\n').substring(Number(content[0] === '\t')));
  };

  const handlePaste = (e) => {
    e.preventDefault();
    let text = e.clipboardData.getData('text/plain').replaceAll('\r\n', '\n').replaceAll('\n', '\r\n\t');
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === 0) text = '\t' + text;
    textarea.value = textarea.value.substring(0, start) + text + textarea.value.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
  }

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onCopy={e => handleCopy(e, false)}
      onCut={e => handleCopy(e, true)}
      onPaste={handlePaste}
    />
  );
};

export default TextArea;