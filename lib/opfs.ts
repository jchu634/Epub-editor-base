export class OPFSManager {
    private static instance: OPFSManager;
    private root: FileSystemDirectoryHandle | null = null;

    private constructor() {}

    static getInstance(): OPFSManager {
        if (!OPFSManager.instance) {
            OPFSManager.instance = new OPFSManager();
        }
        return OPFSManager.instance;
    }

    async initialize(): Promise<boolean> {
        try {
            if (
                !("storage" in navigator) ||
                !("getDirectory" in navigator.storage)
            ) {
                throw new Error("OPFS not supported");
            }

            this.root = await navigator.storage.getDirectory();
            return true;
        } catch (error) {
            console.error("Failed to initialize OPFS:", error);
            return false;
        }
    }

    async createProject(projectId: string): Promise<FileSystemDirectoryHandle> {
        if (!this.root) throw new Error("OPFS not initialized");

        return await this.root.getDirectoryHandle(projectId, { create: true });
    }

    async getProject(
        projectId: string
    ): Promise<FileSystemDirectoryHandle | null> {
        if (!this.root) throw new Error("OPFS not initialized");

        try {
            return await this.root.getDirectoryHandle(projectId);
        } catch {
            return null;
        }
    }

    async listProjects(): Promise<string[]> {
        if (!this.root) throw new Error("OPFS not initialized");

        const projects: string[] = [];
        // @ts-ignore
        for await (const [name, handle] of this.root.entries()) {
            if (handle.kind === "directory") {
                projects.push(name);
            }
        }
        return projects;
    }

    async deleteProject(projectId: string): Promise<void> {
        if (!this.root) throw new Error("OPFS not initialized");

        await this.root.removeEntry(projectId, { recursive: true });
    }

    async writeFile(
        projectId: string,
        filePath: string,
        content: string | ArrayBuffer
    ): Promise<void> {
        const projectDir = await this.getProject(projectId);
        if (!projectDir) throw new Error("Project not found");

        const pathParts = filePath.split("/");
        let currentDir = projectDir;

        // Create nested directories if needed
        for (let i = 0; i < pathParts.length - 1; i++) {
            currentDir = await currentDir.getDirectoryHandle(pathParts[i], {
                create: true,
            });
        }

        const fileName = pathParts[pathParts.length - 1];
        const fileHandle = await currentDir.getFileHandle(fileName, {
            create: true,
        });
        const writable = await fileHandle.createWritable();

        await writable.write(content);
        await writable.close();
    }

    async readFile(projectId: string, filePath: string): Promise<string> {
        const projectDir = await this.getProject(projectId);
        if (!projectDir) throw new Error("Project not found");

        const pathParts = filePath.split("/");
        let currentDir = projectDir;

        // Navigate to the file's directory
        for (let i = 0; i < pathParts.length - 1; i++) {
            currentDir = await currentDir.getDirectoryHandle(pathParts[i]);
        }

        const fileName = pathParts[pathParts.length - 1];
        const fileHandle = await currentDir.getFileHandle(fileName);
        const file = await fileHandle.getFile();

        return await file.text();
    }

    async listFiles(
        projectId: string,
        dirPath: string = ""
    ): Promise<{ name: string; type: "file" | "directory" }[]> {
        const projectDir = await this.getProject(projectId);
        if (!projectDir) throw new Error("Project not found");

        let currentDir = projectDir;
        if (dirPath) {
            const pathParts = dirPath.split("/");
            for (const part of pathParts) {
                currentDir = await currentDir.getDirectoryHandle(part);
            }
        }

        const items: { name: string; type: "file" | "directory" }[] = [];
        // @ts-ignore
        for await (const [name, handle] of currentDir.entries()) {
            items.push({
                name,
                type: handle.kind === "directory" ? "directory" : "file",
            });
        }

        return items;
    }

    async listAllFilesAndDirectories(
        projectId: string
    ): Promise<
        { name: string; type: "file" | "directory"; fullPath: string }[]
    > {
        const projectDir = await this.getProject(projectId);
        if (!projectDir) throw new Error("Project not found");

        const items: {
            name: string;
            type: "file" | "directory";
            fullPath: string;
        }[] = [];

        const traverseDirectory = async (
            dir: FileSystemDirectoryHandle,
            currentPath: string = ""
        ) => {
            // @ts-ignore
            for await (const [name, handle] of dir.entries()) {
                const fullPath = currentPath ? `${currentPath}/${name}` : name;

                items.push({
                    name,
                    type: handle.kind === "directory" ? "directory" : "file",
                    fullPath,
                });

                // If it's a directory, recursively traverse it
                if (handle.kind === "directory") {
                    await traverseDirectory(handle, fullPath);
                }
            }
        };

        await traverseDirectory(projectDir);
        return items;
    }

    isSupported(): boolean {
        return "storage" in navigator && "getDirectory" in navigator.storage;
    }
}
