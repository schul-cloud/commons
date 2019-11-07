import { IConfigEntry } from './IConfigEntry';

export interface IConfigSchema {
	[key: string]: IConfigEntry;
}
