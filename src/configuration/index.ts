import Ajv from 'ajv';

import { IConfigOptions } from '@/interfaces/IConfigOptions';
import { IConfiguration } from '@/interfaces/IConfiguration';

const RADIX = 10;
const schemaValidator = new Ajv();

const defaultOptions: IConfigOptions = {
	logger: console,
	notFoundValue: null,
	trueSetStrings: ['true', '1', 'on'],
	falseSetSetrings: ['false', '0', 'off']
};

class Configuration implements IConfiguration {
	private options: IConfigOptions;

	private data: any;

	private schema: any;

	private validate: Ajv.ValidateFunction | null;

	constructor(options?: IConfigOptions) {
		this.options = Object.assign({}, options || {}, defaultOptions);
		this.data = {};
		this.validate = null;
	}

	/**
	 * updates the current schema if it can be compiled
	 *
	 * @param {*} schema
	 * @memberof Configuration
	 */
	public setSchema(schema: any): void {
		this.validate = schemaValidator.compile(schema);
		this.schema = schema || {};
	}

	public setData(data: any): void {
		this.data = data;
	}

	public isValid = (): boolean => {
		if (this.validate === null) {
			throw Error('no schema defined')
		}
		const valid = (this.validate)(this.data) as boolean;
		this.options.logger.error((this.validate).errors);
		return valid;
	}

	public has = (key: string): boolean => Object.prototype.hasOwnProperty.call(this.data, key)

	public get = (key: string): any => {
		if (this.has(key)) {
			const retValue = this.data[key];
			return retValue;
		}
		return this.notFound(key);
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
		return this.options.notFoundValue || null;
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

	private parseBoolean(value: any): boolean {
		if (typeof value === 'boolean') return value;
		const valueString = (typeof value === 'string') ? value : String(value);
		if (this.options.trueSetStrings.includes(valueString)) {
			return true;
		}
		if (this.options.falseSetSetrings.includes(valueString)) {
			return false;
		}
		throw new TypeError(`Only the following values are valid input as Boolean: \
		${JSON.stringify(this.options.trueSetStrings)} for true, \
		and ${JSON.stringify(this.options.falseSetSetrings)} for false.`);
	}
}

export default Configuration;
