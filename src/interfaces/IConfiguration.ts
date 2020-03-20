import { IConfig } from './IConfig';

export interface IConfiguration {
	get(key: string): any;
	update(params: IConfig): boolean;
	reset(params: IConfig): boolean;
	set(key: string, value: any): boolean;
	remove(...keys: [string]): boolean;
	has(key: string): boolean;
	toObject(): any;
}
