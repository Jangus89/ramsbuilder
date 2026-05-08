'use client';
import { useState, useEffect } from 'react';

export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) setValue(JSON.parse(stored));
    } catch {}
  }, [key]);

  const set = (next) => {
    const val = typeof next === 'function' ? next(value) : next;
    setValue(val);
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  };

  return [value, set];
}
