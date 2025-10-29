import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
} from "typeorm";
import User from "./User";
import { LocationPrivacyMode } from "../enums/LocationPrivacy.enum";

@Entity("LocationPrivacy")
export default class LocationPrivacy {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.locationPrivacy, { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;

    @Column()
    userId: number;

    @Column({ type: "boolean", default: true })
    isSharingEnabled: boolean;

    @Column({
        type: "enum",
        enum: LocationPrivacyMode,
        default: LocationPrivacyMode.NOT_SHARED,
    })
    mode: LocationPrivacyMode;

    @Column("int", { array: true, default: [] })
    includedFriendIds: number[];

    @Column("int", { array: true, default: [] })
    excludedFriendIds: number[];

    @CreateDateColumn({ type: "timestamptz", default: () => "NOW()" })
    createdAt: Date;

    @UpdateDateColumn({
        type: "timestamptz",
        default: () => "NOW()",
        onUpdate: "NOW()",
    })
    updatedAt: Date;
}
