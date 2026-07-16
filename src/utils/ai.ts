// Helper for on-device LanguageModel API & Cloud Gemini API fallback

export interface AIServiceResponse {
  success: boolean;
  text: string;
  source: 'nano' | 'cloud' | 'none';
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ai?: {
      languageModel?: {
        create: (options?: any) => Promise<any>;
        capabilities: () => Promise<any>;
      };
    };
  }
}

export const getCloudKey = (): string => {
  return localStorage.getItem('anki_gemini_api_key') || '';
};

export const setCloudKey = (key: string): void => {
  localStorage.setItem('anki_gemini_api_key', key);
};

export const checkOnDeviceSupport = async (): Promise<boolean> => {
  if (!window.ai || !window.ai.languageModel) return false;
  try {
    const caps = await window.ai.languageModel.capabilities();
    return caps.available !== 'no';
  } catch {
    return false;
  }
};

export const callAI = async (
  promptText: string,
  systemInstruction?: string
): Promise<AIServiceResponse> => {
  // 1. Try Chrome Built-in AI (Gemini Nano)
  if (window.ai?.languageModel) {
    try {
      const caps = await window.ai.languageModel.capabilities();
      if (caps.available !== 'no') {
        const session = await window.ai.languageModel.create({
          systemInstruction: systemInstruction || 'You are a helpful German Language Coach.'
        });
        const text = await session.prompt(promptText);
        session.destroy();
        return { success: true, text, source: 'nano' };
      }
    } catch (e) {
      console.warn('Chrome Built-in AI failed, falling back to Cloud API', e);
    }
  }

  // 2. Fallback to Cloud Gemini API
  const cloudKey = getCloudKey();
  if (!cloudKey) {
    return {
      success: false,
      text: 'No API key or Built-in AI support found.',
      source: 'none'
    };
  }

  try {
    const formattedPrompt = systemInstruction 
      ? `${systemInstruction}\n\nUser request: ${promptText}`
      : promptText;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${cloudKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: formattedPrompt }] }]
        })
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text) throw new Error('Empty response from Gemini API');

    return { success: true, text, source: 'cloud' };
  } catch (err: any) {
    console.error('Cloud Gemini API error:', err);
    return {
      success: false,
      text: `Error calling Gemini API: ${err.message || err}`,
      source: 'none'
    };
  }
};
