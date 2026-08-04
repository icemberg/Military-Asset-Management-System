export class InsufficientInventoryError extends Error {
  constructor(message = "Insufficient inventory at source base") {
    super(message);
    this.name = 'InsufficientInventoryError';
  }
}

export class SameBaseTransferError extends Error {
  constructor(message = "Source and destination base cannot be the same") {
    super(message);
    this.name = 'SameBaseTransferError';
  }
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class CrossBaseAccessError extends Error {
  constructor(message = "Access Denied: Cross-base operations not allowed") {
    super(message);
    this.name = 'CrossBaseAccessError';
  }
}

export class DatabaseConnectionError extends Error {
  constructor(message = "Database connection failed") {
    super(message);
    this.name = 'DatabaseConnectionError';
  }
}

export class AuthorizationError extends Error {
  constructor(message = "Access Denied") {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message = "Invalid credentials") {
    super(message);
    this.name = 'AuthenticationError';
  }
}
