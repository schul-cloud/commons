import { IValidator } from '@/interfaces/IValidator';

/**
 * validates that test value matches one parameter value.
 * returns always false if no values have been defined.
 * @param values {any}
 */
const enumeration = (...values: any): IValidator => (test: any): boolean =>
	values.length !== 0 && values.indexOf(test) !== -1;

export default { enumeration };
