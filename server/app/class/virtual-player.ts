import { Avatar } from '@common/game';
import { Player } from './player';
import {
    VirtualPlayerStyles,
    VIRTUAL_PLAYER_NAMES,
    PlayerInput,
    DEFAULT_DEFENSE_VALUE,
    DEFAULT_ATTACK_VALUE,
    DEFAULT_SPEED_VALUE,
    DEFAULT_LIFE_VALUE,
} from '@common/player';

export class VirtualPlayer extends Player {
    private static readonly bonusThreshold = 0.5;
    virtualStyle: VirtualPlayerStyles;

    constructor(playingPlayers: Player[], virtualStyle: VirtualPlayerStyles) {
        const playerInput: PlayerInput = VirtualPlayer.getRandomInput(playingPlayers);
        super(playerInput.name, playerInput);
        this.virtualStyle = virtualStyle;
    }

    private static getRandomInput(playingPlayers: Player[]): PlayerInput {
        const randomName = this.getRandomName(playingPlayers);
        const randomAvatar = this.getRandomAvatar(playingPlayers);
        const randomAttackPower = DEFAULT_ATTACK_VALUE;
        const randomDefensePower = DEFAULT_DEFENSE_VALUE;
        const randomSpeed = Math.random() < this.bonusThreshold ? DEFAULT_SPEED_VALUE : DEFAULT_SPEED_VALUE + 2;
        const randomLife = randomSpeed > DEFAULT_SPEED_VALUE ? DEFAULT_LIFE_VALUE : DEFAULT_LIFE_VALUE + 2;
        const randomAttackDice = Math.random() < this.bonusThreshold ? 'D4' : 'D6';
        const randomDefenseDice = randomAttackDice === 'D4' ? 'D6' : 'D4';

        return {
            name: randomName,
            avatar: randomAvatar,
            life: randomLife,
            speed: randomSpeed,
            attackPower: randomAttackPower,
            defensePower: randomDefensePower,
            attackDice: randomAttackDice,
            defenseDice: randomDefenseDice,
        };
    }

    private static getRandomAvatar(playingPlayers: Player[]): Avatar {
        const avatars = Object.values(Avatar).filter((avatar) => {
            return avatar !== Avatar.Default && !playingPlayers.some((player) => player.avatar === avatar);
        });
        const randomIndex = Math.floor(Math.random() * avatars.length);
        return avatars[randomIndex];
    }

    private static getRandomName(playingPlayers: Player[]): string {
        const names = Object.values(VIRTUAL_PLAYER_NAMES).filter((name) => {
            return !playingPlayers.some((player) => player.name === name);
        });
        const randomIndex = Math.floor(Math.random() * names.length);
        return names[randomIndex];
    }
}
