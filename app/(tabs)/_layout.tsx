import React from 'react';
import { Tabs } from 'expo-router';
import { ArrowLeftRight, Calendar, Compass, Target, User } from 'lucide-react-native';
import { colors } from '@/components/ui';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '800',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color }) => <Compass size={23} color={color} />,
        }}
      />
      <Tabs.Screen
        name="skills"
        options={{
          title: 'Skills',
          tabBarIcon: ({ color }) => <Target size={23} color={color} />,
        }}
      />
      <Tabs.Screen
        name="exchanges"
        options={{
          title: 'Exchanges',
          tabBarIcon: ({ color }) => <ArrowLeftRight size={23} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          title: 'Sessions',
          tabBarIcon: ({ color }) => <Calendar size={23} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={23} color={color} />,
        }}
      />
    </Tabs>
  );
}
