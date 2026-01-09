import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../../../components/Header';
import {
  createTask,
  fetchIssues,
  fetchProjects,
  fetchParentTasks,
  fetchTaskTypes,
  fetchTaskStatuses,
  fetchTaskPriorities,
} from '../../../services/api/tasks.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CommonDropdown, { DropdownData } from '../../../components/CommonDropdown/CommonDropdown';

const fallbackPriorities = ['Low', 'Medium', 'High', 'Urgent'];
const fallbackTypes = ['Task', 'Bug', 'Feature', 'Support'];
const fallbackStatuses = ['Open', 'Working', 'Pending Review', 'Completed', 'Cancelled'];

const TaskCreateNewScreen = () => {
  const navigation = useNavigation();
  const [subject, setSubject] = useState('');
  const [project, setProject] = useState('');
  const [issue, setIssue] = useState('');
  const [taskType, setTaskType] = useState('');
  const [status, setStatus] = useState('');
  const [parentTask, setParentTask] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showParentModal, setShowParentModal] = useState(false);
  const [parentTaskName, setParentTaskName] = useState('');
  const [creatingParent, setCreatingParent] = useState(false);

  const [projectOptions, setProjectOptions] = useState<DropdownData[]>([]);
  const [issueOptions, setIssueOptions] = useState<DropdownData[]>([]);
  const [parentTaskOptions, setParentTaskOptions] = useState<DropdownData[]>([]);
  const [typeOptions, setTypeOptions] = useState<DropdownData[]>(fallbackTypes.map((t) => ({ id: t, label: t })));
  const [statusOptions, setStatusOptions] = useState<DropdownData[]>(fallbackStatuses.map((s) => ({ id: s, label: s })));
  const [priorityOptions, setPriorityOptions] = useState<DropdownData[]>(
    fallbackPriorities.map((p) => ({ id: p, label: p }))
  );
  const [loadingOptions, setLoadingOptions] = useState(false);

  const handleSubmit = async () => {
    const trimmed = subject.trim();
    if (!trimmed) {
      Alert.alert('Task', 'Subject is required');
      return;
    }
    try {
      setSubmitting(true);
      const companyUrl = (await AsyncStorage.getItem('company_url')) || undefined;
      await createTask(
        {
          subject: trimmed,
          description,
          priority,
          status,
          project: project.trim() || undefined,
          issue: issue.trim() || undefined,
          type: taskType,
          parent_task: parentTask.trim() || undefined,
        },
        companyUrl
      );
      Alert.alert('Task', 'Task created successfully');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Task', err?.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateParentTask = async () => {
    const name = parentTaskName.trim();
    if (!name) {
      Alert.alert('Task', 'Parent task name is required.');
      return;
    }
    if (creatingParent) return;
    try {
      setCreatingParent(true);
      const companyUrl = (await AsyncStorage.getItem('company_url')) || undefined;
      const res = await createTask({ subject: name, is_group: 1 }, companyUrl);
      const createdName =
        (res as any)?.data?.name ||
        (res as any)?.message?.name ||
        (res as any)?.name ||
        name;
      setParentTaskOptions((prev) => [{ id: createdName, label: name }, ...prev]);
      setParentTask(createdName);
      setShowParentModal(false);
      setParentTaskName('');
      Alert.alert('Task', 'Parent task created successfully.');
    } catch (err: any) {
      Alert.alert('Task', err?.message || 'Failed to create parent task');
    } finally {
      setCreatingParent(false);
    }
  };

  const loadOptions = async () => {
    try {
      setLoadingOptions(true);
      const companyUrl = (await AsyncStorage.getItem('company_url')) || undefined;
      const [projects, issues, parents, types, statuses, priorities] = await Promise.all([
        fetchProjects(companyUrl),
        fetchIssues(companyUrl),
        fetchParentTasks(companyUrl),
        fetchTaskTypes(companyUrl),
        fetchTaskStatuses(companyUrl),
        fetchTaskPriorities(companyUrl),
      ]);
      setProjectOptions(projects.map((p) => ({ id: p.id, label: p.label })));
      setIssueOptions(issues.map((p) => ({ id: p.id, label: p.label })));
      setParentTaskOptions(parents.map((p) => ({ id: p.id, label: p.label })));

      const typeList = types.map((t) => ({ id: t.id, label: t.label })).filter((t) => t.label);
      if (typeList.length) {
        setTypeOptions(typeList);
        if (!taskType) setTaskType(typeList[0].id);
      } else if (!taskType) {
        setTypeOptions(fallbackTypes.map((t) => ({ id: t, label: t })));
        setTaskType(fallbackTypes[0]);
      }

      const statusList = statuses.map((s) => ({ id: s.id, label: s.label })).filter((s) => s.label);
      if (statusList.length) {
        setStatusOptions(statusList);
        if (!status) setStatus(statusList[0].id);
      } else if (!status) {
        setStatusOptions(fallbackStatuses.map((s) => ({ id: s, label: s })));
        setStatus(fallbackStatuses[0]);
      }

      const priorityList = priorities.map((p) => ({ id: p.id, label: p.label })).filter((p) => p.label);
      if (priorityList.length) {
        setPriorityOptions(priorityList);
        if (!priority) setPriority(priorityList[0].id);
      } else if (!priority) {
        setPriorityOptions(fallbackPriorities.map((p) => ({ id: p, label: p })));
        setPriority(fallbackPriorities[0]);
      }
    } catch (err) {
      console.log('Failed to load dropdown options:', err?.message || err);
    } finally {
      setLoadingOptions(false);
    }
  };

  React.useEffect(() => {
    loadOptions();
  }, []);

  return (
    <View style={styles.container}>
      <Header
        pillText="Create Task"
        showBackButton
        badgeCount={0}
        onBackPress={() => navigation.goBack()}
        onBellPress={() => navigation.getParent?.()?.getParent?.()?.navigate?.('Notifications' as never)}
        onProfilePress={() => navigation.getParent()?.openDrawer?.()}
      />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter subject"
            value={subject}
            onChangeText={setSubject}
          />
        </View>
        <Dropdown
          label="Project"
          value={project}
          options={projectOptions}
          placeholder={loadingOptions ? 'Loading...' : 'Select project'}
          openKey="project"
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          onSelect={setProject}
          showCreateNew
        />

        <Dropdown
          label="Issue"
          value={issue}
          options={issueOptions}
          placeholder={loadingOptions ? 'Loading...' : 'Select issue'}
          openKey="issue"
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          onSelect={setIssue}
          showCreateNew
        />

        <Dropdown
          label="Type"
          value={taskType}
          options={typeOptions}
          placeholder={loadingOptions ? 'Loading...' : 'Select type'}
          openKey="type"
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          onSelect={setTaskType}
          showCreateNew
        />

        <Dropdown
          label="Status"
          value={status}
          options={statusOptions}
          placeholder={loadingOptions ? 'Loading...' : 'Select status'}
          openKey="status"
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          onSelect={setStatus}
          showCreateNew
        />

        <Dropdown
          label="Priority"
          value={priority}
          options={priorityOptions}
          placeholder={loadingOptions ? 'Loading...' : 'Select priority'}
          openKey="priority"
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          onSelect={setPriority}
          showCreateNew
        />

        <Dropdown
          label="Parent Task"
          value={parentTask}
          options={parentTaskOptions}
          placeholder={loadingOptions ? 'Loading...' : 'Select parent task'}
          openKey="parentTask"
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          onSelect={setParentTask}
          showCreateNew
          onCreateNew={() => {
            setOpenDropdown(null);
            setShowParentModal(true);
          }}
          createNewLabel="+ Create parent task"
        />

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Add details"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>
        <Pressable
          style={({ pressed }) => [styles.submitBtn, pressed && styles.cardPressed]}
          android_ripple={{ color: '#E5E7EB' }}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Create Task'}</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={showParentModal} transparent animationType="fade" onRequestClose={() => setShowParentModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create Parent Task</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Parent task name"
              value={parentTaskName}
              onChangeText={setParentTaskName}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => setShowParentModal(false)}
                disabled={creatingParent}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSave]}
                onPress={handleCreateParentTask}
                disabled={creatingParent}
              >
                <Text style={styles.modalSaveText}>{creatingParent ? 'Creating...' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  field: { gap: 8 },
  label: { color: '#0F172A', fontWeight: '700', fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
  },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  priorityChipActive: { borderColor: '#0F172A', backgroundColor: '#E0F2FE' },
  priorityText: { color: '#0F172A', fontWeight: '600' },
  priorityTextActive: { color: '#0F172A', fontWeight: '800' },
  submitBtn: {
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    alignItems: 'center',
  },
  submitText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  cardPressed: { opacity: 0.9 },
  dropdown: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: { color: '#0F172A', fontSize: 13, fontWeight: '700' },
  dropdownPlaceholder: { color: '#9CA3AF', fontSize: 13 },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  dropdownItem: { padding: 12 },
  dropdownItemText: { color: '#0F172A', fontSize: 13 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalInput: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  modalCancel: {
    backgroundColor: '#E5E7EB',
  },
  modalSave: {
    backgroundColor: '#000000',
  },
  modalCancelText: {
    color: '#0F172A',
    fontWeight: '700',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default TaskCreateNewScreen;
type DropdownProps = {
  label: string;
  value: string;
  options: DropdownData[];
  placeholder: string;
  openKey: string;
  openDropdown: string | null;
  setOpenDropdown: (key: string | null) => void;
  onSelect: (val: string) => void;
  enableSearch?: boolean;
  showCreateNew?: boolean;
  createNewLabel?: string;
  onCreateNew?: () => void;
};

const Dropdown = ({
  label,
  value,
  options,
  placeholder,
  openKey,
  openDropdown,
  setOpenDropdown,
  onSelect,
  enableSearch = true,
  showCreateNew = false,
  createNewLabel = '+ Create new',
  onCreateNew,
}: DropdownProps) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <Pressable
      style={({ pressed }) => [styles.dropdown, pressed && styles.cardPressed]}
      android_ripple={{ color: '#E5E7EB' }}
      onPress={() => setOpenDropdown(openDropdown === openKey ? null : openKey)}
    >
      <Text style={value ? styles.dropdownText : styles.dropdownPlaceholder}>
        {options.find((o) => String(o.id) === String(value))?.label || value || placeholder}
      </Text>
      <Ionicons
        name={openDropdown === openKey ? 'chevron-up' : 'chevron-down'}
        size={18}
        color="#0F172A"
      />
    </Pressable>
    {openDropdown === openKey && (
      <View style={styles.dropdownList}>
        <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }}>
          <CommonDropdown
            data={options}
            value={options.find((o) => String(o.id) === String(value)) || null}
            onSelect={(item) => {
              onSelect(String(item.id));
              setOpenDropdown(null);
            }}
            searchEnabled={enableSearch}
            onCreateNew={showCreateNew ? onCreateNew || (() => {}) : undefined}
            searchPlaceholder="Search..."
            onAdvancedSearch={undefined}
          />
        </ScrollView>
      </View>
    )}
  </View>
);
