import { expect } from 'chai';
import { describe, it } from 'mocha';

import lib from '../../lib';

describe('test library import', () => {
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
		const otherConfiguration = new ConfigurationClass();
		expect(Configuration).to.be.not.equal(otherConfiguration);
		expect(otherConfiguration.has('test')).to.be.false;
		expect(otherConfiguration.has('REQUIRED_CONFIG_PROPERTY')).to.be.true;
		expect(otherConfiguration.get('REQUIRED_CONFIG_PROPERTY')).to.be.true;
	});
});
