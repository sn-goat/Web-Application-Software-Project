import { Injectable, inject } from '@angular/core';
import { PlayerStats } from '@common/player';
import { BehaviorSubject } from 'rxjs';
import { SocketService } from '@app/services/code/socket.service';
import { PathInfo } from '@common/game';
import { Vec2 } from '@common/board';

@Injectable({
    providedIn: 'root',
})
export class PlayerService {
    myPlayer: BehaviorSubject<PlayerStats | null> = new BehaviorSubject<PlayerStats | null>(null);
    isActivePlayer: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    path: BehaviorSubject<Map<string, PathInfo>> = new BehaviorSubject<Map<string, PathInfo>>(new Map());
    private isAdmin: boolean = false;
    private accessCode: string = '';

    private readonly socketService = inject(SocketService);

    constructor() {
        this.socketService.onTurnSwitch().subscribe((data) => {
            if (data.player.id === this.getPlayer().id) {
                this.setPlayerActive(true);
                this.setPath(data.path);
            } else {
                this.setPlayerActive(false);
                this.setPath(new Map());
            }
        });

        this.socketService.onTurnUpdate().subscribe((data) => {
            this.setPlayer(data.player);
            this.setPath(data.path);
            this.setPlayerActive(true);
        });

        this.socketService.onAssignSpawn().subscribe((data) => {
            this.getPlayer().spawnPosition = data;
            this.getPlayer().position = data;
        });
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
}
