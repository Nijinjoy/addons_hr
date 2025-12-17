import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LeadScreen from '../screens/Dashboard /LeadScreen';
import LeadDetailScreen from '../screens/Dashboard /LeadDetailScreen';
import LeadCreateScreen from '../screens/Dashboard /LeadCreateScreen';
import TaskCreateScreen from '../screens/Dashboard /TaskCreateScreen';
import EventCreateScreen from '../screens/Dashboard /EventCreateScreen';

export type LeadStackParamList = {
  LeadsList: undefined;
  LeadDetail: { lead: any };
  LeadCreate: undefined;
  TaskCreate: { lead?: any };
  EventCreate: { lead?: any };
};

const Stack = createNativeStackNavigator<LeadStackParamList>();

const LeadStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="LeadsList"
        component={LeadScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LeadDetail"
        component={LeadDetailScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="LeadCreate"
        component={LeadCreateScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="TaskCreate"
        component={TaskCreateScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EventCreate"
        component={EventCreateScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default LeadStack;
