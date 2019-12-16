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

/**
 * JSON-Schema validated Configuration Wrapper with dot notation support. 
 *
 * @export
 * @class Configuration
 * @implements {IConfiguration}
 */
export class Configuration implements IConfiguration {

	private static instance: Configuration;
	private options?: IRequiredConfigOptions;
	private data: IConfig;
	private schema: any;
	private schemaValidator?: Ajv.Ajv;
	private validate?: Ajv.ValidateFunction;
	private updateErrors: string[];
	private readyState: ReadyState;

	/**
	 * Creates an instance of Configuration.
	 * Instead using the constructor, Configuration.Instance should be used to retrieve a Singleton instance of Configuration.
	 * @param {IConfigOptions} [options]
	 * @memberof Configuration
	 * @deprecated use singleton getInstance() instead, this will be private in future versions 
	 */
	public constructor() {
		this.readyState = ReadyState.Default;
		this.data = {};
		this.updateErrors = [];
		this.readyState = ReadyState.InstanceCreated;
	}

	public has = (key: string): boolean => {
		this.ensureInitialized();
		return Object.prototype.hasOwnProperty.call(this.config, key);
	}

	public get = (key: string): any => {
		this.ensureInitialized();
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
		if ((this.options as IRequiredConfigOptions).useDotNotation === true) {
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
		this.ensureInitialized();
		return this.config;
	}

	/**
	 * before using configuration it must be initialized, this parses schema and set its values.
	 * 
	 *
	 * @param {*} [app]
	 * @memberof Configuration
	 */
	public init(options?: IConfigOptions): void {
		if (this.readyState !== ReadyState.InstanceCreated) {
			throw new Error('init() is only executable once after configuration construction.')
		}
		this.readyState = ReadyState.InitStarted;

		// parse options and set missing properties
		this.options = loadash.merge({}, defaultOptions, options || {});
		dotenv.config({ path: this.options.baseDir }) // extend process.env by .env file
		this.schemaValidator = new Ajv(this.options.ajvOptions);

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
		const env = this.options.useDotNotation ? dot.object(loadash.cloneDeep(process.env)) : process.env;
		configurations.push(loadash.merge({}, env));
		const mergedConfiguration = loadash.merge({}, ...configurations);
		if (!this.parse(mergedConfiguration)) {
			throw new ConfigurationError('error parsing configuration', this.getErrors());
		}

		// assign config to app, if defined
		if (options && options.app) {
			if ('Config' in options.app) {
				throw new ConfigurationError('error registering configuration in app, app.Config is already defined');
			}
			options.app.Config = this;
		}
		this.readyState = ReadyState.InitFinished;
		this.options.logger.info('Config initialized...')
	}

	/**
	 * returns a singleton configuration instance
	 *
	 * @returns {Configuration}
	 * @memberof Configuration
	 */
	public static get Instance(): Configuration {
		if (!Configuration.instance) {
			Configuration.instance = new Configuration();
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
		this.ensureInitialized();
		this.updateErrors = [];
		if ((this.options as IRequiredConfigOptions).useDotNotation === true) {
			dot.object(params)
		}
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
		this.ensureInitialized();
		const params: IConfig = { [key]: value };
		return this.update(params);
	}


	/**
	 * updates the current schema if it can be compiled
	 *
	 * @param {*} schema
	 * @memberof Configuration
	 */
	private setSchema(schema: any): void {
		this.validate = (this.schemaValidator as Ajv.Ajv).compile(schema);
		this.schema = schema || {};
	}

	private parse = (data: any): boolean => {
		if (!this.validate) {
			throw new ConfigurationError('no schema defined')
		}
		// todo deepcopy data here
		const valid = (this.validate)(data) as boolean;
		if (valid) {
			this.data = data;
		} else {
			const message = 'error updating configuration data';
			if ((this.options as IRequiredConfigOptions).throwOnError === true) {
				throw new ConfigurationError(message, this.getErrors());
			}
			(this.options as IRequiredConfigOptions).logger.error(message, this.getErrors());
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
		const message = `There was no configuration value defined for key '${key}'`;
		(this.options as IRequiredConfigOptions).logger.warn(message);
		if ((this.options as IRequiredConfigOptions).throwOnError) {
			throw new ConfigurationError(message);
		}
		return (this.options as IRequiredConfigOptions).notFoundValue;
	}


	private loadJSONFromFileName(fullFileName: string): any {
		const fileData = fs.readFileSync(fullFileName, { encoding: (this.options as IRequiredConfigOptions).fileEncoding });
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
	private ensureInitialized(): boolean {
		if (this.readyState !== ReadyState.InitFinished) {
			throw new ConfigurationError('Initialization not completed, current state is ' + this.readyState);
		}
		return true;
	}

}


export default Configuration.Instance;
