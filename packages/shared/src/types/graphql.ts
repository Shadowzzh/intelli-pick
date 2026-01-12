// packages/shared/src/types/graphql.ts

/** GraphQL 变量类型 */
export type GraphqlVariables = Record<
	string,
	string | number | boolean | string[] | null | undefined
>;

/** GraphQL 错误 */
export interface GraphqlError {
	message: string;
	extensions?: {
		code: string;
	};
}

/** GraphQL 响应类型 */
export interface GraphqlResponse<T> {
	data?: T;
	errors?: GraphqlError[];
}
