import { expect } from 'chai';
import { describe, it } from 'mocha';
import sinon from 'sinon';

import lib from '../../lib';

describe('test library import', () => {
	before('disable logging', () => {
		sinon.stub(console, 'log'); // disable console.log
		sinon.stub(console, 'info'); // disable console.info
		sinon.stub(console, 'warn'); // disable console.warn
		sinon.stub(console, 'error'); // disable console.error
	});

	it('commons required properties', () => {
		expect(lib, 'default singleton configuration').to.haveOwnProperty(
			'Configuration'
		);
		expect(lib, 'configuration class for testing').to.haveOwnProperty(
			'TestConfiguration'
		);
		expect(lib).to.haveOwnProperty('Validator');
	});

	it('configuration singleton and class import with default schema to be used', () => {
		const { Configuration } = lib;
		expect(Configuration.has('test')).to.be.false;
		const ConfigurationClass = lib.TestConfiguration;
		expect(Configuration).to.be.equal(ConfigurationClass.Instance);
		// surpressed console output of complete node env for next line
		const otherConfiguration = new ConfigurationClass();
		expect(Configuration).to.be.not.equal(otherConfiguration);
		expect(otherConfiguration.has('test')).to.be.false;
		expect(otherConfiguration.has('REQUIRED_CONFIG_PROPERTY')).to.be.true;
		expect(otherConfiguration.get('REQUIRED_CONFIG_PROPERTY')).to.be.true;
	});
});
