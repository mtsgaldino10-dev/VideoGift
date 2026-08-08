import { plainToInstance } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUrl,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsUrl({ require_tld: false })
  SUPABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  SUPABASE_SERVICE_ROLE_KEY!: string;

  @IsString()
  @IsNotEmpty()
  R2_ACCOUNT_ID!: string;

  @IsString()
  @IsNotEmpty()
  R2_ACCESS_KEY_ID!: string;

  @IsString()
  @IsNotEmpty()
  R2_SECRET_ACCESS_KEY!: string;

  @IsUrl({ require_tld: false })
  R2_ENDPOINT!: string;

  @IsString()
  @IsNotEmpty()
  R2_BUCKET_NAME!: string;

  @IsUrl({ require_tld: false })
  R2_PUBLIC_URL!: string;

  @IsUrl({ require_tld: false })
  APP_URL!: string;

  @IsNumber()
  PORT: number = 3001;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Configuração de ambiente inválida:\n${errors.toString()}`);
  }

  return validatedConfig;
}
