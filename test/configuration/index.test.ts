import { expect } from 'chai';
import 'mocha';

import { Configuration } from '../../src/configuration';
import { IConfigOptions } from '../../src/interfaces/IConfigOptions';

describe('test configuration', () => {

	const options: IConfigOptions = {
		configDir: 'test/data',

	}

	it('test configuration initialization', () => {
		const config = new Configuration();
		expect(config).to.be.not.null;
		expect(config).to.be.not.undefined;
	});

	it('test configuration parser order', () => {
		const config = new Configuration(options);
		config.init();
		expect(config.get('ENV_CONFIG'), 'env specific information overrides default').to.be.equal('test');
		expect(config.get('Boolean')).to.be.equal(true);
	});

	it('test assignmment of default values', () => {
		const options = {
			configDir: 'test/data',
			notFoundValue: false,
		};
		const config = new Configuration(options);
		config.init();
		// this will be set as default from schema definition
		expect(config.get('DefaultSample'), 'default value has been applied').to.be.equal('defaultSample');
		// this will be removed because not in schema but in ENV
		expect(options.notFoundValue).to.be.equal(false); // default is null use something different here
		expect(config.get('HOME'), 'returns notFoundValue if not defined').to.be.equal(options.notFoundValue);
	});

	it('test assignmment and re-assignment of valid values', () => {
		const config = new Configuration(options);
		config.init();
		expect(config.set('Number', 1.0), 'number assignment').to.be.equal(true);
		expect(config.get('Number'), 'get Number').to.be.equal(1.0);
		expect(config.getErrors(), 'no errors exist').to.be.null;
		expect(config.set('Number', 2.2), 'number re-assignment').to.be.equal(true);
		expect(config.get('Number'), 'get Number').to.be.equal(2.2);
		expect(config.getErrors(), 'no errors exist').to.be.null;
		expect(config.set('Integer', 1), 'integer assignment').to.be.equal(true);
		expect(config.get('Integer'), 'get Integer').to.be.equal(1);
		expect(config.getErrors(), 'no errors exist').to.be.null;
		expect(config.set('Integer', 2), 'integer re-assignment').to.be.equal(true);
		expect(config.get('Integer'), 'get Integer').to.be.equal(2);
		expect(config.getErrors(), 'no errors exist').to.be.null;
		expect(config.set('Boolean', false), 'boolean assignment').to.be.equal(true);
		expect(config.get('Boolean'), 'get Boolean').to.be.equal(false);
		expect(config.getErrors(), 'no errors exist').to.be.null;
		expect(config.set('Boolean', true), 'boolean re-assignment').to.be.equal(true);
		expect(config.get('Boolean'), 'get Boolean').to.be.equal(true);
		expect(config.getErrors(), 'no errors exist').to.be.null;
		expect(config.set('String', 'foo'), 'string assignment').to.be.equal(true);
		expect(config.get('String'), 'get String').to.be.equal('foo');
		expect(config.getErrors(), 'no errors exist').to.be.null;
		expect(config.set('String', 'bar'), 'string re-assignment').to.be.equal(true);
		expect(config.get('String'), 'get String').to.be.equal('bar');
		expect(config.getErrors(), 'no errors exist').to.be.null;
	});

	it('test assignmment of invalid values fails', () => {
		const config = new Configuration(options);
		config.init();
		expect(config.set('Number', 'foo'), 'number assignment').to.be.equal(false);
		expect(config.get('Number'), 'get Number').to.be.equal(1.3); // value from default.json
		expect(config.getErrors(), 'no errors exist').to.be.not.null;
		expect((config.getErrors() as any[]).length, '1 error exist').to.be.equal(1);

		expect(config.set('Integer', 1.3), 'Integer assignment').to.be.equal(false);
		expect(config.get('Integer'), 'get Integer').to.be.equal(4); // value from default.json
		expect((config.getErrors() as any[]).length, '1 error exist').to.be.equal(1);

		expect(config.set('Boolean', 'foo'), 'Boolean assignment').to.be.equal(false);
		expect(config.get('Boolean'), 'get Boolean').to.be.equal(true); // value from test.json
		expect((config.getErrors() as any[]).length, '1 error exist').to.be.equal(1);
	});

	it('test type coersion', () => {
		const config = new Configuration(options);
		config.init();
		expect(config.set('String', false), 'String assignment').to.be.equal(true);
		expect(config.get('String'), 'get String').to.be.equal('false'); // not found value
		expect(config.getErrors(), 'no errors exist').to.be.null;
	})

	it('test environment settings', () => {
		const beforeValue = process.env.Version;
		process.env.Version = "4.5.6";
		const config = new Configuration(options);
		config.init();
		expect(config.get('Version'), 'get Version').to.be.equal('4.5.6'); // not 1.2.3 defined in file
		process.env.Version = beforeValue;
	})

	describe('dot notation', () => {

	});

	describe('singleton', () => {

	})

});
