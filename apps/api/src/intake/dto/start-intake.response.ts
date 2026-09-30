export interface StartIntakeResponse {
  conversationId: string;
  sessionId: string;
  message: {
    role: 'assistant';
    content: string;
  };
}
