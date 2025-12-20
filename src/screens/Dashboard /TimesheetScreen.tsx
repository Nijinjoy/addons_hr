import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import Header from '../../components/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import {
  getTimesheets,
  Timesheet,
  getCustomers,
  getActivityTypes,
  getProjects,
  getTasks,
  createTimesheet,
  submitTimesheet,
  getTimesheetDetail,
} from '../../services/timesheetService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

const TimesheetScreen = () => {
  const navigation = useNavigation<any>();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addFromDateTime, setAddFromDateTime] = useState('');
  const [addToDateTime, setAddToDateTime] = useState('');
  const [addStatus, setAddStatus] = useState('Draft');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'from' | 'to' | null>(null);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | 'datetime'>('date');
  const [pickerTempDate, setPickerTempDate] = useState<Date>(new Date());
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
  const [taskOptions, setTaskOptions] = useState<string[]>([]);
  const [task, setTask] = useState('');
  const [showTaskOptions, setShowTaskOptions] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [savingTimesheet, setSavingTimesheet] = useState(false);
  const [taskSearch, setTaskSearch] = useState('');
  const [taskDetails, setTaskDetails] = useState('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null);
  const [detailDoc, setDetailDoc] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchTimesheets = async (silent?: boolean) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError('');
      const employee =
        (await AsyncStorage.getItem('employee_id')) ||
        (await AsyncStorage.getItem('user_id')) ||
        '';
      const res = await getTimesheets({ employee: employee || undefined, limit: 50 });
      console.log("res=====>",res);
      
      if (!res.ok) {
        setError(res.message || 'Failed to load timesheets');
        setTimesheets([]);
        return;
      }
      setTimesheets(res.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load timesheets');
      setTimesheets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTimesheets();
  }, []);

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
          if (!task && opts.length) setTask(opts[0]);
          else if (task && opts.includes(task)) setTask(task);
          else if (!opts.includes(task) && opts.length) setTask(opts[0]);
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

  const totalHours = useMemo(
    () =>
      timesheets.reduce((acc, cur) => {
        const val = typeof cur.total_hours === 'number' ? cur.total_hours : Number(cur.total_hours) || 0;
        return acc + val;
      }, 0),
    [timesheets]
  );

  const handleAddTimesheet = () => {
    setAddModalVisible(true);
    setPickerMode('date');
    setPickerTarget(null);
    setPickerVisible(false);
  };

  const handleSaveTimesheet = async () => {
    if (savingTimesheet) return;
    if (!customer || !activityType || !project || !task || !taskDetails || !addFromDateTime || !addToDateTime) {
      Alert.alert('Timesheet', 'All fields are mandatory. Please fill everything.');
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
      });
      if (!res.ok) {
        Alert.alert('Timesheet', res.message || 'Failed to save timesheet');
      } else {
        // Submit the created timesheet
        const name = (res.data && (res.data.name || res.data.id)) || '';
        if (name) {
          const submitRes = await submitTimesheet(name, res.data);
          if (!submitRes.ok) {
            Alert.alert('Timesheet', submitRes.message || 'Saved as draft. Submission failed.');
          } else {
            Alert.alert('Timesheet', 'Submitted. You can add another entry.');
          }
        } else {
          Alert.alert('Timesheet', 'Saved. Unable to submit automatically.');
        }
        fetchTimesheets(true);
        setAddFromDateTime('');
        setAddToDateTime('');
        setTask('');
        setTaskDetails('');
        setShowTaskOptions(false);
        setShowCustomerOptions(false);
        setShowProjectOptions(false);
        setShowActivityOptions(false);
        setPickerTempDate(new Date());
        setPickerVisible(false);
        setPickerTarget(null);
        setPickerMode('date');
      }
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
      // iOS: update temp; apply on explicit Done
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

  const weekBuckets = useMemo(() => {
    const buckets: Record<string, { label: string; rows: Timesheet[]; sortKey: number }> = {};
    const toWeekStart = (iso?: string) => {
      const d = iso ? new Date(iso) : new Date();
      const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const day = date.getUTCDay(); // 0=Sun
      const diff = day === 0 ? -6 : 1 - day; // shift to Monday
      date.setUTCDate(date.getUTCDate() + diff);
      return date;
    };

    (timesheets || []).forEach((ts) => {
      const start = toWeekStart(ts.start_date);
      const key = start.toISOString().slice(0, 10);
      if (!buckets[key]) {
        buckets[key] = { label: `Week of ${key}`, rows: [], sortKey: start.getTime() };
      }
      buckets[key].rows.push(ts);
    });

    return Object.values(buckets).sort((a, b) => b.sortKey - a.sortKey);
  }, [timesheets]);

  return (
    <View style={styles.container}>
      <Header screenName="Timesheet" showBack navigation={navigation as any} onBackPress={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchTimesheets(true)} tintColor="#1D3765" />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Entries</Text>
            <Text style={styles.metricValue}>{timesheets.length}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Hours</Text>
            <Text style={styles.metricValue}>{totalHours.toFixed(1)}h</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.9} onPress={() => fetchTimesheets(true)}>
            <Ionicons name="refresh-outline" size={16} color="#1D3765" />
            <Text style={styles.actionButtonText}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.9} onPress={handleAddTimesheet}>
            <Ionicons name="add-circle-outline" size={16} color="#fff" />
            <Text style={styles.primaryButtonText}>New Timesheet</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.centerRow}>
            <ActivityIndicator size="small" color="#1D3765" />
            <Text style={styles.subtleText}>Loading timesheets...</Text>
          </View>
        )}
        {!!error && !loading && <Text style={styles.errorText}>{error}</Text>}
        {!loading && !error && timesheets.length === 0 && (
          <Text style={styles.placeholderText}>
            No timesheet entries found. Pull to refresh or add a new entry.
          </Text>
        )}
        {!loading &&
          !error &&
          weekBuckets.length > 0 &&
          weekBuckets.map((bucket) => (
            <View key={bucket.label} style={styles.section}>
              <Text style={styles.sectionTitle}>{bucket.label}</Text>
              <View style={styles.table}>
                <View style={[styles.rowBase, styles.tableHeader]}>
                  <View style={[styles.cellContainer, styles.flex22]}>
                    <Text style={styles.headerCell} numberOfLines={1}>
                      Employee
                    </Text>
                  </View>
                  <View style={[styles.cellContainer, styles.flex18]}>
                    <Text style={styles.headerCell} numberOfLines={1}>
                      From Date
                    </Text>
                  </View>
                  <View style={[styles.cellContainer, styles.flex12, styles.cellRight]}>
                    <Text style={[styles.headerCell, styles.cellRight]} numberOfLines={1}>
                      Status
                    </Text>
                  </View>
                </View>
                {bucket.rows.map((item) => (
                  <TouchableOpacity
                    key={item.name}
                    style={[styles.rowBase, styles.tableRow]}
                    activeOpacity={0.85}
                    onPress={() => {
                      console.log('Timesheet selected:', item);
                      setSelectedTimesheet(item);
                      setDetailModalVisible(true);
                      setDetailLoading(true);
                      setDetailDoc(null);
                      getTimesheetDetail(item.name)
                        .then((res) => {
                          console.log('Timesheet detail response:', res);
                          if (res.ok) {
                            setDetailDoc(res.data);
                          } else {
                            setDetailDoc(null);
                          }
                        })
                        .catch((err) => {
                          console.log('Timesheet detail fetch error:', err?.message || err);
                          setDetailDoc(null);
                        })
                        .finally(() => setDetailLoading(false));
                    }}
                  >
                    <View style={[styles.cellContainer, styles.flex22]}>
                      <Text style={styles.entryTitle} numberOfLines={1} ellipsizeMode="tail">
                        {item.employee_name || item.employee || 'Timesheet'}
                      </Text>
                      <Text style={styles.entryMeta} numberOfLines={1} ellipsizeMode="tail">
                        {item.company || 'Company'}
                      </Text>
                    </View>
                    <View style={[styles.cellContainer, styles.flex18]}>
                      <Text style={styles.entryDates} numberOfLines={1} ellipsizeMode="tail">
                        {item.start_date || '-'}
                      </Text>
                    </View>
                    <View style={[styles.cellContainer, styles.flex12, styles.cellRight, styles.statusCell]}>
                      <Text
                        style={[
                          styles.statusBadge,
                          statusColor(item.status),
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {item.status || 'Draft'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
      </ScrollView>

      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setDetailModalVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.detailSheet}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>Timesheet Details</Text>
            <TouchableOpacity onPress={() => setDetailModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color="#0F172A" />
            </TouchableOpacity>
          </View>
          <ScrollView
            contentContainerStyle={styles.detailBody}
            showsVerticalScrollIndicator={false}
            style={styles.detailScroll}
          >
            {detailLoading ? (
              <Text style={styles.detailRowValue}>Loading details...</Text>
            ) : selectedTimesheet ? (
              <>
                <Text style={styles.detailRowLabel}>Employee</Text>
                <Text style={styles.detailRowValue}>
                  {(detailDoc?.employee_name || selectedTimesheet.employee_name || selectedTimesheet.employee) || '-'}
                </Text>

                <Text style={styles.detailRowLabel}>Project</Text>
                <Text style={styles.detailRowValue}>
                  {detailDoc?.project || detailDoc?.project_name || selectedTimesheet.project || '-'}
                </Text>

                <Text style={styles.detailRowLabel}>Task</Text>
                <Text style={styles.detailRowValue}>
                  {detailDoc?.task || detailDoc?.time_logs?.[0]?.task || selectedTimesheet.task || '-'}
                </Text>

                <Text style={styles.detailRowLabel}>Activity Type</Text>
                <Text style={styles.detailRowValue}>
                  {detailDoc?.activity_type ||
                    detailDoc?.time_logs?.[0]?.activity_type ||
                    selectedTimesheet.activity_type ||
                    '-'}
                </Text>

                <Text style={styles.detailRowLabel}>Customer</Text>
                <Text style={styles.detailRowValue}>
                  {detailDoc?.customer || detailDoc?.time_logs?.[0]?.customer || selectedTimesheet.customer || '-'}
                </Text>

                <Text style={styles.detailRowLabel}>From</Text>
                <Text style={styles.detailRowValue}>{selectedTimesheet.start_date || '-'}</Text>

                <Text style={styles.detailRowLabel}>To</Text>
                <Text style={styles.detailRowValue}>{selectedTimesheet.end_date || '-'}</Text>

                <Text style={styles.detailRowLabel}>Status</Text>
                <Text style={styles.detailStatus}>{selectedTimesheet.status || 'Draft'}</Text>

                <Text style={styles.detailRowLabel}>Hours</Text>
                <Text style={styles.detailRowValue}>
                  {typeof selectedTimesheet.total_hours === 'number'
                    ? selectedTimesheet.total_hours.toFixed(2)
                    : selectedTimesheet.total_hours || '-'}
                </Text>

                <Text style={styles.detailRowLabel}>Note</Text>
                <Text style={styles.detailRowValue}>
                  {detailDoc?.note ||
                    detailDoc?.description ||
                    detailDoc?.time_logs?.[0]?.description ||
                    selectedTimesheet.note ||
                    selectedTimesheet.task ||
                    'No notes'}
                </Text>
              </>
            ) : (
              <Text style={styles.detailRowValue}>No timesheet selected.</Text>
            )}
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={addModalVisible} animationType="slide" transparent onRequestClose={() => setAddModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setAddModalVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalSheet}>
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>New Timesheet</Text>

            <Text style={styles.modalLabel}>Customer</Text>
            <TouchableOpacity
              style={styles.modalInput}
              activeOpacity={0.85}
              onPress={() => setShowCustomerOptions((prev) => !prev)}
            >
              <Text style={customer ? styles.modalValue : styles.modalPlaceholder}>
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
                />
                {customerOptions.length === 0 && (
                  <Text style={styles.dropdownEmptyText}>
                    {loadingCustomers ? 'Loading...' : 'No customers found'}
                  </Text>
                )}
                <ScrollView nestedScrollEnabled>
                  {customerOptions
                    .filter((c) => c.toLowerCase().includes(customerSearch.toLowerCase()))
                    .map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={styles.dropdownItem}
                      onPress={() => {
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

            <Text style={styles.modalLabel}>Activity Type</Text>
            <TouchableOpacity
              style={styles.modalInput}
              activeOpacity={0.85}
              onPress={() => setShowActivityOptions((prev) => !prev)}
            >
              <Text style={activityType ? styles.modalValue : styles.modalPlaceholder}>
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

            <Text style={styles.modalLabel}>From (Date & Time)</Text>
          <TouchableOpacity
            style={styles.modalInput}
            activeOpacity={0.85}
            onPress={() => openPicker('from')}
          >
            <Text style={addFromDateTime ? styles.modalValue : styles.modalPlaceholder}>
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
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={applyIOSPicker} style={styles.inlineAction}>
                  <Text style={styles.pickerPrimaryText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={styles.modalLabel}>To (Date & Time)</Text>
          <TouchableOpacity
            style={styles.modalInput}
            activeOpacity={0.85}
            onPress={() => openPicker('to')}
          >
            <Text style={addToDateTime ? styles.modalValue : styles.modalPlaceholder}>
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
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={applyIOSPicker} style={styles.inlineAction}>
                  <Text style={styles.pickerPrimaryText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={styles.modalLabel}>Task Details</Text>
          <TextInput
            style={[styles.modalTextInput, { height: 80 }]}
            placeholder="Describe the work done"
            value={taskDetails}
            onChangeText={setTaskDetails}
            multiline
          />

            <Text style={styles.modalLabel}>Project</Text>
            <TouchableOpacity
              style={styles.modalInput}
              activeOpacity={0.85}
              onPress={() => setShowProjectOptions((prev) => !prev)}
            >
              <Text style={project ? styles.modalValue : styles.modalPlaceholder}>
                {project || 'Select project'}
              </Text>
            </TouchableOpacity>
            {showProjectOptions && (
              <View style={[styles.dropdownList, styles.dropdownScroll]}>
                <TextInput
                  style={styles.dropdownSearch}
                  placeholder="Search project"
                  value={projectSearch}
                  onChangeText={setProjectSearch}
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

            <Text style={styles.modalLabel}>Task</Text>
            <TouchableOpacity
              style={styles.modalInput}
              activeOpacity={0.85}
              onPress={() => setShowTaskOptions((prev) => !prev)}
            >
              <Text style={task ? styles.modalValue : styles.modalPlaceholder}>
                {task || (loadingTasks ? 'Loading...' : 'Select task')}
              </Text>
            </TouchableOpacity>
            {showTaskOptions && (
              <View style={[styles.dropdownList, styles.dropdownScroll]}>
                <TextInput
                  style={styles.dropdownSearch}
                  placeholder="Search task"
                  value={taskSearch}
                  onChangeText={setTaskSearch}
                />
                {taskOptions.length === 0 && (
                  <Text style={styles.dropdownEmptyText}>{loadingTasks ? 'Loading...' : 'No tasks found'}</Text>
                )}
                <ScrollView nestedScrollEnabled>
                  {taskOptions
                    .filter((c) => c.toLowerCase().includes(taskSearch.toLowerCase()))
                    .map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setTask(opt);
                        setShowTaskOptions(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={() => setAddModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalPrimary]} onPress={handleSaveTimesheet}>
                <Text style={styles.modalPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const statusColor = (status?: string) => {
  const normalized = (status || '').toLowerCase();
  if (normalized.includes('submitted')) return { backgroundColor: '#E5ECFF', color: '#1D3765' };
  if (normalized.includes('approved') || normalized.includes('completed'))
    return { backgroundColor: '#E8F7EE', color: '#1B7F3B' };
  if (normalized.includes('rejected') || normalized.includes('cancelled'))
    return { backgroundColor: '#FEEDEC', color: '#D14343' };
  return { backgroundColor: '#F3F4F6', color: '#4B5563' };
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F8FAFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metricLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  metricValue: { fontSize: 20, fontWeight: '700', color: '#111827' },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E5ECFF',
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D8E2FF',
  },
  actionButtonText: { color: '#1D3765', fontWeight: '700', fontSize: 13 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5ECFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pillText: { marginLeft: 6, fontSize: 12, color: '#1D3765', fontWeight: '600' },
  placeholderText: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 16 },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D3765',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 8,
  },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  centerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  subtleText: { fontSize: 12, color: '#6B7280' },
  errorText: { color: '#D14343', fontSize: 12, marginBottom: 12 },
  entryTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  entryDates: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  entryMeta: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  statusBadge: {
    marginTop: 0,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    minWidth: 96,
  },
  table: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 14,
  },
  rowBase: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    columnGap: 0,
  },
  tableHeader: {
    backgroundColor: '#F9FAFB',
  },
  tableRow: {
  },
  headerCell: { fontSize: 11, fontWeight: '700', color: '#4B5563' },
  cellValue: { fontSize: 12, color: '#111827', textAlign: 'right' },
  flex1: { flex: 1 },
  flex22: { flex: 2.2 },
  flex18: { flex: 1.8 },
  flex12: { flex: 1.2 },
  flex08: { flex: 0.8 },
  cellRight: { textAlign: 'right' },
  cellGap: { justifyContent: 'center' },
  cellContainer: {
    paddingRight: 8,
    minWidth: 0,
    alignSelf: 'stretch',
    justifyContent: 'center',
    borderRightWidth: 0,
    borderRightColor: 'transparent',
  },
  statusCell: { alignItems: 'flex-end' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  detailSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 10,
    maxHeight: '85%',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  detailScroll: { maxHeight: '100%' },
  detailBody: { gap: 12, paddingBottom: 32 },
  detailRowLabel: { color: '#475569', fontSize: 12, fontWeight: '700' },
  detailRowValue: { color: '#0F172A', fontSize: 14, fontWeight: '600' },
  detailStatus: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  modalLabel: { fontSize: 13, color: '#4B5563', marginTop: 4 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  modalValue: { fontSize: 13, color: '#111827' },
  modalPlaceholder: { fontSize: 13, color: '#9CA3AF' },
  modalTextInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 6,
    fontSize: 13,
    color: '#111827',
  },
  modalContent: { paddingBottom: 12, gap: 10 },
  statusRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  statusChipActive: {
    borderColor: '#1D3765',
    backgroundColor: '#E5ECFF',
  },
  statusChipText: { fontSize: 13, color: '#4B5563', fontWeight: '600' },
  statusChipTextActive: { color: '#1D3765' },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancel: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  modalCancelText: { color: '#374151', fontWeight: '700', fontSize: 13 },
  modalPrimary: { backgroundColor: '#1D3765' },
  modalPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    marginTop: 6,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: { fontSize: 13, color: '#111827' },
  dropdownEmptyText: { fontSize: 13, color: '#6B7280', padding: 10 },
  dropdownScroll: {
    maxHeight: 180,
  },
  dropdownSearch: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  pickerContainer: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 6,
    backgroundColor: '#F9FAFB',
  },
  pickerContainerInline: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    padding: 6,
  },
  pickerInlineActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 6,
    paddingBottom: 6,
  },
  inlineAction: { paddingVertical: 6, paddingHorizontal: 8 },
  pickerPrimaryText: { color: '#111827', fontWeight: '700', fontSize: 13 },
});

export default TimesheetScreen;
