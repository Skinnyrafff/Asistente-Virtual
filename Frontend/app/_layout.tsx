// app/_layout.tsx
// app/_layout.tsx
import React, { useEffect } from 'react';
import { Slot, useRouter } from 'expo-router';
import { UserProvider, useUser } from '../context/UserContext';
import { API_URL } from '../constants/Api';

const EMERGENCY_CONTACTS_API_URL = `${API_URL}/emergency/contacts`;

function AppContent() {
  const { username, token } = useUser();
  const router = useRouter();

  // TODO: Futura implementación de redirección de onboarding
  // useEffect(() => {
  //   const checkEmergencyContacts = async () => {
  //     if (username && token) {
  //       try {
  //         const response = await fetch(EMERGENCY_CONTACTS_API_URL, {
  //           headers: {
  //             'Authorization': `Bearer ${token}`,
  //           },
  //         });

  //         if (response.ok) {
  //           const data = await response.json();
  //           if (data.length === 0) {
  //             router.replace('/onboarding/emergency-contact');
  //           }
  //         } else if (response.status === 404) {
  //           router.replace('/onboarding/emergency-contact');
  //         } else {
  //           console.error('Failed to fetch emergency contacts:', response.status);
  //         }
  //       } catch (error) {
  //         console.error('Error checking emergency contacts:', error);
  //       }
  //     }
  //   };

  //   // Only run this effect if the router is ready
  //   if (router.isReady) {
  //     checkEmergencyContacts();
  //   }
  // }, [username, token, router.isReady]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}
