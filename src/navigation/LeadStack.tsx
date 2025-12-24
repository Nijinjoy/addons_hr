import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LeadScreen from '../screens/Dashboard /CRM/LeadScreen';
import LeadDetailScreen from '../screens/Dashboard /CRM/LeadDetailScreen';
import LeadCreateScreen from '../screens/Dashboard /CRM/LeadCreateScreen';
import TaskCreateScreen from '../screens/Dashboard /Core/TaskCreateScreen';
import EventCreateScreen from '../screens/Dashboard /CRM/EventCreateScreen';

export type LeadStackParamList = {
  LeadsList: undefined;
  LeadDetail: { lead: any };
  LeadCreate: { lead?: any; onLeadUpdated?: (lead: any) => void } | undefined;
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
