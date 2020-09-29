import loadash from 'lodash';
import ConfigurationError from 'src/errors/ConfigurationError';
import { NonEmptyArray } from 'src/interfaces/NonEmptyArray';

export class SecretCleaner {
	private matches: NonEmptyArray<RegExp>;

	constructor(matches: NonEmptyArray<RegExp>) {
		if (!Array.isArray(matches) || matches.length === 0) {
			throw new ConfigurationError(
				'matches should contain a non empty list of expressions',
				{ matches }
			);
		}
		this.matches = matches;
	}

	/** simple hashing to consider secrets differ or are equal */
	static hashCode(value: string): string {
		let hash = 0;
		for (let i = 0; i < value.length; i++) {
			const char = value.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash; // Convert to 32bit integer
		}
		if (hash < 0) hash *= -1;
		return String(hash);
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
