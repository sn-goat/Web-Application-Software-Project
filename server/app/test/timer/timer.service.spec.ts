/* eslint-disable @typescript-eslint/no-magic-numbers */
import { TimerService } from '@app/services/timer/timer.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';

jest.useFakeTimers();

describe('TimerService', () => {
    let service: TimerService;
    let mockEventEmitter: EventEmitter2;

    beforeEach(async () => {
        mockEventEmitter = new EventEmitter2();

        const module: TestingModule = await Test.createTestingModule({
            providers: [TimerService, { provide: EventEmitter2, useValue: mockEventEmitter }],
        }).compile();

        service = module.get<TimerService>(TimerService);

        jest.spyOn(global, 'setInterval');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should start a movement timer', () => {
        service.startTimer('room1', 5, 'movement');

        expect(service.getRemainingTime('room1')).toEqual({ type: 'movement', remainingTime: 5, pausedTime: null });
        expect(setInterval).toHaveBeenCalled();
    });

    it('should decrease remaining time every second', () => {
        service.startTimer('room1', 5, 'combat');

        jest.advanceTimersByTime(2000);

        expect(service.getRemainingTime('room1')).toEqual({ type: 'combat', remainingTime: 3, pausedTime: null });
    });

    it('should emit timerEnded event when timer reaches 0', () => {
        service.startTimer('room1', 2, 'movement');
        jest.advanceTimersByTime(3000);

        expect(service.getRemainingTime('room1')).toEqual({ type: undefined, remainingTime: null, pausedTime: null });
    });

    it('should pause the timer', () => {
        service.startTimer('room1', 5, 'combat');

        jest.advanceTimersByTime(2000);
        service.pauseTimer('room1');
        jest.advanceTimersByTime(2000);

        expect(service.getRemainingTime('room1')).toEqual({ type: 'combat', remainingTime: 3, pausedTime: 3 });
    });

    it('should resume the paused timer', () => {
        service.startTimer('room1', 5, 'movement');

        jest.advanceTimersByTime(2000);
        service.pauseTimer('room1');
        jest.advanceTimersByTime(2000);

        service.resumeTimer('room1');
        jest.advanceTimersByTime(2000);

        expect(service.getRemainingTime('room1')).toEqual({ type: 'movement', remainingTime: 1, pausedTime: null });
    });

    it('should stop the timer', () => {
        service.startTimer('room1', 5, 'combat');
        service.stopTimer('room1');

        expect(service.getRemainingTime('room1')).toEqual({ type: undefined, remainingTime: null, pausedTime: null });
    });

    it('should not resume a stopped timer', () => {
        service.startTimer('room1', 5, 'combat');
        service.stopTimer('room1');

        service.resumeTimer('room1');

        expect(service.getRemainingTime('room1')).toEqual({ type: undefined, remainingTime: null, pausedTime: null });
    });

    it('should correctly transition from movement to combat', () => {
        service.startTimer('room1', 10, 'movement');

        jest.advanceTimersByTime(5000);
        expect(service.getRemainingTime('room1')).toEqual({ type: 'movement', remainingTime: 5, pausedTime: null });

        service.startTimer('room1', 7, 'combat');

        expect(service.getRemainingTime('room1')).toEqual({ type: 'combat', remainingTime: 7, pausedTime: 5 });
        expect(service.getRemainingTime('room1').remainingTime).not.toBe(5);

        jest.advanceTimersByTime(7000);

        service.resumeTimer('room1');
        expect(service.getRemainingTime('room1')).toEqual({ type: 'movement', remainingTime: 5, pausedTime: null });
    });
});
