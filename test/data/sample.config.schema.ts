import { IConfigSchema } from '../../src/interfaces/IConfigSchema';
import NumberValidator from '../../src/validator/number';
import StringValidator from '../../src/validator/string';

const ConfigSchema: IConfigSchema = {
	'TITLE': {
		type: 'string',
		default: 'sample title',
		validator: [StringValidator.lowerCase()],
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
		validator: [NumberValidator.min(0), NumberValidator.max(42)],
	},
	'SAMPLE.TITLE': {
		type: 'string',
		required: true,
		env: true,
		default: 'hello world',
	},
};


export = ConfigSchema;
