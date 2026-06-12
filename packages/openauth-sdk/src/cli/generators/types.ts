export interface CliAnswers {
  framework: 'nextjs' | 'express' | 'fastify' | 'nestjs';
  database: 'mongodb' | 'postgres' | 'mysql';
  providers: ('email' | 'google' | 'github')[];
  organizations: boolean;
  roles: boolean;
}

export interface GeneratorContext {
  projectRoot: string;
  options: CliAnswers;
}

export interface BaseGenerator {
  id: string;
  name: string;
  generate(ctx: GeneratorContext): Promise<void>;
}

export interface FrameworkGenerator extends BaseGenerator {}
export interface DatabaseGenerator extends BaseGenerator {}