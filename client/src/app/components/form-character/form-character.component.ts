import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { diceToImageLink, MAX_PORTRAITS } from '@app/constants/playerConst';
import { GameMapService } from '@app/services/code/game-map.service';
import { SocketService } from '@app/services/code/socket.service';
import { PlayerStats } from '@common/player';
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
        id: this.generateId(),
        name: '',
        avatar: this.getCurrentPortraitImage(),
        life: 4,
        attack: 4,
        defense: 4,
        speed: 4,
        attackDice: 'D4',
        defenseDice: 'D4',
        movementPts: 0,
        actions: 0,
        wins: 0,
    };

    takenAvatars: string[] = [];

    private readonly gameMapService = inject(GameMapService);
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
    }

    getCurrentPortraitImage(): string {
        return `./assets/portraits/portrait${this.currentPortraitIndex + 1}.png`;
    }

    generateId(): string {
        const base = 36;
        const limit = 9;
        return Math.random().toString(base).substring(2, limit);
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

    shareGameMap(): void {
        this.gameMapService.shareGameMap();
    }

    shareCharacter(): void {
        this.socketService.shareCharacter(this.accessCode, this.playerStats);
    }

    createGame(): void {
        this.gameMapService
            .getGameMap()
            .pipe(first())
            .subscribe((map) => {
                const selectedMapSize = map.size;
                this.socketService.createRoom(this.playerStats.id, selectedMapSize);
                this.socketService.onRoomCreated().subscribe((data: unknown) => {
                    this.accessCode = (data as { accessCode: string }).accessCode;
                    this.socketService.shareCharacter(this.accessCode, this.playerStats);
                    this.router.navigate(['/lobby'], { state: { accessCode: this.accessCode } });
                });
            });
    }
}
