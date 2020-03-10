import { IConfig } from './IConfig';

export interface IConfiguration {
	get(key: string): any;
	update(params: IConfig): boolean;
	set(key: string, value: any): boolean;
	has(key: string): boolean;
	toObject(): any;
}
