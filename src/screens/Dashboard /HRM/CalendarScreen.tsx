import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import Header from '../../../components/Header';

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarScreen = () => {
  const navigation = useNavigation<any>();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthLabel = currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  const cells = useMemo(() => {
    const startOffset = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const total = startOffset + daysInMonth;
    return Array.from({ length: total }, (_, idx) => {
      if (idx < startOffset) return null;
      return idx - startOffset + 1;
    });
  }, [month, year]);

  const handlePrevMonth = () => {
    setSelectedDay(null);
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDay(null);
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <View style={styles.container}>
      <Header
        pillText="Calendar"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.monthCard}>
          <Pressable
            onPress={handlePrevMonth}
            android_ripple={{ color: '#E2E8F0', borderless: true }}
            style={styles.monthNav}
          >
            <Ionicons name="chevron-back" size={22} color="#0F172A" />
          </Pressable>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <Pressable
            onPress={handleNextMonth}
            android_ripple={{ color: '#E2E8F0', borderless: true }}
            style={styles.monthNav}
          >
            <Ionicons name="chevron-forward" size={22} color="#0F172A" />
          </Pressable>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.weekRow}>
            {weekDays.map((day) => (
              <Text key={day} style={styles.weekLabel}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {cells.map((day, idx) => {
              if (!day) {
                return <View key={`empty-${idx}`} style={[styles.dayCell, styles.dayEmpty]} />;
              }
              const dateKey = `${year}-${month}-${day}`;
              const isToday = dateKey === todayKey;
              const isSelected = selectedDay === day;
              return (
                <Pressable
                  key={`day-${day}`}
                  onPress={() => setSelectedDay(day)}
                  style={({ pressed }) => [
                    styles.dayCell,
                    isToday && styles.dayToday,
                    isSelected && styles.daySelected,
                    pressed && styles.dayPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isToday && styles.dayTextToday,
                      isSelected && styles.dayTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 16, paddingBottom: 24 },
  monthCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  monthNav: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekLabel: {
    width: '14.2857%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginVertical: 4,
  },
  dayEmpty: {
    backgroundColor: 'transparent',
  },
  dayText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  dayToday: {
    backgroundColor: '#E5ECFF',
  },
  dayTextToday: {
    color: '#1D3765',
  },
  daySelected: {
    backgroundColor: '#1D3765',
  },
  dayTextSelected: {
    color: '#FFFFFF',
  },
  dayPressed: {
    opacity: 0.8,
  },
});

export default CalendarScreen;
