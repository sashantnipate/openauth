import inquirer from 'inquirer';
import { CliAnswers } from './generators/types';

export async function promptUserSetup(): Promise<CliAnswers> {
  return inquirer.prompt<CliAnswers>([
    {
      type: 'list',
      name: 'framework',
      message: 'Which application framework are you targeting?',
      choices: [
        { name: 'Next.js (App Router)', value: 'nextjs' },
        { name: 'Express.js Rest API (Coming Soon)', value: 'express', disabled: true },
        { name: 'Fastify Core API (Coming Soon)', value: 'fastify', disabled: true },
        { name: 'NestJS Framework Layer (Coming Soon)', value: 'nestjs', disabled: true },
      ],
    },
    {
      type: 'list',
      name: 'database',
      message: 'Which database strategy will you use?',
      choices: [
        { name: 'MongoDB (Mongoose Schema Model)', value: 'mongodb' },
        { name: 'PostgreSQL (Coming Soon)', value: 'postgres', disabled: true },
        { name: 'MySQL Engine (Coming Soon)', value: 'mysql', disabled: true },
      ],
    },
    {
      type: 'checkbox',
      name: 'providers',
      message: 'Select active authentication methods:',
      choices: [
        { name: 'Traditional Credentials (Email & Password)', value: 'email', checked: true },
        { name: 'Google Single Sign-On OAuth', value: 'google' },
        { name: 'GitHub Single Sign-On OAuth', value: 'github' },
      ],
    },
    {
      type: 'list',
      name: 'organizations',
      message: 'Enable multi-tenant Organization/Team workspace features?',
      choices: [
        { name: 'Yes, provision multi-tenancy rules', value: true },
        { name: 'No, keep isolated user access states', value: false },
      ],
    },
    {
      type: 'list',
      name: 'roles',
      message: 'Enable integrated Roles & Permissions guard management?',
      choices: [
        { name: 'Yes, append authorization checks', value: true },
        { name: 'No, manage access flags externally', value: false },
      ],
    },
  ]);
}