import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    Unique,
} from 'typeorm';
import User from './User';
import Post from './Post';
import Tag from './Tag';

@Entity('PostTags')
@Unique(['postId', 'tagId'])
export default class PostTag {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @Column()
    postId: number;

    @Column({ nullable: true })
    tagId: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @ManyToOne(() => Post, post => post.postTags, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'postId' })
    post: Post;

    @ManyToOne(() => Tag, tag => tag.postTags, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tagId' })
    tag: Tag;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;

    @DeleteDateColumn({ type: 'timestamptz', nullable: true })
    deletedAt: Date;

    @Index()
    @Column({ default: false })
    isDeleted: boolean;
}
