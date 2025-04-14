import { InternalEvents } from '@app/constants/internal-events';
import { TimerType } from '@app/gateways/game/game.gateway.constants';
import { EventEmitter2 } from '@nestjs/event-emitter';

export class Timer {
    type: string;
    remainingTime: number;
    pausedTime: number;
    intervalId: NodeJS.Timeout;
    private eventEmitter: EventEmitter2;
    private readonly secondInMs = 1000;
    constructor(eventEmitter: EventEmitter2) {
        this.eventEmitter = eventEmitter;
    }

    startTimer(duration: number, newType: TimerType = TimerType.Movement) {
        let pausedTime = this.pausedTime;
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        if (this.type === TimerType.Movement && newType === TimerType.Combat) {
            pausedTime = this.pauseTimer();
        }

        this.type = newType;
        this.remainingTime = duration;
        this.pausedTime = pausedTime;

        const intervalId = setInterval(() => {
            this.eventEmitter.emit(InternalEvents.UpdateTimer, this.remainingTime);
            if (this.remainingTime <= 0) {
                clearInterval(intervalId);
                this.eventEmitter.emit(InternalEvents.EndTimer);
                return;
            }

            this.remainingTime -= 1;
        }, this.secondInMs);

        this.intervalId = intervalId;
    }

    resumeTimer() {
        if (this.pausedTime) {
            this.startTimer(this.pausedTime, TimerType.Movement);
        }
    }

    stopTimer() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        this.remainingTime = 0;
    }

    private pauseTimer(): number {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.pausedTime = this.remainingTime;
            return this.pausedTime;
        }
    }
}
