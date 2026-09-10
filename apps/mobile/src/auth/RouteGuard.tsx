import type { Role } from '@apms/domain';
import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { PropsWithChildren } from 'react';

import { useAuth } from './AuthProvider';
import { colors } from '@/theme/tokens';

export function RouteGuard({ role, children }: PropsWithChildren<{ role: Role }>) {
  const { user, loading } = useAuth();
  if (loading) return <View style={styles.loading}><ActivityIndicator color={colors.brand} size="large" /></View>;
  if (!user) return <Redirect href="/" />;
  if (user.role !== role) return <Redirect href={`/portal/${user.role}/overview`} />;
  return children;
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas } });
