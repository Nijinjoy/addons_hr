import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Button from '../components/Button';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { validateLogin } from '../utils/validation/authValidation';
import { login as authLogin } from '../services/authService';
import { resolveEmployeeIdForUser } from '../services/leaves';
import { checkIn } from '../services/attendanceService';
const logo = require('../assets/images/logo/logo.png');

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
};

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = async () => {
    if (loading) return;
    setLoginError('');
    const errors = validateLogin(email, password);
    setEmailError(errors.email);
    setPasswordError(errors.password);
    if (errors.email || errors.password) return;

    try {
      setLoading(true);
      console.log('LoginScreen: attempting login with email', email);
      const response = await authLogin(email, password);
      console.log('LoginScreen response:', response);

      if (!response.ok) {
        const message = response.message || 'Unable to login. Please check your credentials and try again.';
        setLoginError(message);
        Alert.alert('Login Failed', message);
      } else {
        const cookies = response.cookies || {};
        const toStore: [string, string][] = [];
        if (cookies.sid) toStore.push(['sid', cookies.sid]);
        if (cookies.full_name) toStore.push(['full_name', cookies.full_name]);
        if (cookies.user_id) toStore.push(['user_id', decodeURIComponent(cookies.user_id)]);
        if (cookies.user_image) toStore.push(['user_image', cookies.user_image]);

        if (toStore.length) {
          try {
            await AsyncStorage.multiSet(toStore);
            console.log('Stored login cookies:', toStore.map(([k, v]) => ({ key: k, length: v.length })));
          } catch (storageError) {
            console.log('Error storing login cookies:', storageError);
          }
        }

        // Resolve and store the Employee ID linked to this user for downstream APIs
        try {
          const userKey = decodeURIComponent(cookies.user_id || email);
          const employeeId = await resolveEmployeeIdForUser(userKey);
          if (employeeId) {
            const employeePairs: [string, string][] = [
              ['employee_id', employeeId],
              [`employee_id_for_${encodeURIComponent(userKey)}`, employeeId],
            ];
            await AsyncStorage.multiSet(employeePairs);
            console.log('Stored employee id:', employeePairs);
          } else {
            console.log('No employee id resolved for user:', userKey);
          }
        } catch (err) {
          console.log('Failed to resolve employee id after login:', err);
        }

        // Attempt an immediate check-in log (for diagnostics) and store the response
        try {
          const employeeId = (await AsyncStorage.getItem('employee_id')) || '';
          if (employeeId) {
            const checkInRes = await checkIn(employeeId, 'IN');
            console.log('Login check-in response:', checkInRes);
            await AsyncStorage.setItem('last_checkin_response', JSON.stringify(checkInRes));
          } else {
            console.log('No employee id available for immediate check-in after login');
          }
        } catch (checkErr: any) {
          console.log('Immediate check-in after login failed:', checkErr?.message || checkErr);
        }

        // Reset to root dashboard after login
        navigation.getParent()?.reset({
          index: 0,
          routes: [{ name: 'Dashboard' as never }],
        });
      }
    } catch (error) {
      console.log('Login error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
                <Text style={styles.companyName}>ADDONS HR</Text>
                <Text style={styles.pageSubtitle}>Sign in to your account</Text>
              </View>

              <View style={styles.formContainer}>
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
                  onFocus={() => setEmailError('')}
                />
                {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordWrapper}>
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      placeholder="Enter your password"
                      placeholderTextColor="#888"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!passwordVisible}
                      onFocus={() => setPasswordError('')}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setPasswordVisible((prev) => !prev)}
                      accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
                    >
                      <Ionicons
                        name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                        size={22}
                        color="#1D2B4C"
                      />
                    </TouchableOpacity>
                </View>
                {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
              </View>

                <Button
                  title={loading ? 'Logging in...' : 'Login'}
                  onPress={handleLogin}
                  containerStyle={styles.loginButton}
                  disabled={loading}
                />
                {!!loginError && <Text style={styles.errorText}>{loginError}</Text>}

                <TouchableOpacity onPress={handleRegister} style={styles.registerContainer}>
                  <Text style={styles.registerText}>
                    Don't have an account? <Text style={styles.registerLink}>Register</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
    paddingBottom: 0,
  },
  header: {
    alignItems: 'center',
    paddingTop: 70,
    paddingHorizontal: 24,
    paddingBottom: 24,
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
  },
  logo: { width: 100, height: 100, borderRadius: 50 },
  companyName: { color: '#fff', fontSize: 26, fontWeight: '700', marginTop: 16 },
  pageSubtitle: { color: '#E5E7EB', fontSize: 16, fontWeight: '500', marginTop: 6 },

  formContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    width: '100%',
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
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: { marginTop: 16, backgroundColor: '#1D2B4C' },
  registerContainer: { marginTop: 12, alignItems: 'center' },
  registerText: { fontSize: 14, color: '#1D2B4C' },
  registerLink: { fontWeight: '700', color: '#6EC6FF' },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 6,
  },
});

export default LoginScreen;
