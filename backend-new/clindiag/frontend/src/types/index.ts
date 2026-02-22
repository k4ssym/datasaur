export interface ExtractedSymptoms {
  symptoms: string[];
  duration: string | null;
  severity: string | null;
  patient_info: string | null;
}

export interface ProtocolRef {
  title: string;
  source: string;
  icd_codes: string[];
  relevance_score: number;
}

export interface Timing {
  symptom_extraction_ms: number;
  rag_search_ms: number;
  diagnosis_ms: number;
  total_ms: number;
}

export interface PredictResponse {
  diagnosis: string;
  extracted_symptoms: ExtractedSymptoms;
  protocols_used: ProtocolRef[];
  timing: Timing;
}

export interface PredictRequest {
  anamnesis: string;
  top_k?: number;
}

export type AppState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: PredictResponse }
  | { status: "error"; message: string };
