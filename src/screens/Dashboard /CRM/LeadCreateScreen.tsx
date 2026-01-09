import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import Header from '../../../components/Header';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { launchImageLibrary, launchCamera, Asset } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import CommonDropdown, { DropdownData } from '../../../components/CommonDropdown/CommonDropdown';
import {
  getLeadSources,
  getAssociateDetails,
  getServiceTypes,
  getRequestTypes,
  getLeadTypes,
  getLeadStatuses,
  getLeadOwners,
  getBuildingLocations,
  createLeadSource,
} from '../../../services/leadService';
import { createLeadComment } from '../../../services/api/leads.service';
import { createLead, updateLead } from '../../../services/api/leadsCreate.service';
import { LeadStackParamList } from '../../../navigation/LeadStack';

const dropdownPlaceholder = 'Select';
type OptionType = string | { label: string; value: string };
type LeadCreateRouteProp = RouteProp<LeadStackParamList, 'LeadCreate'>;

const LeadCreateScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<LeadCreateRouteProp>();
  const editingLead = route.params?.lead;
  const onLeadUpdated = route.params?.onLeadUpdated;
  const isEditing = !!editingLead?.name;

  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [date, setDate] = useState('');
  const [notesText, setNotesText] = useState('');
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
  const [activeTab, setActiveTab] = useState<'details' | 'notes'>('details');
  const [savingNotes, setSavingNotes] = useState(false);
  const [sourceOptions, setSourceOptions] = useState<string[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);
  const [associateOptions, setAssociateOptions] = useState<string[]>([]);
  const [loadingAssociates, setLoadingAssociates] = useState(false);
  const [loadingMoreAssociates, setLoadingMoreAssociates] = useState(false);
  const [associateHasMore, setAssociateHasMore] = useState(false);
  const [associateOffset, setAssociateOffset] = useState(0);
  const [serviceTypeOptions, setServiceTypeOptions] = useState<string[]>([]);
  const [loadingServiceTypes, setLoadingServiceTypes] = useState(false);
  const [requestTypeOptions, setRequestTypeOptions] = useState<string[]>([]);
  const [loadingRequestTypes, setLoadingRequestTypes] = useState(false);
  const [leadTypeOptions, setLeadTypeOptions] = useState<string[]>([]);
  const [loadingLeadTypes, setLoadingLeadTypes] = useState(false);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [leadOwnerOptions, setLeadOwnerOptions] = useState<OptionType[]>([]);
  const [loadingLeadOwners, setLoadingLeadOwners] = useState(false);
  const [rawBuildingOptions, setRawBuildingOptions] = useState<string[]>([]);
  const [buildingOptions, setBuildingOptions] = useState<string[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openDropdown, setOpenDropdown] = useState('');
  const [newOptionModalVisible, setNewOptionModalVisible] = useState(false);
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [newOptionSave, setNewOptionSave] =
    useState<((value: string) => Promise<boolean> | boolean) | null>(null);
  const [creatingSource, setCreatingSource] = useState(false);
  const [simpleErrors, setSimpleErrors] = useState<{
    date?: string;
    name?: string;
    building?: string;
    status?: string;
  }>({});

  const associatePageSize = 50;

  const leadDetailInputs = [
    { label: 'Full Name', value: fullName, setter: setFullName, placeholder: 'Full name' },
    {
      label: 'Organization Name',
      value: organizationName,
      setter: setOrganizationName,
      placeholder: 'Organization name',
    },
    { label: 'Job Title', value: jobTitle, setter: setJobTitle, placeholder: 'Job title' },
  ];
  const simpleLeadInputs = [
    { label: 'Full Name', value: fullName, setter: setFullName, placeholder: 'Full name' },
    {
      label: 'Organization Name',
      value: organizationName,
      setter: setOrganizationName,
      placeholder: 'Organization name',
    },
    { label: 'Email', value: email, setter: setEmail, placeholder: 'Email', keyboardType: 'email-address' as const },
    { label: 'Phone Number', value: phone, setter: setPhone, placeholder: 'Phone number', keyboardType: 'phone-pad' as const },
  ];
  const leadDropdowns = [
    { label: 'Source', value: source, setter: setSource, options: sourceOptions, loading: loadingSources },
    {
      label: 'Building & Location',
      value: building,
      setter: setBuilding,
      options: buildingOptions,
      loading: loadingBuildings,
    },
    {
      label: 'Associate Details',
      value: associate,
      setter: setAssociate,
      options: associateOptions,
      loading: loadingAssociates,
    },
    {
      label: 'Lead Owner',
      value: leadOwner,
      setter: setLeadOwner,
      options: leadOwnerOptions,
      loading: loadingLeadOwners,
    },
    {
      label: 'Status',
      value: status,
      setter: setStatus,
      options: statusOptions,
      loading: loadingStatuses,
    },
    {
      label: 'Lead Type',
      value: leadType,
      setter: setLeadType,
      options: leadTypeOptions,
      loading: loadingLeadTypes,
    },
    {
      label: 'Request Type',
      value: requestType,
      setter: setRequestType,
      options: requestTypeOptions,
      loading: loadingRequestTypes,
    },
    {
      label: 'Service Type',
      value: serviceType,
      setter: setServiceType,
      options: serviceTypeOptions,
      loading: loadingServiceTypes,
    },
  ];
  const contactInputs = [
    { label: 'Email', value: email, setter: setEmail, placeholder: 'Email', keyboardType: 'email-address' as const },
    { label: 'Mobile Number', value: mobile, setter: setMobile, placeholder: 'Mobile number', keyboardType: 'phone-pad' as const },
    { label: 'Phone Number', value: phone, setter: setPhone, placeholder: 'Phone number', keyboardType: 'phone-pad' as const },
    { label: 'Website', value: website, setter: setWebsite, placeholder: 'Website' },
    { label: 'WhatsApp', value: whatsapp, setter: setWhatsapp, placeholder: 'WhatsApp', keyboardType: 'phone-pad' as const },
  ];

  const filterBuildingOptions = (options: string[], associateList: string[]) => {
    const associateSet = new Set((associateList || []).map((a) => a.trim().toLowerCase()));
    return (options || []).filter((item) => {
      const val = (item || '').trim();
      if (!val) return false;
      const lower = val.toLowerCase();
      if (/^crm-lead-/i.test(val)) return false;
      if (lower.includes('associate')) return false;
      if (associateSet.has(lower)) return false;
      return true;
    });
  };

  const loadMoreAssociates = async () => {
    if (loadingAssociates || loadingMoreAssociates || !associateHasMore) return;
    setLoadingMoreAssociates(true);
    try {
      const res = await getAssociateDetails(associatePageSize, associateOffset);
      if (res.ok && res.data?.length) {
        setAssociateOptions((prev) => {
          const next = new Set(prev);
          res.data.forEach((item) => next.add(item));
          return Array.from(next);
        });
        setAssociateOffset((prev) => prev + res.data.length);
        setAssociateHasMore(res.data.length >= associatePageSize);
      } else {
        setAssociateHasMore(false);
      }
    } catch (err: any) {
      setAssociateHasMore(false);
    } finally {
      setLoadingMoreAssociates(false);
    }
  };

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
        const res = await getAssociateDetails(associatePageSize, 0);
        console.log('Associate details response:', res);
        if (!mounted) return;
        if (res.ok) {
          setAssociateOptions(res.data || []);
          setAssociateOffset(res.data?.length || 0);
          setAssociateHasMore((res.data?.length || 0) >= associatePageSize);
        } else {
          console.log('LeadCreateScreen associate load failed:', res.message);
          setAssociateHasMore(false);
        }
      } catch (err: any) {
        console.log('LeadCreateScreen associate fetch error:', err?.message || err);
        setAssociateHasMore(false);
      } finally {
        if (mounted) setLoadingAssociates(false);
      }
    };
    const loadBuildings = async () => {
      try {
        setLoadingBuildings(true);
        const res = await getBuildingLocations();
        console.log('Building & Location response:', res);
        if (!mounted) return;
        if (res.ok && res.data?.length) {
          setRawBuildingOptions(res.data);
          setBuildingOptions(filterBuildingOptions(res.data, associateOptions));
        } else {
          console.log('LeadCreateScreen building load failed:', res.message);
          setBuildingOptions([]);
        }
      } catch (err: any) {
        console.log('LeadCreateScreen building fetch error:', err?.message || err);
        setBuildingOptions([]);
      } finally {
        if (mounted) setLoadingBuildings(false);
      }
    };
    const loadServiceTypes = async () => {
      try {
        setLoadingServiceTypes(true);
        const res = await getServiceTypes();
        console.log('Service type response:', res);
        if (!mounted) return;
        if (res.ok) {
          setServiceTypeOptions(res.data || []);
        } else {
          console.log('LeadCreateScreen service types load failed:', res.message);
        }
      } catch (err: any) {
        console.log('LeadCreateScreen service types fetch error:', err?.message || err);
      } finally {
        if (mounted) setLoadingServiceTypes(false);
      }
    };
    const loadLeadTypes = async () => {
      try {
        setLoadingLeadTypes(true);
        const res = await getLeadTypes();
        console.log('Lead type response:', res);
        if (!mounted) return;
        if (res.ok && res.data?.length) {
          console.log('Lead type dropdown options:', res.data);
          setLeadTypeOptions(res.data || []);
        } else {
          console.log('LeadCreateScreen lead types load failed:', res.message);
          setLeadTypeOptions([]);
        }
      } catch (err: any) {
        console.log('LeadCreateScreen lead types fetch error:', err?.message || err);
      } finally {
        if (mounted) setLoadingLeadTypes(false);
      }
    };
    const loadLeadOwners = async () => {
      try {
        setLoadingLeadOwners(true);
        const res = await getLeadOwners();
        console.log('Lead owner response:', res);
        if (!mounted) return;
        if (res.ok && res.data?.length) {
          setLeadOwnerOptions(res.data || []);
        } else {
          console.log('LeadCreateScreen lead owners load failed:', res.message);
          setLeadOwnerOptions([]);
        }
      } catch (err: any) {
        console.log('LeadCreateScreen lead owners fetch error:', err?.message || err);
      } finally {
        if (mounted) setLoadingLeadOwners(false);
      }
    };
    const loadStatuses = async () => {
      try {
        setLoadingStatuses(true);
        const res = await getLeadStatuses();
        console.log('Lead status response:', res);
        if (!mounted) return;
        if (res.ok && res.data?.length) {
          setStatusOptions(res.data || []);
        } else {
          console.log('LeadCreateScreen lead statuses load failed:', res.message);
          setStatusOptions([]);
        }
      } catch (err: any) {
        console.log('LeadCreateScreen lead statuses fetch error:', err?.message || err);
      } finally {
        if (mounted) setLoadingStatuses(false);
      }
    };
    const loadRequestTypes = async () => {
      try {
        setLoadingRequestTypes(true);
        const res = await getRequestTypes();
        if (!mounted) return;
        if (res.ok) {
          setRequestTypeOptions(res.data || []);
        } else {
          console.log('LeadCreateScreen request types load failed:', res.message);
        }
      } catch (err: any) {
        console.log('LeadCreateScreen request types fetch error:', err?.message || err);
      } finally {
        if (mounted) setLoadingRequestTypes(false);
      }
    };
    loadSources();
    loadAssociates();
    loadServiceTypes();
    loadRequestTypes();
    loadLeadTypes();
    loadStatuses();
    loadLeadOwners();
    loadBuildings();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setBuildingOptions(filterBuildingOptions(rawBuildingOptions, associateOptions));
  }, [associateOptions, rawBuildingOptions]);

  useEffect(() => {
    if (!editingLead) return;
    setFullName(editingLead.lead_name || editingLead.company_name || editingLead.name || '');
    setOrganizationName(editingLead.company_name || '');
    setDate(
      (editingLead as any)?.custom_date ||
        (editingLead as any)?.date ||
        (editingLead as any)?.creation?.slice(0, 10) ||
        ''
    );
    setGender((editingLead as any)?.gender || '');
    setJobTitle((editingLead as any)?.job_title || '');
    setSource(editingLead.source || '');
    setAssociate((editingLead as any)?.associate_details || '');
    setBuilding(
      (editingLead as any)?.building ||
        (editingLead as any)?.custom_building__location ||
        (editingLead as any)?.location ||
        ''
    );
    setLeadOwner((editingLead as any)?.lead_owner || (editingLead as any)?.owner || '');
    setStatus(editingLead.status || '');
    setLeadType((editingLead as any)?.lead_type || '');
    setRequestType((editingLead as any)?.request_type || '');
    setServiceType((editingLead as any)?.service_type || '');
    setNotesText(
      (editingLead as any)?.notes ||
        (editingLead as any)?.note ||
        (editingLead as any)?.remarks ||
        ''
    );
    setEmail(editingLead.email_id || '');
    setMobile((editingLead as any)?.mobile_no || '');
    setPhone(editingLead.phone || '');
    setWebsite((editingLead as any)?.website || '');
    setWhatsapp((editingLead as any)?.whatsapp || (editingLead as any)?.whatsapp_no || '');
    setOpenDropdown('');
  }, [editingLead]);

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

  const humanizeError = (raw?: string) => {
    if (!raw) return 'Failed to save lead.';
    const plain = raw.replace(/<[^>]+>/g, '');
    if (/Email Address must be unique/i.test(plain)) {
      return 'Email is already used on another lead. Please use a unique email or leave it blank.';
    }
    if (/MandatoryError/i.test(plain)) {
      return 'Please fill required fields (Full Name, Date, Status).';
    }
    return plain;
  };

  const resolveLeadOwnerValue = (input: string) => {
    if (!input) return undefined;
    const matchedOption = leadOwnerOptions.find((opt) =>
      typeof opt === 'string' ? opt === input : opt.value === input || opt.label === input
    );
    if (matchedOption && typeof matchedOption !== 'string') return matchedOption.value;
    const parenMatch = input.match(/\(([^)]+@[^)]+)\)/);
    if (parenMatch?.[1]) return parenMatch[1].trim();
    if (/[@.]/.test(input)) return input.trim();
    return undefined;
  };

  const handleSave = async () => {
    if (saving) return;
    const nameMissing = !fullName.trim();
    const dateMissing = !date;
    const statusMissing = !status.trim();
    const buildingMissing = !building.trim();
    if (isSimpleCreate) {
      const nextErrors = {
        date: dateMissing ? 'Date is required.' : '',
        name: nameMissing ? 'Full name is required.' : '',
        status: statusMissing ? 'Status is required.' : '',
        building: buildingMissing ? 'Building & Location is required.' : '',
      };
      const hasError = Object.values(nextErrors).some(Boolean);
      setSimpleErrors(nextErrors);
      if (hasError) return;
    } else {
      if (nameMissing) {
        Alert.alert('Lead', 'Please enter full name.');
        return;
      }
      if (dateMissing) {
        Alert.alert('Lead', 'Please select a date.');
        return;
      }
      if (statusMissing) {
        Alert.alert('Lead', 'Please select a status.');
        return;
      }
    }
    const buildingTrimmed = building.trim();
    setSaving(true);
    try {
      const leadOwnerValue = resolveLeadOwnerValue(leadOwner);
      const basePayload = {
        lead_name: fullName.trim(),
        company_name: organizationName.trim(),
        gender,
        status,
        source,
        building: buildingTrimmed,
        custom_building__location: buildingTrimmed,
        email_id: email,
        phone,
        mobile_no: mobile,
        date,
        custom_date: date,
      };
      const payload = isEditing
        ? {
            ...basePayload,
            gender,
            job_title: jobTitle,
            source,
            associate_details: associate,
            building: buildingTrimmed,
            lead_owner: leadOwnerValue,
            status,
            lead_type: leadType,
            request_type: requestType,
            service_type: serviceType,
            mobile_no: mobile,
            website,
            whatsapp,
            custom_building__location: buildingTrimmed,
          }
        : basePayload;
      console.log('LeadCreateScreen payload:', payload);
      const res = isEditing
        ? await updateLead({ name: editingLead?.name || '', ...payload })
        : await createLead(payload);
      console.log(isEditing ? 'Lead update response:' : 'Lead create response:', res);
      if (res.ok) {
        const updatedLead = {
          ...(editingLead || {}),
          ...(res.lead || {}),
          ...payload,
          name:
            res.name ||
            (res.lead as any)?.name ||
            (editingLead as any)?.name,
        };
        if (!isEditing && notesText.trim() && res.name) {
          const notesRes = await createLeadComment(res.name, notesText);
          if (!notesRes.ok) {
            console.log('Lead notes save failed:', notesRes.message);
          }
        }
        if (isEditing) {
          onLeadUpdated?.(updatedLead);
          Alert.alert('Lead', 'Lead updated successfully.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
          return;
        }
        Alert.alert('Lead', `Lead created${res.name ? `: ${res.name}` : ''}.`);
        // reset form
        setFullName('');
        setOrganizationName('');
        setDate('');
        setNotesText('');
        setGender('');
        setJobTitle('');
        setSource('');
        setAssociate('');
        setBuilding('');
        setLeadOwner('');
        setStatus('');
        setLeadType('');
        setRequestType('');
        setServiceType('');
        setEmail('');
        setMobile('');
        setPhone('');
        setWebsite('');
        setWhatsapp('');
        setAttachments([]);
        navigation.goBack();
      } else {
        Alert.alert('Lead', humanizeError(res.message));
      }
    } catch (err: any) {
      console.log('Lead save error:', err?.message || err);
      Alert.alert('Lead', humanizeError(err?.message));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (savingNotes) return;
    const trimmed = notesText.trim();
    if (!trimmed) {
      Alert.alert('Lead Notes', 'Please enter notes.');
      return;
    }
    if (!editingLead?.name) {
      Alert.alert('Lead Notes', 'Notes will be saved when you save the lead.');
      return;
    }
    setSavingNotes(true);
    try {
      const res = await createLeadComment(editingLead.name, trimmed);
      if (!res.ok) {
        Alert.alert('Lead Notes', res.message || 'Failed to save notes.');
        return;
      }
      Alert.alert('Lead Notes', 'Notes saved successfully.');
    } catch (err: any) {
      Alert.alert('Lead Notes', err?.message || 'Failed to save notes.');
    } finally {
      setSavingNotes(false);
    }
  };

  const renderDropdown = (
    label: string,
    value: string,
    setter: (v: string) => void,
    options?: OptionType[],
    loading?: boolean,
    error?: string
  ) => {
    const hasOptions = !!options?.length;
    const isOpen = openDropdown === label;
    const findLabel = () => {
      if (!options) return value;
      const match = options.find((opt) =>
        typeof opt === 'string' ? opt === value : opt.value === value
      );
      if (!match) return value;
      return typeof match === 'string' ? match : match.label;
    };
    const displayText = loading ? 'Loading...' : findLabel() || dropdownPlaceholder;

    const useCommonDropdown =
      label === 'Source' ||
      label === 'Building & Location' ||
      label === 'Associate Details' ||
      label === 'Lead Owner' ||
      label === 'Service Type';
    const isAssociateDropdown = label === 'Associate Details';
    const dropdownData: DropdownData[] = (options || []).map((opt) => ({
      id: typeof opt === 'string' ? opt : opt.value,
      label: typeof opt === 'string' ? opt : opt.label,
    }));

    if (useCommonDropdown) {
      return (
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>{label}</Text>
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => {
              if (loading) return;
              setOpenDropdown((prev) => (prev === label ? '' : label));
            }}
            activeOpacity={0.8}
          >
            <Text style={value ? styles.selectValue : styles.selectPlaceholder}>{displayText}</Text>
          </TouchableOpacity>
          {isOpen && (
            <View style={styles.dropdownListContainer}>
              <View style={styles.dropdownCommonList}>
                <CommonDropdown
                  data={dropdownData}
                  value={value ? { id: value, label: value } : null}
                  onSelect={(item) => {
                    const nextValue = label === 'Lead Owner' ? String(item.id) : String(item.label);
                    setter(nextValue);
                    setOpenDropdown('');
                  }}
                  onCreateNew={() => {
                    setNewOptionName('');
                    setNewOptionLabel(label);
                    setNewOptionSave(() => async (nextValue: string) => {
                      const nextTrimmed = nextValue.trim();
                      if (!nextTrimmed) return false;
                      if (label === 'Source') {
                        if (creatingSource) return false;
                        if (sourceOptions.includes(nextTrimmed)) {
                          setSource(nextTrimmed);
                          setOpenDropdown('');
                          return true;
                        }
                        setCreatingSource(true);
                        const res = await createLeadSource(nextTrimmed);
                        setCreatingSource(false);
                        if (!res.ok) {
                          Alert.alert('Lead Source', res.message);
                          return false;
                        }
                        setSourceOptions((prev) =>
                          prev.includes(nextTrimmed) ? prev : [...prev, nextTrimmed]
                        );
                        setSource(nextTrimmed);
                        setOpenDropdown('');
                        return true;
                      } else if (label === 'Building & Location') {
                        setBuildingOptions((prev) =>
                          prev.includes(nextTrimmed) ? prev : [...prev, nextTrimmed]
                        );
                        setBuilding(nextTrimmed);
                        setOpenDropdown('');
                        return true;
                      } else if (label === 'Associate Details') {
                        setAssociateOptions((prev) =>
                          prev.includes(nextTrimmed) ? prev : [...prev, nextTrimmed]
                        );
                        setAssociate(nextTrimmed);
                        setOpenDropdown('');
                        return true;
                      } else if (label === 'Lead Owner') {
                        setLeadOwnerOptions((prev) =>
                          prev.some((opt) =>
                            typeof opt === 'string'
                              ? opt === nextTrimmed
                              : opt.value === nextTrimmed
                          )
                            ? prev
                            : [...prev, nextTrimmed]
                        );
                        setLeadOwner(nextTrimmed);
                        setOpenDropdown('');
                        return true;
                      } else if (label === 'Service Type') {
                        setServiceTypeOptions((prev) =>
                          prev.includes(nextTrimmed) ? prev : [...prev, nextTrimmed]
                        );
                        setServiceType(nextTrimmed);
                        setOpenDropdown('');
                        return true;
                      }
                      setOpenDropdown('');
                      return true;
                    });
                    setNewOptionModalVisible(true);
                  }}
                  createLabel={`Create new ${label}`}
                  searchEnabled
                  searchPlaceholder={`Search ${label.toLowerCase()}`}
                  listMaxHeight={220}
                  nestedScrollEnabled
                  onLoadMore={isAssociateDropdown ? loadMoreAssociates : undefined}
                  loadingMore={isAssociateDropdown ? loadingMoreAssociates : false}
                  hasMore={isAssociateDropdown ? associateHasMore : false}
                />
              </View>
            </View>
          )}
          {loading && options && <Text style={styles.dropdownHint}>Loading options...</Text>}
          {!loading && options && !options.length && label !== 'Building & Location' && (
            <Text style={styles.dropdownHint}>No options available</Text>
          )}
          {renderError(error)}
        </View>
      );
    }

    return (
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          style={styles.selectBox}
          onPress={() => {
            if (loading) return;
            setOpenDropdown((prev) => (prev === label ? '' : label));
          }}
          activeOpacity={0.8}
        >
          <Text style={value ? styles.selectValue : styles.selectPlaceholder}>{displayText}</Text>
        </TouchableOpacity>
        {isOpen && hasOptions && (
          <View style={styles.dropdownListContainer}>
            <ScrollView style={styles.dropdownList} nestedScrollEnabled>
              {options?.map((opt) => {
                const key = typeof opt === 'string' ? opt : opt.value;
                const labelText = typeof opt === 'string' ? opt : opt.label;
                const valueText = typeof opt === 'string' ? opt : opt.value;
                return (
                  <TouchableOpacity
                    key={key}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setter(valueText);
                      setOpenDropdown('');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.dropdownItemText}>{labelText}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
        {loading && options && <Text style={styles.dropdownHint}>Loading options...</Text>}
        {!loading && options && !options.length && label !== 'Building & Location' && (
          <Text style={styles.dropdownHint}>No options available</Text>
        )}
        {renderError(error)}
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
    keyboardType: 'default' | 'email-address' | 'phone-pad' = 'default',
    error?: string
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
      {renderError(error)}
    </View>
  );

  const renderError = (msg?: string) =>
    msg ? <Text style={styles.errorText}>{msg}</Text> : null;

  const saveButtonLabel = saving
    ? isEditing
      ? 'Updating...'
      : 'Saving...'
    : isEditing
    ? 'Update Lead'
    : 'Create Lead';

  const isSimpleCreate = !isEditing;

  useEffect(() => {
    if (!isSimpleCreate) return;
    setSimpleErrors((prev) => {
      const next = {
        ...prev,
        date: prev.date && date ? '' : prev.date,
        name: prev.name && fullName.trim() ? '' : prev.name,
        building: prev.building && building.trim() ? '' : prev.building,
        status: prev.status && status.trim() ? '' : prev.status,
      };
      const changed = Object.keys(next).some(
        (key) => (next as any)[key] !== (prev as any)[key]
      );
      return changed ? next : prev;
    });
  }, [date, fullName, building, status, isSimpleCreate]);

  return (
    <View style={[styles.container, activeTab === 'notes' && styles.containerNotes]}>
      <Header
        pillText={isEditing ? 'Edit Lead' : 'New Lead'}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isSimpleCreate ? (
          <>
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
              {renderError(simpleErrors.date)}
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
            {renderInput(
              simpleLeadInputs[0].label,
              simpleLeadInputs[0].value,
              simpleLeadInputs[0].setter,
              simpleLeadInputs[0].placeholder,
              simpleLeadInputs[0].keyboardType || 'default',
              simpleErrors.name
            )}
            {renderGenderToggle()}
            {simpleLeadInputs.slice(1).map((input) =>
              renderInput(
                input.label,
                input.value,
                input.setter,
                input.placeholder,
                input.keyboardType || 'default'
              )
            )}
            {renderDropdown(
              'Status',
              status,
              setStatus,
              statusOptions,
              loadingStatuses,
              simpleErrors.status
            )}
            {renderDropdown(
              'Source',
              source,
              setSource,
              sourceOptions,
              loadingSources
            )}
            {renderDropdown(
              'Building & Location',
              building,
              setBuilding,
              rawBuildingOptions.length ? rawBuildingOptions : buildingOptions,
              loadingBuildings,
              simpleErrors.building
            )}
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                value={notesText}
                onChangeText={setNotesText}
                placeholder="Add notes"
                style={[styles.input, styles.notesInput]}
                multiline
                textAlignVertical="top"
              />
            </View>
          </>
        ) : (
          <>
            <View style={styles.progressRow}>
              <TouchableOpacity
                style={[styles.progressCard, activeTab === 'details' && styles.progressCardActive]}
                onPress={() => setActiveTab('details')}
                activeOpacity={0.85}
              >
                <Text style={styles.progressLabel}>Step 1</Text>
                <Text style={styles.progressTitle}>Lead basics</Text>
                <Text style={styles.progressSub}>Name, contact, source</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.progressCardMuted,
                  activeTab === 'notes' && styles.progressCardMutedActive,
                ]}
                onPress={() => setActiveTab('notes')}
                activeOpacity={0.85}
              >
                <Text style={[styles.progressLabel, { color: '#0F172A' }]}>Step 2</Text>
                <Text style={[styles.progressTitle, { color: '#0F172A' }]}>Notes & follow-ups</Text>
                <Text style={[styles.progressSub, { color: '#1F2937' }]}>
                  {notesText.trim() ? 'Edit notes' : 'Add notes'}
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'details' && (
              <>
                <View style={styles.sectionCard}>
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
                  {leadDetailInputs.map((input) =>
                    renderInput(
                      input.label,
                      input.value,
                      input.setter,
                      input.placeholder,
                      input.keyboardType || 'default'
                    )
                  )}
                  {renderGenderToggle()}
                  {leadDropdowns.map((dropdown) =>
                    renderDropdown(
                      dropdown.label,
                      dropdown.value,
                      dropdown.setter,
                      dropdown.options,
                      dropdown.loading
                    )
                  )}
                </View>

                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Contact Info</Text>
                  {contactInputs.map((input) =>
                    renderInput(
                      input.label,
                      input.value,
                      input.setter,
                      input.placeholder,
                      input.keyboardType || 'default'
                    )
                  )}
                </View>

                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Attachments (optional)</Text>
                  <View style={styles.fieldBlock}>
                    <Text style={styles.label}>Add Attachment</Text>
                    <View style={styles.attachmentBox}>
                      <View style={styles.attachmentRow}>
                        <Text style={styles.attachmentPrimary}>Tap to upload</Text>
                        <Text style={styles.attachmentSecondary}>JPG, PNG (multiple) or capture</Text>
                      </View>
                      <View style={styles.attachmentHint}>
                        <Text style={styles.attachmentHintText}>
                          Attach supporting photos (multiple allowed)
                        </Text>
                      </View>
                      <View style={styles.attachmentActions}>
                        <TouchableOpacity
                          style={styles.uploadButton}
                          onPress={pickImages}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.uploadText}>Upload from Gallery</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.captureButton}
                          onPress={captureImage}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.captureText}>Capture Photo</Text>
                        </TouchableOpacity>
                      </View>
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
                    </View>
                  </View>
                </View>
              </>
            )}

            {activeTab === 'notes' && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Notes & follow-ups</Text>
                <Text style={styles.label}>Lead notes</Text>
                <TextInput
                  value={notesText}
                  onChangeText={setNotesText}
                  placeholder="Add notes or follow-up details"
                  style={[styles.input, styles.notesInput]}
                  multiline
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={[styles.saveButton, savingNotes && styles.saveButtonDisabled]}
                  onPress={handleSaveNotes}
                  disabled={savingNotes}
                >
                  <Text style={styles.saveText}>{savingNotes ? 'Saving...' : 'Save Notes'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveText}>{saveButtonLabel}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={newOptionModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback
          onPress={() => {
            setNewOptionModalVisible(false);
            setOpenDropdown('');
          }}
        >
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Add new {newOptionLabel.toLowerCase()}</Text>
          <TextInput
            value={newOptionName}
            onChangeText={setNewOptionName}
            placeholder={`Enter ${newOptionLabel.toLowerCase()}`}
            style={styles.modalInput}
            autoFocus
          />
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancel]}
              onPress={() => {
                setNewOptionModalVisible(false);
                setOpenDropdown('');
              }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalSave]}
              onPress={async () => {
                const nextValue = newOptionName.trim();
                if (!nextValue || !newOptionSave) return;
                const ok = await newOptionSave(nextValue);
                if (!ok) return;
                setNewOptionModalVisible(false);
              }}
              disabled={creatingSource}
            >
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  containerNotes: { backgroundColor: '#FFFFFF' },
  content: { padding: 16, paddingBottom: 32 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  fieldBlock: { marginBottom: 12 },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  progressCard: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 12,
  },
  progressCardActive: {
    borderWidth: 1,
    borderColor: '#0F172A',
  },
  progressCardMuted: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  progressCardMutedActive: {
    borderColor: '#1D3765',
    backgroundColor: '#E5ECFF',
  },
  progressLabel: { fontSize: 12, fontWeight: '700', color: '#E5E7EB', letterSpacing: 0.5 },
  progressTitle: { fontSize: 15, fontWeight: '800', color: '#F8FAFC', marginTop: 6 },
  progressSub: { fontSize: 12, color: '#CBD5E1', marginTop: 2 },
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
  attachmentActions: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  uploadButton: {
    backgroundColor: '#E5ECFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  uploadText: {
    color: '#1D3765',
    fontSize: 12,
    fontWeight: '600',
  },
  captureButton: {
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
    backgroundColor: '#000000',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
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
  dropdownCommonList: {
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
  errorText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: '35%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  modalInput: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  notesInput: {
    height: 150,
    backgroundColor: '#F9FAFB',
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
    borderRadius: 8,
  },
  modalCancel: {
    backgroundColor: '#E5E7EB',
  },
  modalSave: {
    backgroundColor: '#000000',
  },
  modalCancelText: {
    color: '#111827',
    fontWeight: '600',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default LeadCreateScreen;
