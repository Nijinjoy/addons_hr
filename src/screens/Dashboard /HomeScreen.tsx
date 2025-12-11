import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Header from '../../components/Header';

const HomeScreen: React.FC = () => {
  const handleNotificationPress = () => {
    console.log('Notification pressed');
    // Navigate to notifications screen
  };

  const handleProfilePress = () => {
    console.log('Profile pressed');
    // Navigate to profile screen
  };

  return (
    <View style={styles.container}>
      <Header 
        screenName="ADDONS HR" 
        onNotificationPress={handleNotificationPress}
        onProfilePress={handleProfilePress}
        notificationCount={5}
        useGradient={true} // or false for solid color
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