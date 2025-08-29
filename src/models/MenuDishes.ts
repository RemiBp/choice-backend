import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import Producer from './Producer';
import MenuCategory from './MenuCategory';

@Entity('MenuDishes')
export default class MenuDishes {
  @PrimaryGeneratedColumn()
  id: number;


  @Column({ nullable: true })
  name: string; 


  @Column({ nullable: true })
  description: string;


  @Column({ nullable: true })
  price: number;

  @ManyToOne(() => MenuCategory, menuCategory => menuCategory.dishes, { onDelete: 'CASCADE' })
  @JoinColumn()
  menuCategory: MenuCategory;
}
