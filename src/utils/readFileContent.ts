// src/utils/readFileContent.ts
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker?worker';

//pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export async function readFileContent(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  if (file.type === "application/pdf") {
    try {
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let textContent = "";
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(" ");
        textContent += pageText + "\n";
      }

      return textContent;
    } catch (err) {
      console.error("PDF 파싱 오류:", err);
      throw new Error("PDF 파일을 읽는 중 오류 발생");
    }
  }

  // 일반 텍스트 파일
  const decoder = new TextDecoder("utf-8");
  return decoder.decode(arrayBuffer);
}
