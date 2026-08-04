import { CrossBaseAccessError, AuthorizationError } from '../utils/errors.js';

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new AuthorizationError();
    }
    next();
  };
};


export const enforceBaseScope = (req, res, next) => {
  if (req.user.role === 'BASE_COMMANDER') {
    const userBaseId = req.user.baseId;
    if (req.method === 'GET') {
      if (req.query.baseId && Number.parseInt(req.query.baseId, 10) !== userBaseId) {
        throw new CrossBaseAccessError();
      }
      req.query.baseId = userBaseId;
    } else {
      if (req.body.baseId && Number.parseInt(req.body.baseId, 10) !== userBaseId) {
        throw new CrossBaseAccessError();
      }
      req.body.baseId = userBaseId;
    }
  }
  next();
};
