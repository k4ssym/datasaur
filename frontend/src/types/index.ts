export interface DiagnosisResult {
  id: string
  primaryDiagnosis: string
  icd10Code: string
  confidenceScore?: number
  protocolReference?: string
  differentialDiagnoses: DifferentialDiagnosis[]
  rawProtocolSnippets?: string[]
  timestamp: number
  inputPreview: string
  inputText?: string
}

export interface DifferentialDiagnosis {
  diagnosis: string
  icd10Code: string
  reasoning: string
}

export interface HealthStatus {
  status: 'online' | 'degraded' | 'offline'
  lastCheck: number
}

export type Theme = 'light' | 'dark' | 'system'
