import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HomeScreen from '../screens/Dashboard /HomeScreen';
import AttendanceScreen from '../screens/Dashboard /AttendanceScreen';
import LeaveScreen from '../screens/Dashboard /LeaveScreen';
import ExpenseScreen from '../screens/Dashboard /ExpenseScreen';
import LeadStack from './LeadStack';

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
      case 'Attendance':
        iconName = focused ? 'finger-print' : 'finger-print-outline';
        label = '🕑';
        break;
      case 'Leaves':
        iconName = focused ? 'calendar-number' : 'calendar-number-outline';
        label = '📅';
        break;
      case 'Expense':
        iconName = 'wallet-outline';
        label = '💰';
        break;
      case 'Leads':
        iconName = 'people-outline';
        label = '👥';
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
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="Attendance" 
        component={AttendanceScreen}
        options={{ tabBarLabel: 'Attendance' }}
      />
      <Tab.Screen 
        name="Leaves" 
        component={LeaveScreen}
        options={{ tabBarLabel: 'Leaves' }}
      />
      <Tab.Screen 
        name="Expense" 
        component={ExpenseScreen}
        options={{ tabBarLabel: 'Expense' }}
      />
      <Tab.Screen 
        name="Leads" 
        component={LeadStack}
        options={{ tabBarLabel: 'Leads' }}
      />
    </Tab.Navigator>
  );
};

export default DashboardTabs;
