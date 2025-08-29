import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import Producer from './Producer';
import MenuDishes from './MenuDishes';

@Entity('MenuCategory')
export default class MenuCategory {
  @PrimaryGeneratedColumn()
  id: number;


  @Column({ nullable: true })
  name: string; 

  @ManyToOne(() => Producer, producer => producer.menuCategory, { onDelete: 'CASCADE' })
  @JoinColumn()
  producer: Producer;

  @OneToMany(() => MenuDishes, MenuDishes => MenuDishes.menuCategory)
  dishes: MenuDishes[];

}
