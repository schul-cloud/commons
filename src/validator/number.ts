import { IValidator } from '@/interfaces/IValidator';

const min: IValidator = (value: number): any => (test: number): boolean => test >= value;
const max: IValidator = (value: number): any => (test: number): boolean => test <= value;

export default { min, max };
