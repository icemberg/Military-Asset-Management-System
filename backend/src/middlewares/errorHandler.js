import { 
  InsufficientInventoryError, 
  SameBaseTransferError, 
  ValidationError, 
  CrossBaseAccessError,
  DatabaseConnectionError,
  AuthorizationError,
  AuthenticationError
} from '../utils/errors.js';

export const errorHandler = (err, req, res, next) => {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  if (err instanceof SyntaxError && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON payload' });
  }
  if (err instanceof InsufficientInventoryError) {
    return res.status(400).json({ error: err.message });
  }
  if (err instanceof SameBaseTransferError) {
    return res.status(400).json({ error: err.message });
  }
  if (err instanceof CrossBaseAccessError || err instanceof AuthorizationError) {
    return res.status(403).json({ error: err.message });
  }
  if (err instanceof AuthenticationError) {
    return res.status(401).json({ error: err.message });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError') {
    return res.status(401).json({ error: 'Invalid authentication token.' });
  }
  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A record with this value already exists.' });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({ error: 'Invalid reference: The related record does not exist.' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'The requested record could not be found.' });
    }
    if (err.code === 'P2034') {
      return res.status(409).json({ error: 'Transaction conflict, please try again.' });
    }
  }
  if (err.name === 'PrismaClientValidationError') {
    return res.status(400).json({ error: 'Invalid data provided.' });
  }
  if (err.name === 'PrismaClientInitializationError' || err instanceof DatabaseConnectionError) {
    return res.status(503).json({ error: 'Service temporarily unavailable. Please try again later.' });
  }

  console.error('[Unhandled Error]:', err);
  
  return res.status(500).json({ error: 'Internal server error.' });
};
