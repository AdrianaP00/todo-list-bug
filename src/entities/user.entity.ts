import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Task } from './task.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    fullname!: string;

    @Column({ unique: true })
    email!: string;

    @Column()
    pass!: string;

    @OneToMany(() => Task, (task) => task.owner)
    tasks!: Task[];
}
