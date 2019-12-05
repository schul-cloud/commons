import dotenv from 'dotenv'
import Ajv from 'ajv';
import loadash from 'lodash';
import dot from 'dot-object';

import { IConfigOptions } from '@/interfaces/IConfigOptions';
import { IConfiguration } from '@/interfaces/IConfiguration';
import fs from 'fs';
import path from 'path';
import ConfigurationError from '../errors/ConfigurationError';
import { IRequiredConfigOptions } from '@/interfaces/IRequiredConfigOptions';
import { IConfig } from '@/interfaces/IConfig';
import { Singleton } from '@/interfaces/Singleton';

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
	},
	useDotNotation: true,
	fileEncoding: 'utf8',
	throwOnError: true
};

enum ReadyState {
	Default = 0,
	InstanceCreated = 1,
	InitStarted = 2,
	InitFinished = 3
}

export class Configuration implements IConfiguration, Singleton<Configuration> {

	private static instance: Configuration;
	private options: IRequiredConfigOptions;

	private data: IConfig;
	private schema: any;
	private schemaValidator: Ajv.Ajv;
	private validate: Ajv.ValidateFunction | null;
	private updateErrors: string[];
	private readyState: ReadyState;

	/**
	 * Creates an instance of Configuration.
	 * Instead, Configuration.getInstance() should be used to retrieve a Singleton instance of Configuration.
	 * @param {IConfigOptions} [options]
	 * @memberof Configuration
	 */
	public constructor(options?: IConfigOptions) {
		this.readyState = ReadyState.Default;
		this.options = loadash.merge({}, defaultOptions, options || {});
		dotenv.config({ path: this.options.baseDir }) // extend process.env by .env file
		this.schemaValidator = new Ajv(this.options.ajvOptions);
		this.data = {};
		this.validate = null;
		this.updateErrors = [];
		this.readyState = ReadyState.InstanceCreated;
		this.options.logger.info('Config created, await initialization...');
	}

	public has = (key: string): boolean => {
		this.ensureIsReady();
		return Object.prototype.hasOwnProperty.call(this.config, key);
	}

	public get = (key: string): any => {
		this.ensureIsReady();
		const currentConfig = this.config;
		// first check config has key, then return it (duplication because of reduce config clone amount)
		if (Object.prototype.hasOwnProperty.call(currentConfig, key)) {
			const retValue = currentConfig[key];
			return retValue;
		}
		return this.notFound(key);
	}

	/**
	 * returns a copy of current configuration, eventually converted in dot notation
	 *
	 * @readonly
	 * @private
	 * @type {*}
	 * @memberof Configuration
	 */
	private get config(): any {
		if (this.options.useDotNotation === true) {
			return dot.dot(this.data);
		}
		return loadash.cloneDeep(this.data)
	}

	/**
	 * publishes the current configuration, eventually converted in dot notation
	 *
	 * @returns {*}
	 * @memberof Configuration
	 */
	public toObject(): any {
		this.ensureIsReady();
		return this.config;
	}

	/**
	 * before using configuration it must be initialized, this parses schema and set its values.
	 * 
	 *
	 * @param {*} [app]
	 * @memberof Configuration
	 */
	public init(app?: any): void {
		this.readyState = ReadyState.InitStarted;
		// try parsing schema file from path
		const schemaFilePath = path.join(this.options.baseDir, this.options.configDir, this.options.schemaFileName);
		if (!fs.existsSync(schemaFilePath)) {
			throw new ConfigurationError('error loading schema', { schemaFilePath })
		}
		this.setSchema(this.loadJSONFromFileName(schemaFilePath))

		// read configuration files, first default.json, then NODE_ENV.json from config dir
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

		// parse env, optionally with dot transformation added
		const env = this.options.useDotNotation ? dot.object(process.env) : process.env;
		configurations.push(loadash.merge({}, env));
		const mergedConfiguration = loadash.merge({}, ...configurations);
		if (!this.parse(mergedConfiguration)) {
			throw new ConfigurationError('error parsing configuration', this.getErrors());
		}

		// assign config to app, if defined
		if (app) {
			app.Config = this;
		}
		this.readyState = ReadyState.InitFinished;
		this.options.logger.info('Config initialized...')
	}

	/**
	 * returns a signleton configuration instance, 
	 * on first call it may be configured using options
	 *
	 * @param {IConfigOptions} [options]
	 * @returns {Configuration}
	 * @memberof Configuration
	 */
	public getInstance(options?: IConfigOptions): Configuration {
		if (!Configuration.instance) {
			Configuration.instance = new Configuration(options);
		} else {
			if (options) {
				throw new ConfigurationError('options may set on first call only');
			}
		}
		return Configuration.instance;
	}

	/**
	 * update multiple config values
	 *
	 * @param {IConfig} params
	 * @returns {boolean}
	 * @memberof Configuration
	 */
	public update(params: IConfig): boolean {
		this.ensureIsReady();
		this.updateErrors = [];
		const data = loadash.merge({}, this.data, params)
		return this.parse(data);
	}

	/**
	 * update a single configuration value
	 *
	 * @param {string} key
	 * @param {*} value
	 * @returns {boolean}
	 * @memberof Configuration
	 */
	public set(key: string, value: any): boolean {
		this.ensureIsReady();
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

	/**
	 * returns an array of error objects or error strings which will be created due to validation or schema errors after setting schema or value(s).
	 *
	 * @memberof Configuration
	 */
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
		this.options.logger.warn(`did not found a config entry for '${key}'`);
		if (this.options.throwOnError) {
			throw new ConfigurationError(`There was no value defined for '${key}'`);
		}
		return this.options.notFoundValue;
	}


	private loadJSONFromFileName(fullFileName: string): any {
		const fileData = fs.readFileSync(fullFileName, { encoding: this.options.fileEncoding });
		const fileJson = JSON.parse(fileData);
		return fileJson;
	}

	/**
	 * throws an error when initialization has not finished
	 *
	 * @private
	 * @returns {boolean}
	 * @memberof Configuration
	 */
	private ensureIsReady(): boolean {
		if (this.readyState === ReadyState.InitFinished) {
			throw new ConfigurationError('Initialization not completed, current state is ' + this.readyState);
		}
		return true;
	}

}
