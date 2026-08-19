import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

export async function analyzeComplaintText(description) {
  if (!ai) {
    return {
      suggestedCategory: "other",
      suggestedTitle: "Grievance",
      estimatedSeverity: "medium",
      aiAnalysis: "AI features require a GEMINI_API_KEY in secrets.",
    };
  }

  try {
    const prompt = `
      You are an AI civic assistant for CivicPulse.
      Analyze this citizen grievance description and extract:
      1. Suggested category. Must be strictly one of: "roads", "water", "power", "sanitation", "health", "other".
      2. Suggested refined title. Keep it short, professional, and clear.
      3. Estimated severity. Must be strictly one of: "low", "medium", "high".
      4. A brief, polite summary/analysis of the core issue.

      Grievance Description: "${description}"

      Return your response strictly in JSON format matching this schema:
      {
        "suggestedCategory": string,
        "suggestedTitle": string,
        "estimatedSeverity": string,
        "aiAnalysis": string
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const result = JSON.parse(text.trim());
    return {
      suggestedCategory: result.suggestedCategory || "other",
      suggestedTitle: result.suggestedTitle || "Grievance",
      estimatedSeverity: result.estimatedSeverity || "medium",
      aiAnalysis: result.aiAnalysis || "Analysis completed.",
    };
  } catch (err) {
    console.error("Gemini analysis error:", err);
    return {
      suggestedCategory: "other",
      suggestedTitle: "Grievance",
      estimatedSeverity: "medium",
      aiAnalysis: "Grievance analysis failed or timed out.",
    };
  }
}

export async function generateGovernanceRecommendations(departmentsData, totalComplaints, resolvedCount) {
  if (!ai) {
    return "AI Recommendations require a GEMINI_API_KEY in settings secrets.";
  }

  try {
    const prompt = `
      You are a senior local governance consultant analyzing metrics for a city's citizen grievance system (CivicPulse).
      
      System overview:
      - Total Grievances: ${totalComplaints}
      - Resolved Grievances: ${resolvedCount}
      - Resolution rate: ${totalComplaints > 0 ? ((resolvedCount / totalComplaints) * 100).toFixed(1) : 0}%
      
      Department-wise statistics:
      ${JSON.stringify(departmentsData, null, 2)}
      
      Please write a high-level, professional report for the city council containing:
      1. Key Bottlenecks: Which departments need the most attention based on governance scores, pending/escalated complaints, or slow resolution.
      2. 3 Actionable policy changes: Short-term interventions to raise SLA compliance.
      3. A summary of civic satisfaction and systemic issues.

      Keep the tone constructive, authoritative, and extremely professional. Use Markdown list items and clean headers.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    return response.text || "Failed to generate recommendations.";
  } catch (err) {
    console.error("Gemini recommendations error:", err);
    return "Failed to analyze metrics. Please check your network connection.";
  }
}
