import React from 'react';
import { View } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import DashboardTabs from './DashboardTabs';
import ProfileScreen from '../screens/Dashboard /ProfileScreen';

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
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
