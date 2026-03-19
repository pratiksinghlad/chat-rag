export class ChatHistoryError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ChatHistoryError';
  }
}

export class ChatHistoryConfigurationError extends ChatHistoryError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ChatHistoryConfigurationError';
  }
}
