import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getSession } from '../services/storage/secureStorage';

import SplashScreen from '../screens/SplashScreen';
import AuthStack from './AuthStack';
import DrawerNavigator from './DrawerNavigator';
import LeaveScreen from '../screens/Dashboard /LeaveScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [initialRoute, setInitialRoute] = useState<'Auth' | 'Dashboard'>('Auth');

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getSession();
        const ok = !!session?.sid || !!session?.user_id || !!session?.user_email;
        setHasSession(ok);
        setInitialRoute(ok ? 'Dashboard' : 'Auth');
      } catch (error) {
        console.log('Session check error:', error);
        setHasSession(false);
        setInitialRoute('Auth');
      } finally {
        // allow splash to be visible briefly
        setTimeout(() => setIsCheckingSession(false), 1200);
      }
    };
    checkSession();
  }, []);

  if (isCheckingSession) return <SplashScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
        {hasSession ? (
          <>
            <Stack.Screen name="Dashboard" component={DrawerNavigator} />
            {/* <Stack.Screen name="Leaves" component={LeaveScreen} /> */}
            <Stack.Screen name="Auth" component={AuthStack} />
          </>
        ) : (
          <>
            <Stack.Screen name="Auth" component={AuthStack} />
            <Stack.Screen name="Dashboard" component={DrawerNavigator} />
            <Stack.Screen name="Leaves" component={LeaveScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
