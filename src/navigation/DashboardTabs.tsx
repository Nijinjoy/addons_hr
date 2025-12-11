import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/Dashboard /HomeScreen'
import AttendanceScreen from '../screens/Dashboard /AttendanceScreen'
import LeaveScreen from '../screens/Dashboard /LeaveScreen'
import LeadScreen from '../screens/Dashboard /LeaveScreen'
import ExpenseScreen from '../screens/Dashboard /ExpenseScreen'
import Ionicons from 'react-native-vector-icons/Ionicons'; // fixed import for CLI

const Tab = createBottomTabNavigator();

const DashboardTabs = () => {
  return (
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
            case 'Payroll':
              iconName = 'cash-outline';
              break;
            case 'Notifications':
              iconName = 'notifications-outline';
              break;
            default:
              iconName = 'ellipse-outline';
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
      <Tab.Screen name="Payroll" component={LeadScreen} /> {/* change to correct screen */}
      <Tab.Screen name="Notifications" component={ExpenseScreen} /> {/* change to correct screen */}
    </Tab.Navigator>
  );
};

export default DashboardTabs;
