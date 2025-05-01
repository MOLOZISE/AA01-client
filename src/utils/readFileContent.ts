// src/utils/readFileContent.ts

import * as pdfjsLib from "pdfjs-dist";

export async function readFileContent(file: File): Promise<string> {
  if (file.type === "text/plain") {
    return await readTextFile(file);
  } else if (file.type === "application/pdf") {
    return await readPdfFile(file);
  } else {
    throw new Error("지원하지 않는 파일 형식입니다.");
  }
}

async function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      reject(new Error("텍스트 파일을 읽는 중 오류 발생"));
    };
    reader.readAsText(file);
  });
}

async function readPdfFile(file: File): Promise<string> {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      try {
        const typedarray = new Uint8Array(reader.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;

        let textContent = "";
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const content = await page.getTextContent();
          const pageText = content.items.map((item: any) => item.str).join(" ");
          textContent += pageText + " ";
        }
        resolve(textContent);
      } catch (err) {
        reject(new Error("PDF 파일을 읽는 중 오류 발생"));
      }
    };
    reader.onerror = () => {
      reject(new Error("파일을 읽는 중 오류 발생"));
    };
    reader.readAsArrayBuffer(file);
  });
}
