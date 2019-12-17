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
	/**
	 * set a custom logger
	 *
	 * @type {*}
	 * @memberof IConfigOptions
	 */
	logger: any;
	/**
	 * throw an error when an undefined value is requested
	 *
	 * @type {boolean}
	 * @memberof IConfigOptions
	 */
	throwOnError: boolean;
	/**
	 * If throwOnUndefined is not true, the default return value which is null may be overriden using this property.
	 *
	 * @type {*}
	 * @memberof IConfigOptions
	 */
	notFoundValue: null | any;
	configDir: string;
	baseDir: string;
	schemaFileName: string;
	ajvOptions: Ajv.Options;
	useDotNotation: boolean;
	fileEncoding: string;
}
