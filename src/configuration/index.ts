import { IConfig } from '@/interfaces/IConfig';
import { IConfigEntry } from '@/interfaces/IConfigEntry';
import { IConfigOptions } from '@/interfaces/IConfigOptions';
import { IConfigSchema } from '@/interfaces/IConfigSchema';
import { IConfiguration } from '@/interfaces/IConfiguration';

class Configuration implements IConfiguration {
	private options: IConfigOptions;

	private config: IConfig;

	private schema: IConfigSchema;

	constructor(schema?: IConfigSchema, options?: IConfigOptions) {
		this.schema = schema || {};
		this.options = { ...options || {}, logger: console };
		this.config = {};
	}

	public isValid = (): boolean => {
		throw new Error('Method not implemented.');
	}

	public has = (key: string): boolean => Object.prototype.hasOwnProperty.call(this.config, key)

	public get = (key: string): any => {
		if (this.has(key)) {
			const retValue = this.config[key];
			this.options.logger.info(`will return config entry for '${key}'`);
			return retValue;
		}
		return this.notFound(key);
	}

	public set = (key: string, value: string | any): boolean => {
		if (!Object.prototype.hasOwnProperty.call(this.schema, key)) {
			throw new Error(`the key '${key}' must be defined in configuration schema`);
		}
		const schema = this.schema[key] as IConfigEntry;
		const typedValue = this.parse((schema as IConfigEntry).type, value);
		let isValid: boolean;
		if (!schema.validator) {
			isValid = true;
		} else if (Array.isArray(schema.validator)) {
			// requires at least one validator to succeed
			isValid = schema.validator.every((validate) => validate(value));
		} else {
			isValid = schema.validator(value);
		}
		if (isValid) {
			this.config[key] = typedValue;
			return true;
		}
		return false;
	}

	/**
	 * depending on options.throwOnUndefined returns null by default or throws an error for undefined config values
	 *
	 * @private
	 * @param {string} key
	 * @returns {*}
	 * @memberof Configuration
	 */
	private notFound = (key: string): any => {
		this.options.logger.warn(`did not found a valid config entry for '${key}'`);
		if (this.options.throwOnUndefined) {
			throw new Error(`Could not fetch any value for key '${key}'`);
		}
		return null;
	}

	// private _loadConfig(schema: IConfigSchema): any; {
	// 	for (const prop in schema) {
	// 		if (Object.prototype.hasOwnProperty.call(schema, prop)) {
	// 		}
	// 	}
	// }

	private parse = (type: string, value: any): any => {
		switch (type) {
			case ('string'):
				return (typeof value === 'string') ? value : String(value);
			case ('number'):
				return (typeof value === 'number') ? value : Number(value);
			case ('boolean'):
				return (typeof value === 'boolean') ? value : Boolean(value);
			case ('int'):
				return parseInt(value, 10);
			case ('float'):
				return parseFloat(value);
			default:
				throw new Error(`value '${value}' can't be parsed, type '${type}' is not supported`);
		}
	}
}

export default Configuration;
