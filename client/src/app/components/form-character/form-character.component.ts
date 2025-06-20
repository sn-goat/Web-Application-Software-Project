import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SubLifecycleHandlerComponent } from '@app/components/common/sub-lifecycle-handler/subscription-lifecycle-handler.component';
import { diceToImageLink, MAX_PORTRAITS } from '@app/constants/player-constants';
import { GameMapService } from '@app/services/game-map/game-map.service';
import { PlayerService } from '@app/services/player/player.service';
import { RoomService } from '@app/services/room/room.service';
import { SocketEmitterService } from '@app/services/socket/socket-emitter.service';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';
import { ASSET_EXT_ANIMATED, ASSET_EXT_STATIC, ASSET_PATH_ANIMATED, ASSET_PATH_STATIC } from '@common/game';
import { DEFAULT_ATTACK_VALUE, DEFAULT_DEFENSE_VALUE, DEFAULT_DICE, DEFAULT_LIFE_VALUE, DEFAULT_SPEED_VALUE, PlayerInput } from '@common/player';
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
export class FormCharacterComponent extends SubLifecycleHandlerComponent implements OnInit {
    @Output() closePopup: EventEmitter<void> = new EventEmitter<void>();
    @Input() isCreationPage: boolean = false;
    @Input() accessCode: string = '';
    diceToImageLink = diceToImageLink;

    playerInput: PlayerInput;
    lifeSelected: boolean = false;
    speedSelected: boolean = false;
    attackSelected: boolean = false;
    defenseSelected: boolean = false;
    isRoomLocked: boolean = false;

    private takenAvatars: string[] = [];
    private totalPortraits = MAX_PORTRAITS;
    private currentPortraitIndex = 0;
    private subscriptions: Subscription[] = [];
    private readonly gameMapService = inject(GameMapService);
    private readonly roomService = inject(RoomService);
    private readonly playerService = inject(PlayerService);
    private readonly socketEmitter = inject(SocketEmitterService);
    private readonly socketReceiver = inject(SocketReceiverService);
    private readonly router = inject(Router);

    get isCurrentAvatarTaken(): boolean {
        return this.takenAvatars.includes(this.currentPortraitStaticImage);
    }

    get currentPortraitImage(): string {
        return ASSET_PATH_ANIMATED + (this.currentPortraitIndex + 1) + ASSET_EXT_ANIMATED;
    }

    get currentPortraitStaticImage(): string {
        return ASSET_PATH_STATIC + (this.currentPortraitIndex + 1) + ASSET_EXT_STATIC;
    }

    ngOnInit() {
        this.playerInput = {
            name: '',
            avatar: this.currentPortraitStaticImage,
            life: DEFAULT_LIFE_VALUE,
            speed: DEFAULT_SPEED_VALUE,
            attackPower: DEFAULT_ATTACK_VALUE,
            defensePower: DEFAULT_DEFENSE_VALUE,
            attackDice: DEFAULT_DICE,
            defenseDice: DEFAULT_DICE,
        };
        this.autoSubscribe(this.roomService.connected, (connectedPlayers) => {
            if (!this.isCreationPage) {
                this.takenAvatars = connectedPlayers.map((player) => player.avatar);
            }
        });

        this.autoSubscribe(this.roomService.isRoomLocked, (isLocked) => {
            this.isRoomLocked = isLocked;
        });

        this.autoSubscribe(this.socketReceiver.onRoomCreated(), (room) => {
            this.socketEmitter.shareCharacter(this.playerInput);
            this.playerService.setAdmin(true);
            this.router.navigate(['/lobby'], { state: { accessCode: room.accessCode } });
        });

        this.autoSubscribe(this.socketReceiver.onAvatarError(), (data: string[]) => {
            this.takenAvatars = data;
        });

        this.autoSubscribe(this.socketReceiver.onJoinSuccess(), (room) => {
            this.router.navigate(['/lobby'], { state: { accessCode: room.accessCode } });
        });
    }

    navigatePortrait(direction: 'prev' | 'next') {
        if (direction === 'prev') {
            this.currentPortraitIndex = (this.currentPortraitIndex - 1 + this.totalPortraits) % this.totalPortraits;
        } else if (direction === 'next') {
            this.currentPortraitIndex = (this.currentPortraitIndex + 1) % this.totalPortraits;
        }
        this.playerInput.avatar = this.currentPortraitStaticImage;
    }

    selectStat(stat: StatBonus) {
        const otherStat = stat === 'life' ? 'speed' : 'life';
        const selectedStat = (stat + 'Selected') as 'lifeSelected' | 'speedSelected';
        const otherSelectedStat = (otherStat + 'Selected') as 'lifeSelected' | 'speedSelected';

        if (this[otherSelectedStat]) {
            this[otherSelectedStat] = false;
            this.playerInput[otherStat] = 4;
        }
        this[selectedStat] = !this[selectedStat];
        if (this[selectedStat]) {
            this.playerInput[stat] += 2;
        } else {
            this.playerInput[stat] -= 2;
        }
    }

    selectCombatStat(stat: DiceBonus) {
        const otherStat = stat === 'attack' ? 'defense' : 'attack';
        const selectedStat = (stat + 'Selected') as 'attackSelected' | 'defenseSelected';
        const otherSelectedStat = (otherStat + 'Selected') as 'attackSelected' | 'defenseSelected';

        if (this[selectedStat]) {
            this[selectedStat] = false;
            this.playerInput[`${stat}Dice`] = 'D4';
            this.playerInput[`${otherStat}Dice`] = 'D4';
        } else {
            this[selectedStat] = true;
            this.playerInput[`${stat}Dice`] = 'D6';

            if (this[otherSelectedStat]) {
                this[otherSelectedStat] = false;
            }
            this.playerInput[`${otherStat}Dice`] = 'D4';
        }
    }

    onClose(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
        this.closePopup.emit();
    }

    canJoin(): boolean {
        const selectedStats = [this.lifeSelected, this.speedSelected, this.attackSelected, this.defenseSelected];
        return this.playerInput.name.trim().length > 0 && selectedStats.filter((stat) => stat).length === 2;
    }

    shareCharacter(): void {
        this.socketEmitter.shareCharacter(this.playerInput);
    }

    createGame(): void {
        this.gameMapService
            .getGameMap()
            .pipe(first())
            .subscribe((map) => {
                const selectedMap = map.name;
                this.socketEmitter.createRoom(selectedMap);
            });
    }
}
