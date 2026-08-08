import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import type { Request } from 'express';
import { SupabaseService } from '../supabase/supabase.service';

export interface AuthenticatedRequest extends Request {
  user: User;
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Token de autenticação ausente');
    }

    const { data, error } =
      await this.supabaseService.client.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Token de autenticação inválido');
    }

    request.user = data.user;
    return true;
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
