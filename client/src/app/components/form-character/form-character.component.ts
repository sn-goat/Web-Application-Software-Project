import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { diceToImageLink, MAX_PORTRAITS } from '@app/constants/playerConst';
import { GameMapService } from '@app/services/code/game-map.service';
import { PlayerService } from '@app/services/code/player.service';
import { SocketService } from '@app/services/code/socket.service';
import { ASSET_EXT, ASSET_PATH } from '@common/game';
import { DEFAULT_ATTACK_VALUE, DEFAULT_DEFENSE_VALUE, PlayerStats } from '@common/player';
import { first } from 'rxjs/operators';

type DiceBonus = 'attack' | 'defense';
type StatBonus = 'life' | 'speed';

@Component({
    selector: 'app-form-character',
    templateUrl: './form-character.component.html',
    styleUrls: ['./form-character.component.scss'],
    imports: [CommonModule, FormsModule, RouterLink],
})
export class FormCharacterComponent implements OnInit {
    @Output() closePopup: EventEmitter<void> = new EventEmitter<void>();
    @Input() isCreationPage: boolean = false;
    @Input() accessCode: string = '';
    diceToImageLink = diceToImageLink;

    totalPortraits = MAX_PORTRAITS;
    currentPortraitIndex = 0;

    lifeSelected: boolean = false;
    speedSelected: boolean = false;
    attackSelected: boolean = false;
    defenseSelected: boolean = false;

    playerStats: PlayerStats = {
        id: ' ',
        name: '',
        avatar: this.getCurrentPortraitImage(),
        life: 4,
        attack: DEFAULT_ATTACK_VALUE,
        defense: DEFAULT_DEFENSE_VALUE,
        speed: 4,
        attackDice: 'D4',
        defenseDice: 'D4',
        movementPts: 0,
        actions: 1,
        position: { x: 0, y: 0 },
        spawnPosition: { x: 0, y: 0 },
        wins: 0,
    };

    takenAvatars: string[] = [];
    isRoomLocked: boolean = false;

    private readonly gameMapService = inject(GameMapService);
    private readonly playerService = inject(PlayerService);
    private readonly socketService = inject(SocketService);

    constructor(private router: Router) {}

    get isCurrentAvatarTaken(): boolean {
        return this.takenAvatars.includes(this.getCurrentPortraitImage());
    }

    ngOnInit(): void {
        if (!this.isCreationPage) {
            this.takenAvatars = this.socketService.gameRoom?.players.map((player) => player.avatar);
        }

        this.socketService.onPlayerJoined().subscribe((data) => {
            if (!this.isCreationPage) {
                this.takenAvatars = data.room.players.map((player) => player.avatar);
            }
        });

        this.socketService.onPlayerRemoved().subscribe((data) => {
            if (!this.isCreationPage) {
                // take out avatars if not in data array
                this.takenAvatars = this.takenAvatars.filter((avatar) => data.map((player) => player.avatar).includes(avatar));
                // this.takenAvatars = data.map((player) => player.avatar);
            }
        });

        this.socketService.onRoomLocked().subscribe(() => {
            this.isRoomLocked = true;
        });
    }

    getCurrentPortraitImage(): string {
        return ASSET_PATH + (this.currentPortraitIndex + 1) + ASSET_EXT;
    }

    navigatePortrait(direction: 'prev' | 'next') {
        if (direction === 'prev') {
            this.currentPortraitIndex = (this.currentPortraitIndex - 1 + this.totalPortraits) % this.totalPortraits;
        } else if (direction === 'next') {
            this.currentPortraitIndex = (this.currentPortraitIndex + 1) % this.totalPortraits;
        }
        this.playerStats.avatar = this.getCurrentPortraitImage();
    }

    selectStat(stat: StatBonus) {
        const otherStat = stat === 'life' ? 'speed' : 'life';
        const selectedStat = (stat + 'Selected') as 'lifeSelected' | 'speedSelected';
        const otherSelectedStat = (otherStat + 'Selected') as 'lifeSelected' | 'speedSelected';

        if (this[otherSelectedStat]) {
            this[otherSelectedStat] = false;
            this.playerStats[otherStat] = 4;
        }
        this[selectedStat] = !this[selectedStat];
        if (this[selectedStat]) {
            this.playerStats[stat] += 2;
        } else {
            this.playerStats[stat] -= 2;
        }
    }

    selectCombatStat(stat: DiceBonus) {
        const otherStat = stat === 'attack' ? 'defense' : 'attack';
        const selectedStat = (stat + 'Selected') as 'attackSelected' | 'defenseSelected';
        const otherSelectedStat = (otherStat + 'Selected') as 'attackSelected' | 'defenseSelected';

        if (this[selectedStat]) {
            this[selectedStat] = false;
            this.playerStats[`${stat}Dice`] = 'D4';
            this.playerStats[`${otherStat}Dice`] = 'D4';
        } else {
            this[selectedStat] = true;
            this.playerStats[`${stat}Dice`] = 'D6';

            if (this[otherSelectedStat]) {
                this[otherSelectedStat] = false;
            }
            this.playerStats[`${otherStat}Dice`] = 'D4';
        }
    }

    onClose(): void {
        this.closePopup.emit();
    }

    canJoin(): boolean {
        const selectedStats = [this.lifeSelected, this.speedSelected, this.attackSelected, this.defenseSelected];
        return this.playerStats.name.trim().length > 0 && selectedStats.filter((stat) => stat).length === 2;
    }

    shareCharacter(): void {
        this.playerService.setPlayer(this.playerStats);
        this.playerService.setAccessCode(this.accessCode);
        this.socketService.shareCharacter(this.accessCode, this.playerStats);
    }

    createGame(): void {
        this.gameMapService
            .getGameMap()
            .pipe(first())
            .subscribe((map) => {
                const selectedMapSize = map.size;
                this.socketService.createRoom(selectedMapSize);
                this.socketService.onRoomCreated().subscribe((data: unknown) => {
                    this.accessCode = (data as { accessCode: string }).accessCode;
                    this.socketService.createGame(this.accessCode, map.name);
                    this.socketService.shareCharacter(this.accessCode, this.playerStats);
                    this.playerService.setPlayer(this.playerStats);
                    this.playerService.setAdmin(true);
                    this.playerService.setAccessCode(this.accessCode);
                    this.router.navigate(['/lobby'], { state: { accessCode: this.accessCode } });
                });
            });
    }
}
