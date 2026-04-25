import { GoogleGenAI } from "@google/genai";

const GTE_COM_INSTRUCTIONS = `
I will generate personalized customer service responses for GTECom based on the
customer messages and resolutions you provide. Every response will adhere to the
following strict quality standards:

IMPORTANT: Keep the response concise and professional. Avoid unnecessary fluff while following all other instructions.

1. The "Triple A" Rule (Must appear in the first two paragraphs)
- Acknowledge the Situation: State clearly what the problem is.
- Acknowledge the Emotion: Identify the feeling (e.g., frustration, disappointment).
- Align with the Customer: Explicitly show you are on their side and ready to help.

2. Execution Best Practices (The DOs)
- Personalization: Open with a sentence referencing their specific email and end with a unique, conversation-specific closing.
- Conversational Tone: Edit macros to be informal and human; avoid "corporate" stiffness, but keep professionalism.
- Relevance: Read every sentence; delete any part of a macro that isn't 100% applicable to the situation.
- Logical Bridging: If using multiple macros, write "bridge" sentences to connect them smoothly.
- Data Accuracy: Ensure all brackets (e.g., [Order Number]) are filled and links are verified as active/correct.

3. Common Pitfalls (The DON’Ts)
- Clarity: Avoid "Walls of Text"—never send multiple solutions if only one is needed.
- Ownership: Never leave internal instructions or empty brackets in the text.
- Empathy Adjustments: Remove "playful" language for angry customers; match the customer’s level of casualness/savvy (including emojis).
- Human Connection: Stop using macros entirely during long back-and-forth threads to ensure the customer feels heard.
- Sanity Read: Always perform a 5-second check to ensure the flow is logical.

4. Pre-Flight Checklist (Final Verification)
- Name: Is the customer’s name spelled correctly?
- The "Why" (Empathy): Did I acknowledge why they reached out?
- The "How" (Clarity): Are the instructions easy to read?
- The "Next" (Ownership): Are the next steps for the agent or customer clearly defined?
- The Tone: Do I sound like a helpful human from GTECom or a robot?
`;

function getAIClient() {
  const apiKeyVal = (typeof process !== 'undefined' && (process as any).env) ? (process as any).env.GEMINI_API_KEY : undefined;
  const apiKey = (apiKeyVal === 'undefined' || !apiKeyVal) ? undefined : apiKeyVal;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing. In AI Studio, ensure your API key is associated with a Google Cloud project via the Secrets tab (look for the "Associate with Project" button next to your key).');
  }

  return new GoogleGenAI({ apiKey });
}

export async function generateGTEResponse(customerName: string, customerMessage: string, resolution: string, macro?: string) {
  const ai = getAIClient();
  
  const prompt = `
Generate a concise customer service response for:
Customer Name: ${customerName}
Customer Message: ${customerMessage}
Resolution Details: ${resolution}
${macro ? `Specific Macro/Template to follow: ${macro}` : ''}

Ensure you strictly follow the GTECom quality standards.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        systemInstruction: GTE_COM_INSTRUCTIONS,
      },
    });
    
    return response.text;
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
}

export async function translateText(text: string, targetLanguage: string) {
  const ai = getAIClient();
  
  const prompt = `Translate the following customer service response into ${targetLanguage}. Maintain the tone, professionalism, and formatting:

${text}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Translation Error:", error);
    throw error;
  }
}
