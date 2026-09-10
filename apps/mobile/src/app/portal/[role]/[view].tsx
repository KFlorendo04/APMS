import { Redirect, useLocalSearchParams } from 'expo-router';

import { RouteGuard } from '@/auth/RouteGuard';
import { isRole, NAVIGATION, ROLE_HOME } from '@/config/navigation';
import { AppPortalScreen } from '@/screens/AppPortalScreen';

export default function RoleViewRoute() {
  const params = useLocalSearchParams<{ role?: string; view?: string }>();
  if (!isRole(params.role)) return <Redirect href="/" />;
  const view = typeof params.view === 'string' ? params.view : ROLE_HOME[params.role];
  if (!NAVIGATION[params.role].some((item) => item.key === view)) return <Redirect href={`/portal/${params.role}/${ROLE_HOME[params.role]}`} />;
  return <RouteGuard role={params.role}><AppPortalScreen role={params.role} screen={view} /></RouteGuard>;
}
