import { TestBed } from '@angular/core/testing';
import { ScreenshotService } from './screenshot.service';
import html2canvas from 'html2canvas';

describe('ScreenshotService', () => {
    let service: ScreenshotService;
    let html2canvasSpy: jasmine.Spy;
    let mockCanvas: HTMLElement;
    let mockCanvasElement: HTMLCanvasElement;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ScreenshotService],
        });

        service = TestBed.inject(ScreenshotService);

        // Create a mock element


        // Create a mock canvas with toDataURL
        mockCanvasElement = document.createElement('canvas');

        // Correctly spy on `html2canvas` function
        html2canvasSpy = spyOn<any>(html2canvas, 'apply').and.callFake(async () => mockCanvasElement);
    });

    afterEach(() => {
        html2canvasSpy.calls.reset(); // Reset spy calls after each test
    });

    it('should capture an element and return a base64 string', async () => {
        document.body.appendChild(mockCanvasElement);
        mockCanvasElement.id = 'mockElement';

        spyOn(document, 'getElementById').and.returnValue(mockCanvasElement);
        spyOn(mockCanvasElement, 'toDataURL').and.returnValue('data:image/jpeg;base64,');

        const result = await service.captureElementAsString('mockElement', 0.8);

        expect(result).toMatch(/^data:image\/jpeg;base64,/);
        // expect(html2canvasSpy).toHaveBeenCalledWith(mockCanvasElement);
    }, 1000000);

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should reject if the element is not found', async () => {
        spyOn(document, 'getElementById').and.returnValue(null);

        await expectAsync(service.captureElementAsString('invalidId')).toBeRejectedWith(new Error('Element not found'));
    });

    it('should fully execute the try block (html2canvas and toDataURL)', async () => {
        spyOn(document, 'getElementById').and.returnValue(mockCanvas);

        const result = await service.captureElementAsString('mockElement', 0.9);

        expect(html2canvasSpy).toHaveBeenCalledWith('mockElement');
        expect(result).toMatch(/^data:image\/jpeg;base64,/);
    });

    it('should reject if html2canvas throws an error', async () => {

        spyOn(document, 'getElementById').and.returnValue(mockCanvas);

        html2canvasSpy.and.returnValue(Promise.reject(new Error('html2canvas error')));

        await expectAsync(service.captureElementAsString('mockElement')).toBeRejectedWith(new Error('html2canvas error'));
    });

    it('should enter the catch block and reject correctly', async () => {
        const mockElement = document.createElement('div');
        spyOn(document, 'getElementById').and.returnValue(mockElement);

        html2canvasSpy.and.returnValue(Promise.reject());

        await expectAsync(service.captureElementAsString('validId')).toBeRejectedWith(
            new Error('Element conversion to string failed: Unable to find element in cloned iframe'),
        );
    });
});
