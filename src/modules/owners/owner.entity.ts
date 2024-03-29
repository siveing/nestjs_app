import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Role } from 'src/enums/role.enum';
import { Type } from 'src/enums/type.enum';
import { Cat } from '../cats/cat.entity';

@Entity()
export class Owner {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ enum: ['user', 'admin'] })
  role: Role;

  @Column()
  type: Type;

  @Column()
  email: string;

  @Column()
  phone_number: string;

  @OneToMany(() => Cat, (cat) => cat.owner)
  cats: Cat[];
}
