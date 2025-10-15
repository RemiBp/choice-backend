import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import Restaurant from './Restaurant';
import Producer from './Producer';

@Entity('CuisineType')
export default class CuisineType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  imageUrl: string;

  @OneToMany(() => Restaurant, restaurant => restaurant.cuisineType)
  restaurants: Restaurant[];

  @OneToMany(() => Producer, producer => producer.cuisineType)
  producer: Producer[];

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'NOW()' })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'NOW()',
    onUpdate: 'NOW()',
  })
  updatedAt: Date;
}
