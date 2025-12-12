import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Button from '../components/Button';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { login } from '../services/authService';
import { validateLogin } from '../utils/validation/authValidation';
const logo = require('../assets/images/logo/logo.png');

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
const [emailError, setEmailError] = useState('');
const [passwordError, setPasswordError] = useState('');

const handleLogin = async () => {
  // Reset previous errors
  setEmailError('');
  setPasswordError('');

  const errors = validateLogin(email, password);

  // Show inline errors if any
  if (errors.email || errors.password) {
    setEmailError(errors.email);
    setPasswordError(errors.password);
    return;
  }

  // Proceed with API login
  const result = await login(email, password);
  if (!result) {
    Alert.alert('Login failed. Try again.');
    return;
  }

  if (result.message && result.message.includes('Logged In')) {
    navigation.replace('Dashboard');
  } else {
    Alert.alert(result.message || 'Invalid email or password');
  }
};
  const handleRegister = () => {
    console.log('Navigate to Register Screen');
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
          <View style={styles.inner}>
            {/* Top Section */}
            <View style={styles.topSection}>
              <View style={styles.logoWrapper}>
                <Image source={logo} style={styles.logo} resizeMode="cover" />
              </View>
              <Text style={styles.companyName}>ADDONS HR</Text>
              <Text style={styles.pageSubtitle}>Sign in to your account</Text>
            </View>

            {/* Bottom White Wrapper */}
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
  />
  {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
</View>

<View style={styles.inputGroup}>
  <Text style={styles.label}>Password</Text>
  <TextInput
    style={styles.input}
    placeholder="Enter your password"
    placeholderTextColor="#888"
    value={password}
    onChangeText={setPassword}
    secureTextEntry
  />
  {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
</View>

              <Button title="Login" onPress={handleLogin} containerStyle={styles.loginButton} />

              <TouchableOpacity onPress={handleRegister} style={styles.registerContainer}>
                <Text style={styles.registerText}>
                  Don't have an account? <Text style={styles.registerLink}>Register</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'space-between' },

  topSection: {
    alignItems: 'center',
    paddingTop: 80,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#6EC6FF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: { width: 110, height: 110, borderRadius: 55 },
  companyName: { color: '#fff', fontSize: 24, fontWeight: '700', marginTop: 12 },
  pageSubtitle: { color: '#fff', fontSize: 16, fontWeight: '500', marginTop: 8 },

  formContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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
  loginButton: { marginTop: 16, backgroundColor: '#1D2B4C' },
  registerContainer: { marginTop: 12, alignItems: 'center' },
  registerText: { fontSize: 14, color: '#1D2B4C' },
  registerLink: { fontWeight: '700', color: '#6EC6FF' },
  errorText: {
  color: '#FF4D4F',
  fontSize: 12,
  marginTop: 4,
}
});

export default LoginScreen;

