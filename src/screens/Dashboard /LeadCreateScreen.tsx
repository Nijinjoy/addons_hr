import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import Header from '../../components/Header';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary, launchCamera, Asset } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getLeadSources, getAssociateDetails } from '../../services/leadService';

const dropdownPlaceholder = 'Select';

const LeadCreateScreen = () => {
  const navigation = useNavigation<any>();

  const [fullName, setFullName] = useState('');
  const [date, setDate] = useState('');
  const [gender, setGender] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [source, setSource] = useState('');
  const [associate, setAssociate] = useState('');
  const [building, setBuilding] = useState('');
  const [leadOwner, setLeadOwner] = useState('');
  const [status, setStatus] = useState('');
  const [leadType, setLeadType] = useState('');
  const [requestType, setRequestType] = useState('');
  const [serviceType, setServiceType] = useState('');

  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [attachments, setAttachments] = useState<Asset[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sourceOptions, setSourceOptions] = useState<string[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);
  const [associateOptions, setAssociateOptions] = useState<string[]>([]);
  const [loadingAssociates, setLoadingAssociates] = useState(false);
  const [openDropdown, setOpenDropdown] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadSources = async () => {
      try {
        setLoadingSources(true);
        const res = await getLeadSources();
        if (!mounted) return;
        if (res.ok) {
          setSourceOptions(res.data || []);
        } else {
          console.log('LeadCreateScreen source load failed:', res.message);
        }
      } catch (err: any) {
        console.log('LeadCreateScreen source fetch error:', err?.message || err);
      } finally {
        if (mounted) setLoadingSources(false);
      }
    };
    const loadAssociates = async () => {
      try {
        setLoadingAssociates(true);
        const res = await getAssociateDetails();
        if (!mounted) return;
        if (res.ok) {
          setAssociateOptions(res.data || []);
        } else {
          console.log('LeadCreateScreen associate load failed:', res.message);
        }
      } catch (err: any) {
        console.log('LeadCreateScreen associate fetch error:', err?.message || err);
      } finally {
        if (mounted) setLoadingAssociates(false);
      }
    };
    loadSources();
    loadAssociates();
    return () => {
      mounted = false;
    };
  }, []);

  const pickImages = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 0 });
    if (result.didCancel || !result.assets?.length) return;
    setAttachments(result.assets);
  };

  const captureImage = async () => {
    const result = await launchCamera({ mediaType: 'photo', cameraType: 'back' });
    if (result.didCancel || !result.assets?.length) return;
    setAttachments(prev => [...prev, ...result.assets]);
  };

  const handleSave = () => {
    if (!fullName) {
      Alert.alert('Lead', 'Please enter full name.');
      return;
    }
    Alert.alert('Lead', 'Lead created (placeholder).');
    navigation.goBack();
  };

  const renderDropdown = (
    label: string,
    value: string,
    setter: (v: string) => void,
    options?: string[],
    loading?: boolean
  ) => {
    const hasOptions = !!options?.length;
    const isOpen = openDropdown === label;
    const displayText = loading ? 'Loading...' : value || dropdownPlaceholder;

    return (
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          style={styles.selectBox}
          onPress={() => {
            if (loading) return;
            if (hasOptions) {
              setOpenDropdown((prev) => (prev === label ? '' : label));
            } else {
              Alert.alert(label, 'Hook up dropdown data', [{ text: 'OK' }]);
            }
          }}
          activeOpacity={0.8}
        >
          <Text style={value ? styles.selectValue : styles.selectPlaceholder}>{displayText}</Text>
        </TouchableOpacity>
        {isOpen && hasOptions && (
          <View style={styles.dropdownListContainer}>
            <ScrollView style={styles.dropdownList} nestedScrollEnabled>
              {options?.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setter(opt);
                    setOpenDropdown('');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownItemText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        {loading && options && <Text style={styles.dropdownHint}>Loading options...</Text>}
        {!loading && options && !options.length && (
          <Text style={styles.dropdownHint}>No options available</Text>
        )}
      </View>
    );
  };

  const renderGenderToggle = () => (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>Gender</Text>
      <View style={styles.toggleGroup}>
        {['Male', 'Female', 'Other'].map((g) => {
          const active = gender === g;
          return (
            <TouchableOpacity
              key={g}
              style={[styles.toggleButton, active && styles.toggleButtonActive]}
              onPress={() => setGender(g)}
            >
              <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{g}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderInput = (
    label: string,
    value: string,
    setter: (v: string) => void,
    placeholder?: string,
    keyboardType: 'default' | 'email-address' | 'phone-pad' = 'default'
  ) => (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setter}
        placeholder={placeholder}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        screenName="New Lead"
        showBack
        navigation={navigation as any}
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Lead Details</Text>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
          >
            <Text style={date ? styles.selectValue : styles.selectPlaceholder}>
              {date || 'Select date'}
            </Text>
          </TouchableOpacity>
        </View>
        {showDatePicker && (
          <DateTimePicker
            value={date ? new Date(date) : new Date()}
            mode="date"
            display="default"
            onChange={(_, selected) => {
              setShowDatePicker(false);
              if (selected) {
                const iso = selected.toISOString().slice(0, 10);
                setDate(iso);
              }
            }}
          />
        )}
        {renderInput('Full Name', fullName, setFullName, 'Full name')}
        {renderGenderToggle()}
        {renderInput('Job Title', jobTitle, setJobTitle, 'Job title')}
        {renderDropdown('Source', source, setSource, sourceOptions, loadingSources)}
        {renderDropdown('Associate Details', associate, setAssociate, associateOptions, loadingAssociates)}
        {renderInput('Building & Location', building, setBuilding, 'Building / Location')}
        {renderDropdown('Lead Owner', leadOwner, setLeadOwner)}
        {renderDropdown('Status', status, setStatus)}
        {renderDropdown('Lead Type', leadType, setLeadType)}
        {renderDropdown('Request Type', requestType, setRequestType)}
        {renderDropdown('Service Type', serviceType, setServiceType)}

        <Text style={styles.sectionTitle}>Contact Info</Text>
        {renderInput('Email', email, setEmail, 'Email', 'email-address')}
        {renderInput('Mobile Number', mobile, setMobile, 'Mobile number', 'phone-pad')}
        {renderInput('Phone Number', phone, setPhone, 'Phone number', 'phone-pad')}
        {renderInput('Website', website, setWebsite, 'Website')}
        {renderInput('WhatsApp', whatsapp, setWhatsapp, 'WhatsApp', 'phone-pad')}

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Add Attachment</Text>
          <TouchableOpacity
            style={styles.attachmentBox}
            onPress={pickImages}
            activeOpacity={0.8}
          >
            <View style={styles.attachmentRow}>
              <Text style={styles.attachmentPrimary}>Tap to upload</Text>
              <Text style={styles.attachmentSecondary}>JPG, PNG (multiple) or capture</Text>
            </View>
            <View style={styles.attachmentHint}>
              <Text style={styles.attachmentHintText}>Attach supporting photos (multiple allowed)</Text>
            </View>
            <TouchableOpacity style={styles.captureButton} onPress={captureImage} activeOpacity={0.8}>
              <Text style={styles.captureText}>Capture Photo</Text>
            </TouchableOpacity>
            {attachments.length > 0 && (
              <View style={styles.attachmentList}>
                {attachments.map((a, idx) => (
                  <View key={a.uri || idx} style={styles.attachmentItemRow}>
                    <Text style={styles.attachmentItem} numberOfLines={1}>
                      {a.fileName || a.uri?.split('/').pop() || 'image'}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        setAttachments((prev) => prev.filter((_, pIdx) => pIdx !== idx))
                      }
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                    <Text style={styles.removeText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              </View>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>Save Lead</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
    marginTop: 8,
  },
  fieldBlock: { marginBottom: 12 },
  label: { fontSize: 14, color: '#374151', marginBottom: 6, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  selectBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  selectValue: { fontSize: 14, color: '#111827' },
  selectPlaceholder: { fontSize: 14, color: '#9CA3AF' },
  toggleGroup: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  toggleButtonActive: {
    borderColor: '#1D3765',
    backgroundColor: '#E5ECFF',
  },
  toggleText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#1D3765',
  },
  attachmentBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  attachmentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  attachmentPrimary: { fontSize: 14, fontWeight: '700', color: '#1D3765' },
  attachmentSecondary: { fontSize: 12, color: '#6B7280' },
  attachmentHint: { marginTop: 6 },
  attachmentHintText: { fontSize: 12, color: '#6B7280' },
  captureButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#1D3765',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  captureText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  attachmentList: { marginTop: 8, gap: 6 },
  attachmentItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  attachmentItem: { fontSize: 12, color: '#374151', flex: 1, marginRight: 8 },
  removeText: { fontSize: 12, color: '#D14343', fontWeight: '600' },
  saveButton: {
    marginTop: 16,
    backgroundColor: '#1D3765',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  dropdownListContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  dropdownList: {
    maxHeight: 220,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#111827',
  },
  dropdownHint: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
  },
});

export default LeadCreateScreen;
