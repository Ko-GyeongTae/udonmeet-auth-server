import jwt from 'jsonwebtoken';
import configs from '../configs';
import { AppDataSource } from '../loaders/typeorm';
import { User } from '../models/entity/user.entity';
import { CustomUserRepository } from '../models/repository/user.repository';
import { globalUser } from '../types';

// interface VerifiedObj {
//   id: string;
//   email: string;
//   name: string;
//   iat: number;
//   exp: number;
// }

export const createJWT = (
  payload: object,
  expiresIn: string,
  algorithm?: string,
): string => {
  const token = jwt.sign(
    payload,
    configs.jwtSecret,
    {
      expiresIn,
    },
    algorithm,
  );
  return token;
};

export const verifyJWT = async (token: string) => {
  const userRepository =
    AppDataSource.createQueryRunner().manager.withRepository(
      new CustomUserRepository(User, AppDataSource.manager),
    );
  let data: globalUser;
  try {
    data = jwt.verify(token, configs.jwtSecret);
  } catch (e: any) {
    return {
      success: false,
      message: e.message,
    };
  }

  const user = await userRepository.findOne({ where: { id: data.id } });
  if (!user) {
    return {
      success: false,
      message: 'User not found',
    };
  } else {
    return {
      success: true,
      data,
    };
  }
};
