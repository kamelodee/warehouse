declare module 'xlsx' {
    export interface WorkBook {
        SheetNames: string[];
        Sheets: { [key: string]: WorkSheet };
    }

    export interface WorkSheet {
        [key: string]: any;
    }

    export function read(data: any, opts?: any): WorkBook;
    
    export namespace utils {
        export function sheet_to_json<T>(worksheet: WorkSheet, opts?: any): T[];
        export function json_to_sheet<T>(data: T[], opts?: any): WorkSheet;
        export function book_new(): WorkBook;
        export function book_append_sheet(workbook: WorkBook, worksheet: WorkSheet, name: string): void;
    }
    
    export function writeFile(workbook: WorkBook, filename: string, opts?: any): void;
}
