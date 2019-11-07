import { IConfigSchema } from './IConfigSchema';

export interface IConfig {
	[propName: string]: IConfigSchema;
}
