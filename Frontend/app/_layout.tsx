// app/_layout.tsx
import React from 'react';
import { Slot } from 'expo-router';
import { UserProvider } from '../context/UserContext';  // ruta según tu estructura

export default function RootLayout() {
  return (
    <UserProvider>
      <Slot />
    </UserProvider>
  );
}
