import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, RefreshControl, ActivityIndicator, Pressable, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from '../../components/Header';
import { fetchTasks, TaskListItem } from '../../services/api/tasks.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TaskListScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 20;

  const loadTasks = useCallback(async (reset = false) => {
    try {
      setError('');
      if (reset) {
        setHasMore(true);
        setLoading(true);
      }
      const companyUrl = (await AsyncStorage.getItem('company_url')) || undefined;
      const start = reset ? 0 : tasks.length;
      const list = await fetchTasks(companyUrl, pageSize, start);
      if (reset) {
        setTasks(list);
      } else {
        setTasks((prev) => [...prev, ...list]);
      }
      if (list.length < pageSize) setHasMore(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [tasks.length]);

  useEffect(() => {
    loadTasks(true);
  }, []);

  const handleEndReached = () => {
    if (loadingMore || loading || !hasMore) return;
    setLoadingMore(true);
    loadTasks(false);
  };

  return (
    <View style={styles.container}>
      <Header
        screenName="Tasks"
        useGradient
        showBack
        navigation={navigation as any}
        onBackPress={() => navigation.goBack()}
        onNotificationPress={() => console.log('Notifications pressed')}
        onProfilePress={() => navigation.getParent()?.openDrawer?.()}
      />

      <View style={styles.headerPad}>
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && styles.cardPressed]}
          android_ripple={{ color: '#E5E7EB' }}
          onPress={() => navigation.navigate('TaskCreateNew' as never)}
        >
          <Ionicons name="add-circle-outline" size={20} color="#0F172A" />
          <Text style={styles.addBtnText}>New Task</Text>
        </Pressable>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => loadTasks(true)} tintColor="#0F172A" />
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            android_ripple={{ color: '#E5E7EB' }}
            onPress={() => console.log('Task tapped:', item.name)}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="checkbox-outline" size={18} color="#0F172A" />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardLabel}>Subject</Text>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.subject || 'No subject'}
                </Text>
                <Text style={[styles.cardLabel, { marginTop: 6 }]}>Name</Text>
                <Text style={styles.cardSub} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
            </View>
            <View style={styles.statusRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardLabel}>Status</Text>
                <Text style={styles.cardStatus}>{item.status || 'Pending'}</Text>
              </View>
              {item.priority ? (
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardLabel}>Priority</Text>
                  <Text style={styles.cardPriority}>{item.priority}</Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          loading ? null : <Text style={styles.emptyText}>No tasks found.</Text>
        }
        ListFooterComponent={
          loadingMore ? <ActivityIndicator style={{ marginVertical: 12 }} size="small" color="#0F172A" /> : null
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  headerPad: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 0 },
  content: { paddingHorizontal: 16, gap: 12, paddingBottom: 32, paddingTop: 0 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    marginTop: 0,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignSelf: 'stretch',
  },
  addBtnText: { color: '#0F172A', fontWeight: '700', fontSize: 14 },
  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
    gap: 6,
  },
  cardPressed: { opacity: 0.92 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, color: '#0F172A', fontSize: 15, fontWeight: '700' },
  cardSub: { color: '#6B7280', fontSize: 12 },
  cardLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardStatus: { color: '#10B981', fontWeight: '700', fontSize: 13 },
  cardPriority: { color: '#F59E0B', fontWeight: '700', fontSize: 12 },
  emptyText: { textAlign: 'center', color: '#6B7280', paddingVertical: 16 },
  errorText: { textAlign: 'center', color: '#DC2626', paddingVertical: 16 },
});

export default TaskListScreen;
