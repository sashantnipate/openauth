import { FrameworkGenerator, DatabaseGenerator } from './generators/types';

class GeneratorRegistry {
  private frameworks = new Map<string, FrameworkGenerator>();
  private databases = new Map<string, DatabaseGenerator>();

  registerFramework(generator: FrameworkGenerator) {
    this.frameworks.set(generator.id, generator);
  }

  registerDatabase(generator: DatabaseGenerator) {
    this.databases.set(generator.id, generator);
  }

  getFramework(id: string): FrameworkGenerator {
    const generator = this.frameworks.get(id);
    if (!generator) {
      throw new Error(`[Registry Error] Framework generator "${id}" is not registered.`);
    }
    return generator;
  }

  getDatabase(id: string): DatabaseGenerator {
    const generator = this.databases.get(id);
    if (!generator) {
      throw new Error(`[Registry Error] Database generator "${id}" is not registered.`);
    }
    return generator;
  }
}

export const registry = new GeneratorRegistry();