import { Service } from 'typedi';
import crypto from 'crypto';
import { JwtDto, SignInDto, SignUpDto } from '../models/dto/user.dto';
import { User } from '../models/entity/user.entity';
import { CustomUserRepository } from '../models/repository/user.repository';
import { createJWT, verifyJWT } from '../utils/jwt';
import { CustomSessionRepository } from '../models/repository/session.repository';
import { Session } from '../models/entity/session.entity';
import { globalUser } from '../types';

@Service()
export class UserService {
  //private userRepository = customUserRepository;
  constructor(
    private userRepository: CustomUserRepository,
    private sessionRepository: CustomSessionRepository,
  ) {}

  signIn = async (body: SignInDto): Promise<JwtDto | null> => {
    const { email, password } = body;
    const user = await this.userRepository.findOneExistUserByEmail(email);
    if (!user) {
      return null;
    }

    const hash = crypto.createHash('sha512').update(password).digest('hex');

    if (user.password !== hash) {
      return null;
    }

    delete user.password;
    const payload = {
      ...user,
    };

    const jwtDto = new JwtDto();
    jwtDto.accessToken = createJWT(payload, '6h');
    jwtDto.refreshToken = createJWT({}, '14d', 'HS512');
    jwtDto.user = user;

    const session = new Session();
    session.userId = user.id;
    session.refreshToken = jwtDto.refreshToken;
    session.data = JSON.stringify(payload);

    await this.sessionRepository.insertSession(session);

    return jwtDto;
  };
  signUp = async (body: SignUpDto): Promise<User | null> => {
    const result = await this.userRepository.insertUserWithHashing(body);
    if (result) {
      return result;
    } else {
      return null;
    }
  };
  signOut = async (token: string): Promise<boolean> => {
    return await this.sessionRepository.deleteSessionByRefreshToken(token);
  };
  refresh = async (token: string): Promise<JwtDto | null> => {
    const refreshResult = await verifyJWT(token);
    if (!refreshResult.success) {
      return null;
    }

    const userData =
      await this.sessionRepository.findNewestSessionByRefreshToken(token);
    if (!userData) {
      return null;
    }

    await this.sessionRepository.deleteSessionByRefreshToken(token);

    const user = await this.userRepository.findOneExistUserById(
      userData.userId,
    );

    const payload = {
      id: user?.id,
      email: user?.email,
      name: user?.name,
    };

    const jwtDto = new JwtDto();
    jwtDto.accessToken = createJWT(payload, '6h');
    jwtDto.refreshToken = createJWT({}, '14d', 'HS512');

    const session = new Session();
    session.userId = userData?.userId;
    session.refreshToken = jwtDto.refreshToken;
    session.data = userData?.data;

    await this.sessionRepository.insertSession(session);
    return jwtDto;
  };
  withDrawal = async (payload: globalUser): Promise<boolean> => {
    return await this.userRepository.softDeleteUserById(payload.id);
  };
  tokenValidate = async (payload: JwtDto): Promise<boolean> => {
    const { accessToken, refreshToken } = payload;

    const accessResult = await verifyJWT(accessToken);
    const refreshResult = await verifyJWT(refreshToken);

    if (!(accessResult.success && refreshResult.success)) {
      return false;
    }
    const session =
      await this.sessionRepository.findNewestSessionByRefreshToken(
        refreshToken,
      );
    if (!session) {
      return false;
    }
    if (session.userId !== accessResult.data?.id) {
      return false;
    }
    return true;
  };
}
