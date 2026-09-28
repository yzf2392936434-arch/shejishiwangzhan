import { HttpStatus } from '@nestjs/common';

export enum ResponseCode {
  SUCCESS = 'SUCCESS',
  CREATED = 'CREATED',
  ACCEPTED = 'ACCEPTED',
  NO_CONTENT = 'NO_CONTENT',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFLICT = 'CONFLICT',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  BAD_GATEWAY = 'BAD_GATEWAY',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  BUSINESS_ERROR = 'BUSINESS_ERROR',
}

export const RESPONSE_CODE_TO_HTTP_STATUS_MAP: Record<ResponseCode, number> = {
  [ResponseCode.SUCCESS]: HttpStatus.OK,
  [ResponseCode.CREATED]: HttpStatus.CREATED,
  [ResponseCode.ACCEPTED]: HttpStatus.ACCEPTED,
  [ResponseCode.NO_CONTENT]: HttpStatus.NO_CONTENT,
  [ResponseCode.BAD_REQUEST]: HttpStatus.BAD_REQUEST,
  [ResponseCode.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
  [ResponseCode.FORBIDDEN]: HttpStatus.FORBIDDEN,
  [ResponseCode.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ResponseCode.VALIDATION_ERROR]: HttpStatus.UNPROCESSABLE_ENTITY,
  [ResponseCode.CONFLICT]: HttpStatus.CONFLICT,
  [ResponseCode.TOO_MANY_REQUESTS]: HttpStatus.TOO_MANY_REQUESTS,
  [ResponseCode.INTERNAL_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [ResponseCode.BAD_GATEWAY]: HttpStatus.BAD_GATEWAY,
  [ResponseCode.SERVICE_UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
  [ResponseCode.BUSINESS_ERROR]: HttpStatus.UNPROCESSABLE_ENTITY,
};

export const HTTP_STATUS_TO_RESPONSE_CODE_MAP: Record<number, ResponseCode> = Object.fromEntries(
  Object.entries(RESPONSE_CODE_TO_HTTP_STATUS_MAP).map(([code, status]) => [status, code as ResponseCode]),
) as Record<number, ResponseCode>;
