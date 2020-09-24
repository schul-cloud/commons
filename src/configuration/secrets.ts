import loadash from 'lodash';

export class Secrets {
	private static matches = [/SECRET/gi, /KEY/gi];

	/** simple hashing to consider secrets differ or are equal */
	public static hashCode(value: string): string {
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
	public static filterSecretValues(data: any): any {
		const filteredData = loadash.cloneDeep(data);
		Object.keys(filteredData).forEach((key) => {
			if (
				typeof filteredData[key] === 'string' &&
				Secrets.matches.some((expression) => expression.exec(key))
			) {
				filteredData[key] =
					'<secret#' + Secrets.hashCode(filteredData[key]) + '>';
			} else if (typeof filteredData[key] === 'object') {
				filteredData[key] = Secrets.filterSecretValues(filteredData[key]);
			}
		});
		return filteredData;
	}
}
