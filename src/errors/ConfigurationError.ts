class ConfigurationError extends Error {
	public data: any;
	constructor(message: string, data?: any) {
		super(message);
		this.name = 'Configuration Error';
		this.data = data;
		let dataJsonString = '[error retrieving data]';
		try {
			if (data) {
				dataJsonString = JSON.stringify(data);
			} else {
				dataJsonString = '[no data defined]';
			}
		} catch (e) {
			console.error('error parsing data', e);
		}
		this.message += ' ' + dataJsonString;
	}
}

export default ConfigurationError;
