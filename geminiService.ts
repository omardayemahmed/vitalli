import { GoogleGenAI, Type } from "@google/genai";
import { TriageLevel, Vitals, Patient, Sex } from "./types.ts";

// Always use the API key directly from process.env.API_KEY as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Performs a high-precision clinical risk assessment based on 
 * Modified NEWS2 and Manchester Triage for Outpatient Clinics.
 */
export const getAITriage = async (complaint: string, vitals: Vitals) => {
  const model = 'gemini-3-flash-preview';
  
  const prompt = `You are a Deterministic Clinical Triage Logic Engine for an Outpatient Clinic.
Your task is to classify patients into three categories: RED, ORANGE, or GREEN based on the provided parameters.

INPUT DATA:
- Chief Complaint: "${complaint}"
- Heart Rate (HR): ${vitals.hr}
- Temperature (Temp): ${vitals.temp}
- Systolic Blood Pressure (SBP): ${vitals.bp.split('/')[0].trim()}

⚠️ CRITICAL CONSTRAINTS:
1. Only use HR, Temp, and SBP. Ignore Oxygen Saturation (SpO2) or Respiratory Rate if present.
2. Follow the "Single Worst Parameter" rule: if any one parameter is RED, the output is RED.
3. Manchester Triage symptoms override vital sign calculations.

DECISION LOGIC:

I. MODIFIED NEWS2 (VITALS)
🔴 RED (Emergency -> Refer to ER):
- HR: ≤40 OR ≥131 bpm
- SBP: ≤90 mmHg
- Temp: ≤35.0°C

🟠 INTERMEDIATE (Priority Outpatient):
- HR: 41–50 OR 111–130 bpm
- SBP: 91–100 OR ≥220 mmHg
- Temp: 35.1–36.0 OR 38.1–39.0 OR ≥39.1°C

🟢 GREEN (Stable):
- HR: 51–110 bpm
- SBP: 101–219 mmHg
- Temp: 36.1–38.0°C

II. MANCHESTER SYMPTOM OVERRIDE
🔴 RED (Manchester RED + ORANGE):
- Airway compromise, Respiratory distress, Unresponsive, Ongoing seizure, Massive hemorrhage, Anaphylaxis, Shock, GCS < 9.
- Central chest pain + red flags/hypotension, Palpitations + syncope.
- Severe SOB (cannot speak full sentences).
- New focal neuro deficit, sudden severe headache + neuro deficit.
- Severe pain (≥7/10).

🟠 INTERMEDIATE (Manchester YELLOW):
- Moderate pain (4–6/10), Persistent vomiting, Abdominal pain without peritonism, Fever without shock, Minor head injury with symptoms, Limb injury with neurovascular concern.

🟢 GREEN (Manchester GREEN + BLUE):
- Mild pain (1–3/10), Chronic complaints, Administrative visits, Stable symptoms.

III. OUTPUT RULES:
- If Level is RED, the justification MUST start with: "Immediate Emergency Department Referral Required."
- Be deterministic and clinically defensible.

TASK:
Return the Triage Level and a concise clinical justification.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature: 0, // Ensure deterministic output
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          level: { type: Type.STRING, enum: ['RED', 'ORANGE', 'GREEN'] },
          justification: { type: Type.STRING }
        },
        required: ['level', 'justification']
      }
    }
  });

  try {
    const jsonStr = response.text?.trim() || '{}';
    return JSON.parse(jsonStr);
  } catch (e) {
    return { level: 'GREEN', justification: 'System error: Using default stable classification.' };
  }
};

export const getScreeningQuestions = async (complaint: string, vitals: Vitals, age: number, sex: Sex) => {
  const model = 'gemini-3-flash-preview';
  const prompt = `Given the patient profile:
  - Age: ${age}
  - Biological Sex: ${sex}
  - Complaint: "${complaint}"
  - Vitals: (BP:${vitals.bp}, HR:${vitals.hr}, SpO2:${vitals.spo2})

  Generate 5 refined clinical screening questions to help narrow down the diagnosis or risk level. 
  
  CRITICAL RULES:
  1. Respect the patient's biological sex and age. Do NOT ask sex-specific questions that do not apply.
  2. Each question must be a single, focused inquiry.
  3. Keep questions professional, short, and direct.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ['questions']
      }
    }
  });

  try {
    const jsonStr = response.text?.trim() || '{"questions": []}';
    return JSON.parse(jsonStr).questions;
  } catch (e) {
    return ["Could not generate screening questions."];
  }
};

export const getPatientSummary = async (patient: Patient) => {
  const model = 'gemini-3-flash-preview';
  const screeningText = patient.screeningQuestions?.map(q => `Q: ${q.question} A: ${q.answer}`).join('\n') || 'None';
  
  const prompt = `Write a concise clinical narrative summary of this patient case for a doctor.
  Patient: ${patient.name}, ${patient.age}y ${patient.sex}. 
  Complaint: ${patient.chiefComplaint}
  Vitals: BP ${patient.vitals.bp}, HR ${patient.vitals.hr}, Temp ${patient.vitals.temp}, SpO2 ${patient.vitals.spo2}.
  Past Hx: ${patient.medicalHistory || 'None'}
  Meds: ${patient.medications || 'None'}
  Screening Results: ${screeningText}
  AI Triage Initial Justification: ${patient.aiJustification}
  
  Format the response as a professional paragraph summarizing the presentation and immediate concerns.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt
  });

  return response.text?.trim() || "Summary could not be generated.";
};