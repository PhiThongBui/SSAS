/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { trimString } from '../../../helper/transform';
import { RoleCode } from '../../roles/user_venue_roles.entity';

const toArray = (value: unknown): unknown =>
  typeof value === 'string' ? [value] : value;

export class CreateStaffDto {
  @ApiProperty({ example: 'waiter1', description: 'Username' })
  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message:
      'username can only contain letters, numbers, dots, underscores, and hyphens',
  })
  username!: string;

  @ApiProperty({ example: 'password123', description: 'Plain text password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @ApiProperty({ example: 'Nguyen Van A', description: 'Full name' })
  @Transform(({ value }: TransformFnParams) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  fullName!: string;

  @ApiProperty({
    example: ['waiter'],
    description: 'Staff role list',
    enum: RoleCode,
    isArray: true,
  })
  @Transform(({ value }: TransformFnParams) => toArray(value))
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(RoleCode, { each: true })
  roles!: RoleCode[];
}
