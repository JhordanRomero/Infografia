import React, { useState, useRef, useEffect } from 'react';

interface EditableValueProps {
  initialValue: string;
  onSave: (newValue: string) => void;
  className?: string;
  inputClassName?: string;
  ariaLabel: string;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const EditableValue: React.FC<EditableValueProps> = ({ initialValue, onSave, className, inputClassName, ariaLabel, fullWidth = true, children }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleStartEditing = () => {
    const numericPart = String(initialValue).match(/-?\d+(\.\d+)?/);
    setValue(numericPart ? numericPart[0] : initialValue);
    setIsEditing(true);
  };

  const handleSave = () => {
    const numericPart = String(initialValue).match(/-?\d+(\.\d+)?/);
    const initialNumericValue = numericPart ? numericPart[0] : initialValue;
    
    if (value.trim() !== initialNumericValue) {
        onSave(value.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setValue(initialValue);
      setIsEditing(false);
    }
  };
  
  return (
    <span className={`relative editable-value-container inline-block ${fullWidth ? 'w-full' : 'w-auto'}`}>
        <span
          onClick={handleStartEditing}
          className={`value-display cursor-pointer hover:bg-sky-blue/30 rounded px-1 transition-colors ${className} ${isEditing ? 'invisible' : ''}`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') handleStartEditing(); }}
          aria-label={`${ariaLabel}: ${initialValue}. Click to edit.`}
        >
          {children || initialValue}
        </span>
        {isEditing && (
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className={`editable-input absolute inset-0 bg-white/80 border border-true-blue rounded px-1 py-0 m-0 w-full h-full ${className} ${inputClassName}`}
                aria-label={ariaLabel}
            />
        )}
    </span>
  );
};

export default EditableValue;