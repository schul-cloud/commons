import dotenv from 'dotenv';
import Ajv from 'ajv';
import loadash from 'lodash';
import dot from 'dot-object';
import fs from 'fs';
import path from 'path';

import ConfigurationError from '../errors/ConfigurationError';
import { IConfigOptions } from '../interfaces/IConfigOptions';
import { IConfiguration } from '../interfaces/IConfiguration';
import { IRequiredConfigOptions } from '../interfaces/IRequiredConfigOptions';
import { IUpdateOptions } from '../interfaces/IUpdateOptions';
import { IConfig } from '../interfaces/IConfig';
import { IConfigHierarchy } from '../interfaces/IConfigHierarchy';
import { IConfigType } from '../interfaces/IConfigType';
import { SecretCleaner } from './secretCleaner';
import { IExportOptions } from '../interfaces/IExportOptions';
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
		coerceTypes: 'array',
	},
	useDotNotation: true,
	debug: true,
	dotNotationSeparator: '__',
	fileEncoding: 'utf8',
	throwOnError: true,
	allowRuntimeChangesInEnv: ['test'],
	defaultNodeEnv: 'development',
	loadFilesFromEnv: ['NODE_ENV', 'SC_INSTANCE'],
	printHierarchy: false,
	secretMatches: ['SECRET', 'KEY', 'SALT', 'PASSWORD'],
};

enum ReadyState {
	Default = 0,
	InstanceCreated = 1,
	InitStarted = 2,
	InitFinished = 3,
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
	private NODE_ENV: string;
	private configurationHierarchy: IConfigHierarchy[];
	private secretCleaner: SecretCleaner;

	/**
	 * Creates a new instance of Configuration class.
	 * To retrieve a global singleton instance, use default export instead.
	 * @param {IConfigOptions} [options]
	 * @memberof Configuration
	 * @deprecated use singleton getInstance() instead, this will be private in future versions
	 */
	constructor(options?: IConfigOptions) {
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
		const schemaFilePath = this.getSchemaFilePath();
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
		let dotEnv: any | null = null;
		if (fs.existsSync(envFilePath)) {
			dotEnv = dotenv.parse(
				fs.readFileSync(envFilePath, {
					encoding: this.options.fileEncoding,
				}),
				{
					debug: !!this.options.debug,
				}
			);
		}
		const dotAndEnv: dotenv.DotenvParseOutput | any = loadash.merge(
			{},
			dotEnv,
			loadash.cloneDeep(env)
		);

		// set default NODE_ENV
		if ('NODE_ENV' in dotAndEnv) {
			this.NODE_ENV = dotAndEnv['NODE_ENV'];
		} else {
			this.NODE_ENV = this.options.defaultNodeEnv;
		}

		// read configuration files, first default.json, then NODE_ENV.json (which defaults to development.json), then others defined in options.loadFilesFromEnv
		const configurationFileNames: string[] = [];
		const configurations: IConfigHierarchy[] = [];
		// start with default file
		configurationFileNames.push('default');
		// add environment files
		if (
			Array.isArray(this.options.loadFilesFromEnv) &&
			this.options.loadFilesFromEnv.length !== 0
		) {
			this.options.loadFilesFromEnv.forEach((envName) => {
				// add configuration based on current envName, ignore default already added first
				if (!(envName in dotAndEnv)) {
					// error case: should parse envName but is has not been defined
					this.options.logger.error(
						'ignore envName, this property is not defined in current environment',
						envName
					);
				} else if (configurationFileNames.includes(dotAndEnv[envName])) {
					// error case: the file is already added, do not add it twice
					const fileName = dotAndEnv[envName];
					this.options.logger.error(
						'ignore fileName, already added this file before',
						fileName
					);
				} else {
					// success case: add value to hierarchy of files to be parsed
					configurationFileNames.push(dotAndEnv[envName]);
				}
			});
		}
		this.options.logger.debug(
			'will parse following configuration filenames in given order',
			configurationFileNames
		);
		for (const file of configurationFileNames) {
			const fullFileName = path.join(
				this.options.baseDir,
				this.options.configDir,
				file + '.json'
			);
			if (fs.existsSync(fullFileName)) {
				const fileJson = this.loadJSONFromFileName(fullFileName);
				const hierarchy: IConfigHierarchy = {
					type: IConfigType.File,
					meta: fullFileName,
					data: fileJson,
				};
				configurations.push(hierarchy);
				this.options.logger.debug(
					'successfully parsed json from',
					fullFileName
				);
			} else {
				this.options.logger.error(
					'config file not found, ignore...',
					fullFileName
				);
			}
		}

		// parse dotEnv and env, optionally apply dot transformation
		this.dot = this.options.useDotNotation
			? new dot(this.options.dotNotationSeparator)
			: null;

		const envParser = (data: any, dotParser: DotObject.Dot | null): any => {
			if (dotParser !== null) {
				return loadash.merge({}, dotParser.object(loadash.cloneDeep(data)));
			}
			return loadash.merge({}, data);
		};

		// add .env file into hierarchy, if it exists
		if (dotEnv !== null) {
			const data = envParser(dotEnv, this.dot);
			configurations.push({
				type: IConfigType.DotEnv,
				data,
			});
		}

		// add environment overriding everything from before into hierarchy
		if (env !== null) {
			const data = envParser(env, this.dot);
			configurations.push({
				type: IConfigType.Env,
				data,
			});
		}

		// merge configurations together, the last mentioned definition wins in order default.json file,
		// NODE_ENV.json file, further FURTHER_ENV.json files, .env file, environment variables
		this.configurationHierarchy = configurations;
		const mergedConfiguration = loadash.merge(
			{},
			...configurations.map(
				(configurationHierarchy) => configurationHierarchy.data
			)
		);
		this.parse(mergedConfiguration);

		// init secrets cleaner used to hide secrets in this.printHierarchy()
		this.secretCleaner = new SecretCleaner(this.options.secretMatches);

		if (this.options.printHierarchy === true) {
			this.printHierarchy();
		}
		this.readyState = ReadyState.InitFinished;
	}

	has = (key: string): boolean => {
		this.ensureInitialized();
		return Object.prototype.hasOwnProperty.call(this.config, key);
	};

	get = (key: string): any => {
		this.ensureInitialized();
		// first check config has key, then return it (duplication because of reduce config clone amount)
		if (Object.prototype.hasOwnProperty.call(this.config, key)) {
			const retValue = loadash.cloneDeep(this.config[key]);
			return retValue;
		}
		return this.notFound(key);
	};

	private getSchemaFilePath(): string {
		return path.join(
			this.options.baseDir,
			this.options.configDir,
			this.options.schemaFileName
		);
	}

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
	toObject(options?: IExportOptions): IConfig {
		this.ensureInitialized();
		let config: IConfig;
		if (this.dot !== null) {
			config = loadash.cloneDeep(this.dot.object(this.config));
		} else {
			config = loadash.cloneDeep(this.config);
		}
		const mergedOptions = loadash.merge({}, this.options, options);
		if (mergedOptions.plainSecrets !== true) {
			config = this.secretCleaner.filterSecretValues(config);
		}
		return config;
	}

	getConfigurationHierarchy(): IConfigHierarchy[] {
		if (this.runtimeChangesAllowed()) {
			this.options.logger.warn(
				'exported hierarchy eventually has been changed due runtime changes are allowed'
			);
		}
		return loadash.cloneDeep(this.configurationHierarchy);
	}

	printHierarchy(loggerTarget = 'info'): void {
		try {
			const log = this.options.logger[loggerTarget];
			// create separate validator instance not touching configuration system in use
			const validator: Ajv.ValidateFunction = new Ajv(
				this.options.ajvOptions
			).compile(this.schema);
			if (log === undefined) {
				throw new Error('logger target to print hierarchy has not been found.');
			}
			let i = 0;
			let data = {};
			log('Configuration - last configuration hierarchy # has been applied.');
			if (this.runtimeChangesAllowed()) {
				log(
					'Configuration hierarchy displayed contains startup state and does not contain runtime changes!'
				);
			}
			if (Array.isArray(this.configurationHierarchy)) {
				this.configurationHierarchy.forEach((hierarchy) => {
					i += 1;
					log(` Configuration hierarchy #${i}:`);
					log(' - type:', IConfigType[hierarchy.type]);
					if (hierarchy.meta !== undefined) log(' - meta:', hierarchy.meta);
					data = loadash.merge({}, data, hierarchy.data);
					const valid = validator(data);
					log(' - valid, including data from before:', valid);
					if (this.options.plainSecrets === true) {
						log(' - data, including data from before:', data);
					}
					log(
						' - data, including data from before:',
						this.secretCleaner.filterSecretValues(data)
					);
				});
			} else {
				log(' no hierarchy entries found');
			}
		} catch (err) {
			this.options.logger.error(
				'An error occured while printing the configuration history...',
				err
			);
		}
	}

	/**
	 * returns a singleton configuration instance, override defaults using a sc-config.json file based on IConfigOptions in the projects root.
	 *
	 * @returns {Configuration}
	 * @memberof Configuration
	 */
	static get Instance(): Configuration {
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
	update(params: IConfig, options?: IUpdateOptions): boolean {
		this.ensureInitialized();
		this.restrictRuntimeChanges();
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
	reset(params: IConfig): boolean {
		this.ensureInitialized();
		this.restrictRuntimeChanges();
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
	set(key: string, value: any): boolean {
		this.ensureInitialized();
		this.restrictRuntimeChanges();
		const params: IConfig = { [key]: value };
		return this.update(params);
	}

	remove(...keys: string[]): boolean {
		this.ensureInitialized();
		this.restrictRuntimeChanges();
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
		const dataToBeUpdated = loadash.cloneDeep(data);
		const valid = this.validate(dataToBeUpdated) as boolean;
		if (valid) {
			this.data = dataToBeUpdated;
			this.updateConfig();
		} else {
			const message = 'error updating configuration data';
			this.printHierarchy('error');
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
	getErrors = (): [Ajv.ErrorObject | string] | null => {
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
			`The configuration key '${key}' has been used, but it was not defined! Check the given key exists in schema file.` +
			`Set it as required in the schema file, or use Configuration.has('${key}') before using not required properties ` +
			'to be available in the current situation.';
		this.options.logger.error(message);
		if (this.options.throwOnError) {
			throw new ConfigurationError(message);
		}
		return this.options.notFoundValue;
	};

	private loadJSONFromFileName(fullFileName: string): any {
		const fileData = fs.readFileSync(fullFileName, {
			encoding: this.options.fileEncoding,
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

	/**
	 * restrict access to configuration modifying functions if NODE_ENV in option restrictRuntimeChanges. Defaults to 'production'.
	 */
	private restrictRuntimeChanges(): void {
		if (this.readyState < ReadyState.InitFinished) {
			// ignore restrictions during startup
			return;
		}
		if (this.runtimeChangesAllowed()) {
			// ignore if env is whitelisted
			return;
		}
		throw new ConfigurationError(
			`Configuration changes during runtime are not allowed in environment ${this.NODE_ENV}. You may add desired environments to options.allowRuntimeChangesInEnv array to allow runtime changes which are supposed to be only for test reasons.`
		);
	}

	private runtimeChangesAllowed(): boolean {
		return (
			Array.isArray(this.options.allowRuntimeChangesInEnv) &&
			this.options.allowRuntimeChangesInEnv.includes(this.NODE_ENV)
		);
	}
}

export default Configuration.Instance;
