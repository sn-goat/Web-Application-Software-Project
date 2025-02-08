import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';

@Injectable({
    providedIn: 'root',
})
export class ScreenshotService {

    async captureElementAsFile(elementId: string, quality: number = 0.9, fileName: string = 'screenshot.jpg'): Promise<File | null> {
        const element = document.getElementById(elementId);
        if (!element) {
            return null;
        }

        try {
            const canvas = await html2canvas(element);
            const blob = await this.convertCanvasToBlob(canvas, 'image/jpeg', quality);

            if (blob) {
                return new File([blob], fileName, { type: 'image/jpeg' });
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    private async convertCanvasToBlob(canvas: HTMLCanvasElement, format: string, quality: number): Promise<Blob | null> {
        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), format, quality);
        });
    }
}
