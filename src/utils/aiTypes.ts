export type AISource = 'nano' | 'webllm' | 'cloud' | 'none';

export interface AIServiceResponse {
  success: boolean;
  text: string;
  source: AISource;
  model?: string;
}

export type AIProgressCallback = (chunk: string, fullText: string) => void;

export const CANCELLED: AIServiceResponse = {
  success: false,
  text: 'Request cancelled',
  source: 'none'
};
