import dotenv from 'dotenv'
import Ajv from 'ajv';
import loadash from 'lodash';

import { IConfigOptions } from '@/interfaces/IConfigOptions';
import { IConfiguration } from '@/interfaces/IConfiguration';
import fs from 'fs';
import path from 'path';
import ConfigurationError from '../errors/ConfigurationError';
import { IRequiredConfigOptions } from '@/interfaces/IConfigOptionsBase';
import { IConfig } from '@/interfaces/IConfig';

const defaultOptions: IRequiredConfigOptions = {
	logger: console,
	notFoundValue: null,
	configDir: 'config',
	schemaFileName: 'default.schema.json',
	baseDir: process.cwd(),
	ajvOptions: {
		removeAdditional: 'all',
		useDefaults: true,
		coerceTypes: 'array',
	}
};

export class Configuration implements IConfiguration {

	private options: IRequiredConfigOptions;

	private data: IConfig;
	private schema: any;
	private schemaValidator: Ajv.Ajv;
	private validate: Ajv.ValidateFunction | null;
	private updateErrors: string[];

	constructor(options?: IConfigOptions) {
		this.options = loadash.merge({}, defaultOptions, options || {});
		dotenv.config({ path: this.options.baseDir }) // extend process.env by .env file
		this.data = {};
		this.validate = null;
		this.updateErrors = [];
		this.schemaValidator = new Ajv(this.options.ajvOptions);

	}

	public has = (key: string): boolean => Object.prototype.hasOwnProperty.call(this.data, key)

	public get = (key: string): any => {
		if (this.has(key)) {
			const retValue = this.data[key];
			return retValue;
		}
		return this.notFound(key);
	}

	public toObject(): any {
		return loadash.cloneDeep(this.data);
	}

	public init(app?: any): void {
		const schemaFile = path.join(this.options.baseDir, this.options.configDir, this.options.schemaFileName);
		if (!fs.existsSync(schemaFile)) {
			throw new ConfigurationError('error loading schema', { schemaFile })
		}
		this.setSchema(this.loadJSONFromFileName(schemaFile))
		const configurationFiles = [];
		const configurations = [];
		configurationFiles.push('default.json');
		if (process.env.NODE_ENV) {
			configurationFiles.push(process.env.NODE_ENV + '.json');
		}
		for (const file of configurationFiles) {
			const fullFileName = path.join(this.options.baseDir, this.options.configDir, file);
			if (fs.existsSync(fullFileName)) {
				const fileJson = this.loadJSONFromFileName(fullFileName);
				configurations.push(fileJson);
			}
		}
		configurations.push(loadash.merge({}, process.env));
		const mergedConfiguration = loadash.merge({}, ...configurations);
		if (!this.parse(mergedConfiguration)) {
			throw new ConfigurationError('error parsing configuration', this.getErrors());
		}
		if (app) {
			app.Settings = this;
		}
	}

	public update(params: IConfig): boolean {
		this.updateErrors = [];
		const data = loadash.merge({}, this.data, params)
		return this.parse(data);
	}

	public set(key: string, value: any): boolean {
		const params: IConfig = {};
		params[key] = value;
		return this.update(params);
	}


	/**
	 * updates the current schema if it can be compiled
	 *
	 * @param {*} schema
	 * @memberof Configuration
	 */
	private setSchema(schema: any): void {
		this.validate = this.schemaValidator.compile(schema);
		this.schema = schema || {};
	}

	private parse = (data: any): boolean => {
		if (this.validate === null) {
			throw new ConfigurationError('no schema defined')
		}
		// todo deepcopy data here
		const valid = (this.validate)(data) as boolean;
		if (valid) {
			this.data = data;
		} else {
			this.options.logger.error('error updating configuration data', this.getErrors());
		}
		return valid;
	}

	public getErrors = (): [Ajv.ErrorObject | string] | null => {
		let errors: [Ajv.ErrorObject | string] | null = null;
		const addErrors = (...items: [Ajv.ErrorObject | string]): void => {
			if (errors === null) {
				errors = items;
			} else {
				errors.push(...items);
			}
		}
		if (this.validate && this.validate.errors !== null && Array.isArray(this.validate.errors) && this.validate.errors.length !== 0) {
			addErrors(...this.validate.errors as [Ajv.ErrorObject]);
		}
		if (this.updateErrors && Array.isArray(this.updateErrors) && this.updateErrors.length !== 0) {
			addErrors(...this.updateErrors as [string]);
		}
		return errors;
	}

	/**
	 * depending on options.throwOnError returns null by default or throws an error for undefined config values
	 *
	 * @private
	 * @param {string} key
	 * @returns {*}
	 * @memberof Configuration
	 */
	private notFound = (key: string): any => {
		this.options.logger.warn(`did not found a valid config entry for '${key}'`);
		if (this.options.throwOnError) {
			throw new ConfigurationError(`Could not fetch any value for key '${key}'`);
		}
		return this.options.notFoundValue;
	}

	private loadJSONFromFileName(fullFileName: string): any {
		const fileData = fs.readFileSync(fullFileName, { encoding: 'utf8' });
		const fileJson = JSON.parse(fileData);
		return fileJson;
	}

}
