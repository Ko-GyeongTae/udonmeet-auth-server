import { Request, Response, NextFunction } from 'express';
import { verifyJWT } from '../utils/jwt';

export const jwtMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.headers.authorization) {
    const accessToken = req.headers.authorization.split('Bearer ')[1];
    const accessResult = await verifyJWT(accessToken);

    const refreshToken: string = req.cookies['refreshToken'];
    const refreshResult = await verifyJWT(refreshToken);

    if (accessResult.success && refreshResult.success) {
      req.user = accessResult.data;
      next();
    } else {
      res.sendStatus(401).end();
      return;
    }
  } else {
    res.sendStatus(401).end();
    return;
  }
};
