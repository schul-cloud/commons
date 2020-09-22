import { IConfigType } from './IConfigType';

/** wrapper for a single hierarchy in configuration */
export interface IConfigHierarchy {
	type: IConfigType;
	/** additional type information like file path for type File */
	meta?: string;
	/** configuration data */
	data: any;
}
