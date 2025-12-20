import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HomeScreen from '../screens/Dashboard /HomeScreen';
import AccountDashboard from '../screens/Dashboard /AccountDashboard';
import CRMDashboard from '../screens/Dashboard /CRMDashboard';
import TimesheetScreen from '../screens/Dashboard /TimesheetScreen';
import MoreScreen from '../screens/Dashboard /MoreScreen';
import HRMDashboard from '../screens/Dashboard /HRMDashboard';

const Tab = createBottomTabNavigator();

const DashboardTabs = () => {
  const [fontsLoaded, setFontsLoaded] = useState(Platform.OS === 'android');

  useEffect(() => {
    if (Platform.OS === 'ios') {
      const loadFonts = async () => {
        try {
          const Font = require('react-native-vector-icons/Font');
          await Font.load();
          setFontsLoaded(true);
        } catch (error) {
          console.log('Font loading error:', error);
          setFontsLoaded(false); 
        }
      };
      loadFonts();
    }
  }, []);

  const renderTabIcon = ({ route, color, size, focused }) => {
    let iconName = '';
    let label = '';
    
    switch (route.name) {
      case 'Home':
        iconName = 'home-outline';
        label = '🏠';
        break;
      case 'HRM':
        iconName = focused ? 'people' : 'people-outline';
        label = '👥';
        break;
      case 'CRM':
        iconName = focused ? 'briefcase' : 'briefcase-outline';
        label = '💼';
        break;
      case 'Accounts':
        iconName = 'wallet-outline';
        label = '💰';
        break;
      case 'More':
        iconName = focused ? 'ellipsis-horizontal' : 'ellipsis-horizontal-outline';
        label = '⋯';
        break;
    }

    // If fonts are not loaded on iOS, use emoji fallback
    if (!fontsLoaded && Platform.OS === 'ios') {
      return (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: size * 0.8, color }}>
            {label}
          </Text>
        </View>
      );
    }

    // Try to render the icon
    try {
      return <Ionicons name={iconName} size={size} color={color} />;
    } catch (error) {
      // Fallback if icon fails
      return (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: size * 0.8, color }}>
            {label}
          </Text>
        </View>
      );
    }
  };

  return (
    <Tab.Navigator
      detachInactiveScreens={false}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size, focused }) => 
          renderTabIcon({ route, color, size, focused }),
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: 5,
          height: Platform.OS === 'ios' ? 85 : 60,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: -5,
        },
        sceneContainerStyle: { backgroundColor: '#FFFFFF' },
      })}
      initialRouteName="Home"
      lazy={false}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="HRM" 
        component={HRMDashboard}
        options={{ tabBarLabel: 'HRM' }}
      />
      <Tab.Screen 
        name="CRM" 
        component={CRMDashboard}
        options={{ tabBarLabel: 'CRM' }}
      />
      <Tab.Screen 
        name="Accounts" 
        component={AccountDashboard}
        options={{ tabBarLabel: 'Accounts' }}
      />
      <Tab.Screen 
        name="More" 
        component={MoreScreen}
        options={{ tabBarLabel: 'More' }}
      />
    </Tab.Navigator>
  );
};

export default DashboardTabs;
