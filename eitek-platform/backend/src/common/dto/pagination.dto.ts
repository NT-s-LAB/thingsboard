import { IsOptional, IsNumber, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  textSearch?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortProperty?: string;

  @IsOptional()
  sortOrder?: 'asc' | 'desc' | 'ASC' | 'DESC' = 'desc';

  get effectiveLimit(): number {
    return this.limit || this.pageSize || 10;
  }

  get effectiveSearch(): string | undefined {
    return this.search || this.textSearch;
  }

  get effectiveSortBy(): string | undefined {
    return this.sortBy || this.sortProperty;
  }

  get effectiveSortOrder(): 'asc' | 'desc' {
    const order = this.sortOrder?.toLowerCase();
    return order === 'asc' ? 'asc' : 'desc';
  }

  get offset(): number {
    return (this.page - 1) * this.effectiveLimit;
  }
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}