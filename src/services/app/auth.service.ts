import {
  SignUpOTPRepository,
  PasswordRepository,
  PasswordResetOTPRepository,
  RolesRepository,
  SocialLoginRepository,
  UserRepository,
} from '../../repositories';
import { sendOTPEmail } from '../mail.service';
import { generateOTP } from '../../utils/generateOTP';
import { BadRequestError } from '../../errors/badRequest.error';
import { NotFoundError } from '../../errors/notFound.error';
import { addMinutes } from 'date-fns';
import {
  UserForgotPassword,
  UserLoginSchema,
  UserResetPassword,
  UserSignUp,
  VerifyOtpSchema,
} from '../../validators/app/user.auth.validation';
import { generateHashedPassword } from '../../utils/generateHashedPassword';
import { comparePassword } from '../../utils/comparePassword';
import { generateAccessToken, generateRefreshToken } from '../../utils/tokenUtils';
import jwt from 'jsonwebtoken';
import { validateAppleToken } from '../../utils/validateAppleToken';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export const register = async (signUpInput: UserSignUp) => {
  try {
    const email = signUpInput.email.toLowerCase();
    const phoneNumber = signUpInput.phoneNumber;

    const existingUser = await UserRepository.findOne({
      where: [{ email }, { phoneNumber }],
    });

    if (existingUser) {
      if (existingUser.isVerified === false) {
        const allOtps = await SignUpOTPRepository.find({
          where: {
            user: {
              id: existingUser.id,
            },
          },
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
          message: 'OTP sent Successfully',
        };
      }
      if (existingUser.email === email) {
        throw new BadRequestError('User with this email already exists');
      }
      if (existingUser.phoneNumber === phoneNumber) {
        throw new BadRequestError('User with this phone number already exists');
      }
    }

    const hashedPassword = await generateHashedPassword(signUpInput.password);
    const userRole = await RolesRepository.findOne({
      where: {
        name: 'user',
      },
    });
    if (!userRole) {
      throw new BadRequestError('user role not found');
    }

    const newUser = UserRepository.create(signUpInput);
    newUser.role = userRole;
    newUser.isVerified = false;
    const saveNewUser = await UserRepository.save(newUser);
    const savePassword = await PasswordRepository.save({
      user: newUser,
      password: hashedPassword,
    });

    const otp = '000000';
    await SignUpOTPRepository.save({
      user: saveNewUser,
      otp,
    });

    return {
      message: 'OTP sent Successfully',
    };
  } catch (error) {
    console.error('Error in register', { error, body: signUpInput }, 'AuthService');

    throw error;
  }
};

export const login = async (loginObject: UserLoginSchema) => {
  try {
    const { email, password, deviceId } = loginObject;
    const user = await UserRepository.findOne({
      where: {
        email: email.toLowerCase(),
      },
      relations: ['role', 'Password'],
    });
    if (!user) {
      throw new NotFoundError('user not found');
    }
    const userRole = await RolesRepository.findOne({
      where: {
        name: 'user',
      },
    });
    if (user.role.id != userRole.id) {
      throw new BadRequestError('user is not an app user');
    }
    const isPasswordMatch = await comparePassword(password, user.Password.password);
    if (!isPasswordMatch) {
      throw new BadRequestError('Invalid password');
    }
    if (user.isVerified === false) {
      const otp = '000000';
      const getSignUpOTPs = await SignUpOTPRepository.find({
        where: {
          user: {
            id: user.id,
          },
        },
      });
      const removeOtps = await SignUpOTPRepository.remove(getSignUpOTPs);
      const signUpOtp = SignUpOTPRepository.create({
        otp,
        user,
      });
      const saveOtp = await SignUpOTPRepository.save(signUpOtp);
      return {
        isVerified: false,
        message: 'OTP sent successfully',
      };
    }
    if (user.isDeleted) {
      throw new BadRequestError("This account has been deleted and cannot be accessed.");
    }
    if (user.isActive === false) {
      throw new BadRequestError("You're not allowed to login, Kindly contact the admin");
    }

    user.deviceId = deviceId;
    await UserRepository.save(user);
    const accessToken = generateAccessToken(user.id, user.role, user.isActive);
    const refreshToken = generateRefreshToken(user.id, user.role, user.isActive);
    const { Password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error(
      'Error in login',
      {
        error,
        loginObject,
      },
      'UserAuthService'
    );
    throw error;
  }
};

export const verifyOtp = async (verifyOtpObject: VerifyOtpSchema) => {
  try {
    const { email, otp } = verifyOtpObject;
    const user = await UserRepository.findOne({
      where: {
        email: email.toLowerCase(),
      },
      relations: ['role'],
    });
    if (!user) {
      throw new NotFoundError('user not found');
    }
    const userRole = await RolesRepository.findOne({
      where: {
        name: 'user',
      },
    });
    if (user.role.id != userRole.id) {
      throw new BadRequestError('user is not an app user');
    }
    const signUpOtp = await SignUpOTPRepository.findOne({
      where: {
        user: {
          id: user.id,
        },
        otp,
      },
    });
    if (!signUpOtp) {
      throw new BadRequestError('invalid otp');
    }
    user.isVerified = true;
    user.isActive = true;
    await UserRepository.save(user);
    const accessToken = generateAccessToken(user.id, user.role, user.isActive);
    const refreshToken = generateRefreshToken(user.id, user.role, user.isActive);
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture,
      phoneNumber: user.phoneNumber,
      deviceId: user.deviceId,
      isActive: user.isActive,
      role: user.role,
    };
    const getsignUpOtps = await SignUpOTPRepository.find({
      where: {
        user: {
          id: user.id,
        },
      },
    });
    const removeOtps = await SignUpOTPRepository.remove(getsignUpOtps);

    return {
      user: userResponse,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error(
      'Error in login',
      {
        error,
        verifyOtpObject,
      },
      'UserAuthService'
    );
    throw error;
  }
};

export const resendSignUpOtp = async (validationObject: UserForgotPassword) => {
  try {
    const email = validationObject.email;
    const user = await UserRepository.findOne({
      where: {
        email,
      },
      relations: ['role'],
    });
    if (!user) {
      throw new NotFoundError('user not found');
    }
    const userRole = await RolesRepository.findOne({
      where: {
        name: 'user',
      },
    });
    if (!userRole) {
      throw new NotFoundError('user role not found');
    }
    if (user.role.id != userRole.id) {
      throw new BadRequestError('user is not an App user');
    }
    const allOtps = await SignUpOTPRepository.find({
      where: {
        user: {
          id: user.id,
        },
      },
    });
    const removeOtps = await SignUpOTPRepository.remove(allOtps);

    //const otp = generateOTP(6)
    const otp = '000000';
    await SignUpOTPRepository.save({
      otp,
      user,
    });
    //const sendMail = await sendOTPEmail(email, otp, "Login")

    return {
      message: 'OTP generated and sent successfully',
    };
  } catch (error) {
    console.error(
      'Error in resendSignUpOtp',
      {
        error,
        validationObject,
      },
      'AuthService'
    );
    throw error;
  }
};

export const forgotPassword = async (validationObject: UserForgotPassword) => {
  try {
    const email = validationObject.email;
    const user = await UserRepository.findOne({
      where: {
        email,
      },
      relations: ['role'],
    });
    if (!user) {
      throw new NotFoundError('user not found');
    }
    const userRole = await RolesRepository.findOne({
      where: {
        name: 'user',
      },
    });
    if (!userRole) {
      throw new NotFoundError('user role not found');
    }
    if (user.role.id != userRole.id) {
      throw new BadRequestError('user is not an App user');
    }
    //const otp = generateOTP(6)
    const otp = '000000';
    await PasswordResetOTPRepository.save({
      otp,
      user,
      expiry: addMinutes(new Date(), 10),
    });
    //const sendMail = await sendOTPEmail(email, otp, "forgotPassword")
    return {
      message: 'OTP generated and sent successfully',
    };
  } catch (error) {
    console.error(
      'Error in forgotPassword',
      {
        error,
        validationObject,
      },
      'AuthService'
    );
    throw error;
  }
};

export const resendForgotPasswordOtp = async (validationObject: UserForgotPassword) => {
  try {
    const email = validationObject.email;
    const user = await UserRepository.findOne({
      where: {
        email,
      },
      relations: ['role'],
    });
    if (!user) {
      throw new NotFoundError('user not found');
    }
    const userRole = await RolesRepository.findOne({
      where: {
        name: 'user',
      },
    });
    if (!userRole) {
      throw new NotFoundError('user role not found');
    }
    if (user.role.id != userRole.id) {
      throw new BadRequestError('user is not an App user');
    }
    const allOtps = await PasswordResetOTPRepository.find({
      where: {
        user: {
          id: user.id,
        },
      },
    });
    const removeOtps = await PasswordResetOTPRepository.remove(allOtps);

    //const otp = generateOTP(6)
    const otp = '000000';
    await PasswordResetOTPRepository.save({
      otp,
      user,
      expiry: addMinutes(new Date(), 10),
    });
    //const sendMail = await sendOTPEmail(email, otp, "forgotPassword")

    return {
      message: 'OTP generated and sent successfully',
    };
  } catch (error) {
    console.error(
      'Error in resendForgotPasswordOtp',
      {
        error,
        validationObject,
      },
      'AuthService'
    );
    throw error;
  }
};

export const verifyForgotPasswordOtp = async (validationObject: VerifyOtpSchema) => {
  try {
    const { email, otp } = validationObject;
    const user = await UserRepository.findOne({
      where: {
        email: email.toLowerCase(),
      },
      relations: ['role'],
    });
    if (!user) {
      throw new NotFoundError('user not found');
    }
    const userRole = await RolesRepository.findOne({
      where: {
        name: 'user',
      },
    });
    if (!userRole) {
      throw new NotFoundError('user role not found');
    }
    if (user.role.id != userRole.id) {
      throw new BadRequestError('user is not an App user');
    }
    const otpRecord = await PasswordResetOTPRepository.findOne({
      where: {
        user: {
          id: user.id,
        },
      },
      order: {
        createdAt: 'DESC',
      },
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
    console.error(
      'Error in verifyForgotPasswordOtp',
      {
        error,
        validationObject,
      },
      'AuthService'
    );
    throw error;
  }
};

export const resetPassword = async (validationObject: UserResetPassword) => {
  try {
    const { email, otp, password } = validationObject;
    const user = await UserRepository.findOne({
      where: {
        email: email.toLowerCase(),
      },
      relations: ['role'],
    });
    if (!user) {
      throw new NotFoundError('user not found');
    }
    const userRole = await RolesRepository.findOne({
      where: {
        name: 'user',
      },
    });
    if (!userRole) {
      throw new NotFoundError('user role not found');
    }
    if (user.role.id != userRole.id) {
      throw new BadRequestError('user is not an App user');
    }
    const otpRecord = await PasswordResetOTPRepository.findOne({
      where: {
        user: {
          id: user.id,
        },
      },
      order: {
        createdAt: 'DESC',
      },
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
    if (otpRecord.isVerified !== true) {
      throw new BadRequestError('OTP not verified');
    }
    const hashedPassword = await generateHashedPassword(password);
    const userPassword = await PasswordRepository.findOne({
      where: { user: { id: user.id } },
    });
    if (!userPassword) {
      throw new NotFoundError('User password not found');
    }
    userPassword.password = hashedPassword;
    const updatePassword = await PasswordRepository.save(userPassword);
    if (!updatePassword) {
      throw new Error('password not updated');
    }
    await PasswordResetOTPRepository.delete(otpRecord.id);
    const allOtps = await PasswordResetOTPRepository.find({
      where: {
        user: {
          id: user.id,
        },
      },
    });
    const removeOtps = await PasswordResetOTPRepository.remove(allOtps);
    return {
      message: 'Password reset successfully',
    };
  } catch (error) {
    console.error(
      'Error in resetPassword',
      {
        error,
        validationObject,
      },
      'AuthService'
    );
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
      where: { id: decoded.id },
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

export const checkTokenDetails = async (accessToken: string) => {
  try {
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

export const socialLogin = async (deviceId: string, provider: string, token: string) => {
  try {
    let email: string = '';
    let name: string = '';
    let socialId: string = '';

    switch (provider) {
      case 'google':
        const googleResponse = await fetch(
          `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${token}`
        );
        if (googleResponse.status !== 200) throw new BadRequestError('invalid token');
        const googleUserData = await googleResponse.json();
        email = googleUserData.email as string;
        name = googleUserData.name as string;
        socialId = googleUserData.id as string;
        break;
      case 'facebook':
        const fbResponse = await fetch(`https://graph.facebook.com/me?fields=email,name,picture&access_token=${token}`);
        if (fbResponse.status !== 200) throw new BadRequestError('invalid token');
        const fbUserData = await fbResponse.json();
        email = fbUserData.email;
        name = fbUserData.name;
        socialId = fbUserData.id;
        break;
      case 'apple':
        const appleUserData = await validateAppleToken(token);
        if (!appleUserData) throw new BadRequestError('Invalid token');
        email = appleUserData.email;
        name = appleUserData.name;
        socialId = appleUserData.id;
        break;
      default:
        throw new BadRequestError('invalid provider');
    }
    let user = await UserRepository.findOne({
      where: {
        email,
      },
    });
    if (!user) {
      let nameArray: string[];
      let username: string;
      if (!name) {
        nameArray = email.split('@');
        username = nameArray[0];
      } else {
        username = name;
      }

      const newUser = UserRepository.create({
        email,
        firstName: username,
        role: 2,
        phoneNumber: '',
        isActive: true,
        deviceId: deviceId,
        isSocialLogin: true,
      });

      if (!newUser) throw new BadRequestError('failed to create user');
      await UserRepository.save(newUser);

      const result = await SocialLoginRepository.save({
        user: newUser,
        platform: provider,
        platformId: socialId,
        isVerified: true,
        isActive: true,
      });
      if (!result) throw new BadRequestError('failed to create user');
      const accessToken = generateAccessToken(newUser.id, newUser.role, newUser.isActive);
      const refreshToken = generateRefreshToken(newUser.id, newUser.role, newUser.isActive);
      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          profilePicture: newUser.profilePicture,
          phoneNumber: newUser.phoneNumber,
          deviceId: newUser.deviceId,
          isActive: newUser.isActive,
          role: newUser.role,
          createdAt: newUser.createdAt,
          updatedAt: newUser.updatedAt,
        },
        accessToken,
        refreshToken,
      };
    }
    if (user.isSocialLogin === false) {
      user.isSocialLogin = true;
      user.deviceId = deviceId;
      user.firstName = name;
      await UserRepository.save(user);
      const result = await SocialLoginRepository.save({
        user: user,
        platform: provider,
        platformId: socialId,
        isVerified: true,
        isActive: true,
      });
    }

    user.deviceId = deviceId;
    user.role = 2;
    await UserRepository.save(user);

    const socialLogin = await SocialLoginRepository.findOne({
      where: {
        platform: provider,
        platformId: socialId,
      },
      relations: ['user', 'user.role'],
    });
    if (!socialLogin) throw new BadRequestError('social login not found');
    const accessToken = generateAccessToken(socialLogin.user.id, socialLogin.user.role, socialLogin.user.isActive);
    const refreshToken = generateRefreshToken(socialLogin?.user.id, socialLogin.user.role, socialLogin.user.isActive);
    await SocialLoginRepository.save(socialLogin);
    if (socialLogin.user.role.id !== 2) throw new BadRequestError('user is not an app user');
    return {
      user: {
        id: socialLogin.user.id,
        email: socialLogin.user.email,
        firstName: socialLogin.user.firstName,
        lastName: socialLogin.user.lastName,
        profilePicture: socialLogin.user.profilePicture,
        phoneNumber: socialLogin.user.phoneNumber,
        deviceId: socialLogin.user.deviceId,
        isActive: socialLogin.user.isActive,
        role: socialLogin.user.role,
        createdAt: socialLogin.user.createdAt,
        updatedAt: socialLogin.user.updatedAt,
      },
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error(
      'Error in socialLoginService',
      {
        error,
        provider,
        token,
      },
      'AuthService'
    );
    throw error;
  }
};

export * as AuthService from './auth.service';
