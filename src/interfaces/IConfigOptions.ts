export interface IConfigOptions {
	/**
	 * if true, will recalculate values on every request.
	 * default: load config once on application start
	 *
	 * @type {boolean}
	 * @memberof IConfigOptions
	 */
	hot?: boolean;
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
	throwOnUndefined?: boolean;
}
