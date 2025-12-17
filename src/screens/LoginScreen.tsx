import React, { useEffect, useState } from 'react';
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
import { validateLogin, validateCompanyUrl } from '../utils/validation/authValidation';
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
  const [companyUrl, setCompanyUrl] = useState('');
  const [companyUrlError, setCompanyUrlError] = useState('');
  const scrollRef = React.useRef<ScrollView | null>(null);
  const formOffsetY = React.useRef(0);
  const safeDecode = (value: string) => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  const handleLogin = async () => {
    if (loading) return;
    setLoginError('');
    setCompanyUrlError('');

    const urlError = validateCompanyUrl(companyUrl);
    if (urlError) {
      setCompanyUrlError(urlError);
      return;
    }

    try {
      await AsyncStorage.setItem('company_url', companyUrl.trim());
    } catch {
      // ignore storage errors
    }

    const errors = validateLogin(email, password);
    setEmailError(errors.email);
    setPasswordError(errors.password);
    if (errors.email || errors.password) return;

    try {
      setLoading(true);
      const response = await authLogin(email, password, companyUrl);
      if (!response.ok) {
        const message = response.message || 'Unable to login. Please check your credentials and try again.';
        setLoginError(message);
        Alert.alert('Login Failed', message);
        return;
      }

      const cookies = response.cookies || {};
      const toStore: [string, string][] = [];
      if (cookies.sid) toStore.push(['sid', cookies.sid]);
      if (cookies.full_name) toStore.push(['full_name', cookies.full_name]);
      if (cookies.user_id) toStore.push(['user_id', safeDecode(cookies.user_id)]);
      if (cookies.user_image) toStore.push(['user_image', cookies.user_image]);

      if (toStore.length) {
        try {
          await AsyncStorage.multiSet(toStore);
        } catch (storageError) {
          console.log('Error storing login cookies:', storageError);
        }
      }

      try {
        const userKey = safeDecode(cookies.user_id || email);
        const employeeId = await resolveEmployeeIdForUser(userKey);
        if (employeeId) {
          const employeePairs: [string, string][] = [
            ['employee_id', employeeId],
            [`employee_id_for_${encodeURIComponent(userKey)}`, employeeId],
          ];
          await AsyncStorage.multiSet(employeePairs);
        }
      } catch (err) {
        console.log('Failed to resolve employee id after login:', err);
      }

      try {
        const employeeId = (await AsyncStorage.getItem('employee_id')) || '';
        if (employeeId) {
          const checkInRes = await checkIn(employeeId, 'IN');
          await AsyncStorage.setItem('last_checkin_response', JSON.stringify(checkInRes));
        }
      } catch (checkErr: any) {
        console.log('Immediate check-in after login failed:', checkErr?.message || checkErr);
      }

      navigation.getParent()?.reset({
        index: 0,
        routes: [{ name: 'Dashboard' as never }],
      });
    } catch (error) {
      console.log('Login error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const scrollToForm = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: formOffsetY.current, animated: true });
    });
  };

  const scrollToTop = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  useEffect(() => {
    const hideSub = Keyboard.addListener('keyboardDidHide', scrollToTop);
    return () => hideSub.remove();
  }, []);

  return (
    <LinearGradient
      colors={['#141D35', '#1D2B4C', '#14223E']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.select({ ios: 64, android: 0 })}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            ref={scrollRef}
          >
            <View style={styles.content}>
              <View style={styles.header}>
                <View style={styles.logoWrapper}>
                  <Image source={logo} style={styles.logo} resizeMode="cover" />
                </View>
                <Text style={styles.companyName}>ADDON-S ERP</Text>
                <Text style={styles.pageSubtitle}>Sign in to your account</Text>
              </View>

              <View
                style={styles.formContainer}
                onLayout={(e) => {
                  formOffsetY.current = e.nativeEvent.layout.y;
                }}
              >
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Company URL</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="https://yourcompany.com"
                    placeholderTextColor="#888"
                    value={companyUrl}
                    onChangeText={setCompanyUrl}
                    autoCapitalize="none"
                    keyboardType="url"
                    onFocus={scrollToForm}
                    onBlur={scrollToTop}
                  />
                  {!!companyUrlError && <Text style={styles.errorText}>{companyUrlError}</Text>}
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
                  onFocus={() => {
                    setEmailError('');
                    scrollToForm();
                  }}
                  onBlur={scrollToTop}
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
                      onFocus={() => {
                        setPasswordError('');
                        scrollToForm();
                      }}
                      onBlur={scrollToTop}
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
    minHeight: '100%',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
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
  companyName: { color: '#fff', fontSize: 26, fontWeight: '700', marginTop: 8 },
  pageSubtitle: { color: '#E5E7EB', fontSize: 15, fontWeight: '500', marginTop: 4 },

  formContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    width: '100%',
    flexGrow: 0,
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
