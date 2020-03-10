import { IValidator } from '@/interfaces/IValidator';

/**
 * tests a given test number to be gte than value
 * @param value {number}
 */
const min = (value: number): IValidator => (test: number): boolean =>
	test >= value;

/**
 * tests a given test number to be lte than value
 * @param value {number}
 */
const max = (value: number): IValidator => (test: number): boolean =>
	test <= value;

export default { min, max };
