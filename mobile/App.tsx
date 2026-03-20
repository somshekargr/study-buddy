import "./global.css";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from './src/stores/useAuthStore';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import DocumentDetailScreen from './src/screens/DocumentDetailScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const { hasHydrated, isAuthenticated } = useAuthStore();

  if (!hasHydrated) {
    return null; // Or a splash screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated() ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="DocumentDetail" component={DocumentDetailScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
