import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

@Injectable()
export class SupabaseService {
  readonly client: SupabaseClient;

  constructor(configService: ConfigService) {
    this.client = createClient(
      configService.getOrThrow<string>('SUPABASE_URL'),
      configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
      {
        auth: { autoRefreshToken: false, persistSession: false },
        // O backend não usa Realtime, mas o SupabaseClient inicializa um
        // RealtimeClient internamente e ele exige WebSocket nativo (Node 22+).
        // Fornecer o polyfill evita o crash em runtimes com Node mais antigo (ex: Railway).
        realtime: { transport: WebSocket as never },
      },
    ) as SupabaseClient;
  }
}
