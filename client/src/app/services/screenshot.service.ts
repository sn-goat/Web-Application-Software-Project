import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';

@Injectable({
    providedIn: 'root',
})
export class ScreenshotService {
    private readonly defaultQuality = 0.9;

    async captureElementAsString(elementId: string, quality: number = this.defaultQuality): Promise<string> {
        const element = document.getElementById(elementId);
        if (!element) {
            return Promise.reject('Element not found');
        }
        try {
            const canvas = await html2canvas(element);
            return canvas.toDataURL('image/jpeg', quality);
        } catch (error) {
            return Promise.reject(`Element conversion to string failed: ${error}`);
        }
    }
}
