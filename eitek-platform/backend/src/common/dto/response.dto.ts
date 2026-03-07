import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResponseDto<T = any> {
  @ApiProperty({
    description: 'Indicates if the request was successful',
    example: true
  })
  success: boolean;

  @ApiProperty({
    description: 'HTTP status code',
    example: 200
  })
  statusCode: number;

  @ApiProperty({
    description: 'Response message',
    example: 'Operation completed successfully'
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Response data'
  })
  data?: T;

  @ApiProperty({
    description: 'Response timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  timestamp: string;

  @ApiPropertyOptional({
    description: 'Additional metadata'
  })
  meta?: Record<string, any>;
}

export class PaginatedResponseDto<T = any> extends ResponseDto<T[]> {
  @ApiProperty({
    description: 'Pagination metadata'
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Indicates the request failed',
    example: false
  })
  success: boolean;

  @ApiProperty({
    description: 'HTTP status code',
    example: 400
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Validation failed'
  })
  message: string;

  @ApiProperty({
    description: 'Error code for client handling',
    example: 'VALIDATION_ERROR'
  })
  error: string;

  @ApiProperty({
    description: 'Response timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  timestamp: string;

  @ApiPropertyOptional({
    description: 'Detailed error information (development only)'
  })
  details?: any;

  @ApiPropertyOptional({
    description: 'Request path where error occurred',
    example: '/api/devices'
  })
  path?: string;
}