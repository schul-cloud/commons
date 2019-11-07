import { IConfigSchema } from '../../src/interfaces/IConfigSchema';
import { min, max } from '../../src/validator/number';

const ConfigSchema: IConfigSchema = {
	'TITLE': {
		type: 'string',
		default: 'sample title',
		// validator: ['lowercase'],
		description: 'this is a sample text',
	},
	'SAMPLE_NUMBER': {
		type: 'number',
		default: 42,
		env: true,
		description: 'this is a magic number',
	},
	'SAMPLE.NUMBER': {
		type: 'integer',
		required: true,
		env: true,
		default: '21',
		validator: [min(0), max(42)],
	},
	'SAMPLE.TITLE': {
		type: 'string',
		required: true,
		env: true,
		default: 'hello world',
		converter: 'uppercase',
	},
};


export = ConfigSchema;
