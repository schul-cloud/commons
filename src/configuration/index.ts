import dotenv from 'dotenv';
import Ajv from 'ajv';
import loadash from 'lodash';
import dot from 'dot-object';
import fs from 'fs';
import path from 'path';

import ConfigurationError from '../errors/ConfigurationError';
import { IConfigOptions } from '@/interfaces/IConfigOptions';
import { IConfiguration } from '@/interfaces/IConfiguration';
import { IRequiredConfigOptions } from '@/interfaces/IRequiredConfigOptions';
import { IUpdateOptions } from '@/interfaces/IUpdateOptions';
import { IConfig } from '@/interfaces/IConfig';
const { env } = process;
const logger = console;

export const defaultOptions: IRequiredConfigOptions = {
	logger,
	notFoundValue: null,
	configDir: 'config',
	envDir: '.',
	schemaFileName: 'default.schema.json',
	baseDir: process.cwd(),
	ajvOptions: {
		removeAdditional: true,
		useDefaults: true,
		coerceTypes: 'array'
	},
	useDotNotation: true,
	debug: true,
	dotNotationSeparator: '__',
	fileEncoding: 'utf8',
	throwOnError: true
};

enum ReadyState {
	Default = 0,
	InstanceCreated = 1,
	InitStarted = 2,
	InitFinished = 3
}

// load project options for singleton instance from sc-config.json, if exists
let projectConfigOptions: IConfigOptions = {};
const scConfigFilePath = path.join(defaultOptions.baseDir, 'sc-config.json');
if (fs.existsSync(scConfigFilePath)) {
	projectConfigOptions = JSON.parse(
		fs.readFileSync(scConfigFilePath, defaultOptions.fileEncoding)
	);
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
	private options: IRequiredConfigOptions;
	private dot: DotObject.Dot | null;
	private data: IConfig;
	private schema: any;
	/**
	 * keeps the current configuration as object
	 */
	private config: any;
	private schemaValidator: Ajv.Ajv;
	private validate?: Ajv.ValidateFunction;
	private updateErrors: string[];
	private readyState: ReadyState;

	/**
	 * Creates a new instance of Configuration class.
	 * To retrieve a global singleton instance, use default export instead.
	 * @param {IConfigOptions} [options]
	 * @memberof Configuration
	 * @deprecated use singleton getInstance() instead, this will be private in future versions
	 */
	public constructor(options?: IConfigOptions) {
		this.readyState = ReadyState.Default;
		this.data = {};
		this.updateErrors = [];
		this.readyState = ReadyState.InstanceCreated;
		//
		if (this.readyState !== ReadyState.InstanceCreated) {
			throw new Error(
				'init() is only executable once after configuration construction.'
			);
		}
		this.readyState = ReadyState.InitStarted;

		// set options and set missing properties
		this.options = loadash.merge({}, defaultOptions, options || {});

		// parse schema file
		this.schemaValidator = new Ajv(this.options.ajvOptions);
		const schemaFilePath = path.join(
			this.options.baseDir,
			this.options.configDir,
			this.options.schemaFileName
		);
		if (!fs.existsSync(schemaFilePath)) {
			throw new ConfigurationError('error loading schema', { schemaFilePath });
		}
		this.setSchema(this.loadJSONFromFileName(schemaFilePath));

		// parse values from .env file and process.env
		const envFilePath = path.join(
			this.options.baseDir,
			this.options.envDir,
			'.env'
		);
		let dotAndEnv: dotenv.DotenvParseOutput | any = loadash.cloneDeep(env);
		if (fs.existsSync(envFilePath)) {
			const envConfig = dotenv.parse(
				fs.readFileSync(envFilePath, {
					encoding: this.options.fileEncoding
				}),
				{
					debug: !!this.options.debug
				}
			);
			dotAndEnv = loadash.merge({}, envConfig, dotAndEnv);
		}

		// read configuration files, NODE_ENV.json (defaults to development.json)
		const configurationFileNames = [];
		const configurations = [];
		if ('NODE_ENV' in dotAndEnv) {
			configurationFileNames.push(dotAndEnv['NODE_ENV'] + '.json');
		} else {
			configurationFileNames.push('development.json');
		}
		for (const file of configurationFileNames) {
			const fullFileName = path.join(
				this.options.baseDir,
				this.options.configDir,
				file
			);
			if (fs.existsSync(fullFileName)) {
				const fileJson = this.loadJSONFromFileName(fullFileName);
				configurations.push(fileJson);
			}
		}

		// parse dotAndEnv, optionally apply dot transformation
		if (this.options.useDotNotation) {
			this.dot = new dot(this.options.dotNotationSeparator);
			configurations.push(
				loadash.merge({}, this.dot.object(loadash.cloneDeep(dotAndEnv)))
			);
		} else {
			this.dot = null;
			configurations.push(loadash.merge({}, dotAndEnv));
		}

		// merge configurations together, the last mentioned definition wins in order default.json file, NODE_ENV.json file, .env file, environment variables
		const mergedConfiguration = loadash.merge({}, ...configurations);
		if (!this.parse(mergedConfiguration)) {
			throw new ConfigurationError(
				'error parsing configuration',
				this.getErrors()
			);
		}

		this.readyState = ReadyState.InitFinished;
	}

	public has = (key: string): boolean => {
		this.ensureInitialized();
		return Object.prototype.hasOwnProperty.call(this.config, key);
	};

	public get = (key: string): any => {
		this.ensureInitialized();
		// first check config has key, then return it (duplication because of reduce config clone amount)
		if (Object.prototype.hasOwnProperty.call(this.config, key)) {
			const retValue = loadash.cloneDeep(this.config[key]);
			return retValue;
		}
		return this.notFound(key);
	};

	/**
	 * set final, probably dotted config object
	 *
	 * @readonly
	 * @private
	 * @type {*}
	 * @memberof Configuration
	 */
	private updateConfig(): void {
		if (this.dot !== null) {
			this.config = this.dot.dot(this.data);
			return;
		} else {
			this.config = loadash.cloneDeep(this.data);
			return;
		}
	}

	/**
	 * publishes the current configuration, eventually converted in dot notation
	 *
	 * @returns {*}
	 * @memberof Configuration
	 */
	public toObject(): any {
		this.ensureInitialized();
		if (this.dot !== null) {
			return loadash.cloneDeep(this.dot.object(this.config));
		} else {
			return loadash.cloneDeep(this.config);
		}
	}

	/**
	 * returns a singleton configuration instance, override defaults using a sc-config.json file based on IConfigOptions in the projects root.
	 *
	 * @returns {Configuration}
	 * @memberof Configuration
	 */
	public static get Instance(): Configuration {
		if (!Configuration.instance) {
			Configuration.instance = new Configuration(projectConfigOptions);
		}
		return Configuration.instance;
	}

	/**
	 * Updates the given values in current configuration.
	 * @param {IConfig} params params to override in current configuration
	 * @param {IUpdateOptions} options 
	 * @param {boolean} options.reset set true, to only keep values given in params and remove the current values 
	 */
	public update(params: IConfig, options?: IUpdateOptions): boolean {
		this.ensureInitialized();
		this.updateErrors = [];
		const updatedParams = loadash.cloneDeep(params);
		if (this.dot !== null) {
			this.dot.object(updatedParams);
		}
		let data = null;
		if (options && options.reset === true) {
			data = updatedParams;
		} else {
			data = loadash.merge({}, this.data, updatedParams);
		}
		return this.parse(data);
	}

	/**
	 * Replaces the current Configuration with given params.
	 * This removes all current values.
	 * @param params 
	 */
	public reset(params: IConfig): boolean {
		return this.update(params, { reset: true });
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

	public remove(...keys: string[]): boolean {
		this.ensureInitialized();
		this.updateErrors = [];
		const data = loadash.omit(this.config, keys);
		if (this.dot !== null) {
			this.dot.object(data);
		}
		return this.parse(data);
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
		if (!this.validate) {
			throw new ConfigurationError('no schema defined');
		}
		// todo deepcopy data here
		const valid = this.validate(data) as boolean;
		if (valid) {
			this.data = data;
			this.updateConfig();
		} else {
			const message = 'error updating configuration data';
			if (this.options.throwOnError === true) {
				throw new ConfigurationError(message, this.getErrors());
			}
			this.options.logger.error(message, this.getErrors());
		}
		return valid;
	};

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
		};
		if (
			this.validate &&
			this.validate.errors !== null &&
			Array.isArray(this.validate.errors) &&
			this.validate.errors.length !== 0
		) {
			addErrors(...(this.validate.errors as [Ajv.ErrorObject]));
		}
		if (
			this.updateErrors &&
			Array.isArray(this.updateErrors) &&
			this.updateErrors.length !== 0
		) {
			addErrors(...(this.updateErrors as [string]));
		}
		return errors;
	};

	/**
	 * depending on options.throwOnError returns null by default or throws an error for undefined config values
	 *
	 * @private
	 * @param {string} key
	 * @returns {*}
	 * @memberof Configuration
	 */
	private notFound = (key: string): any => {
		const message =
			`The configuration key '${key}' has been used, but it was not defined in a schema! ` +
			'Set it required or update it\'s dependencies to be available in the current situation.';
		this.options.logger.warn(message);
		if (this.options.throwOnError) {
			throw new ConfigurationError(message);
		}
		return this.options.notFoundValue;
	};

	private loadJSONFromFileName(fullFileName: string): any {
		const fileData = fs.readFileSync(fullFileName, {
			encoding: this.options.fileEncoding
		});
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
			throw new ConfigurationError(
				'Initialization not completed, current state is ' + this.readyState
			);
		}
		return true;
	}
}

export default Configuration.Instance;
