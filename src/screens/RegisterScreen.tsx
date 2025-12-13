import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../components/Button';
const logo = require('../assets/images/logo/logo.png');

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
};

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const RegisterScreen = ({ navigation }: Props) => {
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [dob, setDob] = useState<Date | null>(null);
  const [doj, setDoj] = useState<Date | null>(null);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showDojPicker, setShowDojPicker] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState<CountryCode>('US');
  const [callingCode, setCallingCode] = useState('1');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatDate = (date: Date | null) =>
    date ? date.toLocaleDateString() : 'Select date';

  const handleRegister = async () => {
    if (loading) return;
    setLoading(true);
    // Placeholder: wire up API/register flow here
    setTimeout(() => {
      setLoading(false);
      navigation.goBack();
    }, 400);
  };

  return (
    <LinearGradient
      colors={['#141D35', '#1D2B4C', '#14223E']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.logoWrapper}>
                <Image source={logo} style={styles.logo} resizeMode="cover" />
              </View>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Tell us about you to get started</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#888"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.toggleGroup}>
                  {(['Male', 'Female', 'Other'] as const).map((option) => {
                    const isActive = gender === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[styles.toggleButton, isActive && styles.toggleButtonActive]}
                        onPress={() => setGender(option)}
                      >
                        <Text style={[styles.toggleText, isActive && styles.toggleTextActive]}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.rowItem]}>
                  <Text style={styles.label}>Date of Birth</Text>
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() => setShowDobPicker(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={dob ? styles.dateText : styles.placeholderText}>
                      {formatDate(dob)}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.inputGroup, styles.rowItem]}>
                  <Text style={styles.label}>Date of Joining</Text>
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() => setShowDojPicker(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={doj ? styles.dateText : styles.placeholderText}>
                      {formatDate(doj)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#888"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.phoneRow}>
                  <TouchableOpacity
                    style={styles.countryButton}
                    onPress={() => setShowCountryPicker(true)}
                    activeOpacity={0.8}
                  >
                    <CountryPicker
                      withFilter
                      withCallingCode
                      countryCode={countryCode}
                      onSelect={(country: Country) => {
                        setCountryCode(country.cca2 as CountryCode);
                        if (country.callingCode?.length) {
                          setCallingCode(country.callingCode[0]);
                        }
                        setShowCountryPicker(false);
                      }}
                      visible={showCountryPicker}
                      onClose={() => setShowCountryPicker(false)}
                      withFlag
                      withCallingCodeButton={false}
                    />
                    <Text style={styles.callingCodeText}>+{callingCode}</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.input, styles.phoneInput]}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#888"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <Button
                title={loading ? 'Registering...' : 'Register'}
                onPress={handleRegister}
                containerStyle={styles.registerButton}
                disabled={loading}
              />

              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                style={styles.loginLinkContainer}
              >
                <Text style={styles.loginLinkText}>
                  Already have an account? <Text style={styles.loginLink}>Login</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <DateTimePickerModal
        isVisible={showDobPicker}
        mode="date"
        display="spinner"
        date={dob || new Date()}
        onConfirm={(selectedDate) => {
          setDob(selectedDate);
          setShowDobPicker(false);
        }}
        onCancel={() => setShowDobPicker(false)}
        maximumDate={new Date()}
      />

      <DateTimePickerModal
        isVisible={showDojPicker}
        mode="date"
        display="spinner"
        date={doj || new Date()}
        onConfirm={(selectedDate) => {
          setDoj(selectedDate);
          setShowDojPicker(false);
        }}
        onCancel={() => setShowDojPicker(false)}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  logoWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#6EC6FF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  logo: { width: 100, height: 100, borderRadius: 50 },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: '#E5E7EB',
    fontSize: 16,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, color: '#1D2B4C', marginBottom: 6, fontWeight: '500' },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1D2B4C',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#1D2B4C',
  },
  toggleText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    color: '#1D2B4C',
  },
  placeholderText: {
    fontSize: 16,
    color: '#888',
  },
  registerButton: {
    marginTop: 8,
    backgroundColor: '#1D2B4C',
  },
  loginLinkContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    color: '#1D2B4C',
  },
  loginLink: {
    fontWeight: '700',
    color: '#6EC6FF',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    height: 48,
  },
  callingCodeText: {
    fontSize: 16,
    color: '#1D2B4C',
    marginLeft: 6,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
  },
});

export default RegisterScreen;
