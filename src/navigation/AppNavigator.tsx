import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SplashScreen from '../screens/SplashScreen';
import AuthStack from './AuthStack';
import DrawerNavigator from './DrawerNavigator';
import LeaveScreen from '../screens/Dashboard /LeaveScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const sid = await AsyncStorage.getItem('sid');
        setHasSession(!!sid);
      } catch (error) {
        console.log('Session check error:', error);
        setHasSession(false);
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
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={hasSession ? 'Dashboard' : 'Auth'}
      >
        <Stack.Screen name="Auth" component={AuthStack} />
        <Stack.Screen name="Dashboard" component={DrawerNavigator} />
        <Stack.Screen name="Leaves" component={LeaveScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
