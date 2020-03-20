export interface IConfigOptions {
	/**
	* set a custom logger
	*
	* @type {*}
	* @memberof IConfigOptions
	*/
	logger?: any;
	/**
	* throw an error when an undefined value is requested
	*
	* @type {boolean}
	* @memberof IConfigOptions
	*/
	throwOnError?: boolean;
	/**
	* If throwOnUndefined is not true, the default return value which is null may be overriden using this property.
	*
	* @type {*}
	* @memberof IConfigOptions
	*/
	notFoundValue?: any;
	configDir?: string;
	/**
	* enables debugging output for dotenv
	*/
	debug?: boolean;
	envDir?: string;
	baseDir?: string;
	schemaFileName?: string;
	useDotNotation?: boolean;
	fileEncoding?: string;
	app?: any;
}
