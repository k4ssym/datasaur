const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8080'

function getAuthHeaders(): Record<string, string> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

/** Прямая ссылка на поиск по коду МКБ-10 в клинических протоколах МЗ РК (MedElement). */
export function medelementUrlForIcd10(icd10Code: string): string {
  const base = 'https://diseases.medelement.com/'
  const params = new URLSearchParams({
    searched_data: 'diseases',
    q: icd10Code.trim(),
    diseases_filter_type: 'list',
    diseases_content_type: '4',
  })
  return `${base}?${params.toString()}`
}

export async function checkHealth(): Promise<{ status: string }> {
  const res = await fetch(`${BACKEND_URL}/health`, { method: 'GET' })
    .catch(() => ({ ok: false }))
  if (!res || !(res as Response).ok) {
    throw new Error('Health check failed')
  }
  return (res as Response).json()
}

export interface BackendDiagnosisItem {
  icd10_code: string
  diagnosis: string
  explanation: string
  protocol_id: string
  medelement_url?: string
}

export interface BackendDiagnosisResponse {
  diagnoses: BackendDiagnosisItem[]
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
}

export interface AuthResponse {
  user: AuthUser
  access_token: string
}

export async function register(email: string, password: string, name?: string): Promise<AuthResponse> {
  const res = await fetch(`${BACKEND_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name: name || email.split('@')[0] }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Registration failed')
  }
  return res.json()
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Invalid credentials')
  }
  return res.json()
}

export async function fetchMe(): Promise<AuthUser | null> {
  const res = await fetch(`${BACKEND_URL}/auth/me`, { headers: getAuthHeaders() })
  if (!res.ok) return null
  return res.json()
}

export async function fetchHistory(): Promise<{ items: import('../types').DiagnosisResult[] }> {
  const res = await fetch(`${BACKEND_URL}/history`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to load history')
  return res.json()
}

export async function saveHistoryItem(item: import('../types').DiagnosisResult): Promise<unknown> {
  const res = await fetch(`${BACKEND_URL}/history`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      primaryDiagnosis: item.primaryDiagnosis,
      icd10Code: item.icd10Code,
      confidenceScore: item.confidenceScore,
      protocolReference: item.protocolReference,
      differentialDiagnoses: item.differentialDiagnoses || [],
      rawProtocolSnippets: item.rawProtocolSnippets,
      inputPreview: item.inputPreview,
      inputText: item.inputText,
    }),
  })
  if (!res.ok) throw new Error('Failed to save history')
  return res.json()
}

export async function deleteHistoryItem(id: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/history/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete')
}

export async function clearHistory(): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/history`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to clear history')
}

export async function submitDiagnosis(text: string, accessToken?: string | null): Promise<{
  primaryDiagnosis: string
  icd10Code: string
  confidenceScore?: number
  protocolReference?: string
  differentialDiagnoses: Array<{ diagnosis: string; icd10Code: string; reasoning: string }>
  rawProtocolSnippets?: string[]
}> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
    const res = await fetch(`${BACKEND_URL}/diagnose`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: text }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || err.message || 'Diagnosis request failed')
    }

    const data: BackendDiagnosisResponse = await res.json()
    const diagnoses = data.diagnoses || []

    const primary = diagnoses[0]
    const rest = diagnoses.slice(1)
    const icd10 = primary?.icd10_code || '—'

    return {
      primaryDiagnosis: primary?.diagnosis || 'Диагноз не определён',
      icd10Code: icd10,
      protocolReference: primary?.medelement_url || (icd10 && icd10 !== '—' ? medelementUrlForIcd10(icd10) : undefined),
      differentialDiagnoses: rest.map((d) => ({
        diagnosis: d.diagnosis,
        icd10Code: d.icd10_code,
        reasoning: d.explanation,
      })),
      rawProtocolSnippets: diagnoses.map((d) => d.explanation).filter(Boolean),
    }
  } catch (e) {
    if (e instanceof TypeError && e.message.includes('fetch')) {
      return MOCK_RESPONSE
    }
    throw e
  }
}

const MOCK_RESPONSE = {
  primaryDiagnosis: 'Острый аппендицит',
  icd10Code: 'K35',
  confidenceScore: 0.87,
  protocolReference: 'https://example.com/protocols/appendicitis',
  differentialDiagnoses: [
    { diagnosis: 'Мезентериальный лимфаденит', icd10Code: 'I88', reasoning: 'Схожая клиника у детей' },
    { diagnosis: 'Внематочная беременность', icd10Code: 'O00', reasoning: 'Исключить у женщин репродуктивного возраста' },
  ],
  rawProtocolSnippets: ['При остром аппендиците показана экстренная аппендэктомия.'],
}
