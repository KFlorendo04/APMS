import { createClient } from 'npm:@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type CoreRole = 'system_admin' | 'academic_admin' | 'faculty'
type RequestBody = {
  action: 'list' | 'create' | 'update'
  userId?: string
  email?: string
  password?: string
  firstName?: string
  lastName?: string
  role?: CoreRole
  status?: 'active' | 'inactive' | 'suspended'
  departmentId?: string
  employeeId?: string
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
})

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401)
  const token = authorization.slice('Bearer '.length)
  const url = Deno.env.get('SUPABASE_URL') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const userClient = createClient(url, anonKey, { auth: { persistSession: false } })
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

  const { data: callerData, error: callerError } = await userClient.auth.getUser(token)
  if (callerError || !callerData.user) return json({ error: 'Invalid session' }, 401)
  const callerId = callerData.user.id
  const { data: authorizationRow } = await admin
    .from('user_roles')
    .select('roles!inner(key),profiles!user_roles_user_id_fkey!inner(status)')
    .eq('user_id', callerId)
    .eq('roles.key', 'system_admin')
    .eq('profiles.status', 'active')
    .maybeSingle()
  if (!authorizationRow) return json({ error: 'System Admin permission required' }, 403)

  let body: RequestBody
  try { body = await request.json() } catch { return json({ error: 'Invalid JSON body' }, 400) }

  if (body.action === 'list') {
    const { data: authPage, error: authError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (authError) return json({ error: authError.message }, 500)
    const ids = authPage.users.map((user) => user.id)
    const { data: profiles, error: profileError } = await admin
      .from('profiles')
      .select('id,email,first_name,last_name,status,last_login_at,user_roles!user_roles_user_id_fkey(roles(key,name),scope_type,scope_id)')
      .in('id', ids)
    if (profileError) return json({ error: profileError.message }, 500)
    const authById = new Map(authPage.users.map((user) => [user.id, user]))
    return json({ users: (profiles ?? []).map((profile: any) => ({
      id: profile.id,
      email: profile.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      status: profile.status,
      lastLoginAt: profile.last_login_at ?? authById.get(profile.id)?.last_sign_in_at ?? null,
      role: profile.user_roles?.[0]?.roles?.key ?? null,
      roleName: profile.user_roles?.[0]?.roles?.name ?? null,
      scopeType: profile.user_roles?.[0]?.scope_type ?? null,
      scopeId: profile.user_roles?.[0]?.scope_id ?? null,
    })) })
  }

  const allowedRoles: CoreRole[] = ['system_admin', 'academic_admin', 'faculty']
  if (body.role && !allowedRoles.includes(body.role)) return json({ error: 'Invalid core role' }, 400)

  if (body.action === 'create') {
    if (!body.email || !body.password || !body.firstName || !body.lastName || !body.role) return json({ error: 'Email, temporary password, name, and role are required' }, 400)
    if (body.password.length < 12) return json({ error: 'Temporary password must contain at least 12 characters' }, 400)
    if (body.role !== 'system_admin' && !body.departmentId) return json({ error: 'Department scope is required for academic users' }, 400)
    if (body.role === 'faculty' && !body.employeeId) return json({ error: 'Faculty employee ID is required' }, 400)

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: body.email.trim().toLowerCase(), password: body.password, email_confirm: true,
      user_metadata: { first_name: body.firstName.trim(), last_name: body.lastName.trim() },
      app_metadata: { apms_role: body.role },
    })
    if (createError || !created.user) return json({ error: createError?.message ?? 'Account creation failed' }, 400)
    const userId = created.user.id
    try {
      const { error: profileError } = await admin.from('profiles').insert({ id: userId, email: body.email.trim().toLowerCase(), first_name: body.firstName.trim(), last_name: body.lastName.trim(), status: 'active' })
      if (profileError) throw profileError
      const { error: assignmentError } = await admin.rpc('admin_assign_user_role', {
        p_user_id: userId, p_role_key: body.role, p_department_id: body.departmentId ?? null,
        p_employee_id: body.employeeId ?? null, p_granted_by: callerId,
      })
      if (assignmentError) throw assignmentError
      await admin.from('audit_logs').insert({ actor_id: callerId, action: 'user.created', entity_type: 'profiles', entity_id: userId, after_data: { role: body.role, scope_id: body.departmentId ?? null } })
      return json({ userId })
    } catch (cause) {
      await admin.auth.admin.deleteUser(userId)
      return json({ error: cause instanceof Error ? cause.message : 'Account provisioning failed' }, 400)
    }
  }

  if (body.action === 'update') {
    if (!body.userId) return json({ error: 'User ID is required' }, 400)
    if (body.userId === callerId && body.status && body.status !== 'active') return json({ error: 'You cannot deactivate your own active System Admin session' }, 400)
    const updates: Record<string, unknown> = {}
    if (body.status) updates.status = body.status
    if (body.firstName) updates.first_name = body.firstName.trim()
    if (body.lastName) updates.last_name = body.lastName.trim()
    if (Object.keys(updates).length) {
      const { error } = await admin.from('profiles').update(updates).eq('id', body.userId)
      if (error) return json({ error: error.message }, 400)
    }
    if (body.role) {
      if (body.role !== 'system_admin' && !body.departmentId) return json({ error: 'Department scope is required' }, 400)
      const { error: assignmentError } = await admin.rpc('admin_assign_user_role', {
        p_user_id: body.userId, p_role_key: body.role, p_department_id: body.departmentId ?? null,
        p_employee_id: body.employeeId ?? null, p_granted_by: callerId,
      })
      if (assignmentError) return json({ error: assignmentError.message }, 400)
      await admin.auth.admin.updateUserById(body.userId, { app_metadata: { apms_role: body.role } })
    }
    if (body.password) {
      if (body.password.length < 12) return json({ error: 'Temporary password must contain at least 12 characters' }, 400)
      const { error } = await admin.auth.admin.updateUserById(body.userId, { password: body.password })
      if (error) return json({ error: error.message }, 400)
    }
    await admin.from('audit_logs').insert({ actor_id: callerId, action: 'user.updated', entity_type: 'profiles', entity_id: body.userId, after_data: { role: body.role, status: body.status } })
    return json({ userId: body.userId })
  }

  return json({ error: 'Unsupported action' }, 400)
})
