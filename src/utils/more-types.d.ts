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

export type UnderscoreToSpace<T extends string> = T extends `${infer A}_${infer B}` ? `${Capitalize<A>} ${Capitalize<B>}` : Capitalize<T>;
export type SpaceToUnderscore<T extends string> = T extends `${infer A} ${infer B}` ? `${Lowercase<A>}_${Lowercase<B>}` : Lowercase<T>;

export type AllStringCasings<T extends string | number> = `${T}` | Lowercase<`${T}`> | Capitalize<`${T}`> | Uppercase<`${T}`>;
