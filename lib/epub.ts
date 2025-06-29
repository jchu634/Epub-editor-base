import JSZip from "jszip";
import { parseString } from "xml2js";

export interface EpubFile {
    path: string;
    content: string;
    mimeType: string;
}

export interface EpubMetadata {
    title: string;
    author: string;
    language: string;
    identifier: string;
}

export interface EpubManifest {
    id: string;
    href: string;
    mediaType: string;
}

export interface EpubSpine {
    idref: string;
}

export interface EpubStructure {
    metadata: EpubMetadata;
    manifest: EpubManifest[];
    spine: EpubSpine[];
    files: EpubFile[];
}

export class EpubParser {
    static async parseEpub(file: File): Promise<EpubStructure> {
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(file);

        // Read container.xml to find the OPF file
        const containerXml = await zipContent
            .file("META-INF/container.xml")
            ?.async("string");
        if (!containerXml)
            throw new Error("Invalid EPUB: Missing container.xml");

        const opfPath = await this.extractOpfPath(containerXml);
        const opfContent = await zipContent.file(opfPath)?.async("string");
        if (!opfContent) throw new Error("Invalid EPUB: Missing OPF file");

        const opfData = await this.parseOpf(opfContent);

        // Extract all files
        const files: EpubFile[] = [];
        for (const [path, zipEntry] of Object.entries(zipContent.files)) {
            if (!zipEntry.dir) {
                const content = await zipEntry.async("string");
                const mimeType = this.getMimeType(path);
                files.push({ path, content, mimeType });
            }
        }

        return {
            metadata: opfData.metadata,
            manifest: opfData.manifest,
            spine: opfData.spine,
            files,
        };
    }

    private static async extractOpfPath(containerXml: string): Promise<string> {
        return new Promise((resolve, reject) => {
            parseString(containerXml, (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }

                try {
                    const rootfile = result.container.rootfiles[0].rootfile[0];
                    resolve(rootfile.$["full-path"]);
                    // eslint-disable-next-line
                } catch (error) {
                    reject(new Error("Invalid container.xml structure"));
                }
            });
        });
    }

    private static async parseOpf(opfContent: string): Promise<{
        metadata: EpubMetadata;
        manifest: EpubManifest[];
        spine: EpubSpine[];
    }> {
        return new Promise((resolve, reject) => {
            parseString(opfContent, (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }

                try {
                    const pkg = result.package;

                    // Extract metadata
                    const metadata = pkg.metadata[0];
                    const title = metadata["dc:title"]?.[0] || "Unknown Title";
                    const author: string =
                        metadata["dc:creator"]?.[0]?._ ||
                        metadata["dc:creator"]?.[0] ||
                        "Unknown Author";
                    const language = metadata["dc:language"]?.[0] || "en";

                    const identifier =
                        metadata["dc:identifier"]?.[0]?._ ||
                        metadata["dc:identifier"]?.[0] ||
                        "";

                    // Extract manifest
                    const manifest: EpubManifest[] = pkg.manifest[0].item.map(
                        // eslint-disable-next-line
                        (item: any) => ({
                            id: item.$.id,
                            href: item.$.href,
                            mediaType: item.$["media-type"],
                        })
                    );

                    // Extract spine
                    const spine: EpubSpine[] = pkg.spine[0].itemref.map(
                        // eslint-disable-next-line
                        (itemref: any) => ({
                            idref: itemref.$.idref,
                        })
                    );

                    resolve({
                        metadata: { title, author, language, identifier },
                        manifest,
                        spine,
                    });
                    // eslint-disable-next-line
                } catch (error) {
                    reject(new Error("Invalid OPF structure"));
                }
            });
        });
    }

    private static getMimeType(path: string): string {
        const ext = path.split(".").pop()?.toLowerCase();
        const mimeTypes: Record<string, string> = {
            html: "application/xhtml+xml",
            xhtml: "application/xhtml+xml",
            css: "text/css",
            js: "application/javascript",
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
            gif: "image/gif",
            svg: "image/svg+xml",
            ttf: "font/ttf",
            otf: "font/otf",
            woff: "font/woff",
            woff2: "font/woff2",
        };

        return mimeTypes[ext || ""] || "text/plain";
    }

    static async createEpub(structure: EpubStructure): Promise<Blob> {
        const zip = new JSZip();

        // Add mimetype file
        zip.file("mimetype", "application/epub+zip");

        // Add META-INF/container.xml
        const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
        zip.file("META-INF/container.xml", containerXml);

        // Create OPF content
        const opfContent = this.createOpfContent(structure);
        zip.file("OEBPS/content.opf", opfContent);

        // Add all files
        for (const file of structure.files) {
            if (
                !file.path.startsWith("META-INF/") &&
                file.path !== "mimetype"
            ) {
                zip.file(file.path, file.content);
            }
        }

        return await zip.generateAsync({ type: "blob" });
    }

    private static createOpfContent(structure: EpubStructure): string {
        const { metadata, manifest, spine } = structure;

        return `<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${metadata.title}</dc:title>
    <dc:creator>${metadata.author}</dc:creator>
    <dc:language>${metadata.language}</dc:language>
    <dc:identifier id="uid">${metadata.identifier}</dc:identifier>
    <meta property="dcterms:modified">${new Date().toISOString().split(".")[0]}Z</meta>
  </metadata>
  <manifest>
    ${manifest
        .map(
            (item) =>
                `<item id="${item.id}" href="${item.href}" media-type="${item.mediaType}"/>`
        )
        .join("\n    ")}
  </manifest>
  <spine>
    ${spine.map((item) => `<itemref idref="${item.idref}"/>`).join("\n    ")}
  </spine>
</package>`;
    }
}
