import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Platform,
  Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Header from '../../components/Header';
import { LeadStackParamList } from '../../navigation/LeadStack';
import { Assignee, createLeadTask, getAssignableUsers } from '../../services/api/leads.service';
import { launchImageLibrary, Asset } from 'react-native-image-picker';

type RouteProps = RouteProp<LeadStackParamList, 'TaskCreate'>;

const TaskCreateScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProps>();
  const lead = route.params?.lead;

  const [dueDate, setDueDate] = useState<Date | null>(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [pendingDate, setPendingDate] = useState<Date | null>(new Date());
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [assignOpen, setAssignOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [loadingAssignees, setLoadingAssignees] = useState(false);
  const [attachments, setAttachments] = useState<Asset[]>([]);
  const [errors, setErrors] = useState<{ dueDate?: string; assignedTo?: string; description?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);

  const leadLabel = lead?.lead_name || lead?.company_name || lead?.name || 'this lead';

  const handleAttachment = () => {
    launchImageLibrary({ mediaType: 'photo', selectionLimit: 5 }, (response) => {
      if (response.didCancel || response.errorCode) {
        return;
      }
      if (response.assets?.length) {
        setAttachments(response.assets);
      }
    });
  };

  const handleSubmit = async () => {
    const nextErrors: typeof errors = {};
    if (!dueDate) nextErrors.dueDate = 'Please select a due date and time.';
    if (!assignedTo || !selectedAssigneeId) nextErrors.assignedTo = 'Please choose an assignee.';
    if (!description.trim()) nextErrors.description = 'Please add a description.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    try {
      setSubmitting(true);
      const payload = {
        subject: `Task for ${leadLabel}`,
        description: description.trim(),
        due_date: dueDate?.toISOString(),
        lead: lead?.name,
        assigned_to: selectedAssigneeId || undefined,
      };
      const res = await createLeadTask(payload);
      const msg = res.alreadyExists
        ? 'Task already exists/assigned for this lead and user.'
        : 'Task added to Lead';
      Alert.alert('Task', msg);
      navigation.goBack();
    } catch (err: any) {
      console.log('Task create error:', err?.message || err);
      Alert.alert('Task', err?.message || 'Failed to create task.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAssignee = () => setAssignOpen((prev) => !prev);

  const onChangeDate = (_: any, selectedDate?: Date) => {
    if (Platform.OS === 'ios') {
      setDueDate(selectedDate || dueDate);
      return;
    }

    if (pickerMode === 'date') {
      const base = selectedDate || dueDate || new Date();
      setPendingDate(base);
      setPickerMode('time');
      setShowPicker(true);
    } else {
      const time = selectedDate || dueDate || new Date();
      const base = pendingDate || new Date();
      const combined = new Date(base);
      combined.setHours(time.getHours());
      combined.setMinutes(time.getMinutes());
      setDueDate(combined);
      setShowPicker(false);
      setPickerMode('date');
      setPendingDate(null);
    }
  };

  const formattedDate = dueDate ? `${dueDate.toDateString()} • ${dueDate.toLocaleTimeString()}` : 'Select date & time';

  React.useEffect(() => {
    let active = true;
    const loadAssignees = async () => {
      try {
        setLoadingAssignees(true);
        const res = await getAssignableUsers();
        if (!active) return;
        setAssignees(res);
        if (res?.length) {
          const first = res[0];
          setAssignedTo(first.full_name || first.name);
          setSelectedAssigneeId(first.name);
        }
      } catch (err: any) {
        console.log('Assignee fetch error:', err?.message || err);
      } finally {
        if (active) setLoadingAssignees(false);
      }
    };
    loadAssignees();
    return () => {
      active = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <Header
        screenName="New Task"
        showBack
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create a task for {leadLabel}</Text>
        <Text style={styles.subtitle}>Fill in the essentials to schedule this task.</Text>

        <Text style={styles.label}>Due date & time</Text>
        <TouchableOpacity
          style={styles.inputRow}
          onPress={() => {
            setPickerMode('date');
            setShowPicker(true);
          }}
          activeOpacity={0.9}
        >
          <Text style={styles.inputText}>{formattedDate}</Text>
        </TouchableOpacity>
        {errors.dueDate ? <Text style={styles.errorText}>{errors.dueDate}</Text> : null}
        {showPicker && (
          <DateTimePicker
            value={dueDate || new Date()}
            mode={Platform.OS === 'ios' ? 'datetime' : pickerMode}
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={onChangeDate}
          />
        )}

        <Text style={styles.label}>Assigned to</Text>
        <TouchableOpacity style={styles.inputRow} onPress={toggleAssignee} activeOpacity={0.9}>
          <Text style={styles.inputText}>
            {loadingAssignees ? 'Loading assignees...' : assignedTo || 'Select assignee'}
          </Text>
        </TouchableOpacity>
        {errors.assignedTo ? <Text style={styles.errorText}>{errors.assignedTo}</Text> : null}
        {assignOpen && (
          <View style={styles.dropdown}>
            <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
              {assignees.map((opt) => (
                <TouchableOpacity
                  key={opt.name}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setAssignedTo(opt.full_name || opt.name);
                    setSelectedAssigneeId(opt.name);
                    setAssignOpen(false);
                  }}
                >
                  <Text style={styles.dropdownText}>{opt.full_name || opt.name}</Text>
                </TouchableOpacity>
              ))}
              {!loadingAssignees && assignees.length === 0 && (
                <View style={styles.dropdownItem}>
                  <Text style={styles.dropdownText}>No assignees found</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.textArea}
          multiline
          value={description}
          onChangeText={setDescription}
          placeholder="Add task details..."
          placeholderTextColor="#9CA3AF"
        />
        {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}

        <Text style={styles.label}>Attachments</Text>
        <TouchableOpacity style={styles.attachmentBtn} onPress={handleAttachment}>
          <Text style={styles.attachmentText}>Add attachment</Text>
        </TouchableOpacity>
        {attachments.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {attachments.map((att) => (
              <Image
                key={att.uri}
                source={{ uri: att.uri }}
                style={styles.attachmentThumb}
              />
            ))}
          </ScrollView>
        )}

        <TouchableOpacity
          style={[styles.primaryBtn, submitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.primaryText}>{submitting ? 'Submitting...' : 'Submit Task'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#4B5563', marginBottom: 4 },
  label: { fontSize: 14, color: '#374151', fontWeight: '600', marginTop: 4 },
  inputRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 6,
  },
  inputText: { color: '#111827', fontSize: 14 },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
    maxHeight: 220,
  },
  dropdownScroll: {
    maxHeight: 220,
  },
  dropdownItem: { paddingVertical: 10, paddingHorizontal: 12 },
  dropdownText: { color: '#111827', fontSize: 14 },
  textArea: {
    minHeight: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    textAlignVertical: 'top',
    marginTop: 6,
    color: '#111827',
  },
  attachmentBtn: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    marginTop: 6,
    alignItems: 'center',
  },
  attachmentText: { color: '#4338CA', fontWeight: '700' },
  attachmentThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    marginRight: 8,
    backgroundColor: '#E5E7EB',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryText: { color: 'white', fontWeight: '700', fontSize: 15 },
});

export default TaskCreateScreen;
