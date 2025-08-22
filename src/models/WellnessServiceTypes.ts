import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import ProducerService from "./Services";

@Entity("WellnessServiceTypes")
export default class WellnessServiceType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column("jsonb")
  criteria: string[];

  @OneToMany(() => ProducerService, (service) => service.serviceType)
  services: ProducerService[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
