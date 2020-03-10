/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-empty-function */

const { log, warn } = console;

before(() => {
	//silence the console
	console.log = (): void => { };
	console.warn = (): void => { };
});

after(() => {
	console.log = log;
	console.warn = warn;
});
