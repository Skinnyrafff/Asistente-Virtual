import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UserContextType = {
  username: string | null;
  age: number | null;
  city: string | null;
  setUsername: (name: string, age: number, city: string) => Promise<void>;
  clearUser: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [username, setUsernameState] = useState<string | null>(null);
  const [age, setAgeState] = useState<number | null>(null);
  const [city, setCityState] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const storedUsername = await AsyncStorage.getItem('username');
      const storedAge = await AsyncStorage.getItem('age');
      const storedCity = await AsyncStorage.getItem('city');
      if (storedUsername) setUsernameState(storedUsername);
      if (storedAge) setAgeState(parseInt(storedAge));
      if (storedCity) setCityState(storedCity);
    };
    loadUser();
  }, []);

  const setUsername = async (name: string, userAge: number, userCity: string) => {
    await AsyncStorage.setItem('username', name);
    await AsyncStorage.setItem('age', userAge.toString());
    await AsyncStorage.setItem('city', userCity);
    setUsernameState(name);
    setAgeState(userAge);
    setCityState(userCity);
  };

  const clearUser = async () => {
    await AsyncStorage.removeItem('username');
    await AsyncStorage.removeItem('age');
    await AsyncStorage.removeItem('city');
    setUsernameState(null);
    setAgeState(null);
    setCityState(null);
  };

  return (
    <UserContext.Provider value={{ username, age, city, setUsername, clearUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
