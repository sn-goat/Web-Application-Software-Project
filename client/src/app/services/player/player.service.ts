import { Injectable, OnDestroy, inject } from '@angular/core';
import { SocketService } from '@app/services/socket/socket.service';
import { Vec2 } from '@common/board';
import { PathInfo } from '@common/game';
import { PlayerStats } from '@common/player';
import { BehaviorSubject, Subscription } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class PlayerService implements OnDestroy {
    myPlayer: BehaviorSubject<PlayerStats | null> = new BehaviorSubject<PlayerStats | null>(null);
    isActivePlayer: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    path: BehaviorSubject<Map<string, PathInfo>> = new BehaviorSubject<Map<string, PathInfo>>(new Map());
    subscriptions: Subscription[] = [];
    private isAdmin: boolean = false;
    private accessCode: string = '';

    private readonly socketService = inject(SocketService);

    constructor() {
        this.subscriptions.push(
            this.socketService.onTurnSwitch().subscribe((data) => {
                if (data.player.id === this.getPlayer().id) {
                    this.setPlayerActive(true);
                    this.setPath(data.path);
                    this.setPlayer(data.player);
                } else {
                    this.setPlayerActive(false);
                    this.setPath(new Map());
                }
            }),

            this.socketService.onTurnUpdate().subscribe((data) => {
                if (data.player.id === this.getPlayer().id) {
                    this.setPlayer(data.player);
                    this.setPath(data.path);
                    this.setPlayerActive(true);
                }
            }),

            this.socketService.onAssignSpawn().subscribe((data) => {
                this.getPlayer().spawnPosition = data;
                this.getPlayer().position = data;
            }),
        );
    }

    setPlayer(player: PlayerStats): void {
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

    getPlayer(): PlayerStats {
        return this.myPlayer.value ?? ({} as PlayerStats);
    }

    setAccessCode(accessCode: string): void {
        this.accessCode = accessCode;
    }

    getAccessCode(): string {
        return this.accessCode;
    }

    sendMove(position: Vec2): void {
        const keyPos = `${position.x},${position.y}`;
        const selectedPath = this.path.value?.get(keyPos);
        if (selectedPath) {
            this.isActivePlayer.next(false);
            this.socketService.movePlayer(this.getAccessCode(), selectedPath, this.getPlayer());
        }
    }

    resetPlayers() {
        this.myPlayer.next(null);
        this.isActivePlayer.next(false);
        this.path.next(new Map());
        this.isAdmin = false;
        this.accessCode = '';
    }

    ngOnDestroy() {
        this.subscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
    }
}
