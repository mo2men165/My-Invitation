import { useState, useEffect, useCallback } from 'react';
import { CART_MODAL_CONSTANTS } from '@/constants/cartModalConstants';

export const useDebouncedInput = <T>(
  initialValue: T,
  delay: number = CART_MODAL_CONSTANTS.DEBOUNCE_DELAY,
  onChange?: (value: T) => void
) => {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);

  // Sync with external changes to initialValue
  useEffect(() => {
    setValue(initialValue);
    setDebouncedValue(initialValue);
  }, [initialValue]);

  // Update debounced value after delay
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
      if (onChange) {
        onChange(value);
      }
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay, onChange]);

  // Update value immediately
  const setValueImmediate = useCallback((newValue: T) => {
    setValue(newValue);
  }, []);

  return {
    value,
    debouncedValue,
    setValue: setValueImmediate,
  };
};
