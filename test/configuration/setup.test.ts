import { expect } from 'chai';
import 'mocha';

import Configuration from '../../src/configuration';

import demoSchema from '../data/sample.schema.json';
import demoData from '../data/sample.config.json';

describe('test configuration', () => {

	it('test configuration initialization', () => {
		const config = new Configuration();
		expect(config).to.be.not.null;
		expect(config).to.be.not.undefined;
	});

	it('test schema assignment to configuration', () => {
		const config = new Configuration();
		config.setSchema(demoSchema);
		expect(config.isValid()).to.be.false;
		expect(Array.isArray(config.getErrors())).to.be.true;
		expect((config.getErrors() as any[]).length).to.be.not.equal(0);
	});

	it('test data assignment to configuration schema', () => {
		const config = new Configuration();
		config.setSchema(demoSchema);
		config.setData(demoData)
		expect(config.isValid()).to.be.true;
		expect(Array.isArray(config.getErrors())).to.be.false;
		expect((config.getErrors() as any[])).to.be.null;
	});



});
