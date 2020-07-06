import { IConfigOptions } from './IConfigOptions';
import Ajv from 'ajv';

/**
 * this defines the base options that have to be defined
 *
 * @export
 * @interface IConfigOptionsBase
 * @extends {IConfigOptions}
 */
export interface IRequiredConfigOptions extends IConfigOptions {
	logger: any;
	throwOnError: boolean;
	notFoundValue: null | any;
	configDir: string;
	debug: boolean;
	envDir: string;
	baseDir: string;
	schemaFileName: string;
	ajvOptions: Ajv.Options;
	useDotNotation: boolean;
	dotNotationSeparator: string;
	fileEncoding: BufferEncoding;
}
