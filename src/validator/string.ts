import { IValidator } from '@/interfaces/IValidator';

/**
 * tests a given test string to match a regular expression
 * @param match {expression}
 */
const match = (matcher: RegExp): IValidator => (test: string): boolean =>
	matcher.test(test);

const lowerCase = (): IValidator => (test: string): boolean =>
	test === test.toLowerCase();
const upperCase = (): IValidator => (test: string): boolean =>
	test === test.toUpperCase();

export default { match, lowerCase, upperCase };
