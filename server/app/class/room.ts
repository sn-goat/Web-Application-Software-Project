import { Game } from '@app/class/game';
import { InternalFightEvents, InternalTimerEvents, InternalTurnEvents } from '@app/constants/internal-events';
import { Cell, Vec2 } from '@common/board';
import { IRoom, PathInfo } from '@common/game';
import { EventEmitter2 } from 'eventemitter2';
import { Player } from './player';

export class Room implements IRoom {
    accessCode: string;
    organizerId: string;
    isLocked: boolean;
    game: Game;
    private internalEmitter: EventEmitter2;
    private globalEmitter: EventEmitter2;

    constructor(globalEmitter: EventEmitter2, accessCode: string, organizerId: string, map: Cell[][]) {
        this.accessCode = accessCode;
        this.organizerId = organizerId;
        this.isLocked = false;
        this.internalEmitter = new EventEmitter2();
        this.globalEmitter = globalEmitter;
        this.game = new Game(this.internalEmitter, map);

        this.internalEmitter.on(InternalTimerEvents.TurnUpdate, (remainingTime) => {
            this.globalEmitter.emit(InternalTimerEvents.TurnUpdate, { accessCode: this.accessCode, remainingTime });
        });

        this.internalEmitter.on(InternalTimerEvents.FightUpdate, (remainingTime) => {
            this.globalEmitter.emit(InternalTimerEvents.FightUpdate, { accessCode: this.accessCode, remainingTime });
        });

        this.internalEmitter.on(InternalTurnEvents.Move, (movement: { previousPosition: Vec2; player: Player }) => {
            this.globalEmitter.emit(InternalTurnEvents.Move, {
                accessCode: this.accessCode,
                previousPosition: movement.previousPosition,
                player: movement.player,
            });
        });

        this.internalEmitter.on(InternalTurnEvents.Update, (turn: { player: Player; path: Record<string, PathInfo> }) => {
            this.globalEmitter.emit(InternalTurnEvents.Update, turn);
        });

        this.internalEmitter.on(InternalTurnEvents.ChangeTurn, (turn: { player: Player; path: Record<string, PathInfo> }) => {
            this.globalEmitter.emit(InternalTurnEvents.ChangeTurn, { accessCode: this.accessCode, player: turn.player, path: turn.path });
        });

        this.internalEmitter.on(InternalTurnEvents.Start, (playerId: string) => {
            this.globalEmitter.emit(InternalTurnEvents.Start, playerId);
        });

        this.internalEmitter.on(InternalFightEvents.End, (fightResult: { winner: Player; loser: Player }) => {
            this.globalEmitter.emit(InternalFightEvents.End, fightResult);
        });
    }

    setLock(isLocked: boolean): void {
        this.isLocked = isLocked;
    }

    isPlayerAdmin(playerId: string): boolean {
        return this.organizerId === playerId;
    }
}
