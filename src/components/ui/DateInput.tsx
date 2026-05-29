'use client';

import { useState, useEffect, useRef } from 'react';
import { format, parse, isValid } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';

interface DateInputProps {
  value?: string; // Expects 'YYYY-MM-DD'
  onChange: (value: string) => void; // Emits 'YYYY-MM-DD'
  placeholder?: string;
  className?: string;
  calendarOnly?: boolean;
}

export function DateInput({ value, onChange, placeholder = 'MM/DD/YYYY', className = '', calendarOnly = false }: DateInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) {
      const date = parse(value, 'yyyy-MM-dd', new Date());
      if (isValid(date)) {
        setDisplayValue(format(date, 'MM/dd/yyyy'));
      }
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleDisplayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (calendarOnly) return;
    const rawDigits = e.target.value.replace(/\D/g, '').slice(0, 8);
    let masked = rawDigits;
    if (rawDigits.length > 2) masked = `${rawDigits.slice(0, 2)}/${rawDigits.slice(2)}`;
    if (rawDigits.length > 4) masked = `${rawDigits.slice(0, 2)}/${rawDigits.slice(2, 4)}/${rawDigits.slice(4)}`;
    setDisplayValue(masked);

    if (rawDigits.length !== 8) {
      onChange('');
      return;
    }

    const parsedDate = parse(masked, 'MM/dd/yyyy', new Date());
    if (isValid(parsedDate) && format(parsedDate, 'MM/dd/yyyy') === masked) {
      onChange(format(parsedDate, 'yyyy-MM-dd'));
    }
  };

  const handleHiddenDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoDate = e.target.value;
    if (isoDate) {
      onChange(isoDate);
      setDisplayValue(format(parse(isoDate, 'yyyy-MM-dd', new Date()), 'MM/dd/yyyy'));
    }
  };

  const handleBlur = () => {
    // On blur, ensure the display value is correctly formatted or cleared
    if (value) {
        const date = parse(value, 'yyyy-MM-dd', new Date());
        if (isValid(date)) {
            setDisplayValue(format(date, 'MM/dd/yyyy'));
        } else {
            setDisplayValue('');
        }
    } else {
        setDisplayValue('');
    }
  };

  return (
    <div className="relative flex items-center">
      <Input
        type="text"
        placeholder={placeholder}
        value={displayValue}
        maxLength={10}
        onChange={handleDisplayChange}
        onBlur={handleBlur}
        readOnly={calendarOnly}
        onKeyDown={calendarOnly ? (e) => e.preventDefault() : undefined}
        onPaste={calendarOnly ? (e) => e.preventDefault() : undefined}
        className={`h-10 bg-background pr-10 ${className}`}
      />
      <input
        type="date"
        ref={dateInputRef}
        value={value || ''}
        onChange={handleHiddenDateChange}
        className="absolute w-0 h-0 opacity-0"
        tabIndex={-1}
      />
      <Button
        type="button"
        variant="ghost"
        className="absolute right-0 h-9 w-10 px-2"
        onClick={() => dateInputRef.current?.showPicker()}
      >
        <CalendarIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
