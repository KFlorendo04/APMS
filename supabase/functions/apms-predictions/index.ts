import { createClient } from 'npm:@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type PredictionInput = {
  enrollment_id: string
  current_standing: number
  recent_scores: number[]
  attendance_rate: number
  missing_assessment_count: number
}

type GeminiPrediction = {
  enrollment_id: string
  predicted_standing: number
  risk_probability: number
  risk_level: 'low' | 'medium' | 'high'
  trend: 'improving' | 'stable' | 'declining'
  factors: string[]
}

type RequestBody = {
  class_id: string
  inputs: PredictionInput[]
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
})

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function readGeminiText(payload: any): string {
  return payload?.candidates?.[0]?.content?.parts
    ?.filter((part: any) => typeof part?.text === 'string')
    ?.map((part: any) => part.text)
    ?.join('') ?? ''
}

function parseJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '')
  return JSON.parse(cleaned)
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401)

  const geminiKey = Deno.env.get('GEMINI_API_KEY')
  if (!geminiKey) return json({ error: 'Gemini API key is not configured' }, 503)

  const token = authorization.slice('Bearer '.length)
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authorization } },
  })
  const { data: caller, error: callerError } = await userClient.auth.getUser(token)
  if (callerError || !caller.user) return json({ error: 'Invalid session' }, 401)

  let body: RequestBody
  try { body = await request.json() } catch { return json({ error: 'Invalid JSON body' }, 400) }
  if (!body.class_id || !Array.isArray(body.inputs) || body.inputs.length === 0) {
    return json({ error: 'class_id and at least one prediction input are required' }, 400)
  }
  if (body.inputs.length > 100) return json({ error: 'A maximum of 100 students can be predicted per request' }, 400)

  // RLS confirms that the signed-in faculty member can see this class.
  const { data: classRecord, error: classError } = await userClient
    .from('class_records')
    .select('id')
    .eq('id', body.class_id)
    .eq('status', 'active')
    .maybeSingle()
  if (classError || !classRecord) return json({ error: 'You do not have access to this class' }, 403)

  const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.5-flash-lite'
  const requestData = body.inputs.map((input) => ({
    current_standing: clamp(Number(input.current_standing), 0, 100),
    recent_scores: input.recent_scores.map((score) => clamp(Number(score), 0, 100)).slice(-10),
    attendance_rate: clamp(Number(input.attendance_rate), 0, 100),
    missing_assessment_count: Math.max(0, Math.floor(Number(input.missing_assessment_count))),
  }))
  const prompt = [
    'You are an academic early-warning assistant for APMS.',
    'Assess each anonymized student record using only the supplied numeric indicators.',
    'This is advisory decision support, not an official grade or disciplinary decision.',
    'Return exactly one result for each input, in the same order.',
    'predicted_standing is an estimated percentage from 0 to 100.',
    'risk_probability is a heuristic probability from 0 to 1, not a validated institutional probability.',
    'Use low risk below 0.40, medium risk from 0.40 to below 0.70, and high risk at 0.70 or above.',
    'Use trend improving, stable, or declining based on recent_scores.',
    'Factors must be short, concrete explanations grounded in the supplied indicators.',
    JSON.stringify(requestData),
  ].join('\n')

  const schema = {
    type: 'ARRAY',
    items: {
      type: 'OBJECT',
      properties: {
        predicted_standing: { type: 'NUMBER' },
        risk_probability: { type: 'NUMBER' },
        risk_level: { type: 'STRING', enum: ['low', 'medium', 'high'] },
        trend: { type: 'STRING', enum: ['improving', 'stable', 'declining'] },
        factors: { type: 'ARRAY', items: { type: 'STRING' } },
      },
      required: ['predicted_standing', 'risk_probability', 'risk_level', 'trend', 'factors'],
    },
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': geminiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: 'Return only valid JSON matching the requested schema.' }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    }),
  })
  if (!response.ok) {
    const detail = await response.text()
    console.error('Gemini request failed', response.status, detail.slice(0, 500))
    let providerMessage = `provider status ${response.status}`
    try {
      const parsed = JSON.parse(detail)
      providerMessage = parsed?.error?.message ?? providerMessage
    } catch { /* Keep the generic provider status when the body is not JSON. */ }
    return json({ error: `Gemini prediction request failed: ${providerMessage.slice(0, 300)}` }, 502)
  }

  let rawResults: any
  try { rawResults = parseJson(readGeminiText(await response.json())) } catch {
    return json({ error: 'Gemini returned an invalid prediction response' }, 502)
  }
  if (!Array.isArray(rawResults) || rawResults.length !== body.inputs.length) {
    return json({ error: 'Gemini returned an incomplete prediction response' }, 502)
  }

  const predictions: GeminiPrediction[] = rawResults.map((result: any, index: number) => ({
    enrollment_id: body.inputs[index].enrollment_id,
    predicted_standing: Number(clamp(Number(result.predicted_standing), 0, 100).toFixed(2)),
    risk_probability: Number(clamp(Number(result.risk_probability), 0, 1).toFixed(4)),
    risk_level: ['low', 'medium', 'high'].includes(result.risk_level) ? result.risk_level : 'medium',
    trend: ['improving', 'stable', 'declining'].includes(result.trend) ? result.trend : 'stable',
    factors: Array.isArray(result.factors) ? result.factors.filter((factor: unknown) => typeof factor === 'string').slice(0, 5) : [],
  }))

  return json({
    model_version: `${model}-gemini-llm-heuristic-v1`,
    data_basis: 'gemini_llm_heuristic',
    institutionally_validated: false,
    advisory_only: true,
    predictions,
  })
})
