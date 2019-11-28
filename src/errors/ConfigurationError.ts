class ConfigurationError extends Error {
	public data: any;
	constructor(message: string, data?: any) {
		super(message);
		this.data = data;
	}
	public toString(): string {
		return this.message + JSON.stringify(this.data);
	}
}

export default ConfigurationError;
