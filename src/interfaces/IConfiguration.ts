export interface IConfiguration {
	get(key: string): any;
	has(key: string): boolean;
	set(key: string, value: any): void;
	isValid(): boolean;
}
