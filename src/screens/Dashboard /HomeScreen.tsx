import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/Header';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleNotificationPress = () => {
    console.log('Notification pressed');
    // Navigate to notifications screen if needed
  };

  return (
    <View style={styles.container}>
      <Header 
        screenName="ADDONS HR"
        navigation={navigation} // pass drawer navigation here
        notificationCount={5}
        useGradient={true}
      />

      <View style={styles.content}>
        <Text>Home Screen Content</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HomeScreen;
