// sub-lifecycle-handler.component.spec.ts
import { Observable, Subject, Subscription } from 'rxjs';
import { SubLifecycleHandlerComponent } from './subscription-lifecycle-handler.component';

describe('SubLifecycleHandlerComponent', () => {
    class DummyComponent extends SubLifecycleHandlerComponent {
        // Expose autoSubscribe for testing
        testAutoSubscribe<T>(
            observable: Observable<T>,
            next?: (value: T) => void,
            error?: (err: unknown) => void,
            complete?: () => void,
        ): Subscription {
            return this.autoSubscribe(observable, next, error, complete);
        }
        getDestroy$(): Subject<void> {
            return this.destroy$;
        }
    }
    let dummy: DummyComponent;
    let source$: Subject<number>;

    beforeEach(() => {
        dummy = new DummyComponent();
        source$ = new Subject<number>();
    });

    it('should receive values from an observable before destruction', () => {
        const receivedValues: number[] = [];

        // Subscribe using autoSubscribe.
        dummy.testAutoSubscribe(source$, (value) => {
            receivedValues.push(value);
        });

        // Emit some values.
        source$.next(1);
        source$.next(2);
        expect(receivedValues).toEqual([1, 2]);
    });

    it('should not receive values after ngOnDestroy is called', () => {
        const receivedValues: number[] = [];

        dummy.testAutoSubscribe(source$, (value) => {
            receivedValues.push(value);
        });

        // Emit a value before destruction.
        source$.next(1);
        expect(receivedValues).toEqual([1]);

        // Call ngOnDestroy to trigger unsubscription.
        dummy.ngOnDestroy();

        // Emitting a new value should not call our callback.
        source$.next(2);
        expect(receivedValues).toEqual([1]);
    });

    it('should complete the destroy$ subject upon destruction', () => {
        spyOn(dummy.getDestroy$(), 'complete').and.callThrough();

        dummy.ngOnDestroy();

        expect(dummy.getDestroy$().complete).toHaveBeenCalled();
    });

    it('should call error and complete callbacks if provided', () => {
        const errorSpy = jasmine.createSpy('error');
        const completeSpy = jasmine.createSpy('complete');

        // Create a subject to test error/completion.
        const errorSubject = new Subject<number>();
        dummy.testAutoSubscribe(errorSubject, undefined, errorSpy, completeSpy);

        // Emit an error; the error callback should fire.
        errorSubject.error(new Error('Test error'));
        expect(errorSpy).toHaveBeenCalled();

        // Typically, complete is not called after an error.
        expect(completeSpy).not.toHaveBeenCalled();
    });
});
