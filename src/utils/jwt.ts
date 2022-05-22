import jwt from 'jsonwebtoken';
import configs from '../configs';
import { customUserRepository } from '../loaders/container';
import { User } from '../models/entity/user.entity';

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
  const userRepository = customUserRepository;
  let data;
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
    user.password = '';
    return {
      success: true,
      data: user,
    };
  }
};
