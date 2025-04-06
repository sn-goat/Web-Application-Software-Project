import { Injectable, OnDestroy, inject } from '@angular/core';
import { SocketEmitterService } from '@app/services/socket/socket-emitter.service';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';
import { Vec2 } from '@common/board';
import { PathInfo, TurnInfo } from '@common/game';
import { IPlayer } from '@common/player';
import { BehaviorSubject, Subscription } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class PlayerService implements OnDestroy {
    myPlayer: BehaviorSubject<IPlayer | null> = new BehaviorSubject<IPlayer | null>(null);
    isActivePlayer: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    path: BehaviorSubject<Map<string, PathInfo>> = new BehaviorSubject<Map<string, PathInfo>>(new Map());
    // TODO: Ajouter Possible Actions en tant que BehaviorSubject
    subscriptions: Subscription[] = [];
    private isAdmin: boolean = false;

    private readonly socketEmitter: SocketEmitterService = inject(SocketEmitterService);
    private readonly socketReceiver: SocketReceiverService = inject(SocketReceiverService);

    constructor() {
        this.subscriptions.push(
            this.socketReceiver.onSetCharacter().subscribe((player: IPlayer) => {
                this.setPlayer(player);
            }),

            this.socketReceiver.onPlayerRemoved().subscribe(() => {
                this.resetPlayers();
            }),

            this.socketReceiver.onPlayerTurnChanged().subscribe((turn: TurnInfo) => {
                if (turn.player.id === this.getPlayer().id) {
                    // TODO: Faire une Update de Possible Actions
                    this.setPath(turn.path);
                    this.setPlayer(turn.player);
                } else {
                    this.setPlayerActive(false);
                    this.setPath(new Map());
                }
            }),

            this.socketReceiver.onPlayerTurnUpdate().subscribe((data) => {
                if (data.player.id === this.getPlayer().id) {
                    // TODO: Faire une Update de Possible Actions
                    this.setPlayer(data.player);
                    this.setPath(data.path);
                    this.setPlayerActive(true);
                }
            }),

            this.socketReceiver.onTurnStart().subscribe(() => {
                this.setPlayerActive(true);
            }),
        );
    }

    setPlayer(player: IPlayer): void {
        this.myPlayer.next(player);
    }

    setPath(path: Map<string, PathInfo>): void {
        this.path.next(path);
    }

    setAdmin(isAdmin: boolean): void {
        this.isAdmin = isAdmin;
    }

    isPlayerAdmin(): boolean {
        return this.isAdmin;
    }

    isActive(): boolean {
        return this.isActivePlayer.value;
    }

    setPlayerActive(isActive: boolean): void {
        this.isActivePlayer.next(isActive);
    }

    getPlayer(): IPlayer {
        return this.myPlayer.value ?? ({} as IPlayer);
    }

    sendMove(position: Vec2): void {
        const keyPos = `${position.x},${position.y}`;
        const selectedPath = this.path.value?.get(keyPos);
        if (selectedPath) {
            this.isActivePlayer.next(false);
            this.socketEmitter.movePlayer(selectedPath, this.getPlayer().id);
        }
    }

    resetPlayers() {
        this.myPlayer.next(null);
        this.isActivePlayer.next(false);
        this.path.next(new Map());
        this.isAdmin = false;
    }

    ngOnDestroy() {
        this.subscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
    }
}
