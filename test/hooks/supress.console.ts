/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-empty-function */

const { log, warn, error } = console;

before(() => {
	//silence the console
	console.log = (): void => {};
	console.warn = (): void => {};
	console.error = (): void => {};
});

after(() => {
	console.log = log;
	console.warn = warn;
	console.error = error;
});
