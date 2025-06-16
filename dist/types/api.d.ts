export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    count?: number;
}
export interface DatabaseRow {
    [key: string]: any;
}
export interface PaginationParams {
    page?: number;
    limit?: number;
    offset?: number;
}
export interface QueryParams {
    [key: string]: string | number | boolean | undefined;
}
//# sourceMappingURL=api.d.ts.map