import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.light.tint,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          height: 75,
          paddingBottom: 10,
        },
      }}
    >
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'alarm' : 'alarm-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={focused ? 36 : 28} color={focused ? Colors.light.tint : Colors.app.darkText} />
          ),
          tabBarLabel: 'Home', // Add a label for clarity
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'heart' : 'heart-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="emergency"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'warning' : 'warning-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
