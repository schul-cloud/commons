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

	it('test is uppercase', () => {
		const { upperCase } = validators;
		expect(upperCase()('upperCase')).to.be.false;
		expect(upperCase()('UPPERCASE')).to.be.true;
		expect(upperCase()('UPPERCAS3')).to.be.true;
		expect(upperCase()('UPPERCaS3')).to.be.false;
	});

	it('test is lowercase', () => {
		const { lowerCase } = validators;
		expect(lowerCase()('lowerCase')).to.be.false;
		expect(lowerCase()('lowercase')).to.be.true;
		expect(lowerCase()('low123')).to.be.true;
		expect(lowerCase()('lowER123')).to.be.false;
	});
});
