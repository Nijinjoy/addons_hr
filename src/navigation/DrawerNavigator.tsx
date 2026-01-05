import React from 'react';
import { View } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import DashboardTabs from './DashboardTabs';
import ProfileScreen from '../screens/Dashboard /HRM/ProfileScreen';
import AttendanceScreen from '../screens/Dashboard /HRM/AttendanceScreen';
import NotificationScreen from '../screens/Dashboard /Core/NotificationScreen';
import LeadStack from './LeadStack';
import TaskListScreen from '../screens/Dashboard /Core/TaskListScreen';
import TaskCreateNewScreen from '../screens/Dashboard /Core/TaskCreateNewScreen';
import TimesheetScreen from '../screens/Dashboard /HRM/TimesheetScreen';
import ExpenseScreen from '../screens/Dashboard /Accounts/ExpenseScreen';
import CalendarScreen from '../screens/Dashboard /HRM/CalendarScreen';

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  const DrawerContent = ({ navigation }) => (
    <View style={{ flex: 1 }}>
      <ProfileScreen onBack={() => navigation.closeDrawer()} />
    </View>
  );

  return (
    <Drawer.Navigator
        screenOptions={{
        headerShown: false,
        drawerType: 'front',        // drawer slides over the screen
        drawerPosition: 'right',    // drawer opens from right
        overlayColor: 'rgba(0,0,0,0.4)', // dim background
        drawerStyle: {
          width: '100%',            // full-screen drawer
        },
      }}
      drawerContent={(props) => <DrawerContent {...props} />}
    >
      <Drawer.Screen name="DashboardTabs" component={DashboardTabs} />
      <Drawer.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="Notifications"
        component={NotificationScreen}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="TaskList"
        component={TaskListScreen}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="TaskCreateNew"
        component={TaskCreateNewScreen}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="TimesheetScreen"
        component={TimesheetScreen}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="Leads"
        component={LeadStack}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="Expense"
        component={ExpenseScreen}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
