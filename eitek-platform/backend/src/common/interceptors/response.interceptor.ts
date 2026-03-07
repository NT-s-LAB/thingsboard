import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { ResponseDto, PaginatedResponseDto } from '../dto/response.dto';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ResponseDto<T>> {
  private readonly logger = new Logger(ResponseInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseDto<T>> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        // If data is already a ResponseDto, return as is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Check if this is a paginated response
        if (this.isPaginatedResponse(data)) {
          return {
            success: true,
            statusCode: response.statusCode,
            message: 'Request completed successfully',
            data: data.items,
            pagination: {
              page: data.page,
              limit: data.limit,
              total: data.total,
              totalPages: data.totalPages,
              hasNext: data.hasNext,
              hasPrev: data.hasPrev,
            },
            timestamp: new Date().toISOString(),
          } as PaginatedResponseDto<T>;
        }

        // Regular response
        return {
          success: true,
          statusCode: response.statusCode,
          message: 'Request completed successfully',
          data,
          timestamp: new Date().toISOString(),
        } as ResponseDto<T>;
      }),
      tap(() => {
        const duration = Date.now() - now;
        this.logger.log(
          `${request.method} ${request.url} - ${response.statusCode} - ${duration}ms`,
        );
      }),
    );
  }

  private isPaginatedResponse(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      'items' in data &&
      'total' in data &&
      'page' in data &&
      'limit' in data
    );
  }
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;
    const now = Date.now();

    this.logger.log(`→ ${method} ${url}`, {
      body: this.sanitizeObject(body),
      query,
      params,
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - now;
          this.logger.log(`← ${method} ${url} - ${duration}ms`);
        },
        error: (error) => {
          const duration = Date.now() - now;
          this.logger.error(`← ${method} ${url} - ${duration}ms - ERROR: ${error.message}`);
        },
      }),
    );
  }

  private sanitizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = { ...obj };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'credential'];
    
    for (const key in sanitized) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
}