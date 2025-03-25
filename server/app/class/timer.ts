import { InternalTimerEvents } from '@app/constants/internal-events';
import { EventEmitter2 } from '@nestjs/event-emitter';

enum TimerType {
    Movement = 'movement',
    Combat = 'combat',
}
const ONE_SECOND_IN_MS = 1000;

export class Timer {
    type: string;
    remainingTime: number;
    pausedTime: number;
    intervalId: NodeJS.Timeout;

    private eventEmitter: EventEmitter2;
    private accessCode: string;

    constructor(accessCode: string) {
        this.accessCode = accessCode;
    }

    startTimer(duration: number, newType: TimerType = TimerType.Movement) {
        let pausedTime = this.pausedTime;
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        if (this.type === TimerType.Movement) {
            pausedTime = this.pauseTimer();
        }

        this.type = newType;
        this.remainingTime = duration;
        this.pausedTime = pausedTime;

        const intervalId = setInterval(() => {
            this.eventEmitter.emit(InternalTimerEvents.Update, { accessCode: this.accessCode, remainingTime: this.remainingTime });
            if (this.remainingTime <= 0) {
                clearInterval(intervalId);
                this.eventEmitter.emit(InternalTimerEvents.End, this.accessCode);
                return;
            }

            this.remainingTime -= 1;
        }, ONE_SECOND_IN_MS);

        this.intervalId = intervalId;
    }

    pauseTimer(): number {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.pausedTime = this.remainingTime;
            return this.pausedTime;
        }
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
    }
}
