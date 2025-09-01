import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import Producer from "./Producer";

@Entity("producer_documents")
export default class ProducerDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string;

  @Column()
  fileUrl: string;

  @ManyToOne(() => Producer, (producer) => producer.documents, { onDelete: "CASCADE" })
  producer: Producer;

  @CreateDateColumn()
  createdAt: Date;
}
