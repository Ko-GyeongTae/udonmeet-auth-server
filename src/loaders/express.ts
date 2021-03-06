import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import router from '../routes';

export default async ({ app }: { app: express.Application }) => {
  app.get('/status', (_req, res) => {
    res.status(200).json({ isActive: true }).end();
  });
  app.enable('trust proxy');

  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );
  app.use(morgan('dev'));
  app.use(cookieParser());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  app.use('/', router);
  // ...미들웨어들
  app.use((_req, _res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  app.use((err, req, res, next) => {
    res
      .status(err.status || 500)
      .json({
        message: err.message,
      })
      .end();
    next();
  });
  // express app으로 return
  return app;
};
