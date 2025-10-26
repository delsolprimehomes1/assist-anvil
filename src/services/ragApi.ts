export interface RAGRequest {
  question: string;
  agent_email?: string;
  timestamp?: string;
}

export interface RAGResponse {
  answer: string;
  sources?: Array<{
    title: string;
    carrier?: string;
    section?: string;
  }>;
  confidence?: number;
}

export const sendRAGQuery = async (request: RAGRequest): Promise<RAGResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(
      'https://n8n2.a3innercircle.com/webhook/67a2bb5c-71e7-46f0-b350-9f5aeec61d99',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: request.question,
          agent_email: request.agent_email,
          timestamp: request.timestamp || new Date().toISOString(),
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('RATE_LIMIT');
      }
      throw new Error(`RAG API Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('TIMEOUT');
      }
      throw error;
    }
    throw new Error('Unknown error occurred');
  }
};
