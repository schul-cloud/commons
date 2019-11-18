import { expect } from 'chai';
import 'mocha';

import validators from '../../src/validator/array';

describe('test array validators', () => {

	it('test enumerations of numbers', () => {
		const { enumeration } = validators;
		const fut = enumeration(1, 2, 3);
		expect(fut(0)).to.be.false;
		expect(fut(1)).to.be.true;
		expect(fut(3)).to.be.true;
	});

	it('test enumerations of strings', () => {
		const { enumeration } = validators;
		const fut = enumeration('hello', 'world');
		expect(fut('foo')).to.be.false;
		expect(fut('hello')).to.be.true;
		expect(fut('world')).to.be.true;
	});

	it('test mixed input', () => {
		const { enumeration } = validators;
		const fut = enumeration('hello', 'world', 1, 2.3, true);
		expect(fut('foo')).to.be.false;
		expect(fut('hello')).to.be.true;
		expect(fut('world')).to.be.true;
		expect(fut(1)).to.be.true;
		expect(fut(2)).to.be.false;
		expect(fut(2.3)).to.be.true;
		expect(fut(2.4)).to.be.false;
		expect(fut(true)).to.be.true;
		expect(fut(false)).to.be.false;
	});

	it('test invalid input', () => {
		const { enumeration } = validators;
		const fut = enumeration('hello', 'world', 1, 2.3, true);
		expect(fut(2)).to.be.false;
		expect(fut(null)).to.be.false;
		expect(fut(undefined)).to.be.false;
		const futNoParams = enumeration();
		expect(futNoParams(null)).to.be.false;
		expect(futNoParams(undefined)).to.be.false;
	});

});
