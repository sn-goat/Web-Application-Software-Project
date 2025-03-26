import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { diceToImageLink, MAX_PORTRAITS } from '@app/constants/playerConst';
import { GameMapService } from '@app/services/game-map/game-map.service';
import { PlayerService } from '@app/services/player/player.service';
import { SocketEmitterService } from '@app/services/socket/socket-emitter.service';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';
import { ASSET_EXT, ASSET_PATH } from '@common/game';
import { DEFAULT_DICE, DEFAULT_LIFE_VALUE, DEFAULT_SPEED_VALUE, PlayerInput } from '@common/player';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

type DiceBonus = 'attack' | 'defense';
type StatBonus = 'life' | 'speed';

@Component({
    selector: 'app-form-character',
    templateUrl: './form-character.component.html',
    styleUrls: ['./form-character.component.scss'],
    imports: [CommonModule, FormsModule, RouterLink],
})
export class FormCharacterComponent implements OnInit, OnDestroy {
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

    playerStats: PlayerInput = {
        name: '',
        avatar: this.currentPortraitImage,
        life: DEFAULT_LIFE_VALUE,
        speed: DEFAULT_SPEED_VALUE,
        attackDice: DEFAULT_DICE,
        defenseDice: DEFAULT_DICE,
    };

    takenAvatars: string[] = [];
    isRoomLocked: boolean = false;

    private subscriptions: Subscription[] = [];
    private readonly gameMapService = inject(GameMapService);
    private readonly playerService = inject(PlayerService);
    private readonly socketEmitter = inject(SocketEmitterService);
    private readonly socketReceiver = inject(SocketReceiverService);
    private readonly router = inject(Router);

    get isCurrentAvatarTaken(): boolean {
        return this.takenAvatars.includes(this.currentPortraitImage);
    }

    get currentPortraitImage(): string {
        return ASSET_PATH + (this.currentPortraitIndex + 1) + ASSET_EXT;
    }

    ngOnInit(): void {
        this.subscriptions.push(
            this.socketReceiver.onPlayerJoined().subscribe((room) => {
                if (!this.isCreationPage) {
                    this.takenAvatars = room.game.players.map((player) => player.avatar);
                }
            }),

            this.socketReceiver.onPlayerRemoved().subscribe((players) => {
                if (!this.isCreationPage) {
                    this.takenAvatars = players.map((player) => player.avatar);
                }
            }),

            this.socketReceiver.onPlayerDisconnected().subscribe((data) => {
                if (!this.isCreationPage) {
                    this.takenAvatars = this.takenAvatars.filter((avatar) => data.map((player) => player.avatar).includes(avatar));
                }
            }),

            this.socketReceiver.onRoomLocked().subscribe(() => {
                this.isRoomLocked = true;
            }),

            this.socketReceiver.onRoomUnLocked().subscribe(() => {
                this.isRoomLocked = false;
            }),
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    navigatePortrait(direction: 'prev' | 'next') {
        if (direction === 'prev') {
            this.currentPortraitIndex = (this.currentPortraitIndex - 1 + this.totalPortraits) % this.totalPortraits;
        } else if (direction === 'next') {
            this.currentPortraitIndex = (this.currentPortraitIndex + 1) % this.totalPortraits;
        }
        this.playerStats.avatar = this.currentPortraitImage;
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
        this.subscriptions.forEach((sub) => sub.unsubscribe());
        this.closePopup.emit();
    }

    canJoin(): boolean {
        const selectedStats = [this.lifeSelected, this.speedSelected, this.attackSelected, this.defenseSelected];
        return this.playerStats.name.trim().length > 0 && selectedStats.filter((stat) => stat).length === 2;
    }

    shareCharacter(): void {
        this.socketEmitter.shareCharacter(this.playerStats);
    }

    createGame(): void {
        this.gameMapService
            .getGameMap()
            .pipe(first())
            .subscribe((map) => {
                const selectedMap = map.board;
                this.socketEmitter.createRoom(selectedMap);
                this.socketReceiver.onRoomCreated().subscribe((data) => {
                    this.accessCode = data.accessCode;
                    this.socketEmitter.shareCharacter(this.playerStats);
                    this.playerService.setAdmin(true);
                    this.router.navigate(['/lobby'], { state: { accessCode: data.accessCode } });
                });
            });
    }
}
