import { TestBed } from '@angular/core/testing';
import { ScreenshotService } from './screenshot.service';
import html2canvas from 'html2canvas';

describe('ScreenshotService', () => {
    let service: ScreenshotService;
    let html2canvasSpy: jasmine.Spy;
    let mockCanvas: HTMLCanvasElement;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ScreenshotService],
        });

        service = TestBed.inject(ScreenshotService);

        // Create a mock canvas object
        mockCanvas = document.createElement('canvas');

        // Spy on html2canvas once in beforeEach
        html2canvasSpy = spyOn<any>(html2canvas, 'call').and.returnValue(Promise.resolve(mockCanvas));
    });

    afterEach(() => {
        html2canvasSpy.calls.reset(); // Reset spy calls after each test
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should reject if the element is not found', async () => {
        spyOn(document, 'getElementById').and.returnValue(null);

        await expectAsync(service.captureElementAsString('invalidId')).toBeRejectedWith('Element not found');
    });

    it('should capture an element and return a base64 string', async () => {
        const mockElement = document.createElement('img');
        mockElement.id = 'mockElement';
        document.body.appendChild(mockElement);

        spyOn(document, 'getElementById').and.returnValue(mockElement);
        spyOn(mockCanvas, 'toDataURL').and.returnValue('data:image/jpeg;base64,mockbase64data');

        const result = await service.captureElementAsString('mockElement', 0.8);

        expect(result).toBe('data:image/jpeg;base64,mockbase64data');
        expect(html2canvasSpy).toHaveBeenCalledWith(mockElement);
    }, 1000000);

    it('should fully execute the try block (html2canvas and toDataURL)', async () => {
        const mockElement = document.createElement('div');
        spyOn(document, 'getElementById').and.returnValue(mockElement);

        const result = await service.captureElementAsString('validId', 0.9);

        expect(html2canvasSpy).toHaveBeenCalledWith(mockElement);
        expect(result).toBe('data:image/jpeg;base64,mockbase64data');
    });

    it('should reject if html2canvas throws an error', async () => {
        const mockElement = document.createElement('div');
        spyOn(document, 'getElementById').and.returnValue(mockElement);

        html2canvasSpy.and.returnValue(Promise.reject(new Error('html2canvas error')));

        await expectAsync(service.captureElementAsString('validId')).toBeRejectedWith(
            'Element conversion to string failed: Error: html2canvas error',
        );
    });

    it('should enter the catch block and reject correctly', async () => {
        const mockElement = document.createElement('div');
        spyOn(document, 'getElementById').and.returnValue(mockElement);

        html2canvasSpy.and.returnValue(Promise.reject('Unexpected error'));

        await expectAsync(service.captureElementAsString('validId')).toBeRejectedWith('Element conversion to string failed: Unexpected error');
    });
});
