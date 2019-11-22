import { IConfiguration } from '@/interfaces/IConfiguration';

class Configuration implements IConfiguration {
  get(key: string) {
    throw new Error('Method not implemented.');
  }

  has(key: string): boolean {
    throw new Error('Method not implemented.');
  }

  set(key: string, value: any): void {
    throw new Error('Method not implemented.');
  }

  isValid(): boolean {
    throw new Error('Method not implemented.');
  }
}
