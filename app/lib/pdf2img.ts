// export interface PdfConversionResult {
//   imageUrl: string;
//   file: File | null;
//   error?: string;
// }

// let pdfjsLib: any = null;
// let loadPromise: Promise<any> | null = null;

// function getWorkerSrc(): string {
//   if (typeof window === "undefined") return "/pdf.worker.min.mjs";

//   return new URL("/pdf.worker.min.mjs", window.location.origin).toString();
// }

// function escapeXml(value: string): string {
//   return value
//     .replace(/&/g, "&amp;")
//     .replace(/</g, "&lt;")
//     .replace(/>/g, "&gt;")
//     .replace(/\"/g, "&quot;")
//     .replace(/'/g, "&#39;");
// }

// function createFallbackImage(file: File, reason?: string): PdfConversionResult {
//   const baseName = file.name.replace(/\.[^/.]+$/, "") || "resume";
//   const svg = `
//     <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600">
//       <rect width="1200" height="1600" fill="#f8fafc" />
//       <rect x="80" y="80" width="1040" height="1440" rx="40" fill="white" stroke="#dbe3ef" stroke-width="6" />
//       <rect x="160" y="220" width="420" height="32" rx="16" fill="#2563eb" />
//       <rect x="160" y="290" width="620" height="24" rx="12" fill="#94a3b8" />
//       <rect x="160" y="340" width="720" height="24" rx="12" fill="#cbd5e1" />
//       <rect x="160" y="430" width="880" height="24" rx="12" fill="#e2e8f0" />
//       <rect x="160" y="480" width="780" height="24" rx="12" fill="#e2e8f0" />
//       <rect x="160" y="530" width="720" height="24" rx="12" fill="#e2e8f0" />
//       <rect x="160" y="620" width="640" height="24" rx="12" fill="#e2e8f0" />
//       <rect x="160" y="670" width="760" height="24" rx="12" fill="#e2e8f0" />
//       <rect x="160" y="720" width="680" height="24" rx="12" fill="#e2e8f0" />
//       <rect x="160" y="820" width="560" height="24" rx="12" fill="#e2e8f0" />
//       <text x="600" y="1280" text-anchor="middle" font-size="54" font-family="Arial, sans-serif" fill="#334155">
//         Preview unavailable
//       </text>
//       <text x="600" y="1350" text-anchor="middle" font-size="32" font-family="Arial, sans-serif" fill="#64748b">
//         ${escapeXml(baseName)}
//       </text>
//       <text x="600" y="1410" text-anchor="middle" font-size="24" font-family="Arial, sans-serif" fill="#94a3b8">
//         ${reason ? escapeXml(reason) : "A fallback preview was generated."}
//       </text>
//     </svg>`;

//   const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
//   const imageFile = new File([blob], `${baseName}.svg`, {
//     type: "image/svg+xml",
//   });

//   return {
//     imageUrl: URL.createObjectURL(blob),
//     file: imageFile,
//     error: reason,
//   };
// }

// async function loadPdfJs(): Promise<any> {
//   if (pdfjsLib) return pdfjsLib;
//   if (loadPromise) return loadPromise;

//   loadPromise = (async () => {
//     try {
//       // @ts-expect-error - pdfjs-dist/build/pdf.mjs is not a module
//       const lib = await import("pdfjs-dist/build/pdf.mjs");
//       lib.GlobalWorkerOptions.workerSrc = getWorkerSrc();
//       pdfjsLib = lib;
//       return lib;
//     } catch (error) {
//       const legacyLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
//       legacyLib.GlobalWorkerOptions.workerSrc = getWorkerSrc();
//       pdfjsLib = legacyLib;
//       return legacyLib;
//     }
//   })();

//   return loadPromise;
// }

// export async function convertPdfToImage(
//   file: File,
// ): Promise<PdfConversionResult> {
//   if (file.type && !file.type.includes("pdf")) {
//     return createFallbackImage(
//       file,
//       "The uploaded file is not a PDF, so a placeholder preview was generated.",
//     );
//   }

//   try {
//     const lib = await loadPdfJs();

//     const arrayBuffer = await file.arrayBuffer();
//     const pdf = await lib.getDocument({
//       data: arrayBuffer,
//       useWorkerFetch: false,
//       disableFontFace: true,
//       stopAtErrors: false,
//     }).promise;
//     const page = await pdf.getPage(1);

//     const viewport = page.getViewport({ scale: 4 });
//     const canvas = document.createElement("canvas");
//     const context = canvas.getContext("2d");

//     canvas.width = viewport.width;
//     canvas.height = viewport.height;

//     if (context) {
//       context.imageSmoothingEnabled = true;
//       context.imageSmoothingQuality = "high";
//     }

//     if (!context) {
//       return {
//         imageUrl: "",
//         file: null,
//         error: "Your browser could not create a canvas for PDF preview.",
//       };
//     }

//     await page.render({ canvasContext: context, viewport }).promise;

//     return new Promise((resolve) => {
//       canvas.toBlob(
//         (blob) => {
//           if (blob) {
//             const originalName = file.name.replace(/\.pdf$/i, "");
//             const imageFile = new File([blob], `${originalName}.png`, {
//               type: "image/png",
//             });

//             resolve({
//               imageUrl: URL.createObjectURL(blob),
//               file: imageFile,
//             });
//           } else {
//             resolve(
//               createFallbackImage(
//                 file,
//                 "The browser could not create an image blob.",
//               ),
//             );
//           }
//         },
//         "image/png",
//         1.0,
//       );
//     });
//   } catch (err) {
//     return createFallbackImage(
//       file,
//       err instanceof Error
//         ? err.message
//         : "The PDF preview could not be generated.",
//     );
//   }
// }

export interface PdfConversionResult {
  imageUrl: string;
  file: File | null;
  error?: string;
}

let pdfjsLib: any = null;
let loadPromise: Promise<any> | null = null;

function getWorkerSrc(): string {
  if (typeof window === "undefined") return "/pdf.worker.min.mjs";

  return new URL("/pdf.worker.min.mjs", window.location.origin).toString();
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("The preview image could not be encoded."));
    };
    reader.onerror = () =>
      reject(reader.error || new Error("Failed to read preview image."));
    reader.readAsDataURL(blob);
  });
}

async function createFallbackImage(
  file: File,
  reason?: string,
): Promise<PdfConversionResult> {
  const baseName = file.name.replace(/\.[^/.]+$/, "") || "resume";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600">
      <rect width="1200" height="1600" fill="#f8fafc" />
      <rect x="80" y="80" width="1040" height="1440" rx="40" fill="white" stroke="#dbe3ef" stroke-width="6" />
      <rect x="160" y="220" width="420" height="32" rx="16" fill="#2563eb" />
      <rect x="160" y="290" width="620" height="24" rx="12" fill="#94a3b8" />
      <rect x="160" y="340" width="720" height="24" rx="12" fill="#cbd5e1" />
      <rect x="160" y="430" width="880" height="24" rx="12" fill="#e2e8f0" />
      <rect x="160" y="480" width="780" height="24" rx="12" fill="#e2e8f0" />
      <rect x="160" y="530" width="720" height="24" rx="12" fill="#e2e8f0" />
      <rect x="160" y="620" width="640" height="24" rx="12" fill="#e2e8f0" />
      <rect x="160" y="670" width="760" height="24" rx="12" fill="#e2e8f0" />
      <rect x="160" y="720" width="680" height="24" rx="12" fill="#e2e8f0" />
      <rect x="160" y="820" width="560" height="24" rx="12" fill="#e2e8f0" />
      <text x="600" y="1280" text-anchor="middle" font-size="54" font-family="Arial, sans-serif" fill="#334155">
        Preview unavailable
      </text>
      <text x="600" y="1350" text-anchor="middle" font-size="32" font-family="Arial, sans-serif" fill="#64748b">
        ${escapeXml(baseName)}
      </text>
      <text x="600" y="1410" text-anchor="middle" font-size="24" font-family="Arial, sans-serif" fill="#94a3b8">
        ${reason ? escapeXml(reason) : "A fallback preview was generated."}
      </text>
    </svg>`;

  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const imageFile = new File([blob], `${baseName}.svg`, {
    type: "image/svg+xml",
  });

  const imageUrl = await blobToDataUrl(blob);

  return {
    imageUrl,
    file: imageFile,
    error: reason,
  };
}

async function loadPdfJs(): Promise<any> {
  if (pdfjsLib) return pdfjsLib;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      // @ts-expect-error - pdfjs-dist/build/pdf.mjs is not a module
      const lib = await import("pdfjs-dist/build/pdf.mjs");
      lib.GlobalWorkerOptions.workerSrc = getWorkerSrc();
      pdfjsLib = lib;
      return lib;
    } catch (error) {
      const legacyLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
      legacyLib.GlobalWorkerOptions.workerSrc = getWorkerSrc();
      pdfjsLib = legacyLib;
      return legacyLib;
    }
  })();

  return loadPromise;
}

export async function convertPdfToImage(
  file: File,
): Promise<PdfConversionResult> {
  if (file.type && !file.type.includes("pdf")) {
    return createFallbackImage(
      file,
      "The uploaded file is not a PDF, so a placeholder preview was generated.",
    );
  }

  try {
    const lib = await loadPdfJs();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await lib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      disableFontFace: true,
      stopAtErrors: false,
    }).promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 4 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    if (context) {
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
    }

    if (!context) {
      return {
        imageUrl: "",
        file: null,
        error: "Your browser could not create a canvas for PDF preview.",
      };
    }

    await page.render({ canvasContext: context, viewport }).promise;

    return new Promise((resolve) => {
      canvas.toBlob(
        async (blob) => {
          if (blob) {
            const originalName = file.name.replace(/\.pdf$/i, "");
            const imageFile = new File([blob], `${originalName}.png`, {
              type: "image/png",
            });

            const imageUrl = await blobToDataUrl(blob);

            resolve({
              imageUrl,
              file: imageFile,
            });
          } else {
            resolve(
              await createFallbackImage(
                file,
                "The browser could not create an image blob.",
              ),
            );
          }
        },
        "image/png",
        1.0,
      );
    });
  } catch (err) {
    return createFallbackImage(
      file,
      err instanceof Error
        ? err.message
        : "The PDF preview could not be generated.",
    );
  }
}
