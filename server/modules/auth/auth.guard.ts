import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

interface AdminSessionUser {
  id: string;
  username: string;
}

interface AuthSession {
  user?: AdminSessionUser;
  destroy(callback: (err: unknown) => void): void;
}

interface AuthRequest {
  session: AuthSession;
}

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    if (!req.session?.user) {
      throw new UnauthorizedException('未登录');
    }
    return true;
  }
}
