import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HomeScreen from '../screens/Dashboard /HomeScreen'
import AttendanceScreen from '../screens/Dashboard /AttendanceScreen'
import LeaveScreen from '../screens/Dashboard /LeaveScreen'
import ExpenseScreen from '../screens/Dashboard /ExpenseScreen'
import LeadScreen from '../screens/Dashboard /LeadScreen'

const Tab = createBottomTabNavigator();

const DashboardTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ color, size }) => {
        let iconName = '';
        switch (route.name) {
          case 'Home':
            iconName = 'home-outline';
            break;
          case 'Attendance':
            iconName = 'calendar-outline';
            break;
          case 'Leaves':
            iconName = 'leaf-outline';
            break;
          case 'Expense':
            iconName = 'wallet-outline';
            break;
          case 'Leads':
            iconName = 'people-outline';
            break;
        }
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Attendance" component={AttendanceScreen} />
    <Tab.Screen name="Leaves" component={LeaveScreen} />
    <Tab.Screen name="Expense" component={ExpenseScreen} />
    <Tab.Screen name="Leads" component={LeadScreen} />
  </Tab.Navigator>
);

export default DashboardTabs;