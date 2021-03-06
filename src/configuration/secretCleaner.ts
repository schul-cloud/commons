import loadash from 'lodash';
import ConfigurationError from '../errors/ConfigurationError';
import { NonEmptyArray } from '../interfaces/NonEmptyArray';
import { createHash } from 'crypto';
export class SecretCleaner {
	private matches: NonEmptyArray<RegExp>;
	private static flags: 'gi';

	constructor(matches: NonEmptyArray<string>) {
		if (!Array.isArray(matches) || matches.length === 0) {
			throw new ConfigurationError(
				'matches should contain a non empty list of expressions',
				{ matches }
			);
		}
		this.matches = matches.map(
			(match) => new RegExp(match, SecretCleaner.flags)
		) as NonEmptyArray<RegExp>;
	}

	/** simple hashing to consider secrets differ or are equal */
	static hashCode(value: string): string {
		return createHash('sha256').update(value).digest('base64');
	}

	/** filters an object against secret values in strings and returns a cleaned deep copy */
	filterSecretValues(data: any): any {
		const filteredData = loadash.cloneDeep(data);
		Object.keys(filteredData).forEach((key) => {
			if (
				typeof filteredData[key] === 'string' &&
				this.matches.some((expression) => expression.exec(key))
			) {
				filteredData[key] =
					'<secret#' + SecretCleaner.hashCode(filteredData[key]) + '>';
			} else if (typeof filteredData[key] === 'object') {
				filteredData[key] = this.filterSecretValues(filteredData[key]);
			}
		});
		return filteredData;
	}
}
