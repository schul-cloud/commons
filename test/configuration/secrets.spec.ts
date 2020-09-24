import { describe, it } from 'mocha';
import { expect } from 'chai';

import { Secrets } from '../../src/configuration/secrets';

describe('cleanup secrets from object properties', () => {
	describe('create hash codes', () => {
		it('works for different input strings', () => {
			expect(Secrets.hashCode('a secret string')).to.be.equal('879162878');
			expect(Secrets.hashCode('a secret string')).to.have.lengthOf(9);

			expect(Secrets.hashCode('another long secret string')).to.be.equal(
				'1746413286'
			);
			expect(
				Secrets.hashCode(
					'another long secret string with special chars 098765432 !"§$%&/()='
				)
			).to.be.equal('2019346594');
		});
		it('results equal for same input', () => {
			const randomStrings = [
				'mdi349fdm34f30f04',
				'f34ofj34fjm4389fmi340kr 0k30fk34f03k0 3k ',
				'3f4jif3mio4k390ifk3490fk934gf34',
			];
			randomStrings.forEach((value) => {
				const result = Secrets.hashCode(value);
				for (let i = 0; i < 5; i += 1) {
					expect(Secrets.hashCode(value)).to.be.equal(result);
				}
			});
		});
	});
});
