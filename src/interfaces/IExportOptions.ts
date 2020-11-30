export interface IExportOptions {
	/** enable or override to print secrets in printHierarchy or export them in toObject */
	plainSecrets?: boolean;
	/** enforce object style to be selected for export setting this false while useDotNotation is enabled  */
	useDotNotation?: boolean;
}
