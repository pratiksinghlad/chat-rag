export class AIServiceError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'AIServiceError';
  }
}

export class AIConfigurationError extends AIServiceError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'AIConfigurationError';
  }
}

export class AIProviderError extends AIServiceError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'AIProviderError';
  }
}

export class VectorSearchError extends AIServiceError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'VectorSearchError';
  }
}
