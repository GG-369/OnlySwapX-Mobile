import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    AsyncStorage.getItem(key).then(item => {
      if (item) setStoredValue(JSON.parse(item));
    });
  }, [key]);

  const setValue = async (value: T) => {
    setStoredValue(value);
    await AsyncStorage.setItem(key, JSON.stringify(value));
  };

  return [storedValue, setValue] as const;
}