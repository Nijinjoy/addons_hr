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
  Switch,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Header from '../../../components/Header';
import { LeadStackParamList } from '../../../navigation/LeadStack';
import {
  Assignee,
  getAssignableUsers,
  getEventCategories,
  EventCategory,
  createLeadEvent,
} from '../../../services/api/leads.service';
import { launchImageLibrary, Asset } from 'react-native-image-picker';

type RouteProps = RouteProp<LeadStackParamList, 'EventCreate'>;

const EventCreateScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProps>();
  const lead = route.params?.lead;

  const leadLabel = lead?.lead_name || lead?.company_name || lead?.name || 'this lead';

  const [category, setCategory] = useState<string>('');
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [loadingAssignees, setLoadingAssignees] = useState(false);

  const [summary, setSummary] = useState('');
  const [attachments, setAttachments] = useState<Asset[]>([]);

  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [pendingDate, setPendingDate] = useState<Date | null>(new Date());
  const [isPublic, setIsPublic] = useState(false);

  const [errors, setErrors] = useState<{ category?: string; assignedTo?: string; summary?: string; date?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const formattedDate = startDate ? `${startDate.toDateString()} • ${startDate.toLocaleTimeString()}` : 'Select date & time';

  const pickAttachment = () => {
    launchImageLibrary({ mediaType: 'photo', selectionLimit: 3 }, (response) => {
      if (response.didCancel || response.errorCode) return;
      if (response.assets?.length) setAttachments(response.assets);
    });
  };

  const onChangeDate = (_: any, selectedDate?: Date) => {
    if (Platform.OS === 'ios') {
      setStartDate(selectedDate || startDate);
      return;
    }
    if (pickerMode === 'date') {
      const base = selectedDate || startDate || new Date();
      setPendingDate(base);
      setPickerMode('time');
      setShowPicker(true);
    } else {
      const time = selectedDate || startDate || new Date();
      const base = pendingDate || new Date();
      const combined = new Date(base);
      combined.setHours(time.getHours());
      combined.setMinutes(time.getMinutes());
      setStartDate(combined);
      setPickerMode('date');
      setShowPicker(false);
      setPendingDate(null);
    }
  };

  React.useEffect(() => {
    let active = true;
    const loadAssignees = async () => {
      try {
        setLoadingAssignees(true);
        const res = await getAssignableUsers();
        if (!active) return;
        setAssignees(res);
        if (res?.length) {
          setAssignedTo(res[0].full_name || res[0].name);
          setSelectedAssigneeId(res[0].name);
        }
      } catch (err: any) {
        console.log('Event assignee fetch error:', err?.message || err);
      } finally {
        if (active) setLoadingAssignees(false);
      }
    };
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const res = await getEventCategories();
        if (!active) return;
        if (res?.length) {
          setCategories(res);
          setCategory(res[0].name || res[0].event_type || '');
        } else {
          const defaults = ['Event', 'Meeting', 'Call', 'Sent/Received Email', 'Other'].map((n) => ({
            name: n,
            event_type: n,
          }));
          setCategories(defaults);
          setCategory(defaults[0].name);
        }
      } catch (err: any) {
        console.log('Event categories fetch error:', err?.message || err);
        const defaults = ['Event', 'Meeting', 'Call', 'Sent/Received Email', 'Other'].map((n) => ({
          name: n,
          event_type: n,
        }));
        setCategories(defaults);
        setCategory(defaults[0].name);
      } finally {
        if (active) setLoadingCategories(false);
      }
    };
    loadAssignees();
    loadCategories();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async () => {
    const nextErrors: typeof errors = {};
    if (!category) nextErrors.category = 'Please select a category.';
    if (!startDate) nextErrors.date = 'Please pick date & time.';
    if (!assignedTo || !selectedAssigneeId) nextErrors.assignedTo = 'Please choose an assignee.';
    if (!summary.trim()) nextErrors.summary = 'Summary is required.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    try {
      setSubmitting(true);
      const endsOn = startDate ? new Date(startDate.getTime() + 60 * 60 * 1000) : undefined;
      const payload = {
        subject: category || summary.trim(),
        description: summary.trim(),
        category,
        starts_on: startDate?.toISOString(),
        ends_on: endsOn?.toISOString(),
        lead: lead?.name,
        assigned_to: selectedAssigneeId || undefined,
        is_public: isPublic,
      };
      const res = await createLeadEvent(payload);
      Alert.alert('Event', 'Event added to Lead');
      navigation.goBack();
    } catch (err: any) {
      console.log('Event create error:', err?.message || err);
      Alert.alert('Event', err?.message || 'Failed to create event.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        screenName="New Event"
        showBack
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Schedule an event for {leadLabel}</Text>
        <Text style={styles.subtitle}>Fill the details to add this to the lead.</Text>

        <Text style={styles.label}>Category</Text>
        <TouchableOpacity style={styles.inputRow} onPress={() => setCategoryOpen((p) => !p)} activeOpacity={0.9}>
          <Text style={styles.inputText}>{category || 'Select category'}</Text>
        </TouchableOpacity>
        {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}
        {categoryOpen && (
          <View style={styles.dropdown}>
            <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
              {loadingCategories ? (
                <View style={styles.dropdownItem}>
                  <Text style={styles.dropdownText}>Loading categories...</Text>
                </View>
              ) : categories.length === 0 ? (
                <View style={styles.dropdownItem}>
                  <Text style={styles.dropdownText}>No categories found</Text>
                </View>
              ) : (
                categories.map((opt) => {
                  const label = opt.event_type || opt.name;
                  const key = opt.name || label;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setCategory(label || '');
                        setCategoryOpen(false);
                      }}
                    >
                      <Text style={styles.dropdownText}>{label}</Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        )}

        <Text style={styles.label}>Date & time</Text>
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
        {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}
        {showPicker && (
          <DateTimePicker
            value={startDate || new Date()}
            mode={Platform.OS === 'ios' ? 'datetime' : pickerMode}
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={onChangeDate}
          />
        )}

        <Text style={styles.label}>Assigned to</Text>
        <TouchableOpacity style={styles.inputRow} onPress={() => setAssignOpen((p) => !p)} activeOpacity={0.9}>
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

        <Text style={styles.label}>Summary</Text>
        <TextInput
          style={styles.textArea}
          multiline
          value={summary}
          onChangeText={setSummary}
          placeholder="Add event summary..."
          placeholderTextColor="#9CA3AF"
        />
        {errors.summary ? <Text style={styles.errorText}>{errors.summary}</Text> : null}

        <View style={styles.toggleRow}>
          <Text style={styles.label}>Public event?</Text>
          <Switch value={isPublic} onValueChange={setIsPublic} />
        </View>

        <Text style={styles.label}>Attachments</Text>
        <TouchableOpacity style={styles.attachmentBtn} onPress={pickAttachment}>
          <Text style={styles.attachmentText}>Add attachment</Text>
        </TouchableOpacity>
        {attachments.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {attachments.map((att) => (
              <Image key={att.uri} source={{ uri: att.uri }} style={styles.attachmentThumb} />
            ))}
          </ScrollView>
        )}

        <TouchableOpacity
          style={[styles.primaryBtn, submitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.primaryText}>{submitting ? 'Submitting...' : 'Submit Event'}</Text>
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
  dropdownScroll: { maxHeight: 220 },
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
    backgroundColor: '#ECFEFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#CFFAFE',
    marginTop: 6,
    alignItems: 'center',
  },
  attachmentText: { color: '#0EA5E9', fontWeight: '700' },
  attachmentThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    marginRight: 8,
    backgroundColor: '#E5E7EB',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  primaryBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryText: { color: 'white', fontWeight: '700', fontSize: 15 },
  errorText: { color: '#DC2626', fontSize: 12, marginTop: 4 },
});

export default EventCreateScreen;
