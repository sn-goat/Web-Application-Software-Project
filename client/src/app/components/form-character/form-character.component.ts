import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { D4, D6, MAX_PORTRAITS } from '@app/constants/playerConst';
import { GameMapService } from '@app/services/code/game-map.service';
import { SocketService } from '@app/services/code/socket.service';
import { Player } from '@common/player';
import { first } from 'rxjs/operators';

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

    totalPortraits = MAX_PORTRAITS;
    currentPortraitIndex = 0;

    lifeSelected: boolean = false;
    rapiditySelected: boolean = false;
    attackSelected: boolean = false;
    defenseSelected: boolean = false;

    stats: Player = {
        id: this.generateId(),
        name: '',
        avatar: this.getCurrentPortraitImage(),
        life: 4,
        attack: 4,
        defense: 4,
        rapidity: 4,
        attackDice: '',
        defenseDice: '',
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
        this.stats.avatar = this.getCurrentPortraitImage();
    }

    selectStat(stat: 'life' | 'rapidity') {
        const otherStat = stat === 'life' ? 'rapidity' : 'life';
        const selectedStat = (stat + 'Selected') as 'lifeSelected' | 'rapiditySelected';
        const otherSelectedStat = (otherStat + 'Selected') as 'lifeSelected' | 'rapiditySelected';

        if (this[otherSelectedStat]) {
            this[otherSelectedStat] = false;
            this.stats[otherStat] = 4;
        }
        this[selectedStat] = !this[selectedStat];
        if (this[selectedStat]) {
            this.stats[stat] += 2;
        } else {
            this.stats[stat] -= 2;
        }
    }

    selectCombatStat(stat: 'attack' | 'defense') {
        const otherStat = stat === 'attack' ? 'defense' : 'attack';
        const selectedStat = (stat + 'Selected') as 'attackSelected' | 'defenseSelected';
        const otherSelectedStat = (otherStat + 'Selected') as 'attackSelected' | 'defenseSelected';

        if (this[selectedStat]) {
            this[selectedStat] = false;
            this.stats[`${stat}Dice`] = '';
            this.stats[`${otherStat}Dice`] = '';
        } else {
            this[selectedStat] = true;
            this.stats[`${stat}Dice`] = D6;

            if (this[otherSelectedStat]) {
                this[otherSelectedStat] = false;
            }
            this.stats[`${otherStat}Dice`] = D4;
        }
    }

    onClose(): void {
        this.closePopup.emit();
    }

    canJoin(): boolean {
        const selectedStats = [this.lifeSelected, this.rapiditySelected, this.attackSelected, this.defenseSelected];
        return this.stats.name.trim().length > 0 && selectedStats.filter((stat) => stat).length === 2;
    }

    shareGameMap(): void {
        this.gameMapService.shareGameMap();
    }

    shareCharacter(): void {
        this.socketService.shareCharacter(this.accessCode, this.stats);
    }

    createGame(): void {
        this.gameMapService
            .getGameMap()
            .pipe(first())
            .subscribe((map) => {
                const selectedMapSize = map.size;
                this.socketService.createRoom(this.stats.id, selectedMapSize);
                this.socketService.onRoomCreated().subscribe((data: unknown) => {
                    this.accessCode = (data as { accessCode: string }).accessCode;
                    this.socketService.shareCharacter(this.accessCode, this.stats);
                    this.router.navigate(['/lobby'], { state: { accessCode: this.accessCode } });
                });
            });
    }
}
