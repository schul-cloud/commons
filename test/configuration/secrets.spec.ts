import { describe, it } from 'mocha';
import { expect } from 'chai';

import { SecretCleaner } from '../../src/configuration/secretCleaner';

describe('cleanup secrets from object properties', () => {
	describe('create hash codes', () => {
		it('works for different input strings', () => {
			expect(SecretCleaner.hashCode('a secret string')).to.be.equal(
				'879162878'
			);
			expect(SecretCleaner.hashCode('a secret string')).to.have.lengthOf(9);

			expect(SecretCleaner.hashCode('another long secret string')).to.be.equal(
				'1746413286'
			);
			expect(
				SecretCleaner.hashCode(
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
				const result = SecretCleaner.hashCode(value);
				for (let i = 0; i < 5; i += 1) {
					expect(SecretCleaner.hashCode(value)).to.be.equal(result);
				}
			});
		});
		it('filterSecretValues replaces matching secrets', () => {
			const sample = {
				foo: 'not replaced',
				bar: 'not replaced too',
				ANY_KEY: 'should be replaced',
				SALT: 'should be replaced too',
			};
			const secretCleaner = new SecretCleaner([/KEY/gi, /SALT/gi]);
			const cleanSample = secretCleaner.filterSecretValues(sample);
			expect(cleanSample.foo).to.be.equal('not replaced');
			expect(cleanSample.bar).to.be.equal('not replaced too');
			expect(cleanSample.ANY_KEY).to.be.equal('<secret#745758848>');
			expect(cleanSample.SALT).to.be.equal('<secret#182414772>');
		});
	});
});
