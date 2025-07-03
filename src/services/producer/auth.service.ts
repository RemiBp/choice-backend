import {
  CuisineTypeRepository,
  SignUpOTPRepository,
  PasswordRepository,
  PasswordResetOTPRepository,
  RestaurantRepository,
  RolesRepository,
  SocialLoginRepository,
  UserRepository,
  BusinessProfileRepository,
  ProducerRepository,
} from '../../repositories';
import { sendOTPEmail } from '../mail.service';
import { generateOTP } from '../../utils/generateOTP';
import { BadRequestError } from '../../errors/badRequest.error';
import { NotFoundError } from '../../errors/notFound.error';
import { addMinutes } from 'date-fns';
import {
  CreateProducer,
  ForgotPassword,
  GetPresignedDocumentInput,
  LoginSchema,
  ResetPassword,
  SignUp,
  SubmitDocumentsInput,
  VerifyOtpSchema,
} from '../../validators/producer/auth.validation';
import { generateHashedPassword } from '../../utils/generateHashedPassword';
import { comparePassword } from '../../utils/comparePassword';
import { generateAccessToken, generateRefreshToken } from '../../utils/tokenUtils';
import jwt from 'jsonwebtoken';
import { validateAppleToken } from '../../utils/validateAppleToken';
import Restaurant from '../../models/Restaurant';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
import PostgresDataSource from '../../data-source';
import { access } from 'fs';
import { businessRoles } from '../../utils/businessRoles';
import { BusinessRole } from '../../enums/Producer.enum';
import { ProducerStatus } from '../../enums/producerStatus.enum';
import { getPresignedUploadUrl } from '../../utils/s3Service';
import s3Service from '../s3.service';
import { PreSignedURL } from '../../validators/producer/profile.validation';

export const createProducer = async (input: CreateProducer) => {
  const existing = await ProducerRepository.findOne({
    where: { placeId: input.placeId },
  });

  if (existing) {
    throw new BadRequestError('Producer with this Place ID already exists');
  }

  const producer = ProducerRepository.create({
    ...input,
    status: ProducerStatus.PENDING,
    isActive: true,
    isDeleted: false,
    user: null,
  });

  return await ProducerRepository.save(producer);
};

export const register = async (signUpInput: SignUp) => {
  const queryRunner = PostgresDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { email, password, businessName, role } = signUpInput;

    const existingUser = await queryRunner.manager.findOne(UserRepository.target, {
      where: { email: email.toLowerCase() },
    });

    if (existingUser && !existingUser.isVerified) {
      const allOtps = await SignUpOTPRepository.find({
        where: { user: { id: existingUser.id } },
      });
      if (allOtps.length > 0) {
        await SignUpOTPRepository.remove(allOtps);
      }
      const otp = '000000';
      await SignUpOTPRepository.save({
        user: existingUser,
        otp,
      });
      return {
        isVerified: false,
        message: 'OTP sent successfully',
      };
    }

    if (existingUser) throw new BadRequestError('Email already exists');

    const existingBusiness = await queryRunner.manager.findOne(BusinessProfileRepository.target, {
      where: { businessName },
    });

    if (existingBusiness) throw new BadRequestError('Business is already registered');

    const hashedPassword = await generateHashedPassword(password);

    const userRole = await queryRunner.manager.findOne(RolesRepository.target, {
      where: { name: role },
    });

    if (!userRole) throw new BadRequestError('Role not found');

    const newUser = UserRepository.create({
      email: email.toLowerCase(),
      role: userRole,
      isVerified: false,
    });

    const savedUser = await queryRunner.manager.save(UserRepository.target, newUser);

    await queryRunner.manager.save(PasswordRepository.target, {
      user: savedUser,
      password: hashedPassword,
    });

    const businessProfile = BusinessProfileRepository.create({
      businessName,
      user: savedUser,
    });

    await queryRunner.manager.save(BusinessProfileRepository.target, businessProfile);

    const producer = ProducerRepository.create({
      name: businessName,
      address: '',
      placeId: `${savedUser.id}`,
      type: role as BusinessRole,
      status: ProducerStatus.PENDING,
      isActive: true,
      isDeleted: false,
      user: savedUser,
    });

    await queryRunner.manager.save(ProducerRepository.target, producer);

    await queryRunner.commitTransaction();

    const otp = '000000';
    await SignUpOTPRepository.save({
      user: savedUser,
      otp,
    });

    return {
      message: 'OTP sent successfully',
    };
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error in business register:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
};

export const login = async (loginObject: LoginSchema) => {
  try {
    const { email, password, deviceId } = loginObject;
    const user = await UserRepository.findOne({
      where: { email: email.toLowerCase() },
      relations: ['role', 'Password', 'businessProfile'],
    });

    if (!user) throw new NotFoundError('User not found');

    if (!businessRoles.includes(user.role.name)) {
      throw new BadRequestError('User is not a business account');
    }

    const isPasswordMatch = await comparePassword(password, user.Password.password);
    if (!isPasswordMatch) throw new BadRequestError('Invalid password');

    if (!user.isVerified) {
      const existingOtps = await SignUpOTPRepository.find({ where: { user: { id: user.id } } });
      if (existingOtps.length > 0) {
        await SignUpOTPRepository.remove(existingOtps);
      }

      const otp = '000000';
      await SignUpOTPRepository.save({ user, otp });

      return {
        user,
        accessToken: null,
        refreshToken: null,
        isVerified: false,
      };
    }

    if (user.isDeleted) {
      throw new BadRequestError("You're not allowed to login, please contact the admin");
    }

    if (!user.isActive) {
      throw new BadRequestError("Your account is inactive, please contact the admin");
    }

    user.deviceId = deviceId;
    await UserRepository.save(user);

    delete user.Password;

    const accessToken = generateAccessToken(user.id, user.role, user.isActive);
    const refreshToken = generateRefreshToken(user.id, user.role, user.isActive);

    return {
      user,
      isVerified: true,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error('Error in login', { error, loginObject }, 'AuthService');
    throw error;
  }
};

export const verifyOtp = async (verifyOtpObject: VerifyOtpSchema) => {
  try {
    const { email, otp } = verifyOtpObject;
    const user = await UserRepository.findOne({
      where: { email: email.toLowerCase() },
      relations: ['role', 'businessProfile'],
    });

    if (!user) throw new NotFoundError('User not found');

    if (!businessRoles.includes(user.role.name)) {
      throw new BadRequestError('User is not a business account');
    }

    const signUpOtp = await SignUpOTPRepository.findOne({
      where: { user: { id: user.id }, otp },
    });

    if (!signUpOtp) throw new BadRequestError('Invalid OTP');

    user.isActive = true;
    user.isVerified = true;
    await UserRepository.save(user);

    const getSignUpOTPs = await SignUpOTPRepository.find({
      where: { user: { id: user.id } },
    });
    await SignUpOTPRepository.remove(getSignUpOTPs);

    const accessToken = generateAccessToken(user.id, user.role, user.isActive);
    const refreshToken = generateRefreshToken(user.id, user.role, user.isActive);

    const userResponse = {
      id: user.id,
      email: user.email,
      isActive: user.isActive,
      role: user.role,
      businessProfile: user.businessProfile || null,
    };

    return {
      user: userResponse,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error('Error in verifyOtp', { error, verifyOtpObject }, 'AuthService');
    throw error;
  }
};

export const getPreSignedUrl = async (userId: number, getPreSignedURLObject: PreSignedURL) => {
  try {
    const { fileName, contentType, folderName } = getPreSignedURLObject;
    const user = await UserRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const { url, keyName } = await s3Service.getPresignedUploadUrl(fileName, contentType, true, folderName);
    return { url, keyName };
  } catch (error) {
    throw error;
  }
};

export const submitDocument = async (userId: number, input: SubmitDocumentsInput) => {
  const user = await UserRepository.findOne({
    where: { id: userId },
    relations: ['producer'],
  });

  if (!user || !user.producer) {
    throw new NotFoundError('Producer not found for this user');
  }

  const producer = user.producer;

  producer.document1 = input.document1;
  producer.document1Expiry = input.document1Expiry;
  producer.document2 = input.document2;
  producer.document2Expiry = input.document2Expiry;

  await ProducerRepository.save(producer);
};

export const resendSignUpOtp = async (validationObject: ForgotPassword) => {
  try {
    const email = validationObject.email.toLowerCase();

    const user = await UserRepository.findOne({
      where: { email },
      relations: ['role'],
    });

    if (!user) throw new NotFoundError('User not found');

    if (!businessRoles.includes(user.role.name)) {
      throw new BadRequestError('User is not a business account');
    }

    const allOtps = await SignUpOTPRepository.find({
      where: { user: { id: user.id } },
    });

    if (allOtps.length > 0) {
      await SignUpOTPRepository.remove(allOtps);
    }

    const otp = '000000';
    await SignUpOTPRepository.save({
      otp,
      user,
    });

    return {
      message: 'OTP generated and sent successfully',
    };
  } catch (error) {
    console.error('Error in resendSignUpOtp', { error, validationObject }, 'AuthService');
    throw error;
  }
};

export const forgotPassword = async (validationObject: ForgotPassword) => {
  try {
    const email = validationObject.email.toLowerCase();

    const user = await UserRepository.findOne({
      where: { email },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!businessRoles.includes(user.role.name)) {
      throw new BadRequestError('User is not a business account');
    }

    const existingOtps = await PasswordResetOTPRepository.find({
      where: { user: { id: user.id } },
    });
    if (existingOtps.length > 0) {
      await PasswordResetOTPRepository.remove(existingOtps);
    }

    const otp = '000000';
    await PasswordResetOTPRepository.save({
      otp,
      user,
      expiry: addMinutes(new Date(), 10),
    });

    return {
      message: 'OTP generated and sent successfully',
    };
  } catch (error) {
    console.error('Error in forgotPassword', { error, validationObject }, 'AuthService');
    throw error;
  }
};

export const resendForgotPasswordOtp = async (validationObject: ForgotPassword) => {
  try {
    const email = validationObject.email.toLowerCase();

    const user = await UserRepository.findOne({
      where: { email },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!businessRoles.includes(user.role.name)) {
      throw new BadRequestError('User is not a business account');
    }

    const existingOtps = await PasswordResetOTPRepository.find({
      where: { user: { id: user.id } },
    });
    if (existingOtps.length > 0) {
      await PasswordResetOTPRepository.remove(existingOtps);
    }

    const otp = '000000';
    await PasswordResetOTPRepository.save({
      otp,
      user,
      expiry: addMinutes(new Date(), 10),
    });

    return {
      message: 'OTP generated and sent successfully',
    };
  } catch (error) {
    console.error('Error in resendForgotPasswordOtp', { error, validationObject }, 'AuthService');
    throw error;
  }
};

export const verifyForgotPasswordOtp = async (validationObject: VerifyOtpSchema) => {
  try {
    const { email, otp } = validationObject;

    const user = await UserRepository.findOne({
      where: { email: email.toLowerCase() },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!businessRoles.includes(user.role.name)) {
      throw new BadRequestError('User is not a business account');
    }

    const otpRecord = await PasswordResetOTPRepository.findOne({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
    });

    if (!otpRecord) {
      throw new NotFoundError('OTP not found');
    }

    if (otpRecord.otp !== otp) {
      throw new BadRequestError('Invalid OTP');
    }

    if (otpRecord.expiry < new Date()) {
      throw new BadRequestError('OTP expired');
    }

    otpRecord.isVerified = true;
    await PasswordResetOTPRepository.save(otpRecord);

    return {
      message: 'Forgot Password OTP verified successfully',
    };
  } catch (error) {
    console.error('Error in verifyForgotPasswordOtp', { error, validationObject }, 'AuthService');
    throw error;
  }
};

export const resetPassword = async (validationObject: ResetPassword) => {
  try {
    const { email, otp, password } = validationObject;

    const user = await UserRepository.findOne({
      where: { email: email.toLowerCase() },
      relations: ['role'],
    });

    if (!user) throw new NotFoundError('User not found');

    if (!businessRoles.includes(user.role.name)) {
      throw new BadRequestError('User is not a business account');
    }

    const otpRecord = await PasswordResetOTPRepository.findOne({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
    });

    if (!otpRecord) throw new NotFoundError('OTP not found');
    if (otpRecord.otp !== otp) throw new BadRequestError('Invalid OTP');
    if (otpRecord.expiry < new Date()) throw new BadRequestError('OTP expired');
    if (otpRecord.isVerified !== true) throw new BadRequestError('OTP not verified');

    const hashedPassword = await generateHashedPassword(password);
    const userPassword = await PasswordRepository.findOne({
      where: { user: { id: user.id } },
    });

    if (!userPassword) throw new NotFoundError('User password not found');

    userPassword.password = hashedPassword;

    const updatePassword = await PasswordRepository.save(userPassword);
    if (!updatePassword) throw new Error('Password not updated');

    await PasswordResetOTPRepository.delete(otpRecord.id);
    const allOtps = await PasswordResetOTPRepository.find({
      where: { user: { id: user.id } },
    });
    await PasswordResetOTPRepository.remove(allOtps);

    return {
      message: 'Password reset successfully',
    };
  } catch (error) {
    console.error('Error in resetPassword', { error, validationObject }, 'AuthService');
    throw error;
  }
};

export const refreshAccessToken = async (refreshToken: string) => {
  try {
    if (!refreshToken) {
      throw new BadRequestError('Refresh token is required');
    }
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;
    const user = await UserRepository.findOne({
      where: { id: decoded.userId },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }
    if (!user.isActive) {
      throw new BadRequestError('User is inactive');
    }
    const accessToken = generateAccessToken(user.id, user.role, user.isActive);
    const newRefreshToken = generateRefreshToken(user.id, user.role, user.isActive);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    console.error('Error in refresh token API', error);
    throw new BadRequestError('Invalid or expired refresh token');
  }
};

export const socialLogin = async (deviceId: string, provider: string, token: string, roleName: string) => {
  try {
    let email = '';
    let name = '';
    let socialId = '';

    switch (provider) {
      case 'google': {
        const res = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${token}`);
        if (!res.ok) throw new BadRequestError('Invalid Google token');
        const data = await res.json();
        email = data.email;
        name = data.name;
        socialId = data.id;
        break;
      }
      case 'facebook': {
        const res = await fetch(`https://graph.facebook.com/me?fields=email,name&access_token=${token}`);
        if (!res.ok) throw new BadRequestError('Invalid Facebook token');
        const data = await res.json();
        email = data.email;
        name = data.name;
        socialId = data.id;
        break;
      }
      case 'apple': {
        const data = await validateAppleToken(token);
        if (!data) throw new BadRequestError('Invalid Apple token');
        email = data.email;
        name = data.name;
        socialId = data.id;
        break;
      }
      default:
        throw new BadRequestError('Invalid provider');
    }

    if (!email || !socialId) throw new BadRequestError('Incomplete social data');
    email = email.toLowerCase();

    const role = await RolesRepository.findOne({ where: { name: roleName } });
    if (!role) throw new BadRequestError('Invalid role provided');

    let user = await UserRepository.findOne({ where: { email }, relations: ['role'] });

    if (!user) {
      const newUser = UserRepository.create({
        email,
        firstName: name || email.split('@')[0],
        role,
        phoneNumber: '',
        isActive: true,
        deviceId,
        isSocialLogin: true,
      });

      user = await UserRepository.save(newUser);

      await SocialLoginRepository.save({
        user,
        platform: provider,
        platformId: socialId,
        isVerified: true,
        isActive: true,
      });
    } else {
      user.isSocialLogin = true;
      user.deviceId = deviceId;

      // Only update role if it's a social login and different than current role
      if (user.role.name !== roleName && user.isSocialLogin) {
        user.role = role;
      }

      await UserRepository.save(user);

      const existingSocialLogin = await SocialLoginRepository.findOne({
        where: { user: { id: user.id }, platform: provider, platformId: socialId },
      });

      if (!existingSocialLogin) {
        await SocialLoginRepository.save({
          user,
          platform: provider,
          platformId: socialId,
          isVerified: true,
          isActive: true,
        });
      }
    }

    const accessToken = generateAccessToken(user.id, user.role, user.isActive);
    const refreshToken = generateRefreshToken(user.id, user.role, user.isActive);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        phoneNumber: user.phoneNumber,
        address: user.address,
        deviceId: user.deviceId,
        isActive: user.isActive,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error('Error in socialLoginService', { error, provider, token });
    throw error;
  }
};

export const checkTokenDetails = async (accessToken: string) => {
  try {
    if (!accessToken) {
      throw new BadRequestError('Access token is required');
    }
    const decoded = jwt.decode(accessToken) as any;

    if (!decoded) {
      throw new Error('Invalid token');
    }
    const issuedAt = new Date(decoded.iat * 1000);
    const expiration = new Date(decoded.exp * 1000);
    const currentTime = new Date();
    const remainingTime = Math.max(0, expiration.getTime() - currentTime.getTime());

    return {
      issuedAt,
      expiration,
      remainingTime: `${Math.floor(remainingTime / 1000)} seconds`,
    };
  } catch (error) {
    console.error('Error decoding access token', error);
    throw new Error('Failed to decode token');
  }
};

export const getCuisineTypes = async (page: number, limit: number) => {
  const [cuisineTypes, count] = await CuisineTypeRepository.findAndCount({
    where: {
      isActive: true,
      isDeleted: false,
    },
    skip: (page - 1) * limit,
    take: limit,
  });
  if (!cuisineTypes || count === 0) {
    throw new BadRequestError('Cuisine types not found');
  }
  return {
    cuisineTypes,
    count,
    currentPage: page,
    totalPage: Math.ceil(count / limit),
  };
};

export * as AuthService from './auth.service';
