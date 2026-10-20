import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

export class SimulationModificationDto {
  @ApiProperty()
  @IsUUID()
  nodeId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  field!: string;

  @ApiProperty()
  @IsNumber()
  value!: number;
}

export class RunSimulationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  horizonDays?: number;

  @ApiProperty({ type: [SimulationModificationDto] })
  @ValidateNested({ each: true })
  @Type(() => SimulationModificationDto)
  @ArrayMaxSize(50)
  modifications!: SimulationModificationDto[];
}
