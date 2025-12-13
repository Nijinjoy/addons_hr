import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';

import Header from '../../components/Header';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AttendanceScreen: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('');

  const markedDates = {
    '2025-01-01': { marked: true, dotColor: 'green' },
    '2025-01-02': { marked: true, dotColor: 'red' },
    [selectedDate]: { selected: true, selectedColor: '#007AFF' },
  };

  return (
    <View style={styles.container}>
      <Header 
        screenName="Attendance" 
        useGradient={true}
        notificationCount={2}
      />

      {/* White background container below header */}
      <View style={styles.whiteContainer}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >

          {/* Title */}
          <Animated.Text entering={FadeInUp.delay(100)} style={styles.sectionTitle}>
            Attendance Calendar
          </Animated.Text>

          {/* Real Calendar */}
          <Animated.View entering={FadeInUp.delay(150)} style={styles.calendarBox}>
            <Calendar
              onDayPress={(day) => setSelectedDate(day.dateString)}
              markedDates={markedDates}
              theme={{
                todayTextColor: '#007AFF',
                selectedDayBackgroundColor: '#007AFF',
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#666666',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#007AFF',
                dayTextColor: '#333333',
                textDisabledColor: '#d9e1e8',
                dotColor: '#00adf5',
                selectedDotColor: '#ffffff',
                arrowColor: '#007AFF',
                monthTextColor: '#333333',
                indicatorColor: 'blue',
                textDayFontWeight: '300',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '300',
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 14,
              }}
            />
          </Animated.View>

          {/* Request Attendance */}
          <Animated.View entering={FadeInUp.delay(250)}>
            <TouchableOpacity style={styles.primaryButton}>
              <Icon name="event-available" size={22} color="#fff" />
              <Text style={styles.primaryButtonText}>Request Attendance</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Recent Attendance */}
          <Animated.Text entering={FadeInUp.delay(300)} style={styles.sectionTitle}>
            Recent Attendance Requests
          </Animated.Text>

          <Animated.View entering={FadeInUp.delay(350)} style={styles.card}>
            <MaterialCommunityIcons name="clock-outline" size={22} color="#777" />
            <Text style={styles.cardTitle}>No recent attendance requests</Text>
          </Animated.View>

          {/* Upcoming Shifts */}
          <Animated.Text entering={FadeInUp.delay(400)} style={styles.sectionTitle}>
            Upcoming Shifts
          </Animated.Text>

          <Animated.View entering={FadeInUp.delay(450)} style={styles.card}>
            <MaterialCommunityIcons name="calendar-clock" size={22} color="#777" />
            <Text style={styles.cardTitle}>No upcoming shifts</Text>
          </Animated.View>

          {/* Request Shift */}
          <Animated.View entering={FadeInUp.delay(500)}>
            <TouchableOpacity style={styles.secondaryButton}>
              <MaterialCommunityIcons name="briefcase-clock-outline" size={20} color="#007AFF" />
              <Text style={styles.secondaryButtonText}>Request a Shift</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Recent Shift Requests */}
          <Animated.Text entering={FadeInUp.delay(550)} style={styles.sectionTitle}>
            Recent Shift Requests
          </Animated.Text>

          <Animated.View entering={FadeInUp.delay(600)} style={styles.card}>
            <MaterialCommunityIcons name="history" size={22} color="#777" />
            <Text style={styles.cardTitle}>No recent shift requests</Text>
          </Animated.View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'white' // Changed to white
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContent: { 
    padding: 16,
    backgroundColor: 'white',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 15,
    marginBottom: 10,
    color: '#222',
  },
  calendarBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 4,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: {
    fontSize: 15,
    color: '#444',
  },
});

export default AttendanceScreen;