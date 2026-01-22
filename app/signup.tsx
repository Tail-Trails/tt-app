import { useState } from 'react';

import React from 'react';
import { Text, View, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { webauthnRegisterOptions, webauthnRegisterVerify, base64UrlToBuffer, bufferToBase64Url } from '@/lib/api';
import { UserPlus } from 'lucide-react-native';
import colors from '@/constants/colors';

export default function SignupScreen() {
  const router = useRouter();
  const { requestRegistration, verifyRegistration } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [step, setStep] = useState<'info' | 'otp'>('info');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleRequestRegistration = async () => {
    if (!email || !name) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsLoading(true);
    try {
      await requestRegistration(email.trim().toLowerCase(), name.trim());
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setStep('otp');
    } catch (error: any) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      console.error('Request registration error:', error);
      Alert.alert('Error', error.message || 'Failed to request registration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyRegistration = async () => {
    if (!otpCode) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert('Error', 'Please enter the OTP code');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsLoading(true);
    try {
      await verifyRegistration(email.trim().toLowerCase(), otpCode);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.replace('/');
    } catch (error: any) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      console.error('Verify registration error:', error);
      Alert.alert('Error', error.message || 'Invalid OTP code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <UserPlus size={64} color="#5d6b4a" />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to start tracking your dog walks</Text>
        </View>

        <View style={styles.form}>
          {step === 'info' ? (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your Name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  editable={!isLoading}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleRequestRegistration}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send OTP</Text>
                )}
              </TouchableOpacity>

              {Platform.OS === 'web' && (
                <TouchableOpacity
                  style={[styles.button, { marginTop: 8, backgroundColor: '#3b82f6' }]}
                  onPress={async () => {
                    if (!email || !name) {
                      Alert.alert('Error', 'Please enter name and email to register a security key');
                      return;
                    }
                    try {
                      if (typeof window === 'undefined' || !(window as any).PublicKeyCredential) {
                        Alert.alert('WebAuthn not supported', 'This browser does not support WebAuthn');
                        return;
                      }
                      const opts: any = await webauthnRegisterOptions(email.trim().toLowerCase(), name.trim());
                      // Build publicKey object expected by navigator.credentials.create
                      const rpId = opts.rpId || opts.rp_id || opts.rp?.id;
                      const userIdStr = opts.userId || opts.user_id || opts.user?.id || String(Date.now());
                      const userName = opts.userName || opts.user_name || opts.user?.name || email.trim().toLowerCase();

                      const publicKey: any = {
                        challenge: base64UrlToBuffer(opts.challenge),
                        rp: {
                          id: rpId,
                          name: opts.rpName || opts.rp_name || opts.rp?.name || (typeof window !== 'undefined' ? window.location.hostname : 'Tail Trails'),
                        },
                        user: {
                          id: new TextEncoder().encode(userIdStr),
                          name: userName,
                          displayName: name.trim(),
                        },
                        pubKeyCredParams: opts.pubKeyCredParams || opts.pub_key_cred_params,
                        timeout: opts.timeout,
                      };

                      console.log('WebAuthn register publicKey:', publicKey);

                      // Convert excludeCredentials if present (accept multiple naming conventions)
                      const exclude = opts.excludeCredentials || opts.exclude_credentials || opts.exclude_credentials_list;
                      if (exclude && Array.isArray(exclude)) {
                        publicKey.excludeCredentials = exclude.map((c: any) => ({
                          id: base64UrlToBuffer(c.id),
                          type: c.type || 'public-key',
                        }));
                      }

                      const cred: any = await (navigator.credentials.create({ publicKey }) as Promise<Credential | null>);
                      if (!cred) {
                        Alert.alert('No credential created', 'The authenticator did not create a credential.');
                        return;
                      }
                      const attestation = cred as any;
                      const clientDataJSON = bufferToBase64Url(attestation.response.clientDataJSON);
                      const attestationObject = bufferToBase64Url(attestation.response.attestationObject);
                      const rawId = bufferToBase64Url(attestation.rawId);

                      // Send to backend to verify & store credential using new API shape
                      await webauthnRegisterVerify({
                        email: email.trim().toLowerCase(),
                        id: rawId,
                        rawId: rawId,
                        response: {
                          clientDataJSON: clientDataJSON,
                          attestationObject: attestationObject,
                        },
                        type: 'public-key',
                        nickname: `${name.trim()}'s key`,
                      });

                      Alert.alert('Success', 'Security key registered');
                    } catch (err: any) {
                      console.error('WebAuthn register error', err);
                      Alert.alert('WebAuthn Error', err?.message || String(err));
                    }
                  }}
                >
                  <Text style={styles.buttonText}>Register Security Key</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>OTP Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit code"
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!isLoading}
                />
                <Text style={styles.helperText}>Sent to {email}</Text>
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleVerifyRegistration}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify & Sign Up</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setStep('info')}
                disabled={isLoading}
              >
                <Text style={styles.secondaryButtonText}>Change Info</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push('/login');
            }}>
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
  color: colors.light.text,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
  color: colors.muted,
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
  color: colors.primary,
    marginBottom: 8,
  },
  input: {
  backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#a8ad8e',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1f0a',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#5d6b4a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  secondaryButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#5d6b4a',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#5d6b4a',
  },
});
