/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Timer } from '@app/class/timer';
import { InternalEvents } from '@app/constants/internal-events';
import { TimerType } from '@app/gateways/game/game.gateway.constants';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('Timer', () => {
    let timer: Timer;
    let mockEmitter: EventEmitter2;
    let clearIntervalSpy: jest.SpyInstance;

    beforeEach(() => {
        // Create a mock event emitter with a jest.fn() for "emit".
        jest.useFakeTimers();
        mockEmitter = {
            emit: jest.fn(),
        } as unknown as EventEmitter2;

        timer = new Timer(mockEmitter);
        clearIntervalSpy = jest.spyOn(global, 'clearInterval').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.resetAllMocks();
    });

    describe('startTimer', () => {
        it('should start a timer without a previous interval', () => {
            // No previous interval or pausedTime exists.
            timer.startTimer(3, TimerType.Movement);
            expect(timer.type).toBe(TimerType.Movement);
            expect(timer.remainingTime).toBe(3);

            // Simulate 4 seconds so that the timer goes to 0 and stops.
            jest.advanceTimersByTime(4000);

            // Expect that UpdateTimer was emitted 4 times.
            // When remainingTime becomes 0, EndTimer is emitted.
            expect(mockEmitter.emit).toHaveBeenCalledWith(InternalEvents.UpdateTimer, 3);
            expect(mockEmitter.emit).toHaveBeenCalledWith(InternalEvents.UpdateTimer, 2);
            expect(mockEmitter.emit).toHaveBeenCalledWith(InternalEvents.UpdateTimer, 1);
            expect(mockEmitter.emit).toHaveBeenCalledWith(InternalEvents.UpdateTimer, 0);
            expect(mockEmitter.emit).toHaveBeenCalledWith(InternalEvents.EndTimer);
        });

        it('should clear previous interval if one exists', () => {
            // Set an arbitrary interval id on the timer.
            timer.intervalId = setInterval(() => {}, 1000);
            timer.startTimer(5, TimerType.Movement);
            expect(clearIntervalSpy).toHaveBeenCalled();
            expect(timer.type).toBe(TimerType.Movement);
            expect(timer.remainingTime).toBe(5);
        });

        it('should preserve the remaining time when changing from Movement to Combat', () => {
            // Setup: simulate that the timer is already running with type Movement
            timer.type = TimerType.Movement;
            timer.remainingTime = 42;
            timer.intervalId = setInterval(() => {}, 1000);

            // Act: change to Combat type
            timer.startTimer(10, TimerType.Combat);

            // Assert: check that the remaining time was preserved as pausedTime
            expect(timer.pausedTime).toBe(42);
            expect(timer.type).toBe(TimerType.Combat);
            expect(timer.remainingTime).toBe(10);
            expect(clearIntervalSpy).toHaveBeenCalled();
        });
    });

    // Supprimer le bloc de test direct pour 'pauseTimer' puisque c'est maintenant une méthode privée

    describe('resumeTimer', () => {
        it('should restart the timer with pausedTime if pausedTime exists', () => {
            // Spy on startTimer.
            const startSpy = jest.spyOn(timer, 'startTimer');
            timer.pausedTime = 8;
            timer.resumeTimer();
            expect(startSpy).toHaveBeenCalledWith(8, TimerType.Movement);
        });

        it('should do nothing if pausedTime is falsy', () => {
            const startSpy = jest.spyOn(timer, 'startTimer');
            timer.pausedTime = 0;
            timer.resumeTimer();
            expect(startSpy).not.toHaveBeenCalled();
        });
    });

    describe('stopTimer', () => {
        it('should clear the interval if it exists and set remainingTime to 0', () => {
            timer.remainingTime = 10;
            timer.intervalId = setInterval(() => {}, 1000);
            timer.stopTimer();
            expect(clearIntervalSpy).toHaveBeenCalled();
            expect(timer.remainingTime).toBe(0);
        });

        it('should set remainingTime to 0 even if there is no interval', () => {
            timer.remainingTime = 5;
            timer.intervalId = undefined;
            timer.stopTimer();
            expect(timer.remainingTime).toBe(0);
        });
    });

    // Test du comportement de la méthode pauseTimer à travers startTimer
    describe('Behavior of private pauseTimer through public API', () => {
        it('should save remaining time when changing timer types', () => {
            // Arrange
            timer.type = TimerType.Movement;
            timer.remainingTime = 7;
            timer.intervalId = setInterval(() => {}, 1000);

            // Act - this will call the private pauseTimer method
            timer.startTimer(3, TimerType.Combat);

            // Assert
            expect(clearIntervalSpy).toHaveBeenCalled();
            expect(timer.pausedTime).toBe(7);
        });

        it('should not set pausedTime if no interval exists', () => {
            // Arrange
            timer.type = TimerType.Movement;
            timer.remainingTime = 7;
            timer.intervalId = undefined;
            timer.pausedTime = undefined;

            // Act - pauseTimer would be called but should not modify pausedTime
            timer.startTimer(3, TimerType.Combat);

            // Assert
            expect(clearIntervalSpy).not.toHaveBeenCalled();
            expect(timer.pausedTime).toBeUndefined();
        });
    });
});
