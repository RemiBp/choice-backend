import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import ServiceRating from "./ServiceRatings";
import Wellness from "./Wellness";
import WellnessServiceType from "./WellnessServiceTypes";

@Entity("ProducerServices")
export default class ProducerService {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  wellnessId: number;

  @ManyToOne(() => Wellness, (wellness) => wellness.services, { onDelete: "CASCADE" })
  @JoinColumn({ name: "wellnessId" })
  wellness: Wellness;

  @Column()
  serviceTypeId: number;

  @ManyToOne(() => WellnessServiceType, { eager: true })
  @JoinColumn({ name: "serviceTypeId" })
  serviceType: WellnessServiceType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

