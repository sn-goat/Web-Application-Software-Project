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

        it('should call pauseTimer if the current type is Movement', () => {
            // Spy on pauseTimer.
            const pauseSpy = jest.spyOn(timer, 'pauseTimer').mockReturnValue(42);
            // Setup: simulate that the timer is already running with type Movement.
            timer.type = TimerType.Movement;
            // Also give it an intervalId so that pauseTimer gets executed.
            timer.intervalId = setInterval(() => {}, 1000);
            timer.startTimer(10, TimerType.Movement);
            expect(pauseSpy).toHaveBeenCalled();
            // pausedTime from pauseTimer is used.
            expect(timer.pausedTime).toBe(42);
        });
    });

    describe('pauseTimer', () => {
        it('should clear the interval and return the paused time if interval exists', () => {
            // Set remaining time and simulate an active timer.
            timer.remainingTime = 7;
            timer.intervalId = setInterval(() => {}, 1000);
            const paused = timer.pauseTimer();
            expect(clearIntervalSpy).toHaveBeenCalled();
            expect(paused).toBe(7);
            expect(timer.pausedTime).toBe(7);
        });

        it('should return undefined if no interval exists', () => {
            timer.intervalId = undefined;
            const paused = timer.pauseTimer();
            expect(paused).toBeUndefined();
        });
    });

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
});
