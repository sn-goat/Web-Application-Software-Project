/* eslint-disable @typescript-eslint/no-magic-numbers */
import { TestBed } from '@angular/core/testing';
import { first } from 'rxjs/operators';
import { PopupService } from './popup.service';

describe('PopupService', () => {
    let service: PopupService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(PopupService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize with popup not visible', (done) => {
        service.popupVisible$.pipe(first()).subscribe((isVisible) => {
            expect(isVisible).toBeFalse();
            done();
        });
    });

    it('should set popup to visible', (done) => {
        service.setPopupVisible(true);

        service.popupVisible$.pipe(first()).subscribe((isVisible) => {
            expect(isVisible).toBeTrue();
            done();
        });
    });

    it('should set popup to not visible', (done) => {
        // First set it to visible
        service.setPopupVisible(true);

        // Then set it back to not visible
        service.setPopupVisible(false);

        service.popupVisible$.pipe(first()).subscribe((isVisible) => {
            expect(isVisible).toBeFalse();
            done();
        });
    });

    it('should toggle popup from not visible to visible', (done) => {
        // First ensure it's not visible
        service.setPopupVisible(false);

        // Then toggle
        service.togglePopup();

        service.popupVisible$.pipe(first()).subscribe((isVisible) => {
            expect(isVisible).toBeTrue();
            done();
        });
    });

    it('should toggle popup from visible to not visible', (done) => {
        // First set it to visible
        service.setPopupVisible(true);

        // Then toggle
        service.togglePopup();

        service.popupVisible$.pipe(first()).subscribe((isVisible) => {
            expect(isVisible).toBeFalse();
            done();
        });
    });

    it('should notify subscribers when visibility changes', () => {
        const states: boolean[] = [];
        const subscription = service.popupVisible$.subscribe((state) => {
            states.push(state);
        });

        // Should have received initial state
        expect(states.length).toBe(1);
        expect(states[0]).toBeFalse();

        // Set to visible
        service.setPopupVisible(true);
        expect(states.length).toBe(2);
        expect(states[1]).toBeTrue();

        // Toggle back to invisible
        service.togglePopup();
        expect(states.length).toBe(3);
        expect(states[2]).toBeFalse();

        subscription.unsubscribe();
    });

    it('should handle multiple subscribers correctly', () => {
        const states1: boolean[] = [];
        const states2: boolean[] = [];

        const subscription1 = service.popupVisible$.subscribe((state) => {
            states1.push(state);
        });

        // Set to visible
        service.setPopupVisible(true);

        const subscription2 = service.popupVisible$.subscribe((state) => {
            states2.push(state);
        });

        // Toggle back to invisible
        service.togglePopup();

        // First subscriber should have received initial false, then true, then false
        expect(states1).toEqual([false, true, false]);

        // Second subscriber should have received initial true, then false
        expect(states2).toEqual([true, false]);

        subscription1.unsubscribe();
        subscription2.unsubscribe();
    });
});
