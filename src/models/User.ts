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
import BusinessProfile from './BusinessProfile';
import Producer from './Producer';
import Post from './Post';
import PostLike from './PostLike';
import PostComment from './PostComment';
import PostShare from './PostShare';
import PostTag from './PostTag';
import PostEmotion from './PostEmotion';
import PostRating from './PostRating';
import Follow from './Follow';
import ServiceRating from './ServiceRatings';
import EventRating from './EventRating';
import DishRating from './DishRating';
import ChatMember from './ChatMember';
import Message from './Message';
import Chat from './Chat';

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

  @Column({ nullable: true })
  phoneNumber: string;

  @OneToOne(() => BusinessProfile, profile => profile.user, { cascade: true })
  businessProfile: BusinessProfile;

  @Column({ default: false })
  isActive: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ default: false })
  isSocialLogin: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: 0 })
  followingCount: number;

  @Column({ default: 0 })
  followersCount: number;

  @Column({ type: 'float', nullable: true })
  latitude?: number;

  @Column({ type: 'float', nullable: true })
  longitude?: number;

  @Column({ nullable: true })
  bio?: string;

  @ManyToOne(() => Roles, (role: Roles) => role.users)
  role: Roles;

  @Column({ nullable: true })
  profileImageUrl: string;

  @OneToMany(() => ServiceRating, rating => rating.user)
  serviceRatings: ServiceRating[];

  @OneToMany(() => EventRating, rating => rating.user)
  eventRatings: EventRating[];

  @OneToMany(() => ChatMember, (chatMember) => chatMember.user)
  chatMemberships: ChatMember[];

  @OneToMany(() => Message, (message) => message.sender)
  messages: Message[];

  @OneToMany(() => Chat, (chat) => chat.creator)
  createdChats: Chat[];

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

  @OneToOne(() => Producer, producer => producer.user)
  producer: Producer;

  @OneToOne(() => SocialLogin, socialLogin => socialLogin.user)
  socialLogin: SocialLogin;

  @OneToMany(() => OperationalHour, hour => hour.user, { cascade: true })
  operationalHours: OperationalHour[];

  @OneToMany(() => FavouriteRestaurant, favourite => favourite.user, { cascade: true })
  addFavourite: FavouriteRestaurant[];

  @OneToMany(() => FavouriteRestaurant, favourite => favourite.restaurant, { cascade: true })
  favouriteRestaurant: FavouriteRestaurant[];

  @OneToMany(() => DishRating, (rating) => rating.user, { cascade: true })
  dishRatings: DishRating[];

  @OneToMany(() => RestaurantPaymentMethods, paymentMethods => paymentMethods.user, { cascade: true })
  paymentMethods: RestaurantPaymentMethods[];

  // Social Module Relations
  @OneToMany(() => Post, post => post.user, { cascade: true })
  posts: Post[];

  @OneToMany(() => PostLike, like => like.user, { cascade: true })
  postLikes: PostLike[];

  @OneToMany(() => PostComment, comment => comment.user, { cascade: true })
  postComments: PostComment[];

  @OneToMany(() => PostShare, share => share.user, { cascade: true })
  postShares: PostShare[];

  @OneToMany(() => PostTag, tag => tag.user, { cascade: true })
  postTags: PostTag[];

  @OneToMany(() => PostEmotion, emotion => emotion.user, { cascade: true })
  postEmotions: PostEmotion[];

  @OneToMany(() => PostRating, rating => rating.user, { cascade: true })
  postRatings: PostRating[];

  @OneToMany(() => Follow, (follow) => follow.follower, { cascade: true })
  follows: Follow[];

  @OneToMany(() => Follow, (follow) => follow.followedUser)
  followedByUsers: Follow[];

  @CreateDateColumn({ type: 'timestamptz', default: () => 'NOW()' })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'NOW()',
    onUpdate: 'NOW()',
  })
  updatedAt: Date;
}
