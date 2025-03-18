import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

type TimerType = 'movement' | 'combat';
const SECOND_TO_MILISECOND = 1000;

interface RoomTimer {
    currentTimerType: TimerType;
    remainingTime: number;
    pausedTime?: number;
    intervalId?: NodeJS.Timeout;
}

@Injectable()
export class TimerService {
    private timers: Record<string, RoomTimer> = {};
    private logger: Logger = new Logger(TimerService.name);

    constructor(private eventEmitter: EventEmitter2) {}

    startTimer(roomId: string, duration: number, type: TimerType) {
        let pausedTime = this.timers[roomId] ? this.timers[roomId]?.pausedTime : undefined;
        if (this.timers[roomId]?.intervalId) {
            clearInterval(this.timers[roomId].intervalId);
        }

        if (this.timers[roomId] && this.timers[roomId].currentTimerType === 'movement') {
            pausedTime = this.pauseTimer(roomId);
            this.logger.log(`Timer movement paused at: ${pausedTime}`);
        }

        this.timers[roomId] = { currentTimerType: type, remainingTime: duration, pausedTime };

        const intervalId = setInterval(() => {
            this.eventEmitter.emit('timerUpdate', { roomId, remainingTime: this.timers[roomId].remainingTime });

            if (this.timers[roomId].remainingTime <= 0) {
                clearInterval(intervalId);
                this.eventEmitter.emit('timerEnded', roomId);

                return;
            }

            this.timers[roomId].remainingTime -= 1;
        }, SECOND_TO_MILISECOND);

        this.timers[roomId].intervalId = intervalId;
    }

    pauseTimer(roomId: string): number {
        if (this.timers[roomId]?.intervalId) {
            clearInterval(this.timers[roomId].intervalId);
            this.timers[roomId].pausedTime = this.timers[roomId].remainingTime;
            return this.timers[roomId].pausedTime;
        }
    }

    resumeTimer(roomId: string) {
        if (this.timers[roomId] && this.timers[roomId].pausedTime) {
            this.logger.log(`Timer resuming at: ${this.timers[roomId].pausedTime}`);
            this.startTimer(roomId, this.timers[roomId].pausedTime, 'movement');
            this.timers[roomId].pausedTime = undefined;
        }
    }

    stopTimer(roomId: string) {
        if (this.timers[roomId]?.intervalId) {
            clearInterval(this.timers[roomId].intervalId);
            delete this.timers[roomId];
        }
    }

    getRemainingTime(roomId: string): { type?: TimerType; remainingTime?: number; pausedTime?: number } {
        return {
            type: this.timers[roomId]?.currentTimerType,
            remainingTime: this.timers[roomId]?.remainingTime ?? null,
            pausedTime: this.timers[roomId]?.pausedTime ?? null,
        };
    }
}
