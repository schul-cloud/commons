import '../hooks/supress.console';
import { expect } from 'chai';
import 'mocha';
import ConfigurationError from '@/errors/ConfigurationError';

describe('test configuration error', () => {
	it('create error without data', () => {
		const error = new ConfigurationError('message');
		expect(error.message, 'contains stringified data').to.include(
			'[no data defined]'
		);
	});

	it('create error with data', () => {
		const error = new ConfigurationError('message', { test: 'data' });
		expect(error.message, 'contains stringified data').to.include('test":');
	});

	it('create error with non-json data', () => {
		const error = new ConfigurationError('title', 'hello world');
		expect(error.message, 'contains stringified data').to.include('title');
		expect(error.message, 'contains stringified data').to.include(
			'hello world'
		);
	});

	it('create error with malformed data', () => {
		const data: any = { foo: 'bar' };
		data['data'] = data;
		const error = new ConfigurationError('error with loop data', data);
		expect(error.message, 'contains stringified data').to.include(
			'[error retrieving data]'
		);
	});
});
