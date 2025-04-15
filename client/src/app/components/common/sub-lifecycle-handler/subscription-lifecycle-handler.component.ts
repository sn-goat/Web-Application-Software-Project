import { Component, OnDestroy } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    template: '',
})
export abstract class SubLifecycleHandlerComponent implements OnDestroy {
    protected readonly destroy$ = new Subject<void>();

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    protected autoSubscribe<T, V>(
        observable: Observable<T>,
        next?: (value: T) => void,
        error?: (err: V) => void,
        complete?: () => void,
    ): Subscription {
        return observable.pipe(takeUntil(this.destroy$)).subscribe({ next, error, complete });
    }
}
