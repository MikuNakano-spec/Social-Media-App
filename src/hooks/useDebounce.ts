import { useEffect, useState } from "react";

export default function useDebounce<T>(value: T, delay: number = 250): T {
  const [debouncedValue, setdebouncedvalue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setdebouncedvalue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
