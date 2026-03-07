import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { ResponseDto, PaginatedResponseDto } from '../dto/response.dto';

export const ApiResponseWrapper = <TModel extends Type<any>>(
  model?: TModel,
  isPaginated: boolean = false
) => {
  const responseType = isPaginated ? PaginatedResponseDto : ResponseDto;
  
  if (model) {
    return applyDecorators(
      ApiExtraModels(responseType, model),
      ApiOkResponse({
        schema: {
          allOf: [
            { $ref: getSchemaPath(responseType) },
            {
              properties: {
                data: isPaginated 
                  ? {
                      type: 'array',
                      items: { $ref: getSchemaPath(model) }
                    }
                  : { $ref: getSchemaPath(model) }
              }
            }
          ]
        }
      })
    );
  }

  return applyDecorators(
    ApiExtraModels(responseType),
    ApiOkResponse({
      schema: { $ref: getSchemaPath(responseType) }
    })
  );
};

export const ApiPaginatedResponse = <TModel extends Type<any>>(model: TModel) =>
  ApiResponseWrapper(model, true);