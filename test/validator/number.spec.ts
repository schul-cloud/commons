import { expect } from 'chai';
import 'mocha';

import validators from '../../src/validator/number';

describe('test number validators', () => {
	it('test min value for int and floating numbers', () => {
		const { min } = validators;
		const fut = min(1);
		expect(fut(0)).to.be.false;
		expect(fut(1)).to.be.true;
		expect(fut(2)).to.be.true;
		expect(fut(-1.2)).to.be.false;
		expect(fut(1.0)).to.be.true;
		expect(fut(1.1)).to.be.true;
	});

	it('test max value for int and floating numbers', () => {
		const { max } = validators;
		const fut = max(1);
		expect(fut(0)).to.be.true;
		expect(fut(1)).to.be.true;
		expect(fut(2)).to.be.false;
		expect(fut(-1.2)).to.be.true;
		expect(fut(1.0)).to.be.true;
		expect(fut(1.1)).to.be.false;
	});
});
