import { TestBed } from '@angular/core/testing';
import { ScreenshotService } from './screenshot.service';
import html2canvas from 'html2canvas';

describe('ScreenshotService', () => {
    let service: ScreenshotService;
    let html2canvasSpy: jasmine.Spy;
    let mockCanvas: HTMLElement;
    let mockCanvasElement: HTMLCanvasElement;
    const JASMIN_TIMEOUT = 1000000;
    const SCREENSHOT_QUALITY = 0.8;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ScreenshotService],
        });

        service = TestBed.inject(ScreenshotService);


        mockCanvasElement = document.createElement('canvas');

        html2canvasSpy = spyOn<any>(html2canvas, 'apply').and.callFake(async () => mockCanvasElement);
    });

    afterEach(() => {
        html2canvasSpy.calls.reset();
    });

    it(
        'should capture an element and return a base64 string',
        async () => {
            document.body.appendChild(mockCanvasElement);
            mockCanvasElement.id = 'mockElement';

            spyOn(document, 'getElementById').and.returnValue(mockCanvasElement);
            spyOn(mockCanvasElement, 'toDataURL').and.returnValue('data:image/jpeg;base64,');

            const result = await service.captureElementAsString('mockElement', SCREENSHOT_QUALITY);

            expect(result).toMatch(/^data:image\/jpeg;base64,/);
        },
        JASMIN_TIMEOUT,
    );

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should reject if the element is not found', async () => {
        spyOn(document, 'getElementById').and.returnValue(null);

        await expectAsync(service.captureElementAsString('invalidId')).toBeRejectedWith(new Error('Element not found'));
    });

    it('should reject if html2canvas throws an error', async () => {
        spyOn(document, 'getElementById').and.returnValue(mockCanvas);

        html2canvasSpy.and.returnValue(Promise.reject(new Error('html2canvas error')));

        await expectAsync(service.captureElementAsString('mockElement')).toBeRejectedWith(
            jasmine.any(Error),
        );
    });

    it('should enter the catch block and reject correctly', async () => {
        const mockElement = document.createElement('div');
        spyOn(document, 'getElementById').and.returnValue(mockElement);

        html2canvasSpy.and.returnValue(Promise.reject());

        await expectAsync(service.captureElementAsString('validId')).toBeRejectedWith(new Error('Unable to find element in cloned iframe'));
    });

    it('should reject with the same error object if an Error is thrown', async () => {
        const mockElement = document.createElement('div');
        document.body.appendChild(mockElement);
        spyOn(document, 'getElementById').and.returnValue(mockElement);

        const errorInstance = new Error('html2canvas specific error');

        html2canvasSpy.and.returnValue(Promise.reject(errorInstance));

        await expectAsync(service.captureElementAsString('mockElement')).toBeRejectedWith(errorInstance);

        document.body.removeChild(mockElement);
    });
});
