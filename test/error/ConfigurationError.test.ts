import { expect } from 'chai';
import 'mocha';
import ConfigurationError from '@/errors/ConfigurationError';

describe('test configuration error', () => {
	it('create error', () => {
		const error = new ConfigurationError('message', { test: 'data' });
		expect(error.message, 'contains stringified data').to.include('test":');
	});
});
