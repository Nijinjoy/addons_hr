import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import HomeScreen from '../screens/Dashboard /Core/HomeScreen';
import HRMDashboard from '../screens/Dashboard /HRM/HRMDashboard';
import LeadStack from './LeadStack';
import ExpenseScreen from '../screens/Dashboard /Accounts/ExpenseScreen';
import QuotationScreen from '../screens/Dashboard /Core/QuotationScreen';

const Tab = createBottomTabNavigator();

const DashboardTabs = () => {
  const [fontsLoaded, setFontsLoaded] = useState(Platform.OS === 'android');

  useEffect(() => {
    if (Platform.OS === 'ios') {
      const loadFonts = async () => {
        try {
          await Feather.loadFont();
          setFontsLoaded(true);
        } catch (error) {
          console.log('Font loading error:', error);
          setFontsLoaded(false);
        }
      };
      loadFonts();
    }
  }, []);

  const renderTabIcon = ({ route, color, size }) => {
    let iconName = '';
    let label = '';
    
    switch (route.name) {
      case 'Home':
        iconName = 'home';
        label = '🏠';
        break;
      case 'HRM':
        iconName = 'users';
        label = '👥';
        break;
      case 'Leads':
        iconName = 'target';
        label = '🎯';
        break;
      case 'Expense':
        iconName = 'credit-card';
        label = '💳';
        break;
      case 'Quotation':
        iconName = 'file-text';
        label = '📄';
        break;
    }

    return (
      <TabIcon
        color={color}
        fontsLoaded={fontsLoaded}
        iconName={iconName}
        label={label}
        size={size}
      />
    );
  };

  return (
    <Tab.Navigator
      detachInactiveScreens={false}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => 
          renderTabIcon({ route, color, size }),
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
        name="Leads" 
        component={LeadStack}
        options={{ tabBarLabel: 'Lead' }}
      />
      <Tab.Screen 
        name="Expense" 
        component={ExpenseScreen}
        options={{ tabBarLabel: 'Expense' }}
      />
      <Tab.Screen 
        name="Quotation" 
        component={QuotationScreen}
        options={{ tabBarLabel: 'Quotation' }}
      />
    </Tab.Navigator>
  );
};

const TabIcon = ({ color, fontsLoaded, iconName, label, size }) => {
  const content = (() => {
    if (!fontsLoaded && Platform.OS === 'ios') {
      return (
        <Text style={{ fontSize: size * 0.8, color }}>
          {label}
        </Text>
      );
    }

    try {
      return <Feather name={iconName} size={size} color={color} />;
    } catch (error) {
      return (
        <Text style={{ fontSize: size * 0.8, color }}>
          {label}
        </Text>
      );
    }
  })();

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {content}
    </View>
  );
};

export default DashboardTabs;
