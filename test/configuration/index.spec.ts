import { expect } from 'chai';
import { describe, it } from 'mocha';
import dot from 'dot-object';

import ConfigurationSingleton, {
	Configuration,
	defaultOptions
} from '../../src/configuration';
import { IConfigOptions } from '../../src/interfaces/IConfigOptions';

describe('test configuration', () => {
	const options: IConfigOptions = {
		configDir: 'test/data'
	};

	it('test configuration default initialization', () => {
		const config = new Configuration({
			configDir: 'test/data'
		});
		expect(config).to.be.not.null;
		expect(config).to.be.not.undefined;
	});

	it('test configuration parser order', () => {
		const config = new Configuration(options);
		expect(
			config.get('ENV_CONFIG'),
			'env specific information overrides default'
		).to.be.equal('test');
		expect(config.get('Boolean')).to.be.equal(true);
	});

	it('test assignmment of default values', () => {
		const options: IConfigOptions = {
			configDir: 'test/data',
			notFoundValue: false,
			throwOnError: false
		};
		const config = new Configuration(options);
		// this will be set as default from schema definition
		expect(
			config.get('DefaultSample'),
			'default value has been applied'
		).to.be.equal('defaultSample');
		// this will be removed because not in schema but in ENV
		expect(options.notFoundValue).to.be.equal(false); // default is null use something different here
		expect(
			config.get('HOME'),
			'returns notFoundValue if not defined'
		).to.be.equal(options.notFoundValue);
	});

	it('test assignmment and re-assignment of valid values', () => {
		const config = new Configuration(options);
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
		expect(config.set('Boolean', false), 'boolean assignment').to.be.equal(
			true
		);
		expect(config.get('Boolean'), 'get Boolean').to.be.equal(false);
		expect(config.getErrors(), 'no errors exist').to.be.null;
		expect(config.set('Boolean', true), 'boolean re-assignment').to.be.equal(
			true
		);
		expect(config.get('Boolean'), 'get Boolean').to.be.equal(true);
		expect(config.getErrors(), 'no errors exist').to.be.null;
		expect(config.set('String', 'foo'), 'string assignment').to.be.equal(true);
		expect(config.get('String'), 'get String').to.be.equal('foo');
		expect(config.getErrors(), 'no errors exist').to.be.null;
		expect(config.set('String', 'bar'), 'string re-assignment').to.be.equal(
			true
		);
		expect(config.get('String'), 'get String').to.be.equal('bar');
		expect(config.getErrors(), 'no errors exist').to.be.null;
	});

	it('test assignmment of invalid values fails', () => {
		const config = new Configuration(
			Object.assign({}, options, { throwOnError: false })
		);
		expect(config.set('Number', 'foo'), 'number assignment').to.be.equal(false);
		expect(config.get('Number'), 'get Number').to.be.equal(1.3); // value from default.json
		expect(config.getErrors(), 'no errors exist').to.be.not.null;
		expect((config.getErrors() as any[]).length, '1 error exist').to.be.equal(
			1
		);

		expect(config.set('Integer', 1.3), 'Integer assignment').to.be.equal(false);
		expect(config.get('Integer'), 'get Integer').to.be.equal(4); // value from default.json
		expect((config.getErrors() as any[]).length, '1 error exist').to.be.equal(
			1
		);

		expect(config.set('Boolean', 'foo'), 'Boolean assignment').to.be.equal(
			false
		);
		expect(config.get('Boolean'), 'get Boolean').to.be.equal(true); // value from test.json
		expect((config.getErrors() as any[]).length, '1 error exist').to.be.equal(
			1
		);

		expect(() => config.set('Number', 'foo'), 'number assignment').to.throw;
		expect(config.get('Number'), 'get Number').to.be.equal(1.3); // value from default.json
		expect(config.getErrors(), 'no errors exist').to.be.not.null;
		expect((config.getErrors() as any[]).length, '1 error exist').to.be.equal(
			1
		);

		expect(() => config.set('Integer', 1.3), 'Integer assignment').to.throw;
		expect(config.get('Integer'), 'get Integer').to.be.equal(4); // value from default.json
		expect((config.getErrors() as any[]).length, '1 error exist').to.be.equal(
			1
		);

		expect(() => config.set('Boolean', 'foo'), 'Boolean assignment').to.throw;
		expect(config.get('Boolean'), 'get Boolean').to.be.equal(true); // value from test.json
		expect((config.getErrors() as any[]).length, '1 error exist').to.be.equal(
			1
		);
	});

	it('test type coersion', () => {
		const config = new Configuration(options);
		expect(config.set('String', false), 'String assignment').to.be.equal(true);
		expect(config.get('String'), 'get String').to.be.equal('false'); // not found value
		expect(config.getErrors(), 'no errors exist').to.be.null;
	});

	it('test environment settings', () => {
		const beforeValue = process.env.Version;
		process.env.Version = '4.5.6';
		const config = new Configuration(options);
		expect(config.get('Version'), 'get Version').to.be.equal('4.5.6'); // not 1.2.3 defined in file
		process.env.Version = beforeValue;
	});

	describe('dot notation', () => {
		const options: IConfigOptions = {
			schemaFileName: 'dot.schema.json',
			configDir: 'test/data',
			envDir: 'test/data',
			debug: true
		};
		const { dotNotationSeparator } = defaultOptions;
		const configNestedFoo = 'Nested' + dotNotationSeparator + 'foo';
		const configNestedBar = 'Nested' + dotNotationSeparator + 'bar';

		it('object creation from dot notation', () => {
			const sample = {
				Sample: 'sample',
				Nested: {
					foo: 'foo',
					bar: 'bar'
				},
				Very: { Nested: { Value: 'value' } }
			};

			const dotted = dot.dot(sample);
			expect(dotted['Sample']).to.be.equal('sample');
			expect(dotted['Nested.foo']).to.be.equal('foo');
			expect(dotted['Nested.bar']).to.be.equal('bar');
			expect(dotted['Very.Nested.Value']).to.be.equal('value');
		});

		it('create dot notation from object', () => {
			const sample = {
				Sample: 'sample',
				'Nested.bar': 'bar',
				'Nested.foo': 'foo',
				'Very.Nested.Value': 'value'
			};
			const objected: any = dot.object(sample);
			expect(objected.Sample).to.be.equal('sample');
			expect(objected.Nested.foo).to.be.equal('foo');
			expect(objected.Nested.bar).to.be.equal('bar');
			expect(objected.Very.Nested.Value).to.be.equal('value');
		});

		it('parse nested from environment', () => {
			expect(process.env[configNestedFoo]).to.be.undefined;
			const fooValue = 'foo';
			process.env[configNestedFoo] = fooValue;
			const config = new Configuration(options);
			const sampleValue = 'sample';
			config.set('Sample', sampleValue);
			expect(config.get('Sample'), 'get Sample').to.be.equal(sampleValue);
			expect(config.get(configNestedFoo), 'get Sample').to.be.equal(fooValue);
			delete process.env[configNestedFoo];
			expect(process.env[configNestedFoo]).to.be.undefined;
		});

		it('parse nested property from .env file', () => {
			const configPath = 'TEST__NESTED__DOT_ENV_VALUE'; // defined in .env file in root
			expect(process.env[configPath]).to.be.undefined;
			const config = new Configuration(options);
			const envValue = config.get(configPath);
			expect(envValue).to.be.true;
			expect(process.env[configPath]).to.be.undefined;
		});

		it('requesting nested values', () => {
			process.env[configNestedFoo] = 'another bar';
			const config = new Configuration(options);
			expect(config.get(configNestedFoo), 'get Nested').to.be.equal(
				'another bar'
			);
			delete process.env[configNestedFoo];
		});

		it('set Nested values', () => {
			process.env[configNestedFoo] = 'foo';
			process.env[configNestedBar] = 'bar';
			const config = new Configuration(options);
			expect(config.get(configNestedFoo), 'get Nested').to.be.equal('foo');
			config.set(configNestedFoo, 'another bar');
			expect(config.get(configNestedFoo), 'get Nested').to.be.equal(
				'another bar'
			);
			delete process.env[configNestedFoo];
		});
	});

	describe('project customized option file', () => {
		it('custom dot notation', () => {
			const helloWorld = 'Hello World!';
			ConfigurationSingleton.set('Foo__Bar', helloWorld);
			expect(ConfigurationSingleton.get('Foo__Bar')).to.be.equal(helloWorld);
			const currentConfig = ConfigurationSingleton.toObject();
			expect(currentConfig.Foo).to.exist;
			expect(currentConfig.Foo.Bar).to.exist;
			expect(currentConfig.Foo.Bar).to.be.not.empty;
			expect(currentConfig.Foo.Bar).to.be.equal(helloWorld);
		});
	});

	describe('singleton', () => {
		const config = ConfigurationSingleton;

		it('get Instance returns same instance on multiple calls', () => {
			const otherConfig = Configuration.Instance;
			expect(config).to.be.equal(otherConfig);
		});

		it('new Instance is different to signleton', () => {
			const otherConfig = new Configuration(options);
			expect(otherConfig).to.be.not.equal(config);
		});
	});

	describe('schema dependencies', () => {
		it('property-value based dependency (feature-flag condition)', () => {
			const config = new Configuration({
				schemaFileName: 'dependencies.schema.json',
				configDir: 'test/data'
			});

			expect(config.get('FEATURE_FLAG')).to.be.false;
			expect(() => config.get('FEATURE_OPTION')).to.throw;
			expect(config.get('OTHER_FEATURE_OPTION')).to.be.equal(42);

			const url = 'http://example.tld';
			expect(() => config.set('FEATURE_FLAG', true)).to.throw;
			expect(config.update({ 'FEATURE_OPTION': url, 'FEATURE_FLAG': true })).to.be.true;
			expect(config.get('FEATURE_FLAG')).to.be.true;
			expect(config.get('FEATURE_OPTION')).to.be.equal(url);

		});
	});

	describe('configuration reset', () => {
		it('should reset given values', () => {
			const config = new Configuration({
				schemaFileName: 'default.schema.json',
				configDir: 'test/data'
			});
			const before = config.toObject();
			expect(Object.keys(before).length).to.be.equal(7);
			expect(before['Domain']).to.be.equal('localhost');
			config.set('Domain', 'otherdomain.tld');
			expect(config.get('Domain')).to.be.equal('otherdomain.tld');
			config.reset(before);
			expect(config.get('Domain')).to.be.equal('localhost');
		});
		it('should remove values not set before', () => {
			const config = new Configuration({
				schemaFileName: 'default.schema.json',
				configDir: 'test/data'
			});
			const before = config.toObject();
			expect(Object.keys(before).length).to.be.equal(7);
			expect('String' in before).to.be.false;
			expect(() => config.get('String')).to.throw;
			config.set('String', 'newValueNotDefinedBefore');
			expect(config.get('String')).to.be.equal('newValueNotDefinedBefore');
			config.reset(before);
			expect(() => config.get('String')).to.throw;
		});
	});

	describe('remove single keys from konfiguration', () => {
		it('remove single manually added key', () => {
			const config = new Configuration({
				schemaFileName: 'default.schema.json',
				configDir: 'test/data'
			});
			config.set('String', 'sample');
			const before = config.toObject();
			expect(config.get('String')).to.be.equal('sample');
			expect(config.remove('String')).to.be.equal(true);
			expect(() => config.get('String')).to.throw;
			expect('String' in config.toObject()).to.be.false;
			delete before.String;
			expect(before).to.deep.equal(config.toObject());
		});

		it('remove multiple keys', () => {
			const config = new Configuration({
				schemaFileName: 'default.schema.json',
				configDir: 'test/data'
			});
			config.set('String', 'sample');
			config.set('Boolean', 'true');
			const before = config.toObject();
			expect(config.get('String')).to.be.equal('sample');
			expect(config.get('Boolean')).to.be.equal(true);
			expect(config.remove('String', 'Boolean')).to.be.equal(true);
			expect(() => config.get('String')).to.throw;
			expect(() => config.get('Boolean')).to.throw;
			expect('String' in config.toObject()).to.be.false;
			expect('Boolean' in config.toObject()).to.be.false;
			delete before.String;
			delete before.Boolean;
			expect(before).to.deep.equal(config.toObject());
		});
		it('remove required key fails', () => {
			const config = new Configuration({
				schemaFileName: 'default.schema.json',
				configDir: 'test/data'
			});
			config.set('Domain', 'sample.de');
			const before = config.toObject();
			expect(config.get('Domain')).to.be.equal('sample.de');
			expect(() => config.remove('Domain')).to.throw;
			expect('Domain' in config.toObject()).to.be.true;
			expect(before).to.deep.equal(config.toObject());
		});
	});

});
