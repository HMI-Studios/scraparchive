import React, { useRef, useState } from 'react';

const TextArea = ({ value, onChange }) => {
  const textareaRef = useRef(null);

  const handleChange = (value) => {
    const textarea = textareaRef.current;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight + 2}px`

    onChange(value);
  }

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
      handleChange(textarea.value);
    } else if (e.key === '-' && textarea.value.substring(start-1, start) === '-') {
      e.preventDefault();
      textarea.value = textarea.value.substring(0, start-1) + '—' + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start;
      handleChange(textarea.value);
    }
  };

  const handleCopy = (e, isCut) => {
    e.preventDefault();
    const textarea = textareaRef.current;
    e.clipboardData.setData('text/plain', textarea.value.replaceAll('\n\t', '\n').substring(Number(textarea.value[0] === '\t')));
    if (isCut) {
      textarea.value = '';
      handleChange(textarea.value);
    }
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
    handleChange(textarea.value);
  }

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      onKeyDown={onKeyDown}
      onCopy={e => handleCopy(e, false)}
      onCut={e => handleCopy(e, true)}
      onPaste={handlePaste}
    />
  );
};

export default TextArea;