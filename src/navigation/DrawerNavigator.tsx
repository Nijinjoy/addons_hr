import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import DashboardTabs from './DashboardTabs';
import ProfileScreen from '../screens/Dashboard /ProfileScreen';
import SettingScreen from '../screens/Dashboard /SettingScreen';

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
        screenOptions={{
        headerShown: false,
        drawerType: 'front',        // drawer slides over the screen
        drawerPosition: 'right',    // drawer opens from right
        overlayColor: 'transparent' // optional, makes background visible
      }}
    >
      <Drawer.Screen name="DashboardTabs" component={DashboardTabs} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen name="Settings" component={SettingScreen} />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
