import { expect } from 'chai';
import 'mocha';

import validators from '../../src/validator/string';

describe('test string validators', () => {

	it('test regular expressions', () => {
		const { match } = validators;
		const fut = match(/^[a-z]+$/);
		expect(fut('0')).to.be.false;
		expect(fut('ü')).to.be.false;
		expect(fut('hallo')).to.be.true;
		expect(fut('Welt')).to.be.false;
		expect(fut('')).to.be.false;
	});

});
