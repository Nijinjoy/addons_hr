import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LeadScreen from '../screens/Dashboard /LeadScreen';
import LeadDetailScreen from '../screens/Dashboard /LeadDetailScreen';

export type LeadStackParamList = {
  LeadsList: undefined;
  LeadDetail: { lead: any };
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
    </Stack.Navigator>
  );
};

export default LeadStack;
