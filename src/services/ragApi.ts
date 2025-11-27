export interface RAGRequest {
  question: string;
  sessionId?: string;
}

export interface RAGResponse {
  output: string;
  sources?: string[];
}

export const sendRAGQuery = async (question: string, sessionId?: string): Promise<RAGResponse> => {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rag-query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, sessionId }),
    }
  );

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Too many requests. Please try again later.');
    }
    if (response.status === 500) {
      throw new Error('Server error. Please try again.');
    }
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
};
