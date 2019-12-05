import { IConfig } from './IConfig';
import { Singleton } from './Singleton';
import { IConfigOptions } from './IConfigOptions';

export interface IConfiguration extends Singleton<any> {
	get(key: string): any;
	update(params: IConfig): boolean;
	set(key: string, value: any): boolean;
	has(key: string): boolean;
	toObject(): any;
	init(app?: any): void;
	getInstance(options?: IConfigOptions, app?: any): IConfiguration;
}
