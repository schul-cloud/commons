import { IValidator } from './IValidator';

/**
 *
 * @export
 * @interface IConfigEntry
 * @template T see https://www.typescriptlang.org/docs/handbook/basic-types.html for types
 */
export interface IConfigEntry {
	readonly type: string;
	readonly env?: boolean | string;
	readonly required?: boolean;
	readonly default?: any;
	readonly validator?: boolean | [boolean];
	readonly public?: boolean;
	readonly description?: string;
}
