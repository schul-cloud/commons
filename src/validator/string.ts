import { IValidator } from '@/interfaces/IValidator';

/**
 * tests a given test string to match a regular expression
 * @param match {expression}
 */
const match = (matcher: RegExp): IValidator => (test: string): boolean => matcher.test(test);

export default { match };
