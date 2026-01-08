import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Header from '../../../components/Header';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  getCustomers,
  getActivityTypes,
  getProjects,
  getTasks,
  getTimesheetDetail,
  createTimesheet,
  submitTimesheet,
} from '../../../services/timesheetService';

const TimesheetCreateNewScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const readOnly = route?.params?.mode === 'view';
  const timesheetName = route?.params?.timesheetName as string | undefined;
  const [addFromDateTime, setAddFromDateTime] = useState('');
  const [addToDateTime, setAddToDateTime] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'from' | 'to' | null>(null);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | 'datetime'>('date');
  const [pickerTempDate, setPickerTempDate] = useState<Date>(new Date());
  const [status, setStatus] = useState('');
  const [completed, setCompleted] = useState(false);
  const [customerOptions, setCustomerOptions] = useState<string[]>([]);
  const [customer, setCustomer] = useState('');
  const [showCustomerOptions, setShowCustomerOptions] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [activityTypeOptions, setActivityTypeOptions] = useState<string[]>([]);
  const [activityType, setActivityType] = useState('');
  const [showActivityOptions, setShowActivityOptions] = useState(false);
  const [loadingActivityTypes, setLoadingActivityTypes] = useState(false);
  const [activitySearch, setActivitySearch] = useState('');
  const [projectOptions, setProjectOptions] = useState<string[]>([]);
  const [project, setProject] = useState('');
  const [showProjectOptions, setShowProjectOptions] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [taskOptions, setTaskOptions] = useState<Array<{ name: string; subject?: string; label: string }>>([]);
  const [task, setTask] = useState('');
  const [showTaskOptions, setShowTaskOptions] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [taskSearch, setTaskSearch] = useState('');
  const [taskDetails, setTaskDetails] = useState('');
  const [savingTimesheet, setSavingTimesheet] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const hoursNumber = useMemo(() => {
    if (!addFromDateTime || !addToDateTime) return '';
    const from = new Date(addFromDateTime);
    const to = new Date(addToDateTime);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) return '';
    const diffMs = to.getTime() - from.getTime();
    if (diffMs <= 0) return '';
    const hours = diffMs / (1000 * 60 * 60);
    return Number(hours.toFixed(2));
  }, [addFromDateTime, addToDateTime]);

  const hoursValue = hoursNumber === '' ? '' : hoursNumber.toFixed(2);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingCustomers(true);
        setLoadingActivityTypes(true);
        setLoadingProjects(true);

        const [custRes, actRes, projRes, taskRes] = await Promise.all([
          getCustomers(500),
          getActivityTypes(200),
          getProjects(200),
          getTasks(200),
        ]);

        if (custRes.ok) {
          const opts = custRes.data || [];
          setCustomerOptions(opts);
          if (!customer && opts.length) setCustomer(opts[0]);
          else if (customer && opts.includes(customer)) setCustomer(customer);
          else if (!opts.includes(customer) && opts.length) setCustomer(opts[0]);
        } else {
          setCustomerOptions([]);
        }

        if (actRes.ok) {
          const opts = actRes.data || [];
          setActivityTypeOptions(opts);
          if (!activityType && opts.length) setActivityType(opts[0]);
          else if (activityType && opts.includes(activityType)) setActivityType(activityType);
          else if (!opts.includes(activityType) && opts.length) setActivityType(opts[0]);
        } else {
          setActivityTypeOptions([]);
        }

        if (projRes.ok) {
          const opts = projRes.data || [];
          setProjectOptions(opts);
          if (!project && opts.length) setProject(opts[0]);
          else if (project && opts.includes(project)) setProject(project);
          else if (!opts.includes(project) && opts.length) setProject(opts[0]);
        } else {
          setProjectOptions([]);
        }

        if (taskRes.ok) {
          const opts = taskRes.data || [];
          setTaskOptions(opts);
          if (!task && opts.length) setTask(opts[0].name);
          else if (task && opts.some((opt) => opt.name === task)) setTask(task);
          else if (!opts.some((opt) => opt.name === task) && opts.length) setTask(opts[0].name);
        } else {
          setTaskOptions([]);
        }
      } catch (err) {
        setCustomerOptions([]);
        setActivityTypeOptions([]);
        setProjectOptions([]);
        setTaskOptions([]);
      } finally {
        setLoadingCustomers(false);
        setLoadingActivityTypes(false);
        setLoadingProjects(false);
        setLoadingTasks(false);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!readOnly || !timesheetName) return;
    const loadDetail = async () => {
      try {
        setDetailLoading(true);
        const res = await getTimesheetDetail(timesheetName);
        if (!res.ok) return;
        const doc = res.data || {};
        const timeLog = Array.isArray(doc.time_logs) ? doc.time_logs[0] || {} : {};
        const toISO = (value?: string) => {
          if (!value) return '';
          const d = new Date(value);
          return isNaN(d.getTime()) ? '' : d.toISOString();
        };
        setCustomer(timeLog.customer || doc.customer || customer);
        setActivityType(timeLog.activity_type || doc.activity_type || activityType);
        setProject(timeLog.project || doc.project || project);
        setTask(timeLog.task || doc.task || task);
        setTaskDetails(timeLog.description || doc.description || doc.note || taskDetails);
        setStatus(doc.status || status);
        setCompleted((doc.status || '').toLowerCase().includes('completed'));
        setAddFromDateTime(toISO(timeLog.from_time || doc.from_time || doc.start_date));
        setAddToDateTime(toISO(timeLog.to_time || doc.to_time || doc.end_date));
      } finally {
        setDetailLoading(false);
      }
    };
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, timesheetName]);

  const handleSaveTimesheet = async () => {
    if (savingTimesheet) return;
    if (readOnly) return;
    if (!customer || !activityType || !project || !task || !taskDetails || !addFromDateTime || !addToDateTime) {
      Alert.alert('Timesheet', 'All fields are mandatory. Please fill everything.');
      return;
    }
    if (!hoursNumber) {
      Alert.alert('Timesheet', 'Hours must be greater than zero.');
      return;
    }
    if (new Date(addToDateTime) <= new Date(addFromDateTime)) {
      Alert.alert('Timesheet', 'End time must be after start time.');
      return;
    }
    setSavingTimesheet(true);
    try {
      const employee =
        (await AsyncStorage.getItem('employee_id')) ||
        (await AsyncStorage.getItem('user_id')) ||
        '';
      const res = await createTimesheet({
        employee,
        customer,
        activity_type: activityType,
        project,
        task,
        from_time: addFromDateTime,
        to_time: addToDateTime,
        description: taskDetails,
        status: status || undefined,
        hours: typeof hoursNumber === 'number' ? hoursNumber : undefined,
      });
      if (!res.ok) {
        Alert.alert('Timesheet', res.message || 'Failed to save timesheet');
        return;
      }
      const name = (res.data && (res.data.name || res.data.id)) || '';
      if (name) {
        const submitRes = await submitTimesheet(name, res.data);
        if (!submitRes.ok) {
          Alert.alert('Timesheet', submitRes.message || 'Saved as draft. Submission failed.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
          return;
        }
      }
      Alert.alert('Timesheet', 'Timesheet saved successfully.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err: any) {
      Alert.alert('Timesheet', err?.message || 'Failed to save timesheet');
    } finally {
      setSavingTimesheet(false);
    }
  };

  const openPicker = (target: 'from' | 'to') => {
    setPickerTarget(target);
    const base =
      target === 'from'
        ? addFromDateTime
          ? new Date(addFromDateTime)
          : new Date()
        : addToDateTime
        ? new Date(addToDateTime)
        : new Date();
    setPickerTempDate(base);
    setPickerMode(Platform.OS === 'ios' ? 'datetime' : 'date');
    setPickerVisible(true);
  };

  const handlePickerChange = (_: any, selected?: Date) => {
    const target = pickerTarget;
    if (!target) {
      setPickerVisible(false);
      return;
    }
    if (Platform.OS === 'android') {
      if (pickerMode === 'date') {
        const base = selected || pickerTempDate || new Date();
        setPickerTempDate(base);
        setPickerMode('time');
        setPickerVisible(true);
        return;
      }
      if (pickerMode === 'time') {
        setPickerVisible(false);
        const base = pickerTempDate || new Date();
        const applied = selected || base;
        const finalDate = new Date(base);
        finalDate.setHours(applied.getHours(), applied.getMinutes(), 0, 0);
        if (target === 'from') setAddFromDateTime(finalDate.toISOString());
        else setAddToDateTime(finalDate.toISOString());
        setPickerMode('date');
        return;
      }
    } else {
      if (selected) setPickerTempDate(selected);
    }
  };

  const applyIOSPicker = () => {
    if (!pickerTarget) return;
    const finalDate = pickerTempDate || new Date();
    if (pickerTarget === 'from') setAddFromDateTime(finalDate.toISOString());
    else setAddToDateTime(finalDate.toISOString());
    setPickerVisible(false);
    setPickerTarget(null);
  };

  const toggleCompleted = () => {
    setCompleted((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      <Header screenName="New Timesheet" showBack navigation={navigation as any} onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Details</Text>

        <Text style={styles.label}>Customer</Text>
        <TouchableOpacity
          style={styles.input}
          activeOpacity={0.85}
          onPress={() => {
            if (!readOnly) setShowCustomerOptions((prev) => !prev);
          }}
        >
          <Text style={customer ? styles.value : styles.placeholder}>
            {customer || (loadingCustomers ? 'Loading...' : 'Select customer')}
          </Text>
        </TouchableOpacity>
        {showCustomerOptions && (
          <View style={[styles.dropdownList, styles.dropdownScroll]}>
            <TextInput
              style={styles.dropdownSearch}
              placeholder="Search customer"
              value={customerSearch}
              onChangeText={setCustomerSearch}
              editable={!readOnly}
            />
            {(customerOptions || []).length === 0 && (
              <Text style={styles.dropdownEmptyText}>{loadingCustomers ? 'Loading...' : 'No customers found'}</Text>
            )}
            <ScrollView nestedScrollEnabled>
              {(customerOptions || [])
                .filter((c) => c.toLowerCase().includes(customerSearch.toLowerCase()))
                .map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.dropdownItem}
                  onPress={() => {
                    if (readOnly) return;
                    setCustomer(opt);
                    setShowCustomerOptions(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={styles.label}>Activity Type</Text>
        <TouchableOpacity
          style={styles.input}
          activeOpacity={0.85}
          onPress={() => {
            if (!readOnly) setShowActivityOptions((prev) => !prev);
          }}
        >
          <Text style={activityType ? styles.value : styles.placeholder}>
            {activityType || (loadingActivityTypes ? 'Loading...' : 'Select activity')}
          </Text>
        </TouchableOpacity>
        {showActivityOptions && (
          <View style={[styles.dropdownList, styles.dropdownScroll]}>
            <TextInput
              style={styles.dropdownSearch}
              placeholder="Search activity"
              value={activitySearch}
              onChangeText={setActivitySearch}
              editable={!readOnly}
            />
            {activityTypeOptions.length === 0 && (
              <Text style={styles.dropdownEmptyText}>
                {loadingActivityTypes ? 'Loading...' : 'No activity types found'}
              </Text>
            )}
            <ScrollView nestedScrollEnabled>
              {activityTypeOptions
                .filter((c) => c.toLowerCase().includes(activitySearch.toLowerCase()))
                .map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.dropdownItem}
                  onPress={() => {
                    if (readOnly) return;
                    setActivityType(opt);
                    setShowActivityOptions(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={styles.label}>From (Date & Time)</Text>
        <TouchableOpacity
          style={styles.input}
          activeOpacity={0.85}
          onPress={() => {
            if (!readOnly) openPicker('from');
          }}
        >
          <Text style={addFromDateTime ? styles.value : styles.placeholder}>
            {addFromDateTime ? new Date(addFromDateTime).toLocaleString() : 'Select start date & time'}
          </Text>
        </TouchableOpacity>
        {pickerVisible && pickerTarget === 'from' && (
          <View style={styles.pickerContainerInline}>
            <DateTimePicker
              value={pickerTempDate || new Date()}
              mode={pickerMode}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handlePickerChange}
            />
            <View style={styles.pickerInlineActions}>
              <TouchableOpacity
                onPress={() => {
                  setPickerVisible(false);
                  setPickerTarget(null);
                  setPickerMode('date');
                }}
                style={styles.inlineAction}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={applyIOSPicker} style={styles.inlineAction}>
                <Text style={styles.pickerPrimaryText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={styles.label}>To (Date & Time)</Text>
        <TouchableOpacity
          style={styles.input}
          activeOpacity={0.85}
          onPress={() => {
            if (!readOnly) openPicker('to');
          }}
        >
          <Text style={addToDateTime ? styles.value : styles.placeholder}>
            {addToDateTime ? new Date(addToDateTime).toLocaleString() : 'Select end date & time'}
          </Text>
        </TouchableOpacity>
        {pickerVisible && pickerTarget === 'to' && (
          <View style={styles.pickerContainerInline}>
            <DateTimePicker
              value={pickerTempDate || new Date()}
              mode={pickerMode}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handlePickerChange}
            />
            <View style={styles.pickerInlineActions}>
              <TouchableOpacity
                onPress={() => {
                  setPickerVisible(false);
                  setPickerTarget(null);
                  setPickerMode('date');
                }}
                style={styles.inlineAction}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={applyIOSPicker} style={styles.inlineAction}>
                <Text style={styles.pickerPrimaryText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={styles.label}>Hrs</Text>
        <View style={styles.input}>
          <Text style={hoursValue ? styles.value : styles.placeholder}>
            {hoursValue || 'Auto-calculated from dates'}
          </Text>
        </View>

        <Text style={styles.label}>Task Details</Text>
        <TextInput
          style={[styles.textInput, { height: 80 }]}
          placeholder="Describe the work done"
          value={taskDetails}
          onChangeText={setTaskDetails}
          multiline
          editable={!readOnly}
        />

        <Text style={styles.label}>Project</Text>
        <TouchableOpacity
          style={styles.input}
          activeOpacity={0.85}
          onPress={() => {
            if (!readOnly) setShowProjectOptions((prev) => !prev);
          }}
        >
          <Text style={project ? styles.value : styles.placeholder}>{project || 'Select project'}</Text>
        </TouchableOpacity>
        {showProjectOptions && (
          <View style={[styles.dropdownList, styles.dropdownScroll]}>
            <TextInput
              style={styles.dropdownSearch}
              placeholder="Search project"
              value={projectSearch}
              onChangeText={setProjectSearch}
              editable={!readOnly}
            />
            {projectOptions.length === 0 && (
              <Text style={styles.dropdownEmptyText}>{loadingProjects ? 'Loading...' : 'No projects found'}</Text>
            )}
            <ScrollView nestedScrollEnabled>
              {projectOptions
                .filter((c) => c.toLowerCase().includes(projectSearch.toLowerCase()))
                .map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.dropdownItem}
                  onPress={() => {
                    if (readOnly) return;
                    setProject(opt);
                    setShowProjectOptions(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={styles.label}>Task</Text>
        <TouchableOpacity
          style={styles.input}
          activeOpacity={0.85}
          onPress={() => {
            if (!readOnly) setShowTaskOptions((prev) => !prev);
          }}
        >
          <Text style={task ? styles.value : styles.placeholder}>
            {task
              ? taskOptions.find((opt) => opt.name === task)?.label || task
              : loadingTasks
              ? 'Loading...'
              : 'Select task'}
          </Text>
        </TouchableOpacity>
        {showTaskOptions && (
          <View style={[styles.dropdownList, styles.dropdownScroll]}>
            <TextInput
              style={styles.dropdownSearch}
              placeholder="Search task"
              value={taskSearch}
              onChangeText={setTaskSearch}
              editable={!readOnly}
            />
            {(taskOptions || []).length === 0 && (
              <Text style={styles.dropdownEmptyText}>{loadingTasks ? 'Loading...' : 'No tasks found'}</Text>
            )}
            <ScrollView nestedScrollEnabled>
              {(taskOptions || [])
                .filter((opt) => {
                  const q = taskSearch.toLowerCase();
                  return (
                    opt.name.toLowerCase().includes(q) ||
                    (opt.subject || '').toLowerCase().includes(q) ||
                    opt.label.toLowerCase().includes(q)
                  );
                })
                .map((opt) => (
                <TouchableOpacity
                  key={opt.name}
                  style={styles.dropdownItem}
                  onPress={() => {
                    if (readOnly) return;
                    setTask(opt.name);
                    setShowTaskOptions(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{opt.name}</Text>
                  {!!opt.subject && <Text style={styles.dropdownItemSubtext}>{opt.subject}</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={styles.label}>Status</Text>
        <TextInput
          style={[styles.textInput, { height: 80 }]}
          placeholder="Enter status"
          value={status}
          multiline
          onChangeText={setStatus}
          editable={!readOnly}
        />

        <TouchableOpacity
          style={styles.checkboxRow}
          activeOpacity={0.85}
          onPress={() => {
            if (!readOnly) toggleCompleted();
          }}
        >
          <Ionicons
            name={completed ? 'checkbox' : 'square-outline'}
            size={20}
            color={completed ? '#1D3765' : '#6B7280'}
          />
          <Text style={styles.checkboxLabel}>Completed</Text>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          {!readOnly && (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleSaveTimesheet}
              disabled={savingTimesheet}
            >
              <Text style={styles.primaryText}>{savingTimesheet ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 16, paddingBottom: 32, gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  label: { fontSize: 13, color: '#4B5563', marginTop: 4 },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  value: { fontSize: 13, color: '#111827' },
  placeholder: { fontSize: 13, color: '#9CA3AF' },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 12,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  button: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  primaryButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  cancelText: { color: '#374151', fontWeight: '700', fontSize: 13 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  dropdownList: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  dropdownItemText: { fontSize: 13, color: '#111827' },
  dropdownItemSubtext: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  dropdownEmptyText: { fontSize: 13, color: '#6B7280', padding: 10 },
  dropdownScroll: {
    maxHeight: 180,
  },
  dropdownSearch: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    marginBottom: 8,
  },
  pickerContainerInline: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 8,
  },
  pickerInlineActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  inlineAction: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pickerPrimaryText: { color: '#111827', fontWeight: '700', fontSize: 13 },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  checkboxLabel: { fontSize: 13, color: '#111827', fontWeight: '600' },
});

export default TimesheetCreateNewScreen;
