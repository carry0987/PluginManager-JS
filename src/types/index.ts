export type OperationOptions = {
    verbose?: boolean;
};

export type PackageRule = {
    name: string;
    from?: string;
    to?: string;
    include?: string[];
    exclude?: string[];
    optional?: boolean;
};

export type CopyPackagesOptions = OperationOptions;

export type CopyFilesOptions = OperationOptions & {
    include?: string[];
    exclude?: string[];
};

export type FileEntry = {
    absolutePath: string;
    relativePath: string;
};
