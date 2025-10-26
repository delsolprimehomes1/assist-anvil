export interface RAGRequest {
  question: string;
}

export interface RAGResponse {
  answer: string;
  sources?: string[];
}

export const sendRAGQuery = async (question: string): Promise<RAGResponse> => {
  const response = await fetch(
    'https://n8n2.a3innercircle.com/webhook/67a2bb5c-71e7-46f0-b350-9f5aeec61d99',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
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
