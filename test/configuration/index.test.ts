import { expect } from 'chai';
import 'mocha';
import dot from 'dot-object';

import DefaultConfiguration, { Configuration } from '../../src/configuration';
import { IConfigOptions } from '../../src/interfaces/IConfigOptions';

describe('test configuration', () => {

	const options: IConfigOptions = {
		configDir: 'test/data',
	};

	it('test configuration initialization', () => {
		const config = new Configuration();
		expect(config).to.be.not.null;
		expect(config).to.be.not.undefined;
	});

	it('test configuration parser order', () => {
		const config = new Configuration();
		config.init(options);
		expect(config.get('ENV_CONFIG'), 'env specific information overrides default').to.be.equal('test');
		expect(config.get('Boolean')).to.be.equal(true);
	});

	it('test assignmment of default values', () => {
		const options: IConfigOptions = {
			configDir: 'test/data',
			notFoundValue: false,
			throwOnError: false
		};
		const config = new Configuration();
		config.init(options);
		// this will be set as default from schema definition
		expect(config.get('DefaultSample'), 'default value has been applied').to.be.equal('defaultSample');
		// this will be removed because not in schema but in ENV
		expect(options.notFoundValue).to.be.equal(false); // default is null use something different here
		expect(config.get('HOME'), 'returns notFoundValue if not defined').to.be.equal(options.notFoundValue);
	});

	it('test assignmment and re-assignment of valid values', () => {
		const config = new Configuration();
		config.init(options);
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
		const config = new Configuration();
		config.init(Object.assign({}, options, { throwOnError: false }));
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

		const throwingConfig = new Configuration();
		throwingConfig.init(options);

		expect(() => config.set('Number', 'foo'), 'number assignment').to.throw;
		expect(config.get('Number'), 'get Number').to.be.equal(1.3); // value from default.json
		expect(config.getErrors(), 'no errors exist').to.be.not.null;
		expect((config.getErrors() as any[]).length, '1 error exist').to.be.equal(1);

		expect(() => config.set('Integer', 1.3), 'Integer assignment').to.throw;
		expect(config.get('Integer'), 'get Integer').to.be.equal(4); // value from default.json
		expect((config.getErrors() as any[]).length, '1 error exist').to.be.equal(1);

		expect(() => config.set('Boolean', 'foo'), 'Boolean assignment').to.throw;
		expect(config.get('Boolean'), 'get Boolean').to.be.equal(true); // value from test.json
		expect((config.getErrors() as any[]).length, '1 error exist').to.be.equal(1);

	});

	it('test type coersion', () => {
		const config = new Configuration();
		config.init(options);
		expect(config.set('String', false), 'String assignment').to.be.equal(true);
		expect(config.get('String'), 'get String').to.be.equal('false'); // not found value
		expect(config.getErrors(), 'no errors exist').to.be.null;
	});

	it('test environment settings', () => {
		const beforeValue = process.env.Version;
		process.env.Version = "4.5.6";
		const config = new Configuration();
		config.init(options);
		expect(config.get('Version'), 'get Version').to.be.equal('4.5.6'); // not 1.2.3 defined in file
		process.env.Version = beforeValue;
	});

	it('app registration on init', () => {
		const config = new Configuration();
		const app: any = {};
		config.init({ ...options, app });
		expect(app.Config).to.be.equal(config);
	});

	describe('dot notation', () => {

		const options: IConfigOptions = {
			schemaFileName: 'dot.schema.json',
			configDir: 'test/data',
		};

		it('object creation from dot notation', () => {
			const sample = {
				Sample: "sample",
				Nested: {
					foo: "foo",
					bar: "bar"
				},
				Very: { Nested: { Value: "value" } }
			};
			const dotted = dot.dot(sample);
			expect(dotted['Sample']).to.be.equal('sample');
			expect(dotted['Nested.foo']).to.be.equal('foo');
			expect(dotted['Nested.bar']).to.be.equal('bar');
			expect(dotted['Very.Nested.Value']).to.be.equal('value');
		});

		it('create dot notation from object', () => {
			const sample = {
				Sample: "sample",
				"Nested.bar": "bar",
				"Nested.foo": "foo",
				"Very.Nested.Value": "value"
			};
			const objected: any = dot.object(sample);
			expect(objected.Sample).to.be.equal('sample');
			expect(objected.Nested.foo).to.be.equal('foo');
			expect(objected.Nested.bar).to.be.equal('bar');
			expect(objected.Very.Nested.Value).to.be.equal('value');

		});

		it('parse nested from environment', () => {
			process.env['Nested.foo'] = "another bar";
			const config = new Configuration();
			config.init(options);
			config.set('Sample', 'sample');
			expect(config.get('Sample'), 'get Sample').to.be.equal('sample');
			delete process.env['Nested.foo'];
		});

		it('requesting nested values', () => {
			process.env['Nested.foo'] = "another bar";
			const config = new Configuration();
			config.init(options);
			expect(config.get('Nested.foo'), 'get Nested').to.be.equal('another bar');
			delete process.env['Nested.foo'];
		});

		it('set Nested values', () => {
			process.env['Nested.foo'] = "foo";
			process.env['Nested.bar'] = "bar";
			const config = new Configuration();
			config.init(options);
			expect(config.get('Nested.foo'), 'get Nested').to.be.equal('foo');
			config.set('Nested.foo', 'another bar');
			expect(config.get('Nested.foo'), 'get Nested').to.be.equal('another bar');
			expect(config.get('Nested.bar'), 'get Nested').to.be.equal('bar');
			delete process.env['Nested.foo'];
			delete process.env['Nested.bar'];
		});

	});

	describe('singleton', () => {

		const config = DefaultConfiguration;
		config.init(options);

		it('get Instance returns same instance on multiple calls', () => {
			const otherConfig = Configuration.Instance;
			expect(config).to.be.equal(otherConfig);
		});

		it('init runs & accepts options and app defined only once', () => {
			expect(() => config.init(options)).to.throw;
			expect(Configuration.Instance).to.be.equal(config);
		});

	});

	describe('throwing errors', () => {
		it('ensure init required', () => {
			const config = new Configuration();
			expect(() => config.has('foo')).to.throw;
			expect(() => config.get('foo')).to.throw;
			expect(() => config.set('foo', 'bar')).to.throw;
			expect(() => config.toObject()).to.throw;
		});

		it('throws on app has Config property', () => {
			const config = new Configuration();
			const app = { Config: {} };
			expect(() => config.init({ app })).to.throw;
		});
	});


});
