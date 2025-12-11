import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import DashboardTabs from './DashboardTabs';
import ProfileScreen from '../screens/Dashboard/ProfileTab';
import SettingsScreen from '../screens/Dashboard/SettingsTab';

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Drawer.Screen name="DashboardTabs" component={DashboardTabs} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
