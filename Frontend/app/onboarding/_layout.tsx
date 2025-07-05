import React, { useEffect, useState } from 'react';
import { Slot, useRouter } from 'expo-router';
import { useUser } from '../../context/UserContext';
import { API_URL } from '../../constants/Api';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

interface EmergencyContact {
  id: number;
  name: string;
  phone_number: string;
  relationship: string;
}

export default function OnboardingLayout() {
  const router = useRouter();
  const { username, token } = useUser();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkEmergencyContacts = async () => {
      if (!username || !token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/emergency/contacts/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data: EmergencyContact[] = await response.json();
          if (data.length > 0) {
            // User has emergency contacts, redirect to home
            router.replace('/(tabs)/home');
          } else {
            // No emergency contacts, allow onboarding screen to show
            setIsLoading(false);
          }
        } else if (response.status === 404) {
          // No contacts found (API returns 404 if no contacts), allow onboarding screen to show
          setIsLoading(false);
        } else {
          // Other error, allow onboarding screen to show but log error
          console.error('Error fetching emergency contacts:', await response.text());
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Network error checking emergency contacts:', error);
        setIsLoading(false);
      }
    };

    checkEmergencyContacts();
  }, [username, token]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return <Slot />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});