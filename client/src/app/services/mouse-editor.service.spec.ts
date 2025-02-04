import { TestBed } from '@angular/core/testing';

import { MouseEditorService } from './mouse-editor.service';

describe('MouseEditorService', () => {
    let service: MouseEditorService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(MouseEditorService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
