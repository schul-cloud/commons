import Ajv from 'ajv';

import { IConfigOptions } from '@/interfaces/IConfigOptions';
import { IConfiguration } from '@/interfaces/IConfiguration';

const RADIX = 10;
const schemaValidator = new Ajv();

class Configuration implements IConfiguration {
	private options: IConfigOptions;

	private data: any;

	private schema: any;

	private validate: Ajv.ValidateFunction;

	constructor(schema: any, options?: IConfigOptions) {
		this.schema = schema || {};
		this.options = { ...options || {}, logger: console };
		this.data = {};
		this.validate = schemaValidator.compile(schema);
	}

	public isValid = (): boolean => {
		const valid = this.validate(this.data) as boolean;
		this.options.logger.error(this.validate.errors);
		return valid;
	}

	public has = (key: string): boolean => Object.prototype.hasOwnProperty.call(this.data, key)

	public get = (key: string): any => {
		if (this.has(key)) {
			const retValue = this.data[key];
			this.options.logger.info(`will return config entry for '${key}'`);
			return retValue;
		}
		return this.notFound(key);
	}

	public set = (key: string, value: string | any): boolean => false
	// if (!Object.prototype.hasOwnProperty.call(this.schema, key)) {
	// 	throw new Error(`the key '${key}' must be defined in configuration schema`);
	// }
	// const schema = this.schema[key] as IConfigEntry;
	// const typedValue = this.parse((schema as IConfigEntry).type, value);
	// let isValid: boolean;
	// if (!schema.validator) {
	// 	isValid = true;
	// } else if (Array.isArray(schema.validator)) {
	// 	// requires at least one validator to succeed
	// 	isValid = schema.validator.every((validate) => validate(value));
	// } else {
	// 	isValid = schema.validator(value);
	// }
	// if (isValid) {
	// 	this.data[key] = typedValue;
	// 	return true;
	// }
	// return false;


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

	private parse = (type: string, value: any): any => {
		switch (type) {
			case ('string'):
				return (typeof value === 'string') ? value : String(value);
			case ('number'):
				return (typeof value === 'number') ? value : Number(value);
			case ('boolean'):
				return (typeof value === 'boolean') ? value : this.parseBoolean(value);
			case ('integer'):
				return parseInt(value, RADIX);
			case ('float'):
				return parseFloat(value);
			default:
				throw new Error(`value '${value}' can't be parsed, type '${type}' is not supported`);
		}
	}

	private parseBoolean(value: any) {
		const trueSetStrings = ['true', '1', 'on'];
		const falseSetSetrings = ['false', '0', 'off'];
		const valueString = (typeof value === 'string') ? value : String(value);
		if (trueSetStrings.includes(valueString)) {
			return true;
		}
		if (falseSetSetrings.includes(valueString)) {
			return false;
		}
		throw new TypeError(`Only the following values are valid input as Boolean: ${JSON.stringify(trueSetStrings)} for true, and ${JSON.stringify(falseSetSetrings)} for false.`);
	}
}

export default Configuration;
