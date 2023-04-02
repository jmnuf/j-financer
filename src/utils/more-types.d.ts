/**
 * Type from stackoverflow for not allowing repeated values in function parameters
 * @link https://stackoverflow.com/a/58416611
 */
export type RemoveArrayRepeats<T extends readonly any[]> = {
	[K in keyof T]: (
		T[number] extends { [P in keyof T]: P extends K ? never : T[P] }[number]
		? never
		: T[K]
	)
};
