import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import Roles from './Role';
import PasswordResetOTP from './PasswordResetOTP';
import Restaurant from './Restaurant';
import SignUpOtp from './SignUpOtp';
import Password from './Password';
import SocialLogin from './SocialLogin';
import DeleteReason from './DeleteReason';
import DeletedUsers from './DeletedUsers';
import Slot from './Slots';
import OperationalHour from './OperationalHours';
import FavouriteRestaurant from './FavouriteRestaurant';
import PaymentMethods from './PaymentMethods';
import RestaurantPaymentMethods from './RestaurantPaymentMethods';

@Entity('Users')
export default class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  deviceId: string;

  @Column({ nullable: true })
  fullName: string;

  @Column({ nullable: true })
  userName: string;

  @Column()
  phoneNumber: string;

  @Column({ default: false })
  isActive: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ default: false })
  isSocialLogin: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @ManyToOne(() => Roles, (role: Roles) => role.users)
  role: Roles;

  @OneToOne(() => Password, password => password.user, { cascade: true })
  Password: Password;

  @OneToMany(() => PasswordResetOTP, (passwordResetOTP: PasswordResetOTP) => passwordResetOTP.user, { cascade: true })
  passwordResetOTPs: PasswordResetOTP[];

  @OneToMany(() => SignUpOtp, (signUpOtp: SignUpOtp) => signUpOtp.user, {
    cascade: true,
  })
  signUpOtps: SignUpOtp[];

  @OneToOne(() => DeletedUsers, (deletedUsers: DeletedUsers) => deletedUsers.user, { cascade: true })
  deletedUsers: DeletedUsers;

  @OneToOne(() => Restaurant, (restaurant: Restaurant) => restaurant.user, {
    cascade: true,
  })
  restaurant: Restaurant;

  @OneToOne(() => SocialLogin, socialLogin => socialLogin.user)
  socialLogin: SocialLogin;

  @OneToMany(() => OperationalHour, hour => hour.user, { cascade: true })
  operationalHours: OperationalHour[];

  @OneToMany(() => FavouriteRestaurant, favourite => favourite.user, { cascade: true })
  addFavourite: FavouriteRestaurant[];

  @OneToMany(() => FavouriteRestaurant, favourite => favourite.restaurant, { cascade: true })
  favouriteRestaurant: FavouriteRestaurant[];

  @OneToMany(() => RestaurantPaymentMethods, paymentMethods => paymentMethods.user, { cascade: true })
  paymentMethods: RestaurantPaymentMethods[];

  @CreateDateColumn({ type: 'timestamptz', default: () => 'NOW()' })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'NOW()',
    onUpdate: 'NOW()',
  })
  updatedAt: Date;
}
