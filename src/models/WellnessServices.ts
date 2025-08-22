import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import Wellness from "./Wellness";
import WellnessServiceType from "./WellnessServiceTypes";

@Entity("WellnessServices")
export default class WellnessService {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Wellness, (wellness) => wellness.selectedServices, { onDelete: "CASCADE" })
  @JoinColumn({ name: "wellnessId" })
  wellness: Wellness;

  @ManyToOne(() => WellnessServiceType, { onDelete: "CASCADE" })
  @JoinColumn({ name: "serviceTypeId" })
  serviceType: WellnessServiceType;
}
