import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import ServiceRating from "./ServiceRatings";
import Wellness from "./Wellness";
import WellnessServiceType from "./WellnessServiceTypes";
import Producer from "./Producer";

@Entity("ProducerServices")
export default class ProducerService {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  duration: string;

  @Column({ nullable: true })
  location: string;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ nullable: true })
  maxCapacity: number;

  @Column("text", { array: true, nullable: true })
  serviceImages: string[];

  @Column({ nullable: true, unique: true })
  slug: string;

  @OneToMany(() => ServiceRating, (rating) => rating.producerService, { cascade: true })
  ratings: ServiceRating[];

  @ManyToOne(() => Wellness, (wellness) => wellness.producerServices, { onDelete: "CASCADE" })
  @JoinColumn({ name: "wellnessId" })
  wellness: Wellness;

  @Column()
  wellnessId: number;

  @ManyToOne(() => WellnessServiceType, (type) => type.services, { onDelete: "SET NULL" })
  @JoinColumn({ name: "serviceTypeId" })
  serviceType: WellnessServiceType;

  @Column({ nullable: true })
  serviceTypeId: number;

  @ManyToOne(() => Producer, { onDelete: "CASCADE" })
  @JoinColumn({ name: "producerId" })
  producer: Producer;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn({ type: "timestamptz", default: () => "NOW()" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz", default: () => "NOW()", onUpdate: "NOW()" })
  updatedAt: Date;
}
