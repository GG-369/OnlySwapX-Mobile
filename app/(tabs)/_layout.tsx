import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../src/lib/auth-context';
import { ActivityIndicator, View } from 'react-native';
import { LayoutDashboard, Compass, User } from 'lucide-react-native';

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <View style={{flex:1, justifyContent:'center'}}><ActivityIndicator /></View>;
  if (!isAuthenticated) return <Redirect href="/(auth)/sign-in" />;

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: ({color}) => <LayoutDashboard color={color} size={24} /> }} />
      <Tabs.Screen name="explore" options={{ title: 'Explorar', tabBarIcon: ({color}) => <Compass color={color} size={24} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({color}) => <User color={color} size={24} /> }} />
    </Tabs>
  );
}