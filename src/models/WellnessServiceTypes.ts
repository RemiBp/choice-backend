import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import ServiceRating from "./ServiceRatings";

@Entity("WellnessServiceTypes")
export default class WellnessServiceType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column("jsonb")
  criteria: string[];

  @OneToMany(() => ServiceRating, (rating) => rating.serviceType)
  ratings: ServiceRating[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
